# Raw-Audio Bridge Spike

## Status and Recommendation

Status: decision spike, no runtime implementation.

Recommendation: proceed with a future backend raw-audio bridge prototype only for
media paths that already deliver server-side raw audio, such as telephony,
broadcast ingest, SIP media, or media workers. Keep the shipped browser
translation tab on WebRTC and do not route browser media through a backend
WebSocket bridge by default.

The future bridge should be treated as an isolated backend sidecar with source
adapters, audio normalization, an OpenAI Realtime Translation WebSocket session,
output adapters, observability, and one guarded cleanup controller. This session
does not add a production route, webhook, SIP handler, Twilio dependency, media
worker, queue, or UI path.

## Sources Checked

Checked on 2026-05-12.

Official OpenAI sources:

- OpenAI Realtime Translation guide:
  https://developers.openai.com/api/docs/guides/realtime-translation
- OpenAI live translation cookbook:
  https://developers.openai.com/cookbook/examples/voice_solutions/realtime_translation_guide
- `gpt-realtime-translate` model page:
  https://developers.openai.com/api/docs/models/gpt-realtime-translate

Current OpenAI constraints recorded from those sources:

- Translation uses the dedicated `/v1/realtime/translations` endpoint, not the
  standard `/v1/realtime` voice-agent session endpoint.
- Browser media should use WebRTC when the browser captures or plays audio.
- Server media pipelines should use WebSockets when the backend already
  receives raw audio.
- WebSocket sessions select `gpt-realtime-translate` in the connection URL.
- The bridge sends `session.update` after socket open to set
  `session.audio.output.language`.
- Source audio is appended as base64 little-endian PCM16 at 24 kHz with
  `session.input_audio_buffer.append`.
- Audio should be streamed continuously, including silence between phrases.
- Translation sessions are not turn-based; do not send `response.create`, tools,
  assistant turns, or normal conversation state.
- Translated audio arrives through `session.output_audio.delta`.
- Target transcript deltas arrive through `session.output_transcript.delta`.
- Source transcript deltas can arrive through `session.input_transcript.delta`
  when input transcription is configured.
- The model is audio input and audio plus text output, supports streaming, does
  not support function calling or structured outputs, and is priced by realtime
  audio duration rather than text tokens.
- Current public rate-limit material is account-tier based audio minutes per
  minute. This app's existing process-local limits are not a global multi-node
  control plane.

## Local References Reviewed

Repository references reviewed as patterns only:

- `server/routes/openai.js` - existing server-held API key boundary and
  sanitized browser client-secret route for translation.
- `src/hooks/useOpenAITranslation.ts` - current browser WebRTC lifecycle,
  duplicate-start prevention, cleanup model, and transcript event handling.
- `src/lib/openaiTranslation.ts` - shared translation endpoints, target
  language list, route error categories, max-session config, transcript export,
  and sensitive error redaction patterns.
- `EXAMPLE/mtg-realtime-translator/app.py` - desktop raw-audio spike pattern for
  24 kHz PCM16 chunks, local VAD, pre-roll, silence-tail, output playback, and a
  single stream cleanup function.
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/audio.js`
  - u-law 8 kHz to PCM16 24 kHz conversion and reverse conversion.
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/realtime-translation.js`
  - WebSocket bridge shape, session update, append event, translated audio
    handling, and transcript event categories.
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/room.js`
  - one translation bridge per source-to-listener direction and pair cleanup.
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/security.js`
  - Twilio signature, allow-list, and active-caller control examples.

Reference usage constraints:

- Do not copy Twilio routes, TwiML, LiveKit code, desktop UI code, Python audio
  dependencies, or sample assets into the app.
- Treat the examples as design evidence for a later implementation session.
- Keep this spike independent of the default Express route registration and
  provider tab rendering.

## Scope and Non-Goals

In scope:

- Decide whether a backend raw-audio bridge is worth prototyping.
- Record protocol assumptions that a future implementer must revalidate.
- Compare the shipped browser WebRTC path with a backend WebSocket media path.
- Define raw-audio input, output, buffering, lifecycle, cleanup, security,
  observability, and error handling constraints.
- Add offline validation so the decision note cannot drift into claiming shipped
  runtime support.

Out of scope:

- No default raw-audio UI path is shipped.
- No new `/api/openai/raw-audio`, SIP, Twilio, LiveKit, webhook, WebSocket, or
  media-worker route is registered.
- No replacement for `useOpenAITranslation` is introduced.
- No persistent audio, transcript, provider payload, or evaluation result store
  is added.
- No live OpenAI API call or automated provider test is required.

