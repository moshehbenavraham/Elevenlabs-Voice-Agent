# Session Specification

**Session ID**: `phase01-session01-docker-production-optimization`
**Phase**: 01 - Production Deployment & DevOps
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session creates optimized, production-ready Docker configurations with multi-stage builds, minimal image sizes, and proper separation of frontend and backend services. The existing monolithic Dockerfile will be refactored into separate frontend and backend images to enable independent scaling, deployment, and caching.

The optimizations target significant image size reductions: frontend from the current combined image to a lean ~50MB nginx-served static bundle, and backend to a minimal ~200MB Alpine-based Node.js runtime. This separation also enables proper environment variable injection at runtime (critical for keeping API keys out of image layers) and health checks suitable for container orchestration.

This session is the foundation for Phase 01's DevOps infrastructure. The CI/CD pipeline (Session 02) requires optimized Docker images to build, test, and push to container registries. Cloud deployment (Session 03) needs these containerized applications. Completing this session validates that all 7 voice providers function correctly in containers.

---

## 2. Objectives

1. Create separate multi-stage Dockerfiles for frontend (nginx) and backend (Node.js) with optimal layer caching
2. Configure nginx to properly proxy WebSocket connections for all voice providers
3. Implement runtime environment variable injection for frontend (no secrets baked into images)
4. Create production Docker Compose configuration for local stack testing

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session04-terminal-output-demo-card` - Complete platform with all 7 voice providers working

### Required Tools/Knowledge

- Docker 20.10+ with BuildKit support
- Understanding of multi-stage Docker builds
- nginx configuration for static serving and WebSocket proxying
- Node.js Alpine images and production optimization

### Environment Requirements

- Docker installed and running locally
- At least one voice provider API key configured in .env
- ~2GB disk space for image builds

---

## 4. Scope

### In Scope (MVP)

- Multi-stage Dockerfile for frontend (Vite build + nginx serve)
- Multi-stage Dockerfile for backend (Express production build)
- docker-compose.prod.yml with frontend, backend, and networking
- nginx.conf with static serving and WebSocket proxy configuration
- Runtime environment variable injection via entrypoint script
- Health check endpoints verified in containerized environment
- .dockerignore optimization for minimal build context

### Out of Scope (Deferred)

- Kubernetes manifests - _Reason: Future phase; Docker Compose sufficient for MVP_
- Container registry setup - _Reason: Covered in Session 02 CI/CD Pipeline_
- SSL/TLS termination - _Reason: Handled by cloud platform/reverse proxy in Session 03_
- ARM64 multi-architecture builds - _Reason: Nice-to-have; x86_64 sufficient for MVP_
- Docker secrets management - _Reason: Environment variables sufficient for MVP_

---

## 5. Technical Approach

### Architecture

```
                    [Docker Compose Network]
                            |
         +------------------+------------------+
         |                                     |
    [frontend:80]                       [backend:3001]
         |                                     |
    nginx:alpine                         node:20-alpine
    (static files)                       (Express server)
         |                                     |
    /usr/share/nginx/html              /app/server + node_modules
    (~15MB static)                     (~150MB runtime)
