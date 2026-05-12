# Room and Telephony Translation Architecture

## Status and Recommendation

Status: architecture decision document, no runtime implementation.

Initial recommendation: defer room and telephony translation implementation until
a later phase. Keep the shipped browser translation product on the existing
WebRTC path. Future telephony, SIP, carrier stream, broadcast ingest, and
backend room-worker paths should be designed as optional sidecars only when the
server already receives media and can enforce caller, room, provider, and
language boundaries.

This session does not add a production route, webhook endpoint, SIP handler,
Twilio dependency, LiveKit dependency, media worker, room UI, default provider
path, or persistent audio/transcript store.

## Sources Checked

Checked on 2026-05-12.

Official OpenAI sources:

- OpenAI Realtime Translation guide:
  https://developers.openai.com/api/docs/guides/realtime-translation
- OpenAI live translation cookbook:
  https://developers.openai.com/cookbook/examples/voice_solutions/realtime_translation_guide
- `gpt-realtime-translate` model page:
  https://developers.openai.com/api/docs/models/gpt-realtime-translate
- OpenAI Realtime WebRTC guide:
  https://developers.openai.com/api/docs/guides/realtime-webrtc
- OpenAI Realtime WebSocket guide:
  https://developers.openai.com/api/docs/guides/realtime-websocket
- OpenAI Realtime SIP guide:
  https://developers.openai.com/api/docs/guides/realtime-sip
- OpenAI voice-model announcement:
  https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/

OpenAI guidance recorded for this architecture:

- Live translation uses `gpt-realtime-translate` and the
  `/v1/realtime/translations` endpoint family, not the standard
  `/v1/realtime` voice-agent endpoint.
- Browser-held media should use WebRTC with server-minted short-lived client
  secrets and SDP exchange through `/v1/realtime/translations`.
- Server-held raw audio should use a backend WebSocket to
  `wss://api.openai.com/v1/realtime/translations?model=gpt-realtime-translate`.
- Translation sessions stream continuously from source audio and should not
  depend on `response.create`, tool calls, assistant turns, or prompt-driven
  conversation lifecycle.
- WebSocket translation input is normalized to base64 24 kHz PCM16 audio, and
  translated audio and transcript deltas are handled by the application output
  adapter.
- `gpt-realtime-translate` is priced by realtime audio duration, with public
  rate limits expressed as account-tier minutes of audio per minute.
- The general Realtime SIP guide documents call accept, reject, monitor, refer,
  and hangup flows for SIP calls. This architecture treats that as a reference
  for future direct SIP control only; it does not assume direct SIP translation
  support unless a later implementation re-checks the translation-specific docs.

Official Twilio sources:

- Twilio Media Streams overview:
  https://www.twilio.com/docs/voice/media-streams
- Twilio Media Streams WebSocket messages:
  https://www.twilio.com/docs/voice/media-streams/websocket-messages
- Twilio Media Streams firewall and signature configuration:
  https://www.twilio.com/docs/global-infrastructure/firewall-configurations/media-streams-configuration
- Twilio webhook security:
  https://www.twilio.com/docs/usage/webhooks/webhooks-security

Twilio guidance recorded for this architecture:

- Media Streams expose Programmable Voice call audio to a configured WebSocket
  destination.
- Unidirectional streams can receive inbound, outbound, or both tracks, while
  bidirectional streams receive the inbound track and can send audio back for
  playback.
- Bidirectional streams use one stream per call and are stopped by closing the
  WebSocket or ending the call.
- Media stream messages include connected, start, media, stop, DTMF, and mark
  events depending on stream direction.
- Outbound audio to Twilio must match the provider media message contract,
  including u-law 8 kHz payload handling.
- Twilio webhook and WebSocket entry points require signature validation, and
  JSON request validation must preserve the raw body and exact URL inputs.

Official room and media-worker sources:

- LiveKit rooms, participants, and tracks:
  https://docs.livekit.io/intro/basics/rooms-participants-tracks/
- LiveKit agent server overview:
  https://docs.livekit.io/agents/server/
- LiveKit agent sessions and RoomIO:
  https://docs.livekit.io/agents/logic/sessions/
- LiveKit agent dispatch:
  https://docs.livekit.io/agents/server/agent-dispatch/
- LiveKit SIP dispatch rules:
  https://docs.livekit.io/sip/dispatch-rule/
- LiveKit accepting inbound calls:
  https://docs.livekit.io/sip/accepting-calls/

Room and media-worker guidance recorded for this architecture:

- Rooms contain participants that publish and subscribe to audio, video, or data
  tracks.
- Programmatic participants and agents can join rooms to process realtime media
  streams, publish output tracks, and manage data flows.
- Agent sessions can use RoomIO as a bridge between room tracks and agent
  input/output.
- Explicit dispatch gives the backend control over when an agent or worker
  joins a room and what metadata it receives.
