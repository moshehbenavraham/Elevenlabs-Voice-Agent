# Task Checklist

**Session ID**: `phase03-session04-transcript-and-caption-experience`
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

- [x] T001 [S0304] Verify completed runtime hook transcript contract, parser helpers, and cleanup guarantees (`src/hooks/useOpenAITranslation.ts`)
- [x] T002 [S0304] Verify existing conversation panel accessibility, auto-scroll, empty-state, and mobile layout patterns (`src/components/conversation/ConversationPanel.tsx`)
- [x] T003 [S0304] Prepare translation provider tests for mocked transcript states and clear-action assertions (`src/test/OpenAITranslationProvider.test.tsx`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0304] [P] Extend translation hook/types with a clear transcript action and display-safe transcript metadata (`src/types/openai-translation.ts`)
- [x] T005 [S0304] Extend transcript normalization and selector helpers for stable ordering, same-id final replacement, and latest translated caption selection with schema-validated input and explicit error mapping (`src/lib/openaiTranslation.ts`)
- [x] T006 [S0304] Add `clearTranscripts` to the translation hook while preserving active runtime resources and cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslation.ts`)
- [x] T007 [S0304] [P] Create latest translated caption component with stable dimensions, empty state, accessible label, and long-text wrapping (`src/components/providers/OpenAITranslationLatestCaption.tsx`)
- [x] T008 [S0304] [P] Create translation transcript panel with source/translated rows, empty/active/no-transcript states, `role="log"`, and keyboard-accessible clear control (`src/components/conversation/TranslationTranscriptPanel.tsx`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0304] Wire transcripts, latest caption, transcript counts, and clear action into the provider layout with explicit empty and active states (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T010 [S0304] Add clear transcript confirmation flow with duplicate-trigger prevention while in-flight and focus revalidation on re-entry (`src/components/conversation/TranslationTranscriptPanel.tsx`)
- [x] T011 [S0304] Preserve transcript state while a translation session is active unless the user clears it, without stopping source or runtime resources (`src/hooks/useOpenAITranslation.ts`)
- [x] T012 [S0304] Render source and translated transcript rows with final/partial visual states, deterministic ordering, and accessible stream labels (`src/components/conversation/TranslationTranscriptPanel.tsx`)
- [x] T013 [S0304] Render latest translated caption prominently without layout shifts, overlap, or dependence on translated audio availability (`src/components/providers/OpenAITranslationLatestCaption.tsx`)
- [x] T014 [S0304] Keep transcript and caption surfaces mobile-safe with bounded heights, wrapping text, and stable responsive grid behavior (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T015 [S0304] Surface transcript availability in provider status/details without introducing new OpenAI protocol assumptions (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T016 [S0304] Keep export, audio mix, elapsed-time, and max-session behavior deferred to Session 05 while preserving transcript data needed by that session (`src/components/providers/OpenAITranslationProvider.tsx`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0304] Add pure helper tests for transcript parser normalization, same-id partial/final updates, source/translated filtering, and latest-caption selection (`src/test/openaiTranslation.test.ts`)
- [x] T018 [S0304] Add hook tests proving `clearTranscripts` clears transcript state without closing peer connections, data channels, audio streams, or source tracks (`src/test/useOpenAITranslation.test.tsx`)
- [x] T019 [S0304] Add provider/component tests for caption rendering, transcript panel states, clear confirmation, active-session preservation, and accessibility queries (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T020 [S0304] Run focused tests, type check, lint, build, ASCII validation, and manual desktop/mobile smoke verification (`package.json`)

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
