# Session Specification

**Session ID**: `phase01-session05-production-security-hardening`
**Phase**: 01 - Production Deployment & DevOps
**Status**: Not Started
**Created**: 2026-05-11

---

## 1. Session Overview

This session completes the Phase 01 production hardening pass by auditing the current security baseline, then closing the gaps that remain around production CORS, security headers, token-route rate limiting, server-side input validation, and API key handling. The repository already has Docker production support, CI/CD workflows, deployment documentation, health checks, request IDs, metrics, and broad API rate limiting. The work here is to turn that baseline into an explicit production security posture instead of relying on defaults and scattered route-level checks.

The most important implementation risk is that voice-provider token routes are security boundaries. They accept external browser input, call third-party provider APIs, and return credentials or connection material. This session should make those boundaries strict: exact-origin CORS in production, conservative browser security headers, route-specific rate limiting on the actual session endpoints, bounded request bodies, schema-like validation for each provider payload, and response shapes that never expose server API keys.

This session follows monitoring and observability because security hardening needs a clear health contract, request IDs, deployment verification, and incident response context. It closes Phase 01 and prepares the app for Phase 02 translation work, where the client-secret boundary for OpenAI live translation must be treated as a first-class security invariant.

---

## 2. Objectives

1. Enforce strict production security middleware for CORS, body limits, security headers, and explicit production-mode behavior.
2. Correct and verify rate limiting coverage for all API routes and stricter token/session endpoints.
3. Harden provider and function routes with bounded, schema-like input validation and safe error responses.
4. Document API key rotation, scanner verification, production CORS, and incident response guidance for operators.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session01-docker-production-optimization` - Provides the production Docker image, non-root runtime, and local production Compose path.
- [x] `phase01-session02-github-actions-cicd-pipeline` - Provides lint, type-check, test, build, security, and deploy workflow gates.
- [x] `phase01-session03-cloud-deployment-configuration` - Provides production deployment paths, environment templates, custom-domain guidance, and CORS deployment context.
- [x] `phase01-session04-monitoring-observability` - Provides request IDs, metrics, health posture, production verification, and incident response context.

### Required Tools/Knowledge

- Express middleware ordering, CORS behavior, and security response headers.
- Existing `cors` and `express-rate-limit` middleware behavior.
- Provider route contracts for ElevenLabs, OpenAI, xAI, Ultravox, Retell, Gemini, and local function execution.
- CSP requirements for Vite assets, WebSocket/WebRTC provider traffic, audio worklets, Blob URLs, and same-origin API calls.

### Environment Requirements

- Node.js and npm available locally.
- `.env.production.example` available as the production configuration template.
- Exact production origin supplied through `CORS_ORIGIN` for deployed environments; use `https://voice.example.com` as documentation placeholder only.
- A real production URL is optional for implementation, but external scanner verification is blocked until one exists.

---

## 4. Scope

### In Scope (MVP)

- Operators can rely on strict production CORS - Parse configured origins, reject wildcard production origins, avoid localhost fallback in production, and preserve same-origin requests that do not carry an `Origin` header.
- Browser clients receive security headers - Add a conservative CSP, HSTS in production, frame prevention, content sniffing protection, referrer policy, and permissions policy without breaking current audio/WebRTC behavior.
- Token/session routes are protected by stricter limits - Apply token limiter coverage to the actual provider session routes, including existing `/api/openai/session`, `/api/xai/session`, `/api/ultravox/call`, `/api/retell/create-web-call`, `/api/gemini/session`, and ElevenLabs signed URL flow.
- Provider payloads are bounded and validated server-side - Validate numeric ranges, string lengths, object depth/size, allowed keys, and malformed JSON failure paths before calling third-party APIs.
- Server-side API keys stay server-side - Prevent raw provider API keys from crossing to the browser in production, especially the current Gemini session path, and document any development-only compatibility behavior.
- Operators can rotate provider keys safely - Document rotation cadence, deployment restart expectations, validation commands, and rollback steps.
- Maintainers can verify hardening - Extend local tests and production verification so headers, CORS behavior, rate limiting posture, and API key exposure guarantees are testable.

### Out of Scope (Deferred)

- Authentication and user authorization - Reason: The PRD explicitly excludes account and tenant management.
- WAF, DDoS protection, and bot mitigation - Reason: Cloud or edge platform responsibility for Phase 01.
- Penetration testing - Reason: Requires external scope, environment, and authorization.
- Secret-manager integration - Reason: Deployment targets vary; Phase 01 documents runtime secret handling rather than adding a provider-specific secret backend.
- Full CSP reporting pipeline - Reason: Requires a reporting endpoint and operational process outside this session.

---

## 5. Technical Approach

### Architecture

Create a server-only security helper module under `server/utils/` for origin parsing, production security assertions, header generation, body-size constants, simple payload validation helpers, and safe provider key status helpers. Keep this code out of `src/` so Vite never bundles Node/server security behavior into the frontend.

