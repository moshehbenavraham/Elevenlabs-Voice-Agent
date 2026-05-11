# Session Specification

**Session ID**: `phase05-session03-backend-raw-audio-bridge-spike`
**Phase**: 05 - Production Extensions and Media Variants
**Status**: Not Started
**Created**: 2026-05-12

---

## 1. Session Overview

This session produces a contained raw-audio bridge spike for future OpenAI Translation media sources that are not already handled by the browser WebRTC tab. The purpose is to decide whether the app should later support server-side audio ingestion from SIP, telephony, media workers, broadcast streams, or other raw-audio sources without changing the default browser translation path.

The work is documentation-led. It should capture current OpenAI realtime translation constraints, compare browser WebRTC against backend WebSocket media pipelines, describe concrete audio format and lifecycle requirements, and document security boundaries for server-held API keys and raw media handling. A small validation test may be added to keep the decision document from drifting, but no production route or default UI path should be introduced in this session.

This spike sits between the completed evaluation workflow and the later room/telephony architecture session. Session 04 depends on either a clear raw-audio bridge recommendation or a documented decision to defer the bridge.

---

## 2. Objectives

1. Re-check and record current OpenAI realtime translation server-side media constraints before making bridge assumptions.
2. Compare the existing browser WebRTC translation MVP with a future backend raw-audio WebSocket bridge.
3. Document audio format, sample-rate, chunking, buffering, VAD, silence-tail, cleanup, and failure-handling constraints.
4. Produce a proceed, defer, or reject recommendation that is specific enough to scope a later implementation session.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides the browser WebRTC translation runtime that this spike must not replace.
- [x] `phase03-session05-audio-mix-and-export-controls` - Provides translated audio playback, transcript export, and max-session guard behavior used for comparison.
- [x] `phase04-session01-lifecycle-reliability` - Provides the cleanup model for translation peer connections, tracks, channels, timers, and provider switching.
- [x] `phase04-session02-error-states-and-diagnostics` - Provides current error mapping and diagnostics posture for translation failures.
- [x] `phase05-session01-production-safety-and-usage-controls` - Provides production usage, duration, safety identifier, and observability guardrails.
- [x] `phase05-session02-evaluation-harness-and-sample-workflow` - Provides repeatable evaluation criteria that future raw-audio work should reuse.

### Required Tools/Knowledge

- Current OpenAI live translation docs and cookbook guidance.
- Existing browser translation route and hook behavior in `server/routes/openai.js`, `src/hooks/useOpenAITranslation.ts`, and `src/lib/openaiTranslation.ts`.
- Raw-audio reference assets in `EXAMPLE/mtg-realtime-translator/app.py`.
- Twilio bridge reference assets in `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/`.
- Existing Vitest conventions for lightweight documentation or policy validation.

### Environment Requirements

- Node.js and npm dependencies installed for any validation test.
- No live OpenAI API call required for the spike.
- No new runtime route, webhook, SIP, Twilio, or media-worker dependency introduced by this session.
- Any protocol-specific assertion must cite the OpenAI docs checked during implementation.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can understand whether a backend raw-audio bridge is worth pursuing - create a decision note with explicit proceed, defer, or reject criteria.
- Maintainer can compare browser WebRTC and backend WebSocket translation paths - document transport, latency, control, cost, security, and operational tradeoffs.
- Future implementer can see the raw-audio contract - document 24 kHz little-endian PCM16 input, base64 `session.input_audio_buffer.append`, continuous silence behavior, chunk sizing, output audio deltas, and transcript event handling.
- Future implementer can reason about non-browser sources - document telephony u-law conversion, resampling, media-worker ingestion, buffering, backpressure, VAD, silence-tail, and teardown constraints.
- Security reviewer can evaluate the future boundary - document API-key custody, raw media handling, sanitized logs, no persistent audio/transcript storage, rate-limit caveats, and CSP limits.
- Maintainer can catch decision-doc drift - add a focused offline validation test if it fits the existing test conventions.

### Out of Scope (Deferred)

- Shipping a default raw-audio UI path - _Reason: PRD keeps the browser WebRTC translation tab as the shipping product path._
- Adding production SIP, Twilio, LiveKit, or media-worker routes - _Reason: Session 04 handles room and telephony architecture after this bridge decision._
- Replacing `useOpenAITranslation` or changing browser WebRTC behavior - _Reason: browser translation is stable and should remain separate._
- Persisting audio, translated transcripts, provider payloads, or evaluation results - _Reason: privacy posture requires transient media and local-only outputs._
- Multi-instance scaling, shared queues, or media-worker deployment - _Reason: this spike scopes a decision, not production infrastructure._
- Automated live provider tests - _Reason: this session must remain offline and budget-independent._

