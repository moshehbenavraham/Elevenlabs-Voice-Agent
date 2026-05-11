# Task Checklist

**Session ID**: `phase04-session01-lifecycle-reliability`
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

- [x] T001 [S0401] Verify current runtime lifecycle, resource refs, abort handling, and cleanup ownership before editing with cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslation.ts`)
- [x] T002 [S0401] Verify current source capture lifecycle, listener ordering, duplicate capture guards, and track-ended behavior with cleanup on scope exit for all acquired resources (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T003 [S0401] Verify provider-switch and provider orchestration contracts for manual stop, auto-stop, source-ended, failed start, and retry states with duplicate-trigger prevention while in-flight (`src/components/providers/OpenAITranslationProvider.tsx`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0401] Refine translation lifecycle, source ownership, cleanup result, or stop reason types only where needed for explicit contracts (`src/types/openai-translation.ts`)
- [x] T005 [S0401] Refine lifecycle helper predicates or cleanup error helpers with typed contracts, stable messages, and explicit error mapping (`src/lib/openaiTranslation.ts`)
- [x] T006 [S0401] [P] Extend runtime test fakes for peer close, data channel close, sender handling, abort signals, and cleanup call-count assertions (`src/test/useOpenAITranslation.test.tsx`)
- [x] T007 [S0401] [P] Extend source test fakes for listener registration/removal, track stop ordering, duplicate stop calls, and ended-event dispatch (`src/test/useOpenAITranslationSource.test.tsx`)
- [x] T008 [S0401] [P] Extend provider test mocks for start, stop, source-ended, auto-stop, provider-switch, failed-start retry, and timer race assertions (`src/test/OpenAITranslationProvider.test.tsx`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0401] Harden runtime start guard so duplicate starts while pending or connected cannot create competing peer connections, data channels, abort controllers, or transcripts (`src/hooks/useOpenAITranslation.ts`)
- [x] T010 [S0401] Harden runtime partial-start cleanup for client-secret, SDP, peer-connection, data-channel, remote-stream, abort, and stale-operation failures with timeout, retry/backoff, and failure-path handling (`src/hooks/useOpenAITranslation.ts`)
- [x] T011 [S0401] Harden runtime stop/reset/unmount cleanup with idempotent data-channel closure, peer-connection closure, remote-stream track cleanup, abort handling, and source ownership preservation (`src/hooks/useOpenAITranslation.ts`)
- [x] T012 [S0401] Harden source capture cleanup so listeners are removed before source tracks stop, duplicate stop/reset is safe, and capture replacement cannot leak listeners or streams (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T013 [S0401] Harden source-ended handling so stale `ended` events, stopped tracks, and unmounted hooks cannot trigger duplicate cleanup or stale state updates (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T014 [S0401] Route manual stop, auto-stop, source-ended, failed-start cleanup, retry reset, and provider-switch cleanup through one guarded provider stop path with duplicate-trigger prevention while in-flight (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T015 [S0401] Preserve retryable UI state and stable end reasons after failed capture, token, SDP, WebRTC, data-channel, cleanup, and provider-switch paths with explicit loading, empty, error, and offline states (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T016 [S0401] Preserve OpenAI Translation provider-switch cleanup in the app shell while avoiding duplicate switch-trigger teardown and regressions to other providers (`src/pages/Index.tsx`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0401] [P] Add runtime hook lifecycle regression tests for duplicate start/stop, partial startup failures, abort, data channel cleanup, peer cleanup, source ownership, and unmount (`src/test/useOpenAITranslation.test.tsx`)
- [x] T018 [S0401] [P] Add source hook lifecycle regression tests for listener removal before stop, missing audio tracks, duplicate capture, source-ended, stop, reset, and unmount (`src/test/useOpenAITranslationSource.test.tsx`)
- [x] T019 [S0401] Add provider and app-shell regression tests for manual stop, auto-stop, source-ended stop, failed-start retry, provider-switch cleanup, and stable UI state (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T020 [S0401] Run focused tests, type check, lint, build, ASCII validation, and manual lifecycle smoke verification (`package.json`)

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