- SIP dispatch rules can route inbound callers into rooms and dispatch agents,
  which makes telephony-to-room fanout a future architecture option rather than
  a default app path.

## Local References Reviewed

Repository references reviewed as constraints, not as runtime dependencies:

- `docs/OPENAI_REALTIME.md` - current OpenAI voice provider and browser
  translation boundary.
- `docs/OPENAI_TRANSLATION_DEMO.md` - server-only key handling, demo setup,
  max-session guard, and browser source constraints.
- `docs/ongoing-projects/raw-audio-bridge-spike.md` - completed backend
  raw-audio sidecar recommendation and cleanup model.
- `docs/ongoing-projects/translation-evaluation.md` - repeatable evaluation
  workflow, budget gates, and local-only review output policy.
- `docs/SECURITY.md` - provider credential custody, browser/audio privacy, and
  OpenAI Translation lifecycle logging policy.
- `.spec_system/SECURITY-COMPLIANCE.md` - residual risks for process-local rate
  limiting and current CSP compatibility allowances.
- `src/test/rawAudioBridgeDocs.test.ts` - docs validation pattern for future
  architecture notes.

Constraints carried forward:

- Browser microphone, browser-tab audio, and browser-accessible tracks remain
  on the shipped WebRTC translation path.
- Backend raw-audio ingestion remains optional future architecture for media
  paths that already deliver server-side audio.
- `OPENAI_API_KEY` remains server-only. Browser code receives only short-lived
  client secrets for the current WebRTC translation path.
- Raw audio, transcript text, provider payloads, cookies, authorization
  headers, SDP bodies, and client secrets must not be logged or persisted.
- Live OpenAI, Twilio, SIP, LiveKit, or room provider calls are not required for
  this session.
- The app has no accounts, tenant model, billing model, persistent transcript
  store, or formal consent and deletion workflow.
- Current process-local rate limits are insufficient for horizontally scaled
  telephony or room fanout.
- Current CSP posture still includes provider compatibility allowances; any
  future room-facing browser UI must be tested provider by provider before CSP
  tightening.
- Evaluation remains offline by default. Live translation quality review needs
  explicit budget approval and sanitized or local-only results.

## Scope and Non-Goals

In scope:

- Compare future telephony, SIP, room, speaker, listener, and target-language
  topologies.
- Define where request signature validation, caller allow-lists, room
  authorization, target-language validation, webhook verification, and provider
  boundary enforcement belong.
- Compare one-session-per-direction, one-session-per-speaker-language, and
  one-session-per-listener-language fanout models.
- Describe deployment risks, process-local rate-limit caveats, CSP posture,
  observability boundaries, privacy posture, cleanup, and failure handling.
- Recommend whether future work should build, defer, or reject room and
  telephony translation.
- Add offline validation so the document does not drift into shipped-runtime
  claims.

Out of scope:

- No SIP, Twilio, LiveKit, room, carrier, broadcast, or media-worker
  integration is shipped.
- No webhook endpoint, WebSocket endpoint, TwiML route, SIP callback handler,
  room dispatch route, provider SDK import, queue, worker process, or UI path is
  registered.
- No current OpenAI Translation UI is reworked around room concepts.
- No browser media is routed through a backend PCM bridge by default.
- No raw audio, transcript text, provider payload, cookie, authorization
  header, SDP body, client secret, or API key is persisted.
- No live provider call, account configuration, phone number, SIP trunk, room
  project, or production credential is required.

## Decision Document Contract

Future implementation sessions may use this document only if these statements
remain true after their own current-source re-check:

- Browser-owned media remains on the shipped WebRTC translation path.
- Server-owned media variants are optional sidecars and not default app
  behavior.
- All source adapters authenticate and authorize before media reaches OpenAI.
- All target-language requests use the supported app language list or a future
  explicit replacement list.
- All cleanup flows are idempotent and stop source ingestion before closing
  translation sessions or output adapters.
- All logs and metrics are sanitized counters, states, durations, and error
  categories only.
- Any implementation that needs persistent transcripts, recordings, account
  identity, billing, or room membership requires a new PRD scope and privacy
  review.

## Existing Browser WebRTC and Raw-Audio Boundaries

Current shipped path:

```text
browser source -> browser WebRTC peer connection -> OpenAI Translation
       |                    |                         |
       v                    v                         v
source capture      oai-events data channel     translated audio track
```

The current app already supports microphone and browser-tab sources through
browser APIs. The backend validates the requested target language, creates a
short-lived translation client secret with server-side `OPENAI_API_KEY`, and
returns only browser-safe fields. The browser then owns source tracks, peer
connection state, translated playback, transcript deltas, source cleanup, and
provider-switch teardown.

