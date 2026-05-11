# Session Specification

**Session ID**: `phase02-session01-translation-api-contract-and-server-route`
**Phase**: 02 - Translation Foundation
**Status**: Completed
**Created**: 2026-05-11
**Completed**: 2026-05-11

---

## 1. Session Overview

This session starts Phase 02 by adding the server-side contract for OpenAI live translation. The current app already has an OpenAI Realtime voice-agent route at `/api/openai/session`, strict token-route rate limiting, request IDs, safe provider error mapping helpers, and production security posture reporting. The translation feature needs a separate route because `gpt-realtime-translate` uses the dedicated realtime translation API surface instead of the normal voice-agent conversation flow.

The primary outcome is a browser-safe Express endpoint, planned as `POST /api/openai/translation-session`, that validates the requested target output language, calls OpenAI with the server-only `OPENAI_API_KEY`, and returns only normalized client-secret data. This closes the open Phase 02 finding that browser translation needs a short-lived client secret boundary before any frontend translation tab or WebRTC call setup can be implemented.

This work intentionally avoids browser media capture, WebRTC SDP exchange, provider-tab UI, transcript rendering, and broad test expansion. Those are later sessions. The design here should make those sessions straightforward by establishing a stable route name, response shape, validation behavior, and rate-limit/security posture.

---

## 2. Objectives

1. Add a dedicated OpenAI translation client-secret route under the existing OpenAI Express route surface.
2. Validate target output language server-side before any OpenAI request.
3. Create `gpt-realtime-translate` client secrets through the dedicated realtime translation endpoint.
4. Return sanitized, normalized browser-safe data with stable error responses for missing key, validation, timeout, and upstream failures.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-ngrok-configuration-detection` - Provides local/demo environment discovery context.
- [x] `phase00-session02-demo-startup-orchestration` - Provides demo startup and process orchestration context.
- [x] `phase00-session03-dynamic-url-configuration` - Provides same-origin runtime API URL behavior.
- [x] `phase00-session04-terminal-output-demo-card` - Provides demo UX and external sharing context.
- [x] `phase01-session01-docker-production-optimization` - Provides production Docker runtime and same-origin deployment baseline.
- [x] `phase01-session02-github-actions-cicd-pipeline` - Provides quality, build, test, and security workflow baseline.
- [x] `phase01-session03-cloud-deployment-configuration` - Provides production deployment and environment-variable contract context.
- [x] `phase01-session04-monitoring-observability` - Provides request IDs, metrics, health posture, and verifier patterns.
- [x] `phase01-session05-production-security-hardening` - Provides strict CORS, security headers, JSON limits, token limiter paths, duplicate in-flight guard, and bounded validation helpers.

### Required Tools/Knowledge

- Express 5 route handlers and middleware ordering.
- Existing OpenAI route patterns in `server/routes/openai.js`.
- Existing token endpoint list and validation helpers in `server/utils/security.js`.
- Official OpenAI realtime translation, model, WebRTC, and client-secret documentation checked on 2026-05-11.
- Local examples in `EXAMPLE/openai-cookbook-realtime-translation/.../browser-translation-demo/` and `EXAMPLE/LinguaForge/yt-translate-poc/`.

### Environment Requirements

- Node.js and npm available locally.
- `OPENAI_API_KEY` remains server-side only and must not be exposed to frontend code.
- Local `.env.example` and `.env.production.example` are available for documentation updates if the route contract adds or clarifies flags.
- No live OpenAI request is required during planning or implementation tests; tests should mock upstream calls.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can mint translation client secrets through Express - Add `POST /api/openai/translation-session` under `server/routes/openai.js`.
- Maintainer can validate target language server-side - Accept only `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, and `en` before any upstream OpenAI call.
- Browser clients receive sanitized client-secret data - Normalize OpenAI responses to a stable shape such as `{ clientSecret, expiresAt, targetLanguage, model }` and do not forward raw upstream response bodies.
- Token route is protected by existing limiter posture - Add `/api/openai/translation-session` to `TOKEN_ENDPOINT_PATHS` so it receives the strict token limiter and duplicate in-flight guard.
- Missing key, validation, timeout, and upstream failures map to stable client responses - Reuse existing provider error style and request timeout behavior.
- Protocol separation is explicit - Do not reuse `/api/openai/session` assumptions that apply to the normal OpenAI voice-agent WebSocket flow.
- Test handoff is documented - Leave notes for Session 04 to expand route validation, sanitization, missing-key, and upstream-failure coverage.

### Out of Scope (Deferred)

- Browser WebRTC call setup and `/v1/realtime/translations/calls` SDP exchange - _Reason: Phase 03 owns the browser translation MVP and WebRTC runtime._
- Translation provider tab UI, feature flag, icon, and empty state - _Reason: Phase 02 Session 03 owns provider-tab scaffold._
- Shared frontend translation config and audio mix helpers - _Reason: Phase 02 Session 02 owns frontend config library work._
- Comprehensive route/config test expansion - _Reason: Phase 02 Session 04 is dedicated to backend and config tests._
- Production safety identifier header - _Reason: The app has no stable hashed user or session identifier yet; record the hook point only._
- Persistent transcript storage, user accounts, or history - _Reason: Explicit PRD non-goals for the translation MVP._

