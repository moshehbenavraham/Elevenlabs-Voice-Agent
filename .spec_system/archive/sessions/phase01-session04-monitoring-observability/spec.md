# Session Specification

**Session ID**: `phase01-session04-monitoring-observability`
**Phase**: 01 - Production Deployment & DevOps
**Status**: Not Started
**Created**: 2026-05-11

---

## 1. Session Overview

This session completes the monitoring and observability baseline for the production Docker deployment path. The repository already has a useful `/api/health` endpoint, Docker health checks, a pino-based logger utility, a frontend error tracking helper, deployment verification tooling, and an incident runbook. The work is to reconcile those pieces into an operator-ready observability surface instead of adding a heavyweight external platform.

The implementation should add request IDs, structured request logging, basic in-process request metrics, and a clear health/metrics contract that can be used by Docker, GitHub Actions, uptime monitors, and human operators. It should also make an explicit decision about frontend error tracking: either wire a selected service if configuration exists, or document a production deferral with a structured fallback that does not pretend external reporting is active.

This session follows cloud deployment configuration because monitoring needs a known production URL, health-check contract, deployment verification path, and incident response context. It enables the final Phase 01 security hardening session by making request flow, error rates, provider configuration posture, and production runtime state easier to inspect without exposing secrets.

---

## 2. Objectives

