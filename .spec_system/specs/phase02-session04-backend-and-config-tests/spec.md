# Session Specification

**Session ID**: `phase02-session04-backend-and-config-tests`
**Phase**: 02 - Translation Foundation
**Status**: Completed
**Completed**: 2026-05-11
**Created**: 2026-05-11

---

## 1. Session Overview

This session closes Phase 02 by adding focused verification around the OpenAI live translation foundation that Sessions 01 through 03 introduced. The backend already exposes `POST /api/openai/translation-session`, the frontend has a pure `src/lib/openaiTranslation.ts` config module, and the provider tab scaffold is present behind `VITE_OPENAI_TRANSLATION_ENABLED`. The remaining Phase 02 work is to turn those contracts into durable tests before the WebRTC runtime and browser media work begins in Phase 03.

The main outcome is a backend route test file that exercises target-language validation, missing API key handling, sanitized OpenAI client-secret responses, invalid upstream shapes, non-JSON upstream success responses, upstream status mapping, and timeout/fetch failure paths without making real OpenAI requests. The session also strengthens frontend config coverage for the exact PRD language list and audio mix edge cases, and confirms security-route coverage for the strict token limiter path.

This work intentionally avoids browser media permissions, WebRTC peer connections, data-channel handling, transcript rendering, Playwright media tests, and translation hook cleanup. Those belong to later browser-translation MVP and hardening sessions. The tests produced here should make later implementation safer by locking down the route and pure config contracts that Phase 03 will consume.

---

## 2. Objectives

1. Add route-level tests for `POST /api/openai/translation-session` success and failure paths.
2. Verify OpenAI upstream calls are mocked, sanitized, and never expose raw API keys or raw upstream bodies.
3. Strengthen shared translation config tests for exact language-list correctness and audio-mix clamping behavior.
4. Confirm the translation token route remains covered by strict token endpoint security expectations.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session01-translation-api-contract-and-server-route` - Provides the backend translation client-secret route, supported language validation, sanitized response helpers, and strict token route path.
- [x] `phase02-session02-shared-translation-config-library` - Provides frontend translation constants, language helpers, audio mix helpers, and route request builders.
- [x] `phase02-session03-provider-tab-scaffold` - Provides the feature-gated translation provider identity and placeholder UI branch that will later consume the tested contracts.

### Required Tools/Knowledge

- Express 5 route testing without adding new test dependencies.
- Vitest 4 with per-file Node environment annotations for backend route tests.
- Existing test conventions in `src/test/openaiTranslation.test.ts` and `src/test/serverSecurity.test.ts`.
- Existing route helpers and exports in `server/routes/openai.js`.
- Existing security utility contract in `server/utils/security.js`.

### Environment Requirements

- Node.js and npm available locally.
- No live OpenAI API requests; all upstream calls must be mocked.
- No real `OPENAI_API_KEY` required; tests should control `process.env.OPENAI_API_KEY`.
- All created or modified files must remain ASCII-only with Unix LF line endings.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can verify translation route validation - Add tests that reject missing, malformed, extra-field, and unsupported `targetLanguage` values before any upstream request.
- Maintainer can verify missing key handling - Add tests that return the stable missing-key response when `OPENAI_API_KEY` is absent.
- Maintainer can verify OpenAI upstream request shape - Mock `fetch` and assert the route calls the dedicated translation client-secret endpoint with `gpt-realtime-translate` and `session.audio.output.language`.
- Browser clients receive only sanitized response data - Test success responses from both supported OpenAI client-secret shapes and assert no raw upstream fields leak.
- Maintainer can verify error mapping - Cover invalid upstream shapes, non-JSON success bodies, authorization failures, rate limits, service errors, timeouts, and fetch rejections.
- Maintainer can verify config correctness - Strengthen tests for the exact 13 output languages, uniqueness, labels, audio mix clamping, fallback behavior, and request descriptor shape.
- Maintainer can verify security route coverage - Confirm `/api/openai/translation-session` remains listed in `TOKEN_ENDPOINT_PATHS`.

### Out of Scope (Deferred)

- Full WebRTC integration tests - _Reason: Phase 03 owns peer connection, SDP exchange, translated audio playback, and data-channel behavior._
- Browser media permission or `getDisplayMedia()` tests - _Reason: Phase 03 Session 02 and Phase 04 own capture-mode and browser-permission coverage._
- Translation hook cleanup tests - _Reason: The reusable WebRTC translation hook is not implemented until Phase 03 Session 01._
- Playwright media E2E coverage - _Reason: Later hardening sessions own browser-level media reliability checks._
- Persistent transcript storage or account-scoped history - _Reason: Explicit PRD non-goals._

---

## 5. Technical Approach

### Architecture

Create a backend-focused Vitest file under `src/test/` with a Node test environment annotation. The test should mount the existing OpenAI router on a small Express app, use `express.json()`, and send requests through a local ephemeral HTTP listener or equivalent fetch path. This keeps route behavior realistic without adding `supertest` or starting the production server.

Mock `globalThis.fetch` for all upstream OpenAI calls and restore it after each test. Use controlled `process.env.OPENAI_API_KEY` setup and teardown so tests prove the server-only secret boundary without relying on developer machine environment. The tests should assert request URL, headers, body shape, status codes, and client-visible JSON responses, but should not assert private implementation details that would make harmless refactors expensive.

Extend the existing frontend config test file rather than creating a second pure-config suite. That keeps the pure helper coverage in one place and lets the route tests focus on backend behavior. If route tests expose a small contract issue, patch the implementation in `server/routes/openai.js` narrowly while preserving the existing voice-agent route behavior.

### Design Patterns

- Route-level black-box tests: Exercise public HTTP behavior through the router instead of only calling helper functions.
- Mocked external boundary: Replace OpenAI `fetch` with deterministic mocks for every upstream success and failure path.
- Server-only secret boundary: Assert API key usage stays in the upstream authorization header and never appears in browser-visible JSON.
- Stable error contract: Test structured `{ error, message }` responses rather than raw OpenAI bodies.
- Pure helper coverage: Keep frontend language/audio mix assertions deterministic and side-effect free.

### Technology Stack

- Express 5 router and JSON middleware.
- Vitest 4 with Node environment for route tests and jsdom for existing frontend tests.
- Node global `fetch`, `AbortController`, and local HTTP server primitives where needed.
- TypeScript 6 for frontend config tests.

---

## 6. Deliverables

### Files to Create

| File                                                                                    | Purpose                                                                                                                               | Est. Lines |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/test/openaiTranslationRoute.test.ts`                                               | Backend route tests for translation client-secret validation, sanitized success, upstream errors, timeout, and fetch failure behavior | ~260       |
| `.spec_system/specs/phase02-session04-backend-and-config-tests/implementation-notes.md` | Implementation notes, test evidence, edge cases covered, and any narrow fixes made                                                    | ~120       |

