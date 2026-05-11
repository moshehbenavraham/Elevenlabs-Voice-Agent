# Task Checklist

**Session ID**: `phase04-session02-error-states-and-diagnostics`
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

- [x] T001 [S0402] Verify current source, runtime, provider, and route error shapes before editing with types matching declared contracts and exhaustive enum handling (`src/types/openai-translation.ts`)
- [x] T002 [S0402] Verify existing translation status panel, provider layout, and accessibility contracts before adding diagnostics with platform-appropriate accessibility labels, focus management, and input support (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T003 [S0402] Verify route sanitization and current translation-session error mapping before adding diagnostic codes with schema-validated input and explicit error mapping (`server/routes/openai.js`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0402] Define diagnostic category, severity, detail, recovery, and route-safe error interfaces with exhaustive enum handling (`src/types/openai-translation.ts`)
- [x] T005 [S0402] Implement pure source/runtime/backend diagnostic mapping helpers with sanitized messages, stable codes, and deterministic fallback handling (`src/lib/openaiTranslation.ts`)
- [x] T006 [S0402] [P] Extend route test fixtures for safe error codes, sanitized upstream payloads, timeouts, and missing API key cases (`src/test/openaiTranslationRoute.test.ts`)
- [x] T007 [S0402] [P] Extend runtime test fakes for SDP, WebRTC, data-channel, parser, timeout, abort, and missing remote-audio diagnostic assertions (`src/test/useOpenAITranslation.test.tsx`)
- [x] T008 [S0402] [P] Extend provider test mocks for source, runtime, offline, token, SDP, WebRTC, and no-audio-track diagnostic rendering states (`src/test/OpenAITranslationProvider.test.tsx`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0402] Enrich source capability and source error mapping for unsupported APIs, restricted secure context, permission denial, cancellation, missing audio tracks, and source-ended recovery guidance (`src/hooks/useOpenAITranslationSource.ts`)
- [x] T010 [S0402] Enrich runtime error mapping for client-secret, SDP, WebRTC, ICE, data-channel, parser, offline, abort, timeout, cleanup, and remote-audio failures with timeout, retry/backoff, and failure-path handling (`src/hooks/useOpenAITranslation.ts`)
- [x] T011 [S0402] Add stable sanitized translation-session route error codes or categories while preserving current response compatibility and avoiding raw upstream payload exposure (`server/routes/openai.js`)
- [x] T012 [S0402] Normalize route-safe backend failures into frontend diagnostics without exposing `OPENAI_API_KEY`, bearer tokens, authorization headers, raw provider bodies, or SDP bodies (`src/lib/openaiTranslation.ts`)
- [x] T013 [S0402] Create accessible diagnostics panel for category, message, recovery action, source/runtime state, route/status codes, transcript count, and audio availability (`src/components/providers/OpenAITranslationDiagnosticsPanel.tsx`)
- [x] T014 [S0402] Wire diagnostics into the OpenAI Translation provider with explicit loading, empty, error, offline, stopped, retryable, and active states (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T015 [S0402] Refine status panel or provider summary copy so diagnostics and primary status do not duplicate confusing messages and controls stay clear during retry/stop states (`src/components/providers/OpenAITranslationStatusPanel.tsx`)
- [x] T016 [S0402] Preserve start, stop, retry reset, provider-switch, export, and clear behavior while diagnostics are visible with duplicate-trigger prevention while in-flight (`src/components/providers/OpenAITranslationProvider.tsx`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0402] [P] Add pure helper tests for every diagnostic category, fallback path, sanitization rule, and no-secret/no-raw-payload assertion (`src/test/openaiTranslation.test.ts`)
- [x] T018 [S0402] [P] Add source and runtime hook diagnostic regression tests for unsupported APIs, permission denial, missing audio, token failure, SDP failure, WebRTC failure, parser failure, timeout, abort, and cleanup (`src/test/useOpenAITranslation.test.tsx`)
- [x] T019 [S0402] Add provider UI tests for diagnostic rendering, live-region behavior, disabled controls, retryable states, offline state, and no secret leakage (`src/test/OpenAITranslationProvider.test.tsx`)
- [x] T020 [S0402] Run focused tests, type check, lint, build, ASCII validation, and manual diagnostic smoke verification (`package.json`)

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
