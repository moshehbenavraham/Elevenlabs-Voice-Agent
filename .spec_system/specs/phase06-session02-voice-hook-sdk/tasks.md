# Task Checklist

**Session ID**: `phase06-session02-voice-hook-sdk`
**Total Tasks**: 18
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-31

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0602]` = Session reference (Phase 06, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (2 tasks)

Initial verification and environment preparation.

- [x] T001 [S0602] Verify retell-client-js-sdk v2.0.7 installed and backend endpoint exists (`package.json`, `server/routes/retell.js`)
- [x] T002 [S0602] Verify VITE_RETELL_ENABLED environment variable pattern exists (`.env.example`)

---

## Foundation (5 tasks)

Core type definitions for Retell integration.

- [x] T003 [S0602] Create `src/types/retell.ts` with file header and imports
- [x] T004 [S0602] [P] Define RetellCallStatus enum mapping to unified states (idle, connecting, connected, error) (`src/types/retell.ts`)
- [x] T005 [S0602] [P] Define RetellMessageRole and RetellTranscriptType enums (`src/types/retell.ts`)
- [x] T006 [S0602] [P] Define RetellTranscript, RetellUpdatePayload, and RetellMessage interfaces (`src/types/retell.ts`)
- [x] T007 [S0602] Define RetellVoiceState and RetellVoiceHookReturn interfaces (`src/types/retell.ts`)

---

## Implementation (8 tasks)

Main hook implementation with SDK integration.

- [x] T008 [S0602] Create `src/hooks/useRetellVoice.ts` with file header, imports, and SDK client initialization (`src/hooks/useRetellVoice.ts`)
- [x] T009 [S0602] Initialize hook state variables (callStatus, agentSpeaking, messages, error) (`src/hooks/useRetellVoice.ts`)
- [x] T010 [S0602] Implement useRef pattern for transcript accumulation to avoid stale closures (`src/hooks/useRetellVoice.ts`)
- [x] T011 [S0602] Implement call lifecycle event handlers (call_started, call_ended) (`src/hooks/useRetellVoice.ts`)
- [x] T012 [S0602] Implement agent speaking event handlers (agent_start_talking, agent_stop_talking) (`src/hooks/useRetellVoice.ts`)
- [x] T013 [S0602] Implement update event handler with local transcript accumulation beyond 5-sentence limit (`src/hooks/useRetellVoice.ts`)
- [x] T014 [S0602] Implement error event handler with state mapping (`src/hooks/useRetellVoice.ts`)
- [x] T015 [S0602] Implement startCall(), stopCall(), toggleCall() control functions with backend token fetch (`src/hooks/useRetellVoice.ts`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T016 [S0602] Run TypeScript compilation and ESLint - verify no errors (`npm run build`)
- [x] T017 [S0602] Validate ASCII encoding on all created files
- [x] T018 [S0602] Update implementation-notes.md with session outcomes and learnings

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] TypeScript strict mode passes
- [x] ESLint passes (warnings acceptable per MVP config)
- [x] All files ASCII-encoded
- [x] Unix LF line endings
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T004, T005, T006 can be worked on simultaneously as they define independent enum/interface groups.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003 must complete before T004-T007 (file must exist)
- T007 must complete before T008 (types needed for hook)
- T008 must complete before T009-T015 (file/scaffold must exist)
- T009-T014 can partially overlap once state variables are defined
- T015 depends on T009-T014 (needs state setters)
- T016 depends on all implementation tasks

### Key Implementation Patterns

**useRef for Transcript Accumulation**:
The SDK's update event callback must avoid stale closures. Use `useRef` to hold the current messages array, updating it in the callback and syncing to state.

**Local Transcript Tracking**:
SDK only provides last 5 sentences. Track locally by:

1. Comparing new transcript content with last seen
2. Extracting new sentences and appending to local history
3. Using message index/offset to avoid duplicates

**State Mapping**:

- `idle` = No active call, ready to start
- `connecting` = Token fetched, SDK connecting
- `connected` = call_started received
- `error` = Error event received or token fetch failed

---

## Next Steps

Run `/implement` to begin AI-led implementation.
