# Session Specification

**Session ID**: `phase05-session04-room-telephony-translation-architecture`
**Phase**: 05 - Production Extensions and Media Variants
**Status**: Complete
**Created**: 2026-05-12

---

## 1. Session Overview

This session creates the room and telephony translation architecture plan for future media variants. It follows the completed browser translation MVP, production safety controls, evaluation workflow, and raw-audio bridge spike. The goal is to document how SIP, telephony, room media workers, and listener-language fanout could work without making those paths part of the default app.

The work is documentation-led. It should compare concrete topology options, state the security and cost implications of each option, and recommend whether a later implementation phase should build, defer, or reject room or telephony translation. No production webhook, SIP handler, Twilio route, LiveKit integration, or room UI should be shipped by this session.

This plan also closes the dependency from the raw-audio bridge spike. Session 03 recommended preserving browser WebRTC as the shipped default path while treating backend raw-audio ingestion as an optional future sidecar. Session 04 applies that boundary to room and telephony designs so future work can be estimated without expanding runtime scope now.

---

## 2. Objectives

1. Re-check current official OpenAI realtime translation guidance and relevant Twilio, SIP, and room/media-worker reference material before making architecture assertions.
2. Document topology options for telephony calls, rooms, speakers, listeners, and target-language fanout.
3. Define security, privacy, cost, rate-limit, lifecycle, and cleanup guardrails for each recommended topology.
4. Produce a clear build, defer, or reject recommendation with future implementation scope small enough for a later 2-4 hour session.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides the browser WebRTC translation runtime that remains the shipped default path.
- [x] `phase03-session05-audio-mix-and-export-controls` - Provides the browser translation control and artifact baseline that room/telephony work must not replace.
- [x] `phase04-session01-lifecycle-reliability` - Provides the cleanup model for peer connections, tracks, channels, timers, and provider switching.
- [x] `phase04-session02-error-states-and-diagnostics` - Provides the current translation error mapping and diagnostics posture.
- [x] `phase05-session01-production-safety-and-usage-controls` - Provides session duration controls and sanitized lifecycle telemetry constraints.
- [x] `phase05-session02-evaluation-harness-and-sample-workflow` - Provides repeatable evaluation criteria for any future media variant.
- [x] `phase05-session03-backend-raw-audio-bridge-spike` - Provides the backend raw-audio bridge recommendation and sidecar boundary.

### Required Tools/Knowledge

- Current official OpenAI realtime translation documentation and cookbook examples.
- Twilio Media Streams, SIP/RTP, and room/media-worker reference patterns as architecture inputs only.
- Existing docs under `docs/OPENAI_REALTIME.md`, `docs/OPENAI_TRANSLATION_DEMO.md`, and `docs/ongoing-projects/raw-audio-bridge-spike.md`.
- Vitest documentation validation pattern from `src/test/rawAudioBridgeDocs.test.ts`.

### Environment Requirements

- No live OpenAI, Twilio, SIP, or room provider credentials are required.
- No production webhook endpoints or runtime dependencies are introduced.
- All new or modified files use ASCII-only characters and Unix LF line endings.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can compare future call, room, listener, speaker, and target-language session topologies - create one architecture decision document under `docs/ongoing-projects/`.
- Future implementer can see where request signature validation, caller allow-lists, room authorization, target-language validation, and webhook verification belong - include a security checklist in the decision document.
- Maintainer can evaluate one-session-per-direction, one-session-per-speaker-language, and one-session-per-listener-language tradeoffs - include a topology comparison covering latency, cost, rate limits, cleanup, and failure isolation.
- Operator can understand deployment risks before any future prototype - document process-local rate-limit caveats, CSP posture, observability boundaries, and no-storage privacy rules.
- Future planning can estimate implementation scope - add a recommendation and scoped next steps for a later phase.
- Test suite can catch documentation drift - add one focused Vitest docs test similar to the raw-audio bridge docs test.

### Out of Scope (Deferred)

