# Session Specification

**Session ID**: `phase04-session01-coolify-deployment`
**Phase**: 04 - Deployment & New Providers
**Status**: Not Started
**Created**: 2025-12-30

---

## 1. Session Overview

This session establishes the production deployment infrastructure for the Conversational Voice AI Agents application using Docker and Coolify. After 18 successful sessions building a multi-provider voice platform (ElevenLabs, xAI, OpenAI), the project now requires proper deployment infrastructure to move from local development to production.

The deployment strategy uses Coolify, a self-hosted PaaS alternative, chosen specifically because the application requires persistent WebSocket connections for real-time voice APIs. Serverless platforms (Vercel, Netlify) were ruled out as they cannot maintain the long-lived connections needed for voice streaming. Docker provides consistent dev/prod parity while Coolify handles SSL termination via Let's Encrypt (required for microphone access), domain management, and container orchestration.

This session is the foundation for Phase 04 and has no internal dependencies, making it immediately actionable. Once complete, subsequent sessions can proceed with production-verified infrastructure, and the Ultravox integration track can leverage containerized testing.

---

## 2. Objectives

1. Create a multi-stage Dockerfile producing a production image under 200MB
2. Configure docker-compose.yml for local deployment testing
3. Update Express server to serve static frontend builds in production mode
4. Document environment variables and Coolify deployment configuration

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-foundation` - Base React + Express architecture
- [x] `phase00-session02-xai-backend` - Backend API patterns established
- [x] `phase03-session05-validation-polish` - Health endpoint and production readiness

### Required Tools/Knowledge

- Docker and multi-stage build patterns
- Express.js static file serving
- Basic Coolify/Traefik proxy concepts

### Environment Requirements

- Docker Desktop or Docker Engine installed locally
- Node.js 20+ for build verification
- Access to all three provider API keys for testing

---

## 4. Scope

### In Scope (MVP)

- Multi-stage Dockerfile with node:20-alpine base
- docker-compose.yml for local testing workflow
- Express static file serving with SPA fallback
- Health check integration with Docker
- Environment variable documentation
- Coolify configuration guide (docs/DEPLOYMENT.md update)
- .dockerignore for build optimization

### Out of Scope (Deferred)

- Kubernetes configurations - _Reason: Coolify uses Docker directly_
- CI/CD deployment automation - _Reason: Future session scope_
- Multi-container orchestration - _Reason: Single container sufficient for MVP_
- Database/persistence layer - _Reason: Application is stateless_
- Nginx separate container - _Reason: Express serves static files directly_

---

## 5. Technical Approach

### Architecture

Single Docker container serving both the Vite-built frontend (static files) and Express.js backend API. Coolify's Traefik proxy handles SSL termination and routes traffic to the container. WebSocket connections for voice APIs are proxied through Traefik with proper upgrade headers.

```
[Client] --> [Coolify/Traefik (SSL)] --> [Docker Container]
                                              |
                                              +--> Express API (:3001)
                                              |    - /api/* routes
                                              |    - WebSocket proxy
                                              |
                                              +--> Static Files
                                                   - /dist/* (Vite build)
                                                   - SPA fallback
```

### Design Patterns

- **Multi-stage Build**: Separate build stages for frontend, backend deps, and final production image to minimize size
- **SPA Fallback**: Express catches all non-API routes and serves index.html for client-side routing
- **Health Check Pattern**: Docker HEALTHCHECK directive integrates with existing `/api/health` endpoint

### Technology Stack

- Docker 24+ with BuildKit
- node:20-alpine base image
- Express.js 4.x with compression middleware
- Coolify PaaS with Traefik proxy

---

## 6. Deliverables

### Files to Create

| File                 | Purpose                      | Est. Lines |
| -------------------- | ---------------------------- | ---------- |
| `Dockerfile`         | Multi-stage production build | ~45        |
| `docker-compose.yml` | Local deployment testing     | ~30        |
| `.dockerignore`      | Exclude dev files from build | ~20        |

### Files to Modify

| File                 | Changes                                     | Est. Lines |
| -------------------- | ------------------------------------------- | ---------- |
| `server/index.js`    | Add static file serving for production      | ~15        |
| `docs/DEPLOYMENT.md` | Coolify setup guide, env vars documentation | ~100       |
| `package.json`       | Add docker-related npm scripts              | ~5         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `docker build -t voice-agent .` completes successfully
- [ ] Built image size under 200MB
- [ ] `docker-compose up` starts application on port 3001
- [ ] Frontend loads correctly at http://localhost:3001
- [ ] All API endpoints respond (/api/health, /api/\*/session)
- [ ] WebSocket connections establish for xAI and OpenAI providers
- [ ] ElevenLabs widget/SDK loads and connects
- [ ] Environment variables properly injected at runtime

### Testing Requirements

- [ ] Manual testing of all three voice providers in container
- [ ] Health check passes within 30 seconds of startup
- [ ] Container restarts successfully after stop

### Quality Gates

- [ ] All files ASCII-encoded (0-127)
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No hardcoded secrets in Dockerfile or docker-compose
- [ ] .dockerignore excludes .env, node_modules, .git

---

## 8. Implementation Notes

### Key Considerations

- Express must serve static files BEFORE API routes to prevent route conflicts
- SPA fallback should only apply to non-API, non-file requests
- Compression middleware improves frontend asset delivery
- NODE_ENV=production must be set for Express optimizations

### Potential Challenges

- **WebSocket proxy configuration**: Coolify's Traefik should handle upgrade headers by default, but verify with actual deployment
- **Build cache optimization**: Order Dockerfile layers so package.json copy comes before source copy
- **Environment variable injection**: VITE\_\* variables must be available at build time, not runtime
- **Image size creep**: Watch for unnecessary files copied to final stage

### Relevant Considerations

- [P03] **Coolify over Vercel/Netlify**: Full-stack WebSocket needs ruled out serverless - validating this decision with working deployment
- [P03] **Docker-based deployment**: Creates consistent dev/prod parity - this session establishes that foundation
- [P00] **HTTPS Required**: Coolify's Let's Encrypt integration provides automatic SSL - document in deployment guide
- [P00] **API Keys**: Must use backend proxy pattern - Docker env vars keep keys server-side only

### ASCII Reminder

All output files must use ASCII-only characters (0-127). No smart quotes, em-dashes, or special Unicode in Dockerfile, docker-compose.yml, or documentation.

---

## 9. Testing Strategy

### Unit Tests

- No new unit tests required (infrastructure session)

### Integration Tests

- Existing E2E tests can run against containerized app after deployment

### Manual Testing

1. Build Docker image and verify size
2. Run docker-compose up and check logs for startup errors
3. Open http://localhost:3001 and verify frontend loads
4. Test each provider tab connects successfully
5. Verify health endpoint returns proper status
6. Stop and restart container, verify recovery
7. Test with missing env vars to verify error handling

### Edge Cases

- Container startup with missing required env vars (should fail gracefully)
- Frontend requests during container startup (health check guards)
- WebSocket reconnection after container restart
- Large conversation history in memory-constrained container

---

## 10. Dependencies

### External Libraries

- `compression`: ^1.7.4 (if not already installed - for static file gzip)

### Other Sessions

- **Depends on**: phase00-session01 through phase03-session05 (all complete)
- **Depended by**: phase04-session02 (Ultravox research), phase04-session03 (Ultravox integration)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
