# Session Specification

**Session ID**: `phase03-session02-source-capture-modes`
**Phase**: 03 - Browser Translation MVP
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session adds the media source acquisition layer for the OpenAI Translation tab. Phase 03 Session 01 already created the reusable WebRTC translation hook that accepts a caller-provided audio `MediaStream`; this session creates the browser capture hook that supplies that stream from microphone input or browser-tab audio.

The work focuses on browser media behavior that can make or break the translation demo: unsupported APIs, permission denial, capture cancellation, missing tab audio tracks, source track ending, duplicate capture attempts, and deterministic cleanup. The result should be a typed source-capture contract that Session 03 can wire into the provider UI without needing to know low-level media-device details.

This session does not build the final translation screen or start the WebRTC translation call from UI controls. It prepares the source-mode runtime, error metadata, and capability-aware scaffold updates needed for the next session to connect source capture to `useOpenAITranslation`.

---

## 2. Objectives

1. Create a typed `useOpenAITranslationSource` contract for microphone and browser-tab audio capture.
2. Implement capability detection and capture options for `getUserMedia()` and `getDisplayMedia()`.
3. Map unsupported APIs, permission denial, cancellation, device failures, missing audio tracks, and track-ended events to stable user-facing error metadata.
4. Prove idempotent cleanup for owned source streams, tracks, event listeners, and repeated stop/reset calls.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides the WebRTC translation hook contract that accepts a caller-owned or transferred source `MediaStream`.
- [x] `phase02-session02-shared-translation-config-library` - Provides shared translation types and helper patterns that this session extends.
- [x] `phase02-session03-provider-tab-scaffold` - Provides the OpenAI Translation provider scaffold that will expose source mode readiness.
- [x] `phase02-session04-backend-and-config-tests` - Provides the current frontend test setup and translation helper test patterns.

### Required Tools/Knowledge

- Browser media APIs: `navigator.mediaDevices.getUserMedia`, `navigator.mediaDevices.getDisplayMedia`, `MediaStream`, and `MediaStreamTrack`.
- React 19 hook cleanup, stable callback identities, and refs for resource ownership.
- Current provider scaffold and existing Vitest/jsdom media-device mocking patterns.
- Existing toast/error presentation conventions and accessibility expectations from `PRD_UX.md`.

### Environment Requirements

- Node.js and npm available locally.
- Vitest and jsdom available through the repository test setup.
- Real browser media capture requires a secure context; automated tests must use mocks and never prompt for real devices.
- All created or modified files must remain ASCII-only with Unix LF line endings.

---

## 4. Scope

### In Scope (MVP)

- Translation demo user can acquire microphone audio for quick translation tests - Implement `getUserMedia({ audio: true })` capture through a reusable hook action.
- Translation demo user can acquire browser-tab audio for listen-along translation - Implement `getDisplayMedia()` capture with audio-requesting display-media options.
- Translation demo user can see why capture cannot start - Detect unsupported media APIs and map permission, cancellation, device, and missing-audio-track failures to actionable error state.
- Translation demo user can recover when capture ends externally - Listen for source track `ended` events and expose an ended state that Session 03 can use to stop translation.
- Maintainer can rely on source cleanup - Stop every owned track and remove every listener on stop, reset, capture replacement, and unmount.
- Maintainer can test capture behavior without live devices - Add deterministic mocks and tests for source-mode capture, errors, track-ended behavior, and cleanup.
- Provider UI can reflect source-mode readiness without starting capture - Update the scaffold to use the shared source metadata while keeping permission prompts behind explicit actions in later sessions.

### Out of Scope (Deferred)

- Starting the WebRTC translation call from the provider screen - _Reason: Session 03 owns start/stop lifecycle integration between source capture and `useOpenAITranslation`._
- Full translation provider layout and responsive controls - _Reason: Session 03 owns the usable provider screen._
- Transcript rendering, latest captions, clearing, and export - _Reason: Sessions 04 and 05 own transcript and artifact behavior._
- Original/translated audio mix sliders and max-session timer - _Reason: Session 05 owns audio mix and timing controls._
- Backend raw-audio, telephony, room, or extension capture sources - _Reason: Later phases evaluate non-browser-tab media variants._

---

## 5. Technical Approach

### Architecture

Add `src/hooks/useOpenAITranslationSource.ts` as the browser media-source boundary for translation. The hook should expose source capabilities, current mode, current stream, status, typed error, and memoized actions for microphone capture, browser-tab capture, stop, and reset. It should not call the backend route or the translation WebRTC hook directly; Session 03 will compose both hooks.

Extend `src/types/openai-translation.ts` with source modes, source status, source error kinds, source capability shape, and hook result types. Keep pure source-mode metadata, display-media option building, media error mapping, and capability helpers in `src/lib/openaiTranslation.ts` where they can be tested without React.