## Decision Document Contract

Future work can use this note as a contract only if these statements remain
true:

- Browser capture and playback stay on WebRTC.
- Backend raw-audio ingestion is optional future architecture.
- Server-held OpenAI API keys never move into browser-visible state.
- Raw media and transcripts remain transient unless a future PRD explicitly
  revisits storage, consent, retention, and deletion requirements.
- Protocol details must be rechecked against official OpenAI docs before any
  production implementation.

## Existing Browser WebRTC Baseline

The shipped OpenAI Translation path is browser-first:

- The backend endpoint `POST /api/openai/translation-session` validates
  `targetLanguage`, applies the server-held OpenAI API key, optionally sends
  `OpenAI-Safety-Identifier`, and returns a sanitized short-lived client secret.
- The browser captures either microphone or browser-tab audio through
  `useOpenAITranslationSource`.
- `useOpenAITranslation` creates an `RTCPeerConnection`, adds source audio
  tracks, opens the `oai-events` data channel, exchanges SDP with
  `/v1/realtime/translations`, receives translated audio as a remote
  WebRTC track, and parses source and target transcript deltas.
- The browser path already prevents duplicate start and stop actions, aborts
  in-flight requests, clears event handlers, removes source senders, closes peer
  connections, stops owned tracks, clears remote audio, and resets transcripts
  on re-entry.
- UI controls already cover source selection, target language, status,
  diagnostics, captions, transcript export, audio mix, and max-session guard
  behavior.

The raw-audio bridge must not weaken this baseline. Browser media should not be
converted to backend PCM only to reach the same translation model. That would
move user media through the server, increase privacy exposure, add buffering and
playback work, and duplicate WebRTC behavior that the current browser path
already handles.

Raw-audio non-goals for this project state:

- Do not add a backend bridge for normal microphone or browser-tab translation.
- Do not merge server WebSocket bridge state into `useOpenAITranslation`.
- Do not expose standard OpenAI API keys, raw provider payloads, SDP, or bridge
  socket metadata to browser-visible state.
- Do not claim SIP, Twilio, room fanout, broadcast ingest, or server-side raw
  audio support is shipped.

## Future Backend WebSocket Session Contract

A future backend bridge should only exist when the app already receives
server-side media. The minimal shape is:

```text
source adapter -> audio normalizer -> OpenAI translation session -> output adapter
                         |                         |
                         v                         v
                  observability boundary     cleanup controller
```

Session contract:

- Open a backend WebSocket to
  `wss://api.openai.com/v1/realtime/translations?model=gpt-realtime-translate`.
- Use the server-held `OPENAI_API_KEY` only on the backend.
- Add `OpenAI-Safety-Identifier` using the same hashed, stable, non-secret
  safety identifier strategy as the browser client-secret route when available.
- On socket open, send `session.update` with
  `session.audio.output.language` set to a validated target language code.
- Configure input transcription with `gpt-realtime-whisper` only if source
  transcript deltas are required by the adapter or operator view.
- Do not send prompts, voice selection, tools, `response.create`, assistant
  turns, or normal Realtime conversation messages.
- Send source audio with `session.input_audio_buffer.append` as base64
  little-endian PCM16 at 24 kHz.
- Treat `session.output_audio.delta`, `session.output_transcript.delta`, and
  `session.input_transcript.delta` as the primary outputs.
- For conversational translation, create one session per source-speaker track
  and target language direction. Avoid mixed-speaker input when speaker labels,
  captions, or overlapping speech matter.

The bridge must be packaged as an optional sidecar module. A future session can
choose an implementation path such as `server/translation/rawAudioBridge.js`,
but it should not import that module from `server/index.js` or register routes
until the PRD explicitly authorizes a runtime surface.

## Input Audio Constraints

Accepted bridge input to OpenAI:

- Encoding: little-endian PCM16.
- Sample rate: 24 kHz.
- Channels: mono unless OpenAI documents a different contract.
- Transport payload: base64 string in `session.input_audio_buffer.append`.
- Stream behavior: continuous appends, including silence between phrases.

Chunking guidance for a prototype:

- Start with 20 ms to 40 ms normalized PCM chunks for low-latency streaming.
- Keep a small adapter queue with a hard byte or duration cap. A future
  prototype should start around 250 ms to 500 ms of queued source audio and tune
  with measured latency.
- If the queue exceeds the cap, prefer a visible degraded state and controlled
  close over unbounded memory growth.
- Never batch so much source audio that translated output can no longer track
  the speaker in realtime.

Telephony and non-browser media:

- Twilio Media Streams deliver base64 u-law at 8 kHz, so a Twilio adapter must
  decode u-law, convert to PCM16, resample to 24 kHz, and then append to the
  translation session.
- SIP, RTP, and broadcast sources need explicit codec detection before
  normalization. The bridge should reject unknown or unsupported codecs with a
  stable error category.
- A media worker source may already have PCM data, but it still must validate
  sample rate, channel count, byte alignment, and clock drift.

VAD and silence:

- Official guidance says to keep appending audio continuously, including silence
  between phrases.
- Local VAD can still be useful before a future bridge for metering, pre-roll,
  silence-tail, and operator diagnostics, but it must not remove all silence
  from the OpenAI stream.
- If a source adapter suppresses silence to save bandwidth, it must append a
  short digital-silence tail after speech so the translation session can observe
  phrase boundaries.
- Manual `input_audio_buffer.commit` must not be assumed for translation
  sessions unless official docs later document it for this endpoint.

State freshness requirements:

- Reset per-source VAD state, pre-roll buffers, silence-tail counters, queue
  counters, and transcript accumulators on every source connect.
- Revalidate source format on reconnect or adapter handoff.
- Reject stale chunks that belong to a previous session generation.

## Output Audio and Transcript Constraints

Output contract:

- `session.output_audio.delta` contains base64 translated PCM audio that the
  output adapter must decode, buffer, and play or republish.
- Official cookbook guidance states translated audio is emitted as 24 kHz PCM16
  chunks. Telephony adapters must convert it back to the provider codec, such as
  8 kHz u-law for Twilio.
- `session.output_transcript.delta` carries target-language transcript text.
- `session.input_transcript.delta` can carry source-language transcript text
  when input transcription is configured.

Adapter rules:

- Keep output adapters separate from the OpenAI session manager. A Twilio media
  writer, broadcast caption writer, and room republisher should not share
  provider-specific payload code.
- Apply backpressure at the adapter boundary. If the output destination cannot
  keep up, cap the output queue and enter a delayed or degraded state.
- Drop, close, or restart based on source type. A phone bridge may prefer close
  on sustained output lag, while a caption-only broadcast path may drop late
  audio but keep captions visible.
- Keep translated transcript and source transcript buffers bounded by time,
  entry count, or both.
- Emit only sanitized counters and state categories to logs. Do not log raw
  transcript text unless a future PRD adds explicit consent and retention rules.

Failure handling:

- A malformed OpenAI event should be counted and ignored only if the session can
  safely continue. Repeated malformed events should close the bridge.
- A translation socket close should notify the source and output adapters,
  flush bounded buffers, and run cleanup once.
- An output adapter failure should stop source ingestion before more audio is
  appended.
- An input source disconnect should append no further media and should close the
  translation session and output adapter through the shared cleanup controller.

## Browser WebRTC Versus Backend Raw-Audio Bridge

| Dimension         | Browser WebRTC translation                                               | Backend raw-audio bridge                                                                             |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Best fit          | Microphone, browser tab, or browser-held room tracks                     | Telephony, SIP, broadcast ingest, backend media workers                                              |
| Transport         | WebRTC SDP exchange through `/v1/realtime/translations`                  | Backend WebSocket to `/v1/realtime/translations?model=gpt-realtime-translate`                        |
| Audio input       | Browser `MediaStreamTrack`                                               | Base64 24 kHz little-endian PCM16 append events                                                      |
| Audio output      | Remote WebRTC audio track                                                | Base64 PCM deltas decoded by an output adapter                                                       |
| Transcript path   | `oai-events` data channel                                                | WebSocket event stream                                                                               |
| API key custody   | Standard API key stays on server; browser gets short-lived client secret | Standard API key stays on server for the full bridge session                                         |
| Latency controls  | Browser peer connection, network, media track behavior                   | Chunk duration, normalization queue, adapter queue, output backpressure                              |
| Security exposure | Browser sends selected media directly to OpenAI via short-lived secret   | Server processes raw media and therefore expands privacy and logging risk                            |
| Cost controls     | Existing duration guard and process-local route limits                   | Needs per-source duration caps, concurrent bridge caps, and account-tier awareness                   |
| Operator burden   | Existing browser diagnostics and user-facing controls                    | Needs source adapter state, queue metrics, socket state, output adapter state, and cleanup telemetry |
| Failure mode      | Peer connection, data channel, source capture, playback                  | Source disconnect, codec mismatch, resampler failure, WebSocket error, output lag, cleanup failure   |
| Shipped state     | Implemented browser MVP                                                  | Not shipped; future architecture only                                                                |