- Shipping SIP, Twilio, LiveKit, or room translation integrations - _Reason: this session is architecture-only and must not create production runtime paths._
- Adding webhook endpoints that accept live carrier traffic - _Reason: webhook security, caller policy, and provider account setup need a dedicated implementation session._
- Adding multi-user accounts, room membership, billing, or tenant policy - _Reason: the master PRD excludes account and tenant management._
- Reworking the existing browser translation UI around room concepts - _Reason: browser WebRTC translation remains the shipped default path._
- Moving API keys, raw audio, transcripts, cookies, authorization headers, or provider payloads into persistent storage - _Reason: current privacy posture requires transient media and sanitized telemetry only._

---

## 5. Technical Approach

### Architecture

Use a documentation-first architecture decision record under `docs/ongoing-projects/room-telephony-translation-architecture.md`. The document should model future media variants as optional sidecars around the existing browser translation product: source adapter, authorization boundary, audio normalizer, OpenAI translation session manager, output adapter, observability boundary, and cleanup controller.

The design must distinguish browser-held media from server-held media. Browser microphone, browser-tab, or browser-accessible room tracks should continue to use the current WebRTC translation path. Telephony, SIP, carrier streams, broadcast ingest, or backend room media workers may justify backend raw-audio bridging only when the server already receives media and can enforce caller, room, and provider boundaries.

The session should not register routes, add provider SDKs, or import future room code into the default app. A small docs test should assert that the architecture doc keeps source links, required sections, security guardrails, topology names, and not-shipped language visible.

### Design Patterns

- Decision document: Capture options, tradeoffs, and recommendation without runtime scope creep.
- Boundary-first architecture: Separate source authorization, media normalization, translation session management, output delivery, and telemetry.
- Explicit not-shipped guardrails: State that room, telephony, SIP, LiveKit, and Twilio support are future architecture only.
- Offline validation: Use tests to prevent docs drift and avoid live provider calls.

### Technology Stack

- Markdown documentation in `docs/ongoing-projects/`.
- React 19, TypeScript 6, Express 5, and current translation code as architecture references only.
- OpenAI `gpt-realtime-translate`, `/v1/realtime/translations`, and WebRTC/WebSocket translation contracts as protocol references after re-check.
- Vitest 4.1.5 for docs validation.

---

## 6. Deliverables

### Files to Create

| File                                                                                                   | Purpose                                                                                                                       | Est. Lines |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `docs/ongoing-projects/room-telephony-translation-architecture.md`                                     | Architecture decision document with topology comparison, security checklist, lifecycle model, cost notes, and recommendation. | ~340       |
| `src/test/roomTelephonyArchitectureDocs.test.ts`                                                       | Offline docs validation for required sections, source links, not-shipped claims, topology terms, and security guardrails.     | ~130       |
| `.spec_system/specs/phase05-session04-room-telephony-translation-architecture/implementation-notes.md` | Records documents checked, reference assets reviewed, commands run, decisions, and final recommendation.                      | ~90        |
| `.spec_system/specs/phase05-session04-room-telephony-translation-architecture/security-compliance.md`  | Records security, privacy, GDPR, and residual-risk review for the architecture-only session.                                  | ~90        |

### Files to Modify

| File                   | Changes                                                                                                        | Est. Lines |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| `docs/ARCHITECTURE.md` | Add a short pointer to the room/telephony architecture document as future translation media architecture only. | ~15        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Architecture options are concrete enough to estimate later implementation work.
- [ ] The topology comparison covers one-session-per-direction, one-session-per-speaker-language, and one-session-per-listener-language approaches.
- [ ] Security and cost implications are stated for each recommended topology.
- [ ] The recommendation clearly says build, defer, or reject for future room/telephony translation work.
- [ ] No runtime dependency, webhook route, provider SDK, or default UI path is introduced.

### Testing Requirements

- [ ] Focused docs validation test is written and passing.
- [ ] Targeted Vitest command runs successfully for the docs validation test.
- [ ] ASCII encoding checks pass for new and modified artifacts.
- [ ] Manual review confirms not-shipped language is explicit.

