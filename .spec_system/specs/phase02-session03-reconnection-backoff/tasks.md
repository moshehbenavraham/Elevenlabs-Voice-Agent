# Task Checklist

**Session ID**: `phase02-session03-reconnection-backoff`
**Total Tasks**: 22
**Estimated Duration**: 7-9 hours
**Created**: 2025-12-28

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0203]` = Session reference (Phase 02, Session 03)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 6      | 6      | 0         |
| Implementation | 8      | 8      | 0         |
| Integration    | 3      | 3      | 0         |
| Testing        | 5      | 5      | 0         |
| **Total**      | **25** | **25** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0203] Verify prerequisites met - check xAI and OpenAI contexts exist and test environment works
- [x] T002 [S0203] Review existing WebSocket close event handling in XAIVoiceContext.tsx
- [x] T003 [S0203] Review existing WebSocket close event handling in OpenAIVoiceContext.tsx

---

## Foundation (6 tasks)

Core structures and base implementations.

- [x] T004 [S0203] Define TypeScript interfaces for reconnection state (`ReconnectionState`, `ReconnectionConfig`) (`src/hooks/useReconnection.ts`)
- [x] T005 [S0203] Implement `calculateBackoff` function with exponential delay and max cap (`src/hooks/useReconnection.ts`)
- [x] T006 [S0203] Implement `addJitter` function with 0-30% variability (`src/hooks/useReconnection.ts`)
- [x] T007 [S0203] Implement `shouldReconnect` function to check WebSocket close codes (`src/hooks/useReconnection.ts`)
- [x] T008 [S0203] Implement core `useReconnection` hook with state machine (IDLE/CONNECTED/DISCONNECTED/RECONNECTING/MAX_RETRIES) (`src/hooks/useReconnection.ts`)
- [x] T009 [S0203] Add network status detection (online/offline events) to useReconnection hook (`src/hooks/useReconnection.ts`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T010 [S0203] Create ReconnectionStatus component skeleton with props interface (`src/components/voice/ReconnectionStatus.tsx`)
- [x] T011 [S0203] Implement reconnecting state UI with attempt count and countdown timer (`src/components/voice/ReconnectionStatus.tsx`)
- [x] T012 [S0203] Implement max retries exceeded UI with manual reconnect button (`src/components/voice/ReconnectionStatus.tsx`)
- [x] T013 [S0203] Add network offline indicator to ReconnectionStatus (`src/components/voice/ReconnectionStatus.tsx`)
- [x] T014 [S0203] Integrate useReconnection hook into XAIVoiceContext (`src/contexts/XAIVoiceContext.tsx`)
- [x] T015 [S0203] Add fresh token fetch on reconnect attempt in XAIVoiceContext (`src/contexts/XAIVoiceContext.tsx`)
- [x] T016 [S0203] Integrate useReconnection hook into OpenAIVoiceContext (`src/contexts/OpenAIVoiceContext.tsx`)
- [x] T017 [S0203] Add fresh ephemeral token fetch on reconnect attempt in OpenAIVoiceContext (`src/contexts/OpenAIVoiceContext.tsx`)

---

## Integration (3 tasks)

Wire up components and finalize integration.

- [x] T018 [S0203] Import and render ReconnectionStatus in VoiceStatus component (`src/components/voice/VoiceStatus.tsx`)
- [x] T019 [S0203] Handle provider switching during reconnection - abort reconnect if provider changed (`src/contexts/XAIVoiceContext.tsx`, `src/contexts/OpenAIVoiceContext.tsx`)
- [x] T020 [S0203] Add timer cleanup on intentional disconnect to prevent stale reconnection attempts (`src/hooks/useReconnection.ts`)

---

## Testing (5 tasks)

Verification and quality assurance.

- [x] T021 [S0203] [P] Write unit tests for calculateBackoff and addJitter functions (`src/test/useReconnection.test.ts`)
- [x] T022 [S0203] [P] Write unit tests for shouldReconnect and state machine transitions (`src/test/useReconnection.test.ts`)
- [x] T023 [S0203] Run test suite and verify all tests passing (`npm run test:run`)
- [x] T024 [S0203] Run linter and fix any warnings (`npm run lint`)
- [x] T025 [S0203] Manual testing - disconnect network, verify auto-reconnect, test max retries, test manual reconnect

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

Tasks marked `[P]` can be worked on simultaneously. T021 and T022 are parallelizable test writing tasks.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T004-T009 must be completed sequentially (building the hook)
- T010-T013 can be done in parallel after T008
- T014-T017 depend on T008 completion
- T018 depends on T010-T013 completion
- T019-T020 are refinements that depend on T014-T017
- T021-T022 can run in parallel after T008

### Key Technical Details

- WebSocket close code 1000 = intentional (no reconnect)
- WebSocket close code 1006 = abnormal (trigger reconnect)
- Backoff: 1s, 2s, 4s, 8s, 16s, capped at 30s
- Jitter: 0-30% added to base delay
- Max retries: 5 attempts before giving up
- Use refs for retry count and timers to avoid stale closures

---

## Next Steps

Run `/implement` to begin AI-led implementation.