The comparison favors WebRTC for this app's default browser product path. The
backend bridge is still worth prototyping because some future media paths cannot
be represented as browser-owned tracks.

## Lifecycle and Cleanup States

A future bridge should use one explicit session generation ID and one idempotent
shutdown path.

Suggested states:

- `idle`: no source, socket, output adapter, timers, or queues are active.
- `source-opening`: source adapter is authenticating or receiving first media.
- `normalizing`: codec and sample-rate checks passed; PCM output is being
  produced.
- `translation-connecting`: OpenAI WebSocket is opening.
- `translation-configuring`: `session.update` has been sent and the bridge is
  waiting for confirmation or first usable output.
- `streaming`: source appends and output deltas are flowing.
- `degraded`: the bridge is still running but queue, timeout, reconnect, or
  output lag thresholds have been crossed.
- `stopping`: cleanup has started and no new source chunks may be accepted.
- `stopped`: all owned resources have been released.
- `failed`: cleanup completed after an unrecoverable failure.

Resources owned by the cleanup controller:

- Source adapter WebSocket, RTP stream, media worker subscription, or file-like
  reader.
- Audio normalizer buffers, resampler state, VAD state, pre-roll, and
  silence-tail counters.
- OpenAI WebSocket and any pending send queue.
- Output adapter stream, media writer, caption writer, or room republisher.
- Bounded input and output queues.
- Timers for connection timeout, idle timeout, max duration, heartbeat, retry
  backoff, and silence-tail.
- Metrics handles and in-memory transcript buffers.

Cleanup rules:

- Cleanup is idempotent and guarded by the session generation ID.
- Stop accepting source chunks before closing output and translation resources.
- Clear timers before closing sockets to avoid late callbacks.
- Remove event handlers before closing sockets where the runtime supports it.
- Flush bounded buffers only when the output adapter explicitly supports a safe
  final drain; otherwise discard and report a sanitized stop reason.
- Release provider resources even if OpenAI socket close or output close throws.
- Return a caller-visible stop reason: `source-ended`, `operator-stop`,
  `max-duration`, `timeout`, `source-error`, `normalization-error`,
  `translation-error`, `output-error`, or `cleanup-error`.

Duplicate action prevention:

- Ignore or reject start while a bridge with the same source ID is
  `source-opening`, `normalizing`, `translation-connecting`,
  `translation-configuring`, `streaming`, `degraded`, or `stopping`.
- Treat repeated stop as success once cleanup is in progress.
- Use a per-source lock or session registry before a route or adapter can create
  a second bridge for the same source.

## Security and Privacy Posture

Trust boundaries:

- Browser to app backend: only request metadata and sanitized status should cross
  this boundary.
- Provider to app backend: raw media, provider call IDs, webhook signatures, and
  source metadata are untrusted.
- App backend to OpenAI: server-held API key and normalized media cross this
  boundary.
- App backend to output provider: translated audio and captions cross this
  boundary.

Required controls for a future bridge:

- Keep `OPENAI_API_KEY` only on the server. Never return it, derived bearer
  tokens, bridge socket URLs with secrets, provider payloads, or raw errors to
  the browser.
- Validate target language against the same supported target-language set used
  by the browser translation route.
- Validate source identity and authorization at the adapter entry point. A
  Twilio adapter must verify signatures when configured, enforce allow-lists
  when configured, and cap active callers.
- Reject unsupported codecs, invalid sample rates, odd byte lengths, malformed
  base64, missing stream IDs, and unknown provider events before appending audio.
- Apply max duration, idle timeout, per-source concurrency limits, and process
  memory caps before opening the OpenAI socket.
- Add account-tier and audio-minutes awareness to operational docs. Existing
  process-local rate limits do not protect a horizontally scaled bridge by
  themselves.
- Log stable categories, durations, byte counts, queue depth buckets, close
  codes, target language, and hashed safety identifiers only.
- Do not log raw audio, raw transcripts, provider request bodies, OpenAI event
  bodies, cookies, authorization headers, API keys, client secrets, SDP, or
  local recording paths.
- Do not persist audio or transcript text. If a future eval workflow needs
  retained media, it must be opt-in, local or consent-backed, retention-limited,
  and excluded from committed artifacts.
- Keep CSP discussion separate unless a future browser surface is added. A pure
  backend sidecar does not remove current provider compatibility allowances from
  the frontend CSP.

GDPR and privacy posture:

- With no storage, the bridge remains transient processing, but raw media still
  counts as personal data when it contains voices or identifying speech.
- A future production bridge needs a data-flow note naming OpenAI and any media
  provider as processors or subprocessors according to the deployment contract.
