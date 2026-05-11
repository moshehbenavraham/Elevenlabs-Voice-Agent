# Task Checklist

**Session ID**: `phase03-session01-reusable-webrtc-translation-hook`
**Total Tasks**: 24
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
| Foundation     | 7      | 7      | 0         |
| Implementation | 10     | 10     | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **24** | **24** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0301] Verify Phase 02 translation route/config prerequisites and current OpenAI translation/WebRTC docs (`src/lib/openaiTranslation.ts`)
- [x] T002 [S0301] Create the reusable hook skeleton and exported return contract (`src/hooks/useOpenAITranslation.ts`)
- [x] T003 [S0301] [P] Create hook test scaffold with WebRTC and media fake placeholders (`src/test/useOpenAITranslation.test.tsx`)

---

## Foundation (7 tasks)

Core structures and base implementations.

- [x] T004 [S0301] Extend translation hook status, error, transcript, event, start-option, and result types (`src/types/openai-translation.ts`)
- [x] T005 [S0301] Add translation runtime error builders and operation status helpers (`src/lib/openaiTranslation.ts`)
- [x] T006 [S0301] Add data-channel event parser helpers with schema-validated input and explicit error mapping (`src/lib/openaiTranslation.ts`)
- [x] T007 [S0301] Add transcript delta normalization helpers with types matching declared contract and exhaustive enum handling (`src/lib/openaiTranslation.ts`)
- [x] T008 [S0301] Add client-secret request helper using the existing backend route with timeout, retry/backoff, and failure-path handling (`src/lib/openaiTranslation.ts`)
- [x] T009 [S0301] Add SDP calls endpoint exchange helper with abort support, timeout, retry/backoff, and failure-path handling (`src/lib/openaiTranslation.ts`)
- [x] T010 [S0301] Build hook resource refs and cleanup primitives with cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslation.ts`)

---

## Implementation (10 tasks)

Main feature implementation.

- [x] T011 [S0301] Implement the `useOpenAITranslation` public API with duplicate-trigger prevention while in-flight (`src/hooks/useOpenAITranslation.ts`)
- [x] T012 [S0301] Implement start option validation for target language and source stream with explicit error mapping (`src/hooks/useOpenAITranslation.ts`)
- [x] T013 [S0301] Implement client-secret startup state transitions with explicit loading, empty, error, and offline states (`src/hooks/useOpenAITranslation.ts`)
- [x] T014 [S0301] Implement peer connection creation and source audio track attachment with cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslation.ts`)
- [x] T015 [S0301] Implement translated remote audio stream handling with state reset or revalidation on re-entry (`src/hooks/useOpenAITranslation.ts`)
- [x] T016 [S0301] Implement `oai-events` data-channel lifecycle and listeners with cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslation.ts`)
- [x] T017 [S0301] Implement SDP offer, local description, calls endpoint exchange, and remote description with timeout, retry/backoff, and failure-path handling (`src/hooks/useOpenAITranslation.ts`)
- [x] T018 [S0301] Implement transcript state updates for partial and final source/translated events with scoped rollback on error (`src/hooks/useOpenAITranslation.ts`)
- [x] T019 [S0301] Implement typed error/status transitions for token, SDP, WebRTC, data-channel, parser, and cleanup failures (`src/hooks/useOpenAITranslation.ts`)
- [x] T020 [S0301] Implement idempotent stop, reset, and unmount cleanup with duplicate-trigger prevention while in-flight (`src/hooks/useOpenAITranslation.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T021 [S0301] [P] Write parser and runtime helper tests for known, unknown, malformed, partial, and final events (`src/test/openaiTranslation.test.ts`)
- [x] T022 [S0301] [P] Write hook lifecycle tests for success, failures, remote audio, data-channel messages, duplicate start, and cleanup (`src/test/useOpenAITranslation.test.tsx`)
- [x] T023 [S0301] Run targeted tests, type-check, lint, and build, then record exact evidence or blockers (`.spec_system/specs/phase03-session01-reusable-webrtc-translation-hook/implementation-notes.md`)
- [x] T024 [S0301] Validate ASCII encoding, Unix LF line endings, and update implementation notes for deferred Phase 03 dependencies (`.spec_system/specs/phase03-session01-reusable-webrtc-translation-hook/implementation-notes.md`)

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