Wire the helper into `server/index.js` near the top of the middleware stack: security headers first, CORS with a strict origin callback, JSON body parsing with an explicit limit, request logging/metrics, then API and token rate limiters. The current token limiter paths should be reconciled against the real route paths; broad `/api` limits remain useful, but token/session endpoints need the stricter limiter before provider calls happen.

Provider routes should use narrow validation helpers rather than ad hoc destructuring. The route handlers should reject malformed or excessive input with structured 400 responses, map upstream provider failures without leaking upstream response bodies, and avoid logging unsanitized payloads. Gemini needs special attention because the current route returns the raw server API key as a browser token. Production behavior should reject that flow unless a browser-safe token exchange exists, while documentation captures the compatibility impact.

### Design Patterns

- Server-only security boundary: Keep security middleware and validation helpers under `server/utils/`.
- Deny unsafe production config: Treat `CORS_ORIGIN=*`, missing production origin, and localhost-only production origin as explicit misconfiguration.
- Conservative headers: Start with headers that protect the browser without blocking current WebRTC, WebSocket, Blob, and same-origin asset behavior.
- Boundary validation: Validate inputs before provider API calls and return structured errors without raw provider details.
- Documentation as control plane: API key rotation and security scanner checks are operator procedures, so docs and runbooks are deliverables.

### Technology Stack

- Express 5 middleware and route handlers.
- Existing `cors` middleware.
- Existing `express-rate-limit` middleware.
- Node.js built-in URL and crypto/runtime APIs.
- Vitest tests under `src/test/`.
- Existing deployment verifier script in `scripts/deploy/verify-production.mjs`.

---

## 6. Deliverables

### Files to Create

| File                              | Purpose                                                                                                     | Est. Lines |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| `server/utils/security.js`        | Server-only production security config, header middleware, origin parsing, and validation helpers           | ~220       |
| `src/test/serverSecurity.test.ts` | Focused tests for security config, origin decisions, headers, validation helpers, and key exposure guards   | ~160       |
| `docs/SECURITY_HARDENING.md`      | Operator guide for production CORS, headers, rate limits, key rotation, scanner checks, and known deferrals | ~170       |

### Files to Modify

| File                                                                                         | Changes                                                                                                                             | Est. Lines |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `server/index.js`                                                                            | Wire security headers, strict CORS callback, explicit JSON limits, actual token-route limiter coverage, and health security posture | ~140       |
| `server/routes/xai.js`                                                                       | Validate `expirySeconds` range and malformed body behavior before creating provider sessions                                        | ~45        |
| `server/routes/ultravox.js`                                                                  | Validate prompt, voice, and model fields with bounded string rules before provider calls                                            | ~50        |
| `server/routes/retell.js`                                                                    | Validate agent ID, metadata, and dynamic variables with bounded object rules before provider calls                                  | ~60        |
| `server/routes/gemini.js`                                                                    | Prevent raw `GEMINI_API_KEY` exposure in production and validate model input with explicit error mapping                            | ~70        |
| `server/routes/functions.js`                                                                 | Bound function names, call IDs, arguments, timezone/location/expression values, timeout cleanup, and safe logging                   | ~80        |
| `scripts/deploy/verify-production.mjs`                                                       | Add optional checks for security headers, CORS rejection, and production hardening hints                                            | ~80        |
| `.env.production.example`                                                                    | Add security env comments for exact origins, body limits if configurable, and Gemini browser-token posture                          | ~30        |
| `docs/DEPLOYMENT.md`                                                                         | Reconcile production CORS, security headers, scanner commands, and key rotation deployment steps                                    | ~90        |
| `docs/SECURITY.md`                                                                           | Update policy date, remove stale product naming, and link the hardening guide                                                       | ~45        |
| `docs/runbooks/incident-response.md`                                                         | Add CORS/security-header/rate-limit/API-key incident triage and rotation steps                                                      | ~70        |
| `.spec_system/specs/phase01-session05-production-security-hardening/implementation-notes.md` | Record audit findings, implementation decisions, verification output, and blocked scanner checks                                    | ~100       |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Production CORS allows only configured exact origins and rejects unauthorized origins.
- [ ] Production startup or health posture clearly reports unsafe origin configuration instead of silently falling back to localhost.
- [ ] Security headers include CSP, HSTS in production, frame prevention, no-sniff, referrer policy, and permissions policy.
- [ ] Broad API rate limiting remains active for all `/api` routes.
- [ ] Stricter token/session rate limiting applies to every provider session or signed-token route.
- [ ] Provider and function routes reject malformed, oversized, or out-of-range input before external calls.
- [ ] Raw server API keys are not returned to browser clients in production.
- [ ] API key rotation guidance and scanner verification steps are documented.

### Testing Requirements

- [ ] Unit tests cover security config parsing, CORS decisions, header creation, payload validation, and production key exposure guards.
- [ ] Existing repository tests pass or blocked failures are documented with exact cause.
- [ ] Type-check, lint, and build pass or blocked failures are documented with exact cause.
- [ ] Local endpoint smoke tests verify headers, CORS allowed/rejected origins, token limiter posture, and Gemini production guard.

### Non-Functional Requirements