1. Add request ID aware server request logging with response status, latency, route, and safe client metadata.
2. Expose basic health and metrics data for app readiness, provider configuration, uptime monitoring, request counts, error counts, and response timing.
3. Reconcile frontend error tracking into a documented production posture with either a configured integration path or an explicit deferral.
4. Update deployment and incident response documentation so operators can monitor, diagnose, and escalate production failures.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session01-docker-production-optimization` - Provides the production Docker image, health check behavior, non-root runtime, and local Compose workflow.
- [x] `phase01-session02-github-actions-cicd-pipeline` - Provides workflow automation, deployment health-check hooks, and CI quality gates.
- [x] `phase01-session03-cloud-deployment-configuration` - Provides deployment configuration, production URL verification, GHCR/SSH/Coolify guidance, and deployment runbook context.

### Required Tools/Knowledge

- Express middleware ordering and response lifecycle hooks.
- Pino structured logging and production log collection conventions.
- Docker and GitHub Actions health-check behavior.
- Basic uptime monitoring concepts: HTTP probe, expected status, alert destination, and escalation path.

### Environment Requirements

- Node.js and npm available locally.
- Existing `.env` or empty environment for degraded health endpoint testing.
- Optional production URL for real uptime/health verification.
- Optional external error tracking or uptime monitoring service account; if unavailable, document the deferral and exact future configuration.

---

## 4. Scope

### In Scope (MVP)

- Operators can correlate API responses with logs - Add or verify `X-Request-Id` generation and structured request completion logs.
- Operators can inspect application readiness - Enhance or verify `/api/health` with readiness, provider configuration, runtime, rate limiting, CORS, and observability status.
- Operators can inspect basic performance metrics - Add a lightweight `/api/metrics` JSON endpoint with bounded request totals, error totals, status counts, latency summary, uptime, and deterministic key ordering.
- Maintainers can verify observability after deployment - Extend production verification and docs to cover health, metrics, request IDs, and expected degraded states.
- Maintainers can understand frontend error tracking posture - Audit `src/lib/errorTracking.ts`, preserve structured fallback behavior, and document whether external reporting is configured or deferred.
- Operators can configure uptime monitoring - Document HTTP probe URL, accepted statuses, alert routing, and incident response steps.

### Out of Scope (Deferred)

- Custom dashboards - Reason: Phase 01 MVP uses platform defaults and simple HTTP endpoints.
- Distributed tracing - Reason: No multi-service trace boundary exists yet.
- Log aggregation infrastructure - Reason: Deployment provider or host platform should collect container stdout for this phase.
- Advanced alert automation or paging rotations - Reason: Requires team-owned services and escalation policy.
- Persistent metrics storage - Reason: The app is stateless and should not add a database in Phase 01.

---

## 5. Technical Approach

### Architecture

Add a small server-side observability module under `server/utils/` instead of importing the existing `src/lib/logger.ts` into Express. The existing logger file lives in the frontend source tree and imports Node-only modules, so server observability should have an explicit server boundary. The module should provide request ID helpers, safe request metadata extraction, request lifecycle logging, and bounded in-memory metrics that are safe to reset on process restart.

Integrate the middleware early in `server/index.js`, after CORS/body parsing decisions that must remain stable and before API routes that should be measured. Request logs should be emitted on response finish so status code and latency are accurate. The metrics endpoint should return aggregate JSON only, with no headers, secrets, request bodies, API keys, or user audio data. Health should continue to treat provider misconfiguration as `degraded` rather than `unhealthy` when the app can serve traffic.

Documentation should make uptime monitoring operational: what to probe, what `healthy`, `degraded`, and `unhealthy` mean, how to find request IDs in logs, how to inspect `/api/metrics`, and which checks are blocked without a real production URL or external monitoring account.

### Design Patterns

- Server-only boundary: Put Express logging and metrics code under `server/utils/` to avoid Vite bundling Node-only helpers.
- Bounded in-memory metrics: Track aggregate counters and recent latency summary without storing unbounded request history.
- Safe logging: Exclude secrets, authorization headers, cookies, request bodies, and provider tokens from logs.
- Explicit status semantics: Preserve `degraded` for missing provider credentials and reserve `unhealthy` for app readiness failures.
- Documentation as operational contract: Treat docs and runbooks as part of the deliverable because uptime monitoring cannot be fully provisioned without user-owned accounts.

### Technology Stack

- Express 5 middleware and route handlers.
- Existing `pino` and `pino-pretty` dependencies.
- Node.js built-in APIs for timing, random IDs, and process metrics.
- Existing npm scripts: `npm run test:run`, `npm run type-check`, `npm run build`, and `npm run deploy:verify`.

---

## 6. Deliverables

### Files to Create

| File                             | Purpose                                                                                                | Est. Lines |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------- |
| `server/utils/observability.js`  | Server-only logger, request ID, request logging middleware, and bounded metrics helpers                | ~180       |
| `docs/OBSERVABILITY.md`          | Operator guide for health, metrics, logs, uptime checks, alert routing, and deferred external services | ~140       |
| `src/test/observability.test.ts` | Focused tests for pure observability helper behavior and metrics summary output                        | ~120       |

### Files to Modify

| File                                                                                    | Changes                                                                                                 | Est. Lines |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| `server/index.js`                                                                       | Wire request logging middleware, add metrics endpoint, and enrich health observability fields           | ~90        |
| `scripts/deploy/verify-production.mjs`                                                  | Optionally verify metrics and request ID behavior with timeout and failure-path handling                | ~45        |
| `src/lib/errorTracking.ts`                                                              | Reconcile production error tracking fallback and expose/document configured-vs-deferred behavior        | ~40        |
| `.env.production.example`                                                               | Add observability defaults such as log level, request logging toggle, and metrics toggle if implemented | ~20        |
| `docs/DEPLOYMENT.md`                                                                    | Add health/metrics/logging/uptime monitor setup and production verification guidance                    | ~70        |
| `docs/runbooks/incident-response.md`                                                    | Add request ID, metrics, log triage, uptime alert, and provider degradation response steps              | ~80        |
| `README.md`                                                                             | Link the observability guide and summarize health/metrics verification commands                         | ~25        |
| `.spec_system/specs/phase01-session04-monitoring-observability/implementation-notes.md` | Record audit findings, implementation decisions, verification output, and blocked external checks       | ~90        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Every backend response includes or propagates a request ID.
- [ ] API requests are logged with request ID, method, path, status, duration, and safe client metadata.
- [ ] `/api/health` continues to return `healthy`, `degraded`, or `unhealthy` with provider status and runtime posture.
- [ ] `/api/metrics` returns bounded JSON with request counts, error counts, status counts, uptime, and latency summary.
- [ ] Production verification can check health and metrics without requiring `jq`.
- [ ] Frontend error tracking has an explicit configured or deferred production posture.
- [ ] Uptime monitoring setup and alert response are documented.

### Testing Requirements

- [ ] Unit tests cover metrics summary, request ID behavior, and safe metadata extraction where practical.
- [ ] `npm run test:run` passes or blocked failures are documented with exact cause.
- [ ] `npm run type-check` passes or blocked failures are documented with exact cause.
- [ ] Health and metrics endpoints are smoke-tested locally or against a configured production URL.

### Non-Functional Requirements

- [ ] Request logging does not include secrets, authorization headers, cookies, request bodies, API keys, or audio data.
- [ ] Metrics storage is bounded and safe for long-running containers.
- [ ] Health and metrics responses are stable enough for uptime monitors and CI scripts.
- [ ] No new persistent storage or external runtime dependency is required for the MVP.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] No secrets committed or represented as real-looking credentials.

---

## 8. Implementation Notes

### Key Considerations

- `server/index.js` already has provider status, memory, uptime, CORS, rate limiting, and degraded health semantics.
- `src/lib/logger.ts` is pino-based but lives in `src/` and imports Node-only modules, so server observability should avoid creating a frontend bundling hazard.
- `src/lib/errorTracking.ts` currently logs structured console output in production and has TODO comments for external tracking.
- The deploy verification script already validates root HTML and `/api/health`; extending it is lower risk than adding another tool.
- Real uptime monitor setup may be blocked until the user provides a production URL and selected monitoring provider.

### Potential Challenges

- Middleware ordering can hide API timings or static requests: Mitigate by placing request metrics around the routes that matter and documenting what is measured.
- Request logs can accidentally capture sensitive data: Mitigate with explicit safe metadata extraction and tests.
- Metrics can grow unbounded: Mitigate with aggregate counters and fixed-size or summary-only latency tracking.
- `degraded` health can be misread as an outage: Mitigate with docs, verification output, and runbook language that distinguishes readiness from provider completeness.
- External error tracking may not be configured: Mitigate by documenting the deferral and exact variables or service decisions needed later.

### Relevant Considerations

- [P00] **Manual testing for shell scripts**: Keep verification script behavior simple and record any manual endpoint checks in implementation notes.
- [P00] **jq availability varies**: Verification and runbook commands should not require `jq`; use Node or plain shell output where possible.
- [P00] **Demo mode CORS configuration**: Observability docs must preserve strict production CORS and avoid inheriting demo-mode permissiveness.
- [P00] **Runtime config injection pattern**: Any observability env vars should distinguish frontend `VITE_*` build-time values from server runtime settings.
- [P00] **ASCII-only output**: New scripts, docs, and logs should use ASCII-safe status text.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Request lifecycle hooks must not double-count aborted, failed, or completed responses.
- Health and metrics endpoints must not expose secrets, request bodies, cookies, provider tokens, or raw client data.
- Verification and monitoring checks must handle network timeouts, non-JSON responses, `degraded` status, and disabled metrics explicitly.

---

## 9. Testing Strategy

### Unit Tests

- Test request ID creation and propagation behavior.
- Test safe metadata extraction excludes authorization, cookie, and request body data.
- Test metrics counters, status grouping, latency summary, reset behavior if exposed, and deterministic output shape.

### Integration Tests

- Start the Express server locally when feasible and check `/api/health` and `/api/metrics`.
- Run `npm run deploy:verify -- --url http://localhost:3001 --skip-root` if the server is running without built static assets.
- Verify Docker health checks still treat `healthy` and `degraded` app states as serving.

