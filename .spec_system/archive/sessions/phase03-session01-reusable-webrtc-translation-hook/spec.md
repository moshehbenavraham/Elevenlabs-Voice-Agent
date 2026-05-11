# Session Specification

**Session ID**: `phase03-session01-reusable-webrtc-translation-hook`
**Phase**: 03 - Browser Translation MVP
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session starts Phase 03 by implementing the reusable browser runtime that the OpenAI Translation provider UI will consume. Phase 02 already established the backend client-secret route, shared translation constants, supported output languages, feature flag, provider identity, and scaffolded tab. The next required piece is a hook that can take an existing audio source stream, start a `gpt-realtime-translate` WebRTC call, expose translated audio and transcript state, and stop cleanly.

The work intentionally keeps source acquisition and full provider UI out of scope. Microphone and browser-tab capture belong to Session 02, while the translation screen consumes this hook in Session 03. The hook contract created here must therefore be stable, typed, and testable without forcing the UI sessions to understand peer-connection internals.

The current OpenAI materials checked on 2026-05-11 confirm the shape this plan relies on: `gpt-realtime-translate` uses the dedicated realtime translation endpoint, WebRTC calls exchange SDP through a calls endpoint, translated audio arrives as a remote track, and non-audio events are handled through an `oai-events` data channel. This session plans around that protocol separation and avoids voice-agent assumptions such as prompts, tools, fixed voice selection, or `response.create`.

---

## 2. Objectives

1. Create `useOpenAITranslation` with typed start, stop, status, error, remote audio, and transcript state.
2. Implement the client-secret request and SDP exchange needed to start a realtime translation WebRTC call.
3. Parse known `oai-events` translation and transcript events without failing on unknown event types.
4. Prove idempotent cleanup for peer connections, data channels, senders, source tracks, remote streams, abort controllers, timers, and listeners.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session01-translation-api-contract-and-server-route` - Provides `POST /api/openai/translation-session` and sanitized client-secret responses.
- [x] `phase02-session02-shared-translation-config-library` - Provides supported target languages, endpoint constants, request builders, and session-update helpers.
- [x] `phase02-session03-provider-tab-scaffold` - Provides the feature-gated OpenAI Translation provider identity and placeholder UI branch.
- [x] `phase02-session04-backend-and-config-tests` - Provides backend route and shared config tests that protect the contracts this hook consumes.

### Required Tools/Knowledge

- React 19 hooks with cleanup in effect returns and stable callback identities.
- Browser WebRTC primitives: `RTCPeerConnection`, `RTCDataChannel`, `MediaStream`, `MediaStreamTrack`, and SDP offer/answer flow.
- Existing frontend API base URL conventions in `src/lib/apiConfig.ts` and translation request builders in `src/lib/openaiTranslation.ts`.
- Official OpenAI docs checked on 2026-05-11 for realtime WebRTC setup and `gpt-realtime-translate` endpoint/model behavior.

### Environment Requirements

- Node.js and npm available locally.
- Vitest and jsdom available through the existing repository test setup.
- No real OpenAI API calls in tests; network and WebRTC behavior must be mocked.
- All created or modified files must remain ASCII-only with Unix LF line endings.

---

## 4. Scope

### In Scope (MVP)

- Translation demo user can start a WebRTC translation call from an existing audio source stream - Implement a hook API that accepts caller-owned source media and target language.
- Translation demo user can receive translated audio - Expose a remote translated audio `MediaStream` created from `RTCPeerConnection.ontrack`.
- Translation demo user can see stable lifecycle state - Expose idle, requesting client secret, connecting, connected, stopping, stopped, and error states.
- Translation demo user can receive transcript deltas - Parse known data-channel events into source and translated transcript entries where available.
- Maintainer can verify cleanup - Make stop safe to call repeatedly and ensure all owned runtime resources are closed, aborted, stopped, or detached.
- Maintainer can verify error mapping - Map token route, SDP exchange, WebRTC, data-channel, transcript parse, and cleanup failures to typed hook errors.
- Maintainer can test without providers - Add mocks for fetch, peer connection, data channel, and media streams with no live OpenAI requests.

### Out of Scope (Deferred)

- Microphone and browser-tab media acquisition - _Reason: Phase 03 Session 02 owns source capture modes and permission handling._
- Full translation provider screen layout - _Reason: Phase 03 Session 03 owns source selector, language selector, start/stop controls, status UI, and audio element wiring._
- Transcript panel presentation and latest-caption layout - _Reason: Phase 03 Session 04 owns transcript and caption experience._
- Audio mix sliders, elapsed-time display, export controls, and max-session guard - _Reason: Phase 03 Session 05 owns mix and export controls._
- Production diagnostics expansion and E2E browser media coverage - _Reason: Phase 04 owns hardening and demo readiness._

---

## 5. Technical Approach

### Architecture

Add `src/hooks/useOpenAITranslation.ts` as the runtime boundary for browser translation. The hook should accept start options containing a source `MediaStream`, a supported target language, and optional runtime flags for input transcription/noise reduction if needed by the existing helper contracts. It should return current state, current error, transcript entries, translated audio stream, and memoized `start`, `stop`, and `reset` actions.

Keep protocol helpers in `src/lib/openaiTranslation.ts` when they are pure or easy to test outside React. That includes parsing data-channel events, normalizing transcript deltas, constructing stable error objects, and building request descriptors. Keep browser-resource ownership inside the hook so cleanup order is explicit: abort in-flight requests, close the data channel, remove listeners, close the peer connection, stop owned remote tracks, stop caller-provided source tracks only when the start option explicitly transfers ownership, clear timers, and reset refs.

The start path should call the existing backend route first, then create a peer connection, attach source audio tracks, create the `oai-events` data channel, create and set a local SDP offer, POST the SDP offer to the translation calls endpoint with the browser client secret, and set the remote SDP answer. All network and WebRTC failure points should route through typed error mapping and cleanup. Unknown data-channel events should be ignored or recorded as debug metadata without throwing.

### Design Patterns

- Hook owns browser runtime resources: Centralizes peer connection, data channel, abort controller, timers, remote stream, listeners, and cleanup refs.
- Pure parser helpers: Keep data-channel event parsing deterministic and testable without React or WebRTC.
- Typed state machine: Use explicit hook states instead of loosely coupled booleans.
- Idempotent teardown: Make `stop` and unmount cleanup safe after partial startup failures and repeated calls.
- External boundary mocks: Tests stub fetch, peer connection, data channel, and media streams instead of calling OpenAI or real browser media APIs.

### Technology Stack

- React 19 hooks and TypeScript 6.
- DOM WebRTC types from the existing TypeScript app config.
- Existing translation helpers in `src/lib/openaiTranslation.ts`.
- Existing Vitest 4 and React Testing Library setup.

---

## 6. Deliverables

### Files to Create

| File                                                                                            | Purpose                                                                                                                            | Est. Lines |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/hooks/useOpenAITranslation.ts`                                                             | Reusable hook for translation start/stop, WebRTC lifecycle, translated audio stream, transcript state, status, errors, and cleanup | ~320       |
| `src/test/useOpenAITranslation.test.tsx`                                                        | Hook tests with mocked fetch, peer connection, data channel, media streams, transcript events, and cleanup assertions              | ~280       |
| `.spec_system/specs/phase03-session01-reusable-webrtc-translation-hook/implementation-notes.md` | Implementation notes, verification evidence, edge cases, and any deferred follow-ups                                               | ~120       |

