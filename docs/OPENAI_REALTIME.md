# OpenAI Realtime Voice Provider

This document captures the current OpenAI Realtime voice-agent integration and
the browser translation runtime in this repository. It consolidates the durable
implementation notes from the initial OpenAI provider research and the Phase 02
through completed Phase 04 translation work.

## Scope

The OpenAI provider is a voice-agent conversation tab. OpenAI live translation
uses a separate protocol surface. Phase 02 completed the translation
client-secret route, shared frontend config, feature-flagged provider tab, and
focused backend/config tests. Phase 03 completed browser media capture,
WebRTC runtime, transcript rendering, audio mix controls, and export behavior.

| Capability            | Current OpenAI voice provider  | Translation foundation              |
| --------------------- | ------------------------------ | ----------------------------------- |
| Backend token route   | `/api/openai/session`          | `/api/openai/translation-session`   |
| Endpoint family       | `/v1/realtime`                 | `/v1/realtime/translations`         |
| Frontend transport    | WebSocket                      | WebRTC                              |
| Default model in repo | `gpt-realtime`                 | `gpt-realtime-translate`            |
| Main React state      | `OpenAIVoiceContext`           | `OpenAITranslationProvider` + hooks |
| Event pattern         | Assistant turns and tool calls | `oai-events` translation events     |

Keep these implementations separate. Translation should not be built by adding
translation behavior to the current voice-agent context.

## Official Realtime Translation Re-check - 2026-05-12

Current official OpenAI documentation confirms these translation assumptions:

- Live translation uses `gpt-realtime-translate` for speech-to-speech
  translation, not a standard voice-agent assistant model.
- Translation sessions connect to the dedicated
  `/v1/realtime/translations` endpoint family.
- Browser apps should mint short-lived credentials on the server through
  `POST /v1/realtime/translations/client_secrets`; the browser must not receive
  the standard server API key.
- Browser WebRTC calls post SDP offers to
  `POST /v1/realtime/translations` and receive an SDP answer for the peer
  connection.
- Browser SDP exchange should use the completed local description after ICE
  gathering, and the SDP body should end with a CRLF. Sending Chrome's initial
  trickle-only offer or an SDP string without a final newline can surface
  upstream `invalid_offer` parse errors.
- Translation sessions stream continuously from source audio and do not use
  `response.create`.
- Current documented translation events include `session.output_audio.delta`,
  `session.output_transcript.delta`, and `session.input_transcript.delta`.
  The repo may keep older event aliases for compatibility, but new protocol
  work should prefer the current documented names.
- Official docs recommend an `OpenAI-Safety-Identifier` only when the app has a
  stable non-PII identifier, for example a hashed user ID. This project does
  not currently have accounts or a stable non-PII app identifier, so that
  header remains deferred rather than derived from IP address, user agent,
  cookies, authorization headers, or provider payloads.

Sources checked:

- https://developers.openai.com/api/docs/guides/realtime-translation
- https://developers.openai.com/api/docs/models/gpt-realtime-translate
- https://developers.openai.com/api/docs/guides/realtime-webrtc
- https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets

## Runtime Flow

1. The user clicks the OpenAI voice control.
2. `OpenAIVoiceContext` calls `POST /api/openai/session`.
3. `server/routes/openai.js` calls OpenAI's
   `POST /v1/realtime/client_secrets` endpoint using `OPENAI_API_KEY`.
4. The backend returns only the short-lived client token and expiration time.
5. The browser opens
   `wss://api.openai.com/v1/realtime?model=${VITE_OPENAI_MODEL || "gpt-realtime"}`
   with the ephemeral token in the WebSocket protocol list.
6. After `session.created`, the client sends `session.update` with audio,
   voice, instructions, tools, and VAD settings.
7. After `session.updated`, the UI marks the provider connected and starts
   streaming microphone audio.

The backend route intentionally keeps the main OpenAI API key server-side. The
route also accepts both currently observed client-secret response shapes:
`{ value, expires_at }` and `{ client_secret: { value, expires_at } }`.

