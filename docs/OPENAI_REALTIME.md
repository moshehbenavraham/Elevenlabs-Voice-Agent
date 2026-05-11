# OpenAI Realtime Voice Provider

This document captures the current OpenAI Realtime voice-agent integration in
this repository. It consolidates the durable implementation notes from the
initial OpenAI provider research.

## Scope

The OpenAI provider is a voice-agent conversation tab. It is not the planned
OpenAI live translation tab.

| Capability            | Current OpenAI voice provider  | Planned translation feature             |
| --------------------- | ------------------------------ | --------------------------------------- |
| Endpoint family       | `/v1/realtime`                 | `/v1/realtime/translations`             |
| Frontend transport    | WebSocket                      | WebRTC                                  |
| Default model in repo | `gpt-realtime`                 | `gpt-realtime-translate`                |
| Main React state      | `OpenAIVoiceContext`           | Future translation hook/context         |
| Event pattern         | Assistant turns and tool calls | Translation audio and transcript deltas |

Keep these implementations separate. Translation should not be built by adding
translation behavior to the current voice-agent context.

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

## Configuration

Required server-side variable:

```bash
OPENAI_API_KEY=sk-...
```

Common frontend variables:

```bash
VITE_OPENAI_ENABLED=true
VITE_OPENAI_MODEL=gpt-realtime
VITE_API_BASE_URL=http://localhost:3001
```

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
- [OpenAI Realtime client events](https://developers.openai.com/api/reference/resources/realtime)
- [OpenAI Realtime client secrets](https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets)
- [OpenAI Realtime WebRTC guide](https://developers.openai.com/api/docs/guides/realtime-webrtc)