### Files to Modify

| File                                 | Changes                                                                                             | Est. Lines |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------- |
| `src/types/openai-translation.ts`    | Add hook status, error, transcript, event, start options, and hook result types                     | ~120       |
| `src/lib/openaiTranslation.ts`       | Add parser, runtime request, SDP exchange, and typed error helper functions where pure/testable     | ~180       |
| `src/test/openaiTranslation.test.ts` | Add parser and runtime helper coverage for known, unknown, malformed, and partial transcript events | ~120       |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Hook starts a translation call from an existing source media stream and supported target language.
- [ ] Hook requests a browser client secret only through `/api/openai/translation-session`.
- [ ] Hook exchanges SDP with the dedicated translation calls endpoint using the sanitized client secret.
- [ ] Hook exposes a translated remote audio stream when the peer connection receives remote audio.
- [ ] Hook parses recognized source and translated transcript events without throwing on unknown or malformed events.
- [ ] Hook maps token route, SDP exchange, WebRTC, data-channel, parser, and cleanup failures to stable typed error state.
- [ ] Calling `stop` repeatedly or unmounting after a partial start does not leak peer connections, data channels, tracks, abort controllers, timers, or listeners.

### Testing Requirements

- [ ] Parser helper tests cover known transcript deltas, unknown event types, malformed JSON, missing fields, partial entries, and final entries.
- [ ] Hook tests cover successful startup, client-secret failure, SDP failure, remote audio track handling, data-channel message handling, and duplicate start prevention.
- [ ] Hook tests cover repeated stop, unmount cleanup, partial-start cleanup, and source-track ownership behavior.
- [ ] `npm run test:run -- src/test/openaiTranslation.test.ts src/test/useOpenAITranslation.test.tsx` passes.
- [ ] `npm run type-check`, `npm run lint`, and `npm run build` pass or exact blockers are recorded.

### Non-Functional Requirements

- [ ] No real OpenAI API calls are made from tests.
- [ ] No server API key or raw upstream payload is exposed to frontend hook state.
- [ ] No new runtime dependency is added unless unavoidable and justified.
- [ ] Hook callbacks remain stable enough for provider UI components to consume without unnecessary reconnects.
- [ ] Cleanup remains deterministic under React Strict Mode double-invocation patterns.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Exported functions have explicit return types.
- [ ] No unbounded retries, dangling timers, or uncaught data-channel parse failures.

---

## 8. Implementation Notes

### Key Considerations

