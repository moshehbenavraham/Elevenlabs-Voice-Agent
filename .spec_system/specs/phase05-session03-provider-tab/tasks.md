# Task Checklist

**Session ID**: `phase05-session03-provider-tab`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-31
**Completed**: 2025-12-31

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0503]` = Session reference (Phase 05, Session 03)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 9      | 9      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0503] Verify prerequisites met (useVapiVoice hook, Vapi SDK installed, CSP configured)
- [x] T002 [S0503] Verify environment variables structure in `.env.example` includes Vapi variables

---

## Foundation (5 tasks)

Core types, interfaces, and configuration updates.

- [x] T003 [S0503] Add `vapi` to ProviderType union in `src/types/voice-provider.ts`
- [x] T004 [S0503] Add `isVapiEnabled()` function in `src/types/voice-provider.ts`
- [x] T005 [S0503] Add Vapi entry to PROVIDERS configuration object (`src/types/voice-provider.ts`)
- [x] T006 [S0503] Update `isValidProvider()` in `src/contexts/ProviderContext.tsx` to include `vapi`
- [x] T007 [S0503] Update providers array in ProviderContext to include `vapi`

---

## Implementation (9 tasks)

Main feature implementation - VapiProvider component and integrations.

- [x] T008 [S0503] Create VapiEmptyState component with setup instructions (`src/components/providers/VapiProvider.tsx`)
- [x] T009 [S0503] Create VapiButton component with color states and audio-level glow (`src/components/providers/VapiProvider.tsx`)
- [x] T010 [S0503] Create VapiVoiceStatus component for connection state display (`src/components/providers/VapiProvider.tsx`)
- [x] T011 [S0503] Create VapiProvider wrapper component using useVapiVoice hook (`src/components/providers/VapiProvider.tsx`)
- [x] T012 [S0503] Add useVapiConfigured and checkVapiConfiguration utilities (`src/components/providers/VapiProvider.tsx`)
- [x] T013 [S0503] Add optional activeTranscript prop to ConversationPanel for typing indicator (`src/components/conversation/ConversationPanel.tsx`)
- [x] T014 [S0503] Create VapiConversationPanel wrapper component (`src/components/conversation/VapiConversationPanel.tsx`)
- [x] T015 [S0503] Update barrel exports for providers (`src/components/providers/index.ts`)
- [x] T016 [S0503] Update barrel exports for conversation (`src/components/conversation/index.ts`)

---

## Integration (4 tasks)

Wire up Vapi provider into the main application.

- [x] T017 [S0503] Add Vapi imports to Index.tsx (`src/pages/Index.tsx`)
- [x] T018 [S0503] Add vapiHasStarted state and Vapi handlers in Index.tsx (`src/pages/Index.tsx`)
- [x] T019 [S0503] Add Vapi provider case to handleProviderChange in Index.tsx (`src/pages/Index.tsx`)
- [x] T020 [S0503] Add Vapi provider UI section in AnimatePresence (`src/pages/Index.tsx`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T021 [S0503] Run TypeScript build and fix any type errors (`npm run build`)
- [x] T022 [S0503] Run ESLint and fix any linting issues (`npm run lint`)
- [x] T023 [S0503] Validate ASCII encoding on all created/modified files
- [x] T024 [S0503] Manual testing: tab visibility, connect/disconnect, transcript display, glow effect

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded (0-127)
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T003-T005 can be done together (same file modifications).
Tasks T006-T007 can be done together (same file modifications).
Tasks T008-T012 build sequentially within VapiProvider.tsx.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003-T007 (Foundation) must complete before T008-T020 (Implementation/Integration)
- T008-T016 must complete before T017-T020 (Index.tsx integration)
- T017-T020 must complete before T021-T024 (Testing)

### Key Implementation Details

**VapiButton Color States:**

- Idle: Green (similar to other providers)
- Loading: Orange/amber
- Active: Red (end call state)
- Audio glow: Map audioLevel (0-1) to box-shadow intensity

**Vapi Branding:**

- Icon: PhoneCall from Lucide
- Color scheme: Purple/violet for distinction
- Name: "Vapi"

**Empty State Trigger:**

- Check for VITE_VAPI_WEB_TOKEN absence
- Frontend-only check (no backend health endpoint needed)

---

## Implementation Complete

All tasks completed successfully. Run `/validate` to verify session completeness.
