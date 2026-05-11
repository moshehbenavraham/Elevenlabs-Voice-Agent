# Session Specification

**Session ID**: `phase01-session03-cloud-deployment-configuration`
**Phase**: 01 - Production Deployment & DevOps
**Status**: Complete
**Completed**: 2026-05-11
**Created**: 2026-05-11

---

## 1. Session Overview

This session configures the production cloud deployment path for the combined full-stack Docker application. The repository already has a validated Docker baseline and a GitHub Actions deployment workflow that can publish a GHCR image, trigger a webhook deployment, run an SSH fallback, and perform an optional health check.

The work is not a greenfield platform migration. It should reconcile the current Coolify/Docker recommendation, GHCR image publication, webhook and SSH deployment modes, environment-variable handling, custom-domain requirements, WebSocket support, and post-deploy health verification into a concrete operator-ready deployment path.

This session follows the CI/CD session because deployment configuration depends on the image publishing and deployment trigger behavior established there. It enables the later monitoring and security sessions by producing a known production URL posture, health-check contract, CORS/domain assumptions, and operational verification steps.

---

## 2. Objectives

1. Provide a concrete production deployment path for Coolify, GHCR webhook, and SSH-based Docker hosts.
2. Add or reconcile deployment configuration artifacts so remote hosts can pull and run the published image without rebuilding from source.
3. Document production environment variables, custom domain, CORS, HTTPS, WebSocket, and health-check verification requirements.
4. Add a repeatable post-deploy verification path that operators can run against a production URL.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session01-docker-production-optimization` - Provides the validated combined Docker image, local Compose workflow, non-root runtime, health check behavior, and runtime-secret boundary.
- [x] `phase01-session02-github-actions-cicd-pipeline` - Provides GHCR image publication, webhook deployment, SSH fallback, no-config deployment notice, and optional post-deploy health checks.

### Required Tools/Knowledge

- Docker Compose v2 and Docker image deployment on a remote host.
- GitHub Actions repository variables, environment secrets, and GHCR package visibility.
- Coolify application deployment concepts, webhook deployments, and SSH deployment patterns.
- Production CORS, HTTPS, DNS, and WebSocket upgrade requirements.

### Environment Requirements

- GitHub repository with Actions and GHCR enabled.
- A selected production deployment path: Coolify as the recommended target, with webhook or SSH as supported automation paths.
- Production domain or placeholder domain available for documentation and verification examples.
- At least one provider API key available in the target environment for a fully healthy deployment.

---

## 4. Scope

### In Scope (MVP)

- Operators can deploy the combined Docker app through Coolify, GitHub webhook, or SSH - Add concrete configuration and documentation for these primary paths.
- Operators can run the published GHCR image on a remote Docker host - Add a deployment Compose file that consumes an `IMAGE_REF` without rebuilding.
- Maintainers can configure production environment variables safely - Add or reconcile an environment template that separates build-time `VITE_*` values from runtime server secrets.
- Operators can configure a production domain and strict CORS origin - Document DNS, HTTPS, `CORS_ORIGIN`, and same-origin `VITE_API_BASE_URL=/` rules.
- Operators can verify health and WebSocket readiness after deployment - Add a repeatable verification script or runbook path.
- Maintainers can keep managed platform alternatives documented - Clarify Railway, Fly.io, Render, and split frontend/backend caveats without making them the primary path.

### Out of Scope (Deferred)

- Actually provisioning a Coolify instance or cloud account - Reason: Requires user-owned infrastructure and credentials.
- AWS/GCP/Azure enterprise deployment templates - Reason: Explicitly out of scope for the Phase 01 MVP.
- Monitoring dashboards and alerting automation - Reason: Phase 01 Session 04 owns monitoring and observability.
- Security header hardening, CSP tuning, and scanner remediation - Reason: Phase 01 Session 05 owns production security hardening.
- Database, object storage, backups, and persistence - Reason: The application remains stateless for this phase.

---

## 5. Technical Approach

### Architecture

The production deployment remains a single full-stack Docker container. GitHub Actions builds the validated image and publishes it to GHCR. Coolify can build from the repository or consume the published image; webhook deployments can trigger a platform redeploy; SSH deployments can pull the image on a remote Docker host and restart the service through a deployment-specific Compose file.

For same-origin Docker production, Express serves both the built frontend and `/api/*` routes on one origin. `VITE_API_BASE_URL=/` is compiled into the frontend at image build time, while provider API keys and `CORS_ORIGIN` are runtime environment variables on the host. The health endpoint remains the deployment probe and returns HTTP 200 for both fully configured `healthy` and intentionally partial `degraded` states.

### Design Patterns

- Image-first deployment: Remote hosts should pull a GHCR image instead of rebuilding source during SSH deploys.
- Runtime secret boundary: Server-side provider keys stay runtime-only and never become Docker build args.
- Same-origin default: Combined Docker deployments use one public origin for frontend and API to simplify CORS and WebSocket behavior.
- Verification as contract: Health checks, root page checks, and provider status interpretation are documented and scriptable.
- Docs as operations handoff: Platform-specific setup lives in deployment docs so infrastructure steps are reproducible outside the codebase.

### Technology Stack

- Docker and Docker Compose v2.
- GitHub Actions and GitHub Container Registry.
- Coolify as the recommended Docker hosting path.
- Node.js script tooling with built-in `fetch`; no new npm dependency expected.
- Express `/api/health` endpoint for readiness and provider status.

---

## 6. Deliverables

### Files to Create

| File                                   | Purpose                                                                              | Est. Lines |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| `docker-compose.deploy.yml`            | Remote image-based Compose file for SSH or Docker-host deployments                   | ~85        |
| `.env.production.example`              | Production environment template for Coolify, SSH, and managed Docker hosts           | ~120       |
| `scripts/deploy/verify-production.mjs` | Post-deploy verification script for health endpoint, root page, and status reporting | ~140       |

### Files to Modify

| File                                                                                          | Changes                                                                                                          | Est. Lines |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- |
| `.github/workflows/deploy.yml`                                                                | Point SSH deployment at the image-based Compose file and document required remote layout if needed               | ~20        |
| `package.json`                                                                                | Add a `deploy:verify` script for the production verification command                                             | ~2         |
| `docs/DEPLOYMENT.md`                                                                          | Reconcile Coolify, GHCR, webhook, SSH, environment, domain, WebSocket, health, and alternative platform guidance | ~160       |
| `docs/CI_CD.md`                                                                               | Reference the remote Compose file, production env template, and verification script                              | ~40        |
| `README.md`                                                                                   | Update deployment quick links and command summary for the concrete deployment path                               | ~35        |
| `.env.example`                                                                                | Cross-reference the production env template where helpful                                                        | ~10        |
| `.spec_system/specs/phase01-session03-cloud-deployment-configuration/implementation-notes.md` | Record decisions, verification results, and any blocked real-infrastructure checks                               | ~80        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] A remote Docker host can run the published GHCR image using documented Compose configuration.
- [ ] GitHub Actions SSH deployment uses or documents the same remote Compose path as the deployment guide.
- [ ] Coolify deployment steps cover both repository-based builds and GHCR image deployments.
- [ ] Webhook deployment requirements are documented with payload, token, and expected target behavior.
- [ ] Production environment variables are documented without exposing server-side API keys to frontend build args.
- [ ] Custom domain, HTTPS, strict CORS, and same-origin API rules are documented.
- [ ] WebSocket verification steps exist for provider connections after deployment.
- [ ] `/api/health` verification explains `healthy`, `degraded`, and `unhealthy` results.

### Testing Requirements

- [ ] Deployment YAML and Compose YAML are reviewed or parsed successfully.
- [ ] Production verification script runs against a local or configured health endpoint where feasible.
- [ ] Documentation examples are internally consistent across README, deployment docs, CI/CD docs, and env templates.
- [ ] Manual real-infrastructure verification is either completed or recorded as blocked with exact required credentials and target URL.

### Non-Functional Requirements

- [ ] Container startup target remains under 30 seconds where locally testable.
- [ ] Production CORS documentation keeps demo-mode permissiveness out of production.
- [ ] No new deployment path requires extra runtime dependencies beyond Docker, Compose, Node, and the existing app stack.
- [ ] All operator commands are copy-pasteable from a POSIX shell without requiring `jq`.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] No secrets committed or represented as real-looking credentials.

---

## 8. Implementation Notes

### Key Considerations

- The existing deployment workflow already publishes GHCR images and selects a single image reference for deployment.
- The current `docker-compose.yml` is source-build oriented for local production testing. A remote SSH deployment needs an image-based Compose file that consumes `IMAGE_REF`.
- Same-origin Docker production should compile `VITE_API_BASE_URL=/`; split hosting must use an absolute backend URL and strict `CORS_ORIGIN`.
- Health status `degraded` is acceptable when the app is serving but not all provider credentials are configured.
- Real deployment verification may be blocked if the user has not provided a domain, Coolify instance, webhook URL, SSH host, or provider keys.

### Potential Challenges

- Deployment target credentials may be unavailable: Mitigate by producing exact repository variables, secrets, env template, and blocked-verification notes.
- GHCR image visibility may block remote pulls: Mitigate by documenting package visibility or registry login requirements.
- WebSocket failures can be proxy-specific: Mitigate by documenting upgrade requirements and provider-level smoke checks.
- CORS drift can break split deployments: Mitigate by keeping same-origin Docker as the default and making split-hosting rules explicit.
- Workflow and docs can diverge: Mitigate by linking SSH workflow commands, `docker-compose.deploy.yml`, and deployment guide examples.

### Relevant Considerations

- [P00] **Demo mode CORS configuration**: Production CORS must stay strict and must not inherit demo-mode tunnel assumptions.
- [P00] **Runtime config injection pattern**: Deployment docs must distinguish build-time frontend config from runtime server secrets.
- [P00] **jq availability varies**: Verification commands should use Node or plain shell behavior instead of requiring `jq`.
- [P00] **ASCII-only output**: New scripts, docs, and workflow messages should use ASCII-only text.

---

## 9. Testing Strategy

### Unit Tests

- N/A - This session is deployment configuration, documentation, and script work.

### Integration Tests

- Parse or review `docker-compose.deploy.yml` for valid Compose structure.
- Review `.github/workflows/deploy.yml` SSH path against the remote Compose file.
- Run `node scripts/deploy/verify-production.mjs --url http://localhost:3001` if a local or Docker server is available.

### Manual Testing

- Run the local Docker production path with `npm run docker:prod` where feasible.
- Check `http://localhost:3001/api/health` or the configured production health URL.
- Verify the root page loads from the same origin.
- Verify at least one configured provider can start a connection through the deployed origin when credentials are available.
- Record any real-infrastructure checks blocked by missing domain, Coolify, webhook, SSH host, or API credentials.

### Edge Cases

- No provider keys configured: Health should return HTTP 200 with `degraded`.
- Missing `IMAGE_REF` on remote host: Compose should default to a documented image reference or fail with clear guidance.
- Private GHCR package: Docs should describe registry login before `docker compose pull`.
- Split frontend/backend hosting: Docs should require absolute `VITE_API_BASE_URL` and matching `CORS_ORIGIN`.
- Proxy without WebSocket upgrade support: Docs should identify this as a hosting/proxy configuration issue.

---

## 10. Dependencies

### External Libraries

- No new npm dependencies expected.
- Docker Compose and Node.js are required operational tools.

### Other Sessions

- **Depends on**: `phase01-session01-docker-production-optimization`, `phase01-session02-github-actions-cicd-pipeline`
- **Depended by**: `phase01-session04-monitoring-observability`, `phase01-session05-production-security-hardening`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
