# Task Checklist

**Session ID**: `phase03-session03-elevenlabs-reconnection`
**Total Tasks**: 18
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-30

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0303]` = Session reference (Phase 03, Session 03)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Research       | 3      | 3      | 0         |
| Implementation | 7      | 7      | 0         |
| Testing        | 4      | 4      | 0         |
| Validation     | 2      | 2      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0303] Verify prerequisites met - check useReconnection hook exists, Playwright config, E2E test patterns (`src/hooks/useReconnection.ts`, `playwright.config.ts`)
- [x] T002 [S0303] Create RESEARCH.md file for SDK research findings (`.spec_system/specs/phase03-session03-elevenlabs-reconnection/RESEARCH.md`)

---

## Research (3 tasks)

SDK investigation and documentation.

- [x] T003 [S0303] Research ElevenLabs SDK useConversation hook - inspect onConnect, onDisconnect, onError callbacks for reconnection behavior
- [x] T004 [S0303] Investigate SDK WebSocket close code exposure - determine if SDK provides close code (1000 vs 1006) in onDisconnect
- [x] T005 [S0303] Document research findings and implementation decision in RESEARCH.md (`.spec_system/specs/phase03-session03-elevenlabs-reconnection/RESEARCH.md`)

---

## Implementation (7 tasks)

Main feature implementation.

- [x] T006 [S0303] Add reconnection state types to VoiceState interface (`src/contexts/VoiceContext.tsx`)
- [x] T007 [S0303] Add reconnection reducer actions and state transitions (`src/contexts/VoiceContext.tsx`)
- [x] T008 [S0303] Integrate useReconnection hook into VoiceProvider (`src/contexts/VoiceContext.tsx`)
- [x] T009 [S0303] Implement reconnect callback with fresh signed URL fetch (`src/contexts/VoiceContext.tsx`)
- [x] T010 [S0303] Handle intentional vs abnormal disconnect in onDisconnect callback (`src/contexts/VoiceContext.tsx`)
- [x] T011 [S0303] Add reconnection status display to VoiceStatus component (`src/components/voice/VoiceStatus.tsx`)
- [x] T012 [S0303] Export reconnection state from VoiceContext for UI consumption (`src/contexts/VoiceContext.tsx`)

---

## Testing (4 tasks)

E2E tests and verification.

- [x] T013 [S0303] [P] Create elevenlabs-reconnection.spec.ts with basic structure (`tests/e2e/error-handling/elevenlabs-reconnection.spec.ts`)
- [x] T014 [S0303] [P] Add E2E tests for automatic reconnection on abnormal disconnect (`tests/e2e/error-handling/elevenlabs-reconnection.spec.ts`)
- [x] T015 [S0303] [P] Add E2E tests for intentional disconnect - no reconnection (`tests/e2e/error-handling/elevenlabs-reconnection.spec.ts`)
- [x] T016 [S0303] Add E2E tests for max retries and manual reconnect (`tests/e2e/error-handling/elevenlabs-reconnection.spec.ts`)

---

## Validation (2 tasks)

Final verification and quality gates.

- [x] T017 [S0303] Run test suite and verify all tests pass (`npm run test:run && npm run lint && npm run build`)
- [x] T018 [S0303] Update implementation-notes.md with session summary (`.spec_system/specs/phase03-session03-elevenlabs-reconnection/implementation-notes.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T013-T015 are marked `[P]` and can be worked on simultaneously if desired.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003-T005 (Research) must complete before T006-T012 (Implementation)
- T006-T012 must complete before T017 (Validation)
- Research findings determine whether SDK handles reconnection natively or manual implementation needed

### Key Research Questions

1. Does `useConversation` auto-reconnect on connection loss?
2. What close code is provided in `onDisconnect` callback?
3. Can we distinguish intentional disconnect from abnormal disconnect?

### Implementation Strategy

Based on existing patterns in `XAIVoiceContext.tsx` and `OpenAIVoiceContext.tsx`:

- Use `useReconnection` hook for orchestration (timing, backoff, countdown)
- VoiceContext handles connection logic (signed URL fetch, SDK calls)
- Fresh signed URL required for each reconnect attempt

---

## Next Steps

Run `/implement` to begin AI-led implementation.