The hook should request capture only inside explicit action callbacks. On each successful capture, it should verify that at least one audio track exists, attach `ended` listeners to all owned tracks, expose the stream with `ownsSourceStream: true` semantics for the WebRTC hook, and clean up any previous stream first. If browser-tab capture returns no audio track, the hook should stop every returned track before surfacing a missing-audio-track error.

### Design Patterns

- Hook owns media resources: Centralize stream, track, listener, and capture-request lifecycle in one hook.
- Pure helper functions: Keep option construction and error mapping deterministic and testable.
- Typed state machine: Use explicit statuses instead of loosely coupled booleans.
- Idempotent teardown: Make stop/reset/unmount safe after partial capture failures and repeated calls.
- Permission boundary discipline: Never request media permissions on render or capability checks.

### Technology Stack

- React 19 hooks and TypeScript 6.
- Browser media-device APIs from DOM typings.
- Existing translation helpers in `src/lib/openaiTranslation.ts`.
- Existing Vitest 4 and React Testing Library setup.

---

## 6. Deliverables

### Files to Create

| File                                                                                | Purpose                                                                                                                   | Est. Lines |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/hooks/useOpenAITranslationSource.ts`                                           | Reusable hook for microphone/tab source capture, capability state, errors, track-ended events, and cleanup                | ~280       |
| `src/test/useOpenAITranslationSource.test.tsx`                                      | Hook tests with mocked media devices, streams, tracks, errors, missing tracks, track-ended events, and cleanup assertions | ~300       |
| `.spec_system/specs/phase03-session02-source-capture-modes/implementation-notes.md` | Implementation notes, verification evidence, and deferred follow-ups                                                      | ~120       |

### Files to Modify

| File                                                     | Changes                                                                                                                    | Est. Lines |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/types/openai-translation.ts`                        | Add source capture modes, statuses, capability, error, source result, and hook result types                                | ~120       |
| `src/types/index.ts`                                     | Re-export source capture contracts                                                                                         | ~10        |
| `src/lib/openaiTranslation.ts`                           | Add source-mode metadata, display-media options, capability helpers, and media error mapping                               | ~160       |
| `src/test/openaiTranslation.test.ts`                     | Add pure helper coverage for source metadata, options, capability, and media error mapping                                 | ~100       |
| `src/components/providers/OpenAITranslationProvider.tsx` | Replace hardcoded deferred source metadata with shared source-mode readiness metadata while keeping runtime start deferred | ~80        |
| `src/test/OpenAITranslationProvider.test.tsx`            | Update scaffold assertions for shared source metadata and no media prompt on render                                        | ~80        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Source hook exposes microphone and browser-tab source modes with typed capability state.
- [ ] Microphone capture returns a usable audio stream when permission is granted.
- [ ] Browser-tab capture returns a usable stream only when at least one audio track exists.
- [ ] Unsupported APIs, permission denial, cancellation, device failure, and missing audio tracks produce stable typed error state.
- [ ] Track-ended events move the source hook to an ended state and expose the ended mode.
- [ ] Stop, reset, capture replacement, and unmount stop owned tracks and remove listeners.
- [ ] Provider scaffold uses shared source-mode metadata without requesting permissions on render.

### Testing Requirements

- [ ] Pure helper tests cover source metadata, display-media option construction, capability detection, and media error mapping.
- [ ] Source hook tests cover microphone success, tab-audio success, unsupported APIs, permission denial, cancellation, device failure, missing audio tracks, duplicate capture prevention, track-ended handling, repeated stop, reset, and unmount cleanup.
- [ ] Provider scaffold tests prove render does not call `getUserMedia()` or `getDisplayMedia()`.
- [ ] `npm run test:run -- src/test/openaiTranslation.test.ts src/test/useOpenAITranslationSource.test.tsx src/test/OpenAITranslationProvider.test.tsx` passes.
- [ ] `npm run type-check`, `npm run lint`, and `npm run build` pass or exact blockers are recorded.

### Non-Functional Requirements

- [ ] No real browser permission prompts or live media devices are used in automated tests.
- [ ] No raw audio is persisted, serialized, logged, or sent outside the browser by source capture code.
- [ ] Capture actions are explicit user-triggered calls; render and capability checks never request permissions.
- [ ] No new runtime dependency is added unless unavoidable and justified.
- [ ] Cleanup remains deterministic under React Strict Mode double-invocation patterns.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Exported functions have explicit return types.
- [ ] No unhandled capture promises, dangling track listeners, or orphaned media tracks.

---

## 8. Implementation Notes

### Key Considerations