---

## 5. Technical Approach

### Architecture

Extend `server/routes/openai.js` without changing the existing `/api/openai/session` route. Add translation-specific constants for the model and dedicated OpenAI endpoint, a target-language normalizer, a request-body validator, an upstream request builder, a client-secret response normalizer, and a route handler that keeps all OpenAI API key usage on the server.

The route should call `https://api.openai.com/v1/realtime/translations/client_secrets` with a `session` payload for `gpt-realtime-translate`. Target language belongs under `session.audio.output.language`. Source transcription can be requested with `gpt-realtime-whisper` only if the implementation keeps that behavior aligned with the PRD and official examples. The response sent to the browser must contain only the short-lived client secret value, expiration, target language, and model metadata needed by later frontend code.

Update `server/utils/security.js` so the route participates in the strict token limiter and duplicate in-flight guard. If docs or env templates mention OpenAI realtime token routes, update them narrowly so operators understand that the translation route reuses `OPENAI_API_KEY` server-side and does not require a separate secret.

### Design Patterns

- Separate protocol surface: Keep translation route logic distinct from the existing OpenAI voice-agent session route.
- Boundary validation: Reject unsupported or malformed target languages before calling OpenAI.
- Server-only secret boundary: Use `OPENAI_API_KEY` only from Express and return only short-lived client-secret material.
- Stable client contract: Normalize response keys and errors so later React hooks do not depend on raw OpenAI payloads.
- Minimal testable helpers: Structure route helpers so Session 04 can add focused route tests without reworking the handler.

### Technology Stack

- Express 5 route handlers in `server/routes/openai.js`.
- Existing `fetch` and `AbortController` for upstream calls.
- Existing validation and provider error helpers from `server/utils/security.js`.
- Existing `express-rate-limit` token limiter wiring in `server/index.js`.
- Vitest for narrow helper or route smoke tests when practical.

---

## 6. Deliverables

### Files to Create

| File                                                                                                     | Purpose                                                                                          | Est. Lines |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| `.spec_system/specs/phase02-session01-translation-api-contract-and-server-route/implementation-notes.md` | Record implementation decisions, docs verification, route contract, and Session 04 handoff notes | ~100       |

### Files to Modify

| File                              | Changes                                                                                                                                              | Est. Lines |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `server/routes/openai.js`         | Add translation route constants, target-language validation, OpenAI request builder, timeout handling, sanitized response mapping, and route handler | ~170       |
| `server/utils/security.js`        | Add `/api/openai/translation-session` to strict token endpoint coverage and health posture route list                                                | ~5         |
| `src/test/serverSecurity.test.ts` | Update expected token endpoint coverage for the new translation route                                                                                | ~8         |
| `docs/OPENAI_REALTIME.md`         | Document the new translation client-secret boundary and keep voice-agent vs translation route separation clear                                       | ~60        |
| `.env.example`                    | Add or verify `VITE_OPENAI_TRANSLATION_ENABLED` and OpenAI translation notes if missing                                                              | ~20        |
| `.env.production.example`         | Add or verify production notes for translation route secret handling and feature flag if missing                                                     | ~20        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `POST /api/openai/translation-session` exists under the existing OpenAI route surface.
- [ ] The route requires a supported `targetLanguage` and rejects unsupported languages before any OpenAI request.
- [ ] The route calls the dedicated OpenAI realtime translation client-secret endpoint with `gpt-realtime-translate`.
- [ ] The route uses `OPENAI_API_KEY` only server-side and never returns that key or raw OpenAI response bodies.
- [ ] Successful responses are normalized to stable browser-safe client-secret data.
- [ ] Missing API key, invalid request body, timeout, invalid upstream shape, and upstream failure paths return structured errors.
- [ ] The route is included in strict token limiter and duplicate in-flight guard coverage.
- [ ] Implementation notes document the route contract and remaining Session 04 test coverage.

### Testing Requirements

- [ ] Token endpoint coverage test updated for `/api/openai/translation-session`.
- [ ] Narrow route/helper test opportunities documented for Session 04 without duplicating the full route/config matrix.
- [ ] `npm run test:run -- src/test/serverSecurity.test.ts` passes.
- [ ] Relevant focused test command passes or the blocker is recorded.
- [ ] `npm run type-check`, `npm run lint`, and `npm run build` pass or blockers are recorded with exact cause.

### Non-Functional Requirements

- [ ] The new route does not alter existing OpenAI voice-agent session behavior.
- [ ] Browser-visible responses contain no API keys, authorization headers, raw upstream response bodies, or secret-bearing debug fields.
- [ ] Request payloads remain bounded and compatible with the existing JSON body limit.
- [ ] Route naming and response shape are stable enough for Sessions 02, 03, and Phase 03 WebRTC work.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] No real secrets or real-looking credentials committed.

