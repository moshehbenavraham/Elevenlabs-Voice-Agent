# Task Checklist

**Session ID**: `phase05-session01-production-safety-and-usage-controls`
**Total Tasks**: 20
**Estimated Duration**: 3-4 hours
**Created**: 2026-05-12

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

- [x] T001 [S0501] Verify current OpenAI realtime translation endpoint, model, SDP, and event assumptions (`docs/OPENAI_REALTIME.md`)
- [x] T002 [S0501] Review active production security findings for limiter and CSP scope (`.spec_system/SECURITY-COMPLIANCE.md`)
- [x] T003 [S0501] Create implementation notes scaffold with official-doc re-check results (`.spec_system/specs/phase05-session01-production-safety-and-usage-controls/implementation-notes.md`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0501] [P] Create translation safety helper for duration defaults, hard caps, and safe metadata (`server/utils/translationSafety.js`)
- [x] T005 [S0501] [P] Create translation safety unit coverage for defaults, caps, invalid inputs, and sanitization (`src/test/translationSafety.test.ts`)
- [x] T006 [S0501] Define sanitized translation lifecycle event shape with allowlisted fields only (`server/utils/observability.js`)
- [x] T007 [S0501] Align frontend max-session constants and normalization with production guardrails (`src/lib/openaiTranslation.ts`)
- [x] T008 [S0501] Confirm token endpoint path coverage includes translation session route (`server/utils/security.js`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0501] Implement sanitized translation token lifecycle logging around validation, upstream call, success, and failure paths (`server/routes/openai.js`)
- [x] T010 [S0501] Add explicit OpenAI Translation build-time args with safe defaults (`Dockerfile`)
- [x] T011 [S0501] Pass OpenAI Translation build-time args through local production Compose (`docker-compose.yml`)
- [x] T012 [S0501] Pass OpenAI Translation build-time args through GitHub image builds from repository variables (`.github/workflows/deploy.yml`)
- [x] T013 [S0501] Document translation build-time flags, default duration, and hard cap (`.env.example`)
- [x] T014 [S0501] Update translation runbook with privacy, cost, duration, and usage guardrails (`docs/OPENAI_TRANSLATION_DEMO.md`)
- [x] T015 [S0501] Update production deployment docs with image build args and process-local limiter caveat (`docs/DEPLOYMENT.md`)
- [x] T016 [S0501] Update observability and security docs with sanitized event fields and excluded data (`docs/OBSERVABILITY.md`, `docs/SECURITY.md`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0501] Extend route tests for sanitized lifecycle events and no secret leakage (`src/test/openaiTranslationRoute.test.ts`)
- [x] T018 [S0501] Extend helper tests for frontend max-session config and translation constants (`src/test/openaiTranslation.test.ts`)
- [x] T019 [S0501] Extend security tests for translation token limiter coverage (`src/test/serverSecurity.test.ts`)
- [x] T020 [S0501] Run targeted tests, Compose interpolation, and record security review results (`.spec_system/specs/phase05-session01-production-safety-and-usage-controls/security-compliance.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] security-compliance.md updated
- [x] Ready for the validate workflow step

---

## Next Steps

Session validated and ready for updateprd closure.