### Files to Modify

| File                                 | Changes                                                                                                        | Est. Lines |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/test/openaiTranslation.test.ts` | Strengthen exact language list, uniqueness, request descriptor, audio mix fallback, and rounding edge coverage | ~80        |
| `src/test/serverSecurity.test.ts`    | Confirm or update strict token endpoint coverage for `/api/openai/translation-session`                         | ~10        |
| `server/routes/openai.js`            | Apply only narrow route/helper fixes if new tests reveal contract drift                                        | ~40        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Missing `OPENAI_API_KEY` behavior is covered with no upstream fetch call.
- [ ] Unsupported, malformed, missing, and extra-field request bodies are covered and rejected before upstream calls.
- [ ] Successful OpenAI responses from `value` and nested `client_secret.value` shapes are sanitized to `{ clientSecret, expiresAt, targetLanguage, model }`.
- [ ] Successful responses do not leak `OPENAI_API_KEY`, authorization headers, or raw upstream-only fields.
- [ ] Invalid OpenAI success shapes and non-JSON success bodies map to stable 502 errors.
- [ ] OpenAI 401/403, 429, 5xx, timeout, and fetch rejection paths map to stable structured errors.
- [ ] Frontend target language constants contain exactly the documented 13 output languages in the PRD order.
- [ ] Audio mix helpers clamp, fallback, round, and compute original/translated volume values deterministically.

### Testing Requirements

- [ ] Backend route tests run without real OpenAI network calls.
- [ ] Frontend config tests cover exact language list and audio mix edge cases.
- [ ] Security utility tests continue to assert strict token route coverage.
- [ ] `npm run test:run -- src/test/openaiTranslationRoute.test.ts src/test/openaiTranslation.test.ts src/test/serverSecurity.test.ts` passes.
- [ ] `npm run test:run`, `npm run type-check`, `npm run lint`, and `npm run build` pass or exact blockers are recorded.

### Non-Functional Requirements

- [ ] No new runtime or test dependency is added unless unavoidable and justified.
- [ ] Existing `/api/openai/session` voice-agent behavior remains unchanged.
- [ ] Tests are deterministic and restore global/env state after each case.
- [ ] No real secrets, secret-looking fixtures, or raw provider payloads are committed.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Test names describe user-visible contract behavior, not private implementation trivia.

---

## 8. Implementation Notes

### Key Considerations

- `server/routes/openai.js` already exports several translation helpers, but the most valuable coverage for this session is route-level behavior with mocked fetch and controlled environment state.
- `src/test/openaiTranslation.test.ts` already covers many pure helper basics. This session should extend edge coverage instead of duplicating assertions line-for-line.
- `TOKEN_ENDPOINT_PATHS` already includes `/api/openai/translation-session`; the session should keep that assertion explicit so future route refactors do not drop strict token limiting.
- The route timeout is 30 seconds in implementation. Tests should avoid waiting real time; prefer fake timers or direct abort/fetch rejection simulation where practical.
- The route should preserve OpenAI live translation protocol separation and never reuse prompt/tool/`response.create` assumptions from the OpenAI voice-agent provider.

### Potential Challenges

- Express route tests may be awkward without `supertest`: Mitigate by creating a small local app/listener helper inside the test file and using Node fetch.
- Fake timers and fetch mocks can interfere across tests: Mitigate by restoring timers, fetch, and environment variables in `afterEach`.
- Route tests might become too implementation-specific: Mitigate by asserting public HTTP contract and critical upstream request shape only.
- Timeout tests can become flaky: Mitigate by simulating abort behavior or using controlled fake timers instead of real 30-second waits.
- Existing jsdom Vitest config may not suit backend tests: Mitigate with a per-file `// @vitest-environment node` annotation before changing global config.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Tests should isolate endpoint/model constants so future docs-driven updates fail in one obvious place.
- [P02] **Translation client secret boundary**: Route tests directly prove the server-only secret boundary and sanitized browser response shape.
- [P02] **Translation protocol separation**: Tests should guard against voice-agent prompt, tool, voice, or `response.create` fields entering translation payloads.
- [P02] **Translation teardown coverage**: This session does not own WebRTC teardown, but reliable route/config tests reduce noise when cleanup tests are added later.
- [P01-S01] **Rate limiting is process-local**: This session can confirm route inclusion in the current strict limiter list, but it does not solve multi-instance rate limiting.
- [P02-S01] **Translation token exchange remains to be implemented**: Sessions 01 and 02 implemented the contract; this session adds the proof that it behaves as declared.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Tests may accidentally call the real OpenAI API if fetch mocking is incomplete.
- Browser-visible responses may leak raw upstream data unless success and failure sanitization are asserted.
- Later browser translation work may inherit a broken route/config contract if language drift and audio mix edge cases are not covered now.

