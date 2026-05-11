# Session Specification

**Session ID**: `phase04-session01-lifecycle-reliability`
**Phase**: 04 - Hardening, Quality, and Demo Readiness
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session starts Phase 04 by hardening the OpenAI live translation lifecycle before adding broader diagnostics, coverage, E2E smoke tests, or documentation. Phase 03 delivered a usable browser translation MVP with source capture, WebRTC startup, translated audio playback, transcripts, audio mix controls, export, and max-session auto-stop. The next risk is reliability under repeated demos: start and stop can be triggered by manual controls, auto-stop, source track ending, failed startup, unmount, and provider switching.

The work focuses on one deterministic cleanup path. Captured source tracks, track-ended listeners, peer connections, data channels, remote streams, abort controllers, timers, audio elements, and pending promises must have clear ownership and must be released exactly once. The session should preserve the existing UI and protocol shape while removing races and making retry-after-failure behavior dependable.

This is intentionally a foundation session for the rest of Phase 04. Session 02 can only build accurate user-facing diagnostics if lifecycle states are stable. Sessions 03 and 04 can only add durable test coverage if the cleanup contracts are explicit and mockable.

---

## 2. Objectives

1. Make translation start, stop, failed-start, provider-switch, source-ended, and unmount paths use one guarded lifecycle model.
2. Clarify source-stream ownership so media tracks and listeners are released once and in the correct order.
3. Preserve retryable UI state after token, capture, SDP, peer-connection, data-channel, or cleanup failures.
4. Add focused lifecycle regression coverage for duplicate triggers, cleanup ordering, and provider-switch teardown.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides the WebRTC translation runtime, data-channel handling, translated audio stream, and runtime cleanup.
- [x] `phase03-session02-source-capture-modes` - Provides microphone and browser-tab source capture, permission errors, missing-track handling, and track-ended listeners.
- [x] `phase03-session03-translation-tab-ui-mvp` - Provides the translation provider screen, source/language controls, and start/stop control surface.
- [x] `phase03-session04-transcript-and-caption-experience` - Provides transcript state, clear controls, and caption rendering that must survive lifecycle changes.
- [x] `phase03-session05-audio-mix-and-export-controls` - Provides audio elements, max-session auto-stop, export controls, and provider stop wiring.

### Required Tools/Knowledge

- React 19 hooks, refs, effects, callback identity, and cleanup semantics.
- TypeScript 6 strict typing for exported hook and helper contracts.
- Browser media ownership patterns for `MediaStream`, `MediaStreamTrack`, and track event listeners.
- WebRTC resource behavior for `RTCPeerConnection`, `RTCDataChannel`, senders, remote streams, and SDP failure paths.
- Existing Vitest and React Testing Library patterns for fake media streams, fake peer connections, fake timers, and provider mocks.

### Environment Requirements

- Node.js and npm dependencies installed.
- Tests must use local mocks and never request real microphone, tab-audio, browser permissions, OpenAI credentials, or OpenAI network calls.
- Official OpenAI realtime translation docs must be re-checked before changing endpoint, SDP, or event contracts. This session should avoid protocol changes unless a lifecycle bug requires them.

---

## 4. Scope

### In Scope (MVP)

- Translation demo user can start only one session at a time - Duplicate start triggers while capture or runtime startup is pending must return without creating competing sessions.
- Translation demo user can stop safely from any active or pending state - Manual stop, auto-stop, source-ended, unmount, and provider-switch cleanup must share the same guarded path.
- Translation demo user can retry after failed startup - Failed capture, token, SDP, WebRTC, data-channel, or cleanup paths must leave the provider ready for a later start when recoverable.
- Maintainer can reason about media ownership - Source hook, runtime hook, provider, and audio player must have clear responsibility for stopping tracks, detaching listeners, and clearing streams.
- Maintainer can verify cleanup ordering - Tests must cover listener removal before track stop, duplicate stop safety, abort handling, and partial startup cleanup.
- Existing provider behavior remains stable - Non-translation provider switching, status toasts, and provider availability rules must not regress.

### Out of Scope (Deferred)

