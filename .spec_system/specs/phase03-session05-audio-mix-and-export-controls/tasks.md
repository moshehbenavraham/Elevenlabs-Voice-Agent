# Task Checklist

**Session ID**: `phase03-session05-audio-mix-and-export-controls`
**Total Tasks**: 20
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
| Foundation     | 5      | 5      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0305] Verify completed transcript, source stream, and runtime cleanup contracts needed for export and auto-stop (`src/hooks/useOpenAITranslation.ts`)
- [x] T002 [S0305] Verify audio mix helpers, audio element cleanup behavior, and existing Radix slider patterns (`src/lib/openaiTranslation.ts`)
- [x] T003 [S0305] Verify provider test mocks, fake timer patterns, audio element mocks, and download/object URL test setup (`src/test/OpenAITranslationProvider.test.tsx`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0305] Extend translation types with session metadata, export payload, max-session config, and auto-stop reason contracts (`src/types/openai-translation.ts`)
- [x] T005 [S0305] Extend pure translation helpers for max-session bounds, duration formatting, and Markdown export with validated input and deterministic ordering (`src/lib/openaiTranslation.ts`)
- [x] T006 [S0305] [P] Create session timer hook with interval and timeout cleanup on scope exit plus duplicate auto-stop prevention (`src/hooks/useOpenAITranslationSessionTimer.ts`)
- [x] T007 [S0305] [P] Create audio mix controls with clamped slider state, readable labels, and platform-appropriate accessibility labels, focus management, and input support (`src/components/providers/OpenAITranslationAudioMixControls.tsx`)
- [x] T008 [S0305] [P] Create transcript export controls with disabled empty state, download action, and duplicate-trigger prevention while in-flight (`src/components/providers/OpenAITranslationExportControls.tsx`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0305] Track session start/end metadata, active source mode, target language, and auto-stop reason with state reset or revalidation on re-entry (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T010 [S0305] Wire session timer hook to runtime/source lifecycle and auto-stop cleanup with cleanup on scope exit for all acquired timers and resources (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T011 [S0305] Update audio player props for reusable labels, volume, stream kind, disabled state, and stable media-element reset behavior with cleanup on scope exit for all acquired media element resources (`src/components/providers/OpenAITranslationAudioPlayer.tsx`)
- [x] T012 [S0305] Render browser-tab original audio playback and original/translated mix controls while hiding irrelevant microphone-mode controls with state reset or revalidation on re-entry (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T013 [S0305] Apply translated and original volume values from the shared clamp helper with bounded validation and deterministic labels (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T014 [S0305] Wire Markdown export using current transcript and session metadata with explicit empty, disabled, error, and success states (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T015 [S0305] Surface elapsed time, max-session limit, and auto-stop status in provider status/details without layout shifts or overlapping controls (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T016 [S0305] Document optional frontend max-session reduction setting with default and hard-limit comments (`.env.example`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0305] [P] Add pure helper tests for max-session bounds, duration formatting, Markdown export formatting, and audio mix state reuse (`src/test/openaiTranslation.test.ts`)
- [x] T018 [S0305] [P] Add timer hook tests with fake timers for tick updates, auto-stop, cleanup, unmount, and new-session re-entry (`src/test/useOpenAITranslationSessionTimer.test.tsx`)
- [x] T019 [S0305] Add provider/component tests for browser-tab mix controls, microphone hiding, export disabled/download states, elapsed display, and auto-stop cleanup (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T020 [S0305] Run focused tests, type check, lint, build, ASCII validation, and manual desktop/mobile smoke verification (`package.json`)

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
