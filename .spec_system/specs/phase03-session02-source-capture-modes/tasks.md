# Task Checklist

**Session ID**: `phase03-session02-source-capture-modes`
**Total Tasks**: 21
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
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **21** | **21** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0302] Verify Session 01 hook contract, source-stream ownership expectations, and current provider scaffold (`src/hooks/useOpenAITranslation.ts`)
- [x] T002 [S0302] Create session implementation notes shell for progress, verification evidence, and deferred follow-ups (`.spec_system/specs/phase03-session02-source-capture-modes/implementation-notes.md`)
- [x] T003 [S0302] Review test setup media-device mocks and document any required local fake updates (`src/test/setup.ts`)

---

## Foundation (6 tasks)

Core structures and base implementations.

- [x] T004 [S0302] [P] Extend translation source capture modes, statuses, capabilities, source result, and error types with exhaustive enum handling (`src/types/openai-translation.ts`)
- [x] T005 [S0302] [P] Add source-mode metadata and display-media option helpers with schema-validated input and explicit unsupported-state mapping (`src/lib/openaiTranslation.ts`)
- [x] T006 [S0302] [P] Create source hook test scaffold with reusable fake media devices, streams, tracks, and track-ended dispatch helpers (`src/test/useOpenAITranslationSource.test.tsx`)
- [x] T007 [S0302] [P] Create `useOpenAITranslationSource` hook skeleton with stable return contract and no permission prompts on render (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T008 [S0302] Add source capability detection in the hook with denied/restricted/unavailable fallback behavior (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T009 [S0302] Add media capture error mapper for permission denial, cancellation, missing devices, missing audio tracks, and unknown failures (`src/lib/openaiTranslation.ts`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T010 [S0302] Implement microphone capture action with duplicate-trigger prevention while in-flight and explicit requesting, ready, error, and ended states (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T011 [S0302] Implement browser-tab audio capture action with validated display-media options, missing-audio-track cleanup, and failure-path handling (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T012 [S0302] Implement source track-ended listener registration with cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T013 [S0302] Implement stop and reset cleanup with idempotent track stopping, listener removal, and state reset on re-entry (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T014 [S0302] Expose source stream ownership metadata for translation startup with types matching the declared hook contract (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T015 [S0302] Update provider scaffold source-mode rendering with shared metadata, capability-aware states, and accessibility labels without starting capture (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T016 [S0302] Update provider scaffold tests for shared source metadata and no media prompt on render (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T017 [S0302] Export source capture contracts from the shared type barrel (`src/types/index.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T018 [S0302] [P] Write pure helper tests for source metadata, display-media options, capability detection, and media error mapping (`src/test/openaiTranslation.test.ts`)
- [x] T019 [S0302] [P] Write hook tests for mic success, tab success, unsupported APIs, permission denial, cancellation, missing audio, duplicate capture, track-ended cleanup, repeated stop, reset, and unmount cleanup (`src/test/useOpenAITranslationSource.test.tsx`)
- [x] T020 [S0302] Run targeted Vitest suite for translation helpers, source hook, and provider scaffold (`src/test/useOpenAITranslationSource.test.tsx`)
- [x] T021 [S0302] Run type-check, lint, build, ASCII validation, and record exact verification evidence (`.spec_system/specs/phase03-session02-source-capture-modes/implementation-notes.md`)

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

Run the validate workflow step to verify session completeness.
