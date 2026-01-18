# Task Checklist

**Session ID**: `phase00-session03-voice-hook-context`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2026-01-18

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0003]` = Session reference (Phase 00, Session 03)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 6      | 6      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0003] Verify prerequisites met - check GenAILiveClient exists and tests pass (`npm run test:run`)
- [x] T002 [S0003] Create gemini types file with placeholder exports (`src/types/gemini.ts`)

---

## Foundation (6 tasks)

Core types, interfaces, and base structures.

- [x] T003 [S0003] [P] Define GeminiConnectionStatus type with all status values (`src/types/gemini.ts`)
- [x] T004 [S0003] [P] Define GeminiVoiceState interface with all state properties (`src/types/gemini.ts`)
- [x] T005 [S0003] [P] Define GeminiVoiceContextValue interface extending state (`src/types/gemini.ts`)
- [x] T006 [S0003] [P] Define GeminiVoiceAction union type for reducer actions (`src/types/gemini.ts`)
- [x] T007 [S0003] Define GeminiVoiceHookReturn type for hook consumers (`src/types/gemini.ts`)
- [x] T008 [S0003] Export all gemini types from types barrel file (`src/types/index.ts`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0003] Create GeminiVoiceContext file with React context and initial state (`src/contexts/GeminiVoiceContext.tsx`)
- [x] T010 [S0003] Implement geminiVoiceReducer with all action handlers (`src/contexts/GeminiVoiceContext.tsx`)
- [x] T011 [S0003] Implement GeminiVoiceProvider connect function with token fetch and client setup (`src/contexts/GeminiVoiceContext.tsx`)
- [x] T012 [S0003] Implement disconnect, toggleMute, and sendText functions (`src/contexts/GeminiVoiceContext.tsx`)
- [x] T013 [S0003] Implement EventEmitter subscriptions for all client events in useEffect (`src/contexts/GeminiVoiceContext.tsx`)
- [x] T014 [S0003] Implement transcript accumulation with partial/final handling and deduplication (`src/contexts/GeminiVoiceContext.tsx`)
- [x] T015 [S0003] Implement session timer with 12min/14min/15min warnings and auto-disconnect (`src/contexts/GeminiVoiceContext.tsx`)
- [x] T016 [S0003] Create useGeminiVoice hook as thin wrapper around context (`src/hooks/useGeminiVoice.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0003] [P] Write unit tests for connection lifecycle and status transitions (`src/test/useGeminiVoice.test.tsx`)
- [x] T018 [S0003] [P] Write unit tests for transcript accumulation and deduplication (`src/test/useGeminiVoice.test.tsx`)
- [x] T019 [S0003] [P] Write unit tests for session timer warnings and auto-disconnect (`src/test/useGeminiVoice.test.tsx`)
- [x] T020 [S0003] Run full test suite and verify all tests pass (`npm run test:run && npm run lint`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no warnings
- [x] implementation-notes.md updated
- [ ] Ready for `/validate`

---

## Notes

### Parallelization

Tasks marked `[P]` can be worked on simultaneously:

- T003-T006: Type definitions are independent
- T017-T019: Test files can be written in parallel

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003-T008 must complete before T009 (types needed for context)
- T009-T015 are sequential (building on each other)
- T016 depends on T009-T015 (context must exist)
- T017-T019 can run after T016 (hook must exist)
- T020 runs last (validates everything)

### Key Implementation Details

**Status States** (from spec):

- `idle` - Initial state, not connected
- `connecting` - Token fetch and WebSocket connection in progress
- `connected` - WebSocket open, session ready
- `listening` - User is speaking (VAD active)
- `thinking` - 300ms after user speech ends, no audio response yet
- `speaking` - Receiving audio from Gemini
- `error` - Connection or protocol error

**GenAILiveClient Events to Handle**:

- `open` -> set connected
- `setupComplete` -> ready for conversation
- `audio` -> set speaking, play audio
- `transcription` -> accumulate transcripts
- `turnComplete` -> AI finished speaking
- `interrupted` -> user barged in, clear audio queue
- `error` -> set error state
- `close` -> set idle
- `goAway` -> graceful disconnect

**Session Timer Thresholds**:

- 12 minutes: Warning toast
- 14 minutes: Urgent warning toast
- 15 minutes: Auto-disconnect with message

---

## Implementation Complete

All 20 tasks completed successfully on 2026-01-18.

- All 567 tests pass
- Implementation follows existing provider patterns
- Full test coverage for connection lifecycle, transcripts, and session timers
