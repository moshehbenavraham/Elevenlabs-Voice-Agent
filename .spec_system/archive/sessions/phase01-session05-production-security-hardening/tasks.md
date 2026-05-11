# Task Checklist

**Session ID**: `phase01-session05-production-security-hardening`
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
| Foundation     | 4      | 4      | 0         |
| Implementation | 12     | 12     | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **23** | **23** | **0**     |

---

## Setup (3 tasks)

Initial security audit and session preparation.

- [x] T001 [S0105] Verify Phase 01 prerequisites, production origin assumptions, and existing monitoring/deployment context (`.spec_system/specs/phase01-session05-production-security-hardening/implementation-notes.md`)
- [x] T002 [S0105] Audit current CORS, rate limiting, security headers, API key exposure, body parsing, and provider input validation gaps (`.spec_system/specs/phase01-session05-production-security-hardening/implementation-notes.md`)
- [x] T003 [S0105] Run baseline local checks for `/api/health`, token-route limiter paths, and missing security headers, then record exact findings (`.spec_system/specs/phase01-session05-production-security-hardening/implementation-notes.md`)

---

## Foundation (4 tasks)

Shared security helpers, tests, docs shell, and environment posture.

- [x] T004 [S0105] [P] Create server-only security utilities for origin parsing, production config validation, security headers, payload bounds, and safe key exposure guards with schema-validated input and explicit error mapping (`server/utils/security.js`)
- [x] T005 [S0105] [P] Add focused tests for security utilities covering origin decisions, headers, validation helpers, token endpoint lists, and production key exposure guards (`src/test/serverSecurity.test.ts`)
- [x] T006 [S0105] [P] Create the production hardening guide covering CORS, headers, rate limits, API key rotation, scanner checks, and blocked external verification (`docs/SECURITY_HARDENING.md`)
- [x] T007 [S0105] Add production security environment comments for exact origins, unsafe wildcard rejection, body limits if configurable, and Gemini browser-token posture (`.env.production.example`)

---

## Implementation (12 tasks)

Production middleware, provider route hardening, verification tooling, and docs.

- [x] T008 [S0105] Wire strict production CORS, security headers, explicit JSON body limits, and unsafe production config reporting with middleware ordering verified (`server/index.js`)
- [x] T009 [S0105] Correct stricter token/session limiter coverage for the actual provider routes with duplicate-trigger prevention while in-flight (`server/index.js`)
- [x] T010 [S0105] Enrich `/api/health` security posture with configured origins, header status, body limit, token limiter routes, demo-mode separation, and secret-safe output (`server/index.js`)
- [x] T011 [S0105] Harden xAI session request validation for bounded `expirySeconds`, malformed JSON behavior, and explicit provider error mapping before external API calls (`server/routes/xai.js`)
- [x] T012 [S0105] Harden Ultravox call request validation for bounded prompt, voice, and model fields before external API calls (`server/routes/ultravox.js`)
- [x] T013 [S0105] Harden Retell web-call request validation for agent ID, metadata, dynamic variables, object bounds, and explicit error mapping before external API calls (`server/routes/retell.js`)
- [x] T014 [S0105] Harden Gemini session handling to validate model input and prevent raw `GEMINI_API_KEY` exposure in production with explicit fallback behavior (`server/routes/gemini.js`)
- [x] T015 [S0105] Harden function execution validation and safe logging for function names, call IDs, arguments, timezone, location, expression, timeout cleanup, and result redaction (`server/routes/functions.js`)
- [x] T016 [S0105] Extend production verification with security-header checks, optional CORS rejection checks, token limiter posture hints, timeout handling, and clear failure output (`scripts/deploy/verify-production.mjs`)
- [x] T017 [S0105] Update deployment documentation with production CORS, security headers, scanner commands, rate-limit posture, and API key rotation deployment steps (`docs/DEPLOYMENT.md`)
- [x] T018 [S0105] Update the security policy date, product naming, vulnerability handling, and hardening guide link (`docs/SECURITY.md`)
- [x] T019 [S0105] Update incident response with CORS, header, rate-limit, and API key exposure triage plus rotation rollback steps (`docs/runbooks/incident-response.md`)

---

## Testing (4 tasks)

Verification, documentation reconciliation, and quality assurance.

- [x] T020 [S0105] Run focused and full verification commands, including unit tests, type-check, lint, build, syntax checks, and endpoint smoke checks, then record results or blockers (`.spec_system/specs/phase01-session05-production-security-hardening/implementation-notes.md`)
- [x] T021 [S0105] Validate security behavior manually for allowed/denied CORS origins, security headers, token limiter paths, malformed payloads, and Gemini production key guard (`.spec_system/specs/phase01-session05-production-security-hardening/implementation-notes.md`)
- [x] T022 [S0105] Validate ASCII encoding, Unix LF endings, and docs consistency before validation handoff (`.spec_system/specs/phase01-session05-production-security-hardening/implementation-notes.md`)
- [x] T023 [S0105] Create the session security compliance report with security findings, residual risks, and GDPR/privacy notes (`.spec_system/specs/phase01-session05-production-security-hardening/security-compliance.md`)

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