### Manual Testing

- Curl `/api/health` and confirm status semantics, provider summary, runtime fields, and observability fields.
- Curl `/api/metrics` after several API requests and confirm counters change.
- Confirm response headers include or preserve `X-Request-Id`.
- Review container or server stdout for structured request completion logs.
- Record any production uptime monitor setup blocked by missing URL, account, or alert recipient.

### Edge Cases

- Missing provider keys: `/api/health` should return HTTP 200 with `degraded`, not `unhealthy`.
- Missing static assets in production: `/api/health` should return `unhealthy`.
- Metrics disabled by environment: endpoint should return a clear disabled response or remain documented as unavailable.
- Client-supplied request ID: accept only safe bounded values or generate a new ID.
- Aborted or failed requests: log completion when Express emits finish or close without throwing from middleware.

---

## 10. Dependencies

### External Libraries

- `pino`: Already present and should be reused for structured logging if server-side logging needs it.
- `pino-pretty`: Already present for development log readability.
- No new npm dependency expected for the MVP.

### Other Sessions

- **Depends on**: `phase01-session01-docker-production-optimization`, `phase01-session02-github-actions-cicd-pipeline`, `phase01-session03-cloud-deployment-configuration`
- **Depended by**: `phase01-session05-production-security-hardening`
- **Enables**: Production monitoring posture for Phase 02 translation backend work and later demo reliability hardening

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