## Translation Client Secret Boundary

`POST /api/openai/translation-session` creates short-lived browser credentials
for WebRTC translation sessions. The route validates the requested
target output language before key lookup and before any OpenAI request.

Request:

```json
{
  "targetLanguage": "es"
}
```

Supported target output languages:

```text
es, pt, fr, ja, ru, zh, de, ko, hi, id, vi, it, en
```

Backend behavior:

1. Validate that the request body contains only `targetLanguage`.
2. Normalize supported two-letter language codes to lowercase.
3. Use server-side `OPENAI_API_KEY` to call
   `POST /v1/realtime/translations/client_secrets`.
4. Send a translation session payload with
   `model: "gpt-realtime-translate"` and
   `audio.output.language: "<targetLanguage>"`.
5. Return only normalized browser-safe fields.

Response:

```json
{
  "clientSecret": "ek_...",
  "expiresAt": "2026-05-11T15:31:00.000Z",
  "targetLanguage": "es",
  "model": "gpt-realtime-translate"
}
```

The route does not return raw OpenAI response bodies, authorization headers,
the server API key, or secret-bearing debug fields. It is included in the
strict token rate limiter and duplicate in-flight guard through
`TOKEN_ENDPOINT_PATHS`.

## Translation Runtime Flow

1. The user opens the OpenAI Translation tab and selects microphone or
   browser-tab audio.
2. The browser requests a short-lived client secret from
   `POST /api/openai/translation-session`.
3. The client creates a WebRTC offer, waits for ICE gathering, and posts the
   completed SDP to `https://api.openai.com/v1/realtime/translations`.
4. Translated audio is rendered through a browser audio element while
   transcript deltas flow over the `oai-events` data channel.
5. Stopping the session tears down peer connections, source tracks, audio
   elements, timers, and transcript state.

## Shared Translation Config

`src/lib/openaiTranslation.ts` is the frontend-safe shared config surface for
OpenAI translation UI and hook work. It is a pure TypeScript module with
no React imports, DOM access, browser media ownership, WebRTC state, data
channels, localStorage, or network calls.

Primary exports:

| Export family                                  | Purpose                                                     |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `OPENAI_TRANSLATION_MODEL`                     | Default model, `gpt-realtime-translate`                     |
| `OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL` | Optional source transcript model, `gpt-realtime-whisper`    |
| `OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE`     | Local route, `/api/openai/translation-session`              |
| `OPENAI_TRANSLATION_ENDPOINTS`                 | OpenAI translation endpoint metadata for WebRTC runtime     |
| `OPENAI_TRANSLATION_TARGET_LANGUAGES`          | Ordered 13-language list with ASCII English labels          |
| `validateTranslationTargetLanguage`            | Explicit validation result for user-provided language input |
| `normalizeTranslationTargetLanguage`           | Trim/lowercase helper that returns a supported code or null |
| `buildTranslationAudioMixState`                | Clamped original/translated percent and volume state        |
| `buildTranslationSessionConfig`                | Session config with `audio.output.language`                 |
| `buildTranslationSessionUpdate`                | `session.update` payload without prompt/tool/voice fields   |
| `buildTranslationSessionRequestDescriptor`     | Typed descriptor for the local backend token request        |

The type contracts live in `src/types/openai-translation.ts` and are exported
through `src/types/index.ts`. These contracts describe the local route request
and response, translation session update payloads, language metadata, and audio
mix state.

The shared config consumes the Session 01 backend contract by building request
bodies shaped as:

```json
{
  "targetLanguage": "es"
}
```

It also builds translation session payloads shaped around:

```json
{
  "audio": {
    "output": {
      "language": "es"
    }
  }
}
```

Optional source transcription adds
`audio.input.transcription.model: "gpt-realtime-whisper"`. Optional noise
reduction adds `audio.input.noise_reduction.type`. Both are opt-in. The shared
module does not expose or reference `OPENAI_API_KEY`; the backend remains the
only owner of OpenAI API credentials.