Room and telephony work must not replace this path. Browser-accessible room
tracks should use the same browser WebRTC approach when the browser already has
authorized access to the track. Moving those tracks through a backend media
bridge would increase privacy exposure, add codec and queue responsibilities,
and duplicate behavior that the current product already handles.

Optional future sidecar path:

```text
server-held source -> source adapter -> audio normalizer
        -> OpenAI translation session -> output adapter
        -> cleanup controller and sanitized metrics
```

The sidecar path is only justified when the server already receives media. Good
fits include carrier Media Streams, SIP media handed to a backend worker,
broadcast ingest, or a room/media-worker participant that must process tracks on
behalf of listeners. It should remain a separately planned module with no import
from the default Express route registration until a future PRD authorizes a
runtime surface.

Boundary rules:

- Browser capture remains WebRTC by default.
- Server-held media requires explicit source authorization before audio
  normalization begins.
- The source adapter owns provider ingress and authentication.
- The translation session manager owns OpenAI session creation, target-language
  configuration, bounded input appends, and close handling.
- The output adapter owns provider-specific playback, publishing, caption, or
  media-message behavior.
- The cleanup controller owns one idempotent stop path across source, queues,
  OpenAI session, output, timers, and metrics handles.
- Metrics and logs describe state, counts, timings, and categories only.

## Telephony Adapter Boundary

Telephony should be modeled as a source adapter that proves the call is allowed
before media reaches the translation session. The adapter may be a Twilio Media
Streams bridge, SIP media bridge, carrier stream bridge, or a room provider SIP
participant, but each variant needs the same boundary shape.

Inbound control flow:

```text
carrier webhook or SIP event
  -> verify provider signature or trunk authorization
  -> check caller and called-number policy
  -> validate requested target language
  -> allocate call session generation
  -> attach media stream
  -> start translation sessions
```

Media flow:

```text
telephony media -> codec detector -> normalizer -> OpenAI translation
       |                 |                |              |
       v                 v                v              v
provider metadata   reject unknown   PCM16 24 kHz   translated deltas
```

Required controls:

- Verify Twilio requests with the provider SDK and exact URL/raw body handling.
- Treat WebSocket signature headers as case-sensitive provider input and handle
  lowercase `x-twilio-signature` where required.
- For SIP trunks, authenticate trunk credentials or trusted source policy before
  room or bridge creation.
- Apply caller allow-lists, deny-lists, country or area policy, and called-number
  policy before media setup.
- Reject unsupported target languages before opening any OpenAI session.
- Attach one call session generation to all media chunks and discard stale
  chunks after reconnect or cleanup.
- Normalize provider audio explicitly. A Twilio path needs u-law 8 kHz decode
  before OpenAI input and u-law 8 kHz encode before Twilio playback.
- Stop source ingestion before output adapter failure can accumulate more
  translated audio.

Output delivery options:

| Option                                   | Fit                                                      | Guardrails                                                                                 |
| ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Play translated audio back into the call | Two-party or IVR-like call translation                   | Needs output queue cap, Twilio mark/clear handling, echo policy, and hangup cleanup.       |
| Publish captions to an operator view     | Support desk or monitoring workflow                      | Requires no raw transcript logs and local-only review unless a future PRD adds retention.  |
| Bridge translated audio into a room      | Caller joins a room as translated participant audio      | Requires room authorization, participant identity policy, and per-room cleanup.            |
| Transfer or hang up                      | Unsupported caller, unsupported region, or failed policy | Must return stable status categories and avoid leaking internal reason details to callers. |

Telephony should not share route code with the current
`/api/openai/translation-session` browser client-secret route. A future
implementation can reuse target-language validation and sanitized logging
helpers, but provider webhook validation, media socket ownership, and output
messages need separate modules.

## Room and Media-Worker Options

Room translation has two viable families. The right choice depends on who owns
the source track and where listener playback must happen.

### Option A: Browser-Held Room Track

```text
authorized browser participant -> selected room track -> browser WebRTC translation
```

Use this when a browser participant is already authorized to subscribe to the
source audio and can play translated output locally. This is closest to the
current app: the server mints a short-lived OpenAI translation client secret,
the browser selects a target language, and the browser owns source capture,
translated playback, and transcript display.

Benefits:

- Lowest new backend privacy exposure.
- Reuses current cleanup, duplicate-start prevention, diagnostics, captions,
  and export behavior.
- Keeps listener choice local. Each listener can choose their own target
  language without making the server handle all translated output.

Limits:

- Does not produce a shared translated room track for other participants.
- Depends on browser permission and room SDK access to the selected track.
- Cost scales per listener who starts their own translation session.

### Option B: Room Media Worker Sidecar

```text
room media worker -> subscribed speaker tracks -> translation sessions
       -> translated room tracks or captions -> listeners
```

Use this when the product needs translated audio or captions published back into
a room for one or more listeners. The worker joins as a programmatic
participant, subscribes to authorized speaker tracks, opens one or more OpenAI
translation sessions, and republishes translated audio tracks or caption data.

