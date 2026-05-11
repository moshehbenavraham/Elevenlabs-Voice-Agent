# Session Specification

**Session ID**: `phase05-session01-production-safety-and-usage-controls`
**Phase**: 05 - Production Extensions and Media Variants
**Status**: Complete
**Created**: 2026-05-12

---

## 1. Session Overview

This session starts Phase 05 by tightening the production safety controls around the completed OpenAI live translation MVP. The existing browser translation path already has WebRTC startup, teardown, diagnostics, transcript export, and a frontend max-session timer; this session makes those controls easier to deploy deliberately and easier to audit in production-like environments.

The work focuses on the existing translation route and build/deploy surfaces. It validates the 30-minute default and 120-minute hard maximum, makes Docker and GitHub image builds carry the translation feature flags explicitly, confirms token route limiter coverage, and adds sanitized server-side observability for translation token/session lifecycle events.

This session does not add accounts, billing, persistent storage, shared-store rate limiting, raw-audio bridges, room translation, telephony, or subtitle overlays. Those remain deferred to later Phase 05 sessions or future phases.

---

## 2. Objectives

1. Enforce and test translation max-session configuration with a 30-minute default and 120-minute hard maximum.
2. Propagate translation build-time flags through Docker, local Compose, and GitHub image builds without exposing server-side secrets.
3. Confirm translation token route limiter and in-flight guard coverage while documenting that current rate limiting is process-local.
4. Add sanitized translation token/session lifecycle observability that avoids raw provider bodies, transcripts, audio, cookies, authorization headers, and API keys.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session01-lifecycle-reliability` - Provides stable translation start/stop cleanup and duplicate-trigger prevention.
- [x] `phase04-session02-error-states-and-diagnostics` - Provides stable browser-visible error categories and route diagnostics.
- [x] `phase04-session03-unit-and-integration-coverage` - Provides existing route, helper, and provider test coverage to extend.
- [x] `phase04-session04-e2e-and-browser-smoke-tests` - Provides Chromium smoke coverage for the translation tab.
- [x] `phase04-session05-documentation-and-demo-configuration` - Provides the current translation runbook and environment documentation baseline.

### Required Tools/Knowledge

- Official OpenAI realtime translation documentation for endpoint, model, SDP, and event contract verification.
- Express 5 route patterns, `express-rate-limit`, and the existing token in-flight guard.
- Existing pino request logging and in-memory metrics in `server/utils/observability.js`.
- Vite build-time environment behavior for `VITE_*` variables.
- Dockerfile, Docker Compose, and GitHub Actions image build argument behavior.

### Environment Requirements

- Node.js and npm dependencies installed.
- Docker available for `docker compose config` validation when possible.
- No live OpenAI API call required for the baseline implementation or tests.
- `.env` and production secrets remain uncommitted.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can verify current OpenAI translation endpoint and model assumptions before protocol-specific code changes - record assumptions in durable docs and implementation notes.
- Operator can configure OpenAI Translation visibility and max-session duration in production image builds - add explicit build args for local Docker, Compose, and GitHub image builds.
- User cannot run an app-configured translation session beyond the documented hard cap - keep frontend max-session normalization capped at 120 minutes and covered by tests.
- Maintainer can confirm the translation token route is covered by strict token limiting - assert `/api/openai/translation-session` remains in token endpoint coverage and document process-local limits.
- Operator can inspect translation token/session lifecycle events safely - log only sanitized metadata such as request ID, target language, status category/code, duration config source, and route result.
- Maintainer can explain privacy, cost, usage, and operational guardrails - update production, observability, and translation documentation.

### Out of Scope (Deferred)

- User authentication, accounts, tenant policy, billing, or quota management - Reason: PRD explicitly excludes these from this session.
- Shared-store or platform-level global rate limiting - Reason: residual P01 risk remains documented until multi-instance infrastructure is chosen.
- Persistent transcript, audio, or evaluation result storage - Reason: privacy and evaluation workflows are separate concerns.
- New translation UI features unrelated to safety, duration, or usage controls - Reason: Session 01 is a production-control pass, not a UX expansion.
- Raw-audio, telephony, room, or overlay variants - Reason: assigned to later Phase 05 sessions.

---

## 5. Technical Approach

### Architecture

Keep the browser translation protocol boundary unchanged: the frontend captures media and exchanges SDP through the OpenAI translation calls endpoint, while the backend only mints sanitized client secrets through `/api/openai/translation-session`. Production controls should wrap that boundary, not merge translation into the normal OpenAI voice-agent provider.

Add a small server-side translation safety helper for duration config normalization and sanitized lifecycle metadata. The helper should be pure, easy to unit test, and explicit about what is enforced locally versus documented as a platform responsibility. Route observability should use the existing server logging/metrics posture and never log request bodies, upstream bodies, client secrets, audio, transcripts, cookies, authorization headers, or API keys.

For safety identifiers, use request IDs and bounded route metadata only. Do not derive a stable identifier from IP address, user agent, cookies, authorization headers, or raw provider data. If no stable non-PII app identifier already exists, document the safety identifier hook as deferred rather than fabricating one.

### Design Patterns

- Pure helper module: Keeps duration and safety metadata behavior testable without starting Express.
- Route-boundary validation: Keeps target language, unsupported fields, and safety metadata validated before upstream calls.
- Sanitized structured logging: Emits only whitelisted fields and stable categories/codes.
- Explicit build args: Makes translation feature flags visible in every production image build path.
- Documentation-as-contract: Records process-local limiter and CSP caveats so operators do not mistake them for global controls.

### Technology Stack

- React 19, TypeScript, Vite 8, and existing translation helper patterns.
- Express 5, Node.js ES modules, and existing route middleware.
- `express-rate-limit` and existing token in-flight guard.
- pino server logging and in-memory request metrics.
- Dockerfile, Docker Compose, and GitHub Actions Docker build workflow.
- Vitest and existing route/helper test conventions.

---

## 6. Deliverables

### Files to Create

| File                                                                                                | Purpose                                                                                                           | Est. Lines |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| `server/utils/translationSafety.js`                                                                 | Pure server helper for translation duration config, safe event metadata, and deferred safety identifier behavior. | ~160       |
| `src/test/translationSafety.test.ts`                                                                | Unit coverage for duration defaults, hard caps, sanitization, and identifier deferral.                            | ~180       |
| `.spec_system/specs/phase05-session01-production-safety-and-usage-controls/implementation-notes.md` | Session implementation notes and official-doc re-check record.                                                    | ~80        |
| `.spec_system/specs/phase05-session01-production-safety-and-usage-controls/security-compliance.md`  | Session security and GDPR review notes.                                                                           | ~80        |

### Files to Modify

| File                                                     | Changes                                                                                                                          | Est. Lines |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `server/routes/openai.js`                                | Add sanitized translation lifecycle logging and duration/safety metadata integration around the translation client-secret route. | ~80        |
| `server/utils/observability.js`                          | Add or reuse a safe helper for translation lifecycle event records if route-local logging is not sufficient.                     | ~60        |
| `server/utils/security.js`                               | Confirm token endpoint coverage stays explicit for the translation route.                                                        | ~20        |
| `src/lib/openaiTranslation.ts`                           | Keep max-session normalization aligned with server/docs and preserve hard-cap behavior.                                          | ~40        |
| `src/components/providers/OpenAITranslationProvider.tsx` | Surface existing max-session config source only if needed for diagnostics without adding unrelated UI.                           | ~40        |
| `Dockerfile`                                             | Add explicit translation build-time args with safe defaults.                                                                     | ~10        |
| `docker-compose.yml`                                     | Pass translation build-time args into the local production build.                                                                | ~10        |
| `.github/workflows/deploy.yml`                           | Pass translation build-time args from repository variables during image builds.                                                  | ~20        |
| `.env.example`                                           | Clarify translation build-time flags and max-session guardrails.                                                                 | ~20        |
| `docs/OPENAI_TRANSLATION_DEMO.md`                        | Add privacy, cost, duration, and operational guardrails.                                                                         | ~80        |
| `docs/DEPLOYMENT.md`                                     | Document production image build args and process-local limiter caveats.                                                          | ~70        |
| `docs/OBSERVABILITY.md`                                  | Document sanitized translation lifecycle events and excluded data.                                                               | ~60        |
| `docs/SECURITY.md`                                       | Document privacy posture, no persistent transcript/audio storage, and residual platform controls.                                | ~60        |
| `src/test/openaiTranslationRoute.test.ts`                | Cover sanitized route lifecycle events and no secret leakage.                                                                    | ~120       |
| `src/test/openaiTranslation.test.ts`                     | Cover frontend max-session config defaults, caps, and env-facing behavior.                                                       | ~70        |
| `src/test/serverSecurity.test.ts`                        | Assert translation token endpoint limiter coverage remains explicit.                                                             | ~30        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Translation max-session settings keep the 30-minute default and cap configured values above 120 minutes.
- [ ] Dockerfile, local Compose, and GitHub image builds expose translation feature and max-session build args explicitly.
- [ ] `/api/openai/translation-session` remains covered by the token limiter and token in-flight guard.
- [ ] Translation token/session lifecycle logs include only sanitized whitelisted metadata.
- [ ] Documentation states what is enforced locally and what still requires platform-level/shared-store controls.

### Testing Requirements

- [ ] Unit tests cover translation safety helper defaults, caps, invalid input, and sanitized records.
- [ ] Route tests cover sanitized success/failure lifecycle logging with no client secret, API key, raw upstream body, raw transcript, audio, cookie, or authorization leakage.
- [ ] Security tests assert translation token endpoint limiter coverage.
- [ ] Docker Compose interpolation is checked with `docker compose config` when Docker is available.
- [ ] Existing voice-agent provider behavior is not regressed by targeted test runs.

### Non-Functional Requirements

- [ ] No new persistent personal data store is introduced.
- [ ] No new dependency is added unless an existing standard-library or local helper cannot satisfy the need.
- [ ] Production docs distinguish process-local enforcement from global multi-instance enforcement.
- [ ] Translation remains separate from the normal OpenAI voice-agent session contract.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Tests avoid real provider calls.
- [ ] Logs and docs avoid raw secrets and private media content.

---

## 8. Implementation Notes

### Key Considerations

- The frontend already has `normalizeOpenAITranslationMaxSessionConfig`, `OPENAI_TRANSLATION_DEFAULT_MAX_SESSION_MINUTES`, and `OPENAI_TRANSLATION_HARD_MAX_SESSION_MINUTES`; reuse or align with those constants rather than introducing conflicting values.
- The server currently uses `console.log` in `server/routes/openai.js` for OpenAI route events while request logging lives in `server/utils/observability.js`; prefer a minimal, consistent migration path over broad logging refactors.
- Local production Compose currently lists many frontend build args but not the translation flags; this is a direct fit for the P04 Docker env propagation concern.
- GitHub image builds currently use Docker defaults unless `docker/build-push-action` build args are supplied; production translation enablement should be explicit there too.

### Potential Challenges

- OpenAI translation protocol drift: Mitigate by recording a doc re-check before touching endpoint, model, SDP, or data-channel assumptions.
- Safety identifier temptation: Mitigate by deferring stable safety identifiers unless a non-PII app/session identifier already exists.
- Logging overreach: Mitigate with allowlisted metadata and tests that serialize log records to prove sensitive patterns are absent.
- Horizontal scaling ambiguity: Mitigate by documenting current process-local enforcement and deferring shared-store implementation.
- Build-time versus runtime confusion: Mitigate by making `VITE_*` translation flags explicit in image build args and documenting that they are not runtime secrets.

### Relevant Considerations

- [P04] **Docker frontend env propagation**: Add explicit Docker/Compose/GitHub build args for `VITE_OPENAI_TRANSLATION_ENABLED` and `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES`.
- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before any endpoint, SDP, event, or model contract change.
- [P01] **Process-local rate limiting**: Keep limiter coverage, but document that multi-instance production needs shared-store or platform-level enforcement.
- [P01] **Production CSP compatibility**: Do not tighten CSP in this session unless provider-by-provider validation is added.
- [P02] **Translation protocol separation**: Keep translation route and frontend runtime separate from normal OpenAI voice-agent prompts, tools, and `response.create`.
- [P04] **Route-safe diagnostics**: Use stable category/code metadata and keep raw upstream payloads out of route responses and logs.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Duration config drift between docs, frontend defaults, Docker build args, and production image builds.
- Sensitive data leakage through route lifecycle logs or observability metrics.
- Duplicate or ambiguous token lifecycle records around retries, upstream failures, and route validation failures.
- Presenting process-local rate limiting as a global production quota.

---

## 9. Testing Strategy

### Unit Tests

- Add `src/test/translationSafety.test.ts` for server helper duration parsing, hard caps, safe event fields, and safety identifier deferral.
- Extend `src/test/openaiTranslation.test.ts` for frontend max-session defaults, configured values, capped values, invalid values, and exported constants.
- Extend `src/test/serverSecurity.test.ts` for explicit `/api/openai/translation-session` token endpoint coverage.

### Integration Tests

- Extend `src/test/openaiTranslationRoute.test.ts` to validate sanitized lifecycle event records for success, validation failure, upstream failure, timeout, and malformed upstream response paths.
- Confirm route tests still mock upstream OpenAI calls and never call real providers.

### Manual Testing

- Run `docker compose config` to verify translation build args interpolate as expected.
- Review generated docs for clear privacy, cost, duration, process-local limiter, and build-time flag wording.
- If Docker is unavailable, record that limitation in implementation notes.

### Edge Cases

- Empty, non-numeric, zero, negative, decimal, and above-hard-cap max-session values.
- Unsupported request fields and unsupported target languages on the translation token route.
- Upstream 401, 403, 429, 5xx, timeout, missing client secret, and non-JSON response paths.
- Log records that might accidentally include `Authorization`, `cookie`, `clientSecret`, `sk-`, raw upstream fields, raw transcripts, or SDP payloads.

---

## 10. Dependencies

### External Libraries

- None planned.

### Other Sessions

- **Depends on**: `phase04-session01-lifecycle-reliability`, `phase04-session02-error-states-and-diagnostics`, `phase04-session03-unit-and-integration-coverage`, `phase04-session04-e2e-and-browser-smoke-tests`, `phase04-session05-documentation-and-demo-configuration`
- **Depended by**: `phase05-session02-evaluation-harness-and-sample-workflow`, later Phase 05 media-variant sessions, and any future production deployment phase.

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
