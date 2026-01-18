# Session 02: Containerization & Build

**Session ID**: `phase01-session02-containerization-build`
**Status**: Not Started
**Estimated Tasks**: ~14
**Estimated Duration**: 2-4 hours

---

## Objective

Create production-ready Docker containers for both frontend and backend components with optimized multi-stage builds, proper security practices, and efficient caching.

---

## Scope

### In Scope (MVP)

- Multi-stage Dockerfile for frontend (build + nginx serve)
- Multi-stage Dockerfile for backend (build + production runtime)
- docker-compose.yml for local development
- docker-compose.prod.yml for production
- .dockerignore for build optimization
- Non-root user in containers
- Health check instructions in Dockerfiles
- Bundle size analysis and optimization

### Out of Scope

- Kubernetes manifests (future phase)
- Helm charts
- Container vulnerability scanning
- Image signing

---

## Prerequisites

- [ ] Session 01 complete (CI pipeline working)
- [ ] Docker installed locally for testing

---

## Deliverables

1. `Dockerfile` - Multi-stage build for both components
2. `docker-compose.yml` - Local development setup
3. `docker-compose.prod.yml` - Production configuration
4. `.dockerignore` - Build exclusions
5. Updated docs/DEPLOYMENT.md with container instructions

---

## Success Criteria

- [ ] Frontend image builds successfully
- [ ] Backend image builds successfully
- [ ] Combined image size under 500MB
- [ ] Containers run as non-root user
- [ ] docker-compose up starts full application
- [ ] Health check passes in container
- [ ] No API keys baked into images
- [ ] Build uses layer caching effectively