Required controls:

- Room authorization before worker dispatch.
- Speaker authorization before subscribing to tracks.
- Listener authorization before delivering translated audio or captions.
- Target-language validation before every translation session.
- Per-room and per-speaker session caps.
- Participant leave handling that stops the affected source, translations, and
  output tracks.
- Explicit cleanup when a room empties, a worker job ends, or dispatch metadata
  changes.

### Option C: SIP Participant Enters A Room

```text
SIP caller -> room SIP participant -> room media worker -> translation fanout
```

Use this when calls must join a room rather than stay in a call-only bridge.
LiveKit-style SIP dispatch can route a caller into a room and optionally
dispatch an agent or worker. Translation should still be owned by an authorized
worker that validates room and listener policy before subscribing or publishing.

Benefits:

- Gives phone callers and web participants one shared room model.
- Lets the room provider handle participant presence, room lifecycle, and track
  publication.
- Can reuse room worker cleanup when callers disconnect.

Limits:

- Adds SIP trunk, provider, room membership, and participant identity policy.
- Exposes caller metadata to room logic unless explicitly minimized.
- Requires strong room authorization and operator controls before production.

### Option D: Reject Room Worker Translation

Reject room worker translation for now if the use case is only local listen-along
translation. The current browser WebRTC path is simpler, has lower backend
privacy exposure, and avoids server-side fanout costs.

Room worker translation becomes worth a prototype only when at least one of
these is true:

- Translated audio must be published back as a room track.
- Captions must be delivered to several authorized listeners with shared state.
- A non-browser source, such as SIP or broadcast ingest, already enters the room
  server-side.
- The operator needs server-side policy enforcement around speakers, listeners,
  and language fanout.

## Topology Comparison

Use these variables for estimating future fanout:

- `S` = active source speakers.
- `L` = listeners receiving translated output.
- `T` = unique target languages.
- `D` = spoken directions in a call, usually two in a two-party phone call.

| Topology                          | Session count                           | Best fit                                                   | Cost and rate-limit shape                                                      | Latency                                                                   | Failure isolation                                                                 | Cleanup burden                                                          |
| --------------------------------- | --------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| One-session-per-direction         | `D` or `S * target-for-each-direction`  | Two-party calls or fixed bilingual bridge                  | Predictable for two sides; grows with call directions, not every listener      | Low when streams are direct and codec conversion is bounded               | One direction can fail without stopping the other                                 | Moderate; cleanup per call direction and output queue                   |
| One-session-per-speaker-language  | `S * T`                                 | Room with multiple speakers and shared target languages    | Cheaper than listener fanout when many listeners share languages               | Moderate; shared outputs can be published once per language               | Speaker-language session failure affects all listeners for that translated source | Higher; cleanup per speaker, language, output track, and subscriber set |
| One-session-per-listener-language | `S * L` or per listener-selected source | Personal listen-along or private target-language selection | Most expensive when many listeners join; easiest to charge or cap per listener | Low to moderate; listener-local playback can avoid shared republish delay | Strong isolation; one listener failure does not affect others                     | High at scale; cleanup per listener session and personal output         |

### One-Session-Per-Direction

This is the simplest telephony model. For a two-party call where each side needs
the other side translated, run A-to-B and B-to-A sessions. It maps well to
Twilio-style media streams and to SIP bridge calls where each party has a clear
source and destination.

Choose it when:

- The call has a small number of participants.
- Each side has one target language.
- Call failure semantics should be simple: close the call or fall back to the
  original audio when a direction fails.

Avoid it when:

- Many listeners need different target languages.
- Room participants need per-listener privacy controls.
- Speaker tracks overlap and need independent captions.

### One-Session-Per-Speaker-Language

This is the preferred room-worker prototype model when translated output must be
shared. Each active speaker track is translated once per requested target
language, then the room output adapter publishes translated audio or caption
data for all authorized listeners in that language.

Choose it when:

- Several listeners share the same target language.
- The product wants shared translated room tracks or shared captions.
- The room worker can subscribe to individual speaker tracks and avoid mixed
  multi-speaker input.

Avoid it when:

- Listener permissions differ enough that shared output would leak content.
- The room provider cannot provide stable speaker track identity.
- The use case only needs local browser listen-along.

### One-Session-Per-Listener-Language

This is the most isolated model. Each listener gets translation sessions for the
speaker or mix they are authorized to hear. It is appropriate for private
listen-along translation but can multiply cost quickly.

Choose it when:

- Each listener controls a private target language.
- Output should not be shared as a room track.
- Per-listener failure, stop, and billing boundaries matter more than cost.

Avoid it when:

- A room has many listeners.
- Listeners share target languages and can safely share output.
- Account-tier audio-minute limits are likely to be reached.

Topology recommendation:

- Build future telephony prototypes with one-session-per-direction first.
- Build future room-worker prototypes with one-session-per-speaker-language
  only when shared translated output is required.
- Defer one-session-per-listener-language to browser-held media or a future
  paid/authorized product scope with explicit per-listener caps.

## Data Plane, Control Plane, and Cleanup Ownership

Keep the control plane separate from the data plane. Future implementations
should be able to stop, meter, and audit sessions without exposing raw media or
provider payloads to logs.

Data plane:

- Ingests provider audio frames or room tracks after authorization.
- Detects codec, sample rate, channel count, clock drift, and chunk order.
- Converts accepted media to the OpenAI translation input contract.
- Sends bounded audio chunks to the translation session.
- Receives translated audio and transcript deltas.
- Converts translated audio to provider output format or publishes caption
  events.
- Applies backpressure and hard queue caps.

Control plane:

- Verifies webhook signatures, SIP trunk authorization, or room membership.
- Applies caller allow-list, room policy, speaker policy, listener policy, and
  target-language policy.
- Allocates session generation IDs and session ownership records.
- Enforces max duration, concurrent session caps, per-room caps, and per-caller
  caps.
- Publishes sanitized lifecycle telemetry.
- Owns operator-visible state categories and stable error mapping.
- Initiates stop, reject, transfer, hangup, worker dispatch, and worker teardown
  actions.

Resource ownership:

| Resource                                   | Owner                       | Cleanup trigger                                                            |
| ------------------------------------------ | --------------------------- | -------------------------------------------------------------------------- |
| Provider webhook request                   | Source adapter              | Response sent, validation failure, or timeout                              |
| Provider media socket or room subscription | Source adapter              | Caller disconnect, participant leave, authorization revocation, or cleanup |
| Codec/resampler state                      | Audio normalizer            | Source close, codec mismatch, generation change, or cleanup                |
| OpenAI translation session                 | Translation session manager | Source close, max duration, OpenAI error, output failure, or cleanup       |
| Output media queue                         | Output adapter              | Destination close, sustained backpressure, generation change, or cleanup   |
| Published room track or caption stream     | Output adapter              | Listener leave, room empty, worker job end, or cleanup                     |
| Timers and watchdogs                       | Cleanup controller          | Normal stop, failure stop, or generation replacement                       |
| Metrics handles                            | Observability boundary      | Final lifecycle event emitted                                              |

Cleanup controller requirements:

- Cleanup is idempotent and can be called by any failure path.
- Cleanup moves the generation to `stopping` before closing resources.
- Source ingestion stops before the translation session is closed.
- Output queues stop accepting new deltas before their transport is closed.
- Provider event handlers and WebSocket callbacks are detached.
- Timers, intervals, retries, and watchdogs are cleared.
- Late provider frames and OpenAI events are ignored if their generation ID is
  stale.
- Final telemetry contains only state category, stable reason, durations, counts,
  language code, topology name, and sanitized provider type.

## Security Checklist

Future implementation sessions must satisfy this checklist before any live
telephony, SIP, room, or media-worker path can be considered production-ready.

Webhook and source verification:

- Verify every Twilio webhook or Media Stream upgrade with official request
  validation helpers.
- Preserve exact request URLs, query parameters, and raw JSON bodies when
  required by provider signature validation.
- Authenticate SIP trunks or provider-supplied call events before creating a
  room participant or media bridge.
- Reject unsigned, stale, replayed, malformed, or unsupported provider events
  before any OpenAI session is opened.
- Apply timeouts to webhook handling, media socket setup, source connection, and
  room worker dispatch.

Caller, room, and listener authorization:

- Check caller allow-list, deny-list, country policy, called-number policy, and
  emergency-call policy before media ingestion.
- Check room membership, room role, speaker authorization, and listener
  authorization at the backend enforcement point closest to the room provider.
- Do not trust room metadata, SIP metadata, or provider custom parameters until
  they are validated against server policy.
- Revalidate policy on reconnect, participant rejoin, worker redispatch, target
  language change, and listener subscription change.

Target-language and topology validation:

- Validate target languages before opening OpenAI sessions.
- Reject unknown languages with stable error categories and no upstream call.
- Enforce per-call, per-room, per-speaker, per-listener, and per-language
  session caps before allocating resources.
- Treat a topology name as policy input. Unknown topology names fail closed.

Secret custody and provider boundaries:

- Keep `OPENAI_API_KEY` only on the server.
- Keep Twilio auth tokens, SIP trunk credentials, room provider API keys, and
  webhook secrets only in server runtime secret stores.
- Never expose standard provider API keys, OpenAI client secrets, SIP
  credentials, room tokens, cookies, authorization headers, SDP bodies, or raw
  provider payloads to browser-visible state.
- Use provider-specific modules for webhook validation, media messages, room
  APIs, and SIP behavior so one provider cannot accidentally parse another
  provider's payload.

