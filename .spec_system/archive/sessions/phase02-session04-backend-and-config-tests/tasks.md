# Task Checklist

**Session ID**: `phase02-session04-backend-and-config-tests`
**Total Tasks**: 18
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
| Implementation | 7      | 7      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (3 tasks)

Initial test-target confirmation and session scaffolding.

- [x] T001 [S0204] Review Phase 02 route/config validation evidence and record exact test targets (`.spec_system/specs/phase02-session04-backend-and-config-tests/implementation-notes.md`)
- [x] T002 [S0204] Verify the backend route exports and frontend config helpers needed by the tests (`server/routes/openai.js`)
- [x] T003 [S0204] [P] Create implementation notes scaffold for route/config test evidence (`.spec_system/specs/phase02-session04-backend-and-config-tests/implementation-notes.md`)

---

## Foundation (5 tasks)

Core test harnesses and shared assertions.

- [x] T004 [S0204] [P] Create Node-environment Express route test harness for `/api/openai/translation-session` (`src/test/openaiTranslationRoute.test.ts`)
- [x] T005 [S0204] Add isolated fetch, environment, timer, and app cleanup utilities with cleanup on scope exit for all acquired resources (`src/test/openaiTranslationRoute.test.ts`)
- [x] T006 [S0204] Add route validation tests for missing, malformed, extra-field, and unsupported target languages with schema-validated input and explicit error mapping (`src/test/openaiTranslationRoute.test.ts`)
- [x] T007 [S0204] Extend translation config tests for exact PRD language order, uniqueness, ASCII labels, and request descriptor shape with types matching declared contract (`src/test/openaiTranslation.test.ts`)
- [x] T008 [S0204] Add audio mix edge tests for fallback, clamping, decimal rounding, and original/translated volume calculations (`src/test/openaiTranslation.test.ts`)

---

## Implementation (7 tasks)

Main backend route and config coverage.

- [x] T009 [S0204] Add missing `OPENAI_API_KEY` route test with no upstream fetch and no browser-visible secret leakage (`src/test/openaiTranslationRoute.test.ts`)
- [x] T010 [S0204] Add sanitized success tests for both OpenAI `value` and nested `client_secret.value` response shapes (`src/test/openaiTranslationRoute.test.ts`)
- [x] T011 [S0204] Assert upstream request URL, authorization header placement, and `gpt-realtime-translate` payload shape without voice-agent prompt/tool fields (`src/test/openaiTranslationRoute.test.ts`)
- [x] T012 [S0204] Add invalid upstream success-shape and non-JSON success-body tests with stable 502 error mapping (`src/test/openaiTranslationRoute.test.ts`)
- [x] T013 [S0204] Add OpenAI 401/403, 429, and 5xx status mapping tests without raw upstream body leakage (`src/test/openaiTranslationRoute.test.ts`)
- [x] T014 [S0204] Add timeout and thrown fetch failure tests with deterministic cleanup and stable structured errors (`src/test/openaiTranslationRoute.test.ts`)
- [x] T015 [S0204] Apply minimal route/helper fixes required by the new tests with schema-validated input and explicit error mapping (`server/routes/openai.js`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T016 [S0204] Confirm strict token endpoint coverage for `/api/openai/translation-session` remains asserted (`src/test/serverSecurity.test.ts`)
- [x] T017 [S0204] Run focused route/config/security tests and record commands, results, and blockers (`.spec_system/specs/phase02-session04-backend-and-config-tests/implementation-notes.md`)
- [x] T018 [S0204] Run full quality checks or record blockers, then validate ASCII/LF and update completion evidence (`.spec_system/specs/phase02-session04-backend-and-config-tests/implementation-notes.md`)

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
