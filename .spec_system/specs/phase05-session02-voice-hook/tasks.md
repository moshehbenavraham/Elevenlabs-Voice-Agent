# Task Checklist

**Session ID**: `phase05-session02-voice-hook`
**Total Tasks**: 18
**Estimated Duration**: 6-7 hours
**Created**: 2025-12-31

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0502]` = Session reference (Phase 05, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 6      | 6      | 0         |
| Implementation | 7      | 7      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0502] Verify Vapi SDK installed and CSP configured from Session 01
- [x] T002 [S0502] Review reference implementation patterns in VAPI_EXAMPLE/

---

## Foundation (6 tasks)

Core types, enums, and interface definitions.

- [x] T003 [S0502] [P] Create message type enum - TRANSCRIPT, FUNCTION_CALL, FUNCTION_CALL_RESULT (`src/types/vapi.ts`)
- [x] T004 [S0502] [P] Create message role enum - USER, SYSTEM, ASSISTANT (`src/types/vapi.ts`)
- [x] T005 [S0502] [P] Create transcript type enum - PARTIAL, FINAL (`src/types/vapi.ts`)
- [x] T006 [S0502] Define TranscriptMessage interface with discriminated union (`src/types/vapi.ts`)
- [x] T007 [S0502] Define FunctionCallMessage and FunctionCallResultMessage interfaces (`src/types/vapi.ts`)
- [x] T008 [S0502] Create VapiCallStatus enum and VapiVoiceState interface (`src/types/vapi.ts`)

---

## Implementation (7 tasks)

Main SDK singleton and hook implementation.

- [x] T009 [S0502] Create SDK singleton with web token initialization (`src/lib/vapi.ts`)
- [x] T010 [S0502] Initialize hook state variables - callStatus, isSpeechActive, messages, activeTranscript, audioLevel, error (`src/hooks/useVapiVoice.ts`)
- [x] T011 [S0502] [P] Implement call-start and call-end event handlers (`src/hooks/useVapiVoice.ts`)
- [x] T012 [S0502] [P] Implement speech-start and speech-end event handlers (`src/hooks/useVapiVoice.ts`)
- [x] T013 [S0502] [P] Implement volume-level event handler (`src/hooks/useVapiVoice.ts`)
- [x] T014 [S0502] Implement message event handler with partial/final transcript logic (`src/hooks/useVapiVoice.ts`)
- [x] T015 [S0502] Implement start(), stop(), toggleCall() functions with dual config support (`src/hooks/useVapiVoice.ts`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T016 [S0502] Add Vapi type exports to types barrel file (`src/types/index.ts`)
- [x] T017 [S0502] Run TypeScript compilation and fix any type errors
- [x] T018 [S0502] Run ESLint and verify no blocking errors

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All files ASCII-encoded
- [x] TypeScript compiles without errors
- [x] ESLint passes (warnings acceptable)
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T003-T005 (enums) and T011-T013 (event handlers) can be worked on simultaneously.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003-T008 must complete before T010-T015 (types needed for hook)
- T009 (SDK singleton) must complete before T010-T015 (hook imports SDK)
- T016 must complete after T003-T008 (exports require types to exist)

### Key Implementation Details

**SDK Singleton (T009)**

- Use `import.meta.env.VITE_VAPI_WEB_TOKEN` for public key
- Handle missing token gracefully (export null or throw)

**Partial vs Final Transcripts (T014)**

- `transcriptType: 'partial'` -> store in `activeTranscript`
- `transcriptType: 'final'` -> append to `messages`, clear `activeTranscript`

**Dual Config Support (T015)**

- `start(assistantId: string)` - use pre-created assistant
- `start(config: CreateAssistantDTO)` - inline configuration

---

## Next Steps

Run `/implement` to begin AI-led implementation.