Logging, privacy, and storage:

- Do not log raw audio, transcript text, provider payload bodies, request
  bodies, response bodies, SDP, cookies, authorization headers, client secrets,
  API keys, or phone numbers.
- Use hashed or opaque caller and room identifiers only when a future PRD
  defines the identifier source and retention policy.
- Keep raw audio and transcripts transient. Do not persist them without a new
  consent, retention, deletion, and privacy review.
- Emit sanitized counters and categories: provider type, topology name, target
  language, source state, output state, queue depth bucket, duration bucket,
  cleanup reason, and stable error code.

Failure information boundaries:

- External callers receive stable categories such as `unauthorized_source`,
  `unsupported_language`, `rate_limited`, `provider_unavailable`, or
  `translation_unavailable`.
- Internal exception messages, stack traces, provider response bodies, and
  account details stay server-side and out of client responses.
- Operator diagnostics can include request IDs and state categories, not media
  content or secret-bearing payloads.

## Operational Model

Session count and cost should be estimated before a future prototype starts.
Because `gpt-realtime-translate` is priced by realtime audio duration, fanout is
mostly driven by how many simultaneous translation sessions are open and how
long they stream.

Session count examples:

| Scenario                                                        | Formula        | Example                                                                  |
| --------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------ |
| Two-party phone bridge                                          | `2 directions` | Caller A hears B translated and caller B hears A translated: 2 sessions. |
| Three speakers, two shared target languages                     | `S * T`        | 3 speakers \* 2 target languages: 6 sessions.                            |
| Four listeners each choosing a private language for one speaker | `L`            | 4 listeners: 4 sessions for that source.                                 |
| Four listeners each translating three speakers privately        | `S * L`        | 3 speakers \* 4 listeners: 12 sessions.                                  |

Cost drivers:

- Concurrent translation session count.
- Session duration, including silence that must continue to stream.
- Source fanout model and number of target languages.
- Codec normalization and output conversion CPU.
- Room track publication or telephony media egress.
- Retry behavior after provider disconnects.
- Operator or listener behavior that leaves sessions running after the useful
  media has ended.

Latency tradeoffs:

- Smaller input chunks reduce capture-to-translation delay but increase event
  overhead.
- Codec conversion and resampling add CPU latency and failure modes.
- Shared room output adds publish and subscription latency after translation.
- Listener-local browser output can be lower latency but costs more when many
  listeners use separate sessions.
- Output queue caps must prefer a visible degraded state over unbounded delay.

Rate-limit exposure:

- Current app rate limiting is process-local and only protects the existing
  HTTP route shape.
- Telephony and room fanout need platform-level or shared-store limits before
  production.
- Future controls should include max active calls, max active rooms, max
  sessions per room, max sessions per caller, max target languages per room,
  max source speakers per worker, and max duration per session.
- Account-tier OpenAI audio-minute limits should be checked at startup and
  monitored outside the app where provider APIs make that available.

Backpressure rules:

- Source queues have hard duration or byte caps.
- Output queues have hard duration or byte caps.
- A sustained output lag closes or degrades the affected translation path before
  it can continue consuming source audio.
- A source that outpaces normalization fails with a stable `source_backpressure`
  category.
- A provider output destination that cannot accept audio fails with
  `output_backpressure` and runs cleanup for affected resources.

Observability boundaries:

Allowed metrics:

- `translation.topology`
- `translation.provider_type`
- `translation.target_language`
- `translation.source_state`
- `translation.output_state`
- `translation.session_count`
- `translation.duration_bucket`
- `translation.queue_depth_bucket`
- `translation.cleanup_reason`
- `translation.error_code`

Disallowed metrics and logs:

- Raw audio.
- Transcript text.
- Phone numbers.
- Room names when they encode user identity.
- Provider request or response bodies.
- Cookies, authorization headers, SDP bodies, client secrets, and API keys.

## Lifecycle States and Failure Handling

Future sidecars should use a small explicit state machine. Each state belongs to
one session generation, and any state transition from an old generation is
ignored after cleanup starts.

Lifecycle states:

| State            | Meaning                                                                                                | Next states                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `idle`           | No source, translation session, output adapter, timer, or queue is active.                             | `authorizing`                                |
| `authorizing`    | Webhook, SIP, caller, room, speaker, listener, and target-language policy are being verified.          | `source-opening`, `rejected`, `stopping`     |
| `source-opening` | Provider media socket, SIP leg, or room subscription is being established.                             | `normalizing`, `failed`, `stopping`          |
| `normalizing`    | Codec, sample rate, channel count, and first chunks are being validated.                               | `translating`, `failed`, `stopping`          |
| `translating`    | Source audio is streaming into OpenAI and output deltas are expected.                                  | `draining`, `degraded`, `failed`, `stopping` |
| `degraded`       | The session is still useful but has a visible warning, such as output lag or transcript-only fallback. | `translating`, `failed`, `stopping`          |
| `draining`       | Source input has stopped and output is flushing within a hard timeout.                                 | `stopping`, `failed`                         |
| `rejected`       | Policy rejected the source before media ingestion.                                                     | `idle`                                       |
| `failed`         | A non-recoverable source, OpenAI, output, policy, or timeout failure occurred.                         | `stopping`                                   |
| `stopping`       | Idempotent cleanup is closing resources and ignoring late events.                                      | `idle`                                       |

