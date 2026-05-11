# Task Checklist

**Session ID**: `phase01-session01-docker-production-optimization`
**Total Tasks**: 22
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
| Testing        | 5      | 5      | 0         |
| **Total**      | **22** | **22** | **0**     |

---

## Setup (3 tasks)

Initial audit and baseline capture for the current production Docker path.

- [x] T001 [S0101] Verify Docker, Compose v2, BuildKit, and npm Docker script prerequisites, then record tool versions and command availability (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)
- [x] T002 [S0101] Capture baseline Docker image size, build time, startup time, and current health status from the existing combined container (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)
- [x] T003 [S0101] [P] Inventory current Docker documentation and command drift across README and deployment docs (`docs/DEPLOYMENT.md`)

---

## Foundation (5 tasks)

Architecture decisions and low-risk configuration groundwork.

- [x] T004 [S0101] Document the combined-container versus split-image decision with explicit rationale and follow-on impact for CI/CD and deployment sessions (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)
- [x] T005 [S0101] Harden Docker build-context exclusions while preserving every file required by Vite build, Express runtime, and production npm install (`.dockerignore`)
- [x] T006 [S0101] [P] Reconcile Docker npm scripts for build, up, down, and local production testing command clarity (`package.json`)
- [x] T007 [S0101] Audit provider runtime environment coverage for all seven providers without baking server-side secrets into image layers (`docker-compose.yml`)
- [x] T008 [S0101] Review production health response semantics for no-key, partially configured, and fully configured container states with explicit status mapping (`server/index.js`)

---

## Implementation (9 tasks)

Main Docker, Compose, environment, and documentation updates.

- [x] T009 [S0101] Optimize Dockerfile stage ordering, dependency installs, and layer caching while keeping build-time values limited to non-secret VITE variables (`Dockerfile`)
- [x] T010 [S0101] Ensure Docker runtime files, ownership, non-root execution, and signal behavior are compatible with the production Express server (`Dockerfile`)
- [x] T011 [S0101] Align Docker healthcheck timing, retry behavior, and command target with the finalized `/api/health` semantics (`Dockerfile`)
- [x] T012 [S0101] Expand Compose build arguments and runtime environment variables for ElevenLabs, OpenAI, xAI, Ultravox, Vapi, Retell, Gemini, CORS, and server port (`docker-compose.yml`)
- [x] T013 [S0101] Harden Compose local production behavior with deterministic port mapping, restart policy, healthcheck configuration, and `.env` loading expectations (`docker-compose.yml`)
- [x] T014 [S0101] Update environment documentation for Docker production variables, provider keys, CORS, same-origin runtime config, and build-time frontend flags (`.env.example`)
- [x] T015 [S0101] Reconcile README Docker quick-start commands with the final build, compose, health, and troubleshooting workflow (`README.md`)
- [x] T016 [S0101] Reconcile deployment guide Docker sections with final commands, image size target, provider env handling, health checks, and the 15-minute Gemini Live limit (`docs/DEPLOYMENT.md`)
- [x] T017 [S0101] Document whether `docker-compose.prod.yml` is unnecessary or create it only if the audit proves the current Compose file cannot safely serve both local and production testing (`docker-compose.yml`)

---

## Testing (5 tasks)

Verification and quality gates for the planned Docker production path.

- [x] T018 [S0101] Build the final Docker image and record final size, build duration, cache behavior, and any justified target variance (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)
- [x] T019 [S0101] Start the final Compose stack and verify frontend serving, `/api/health`, port binding, restart behavior, and clean shutdown (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)
- [x] T020 [S0101] Verify containerized provider readiness for all seven provider tabs and backend token/session routes using mocks or configured keys without calling real providers unnecessarily (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)
- [x] T021 [S0101] Run relevant local quality checks for changed Docker, server, environment, and documentation files, then record any skipped checks with reasons (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)
- [x] T022 [S0101] Validate ASCII encoding, Unix LF line endings, task completion state, and readiness for the validate workflow step (`.spec_system/specs/phase01-session01-docker-production-optimization/implementation-notes.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing or explicitly documented as skipped with reasons
- [x] Docker image size target documented and met or justified
- [x] Container starts and `/api/health` behaves correctly
- [x] All files ASCII-encoded
- [x] `implementation-notes.md` updated
- [x] Ready for the validate workflow step

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