- New diagnostic taxonomy and rewritten user-facing error copy - _Reason: Session 02 owns diagnostics after lifecycle contracts stabilize._
- Broad unit, integration, or route coverage expansion - _Reason: Session 03 owns wider coverage after this session defines cleanup contracts._
- Browser-level Playwright smoke flows - _Reason: Session 04 owns E2E and browser smoke tests._
- Documentation updates beyond implementation notes - _Reason: Session 05 owns docs and demo configuration._
- OpenAI translation protocol changes - _Reason: Phase 04 should harden existing behavior; protocol changes need a docs re-check and narrow justification._
- Production shared rate limiting or CSP hardening - _Reason: Existing P01 residual findings remain out of this lifecycle-focused session._

---

## 5. Technical Approach

### Architecture

Keep the existing split between source capture, translation runtime, and provider orchestration. `useOpenAITranslationSource` should remain the owner of browser-captured source streams and track listeners. `useOpenAITranslation` should own WebRTC runtime resources, remote translated audio, data channel callbacks, abort controllers, and transcript state. `OpenAITranslationProvider` should orchestrate start/stop reasons and expose the provider-switch stop callback without becoming the owner of low-level media resources.

The main hardening work is to make ownership explicit in code paths and tests. Runtime cleanup should not stop source tracks that are still owned by the source hook unless a future caller deliberately transfers ownership. Source cleanup should detach `ended` listeners before stopping tracks. Provider cleanup should route manual stop, auto-stop, source-ended, failed start, unmount, and provider-switch requests through one promise-guarded stop function with a stable end reason.

Partial startup cleanup needs special attention. If client-secret creation, SDP exchange, peer-connection setup, data-channel setup, or remote-stream attachment fails, all acquired resources for that operation should close and the operation token should prevent stale async callbacks from mutating state. A later retry should begin from a predictable idle or error state without leaked streams, listeners, abort controllers, or timers.

### Design Patterns

- Hook-owned resource boundaries: Keep source resources in the source hook and runtime resources in the runtime hook.
- Operation tokens: Use monotonically increasing operation ids to ignore stale async callbacks after stop, retry, unmount, or provider switch.
- Promise guards: Reuse the same in-flight stop promise and reject duplicate start attempts while start or stop is pending.
- Cleanup ordering: Detach event listeners before stopping tracks, close channels before peer connections, abort pending requests before clearing resource refs.
- Retryable terminal states: Preserve typed errors but leave controls and state ready for recoverable retry paths.
- Focused regression tests: Extend existing hook and provider tests with fake resources that can assert cleanup order and call counts.

### Technology Stack

- React 19.2.6
- TypeScript 6.0.3
- Vite 8.0.11
- Tailwind CSS 4.3.0
- lucide-react 1.14.0
- Vitest 4.1.5 and React Testing Library 16.3.2

---

## 6. Deliverables

### Files to Create

| File         | Purpose                                                                           | Est. Lines |
| ------------ | --------------------------------------------------------------------------------- | ---------- |
| None planned | This session hardens existing lifecycle hooks, provider orchestration, and tests. | 0          |

### Files to Modify

