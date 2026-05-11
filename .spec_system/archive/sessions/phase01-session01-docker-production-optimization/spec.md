# Session Specification

**Session ID**: `phase01-session01-docker-production-optimization`
**Phase**: 01 - Production Deployment & DevOps
**Status**: Completed
**Created**: 2026-01-18
**Reconciled**: 2026-05-11

---

## 1. Session Overview

This session audits and optimizes the existing production Docker path. The repository already contains a combined multi-stage `Dockerfile` and `docker-compose.yml` that build the Vite frontend, run Express in production mode, and serve both `dist/` and `/api/*` from port 3001.

The session should not assume that split frontend/backend images are required. The first implementation decision is whether the combined full-stack container remains the production default or whether a split image architecture is justified. The likely MVP path is to harden the current combined container, document the image-size target, verify non-root execution and health checks, and reconcile Docker documentation with the actual commands.

This session is the foundation for Phase 01's DevOps infrastructure. The existing GitHub Actions deployment workflow builds and pushes a Docker image, so Session 02 and Session 03 depend on this session producing an accurate, validated Docker strategy.

---

## 2. Objectives

1. Audit the existing `Dockerfile`, `docker-compose.yml`, `.dockerignore`, and Docker npm scripts for production correctness
2. Optimize the accepted Docker strategy for cache efficiency, non-root runtime, image size, and health checks
3. Verify environment variable handling so server-side provider keys are runtime-only and not baked into image layers
4. Reconcile Docker deployment documentation with the actual compose/build commands

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session04-terminal-output-demo-card` - Complete platform with all 7 voice providers working

### Required Tools/Knowledge

- Docker 20.10+ with BuildKit support
- Understanding of multi-stage Docker builds
- Node.js Alpine images and production optimization
- Express static serving and health check behavior

### Environment Requirements

- Docker installed and running locally
- At least one voice provider API key configured in .env
- ~2GB disk space for image builds

---

## 4. Scope

### In Scope (MVP)

- Audit and harden the existing combined multi-stage `Dockerfile`
- Audit and harden `docker-compose.yml` or introduce `docker-compose.prod.yml` if preserving the current compose file is necessary
- Verify production Express serves `dist/` and `/api/*` correctly in a container
- Verify runtime environment variables for provider keys, CORS, and runtime API config
- Verify health check behavior in containerized environment
- Optimize `.dockerignore` for minimal build context
- Reconcile README and deployment documentation with the final Docker path

### Out of Scope (Deferred)

- Kubernetes manifests - _Reason: Future phase; Docker Compose sufficient for MVP_
- Container registry setup - _Reason: Covered in Session 02 CI/CD Pipeline_
- nginx-based split frontend container - _Reason: Only implement if the Docker audit proves split images are required_
- SSL/TLS termination - _Reason: Handled by cloud platform/reverse proxy in Session 03_
- ARM64 multi-architecture builds - _Reason: Nice-to-have; x86_64 sufficient for MVP_
- Docker secrets management - _Reason: Environment variables sufficient for MVP_

---

## 5. Technical Approach

### Architecture

```
                    [Docker Host]
                         |
                 [voice-agent:3001]
                         |
                  node:20-alpine
                         |
          Express serves dist/ and /api/*
```

**Combined Container**:

- Stage 1: node:20-alpine installs dependencies and builds the Vite app
- Stage 2: node:20-alpine installs production dependencies
- Stage 3: node:20-alpine runs Express with built `dist/`, `server/`, and production `node_modules`

### Design Patterns

- **Multi-stage builds**: Separate build and runtime stages for minimal image size
- **Non-root user**: Runtime container runs as non-root for security
- **Build argument injection**: Only non-secret VITE\_\* variables may be passed at build time
- **Runtime config discipline**: Server-side provider keys must be provided at runtime
- **Health check pattern**: Lightweight endpoints for orchestrator probes

### Technology Stack

- Docker 20.10+ with BuildKit
- node:20-alpine (LTS)
- Docker Compose v2 specification

---

## 6. Deliverables

### Files to Create

| File                      | Purpose                                                        | Est. Lines |
| ------------------------- | -------------------------------------------------------------- | ---------- |
| `docker-compose.prod.yml` | Optional production compose file if audit keeps dev/prod split | ~50        |

### Files to Modify

| File                 | Changes                                                     | Est. Lines |
| -------------------- | ----------------------------------------------------------- | ---------- |
| `Dockerfile`         | Optimize and document accepted production image strategy    | ~20        |
| `docker-compose.yml` | Harden local production compose behavior or document scope  | ~20        |
| `.dockerignore`      | Reconcile ignored files with actual build context needs     | ~10        |
| `package.json`       | Add or adjust Docker scripts if command names are unclear   | ~3         |
| `docs/DEPLOYMENT.md` | Align Docker deployment docs with actual files and commands | ~60        |
| `README.md`          | Align Docker command summary if stale                       | ~20        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Accepted Docker strategy is documented as combined container or justified split images
- [ ] Docker image builds successfully with the documented command
- [ ] Documented compose command starts the full stack
- [ ] Frontend serves from Express at http://localhost:3001 in production container mode
- [ ] Backend API accessible at http://localhost:3001/api/health
- [ ] All 7 voice providers can load and reach expected backend endpoints in the container
- [ ] WebSocket connections work for OpenAI, xAI, and Gemini Live
- [ ] Server-side provider keys are runtime environment variables, not image-layer secrets

### Testing Requirements

- [ ] Manual or mocked verification of all voice providers in containerized environment
- [ ] Health check endpoints respond correctly (`/api/health`)
- [ ] Container startup completes within 30 seconds

### Quality Gates

- [ ] Image size target documented and met or justified
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions
- [ ] No secrets baked into image layers

---

## 8. Implementation Notes

### Key Considerations

- The current production path uses Express, not nginx, to serve both static frontend and API routes
- Client-side VITE values can be build-time values, but provider API keys must stay runtime-only on the server
- Alpine images require explicit timezone configuration if needed
- Non-root user requires proper file ownership in COPY commands

### Potential Challenges

- **Architecture drift**: PRD previously assumed split images, but repo uses a combined container; document the final decision clearly
- **Runtime env handling**: Avoid baking server-side API keys into image layers
- **Build cache invalidation**: Order Dockerfile instructions to maximize layer cache hits (COPY package\*.json before source)
- **Signal handling**: Node.js in Docker needs proper SIGTERM handling; Express should have graceful shutdown

### Relevant Considerations

- [P00] **Demo mode CORS configuration**: Demo mode uses a single same-origin ngrok tunnel; production split deployments must use strict CORS settings via CORS_ORIGIN.
- [P00] **Runtime config injection pattern**: The current demo uses `window.__DEMO_CONFIG__`; production Docker docs should explain when `VITE_API_BASE_URL` is needed and when same-origin is used.
- [P00] **15-minute Gemini session limit**: Document this API constraint in deployment docs so users understand the limitation is not Docker-related.

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- N/A - Docker configurations are tested via build and integration

### Integration Tests

- Build accepted Docker image and inspect final size
- Start compose stack and verify connectivity

### Manual Testing

- [ ] Start stack with the documented compose command
- [ ] Access frontend at http://localhost:3001
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

- node:20-alpine (Docker image)
- Docker Compose v2

### Other Sessions

- **Depends on**: Phase 00 complete (working platform to containerize)
- **Depended by**: Session 02 (CI/CD needs Docker images to build/push), Session 03 (Cloud Deployment needs containers)

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
