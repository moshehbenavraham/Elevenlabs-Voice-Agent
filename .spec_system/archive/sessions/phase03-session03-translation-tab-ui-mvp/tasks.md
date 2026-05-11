# Task Checklist

**Session ID**: `phase03-session03-translation-tab-ui-mvp`
**Total Tasks**: 22
**Estimated Duration**: 3-4 hours
**Created**: 2026-05-11

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[SNNMM]` = Session reference (NN=phase number, MM=session number)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 6      | 6      | 0         |
| Implementation | 9      | 9      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **22** | **22** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0303] Verify completed runtime hook contract, statuses, errors, transcripts, and cleanup guarantees (`src/hooks/useOpenAITranslation.ts`)
- [x] T002 [S0303] Verify completed source-capture hook contract, capability state, source result shape, and cleanup guarantees (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T003 [S0303] Prepare existing provider scaffold tests for hook mocking and interactive behavior assertions (`src/test/OpenAITranslationProvider.test.tsx`)

---

## Foundation (6 tasks)

Core structures and base implementations.

- [x] T004 [S0303] [P] Create source selector component with capability-aware disabled states, accessible labels, and keyboard-safe controls (`src/components/providers/OpenAITranslationSourceSelector.tsx`)
- [x] T005 [S0303] [P] Create target language select component using shared language metadata and validation-ready values (`src/components/providers/OpenAITranslationLanguageSelect.tsx`)
- [x] T006 [S0303] [P] Create status panel component with explicit loading, empty, error, offline, source, and runtime states (`src/components/providers/OpenAITranslationStatusPanel.tsx`)
- [x] T007 [S0303] [P] Create translated audio player component with stream attachment and cleanup on stream change or unmount (`src/components/providers/OpenAITranslationAudioPlayer.tsx`)
- [x] T008 [S0303] Define provider UI status mapping helpers with exhaustive source/runtime state handling (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T009 [S0303] Add provider props for page-owned offline/error state and provider-switch stop handler registration (`src/components/providers/OpenAITranslationProvider.tsx`)

---

## Implementation (9 tasks)

Main feature implementation.

- [x] T010 [S0303] Replace scaffold layout with hook-driven translation provider composition and responsive cockpit styling (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T011 [S0303] Implement selected source mode and target language state with revalidation on re-entry (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T012 [S0303] Wire Start action to capture selected source and start translation with duplicate-trigger prevention while in-flight (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T013 [S0303] Wire Stop action to stop translation runtime and source capture with duplicate-trigger prevention while in-flight (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T014 [S0303] Attach translated audio stream to the audio player and clear stale playback state on stop, stream replacement, and unmount (`src/components/providers/OpenAITranslationAudioPlayer.tsx`)
- [x] T015 [S0303] Render actionable source/runtime error messages and `aria-live` status updates for permission, offline, token, SDP, WebRTC, and cleanup failures (`src/components/providers/OpenAITranslationStatusPanel.tsx`)
- [x] T016 [S0303] Preserve provider-switch cleanup by registering the translation stop handler and invoking it before leaving the translation tab (`src/pages/Index.tsx`)
- [x] T017 [S0303] Remove obsolete scaffold runtime placeholder resources and state now owned by provider hooks (`src/pages/Index.tsx`)
- [x] T018 [S0303] Keep translation tab mobile-safe with stable dimensions, no overlapping controls, and accessible focus styling (`src/components/providers/OpenAITranslationProvider.tsx`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T019 [S0303] Update provider tests for source selection, language selection, status rendering, and no media/network request on render (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T020 [S0303] Add provider tests for start/stop orchestration, duplicate-trigger disabled states, audio stream cleanup, and registered stop handler cleanup (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T021 [S0303] Run focused tests, type check, lint, and production build; fix any failures (`package.json`)
- [x] T022 [S0303] Validate ASCII encoding, LF line endings, and manual desktop/mobile translation tab smoke behavior (`.spec_system/specs/phase03-session03-translation-tab-ui-mvp/tasks.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for the validate workflow step

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
