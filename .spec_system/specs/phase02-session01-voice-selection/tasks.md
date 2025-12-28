# Task Checklist

**Session ID**: `phase02-session01-voice-selection`
**Total Tasks**: 22
**Estimated Duration**: 7-9 hours
**Created**: 2025-12-28

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0201]` = Session reference (Phase 02, Session 01)
- `TNNN` = Task ID

---

## Progress Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Setup | 3 | 3 | 0 |
| Foundation | 5 | 5 | 0 |
| Implementation | 10 | 10 | 0 |
| Testing | 4 | 4 | 0 |
| **Total** | **22** | **22** | **0** |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0201] Verify prerequisites met (Phase 01 complete, Radix UI Select available)
- [x] T002 [S0201] Review existing context patterns in OpenAIVoiceContext.tsx and XAIVoiceContext.tsx
- [x] T003 [S0201] Review existing localStorage persistence pattern from ThemeContext.tsx

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0201] Create voice configuration types and interfaces (`src/lib/voiceConfig.ts`)
- [x] T005 [S0201] Define OPENAI_VOICES constant array with all 8 voice options (`src/lib/voiceConfig.ts`)
- [x] T006 [S0201] Define XAI_VOICES constant array with compatible voice options (`src/lib/voiceConfig.ts`)
- [x] T007 [S0201] Add localStorage helper functions for voice persistence (`src/lib/voiceConfig.ts`)
- [x] T008 [S0201] Create VoiceSelector component skeleton with Radix UI Select (`src/components/voice/VoiceSelector.tsx`)

---

## Implementation (10 tasks)

Main feature implementation.

- [x] T009 [S0201] Implement VoiceSelector UI with glassmorphism styling (`src/components/voice/VoiceSelector.tsx`)
- [x] T010 [S0201] Add disabled state handling to VoiceSelector for active connections (`src/components/voice/VoiceSelector.tsx`)
- [x] T011 [S0201] Add selectedVoice state to OpenAIVoiceContext with localStorage initialization (`src/contexts/OpenAIVoiceContext.tsx`)
- [x] T012 [S0201] Add setVoice action and localStorage persistence to OpenAIVoiceContext (`src/contexts/OpenAIVoiceContext.tsx`)
- [x] T013 [S0201] Update OpenAI session.update message to use selectedVoice (`src/contexts/OpenAIVoiceContext.tsx`)
- [x] T014 [S0201] [P] Add selectedVoice state to XAIVoiceContext with localStorage initialization (`src/contexts/XAIVoiceContext.tsx`)
- [x] T015 [S0201] [P] Add setVoice action and localStorage persistence to XAIVoiceContext (`src/contexts/XAIVoiceContext.tsx`)
- [x] T016 [S0201] [P] Update xAI session.update message to use selectedVoice (`src/contexts/XAIVoiceContext.tsx`)
- [x] T017 [S0201] Integrate VoiceSelector into OpenAIProvider tab UI (`src/components/providers/OpenAIProvider.tsx`)
- [x] T018 [S0201] Integrate VoiceSelector into XAIProvider tab UI (`src/components/providers/XAIProvider.tsx`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T019 [S0201] [P] Write unit tests for VoiceSelector component (`src/test/VoiceSelector.test.tsx`)
- [x] T020 [S0201] [P] Write unit tests for voiceConfig utilities (`src/test/voiceConfig.test.ts`)
- [x] T021 [S0201] Run lint, build, and test suite to verify no errors or warnings
- [x] T022 [S0201] Manual testing: voice selection, persistence, and conversation verification

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing (`npm run test:run`) - 103 tests pass
- [x] Build passes (`npm run build`)
- [x] Lint passes (`npm run lint`) - 0 errors in src/, warnings only
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization Opportunities
- T014, T015, T016 (xAI context changes) can run in parallel after OpenAI pattern is established
- T019, T020 (unit tests) can be written in parallel

### Task Timing
Target ~20-25 minutes per task.

### Dependencies
- T009, T010 depend on T008 (VoiceSelector skeleton)
- T011-T13 must be sequential (OpenAI context changes)
- T14-T16 can parallel after T11-T13 establish pattern
- T17 depends on T09-T13 (OpenAI implementation complete)
- T18 depends on T09, T10, T14-T16 (xAI implementation complete)

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/voiceConfig.ts` | Voice types, constants, helpers |
| `src/components/voice/VoiceSelector.tsx` | Reusable dropdown component |
| `src/contexts/OpenAIVoiceContext.tsx` | OpenAI voice state management |
| `src/contexts/XAIVoiceContext.tsx` | xAI voice state management |
| `src/components/providers/OpenAIProvider.tsx` | OpenAI tab UI integration |
| `src/components/providers/XAIProvider.tsx` | xAI tab UI integration |

---

## Next Steps

Run `/implement` to begin AI-led implementation.