- Operator diagnostics must support deletion by omission: if raw media and raw
  transcripts are never persisted, there is no committed artifact to delete.

## Errors and Observability

Use stable categories so route, adapter, and UI code can map failures without
exposing sensitive details.

| Category              | Examples                                                    | Caller-visible handling                            |
| --------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| `source`              | Provider disconnect, unauthorized caller, missing stream ID | Stop bridge and show source unavailable            |
| `source-format`       | Unsupported codec, invalid base64, odd PCM byte length      | Reject source and show unsupported media           |
| `normalization`       | Resampler failure, channel mismatch, clock drift            | Stop bridge and show media conversion failed       |
| `translation-session` | OpenAI socket error, auth failure, model unavailable        | Stop bridge and show translation unavailable       |
| `translation-timeout` | Open timeout, no output heartbeat, idle source              | Stop or degrade based on source type               |
| `output`              | Twilio send failure, room publish failure, audio writer lag | Stop source ingestion and close output             |
| `backpressure`        | Input queue full, output queue full, adapter slow           | Degrade, drop, or close with explicit policy       |
| `cleanup`             | Socket close failure, adapter close failure                 | Report cleanup issue after resources are attempted |
| `unknown`             | Unclassified exception                                      | Stop bridge with sanitized generic failure         |

Minimum metrics:

- Source type and hashed source identifier.
- Target language.
- Start, first source chunk, socket open, session configured, first output audio,
  first target transcript, stop, and cleanup-complete timestamps.
- Input chunk count, normalized bytes, dropped chunk count, silence-tail count,
  output delta count, transcript delta count, and close reason.
- Queue depth buckets instead of raw queue contents.
- Error category and stable code.

No metric may contain raw spoken content, raw provider payloads, credentials, or
browser-visible secrets.

## Recommendation

Proceed with a future prototype, not production shipping, when at least one
approved source exists that cannot use the current browser WebRTC path. Good
prototype candidates are:

- Twilio or SIP media where the backend receives phone audio.
- A broadcast ingest worker where the server owns the source stream.
- A room media worker that subscribes to remote tracks once and republishes
  translated tracks or captions to many listeners.

Defer implementation when the only requested source is microphone,
browser-tab, or listener-side room audio. The existing WebRTC path is simpler,
has a narrower privacy boundary, and already supports the current product UI.

Reject implementation if the use case requires persistent raw audio or
transcripts without a new privacy, consent, and retention PRD.

Recommended future 2-4 hour prototype scope:

- Add a non-registered bridge module with source adapter interfaces and a mock
  PCM source.
- Add PCM16 24 kHz validation and bounded queues.
- Add a mocked OpenAI WebSocket transport for append and output events.
- Add cleanup and duplicate-start tests.
- Add sanitized observability events.
- Keep all production routes disabled until a later session explicitly wires a
  real source.

Unproven assumptions:

- Exact chunk duration and queue caps need empirical latency measurements.
- Translation behavior with aggressive local VAD and silence-tail needs live
  provider validation.
- Provider-specific codec handling for SIP, Twilio, and media workers may need
  separate adapters rather than a single generic normalizer.
- Multi-speaker fanout cost depends on active speaker count and target-language
  count and needs load testing.
- Account-tier audio-minute limits must be rechecked before production launch.

## Future Test Strategy

Offline tests for a prototype:

- PCM16 validation accepts 24 kHz mono little-endian chunks and rejects invalid
  byte lengths or unsupported sample rates.
- u-law 8 kHz conversion resamples to 24 kHz PCM16 and back with deterministic
  fixture samples.
- Append payload builder emits `session.input_audio_buffer.append` and never
  emits `response.create` or tool events.
- Session update builder validates target language and emits
  `session.audio.output.language`.
- Mock WebSocket event tests cover `session.output_audio.delta`,
  `session.output_transcript.delta`, `session.input_transcript.delta`, and
  sanitized `error` events.
- Cleanup tests cover source disconnect, output failure, OpenAI socket close,
  timeout, max duration, and repeated stop.
- Backpressure tests cover input queue full and output queue full policies.
- Redaction tests assert logs exclude audio, transcript text, API keys, bearer
  tokens, provider bodies, authorization headers, cookies, client secrets, SDP,
  and local recording paths.

Optional live-provider validation:

- Run only with explicit credentials and budget approval.
- Use consent-backed or synthetic audio.
- Measure first translated audio latency, end-of-utterance latency, transcript
  timing, reconnect behavior, and source-to-output meaning preservation.
- Reuse the existing translation evaluation workflow for bilingual review.