### Non-Functional Requirements

- [ ] Current `OPENAI_API_KEY` server-only boundary remains unchanged.
- [ ] No raw audio, transcript text, provider payloads, cookies, authorization headers, or SDP bodies are persisted or recommended for logs.
- [ ] Process-local rate limiting and CSP residual risks are clearly reflected in the future architecture posture.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Documentation follows project conventions and stays under the intended runtime scope.

---

## 8. Implementation Notes

### Key Considerations

- Session 03 raw-audio findings recommend future backend ingestion only for media paths that already deliver server-side raw audio.
- Browser translation should remain the default path for microphone, browser-tab, and browser-accessible media tracks.
- Room and telephony designs can multiply OpenAI translation sessions quickly; the plan must quantify session fanout and cleanup burden.
- Reference assets should be treated as patterns only, not copied into the app as runtime dependencies.

### Potential Challenges

- Endpoint volatility: Mitigate by making re-checking current official docs the first implementation task and recording checked dates.
- Scope creep into production telephony: Mitigate with explicit no-route, no-provider-SDK, and not-shipped guardrails in both docs and tests.
- Cost under fanout: Mitigate by comparing topologies with session count formulas and rate-limit implications.
- Security boundary complexity: Mitigate by separating carrier webhook verification, room authorization, source adapter policy, OpenAI session custody, and output delivery.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before finalizing endpoint, event, model, or audio-format assertions.
- [P02] **Translation protocol separation**: Do not reuse prompt, tool, or `response.create` assumptions from the existing OpenAI voice-agent provider.
- [P01] **Process-local rate limiting**: Treat current limiter posture as insufficient for multi-instance telephony or room fanout.
- [P01-S01] **Rate limiting is process-local**: Future webhook or room traffic needs platform-level or shared-store protection before production use.
- [P01-S02] **CSP still keeps provider compatibility allowances**: CSP tightening remains separate and must be tested provider by provider if a future browser-facing room UI is added.
- [P03] **Single-stop cleanup path**: Apply one guarded cleanup controller to source adapters, translation sessions, output adapters, queues, timers, and metrics handles.

---

## 9. Testing Strategy

### Unit Tests

- Add `src/test/roomTelephonyArchitectureDocs.test.ts` to read the decision document and architecture pointer.
- Assert required headings, source links, topology names, security guardrails, recommendation terms, and not-shipped disclaimers.
- Assert the docs do not claim that SIP, Twilio, LiveKit, room fanout, or telephony translation support is shipped.

### Integration Tests

- None required. This session must not add runtime routes, providers, webhooks, or UI paths.

### Manual Testing

- Manually review the architecture document for concrete enough topology diagrams or text flows, cost/rate-limit implications, and security boundary clarity.
- Manually review `docs/ARCHITECTURE.md` to confirm the pointer describes future architecture only.

### Edge Cases

- One speaker translated to many listener languages.
- Many speakers translated to one shared target language.
- Caller identity cannot be verified or is not on an allow-list.
- Room participant leaves while translation sessions are still producing output.
- Translation session fails after source media has already started.
- Output adapter stalls or disconnects while source media continues.
- Process restarts while carrier or room provider still considers a session active.

---

## 10. Dependencies

### External Libraries

- None added. Existing Vitest dependency is used for docs validation.

### Other Sessions

- **Depends on**: `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session05-audio-mix-and-export-controls`, `phase04-session01-lifecycle-reliability`, `phase04-session02-error-states-and-diagnostics`, `phase05-session01-production-safety-and-usage-controls`, `phase05-session02-evaluation-harness-and-sample-workflow`, `phase05-session03-backend-raw-audio-bridge-spike`
- **Depended by**: `phase05-session05-external-subtitle-overlay-assessment`, future telephony, SIP, LiveKit, room media worker, or backend raw-audio bridge implementation sessions

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