---

## 5. Technical Approach

### Architecture

Use a documentation-first spike with one main decision document under `docs/ongoing-projects/`. The document should describe a future bridge as an isolated backend sidecar shape: source adapter, audio normalizer, OpenAI translation WebSocket session, output adapter, observability boundary, and cleanup controller. The bridge remains a future option and must not be imported into the default Express app path.

The OpenAI docs checked during planning indicate that browser apps should keep using WebRTC, while backend media pipelines can use WebSockets when the server already receives raw audio. A server-side bridge would connect directly to `wss://api.openai.com/v1/realtime/translations?model=gpt-realtime-translate`, send `session.update` with target language and optional source transcription, append base64 24 kHz PCM16 audio continuously, include silence between phrases, and handle translated audio deltas plus transcript events. The implementation session should verify these details again before writing the final document.

Validation should be lightweight and offline. If a test is added, it should check that the decision document includes required headings, current OpenAI source links, explicit no-runtime-wiring language, security constraints, and a recommendation section. It should not inspect private media, start servers, call OpenAI, or depend on the `EXAMPLE/` directory at runtime.

### Design Patterns

- Decision record as contract: Capture the recommendation and future session shape in a durable document.
- Boundary-first architecture: Separate source adapters, translation session management, output adapters, and observability.
- No default runtime wiring: Keep the spike out of Express route registration and provider UI.
- Sanitized observability: Record stable categories and timings, never raw audio, transcripts, provider bodies, credentials, cookies, or authorization headers.
- Offline validation: Use tests only to prevent docs drift, not to prove live translation quality.

### Technology Stack

- Markdown under `docs/ongoing-projects/`.
- Optional Vitest validation under `src/test/`.
- Existing Node.js filesystem APIs for offline validation.
- Current Express and React translation code as architecture references only.
- Official OpenAI live translation docs and cookbook guidance as protocol sources.

---

## 6. Deliverables

### Files to Create

| File                                                                                          | Purpose                                                                                      | Est. Lines |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- |
| `docs/ongoing-projects/raw-audio-bridge-spike.md`                                             | Raw-audio bridge decision note, comparison, protocol constraints, risks, and recommendation. | ~260       |
| `src/test/rawAudioBridgeDocs.test.ts`                                                         | Offline validation for required decision-doc sections, source links, and guardrail language. | ~110       |
| `.spec_system/specs/phase05-session03-backend-raw-audio-bridge-spike/implementation-notes.md` | Records implementation decisions, documents checked, commands run, and final recommendation. | ~80        |
| `.spec_system/specs/phase05-session03-backend-raw-audio-bridge-spike/security-compliance.md`  | Records security, privacy, GDPR, and residual-risk review for the raw-audio bridge decision. | ~90        |

### Files to Modify

| File                   | Changes                                                                                     | Est. Lines |
| ---------------------- | ------------------------------------------------------------------------------------------- | ---------- |
| `docs/ARCHITECTURE.md` | Add a short pointer to the raw-audio bridge spike as future translation media architecture. | ~15        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] The spike does not affect the default translation UI, browser WebRTC hook, provider tabs, or server route registration.
- [ ] The decision note states concrete audio format, sample-rate, chunking, buffering, VAD, silence-tail, cleanup, and error-handling constraints.
- [ ] The comparison clearly distinguishes browser WebRTC translation from server-side raw-audio WebSocket translation.
- [ ] The security posture keeps OpenAI API keys, raw provider payloads, raw audio, and raw transcripts out of browser-visible state and committed artifacts.
- [ ] The final recommendation is specific enough to scope a future 2-4 hour implementation session or to defer the path.

### Testing Requirements

- [ ] Offline validation confirms required decision-doc sections and guardrails are present.
- [ ] No live OpenAI API calls, media capture, SIP, Twilio, or browser automation are required.
- [ ] Manual review confirms the architecture pointer does not imply that raw-audio support is shipped.

### Non-Functional Requirements

- [ ] No persistent personal data store is introduced.
- [ ] No new runtime dependency is added.
- [ ] No raw audio, transcript, provider body, API key, cookie, authorization header, or SDP is logged or committed.
- [ ] Process-local rate limiting and current CSP residual risks are acknowledged where relevant.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Documentation uses current project paths and commands.

