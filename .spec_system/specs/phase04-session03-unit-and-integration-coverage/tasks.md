# Task Checklist

**Session ID**: `phase04-session03-unit-and-integration-coverage`
**Total Tasks**: 23
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
| Implementation | 11     | 11     | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **23** | **23** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0403] Verify existing translation helper, transcript parser, and export coverage before adding new assertions with types matching declared contracts and exhaustive enum handling (`src/test/openaiTranslation.test.ts`)
- [x] T002 [S0403] Verify current runtime/source hook fake media, peer connection, data channel, fetch, and timer patterns before extending cleanup tests with cleanup on scope exit for all acquired resources (`src/test/useOpenAITranslation.test.tsx`)
- [x] T003 [S0403] Verify route test server setup and current sanitized error fixtures before adding route coverage with schema-validated input and explicit error mapping (`src/test/openaiTranslationRoute.test.ts`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0403] Create shared translation test utilities for fake media streams, tracks, peer connections, data channels, fetch responses, and no-secret assertions (`src/test/openaiTranslationTestUtils.ts`)
- [x] T005 [S0403] Extend pure helper fixtures for target languages, source options, audio mix, max-session config, request descriptors, transcript rows, and export payloads (`src/test/openaiTranslation.test.ts`)
- [x] T006 [S0403] [P] Extend route fixtures for sanitized success shapes, upstream auth/rate-limit/service failures, timeout/abort, malformed JSON, and malformed success responses (`src/test/openaiTranslationRoute.test.ts`)
- [x] T007 [S0403] [P] Extend runtime hook fixtures for duplicate start/stop, partial startup failure, abort, peer/data-channel cleanup, remote tracks, and unknown events (`src/test/useOpenAITranslation.test.tsx`)
- [x] T008 [S0403] [P] Extend source hook fixtures for permission denial, user cancellation, missing tab audio, track-ended behavior, reset, stop, and listener cleanup ordering (`src/test/useOpenAITranslationSource.test.tsx`)

---

## Implementation (11 tasks)

Main feature implementation.

- [x] T009 [S0403] Add helper tests for language validation, target normalization, session config/request/update builders, max-session limits, and audio mix clamping (`src/test/openaiTranslation.test.ts`)
- [x] T010 [S0403] Add source option and capability tests for microphone and browser-tab support, display-media option construction, invalid option mapping, and insecure/unavailable contexts (`src/test/openaiTranslation.test.ts`)
- [x] T011 [S0403] Add transcript parser and display tests for known source/translated deltas, final rows, malformed known events, unknown event tolerance, latest captions, and summary counts (`src/test/openaiTranslation.test.ts`)
- [x] T012 [S0403] Add transcript Markdown export tests for metadata, duration, target language, source/translated rows, empty transcript handling, clear-ready state, and ASCII output (`src/test/openaiTranslation.test.ts`)
- [x] T013 [S0403] Add runtime hook cleanup tests for duplicate start, duplicate stop, stop after failed startup, abort, unmount, peer close, sender removal, data-channel close, and source-track ownership (`src/test/useOpenAITranslation.test.tsx`)
- [x] T014 [S0403] Add runtime data-channel tests for transcript accumulation, unknown event tolerance, parser diagnostics, remote audio stream attachment, connection failure, ICE failure, and stopped retry state (`src/test/useOpenAITranslation.test.tsx`)
- [x] T015 [S0403] Add source hook tests for getUserMedia/getDisplayMedia calls, permission/cancel mapping, missing audio tracks, track-ended cleanup, reset behavior, stop behavior, and listener removal before track stop (`src/test/useOpenAITranslationSource.test.tsx`)
- [x] T016 [S0403] Add provider integration tests for export controls, clear transcript behavior, disabled pending controls, diagnostics/status cooperation, offline/error states, and retryable rendering (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T017 [S0403] Add route integration tests for validation, missing API key, sanitized client secret success, upstream auth/rate-limit/service failures, timeout/abort, malformed upstream success, and no sensitive leakage (`src/test/openaiTranslationRoute.test.ts`)
- [x] T018 [S0403] Patch pure helper, transcript parser, export, or sanitization gaps exposed by new helper tests with types matching declared contracts and exhaustive enum handling (`src/lib/openaiTranslation.ts`)
- [x] T019 [S0403] Patch runtime hook cleanup, abort, parser, connection, or translated audio state gaps exposed by new hook tests with cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslation.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T020 [S0403] Patch source capture error mapping, no-track handling, track-ended cleanup, or listener ordering gaps exposed by new source hook tests with denied/restricted/revoked handling and fallback behavior (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T021 [S0403] Patch translation route validation, timeout/abort, sanitized success, or sanitized error gaps exposed by new route tests with schema-validated input and explicit error mapping (`server/routes/openai.js`)
- [x] T022 [S0403] Run focused Vitest coverage for translation helper, route, runtime hook, source hook, and provider tests, then fix failures within the session scope (`package.json`)
- [x] T023 [S0403] Run type check, lint, build, ASCII/LF validation, and record commands plus residual gaps in implementation notes (`.spec_system/specs/phase04-session03-unit-and-integration-coverage/implementation-notes.md`)

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