---

## 9. Testing Strategy

### Unit Tests

- Extend `src/test/openaiTranslation.test.ts` for exact language order, uniqueness, ASCII labels, invalid/fallback audio mix values, rounding behavior, and request descriptor JSON shape.
- Keep `src/test/serverSecurity.test.ts` coverage for `/api/openai/translation-session` in `TOKEN_ENDPOINT_PATHS`.

### Integration Tests

- Add `src/test/openaiTranslationRoute.test.ts` to mount the existing OpenAI router under `/api/openai`.
- Mock OpenAI fetch and assert success, validation, missing-key, upstream status, invalid response, timeout, and fetch rejection behavior.
- Assert upstream request payload uses `session.audio.output.language` and `gpt-realtime-translate`.

### Manual Testing

- Review test failure messages for clarity before closing the session.
- Inspect implementation notes to ensure every PRD Session 04 success criterion is mapped to a test or recorded blocker.

### Edge Cases

- Missing body, empty body, non-string target language, whitespace target language, malformed code, unsupported code, uppercase supported code, and extra request fields.
- OpenAI response with `value`, nested `client_secret.value`, numeric and string `expires_at`, missing client secret, invalid JSON, 401/403, 429, 500, timeout, and thrown fetch error.
- Audio mix values below 0, above 100, decimal strings, empty strings, non-numeric strings, `NaN`, and infinity.

---

## 10. Dependencies

### External Libraries

- Express: existing route framework.
- Vitest: existing unit and integration test runner.

### Internal Modules

- `server/routes/openai.js`: Translation route and helper behavior under test.
- `server/utils/security.js`: Token endpoint path coverage and validation helper behavior.
- `src/lib/openaiTranslation.ts`: Frontend translation constants and pure helpers under test.
- `src/types/openai-translation.ts`: Shared frontend translation types.

### Other Sessions

- **Depends on**: `phase02-session01-translation-api-contract-and-server-route`, `phase02-session02-shared-translation-config-library`, `phase02-session03-provider-tab-scaffold`
- **Depended by**: Phase 03 Browser Translation MVP sessions, especially reusable WebRTC hook and source capture work.

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