---

## 8. Implementation Notes

### Key Considerations

- The official OpenAI cookbook guidance checked during planning says browser apps should use WebRTC, while backend media pipelines can use WebSockets when the server already receives raw audio.
- The same guidance states that backend raw-audio translation expects base64 little-endian PCM16 at 24 kHz through `session.input_audio_buffer.append`, including silence between spoken phrases.
- The Twilio reference demonstrates u-law 8 kHz input converted to 24 kHz PCM16, then converted back to u-law for telephony output. Treat this as a future adapter pattern, not a production dependency.
- The `mtg-realtime-translator` reference is useful for local VAD, pre-roll, silence-tail, and low-latency chunking ideas, but its language list and desktop runtime should not be copied into this web app.
- The bridge should be planned as a server-side option for sources the browser cannot represent as WebRTC tracks, not as a replacement for the current browser translation tab.

### Potential Challenges

- Protocol volatility: Mitigate by re-checking official OpenAI docs during implementation and linking exact sources in the decision note.
- Scope creep into telephony: Mitigate by documenting Twilio and SIP as future adapter examples while deferring production routes to Session 04 or later.
- Media privacy: Mitigate by explicitly prohibiting raw media persistence, transcript storage, provider body logging, and committed local recordings.
- Latency and buffering tradeoffs: Mitigate by documenting chunk duration, queue limits, backpressure behavior, silence-tail handling, and drop/close rules before implementation.
- False confidence from docs-only work: Mitigate by making the recommendation explicit about what is proven, what is inferred, and what needs a future prototype.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before finalizing endpoint, event, model, or audio-format assertions.
- [P02] **Translation protocol separation**: Do not reuse normal OpenAI voice-agent prompts, tools, `response.create`, assistant turns, or conversation-state assumptions.
- [P03] **Single-stop cleanup path**: Future bridge design should define one guarded shutdown path for sockets, source streams, output streams, queues, timers, and adapter resources.
- [P04] **Route-safe diagnostics**: Browser-visible or operator-visible failures should use stable category/code metadata and sanitized summaries only.
- [P01] **Process-local rate limiting**: The bridge decision must not present current rate limiting as globally enforced for multi-instance media ingestion.
- [P01-S02] **CSP still keeps provider compatibility allowances**: CSP tightening remains separate from backend raw-audio design unless a future browser-facing surface is added.

---

## 9. Testing Strategy

### Unit Tests

- Add `src/test/rawAudioBridgeDocs.test.ts` to read `docs/ongoing-projects/raw-audio-bridge-spike.md` and assert required sections exist.
- Assert the document includes OpenAI source links, no-default-runtime language, security/privacy guardrails, and an explicit recommendation section.
- Assert the document does not claim that SIP, Twilio, room fanout, or raw-audio UI support is shipped.

### Integration Tests

- No runtime integration tests are required because this session does not add a route, source adapter, provider UI, or live media pipeline.

### Manual Testing

- Review the decision note against `server/routes/openai.js`, `src/hooks/useOpenAITranslation.ts`, and `src/lib/openaiTranslation.ts` to confirm it preserves the browser WebRTC path.
- Review the OpenAI docs links and local `EXAMPLE/` references used by the recommendation.
- Confirm the architecture doc pointer describes the bridge as future architecture only.

### Edge Cases

- Source adapter receives 8 kHz u-law telephony media instead of 24 kHz PCM16.
- Source adapter receives irregular chunks, silence-only chunks, or no final speech stop.
- Output adapter cannot keep up with translated audio deltas.
- Translation WebSocket opens but `session.update` fails.
- Cleanup runs after source disconnect, OpenAI socket close, output adapter failure, or process shutdown.
- A future prototype accidentally logs raw media, transcripts, provider bodies, or credentials.

---

## 10. Dependencies

### External Libraries

- None for this session.

### Other Sessions

- **Depends on**: `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session05-audio-mix-and-export-controls`, `phase04-session01-lifecycle-reliability`, `phase04-session02-error-states-and-diagnostics`, `phase05-session01-production-safety-and-usage-controls`, `phase05-session02-evaluation-harness-and-sample-workflow`
- **Depended by**: `phase05-session04-room-telephony-translation-architecture`, future raw-audio bridge prototype or implementation sessions

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
