# Task Checklist

**Session ID**: `phase02-session01-translation-api-contract-and-server-route`
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
| Foundation     | 4      | 4      | 0         |
| Implementation | 7      | 7      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (3 tasks)

Initial route-contract verification and session preparation.

- [x] T001 [S0201] Verify Phase 01 security prerequisites, Phase 02 session stub scope, and current OpenAI route behavior (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)
- [x] T002 [S0201] Re-check official OpenAI realtime translation docs and record endpoint, model, client-secret, and language assumptions (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)
- [x] T003 [S0201] Audit existing OpenAI route, token limiter paths, validation helpers, and docs/env references before editing (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)

---

## Foundation (4 tasks)

Core route helpers, constants, and contract scaffolding.

- [x] T004 [S0201] Add translation endpoint, model, timeout, supported-language constants, and target-language validation helpers with schema-validated input and explicit error mapping (`server/routes/openai.js`)
- [x] T005 [S0201] Add client-secret request builder for `gpt-realtime-translate` with server-only API key usage, target output language, timeout support, and no voice-agent prompt/tool assumptions (`server/routes/openai.js`)
- [x] T006 [S0201] Add sanitized OpenAI response normalizer that extracts only client-secret value, expiration, target language, and model metadata (`server/routes/openai.js`)
- [x] T007 [S0201] [P] Add initial implementation notes with docs checked, route contract, deferred scope, and Session 04 test handoff (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)

---

## Implementation (7 tasks)

Translation route, limiter coverage, docs, and environment contract.

- [x] T008 [S0201] Implement `POST /api/openai/translation-session` with missing-key handling, target-language validation before upstream calls, timeout cleanup, and stable client responses (`server/routes/openai.js`)
- [x] T009 [S0201] Map OpenAI timeout, invalid response, and upstream failure paths to stable structured errors without forwarding raw upstream bodies (`server/routes/openai.js`)
- [x] T010 [S0201] Add `/api/openai/translation-session` to strict token limiter and duplicate in-flight guard coverage (`server/utils/security.js`)
- [x] T011 [S0201] Update security utility test expectations for the new strict translation token route (`src/test/serverSecurity.test.ts`)
- [x] T012 [S0201] [P] Update OpenAI realtime documentation with voice-agent route versus translation route separation and browser-safe client-secret behavior (`docs/OPENAI_REALTIME.md`)
- [x] T013 [S0201] [P] Verify or add translation feature-flag and secret-boundary notes in the development env template (`.env.example`)
- [x] T014 [S0201] [P] Verify or add translation feature-flag and secret-boundary notes in the production env template (`.env.production.example`)

---

## Testing (4 tasks)

Verification, encoding, and handoff checks.

- [x] T015 [S0201] Run focused tests for security route coverage, then record results and Session 04 route-helper test opportunities (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)
- [x] T016 [S0201] Run `npm run type-check`, `npm run lint`, and `npm run build`, then record results or exact blockers (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)
- [x] T017 [S0201] Manually smoke-check route behavior for invalid language, missing key, existing `/api/openai/session` compatibility, and strict limiter headers when practical (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)
- [x] T018 [S0201] Validate ASCII encoding, Unix LF endings, docs consistency, and Session 04 handoff notes before validation workflow (`.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md`)

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
