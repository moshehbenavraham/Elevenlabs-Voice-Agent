# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 01 - Production Deployment & DevOps
**Completed Sessions**: 4 (Phase 00 complete)

---

## Recommended Next Session

**Session ID**: `phase01-session01-docker-production-optimization`
**Session Name**: Docker Production Optimization
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: ~15

---

## Why This Session Next?

### Prerequisites Met

- [x] Phase 00 completed (ngrok demo mode provides testing infrastructure)
- [x] Existing Docker setup available (`npm run docker:build`)
- [x] Node.js 18+ base image selection (standard practice)

### Dependencies

- **Builds on**: Phase 00 demo mode (complete platform to containerize)
- **Enables**: Session 02 (CI/CD Pipeline - needs Docker images to build/push)

### Project Progression

Docker Production Optimization is the logical first session of Phase 01 because:

1. **Foundation for CI/CD**: The CI/CD pipeline (Session 02) requires optimized Docker images to build, test, and deploy
2. **Prerequisite for Cloud Deployment**: Session 03 (Cloud Deployment) needs containerized applications
3. **Independent Work**: Can be completed without external service dependencies (unlike monitoring or cloud setup)
4. **Validates Platform**: Building Docker images validates that all 7 voice providers work correctly in containers

---

## Session Overview

### Objective

Audit and optimize the existing production Docker path with multi-stage builds, minimal image size, non-root runtime, health checks, and a clear decision on whether the app remains a combined full-stack container or needs split frontend/backend images.

### Key Deliverables

1. Optimized Dockerfile strategy (`Dockerfile` or split Dockerfiles if justified)
2. Production compose configuration (`docker-compose.yml` update or `docker-compose.prod.yml`)
3. Verified health checks for container orchestration
4. Updated `.dockerignore`
5. Reconciled Docker deployment documentation

### Scope Summary

- **In Scope (MVP)**: Existing Dockerfile audit, Docker Compose, health checks, runtime environment variables, .dockerignore optimization, deployment documentation reconciliation
- **Out of Scope**: Kubernetes manifests, container registry setup, nginx split frontend unless justified, SSL/TLS termination

---

## Technical Considerations

### Technologies/Patterns

- Multi-stage Docker builds (build stage + runtime stage)
- Express static serving for the combined production container
- Alpine-based Node.js images for minimal size
- Docker Compose for local production testing
- Health check endpoints (`/health`, `/api/health`)

### Potential Challenges

- **Architecture Decision**: Confirm whether the combined container remains the production default or split images are justified
- **Environment Variables**: Runtime injection of API keys without baking into images
- **Image Size Optimization**: Balancing dependencies with minimal image footprint
- **Multi-architecture**: Consider ARM64 support for Apple Silicon development

### Relevant Considerations

- [P00] **Demo mode CORS configuration**: Demo mode uses a single same-origin ngrok tunnel; production split deployments must use strict CORS settings
- [P00] **Runtime config injection pattern**: The current demo uses `window.__DEMO_CONFIG__`; Docker docs should explain when same-origin works and when `VITE_API_BASE_URL` is needed
- [P00] **15-minute Gemini session limit**: Document this constraint in Docker deployment guide

---

## Alternative Sessions

If this session is blocked (e.g., Docker not available):

1. **Session 02: GitHub Actions CI/CD Pipeline** - Can start with non-Docker test/lint jobs, defer Docker build steps
2. **Session 05: Production Security Hardening** - Security review and hardening can proceed independently

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