Completed work:

- `POST /api/openai/translation-session` validates target languages, calls the
  OpenAI translation client-secret endpoint, and returns sanitized fields.
- `src/lib/openaiTranslation.ts` owns the frontend-safe language list, session
  payload builders, route request descriptor, audio mix helpers, max-session
  helpers, and transcript export helpers.
- `src/hooks/useOpenAITranslation.ts` owns the WebRTC runtime, translated audio
  playback, transcript parsing, and cleanup.
- `src/hooks/useOpenAITranslationSource.ts` owns microphone and browser-tab
  source capture.
- `OpenAITranslationProvider` renders the feature-flagged browser translation
  tab when `VITE_OPENAI_TRANSLATION_ENABLED=true`.
- Focused tests cover route validation, response sanitization, language list
  drift, audio mix clamping, token limiter coverage, source capture, runtime
  cleanup, diagnostics, export behavior, browser smoke flows, and
  demo-readiness regressions.

Phase 04 hardening status is complete:

- Lifecycle cleanup, duplicate-trigger prevention, source-ended handling, and
  provider-switch teardown are implemented.
- Browser, token, SDP, WebRTC, media, and offline diagnostics are implemented.
- Unit, integration, and focused Chromium Playwright coverage are in place for
  the translation runtime and demo-readiness paths.
- Operational demo guidance lives in the
  [OpenAI Translation Demo Guide](./OPENAI_TRANSLATION_DEMO.md).

Phase 05 is the next planned expansion. See the spec PRD for the current
roadmap and session scope before starting a new phase.

## Configuration

Required server-side variable:

```bash
OPENAI_API_KEY=sk-...
```

Common frontend variables:

```bash
VITE_OPENAI_ENABLED=true
VITE_OPENAI_MODEL=gpt-realtime
VITE_OPENAI_TRANSLATION_ENABLED=false
VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
VITE_API_BASE_URL=http://localhost:3001
```

For OpenAI Translation setup, local/demo run steps, browser-tab audio limits,
and usage guardrails, see the
[OpenAI Translation Demo Guide](./OPENAI_TRANSLATION_DEMO.md).

Voice selection is managed by `src/lib/voiceConfig.ts` and persisted in
`localStorage`. The current OpenAI voice IDs are `alloy`, `ash`, `ballad`,
`coral`, `echo`, `sage`, `shimmer`, and `verse`.

## Audio Pipeline

The OpenAI voice provider intentionally reuses the same audio utilities as the
xAI provider because both paths use 24 kHz, mono, PCM16 audio encoded as
base64 over WebSocket.

Input:

```text
Microphone, typically 48 kHz float32
-> AudioWorklet downsampled to 24 kHz
-> Int16Array PCM16
-> little-endian bytes
-> base64
-> input_audio_buffer.append
```

Output:

```text
response.output_audio.delta
-> base64 decode
-> PCM16 bytes
-> Float32Array
-> AudioBuffer
-> queued playback through GainNode and AnalyserNode
```

Relevant files:

| File                                  | Role                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `src/contexts/OpenAIVoiceContext.tsx` | Token fetch, WebSocket lifecycle, session config, event handling, cleanup |
| `server/routes/openai.js`             | Ephemeral client-secret route and health check                            |
| `src/lib/audio/audioUtils.ts`         | PCM/base64 helpers and inline PCM AudioWorklet factory                    |
| `src/lib/voiceConfig.ts`              | OpenAI voice list and localStorage persistence                            |
| `src/lib/tools/toolDefinitions.ts`    | Tool schema sent in `session.update`                                      |

The helper names still reference xAI (`XAI_SAMPLE_RATE`,
`decodeAudioFromXAI`) even though OpenAI reuses them. A future refactor can
rename those helpers to provider-neutral names, but behavior should remain the
same.

## Session Configuration

`OpenAIVoiceContext` sends a GA-style nested audio config after
`session.created`:

```json
{
  "type": "session.update",
  "session": {
    "type": "realtime",
    "output_modalities": ["audio"],
    "instructions": "<current system prompt>",
    "audio": {
      "input": {
        "format": {
          "type": "audio/pcm",
          "rate": 24000
        },
        "transcription": {
          "model": "whisper-1"
        },
        "turn_detection": {
          "type": "server_vad",
          "threshold": 0.5,
          "prefix_padding_ms": 300,
          "silence_duration_ms": 500
        }
      },
      "output": {
        "format": {
          "type": "audio/pcm",
          "rate": 24000
        },
        "voice": "<selected voice>"
      }
    },
    "tools": [],
    "tool_choice": "auto"
  }
}
```

The actual `tools` value comes from `getOpenAITools()`.

## Event Handling

The context currently handles these OpenAI events:

| Event                                                   | Current behavior                                         |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `session.created`                                       | Sends `session.update`                                   |
| `session.updated`                                       | Marks connection ready and listening                     |
| `input_audio_buffer.speech_started`                     | Marks user/listening activity                            |
| `input_audio_buffer.speech_stopped`                     | Logs end of detected speech                              |
| `conversation.item.input_audio_transcription.completed` | Adds a user transcript message                           |
| `response.created`                                      | Adds an assistant placeholder message                    |
| `response.output_audio_transcript.delta`                | Appends assistant transcript text                        |
| `response.output_audio.delta`                           | Decodes and queues audio playback                        |
| `response.output_audio.done`                            | Logs audio completion                                    |
| `response.function_call_arguments.done`                 | Executes the requested backend function and sends output |
| `response.done`                                         | Logs response completion                                 |
| `error`                                                 | Tracks and displays the OpenAI error message             |

Older research docs used beta-style event names such as
`response.audio.delta`. The current code uses the `response.output_audio.*`
events. Check the active OpenAI API docs before changing event names.

## Troubleshooting

Use this order for OpenAI voice failures:

1. Confirm the backend is running and `GET /api/openai/health` reports
   `configured: true`.
2. Confirm `OPENAI_API_KEY` is set only in the server environment.
3. Confirm `VITE_OPENAI_ENABLED=true` was present when the frontend bundle was
   built.
4. Confirm `VITE_API_BASE_URL` points at the backend in local mode. In demo
   mode, same-origin relative API paths are expected.
5. Check the browser console for `[OpenAIVoiceContext:*]` logs in development.
6. If token creation fails, inspect the backend logs from
   `server/routes/openai.js`. The route maps OpenAI `401`, `403`, `429`, and
   `5xx` responses to user-facing messages.
7. If the WebSocket opens but no audio is sent, confirm microphone permission,
   HTTPS or localhost, and `AudioWorklet` support.
8. If audio plays but transcripts do not update, verify the session config still
   includes `audio.input.transcription`.

## Design Notes

- OpenAI's current docs recommend WebRTC for browser voice applications, but
  this repo uses WebSocket for the voice-agent provider to match the xAI
  provider and share its manual PCM pipeline.
- G.711 audio is not implemented. Keep PCM16 as the default unless a future
  telephony feature specifically needs G.711 encoding and decoding.
- Function calls are routed through `POST /api/functions/execute`; after the
  backend returns, the client sends `conversation.item.create` with
  `function_call_output` and then `response.create`.
- Manual disconnect must close the WebSocket, stop media tracks, disconnect the
  worklet, close the `AudioContext`, clear the audio queue, and cancel pending
  reconnect attempts.

## References

- [OpenAI Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations)
- [OpenAI Realtime translation](https://developers.openai.com/api/docs/guides/realtime-translation)
- [OpenAI GPT Realtime Translate model](https://developers.openai.com/api/docs/models/gpt-realtime-translate)
- [OpenAI Realtime client events](https://developers.openai.com/api/reference/resources/realtime)
- [OpenAI Realtime client secrets](https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets)
- [OpenAI Realtime WebRTC guide](https://developers.openai.com/api/docs/guides/realtime-webrtc)