- Source acquisition is deliberately separate from the WebRTC translation hook. This keeps media permission handling isolated and lets Session 03 compose the source stream into `useOpenAITranslation`.
- Browser-tab capture behavior varies by browser and share target. A successful display-media prompt can still return no audio tracks, and that must be treated as a recoverable user-facing error after cleaning up returned tracks.
- The hook should expose `ownsSourceStream: true` or equivalent metadata so the translation hook can stop transferred source tracks when the provider session stops.
- Capability detection should be conservative. It can identify missing APIs, but it must not imply that permission will be granted or that the selected tab/screen will include audio.
- Provider scaffold changes should not turn on a full UI flow. The next session owns the final source selector, target selector, start/stop wiring, and translated audio element.

### Potential Challenges

- Media APIs are incomplete in jsdom: Mitigate with narrow media-device, stream, and track fakes in the source hook test file.
- Browser errors are inconsistently named: Mitigate with an error mapper that handles common DOMException names and has a stable fallback.
- Track-ended events can fire during cleanup: Mitigate by removing listeners before stopping tracks and guarding state updates by active capture ID.
- Duplicate capture calls can race: Mitigate with a start promise/capture operation ref and duplicate-trigger prevention while in-flight.

### Relevant Considerations

- [P02] **Translation teardown coverage**: This session covers the source-track part of Phase 03 teardown and must make cleanup idempotent.
- [P02] **Translation protocol separation**: Source capture must stay independent from OpenAI voice-agent assumptions and from translation SDP/session startup.
- [P02] **Pure helper module**: Use side-effect-free helpers for mode metadata, options, capability, and error mapping where practical.
- [P01-S02] **CSP still keeps provider compatibility allowances**: This session does not change CSP, but browser capture behavior should remain compatible with the current production security posture.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Permission or cancellation failures may leave the UI stuck in a requesting state without actionable recovery.
- Browser-tab capture may return no audio track and leak a video/display track unless cleanup runs before surfacing the error.
- Source tracks may end externally or be replaced while a capture action is still resolving, causing stale state or leaked listeners.

---

## 9. Testing Strategy

### Unit Tests

- Extend `src/test/openaiTranslation.test.ts` for source-mode metadata, display-media option construction, capability detection from mocked media-device objects, and media error mapping for common DOMException names.
- Keep pure helper tests independent from React and real browser media APIs.

### Integration Tests

- Add `src/test/useOpenAITranslationSource.test.tsx` with React Testing Library `renderHook`.
- Stub `navigator.mediaDevices.getUserMedia`, `navigator.mediaDevices.getDisplayMedia`, `MediaStream`, and `MediaStreamTrack` behavior required by the hook.
- Assert status transitions, mode selection, stream exposure, missing-track cleanup, duplicate-trigger prevention, track-ended handling, repeated stop, reset, and unmount cleanup.

### Manual Testing

- Review the hook API from the perspective of Session 03: the provider screen should be able to select a mode, request capture, pass the resulting stream to `useOpenAITranslation`, stop capture on provider switch, and show error metadata without understanding media-device internals.
- If run in a real browser during implementation, manually confirm microphone permission prompts only happen after the capture action and that display capture handles the no-audio-track case.

### Edge Cases

- Missing `navigator.mediaDevices`, missing `getUserMedia`, missing `getDisplayMedia`, denied microphone permission, display capture cancellation, device-not-found errors, display stream with no audio tracks, stream with ended audio track, duplicate capture while requesting, capture replacement while active, stop before capture resolves, reset after error, unmount during capture, and track-ended firing during cleanup.

---

## 10. Dependencies

### External Libraries

- React: existing hook runtime.
- Vitest: existing unit and integration test runner.
- React Testing Library: existing hook/component test utilities.
- Browser media APIs: no new npm dependency planned.

### Internal Modules

- `src/hooks/useOpenAITranslation.ts`: Existing WebRTC hook that will consume the source stream in Session 03.
- `src/hooks/useOpenAITranslationSource.ts`: New source capture hook.
- `src/lib/openaiTranslation.ts`: Shared constants and helper functions.
- `src/types/openai-translation.ts`: Shared translation and source-capture contracts.
- `src/components/providers/OpenAITranslationProvider.tsx`: Translation scaffold that should reflect source-mode readiness without starting capture.

### Other Sessions

- **Depends on**: `phase03-session01-reusable-webrtc-translation-hook`, `phase02-session02-shared-translation-config-library`, `phase02-session03-provider-tab-scaffold`, `phase02-session04-backend-and-config-tests`
- **Depended by**: `phase03-session03-translation-tab-ui-mvp`, `phase03-session04-transcript-and-caption-experience`, `phase03-session05-audio-mix-and-export-controls`, and Phase 04 hardening sessions

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