---

## 8. Implementation Notes

### Key Considerations

- Existing `/api/openai/session` uses `https://api.openai.com/v1/realtime/client_secrets` for the normal voice-agent route. Translation must use the dedicated translation endpoint and not share the same request assumptions.
- `TOKEN_ENDPOINT_PATHS` currently centralizes strict token/session limiter coverage. The new translation route must be added there so broad `/api` limiting is not the only protection.
- OpenAI docs checked on 2026-05-11 confirm `gpt-realtime-translate` is a dedicated realtime translation model with the `v1/realtime/translations` endpoint family.
- OpenAI client-secret docs confirm browser apps should receive short-lived client secrets instead of the main API key.
- The OpenAI release post on 2026-05-07 says GPT-Realtime-Translate supports more than 70 input languages and 13 output languages. The PRD fixes the first target output language set to `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, and `en`.
- Session 04 owns broad route/config tests, so this session should add only enough focused coverage to prevent obvious contract drift while documenting the remaining test matrix.

### Potential Challenges

- OpenAI translation endpoint details may shift: Mitigate by keeping endpoint/model constants isolated and recording docs checked date in implementation notes.
- Raw upstream responses can leak sensitive details: Mitigate by extracting only expected client-secret fields and mapping failures to stable messages.
- Route tests can accidentally expand beyond this session: Mitigate by limiting tests to token endpoint coverage and narrow helper/contract checks.
- Adding source transcription to the client-secret payload may need future adjustment: Mitigate by using a small request-builder helper and recording the expected shape for Session 02 and Phase 03.
- Strict limiter path coverage can drift: Mitigate by updating `TOKEN_ENDPOINT_PATHS` and the existing security test in the same session.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Endpoint, model, and request shape were checked against official docs during planning; implementation should record any final docs check in implementation notes.
- [P02] **Translation client secret boundary**: This session directly implements the server-only secret boundary by returning only sanitized short-lived client-secret data.
- [P02] **Translation protocol separation**: Translation route must remain separate from the normal OpenAI voice-agent session route and should not introduce prompts, tools, `response.create`, or assistant-turn assumptions.
- [P02] **Translation teardown coverage**: This route does not own WebRTC teardown, but it must leave a stable contract so later cleanup tests can focus on frontend lifecycle.
- [P01-S01] **Rate limiting is process-local**: The route can reuse current strict limiter posture but should not imply global multi-instance enforcement.
- [P02-S01] **Translation token exchange remains to be implemented**: This session closes the open finding by adding the server-side translation client-secret route.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Translation client-secret route could expose `OPENAI_API_KEY` or raw provider payloads if sanitization is incomplete.
- Unsupported target languages could reach OpenAI if validation happens after the upstream request is built.
- Duplicate start requests could mint unnecessary client secrets if the route is omitted from strict limiter and in-flight guard coverage.

---

## 9. Testing Strategy

### Unit Tests

- Update `src/test/serverSecurity.test.ts` to assert `TOKEN_ENDPOINT_PATHS` includes `/api/openai/translation-session`.
- Document route/helper tests for Session 04, including target-language normalization, invalid language rejection before upstream calls, and sanitized success response shape.

### Integration Tests

- Start the Express server with a fake or mocked OpenAI fetch path only if the implementation supports this safely.
- Exercise invalid request bodies locally and confirm structured 400 responses with no upstream call.
- Confirm token limiter headers appear on `/api/openai/translation-session` in local smoke checks when practical.

### Manual Testing

- Confirm existing `/api/openai/session` still responds through the original voice-agent path.
- Confirm `/api/openai/health` remains unchanged except for any explicit translation readiness notes added intentionally.
- Confirm documentation and env templates make clear that `OPENAI_API_KEY` remains server-side and `VITE_OPENAI_TRANSLATION_ENABLED` only gates frontend visibility.

### Edge Cases

- Missing `OPENAI_API_KEY`.
- Missing `targetLanguage`.
- Uppercase, whitespace-padded, malformed, or unsupported language codes.
- OpenAI timeout or network failure.
- OpenAI non-JSON error response.
- OpenAI success response with missing `value` or nested `client_secret.value`.
- Repeated identical token requests while the first is still in flight.

---

## 10. Dependencies

### External Libraries

- No new external dependency is expected.
- Existing `express-rate-limit` and duplicate in-flight guard are reused through `TOKEN_ENDPOINT_PATHS`.
- Existing global `fetch` and `AbortController` are reused for OpenAI calls.

### Other Sessions

- **Depends on**: `phase01-session05-production-security-hardening`
- **Depended by**: `phase02-session02-shared-translation-config-library`, `phase02-session04-backend-and-config-tests`, `phase03-session01-reusable-webrtc-translation-hook`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