- [ ] Security controls do not break current same-origin production serving, local development, demo-mode ngrok flow, or provider readiness health checks.
- [ ] CSP is conservative but compatible with current WebRTC, WebSocket, audio worklet, Blob URL, and provider API needs.
- [ ] Logs and errors do not expose authorization headers, cookies, raw provider responses, request bodies, API keys, or audio data.
- [ ] No new persistent storage or authentication dependency is introduced.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] No secrets committed or represented as real-looking credentials.

---

## 8. Implementation Notes

### Key Considerations

- `server/index.js` already has broad API rate limiting, but the stricter token limiter currently targets `/api/openai/token` and `/api/xai/token` while the real routes are `/api/openai/session` and `/api/xai/session`.
- `server/index.js` currently uses `process.env.CORS_ORIGIN || 'http://localhost:8082'`, which is acceptable for development but unsafe as an implicit production fallback.
- `server/routes/gemini.js` currently returns the raw `GEMINI_API_KEY` as a browser token. This conflicts with the PRD requirement that server API keys never reach frontend code.
- `server/routes/functions.js` already has a function allowlist and timeout, but it logs argument/result payloads and should bound inputs more carefully.
- CSP must account for Vite-built assets, WebSocket providers, WebRTC/media permissions, Blob-backed audio worklets, and same-origin API calls.
- The project has no `.spec_system/SECURITY-COMPLIANCE.md` file yet, so session-specific security decisions should be recorded in implementation notes and a session security report during implementation/validation.

### Potential Challenges

- Strict CORS can accidentally block same-origin Docker deployments: Mitigate by allowing requests with no `Origin` header and testing exact-origin browser requests.
- CSP can break provider media or worklets: Mitigate with a conservative allowlist, manual smoke checks, and documented rationale for each directive.
- Blocking Gemini raw API key exposure can change existing behavior: Mitigate with a clear production guard, explicit error copy, and documentation of the browser-safe token requirement.
- Rate limit path fixes can be missed when routes change: Mitigate by centralizing token endpoint paths and exposing them in health/security posture.
- Security scanner checks need a real HTTPS deployment: Mitigate by documenting blocked external checks and preserving local header verification.

### Relevant Considerations

- [P00] **Demo mode CORS configuration**: Preserve same-origin ngrok demo behavior while preventing demo-only permissiveness from leaking into production.
- [P00] **jq availability varies**: Verification scripts and docs should not require `jq`.
- [P00] **ASCII-only output**: New scripts, docs, and spec artifacts must use ASCII-safe text.
- [P02] **Translation client secret boundary**: This hardening session should establish patterns that future translation client-secret routes can reuse.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Security middleware ordering can silently leave sensitive routes unprotected.
- Stricter CORS, CSP, and token limits can break legitimate local, demo, or production provider flows.
- Provider routes can leak sensitive values through logs, raw upstream errors, or browser responses if validation/error mapping is incomplete.

---

## 9. Testing Strategy

### Unit Tests

- Test production/development CORS origin parsing, wildcard rejection, localhost fallback behavior, and no-origin same-origin allowance.
- Test security header values and environment-specific HSTS behavior.
- Test validation helpers for bounded strings, positive integers, plain objects, object size/depth limits, and allowed-key checks.
- Test Gemini production guard prevents raw API key return.

### Integration Tests

- Start the Express server locally with production-like env values and curl `/api/health` for security posture.
- Exercise allowed and denied CORS preflight requests with explicit `Origin` headers.
- Hit provider session endpoints with malformed and oversized payloads and confirm structured 400 responses.
- Run `npm run deploy:verify -- --url http://localhost:3001 --skip-root` against a local server when feasible.

### Manual Testing

- Verify development mode still allows `http://localhost:8082`.
- Verify demo mode still loads `.env.demo` and uses ngrok-provided same-origin or configured origin behavior.
- Verify production static serving still works after adding headers and body limits.
- Run a security header scan against the real production URL when available and record blocked status if unavailable.

### Edge Cases

- `CORS_ORIGIN` unset in production.
- `CORS_ORIGIN=*` in production.
- Multiple comma-separated allowed origins, with whitespace and trailing slash normalization.
- Requests with no `Origin` header from curl, health checks, or same-origin navigation.
- Oversized JSON payloads and malformed JSON.
- Provider upstream errors that include sensitive text.
- Gemini enabled in production without a browser-safe token exchange.

---

## 10. Dependencies

### External Libraries

- `cors`: Already present and should be reused with a strict origin callback.
- `express-rate-limit`: Already present and should be reused for broad API and token/session limits.
- No new dependency is expected for the MVP; add `helmet` only if custom headers prove insufficient and justify the dependency.

### Other Sessions

- **Depends on**: `phase01-session01-docker-production-optimization`, `phase01-session02-github-actions-cicd-pipeline`, `phase01-session03-cloud-deployment-configuration`, `phase01-session04-monitoring-observability`
- **Depended by**: `phase02-session01-translation-api-contract-and-server-route`
- **Enables**: Secure production baseline for OpenAI translation client-secret work, provider token routes, and future deployment hardening

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
