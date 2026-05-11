# Session 01: Docker Production Optimization

**Session ID**: `phase01-session01-docker-production-optimization`
**Status**: Not Started
**Estimated Tasks**: ~15
**Estimated Duration**: 2-4 hours

---

## Objective

Audit and optimize the existing production Docker path with multi-stage builds, minimal image size, non-root runtime, health checks, and a clear decision on whether the app remains a combined full-stack container or needs split frontend/backend images.

---

## Scope

### In Scope (MVP)

- Audit and harden the existing combined multi-stage `Dockerfile`
- Audit and harden `docker-compose.yml` or introduce `docker-compose.prod.yml` if separation is needed
- Health check configuration for container orchestration
- Environment variable handling for provider keys, CORS, and runtime config
- .dockerignore optimization
- Docker deployment documentation reconciliation

### Out of Scope

- Kubernetes manifests (future phase)
- Container registry setup (covered in CI/CD session)
- nginx-based split frontend container unless the audit proves it is needed
- SSL/TLS termination (handled by deployment platform or reverse proxy)

---

## Prerequisites

- [ ] Existing Docker setup reviewed (`npm run docker:build`)
- [ ] Node.js 18+ base image selected

---

## Deliverables

1. Optimized Dockerfile strategy (`Dockerfile` or split Dockerfiles if justified)
2. Production compose configuration (`docker-compose.yml` update or `docker-compose.prod.yml`)
3. Verified container health checks
4. Updated `.dockerignore`
5. Reconciled Docker deployment documentation

---

## Success Criteria

- [ ] Docker image size target documented and met or justified
- [ ] Container starts and passes health checks
- [ ] All 7 voice providers function correctly in containers
- [ ] Environment variables properly injected at runtime
- [ ] Documented Docker compose command starts the full stack
