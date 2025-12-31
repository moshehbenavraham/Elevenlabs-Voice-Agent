# Task Checklist

**Session ID**: `phase06-session03-provider-tab`
**Total Tasks**: 18
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-31

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0603]` = Session reference (Phase 06, Session 03)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 4      | 4      | 0         |
| Implementation | 9      | 9      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0603] Verify prerequisites met (useRetellVoice hook exists, backend endpoint exists)
- [x] T002 [S0603] Verify Retell types exist (`src/types/retell.ts` - RetellCallStatus, RetellMessage)

---

## Foundation (4 tasks)

Type system and context updates to register Retell as a provider.

- [x] T003 [S0603] [P] Add 'retell' to ProviderType union (`src/types/voice-provider.ts`)
- [x] T004 [S0603] [P] Add isRetellEnabled() function (`src/types/voice-provider.ts`)
- [x] T005 [S0603] Add PROVIDERS.retell entry with metadata (`src/types/voice-provider.ts`)
- [x] T006 [S0603] Update ProviderContext with 'retell' in providers array and isValidProvider (`src/contexts/ProviderContext.tsx`)

---

## Implementation (9 tasks)

RetellProvider component with button, status, and empty state subcomponents.

- [x] T007 [S0603] Create RetellProvider.tsx file with imports and types (`src/components/providers/RetellProvider.tsx`)
- [x] T008 [S0603] Implement checkRetellConfiguration() and useRetellConfigured() hook (`src/components/providers/RetellProvider.tsx`)
- [x] T009 [S0603] Implement RetellProvider wrapper component with cleanup on unmount (`src/components/providers/RetellProvider.tsx`)
- [x] T010 [S0603] Implement RetellButton state management and click handler (`src/components/providers/RetellProvider.tsx`)
- [x] T011 [S0603] Implement RetellButton visual rendering with teal/cyan color scheme (`src/components/providers/RetellProvider.tsx`)
- [x] T012 [S0603] Implement RetellButton animated glow for agent-speaking state (`src/components/providers/RetellProvider.tsx`)
- [x] T013 [S0603] Implement RetellVoiceStatus component with connection status bar (`src/components/providers/RetellProvider.tsx`)
- [x] T014 [S0603] Implement RetellVoiceStatus speaking animation and error display (`src/components/providers/RetellProvider.tsx`)
- [x] T015 [S0603] Implement RetellEmptyState component for unconfigured state (`src/components/providers/RetellProvider.tsx`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T016 [S0603] Run build and lint to verify no errors (`npm run build && npm run lint`)
- [x] T017 [S0603] Validate ASCII encoding on all modified files
- [x] T018 [S0603] Manual testing: Tab visibility, call lifecycle, empty state, tab switching

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]` (18/18)
- [x] All tests passing (build succeeded)
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T003 and T004 can be worked on simultaneously (both modify voice-provider.ts but different sections).

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T005 depends on T003, T004 (needs ProviderType to include 'retell')
- T006 depends on T003 (needs type to be defined)
- T009-T015 depend on T007 (file creation)
- T016-T18 depend on T001-T015 (all implementation complete)

### Color Scheme

Use teal/cyan (`hsl(180, ...)`) to distinguish Retell from Vapi's purple/violet. Spec mentions this in Implementation Notes.

### State Mapping Reference

- `RetellCallStatus.IDLE` -> 'idle'
- `RetellCallStatus.CONNECTING` -> 'loading'
- `RetellCallStatus.CONNECTED` -> 'connected'
- `RetellCallStatus.ERROR` -> 'error'
- `isAgentSpeaking` -> 'speaking' (when connected and agent speaking)

---

## Next Steps

All tasks complete. Run `/validate` to verify session completeness and proceed to Phase 06 Session 04.