| File                                                     | Changes                                                                                                                                                  | Est. Lines |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/types/openai-translation.ts`                        | Clarify lifecycle, ownership, stop reason, or cleanup result contracts if needed.                                                                        | ~40        |
| `src/lib/openaiTranslation.ts`                           | Add or refine lifecycle helper predicates, cleanup error creation, or status helpers if needed.                                                          | ~80        |
| `src/hooks/useOpenAITranslation.ts`                      | Harden runtime start/stop guards, partial startup cleanup, abort handling, data-channel cleanup, peer-connection cleanup, and source ownership behavior. | ~180       |
| `src/hooks/useOpenAITranslationSource.ts`                | Harden source capture cleanup ordering, duplicate capture/stop behavior, track-ended handling, reset, and unmount cleanup.                               | ~140       |
| `src/components/providers/OpenAITranslationProvider.tsx` | Route manual stop, auto-stop, source-ended, provider-switch, failed-start, and retry paths through one guarded provider lifecycle.                       | ~180       |
| `src/pages/Index.tsx`                                    | Preserve provider-switch cleanup for OpenAI Translation and avoid duplicate switch-trigger teardown.                                                     | ~50        |
| `src/test/useOpenAITranslation.test.tsx`                 | Add runtime lifecycle regressions for duplicate start/stop, partial startup failure, abort, data channel, and peer cleanup.                              | ~220       |
| `src/test/useOpenAITranslationSource.test.tsx`           | Add source lifecycle regressions for listener removal, track stop ordering, duplicate capture, source-ended, stop, reset, and unmount.                   | ~180       |
| `src/test/OpenAITranslationProvider.test.tsx`            | Add provider lifecycle regressions for stop reasons, source-ended, auto-stop, failed-start retry, and provider-switch cleanup.                           | ~220       |
| `src/test/Index.test.tsx`                                | Add or update provider switching coverage if the cleanup callback behavior changes.                                                                      | ~80        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Calling start while capture or runtime startup is pending cannot create competing source streams, peer connections, data channels, or abort controllers.
- [ ] Calling stop more than once returns the same in-flight stop operation or exits safely without duplicate cleanup side effects.
- [ ] Provider switching, source-ended events, max-session auto-stop, manual stop, and unmount all use the same guarded cleanup path.
- [ ] Failed capture, client-secret, SDP, peer-connection, data-channel, or cleanup paths close acquired resources and leave the user able to retry where recoverable.
- [ ] Source track listeners are removed before source tracks are stopped so stale `ended` events do not trigger duplicate cleanup.
- [ ] Source-stream ownership between source hook and runtime hook is explicit and does not double-stop browser-owned tracks.
- [ ] Existing non-translation provider switching behavior is not regressed.

### Testing Requirements

- [ ] Runtime hook tests cover duplicate start, duplicate stop, failed client-secret, failed SDP, peer failure, data-channel failure, abort, and unmount cleanup.
- [ ] Source hook tests cover duplicate capture, missing audio tracks, track-ended cleanup, listener removal before stop, stop, reset, and unmount cleanup.
- [ ] Provider tests cover manual stop, auto-stop, source-ended stop, failed-start retry, provider-switch stop callback, and stable UI state.
- [ ] Tests use local mocks only and never make real media or OpenAI calls.

### Non-Functional Requirements

- [ ] No server-side API key or raw upstream payload is exposed to browser-visible state.
- [ ] Cleanup work is idempotent and bounded; no unbounded timers, listeners, object URLs, streams, peer connections, data channels, or abort controllers remain after stop/unmount.
- [ ] Translation controls remain keyboard and screen-reader usable during pending, stopped, error, and retryable states.
- [ ] The OpenAI live translation protocol stays separate from normal OpenAI voice-agent turns, prompts, tools, and `response.create`.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] `npm run test:run -- src/test/useOpenAITranslation.test.tsx src/test/useOpenAITranslationSource.test.tsx src/test/OpenAITranslationProvider.test.tsx src/test/Index.test.tsx` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## 8. Implementation Notes

### Key Considerations

- Do not change OpenAI translation endpoints, SDP endpoint paths, client-secret contracts, or data-channel event names unless a lifecycle bug requires it and official docs have been re-checked.
- Keep source hook ownership clear. The source hook currently owns browser-captured streams and track listeners; runtime cleanup should not race it by stopping those tracks first.
- Keep `stopRef` in `Index.tsx` aligned with the latest active translation stop callback so provider switching always uses the current session cleanup path.
- Preserve typed errors and recoverability flags so Session 02 can build diagnostics without reverse-engineering lifecycle state.
- Avoid adding new dependencies. Fake media and WebRTC resources in tests should stay local to the relevant test files.

### Potential Challenges

- Source-ended events can fire during cleanup if listeners remain attached while tracks are stopped: detach listeners before stopping tracks and assert this in tests.
- Auto-stop and manual stop can race: reuse one stop promise and keep the end reason stable once cleanup starts.
- Failed startup can acquire only some resources: cleanup must handle partially initialized peer connections, data channels, remote streams, source senders, and abort controllers.
- React unmount can occur while async startup continues: operation ids and mounted refs must prevent stale setState calls.
- Provider switching can be triggered from the tab control while controls are busy: switch handling must await cleanup without firing duplicate teardown.

### Relevant Considerations

- [P03] **Single-stop cleanup path**: Apply the same guarded path to auto-stop, manual stop, source-ended, unmount, and provider-switch cleanup.
- [P03] **Hook-owned resource boundaries**: Keep peer connection, data channel, remote stream, source tracks, abort controller, and timers under explicit hook ownership.
- [P03] **Explicit in-flight guards**: Preserve duplicate start, stop, and clear protection while async work is pending.
- [P03] **Media listener cleanup before stop**: Remove `ended` listeners before stopping source tracks.
- [P03] **Stable provider-switch stop handler**: Keep provider switching aligned with the active translation stop callback.
- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before protocol-specific changes.
- [P02] **Translation protocol separation**: Do not reuse prompt, tool, assistant turn, or `response.create` assumptions from the existing OpenAI provider.
- [P01-S01] **Rate limiting is process-local**: This session must not weaken token-route protection or treat frontend lifecycle guards as production rate limiting.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Do not tighten browser media or connection directives in this lifecycle session.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- Start, stop, and provider-switch actions are state-mutating and must prevent duplicate triggers while in-flight.
- Source capture, WebRTC setup, data-channel callbacks, timers, and audio elements acquire resources that need cleanup on scope exit.
- Failed startup touches external systems and must handle timeout, abort, retry/backoff, and failure-path cleanup without leaking provider payloads.
- Provider and source contexts are revisitable and must reset or revalidate state on re-entry.
- Interactive controls must keep platform-appropriate accessibility labels, disabled states, focus behavior, and input support while pending or stopped.

---

## 9. Testing Strategy

### Unit Tests

- Verify `useOpenAITranslation` prevents duplicate starts while capture/runtime startup is pending and prevents duplicate stop cleanup while stopping.
- Verify client-secret, SDP, peer-connection, data-channel, parser, abort, and cleanup failures release acquired runtime resources.
- Verify source ownership options do not double-stop source tracks when the source hook remains the owner.
- Verify `useOpenAITranslationSource` removes `ended` listeners before stopping tracks on stop, reset, replacement capture, track-ended, and unmount.

### Integration Tests

- Mock `useOpenAITranslation`, `useOpenAITranslationSource`, fake timers, and provider switching in provider tests.
- Verify manual stop, auto-stop, source-ended, and provider-switch calls route through the same stop function and settle with stable end reasons.
- Verify failed source capture or runtime startup clears pending state and allows a later start.
- Verify provider switching awaits OpenAI Translation cleanup without regressing other provider switch paths.

### Manual Testing

- Open the app with `VITE_OPENAI_TRANSLATION_ENABLED=true` and select the OpenAI Translation tab.
- Start and stop microphone translation repeatedly, including double-clicking Start and Stop.
- Start browser-tab capture, stop it from the browser share UI, then confirm the app reaches a stopped or retryable state.
- Switch away from OpenAI Translation during a pending or active translation and confirm the old session is cleaned up before the new provider is active.
- Configure a short max-session duration and confirm auto-stop uses the same cleanup path as the Stop button.

### Edge Cases

- Start is clicked twice while the permission prompt is open.
- Stop is clicked while client-secret creation or SDP exchange is pending.
- The selected display source has no audio track.
- A source track ends while manual stop is already in progress.
- Auto-stop fires at the same time the user clicks Stop.
- Provider switch happens during active startup, active translation, stopped state, and error state.
- Peer connection creation succeeds but offer creation, local description, SDP exchange, or remote description fails.
- Data channel closes or errors immediately after connection.
- Component unmounts while async startup continues.

---

## 10. Dependencies

### External Libraries

- React: 19.2.6
- TypeScript: 6.0.3
- Vite: 8.0.11
- Vitest: 4.1.5
- React Testing Library: 16.3.2
- Playwright: 1.59.1, only if manual browser smoke verification needs the existing E2E setup

### Other Sessions

- **Depends on**: `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session02-source-capture-modes`, `phase03-session03-translation-tab-ui-mvp`, `phase03-session04-transcript-and-caption-experience`, `phase03-session05-audio-mix-and-export-controls`
- **Depended by**: `phase04-session02-error-states-and-diagnostics`, `phase04-session03-unit-and-integration-coverage`, `phase04-session04-e2e-and-browser-smoke-tests`, `phase04-session05-documentation-and-demo-configuration`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