- OpenAI live translation is a separate protocol from the existing OpenAI voice-agent provider. Do not reuse prompt, tool, voice, assistant-turn, or `response.create` assumptions.
- The local backend route returns a sanitized client-secret shape. The hook should treat that route as the only browser-visible token boundary.
- The calls endpoint is an external browser request using the short-lived client secret. The hook must handle non-OK responses, invalid answer SDP, aborts, and network failures cleanly.
- Source media acquisition is intentionally not part of this session. The hook should accept a caller-provided `MediaStream` so Session 02 can plug in microphone and browser-tab capture later.
- Default behavior should avoid stopping caller-owned source tracks unless the caller explicitly opts into transfer of source ownership.

### Potential Challenges

- WebRTC is hard to test in jsdom: Mitigate with narrow peer-connection and data-channel fakes that implement only the methods and events the hook owns.
- Data-channel event names may evolve: Mitigate with tolerant parsing, explicit known-event handling, and ignored unknown event behavior.
- Startup can fail after some resources are allocated: Mitigate by routing every failure path through one cleanup function.
- React state updates after stop or unmount can race with async work: Mitigate with an active operation ID, abort controller, and mounted ref guards.
- Browser client secrets are short lived: Mitigate by requesting the secret immediately before SDP exchange and never caching it across starts.

### Relevant Considerations

- [P02] **Translation teardown coverage**: This session directly proves cleanup for peer connections, data channels, source tracks when owned, translated audio streams, abort controllers, timers, and listeners.
- [P02] **OpenAI translation endpoint volatility**: Keep endpoint and model constants centralized so future docs-driven updates fail in one obvious test location.
- [P02] **Translation protocol separation**: The hook must not call existing OpenAI voice-agent routes or send voice-agent fields.
- [P02] **Dedicated translation route isolation**: Consume the backend translation-session route as the sole client-secret boundary.
- [P01-S01] **Rate limiting is process-local**: This session relies on the existing strict token route limiter but does not solve multi-instance rate limiting.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Browser calls to OpenAI translation endpoints should remain compatible with the current production CSP posture and be revisited during hardening.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Duplicate start/stop triggers may create overlapping peer connections or close resources still needed by a newer operation.
- Partial startup failures may leave microphone/tab tracks, peer connections, data channels, remote streams, abort controllers, or timers alive.
- Malformed data-channel events may crash React state updates unless parsing and error mapping are defensive.

---

## 9. Testing Strategy

### Unit Tests

- Extend `src/test/openaiTranslation.test.ts` for pure runtime helpers: client-secret response narrowing if added, SDP request descriptor construction, known event parsing, unknown event handling, malformed JSON, partial transcript updates, final transcript entries, and typed error mapping.
- Keep tests deterministic and independent from real WebRTC or OpenAI network behavior.

### Integration Tests

- Add `src/test/useOpenAITranslation.test.tsx` using React Testing Library render hooks or a small test component.
- Stub `globalThis.fetch`, `RTCPeerConnection`, `RTCDataChannel`, `MediaStream`, and `MediaStreamTrack` behavior required by the hook.
- Assert startup order, status transitions, remote stream exposure, data-channel message handling, duplicate-trigger prevention, stop idempotency, and unmount cleanup.

### Manual Testing

- Inspect the hook API from the perspective of Sessions 02 and 03: source-capture code should be able to provide a stream, and provider UI should be able to render state, errors, audio, and transcript lines without knowing protocol internals.
- Review implementation notes for any OpenAI docs mismatch or browser API limitation found during implementation.

### Edge Cases

- Missing source stream, source stream with no audio tracks, unsupported target language, backend token failure, invalid client-secret response, calls endpoint failure, invalid answer SDP, peer-connection construction failure, data-channel parse failure, unknown event type, remote track without stream, repeated start while connecting, repeated stop, unmount during client-secret request, unmount during SDP exchange, and cleanup throwing from one resource while others still need cleanup.

---

## 10. Dependencies

### External Libraries

- React: existing hook runtime.
- Vitest: existing unit and integration test runner.
- React Testing Library: existing component/hook test utilities.
- Browser WebRTC APIs: no new npm dependency planned.

### Internal Modules

- `src/lib/openaiTranslation.ts`: Shared constants, supported language helpers, request builders, parser helpers, and endpoint metadata.
- `src/types/openai-translation.ts`: Translation types and hook contract types.
- `src/hooks/useOpenAITranslation.ts`: New reusable runtime hook.
- `src/test/openaiTranslation.test.ts`: Pure helper coverage.
- `src/test/useOpenAITranslation.test.tsx`: Hook runtime coverage.

### Other Sessions

- **Depends on**: `phase02-session01-translation-api-contract-and-server-route`, `phase02-session02-shared-translation-config-library`, `phase02-session03-provider-tab-scaffold`, `phase02-session04-backend-and-config-tests`
- **Depended by**: `phase03-session02-source-capture-modes`, `phase03-session03-translation-tab-ui-mvp`, `phase03-session04-transcript-and-caption-experience`, `phase03-session05-audio-mix-and-export-controls`, and Phase 04 hardening sessions

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