```

**Frontend Container**:

- Stage 1: node:20-alpine builds Vite app
- Stage 2: nginx:alpine serves static files
- Entrypoint script injects VITE\_\* variables into window.VOICE_AGENT_CONFIG at runtime

**Backend Container**:

- Stage 1: node:20-alpine installs production dependencies
- Stage 2: node:20-alpine runs Express server with minimal footprint

### Design Patterns

- **Multi-stage builds**: Separate build and runtime stages for minimal image size
- **Non-root user**: Both containers run as non-root for security
- **Build argument injection**: VITE\_\* variables passed at build time for static embedding
- **Runtime config injection**: API base URL injected at container startup via entrypoint
- **Health check pattern**: Lightweight endpoints for orchestrator probes

### Technology Stack

- Docker 20.10+ with BuildKit
- nginx:alpine (latest stable)
- node:20-alpine (LTS)
- Docker Compose v2 specification

---

## 6. Deliverables

### Files to Create

| File                            | Purpose                                    | Est. Lines |
| ------------------------------- | ------------------------------------------ | ---------- |
| `Dockerfile.frontend`           | Multi-stage frontend build with nginx      | ~60        |
| `Dockerfile.backend`            | Multi-stage backend build                  | ~45        |
| `docker-compose.prod.yml`       | Production compose with both services      | ~50        |
| `docker/nginx.conf`             | nginx config for static serving + WS proxy | ~80        |
| `docker/frontend-entrypoint.sh` | Runtime env var injection script           | ~30        |
| `docs/docker-deployment.md`     | Docker deployment documentation            | ~100       |

### Files to Modify

| File            | Changes                                       | Est. Lines |
| --------------- | --------------------------------------------- | ---------- |
| `.dockerignore` | Add playwright, e2e tests, scripts exclusions | ~10        |
| `package.json`  | Add docker:prod script for compose            | ~3         |
| `Dockerfile`    | Add deprecation notice pointing to new files  | ~5         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Frontend image builds successfully with multi-stage Dockerfile
- [ ] Backend image builds successfully with multi-stage Dockerfile
- [ ] `docker compose -f docker-compose.prod.yml up` starts full stack
- [ ] Frontend serves at http://localhost:80 via nginx
- [ ] Backend API accessible at http://localhost:3001
- [ ] All 7 voice providers function correctly through nginx proxy
- [ ] WebSocket connections work for OpenAI, xAI, and Gemini Live
- [ ] Environment variables properly injected at runtime

### Testing Requirements

- [ ] Manual testing of all voice providers in containerized environment
- [ ] Health check endpoints respond correctly (`/api/health`)
- [ ] Container startup completes within 30 seconds

### Quality Gates

- [ ] Frontend image size under 50MB
- [ ] Backend image size under 200MB
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions
- [ ] No secrets baked into image layers

---

## 8. Implementation Notes

### Key Considerations

- nginx must handle WebSocket upgrade for `/api/openai/*`, `/api/xai/*`, `/api/gemini/*` endpoints
- Frontend env vars injected at runtime via entrypoint script modifying index.html
- Alpine images require explicit timezone configuration if needed
- Non-root user requires proper file ownership in COPY commands

### Potential Challenges

- **WebSocket proxy configuration**: nginx requires specific headers (Upgrade, Connection) for WebSocket passthrough; test all providers
- **Runtime env injection**: Must replace placeholder in built index.html without breaking SPA; use sed or envsubst carefully
- **Build cache invalidation**: Order Dockerfile instructions to maximize layer cache hits (COPY package\*.json before source)
- **Signal handling**: Node.js in Docker needs proper SIGTERM handling; Express should have graceful shutdown

### Relevant Considerations

- [P00] **Demo mode CORS configuration**: Production Dockerfiles MUST use strict CORS settings via CORS_ORIGIN env var, not the dynamic demo mode configuration. Validate CORS_ORIGIN is required and documented.
- [P00] **Runtime config injection pattern**: Extend `window.VOICE_AGENT_CONFIG` pattern used in demo mode for Docker environment variables. Frontend already supports this; entrypoint script should inject values.
- [P00] **15-minute Gemini session limit**: Document this API constraint in docker-deployment.md so users understand the limitation is not Docker-related.

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- N/A - Docker configurations are tested via build and integration

### Integration Tests

- Build frontend image and verify size < 50MB
- Build backend image and verify size < 200MB
- Start compose stack and verify connectivity

### Manual Testing

- [ ] Start stack with `docker compose -f docker-compose.prod.yml up`
- [ ] Access frontend at http://localhost (port 80)
- [ ] Verify each voice provider tab loads
- [ ] Test ElevenLabs Widget connection
- [ ] Test ElevenLabs SDK connection
- [ ] Test OpenAI Realtime connection (WebSocket)
- [ ] Test xAI Realtime connection (WebSocket)
- [ ] Test Ultravox connection
- [ ] Test Vapi connection
- [ ] Test Retell connection
- [ ] Test Gemini Live connection (WebSocket)
- [ ] Verify health endpoint returns correct data
- [ ] Stop stack and verify clean shutdown

### Edge Cases

- Container startup with no API keys configured (should start, providers show unconfigured)
- Container restart after crash (health check should recover)
- WebSocket reconnection after container restart

---

## 10. Dependencies

### External Libraries

- nginx:alpine (Docker image)
- node:20-alpine (Docker image)
- Docker Compose v2

### Other Sessions

- **Depends on**: Phase 00 complete (working platform to containerize)
- **Depended by**: Session 02 (CI/CD needs Docker images to build/push), Session 03 (Cloud Deployment needs containers)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