Failure handling by component:

| Component           | Failure                                                                                | Required handling                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Source connection   | Webhook invalid, SIP trunk invalid, caller not allowed, room not authorized            | Reject before OpenAI session creation and return stable category.                                    |
| Media normalization | Unsupported codec, malformed frame, clock drift, resampler error                       | Stop ingestion, close affected output, emit sanitized `source_media_invalid` or `normalizer_failed`. |
| Translation session | OpenAI connect timeout, upstream close, malformed event, target-language rejection     | Stop source ingestion, close output queues, emit stable translation error, run cleanup.              |
| Output adapter      | Twilio playback lag, room publish failure, listener disconnect, caption stream failure | Stop affected translation path and source if continued ingestion would create unbounded output.      |
| Timeout             | Max duration, idle source, stuck drain, cleanup timeout                                | Close affected resources once and emit timeout category.                                             |
| Disconnect          | Caller hangup, room empty, participant leave, browser listener stop                    | Close source and only keep unrelated speaker/listener sessions alive when topology allows it.        |
| Policy change       | Caller removed, listener loses access, language disabled, room revoked                 | Stop affected sessions and reject stale events from the old generation.                              |

Retry posture:

- Do not automatically redial callers or recreate room workers without operator
  policy.
- Retry transient OpenAI connection failures only before source media is
  actively flowing, with a short bounded backoff.
- Do not retry after a policy failure, unsupported language, invalid signature,
  malformed provider payload, or repeated output backpressure.
- A future prototype can reconnect a room worker after process restart only if
  room policy, source state, and target-language requests are freshly loaded
  and revalidated.

Cleanup examples:

- Caller hangs up: source adapter receives stop, translation sessions stop,
  output queues close, timers clear, final telemetry emits `caller_disconnect`.
- Room participant leaves: sessions tied to that speaker or listener close,
  unrelated sessions continue if authorization still holds.
- Translation session closes unexpectedly: source ingestion stops first, output
  adapter flushes or drops by policy, final telemetry emits
  `translation_unavailable`.
- Output destination stalls: output queue cap trips, source ingestion stops for
  that translation path, final telemetry emits `output_backpressure`.
- Process restarts: no durable session is assumed. Carrier or room provider
  callbacks must recreate state through normal authorization and cleanup any
  orphaned provider-side resources.

## Deployment Posture and Residual Risks

Current deployment posture:

- The shipped app is stateless and browser-first for OpenAI Translation.
- The current backend owns short-lived browser credential minting only; it does
  not own long-running translation media streams.
- The current strict token/session limiter is process-local.
- The current CSP still keeps provider compatibility allowances.
- The app has no account, tenant, billing, persistent transcript, or room
  membership model.

Future telephony or room translation is not production-ready until these gaps
are closed:

- Shared-store or platform-level rate limiting for webhooks, media stream
  upgrades, room worker dispatch, and OpenAI session allocation.
- Provider-specific secret storage and rotation for Twilio, SIP trunk, room
  provider, webhook, and OpenAI credentials.
- Explicit caller, room, speaker, listener, and target-language policy storage.
- Operator-visible controls for max duration, max concurrent sessions, allowed
  countries, allowed callers, room policies, and language policies.
- Provider account controls for phone numbers, SIP trunks, room projects,
  allowed domains, emergency calling policy, spend caps, and abuse monitoring.
- A privacy review for whether any caller IDs, room IDs, captions, or
  transcript snippets can appear in operator tools.
- A CSP review if a future browser-facing room UI adds SDK scripts, WebSocket
  origins, media origins, or frame requirements.
- Failure drills for call disconnects, room empty events, OpenAI upstream
  errors, provider stream stalls, worker restarts, and cleanup timeouts.

Residual risks:

| Risk                              | Impact                                                                             | Mitigation before build                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Process-local rate limiting       | Multi-instance deployments can exceed intended global caps and provider budgets.   | Add shared-store or platform limiter and enforce session allocation caps centrally.                      |
| CSP compatibility allowances      | Future room UI may require new origins or loosened directives.                     | Test each provider SDK and media path before changing production CSP.                                    |
| Provider metadata sensitivity     | Caller IDs, room names, and participant metadata may contain personal data.        | Minimize and hash identifiers; do not log raw provider metadata.                                         |
| Cost fanout                       | Listener and language fanout can multiply audio-minute usage quickly.              | Enforce topology-specific caps, duration limits, and budget dashboards before live traffic.              |
| Orphaned provider resources       | Process restart can leave calls, workers, tracks, or streams active provider-side. | Add provider-side reconciliation, short TTLs, and cleanup watchdogs.                                     |
| Direct SIP assumption drift       | OpenAI SIP docs may not match translation-specific endpoint behavior.              | Re-check translation-specific docs before choosing direct SIP instead of backend media bridging.         |
| Recording and transcript pressure | Operators may ask to store call or room outputs for review.                        | Keep no-storage posture unless a new PRD adds consent, retention, deletion, and compliance requirements. |

## Recommendation

Recommendation: defer room and telephony translation implementation now; build a
small future prototype only for server-held media after production controls are
planned.

Build later:

- A telephony translation spike using one-session-per-direction when a real
  Twilio or SIP use case exists, provider credentials are available, and shared
  rate limits are in place.
- A room media-worker spike using one-session-per-speaker-language when the
  product explicitly needs translated audio or captions published back into a
  room.
- Browser-held room-track translation only if the current WebRTC translation UI
  can receive authorized room tracks without sending them through the backend.

Defer:

- Direct OpenAI SIP translation until translation-specific SIP behavior is
  rechecked and the product has caller policy, trunk policy, and hangup/transfer
  requirements.
- One-session-per-listener-language server fanout until there is a paid,
  authorized, per-listener product scope with budget controls.
- Persistent transcripts, recordings, evaluation results, or call metadata until
  a future PRD covers consent, retention, deletion, and compliance.

Reject for the current product:

- Replacing the shipped browser WebRTC translation path with a backend raw-audio
  bridge for normal microphone, browser-tab, or browser-accessible room tracks.
- Shipping generic unauthenticated webhook or media stream endpoints.
- Logging or persisting raw audio, transcript text, provider payloads, cookies,
  authorization headers, SDP bodies, API keys, or client secrets.
- Adding Twilio, SIP, LiveKit, or room SDK dependencies to the default runtime in
  this architecture-only session.

## Future Implementation Scope

A later 2-4 hour telephony prototype session can be scoped to:

- Add an isolated `server/translation/telephony` module with no default route
  registration until explicitly enabled.
- Implement offline unit tests for Twilio request validation helpers with
  fixture signatures or provider SDK mocks.
- Implement codec conversion behind a pure adapter interface.
- Implement one in-memory session manager with generation IDs, queue caps, max
  duration, and cleanup.
- Add no live provider call by default; live Twilio/OpenAI checks remain manual
  and credential-gated.

A later 2-4 hour room-worker prototype session can be scoped to:

- Add a room-worker design stub or isolated worker module outside the default
  browser provider path.
- Mock room participants, speaker tracks, listener authorizations, and target
  language requests in tests.
- Implement one-session-per-speaker-language planning and cleanup logic without
  publishing real room tracks.
- Add a follow-up integration session only after provider credentials and room
  project policy are available.

Prerequisites for any build session:

- Current OpenAI translation, SIP, WebSocket, and model docs rechecked.
- Current Twilio or room provider docs rechecked for signature, media, and
  dispatch behavior.
- Shared-store or platform rate-limit design selected.
- Provider secret storage and rotation policy selected.
- Caller, room, speaker, listener, and language policy source selected.
- Privacy review completed for all identifiers and operator views.
- Budget guardrails approved for live provider testing.

Unproven assumptions:

- Whether direct OpenAI SIP is a better fit than carrier/room media streamed to
  the translation WebSocket endpoint for this product.
- Whether target listener groups can safely share translated room tracks without
  leaking content across authorization boundaries.
- Whether provider account rate limits and OpenAI audio-minute limits can
  support multi-room fanout at expected demo sizes.
- Whether future room SDK, SIP, and telephony provider CSP needs can fit the
  current production header posture.
- Whether operators will require recording, transcript review, or audit
  features that would change the current no-storage privacy posture.

## Future Test Strategy

Offline tests should land before live provider checks:

- Docs tests for required source links, topology names, no-runtime claims,
  security guardrails, and recommendations.
- Unit tests for caller, room, speaker, listener, and language policy decisions.
- Unit tests for generation ID cleanup and stale event rejection.
- Unit tests for queue caps and backpressure categories.
- Provider SDK mocks for Twilio signature validation, SIP dispatch metadata, and
  room worker authorization.

Live tests should remain manual and gated by credentials, budget, and provider
account policy:

- One short approved call with a fictional script.
- One room-worker dry run with synthetic participant identities.
- One disconnect drill for caller hangup or participant leave.
- One output backpressure or forced-close drill.
- One log review confirming no raw media, transcript text, provider payload,
  client secret, API key, cookie, authorization header, or SDP body is present.
