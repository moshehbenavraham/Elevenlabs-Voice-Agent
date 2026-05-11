# Task Checklist

**Session ID**: `phase01-session03-cloud-deployment-configuration`
**Total Tasks**: 20
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
| Implementation | 9      | 9      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (3 tasks)

Initial deployment baseline audit and session preparation.

- [x] T001 [S0103] Verify Session 01 and Session 02 deployment prerequisites against the current Docker, Compose, and deploy workflow baselines (`.spec_system/specs/phase01-session03-cloud-deployment-configuration/implementation-notes.md`)
- [x] T002 [S0103] Audit current deployment documentation, CI/CD documentation, and env templates for Coolify, GHCR, webhook, SSH, CORS, and health-check gaps (`.spec_system/specs/phase01-session03-cloud-deployment-configuration/implementation-notes.md`)
- [x] T003 [S0103] Create deployment script directory for verification tooling if it does not already exist (`scripts/deploy/`)

---

## Foundation (5 tasks)

Core deployment artifacts and command entry points.

- [x] T004 [S0103] [P] Create image-based remote Compose configuration for GHCR deployments with runtime env vars, health check, restart policy, and `IMAGE_REF` support (`docker-compose.deploy.yml`)
- [x] T005 [S0103] [P] Create production environment template separating public build-time `VITE_*` values from runtime provider secrets and deployment variables (`.env.production.example`)
- [x] T006 [S0103] [P] Create production verification script with URL validation, timeout handling, root-page check, health parsing, and explicit `healthy`/`degraded`/`unhealthy` status output (`scripts/deploy/verify-production.mjs`)
- [x] T007 [S0103] Add npm command for running the production verification script (`package.json`)
- [x] T008 [S0103] Reconcile SSH deployment commands with the image-based Compose file and exported image reference (`.github/workflows/deploy.yml`)

---

## Implementation (9 tasks)

Primary deployment configuration, documentation, and operator handoff.

- [x] T009 [S0103] Document Coolify repository-build and GHCR-image deployment paths with required settings, environment variables, package visibility, and SSL expectations (`docs/DEPLOYMENT.md`)
- [x] T010 [S0103] Document webhook deployment contract, required GitHub variables/secrets, payload fields, timeout expectations, and target behavior (`docs/DEPLOYMENT.md`)
- [x] T011 [S0103] Document SSH deployment using `docker-compose.deploy.yml`, remote directory layout, registry login, `IMAGE_REF`, and rollback notes (`docs/DEPLOYMENT.md`)
- [x] T012 [S0103] Document managed platform alternatives for Railway, Fly.io, Render, and split Vercel/frontend deployments with WebSocket and CORS caveats (`docs/DEPLOYMENT.md`)
- [x] T013 [S0103] Document custom domain, DNS, HTTPS, microphone permission, and strict production CORS checklist (`docs/DEPLOYMENT.md`)
- [x] T014 [S0103] Document post-deploy health verification, provider status interpretation, and when `degraded` is acceptable (`docs/DEPLOYMENT.md`)
- [x] T015 [S0103] Document WebSocket verification steps for OpenAI, xAI, Gemini, Ultravox, Vapi, and Retell provider paths (`docs/DEPLOYMENT.md`)
- [x] T016 [S0103] [P] Update CI/CD operations guide to reference the remote Compose file, production env template, SSH deployment layout, and verification script (`docs/CI_CD.md`)
- [x] T017 [S0103] [P] Update README deployment summary with the concrete Coolify/GHCR/SSH path and verification command (`README.md`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T018 [S0103] Validate YAML/JSON/script syntax for deployment files and record any blocked external checks (`.spec_system/specs/phase01-session03-cloud-deployment-configuration/implementation-notes.md`)
- [x] T019 [S0103] Run production verification against a local Docker or configured production URL where feasible and record health/root-page results (`.spec_system/specs/phase01-session03-cloud-deployment-configuration/implementation-notes.md`)
- [x] T020 [S0103] Validate ASCII encoding, Unix LF endings, and docs consistency across all session deliverables (`.spec_system/specs/phase01-session03-cloud-deployment-configuration/implementation-notes.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing or blocked checks explicitly documented
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for the validate workflow step

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
