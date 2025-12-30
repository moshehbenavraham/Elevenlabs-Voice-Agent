# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-30
**Project State**: Phase 04 - Deployment & New Providers
**Completed Sessions**: 18

---

## Recommended Next Session

**Session ID**: `phase04-session01-coolify-deployment`
**Session Name**: Coolify Deployment Bundle
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 15-18

---

## Why This Session Next?

### Prerequisites Met

- [x] Phase 03 (Testing & Configuration) completed
- [x] All 18 previous sessions delivered
- [x] Express.js backend infrastructure in place
- [x] Vite production build configured
- [x] Health endpoint exists at `/api/health`

### Dependencies

- **Builds on**: Existing full-stack architecture (React frontend + Express backend)
- **Enables**: Production deployment for all current providers, consistent testing environment for Ultravox integration

### Project Progression

This is the logical first session of Phase 04 for several reasons:

1. **Foundation for Production**: Docker deployment infrastructure must exist before the app can be deployed. All subsequent sessions benefit from having containerized testing.

2. **High Priority from CONSIDERATIONS.md**: The roadmap explicitly lists "Coolify Deployment Bundle" as the #1 high-priority item for Phase 04.

3. **No Internal Dependencies**: Session 01 has no prerequisites from other Phase 04 sessions, making it immediately actionable.

4. **Parallel Development Path**: Once Docker is set up, development can proceed locally while deployment is tested, enabling the Ultravox integration track to continue independently.

5. **Production Verification**: Having deployment infrastructure allows end-to-end verification that all three current providers (ElevenLabs, xAI, OpenAI) work in a production-like environment with HTTPS and proper WebSocket proxying.

---

## Session Overview

### Objective

Create Docker-based deployment infrastructure for self-hosted Coolify platform, enabling production deployment with the same developer experience as local development.

### Key Deliverables

1. Multi-stage Dockerfile (node:20-alpine base)
2. docker-compose.yml for local testing
3. Server static file serving for production mode
4. Environment variables documentation
5. Coolify configuration guide

### Scope Summary

- **In Scope (MVP)**: Dockerfile, docker-compose, server updates, health checks, Coolify guide
- **Out of Scope**: Kubernetes configs, CI/CD pipelines (future), multi-container orchestration

---

## Technical Considerations

### Technologies/Patterns

- Multi-stage Docker builds for small image size (<200MB)
- Express static file serving with SPA fallback
- Docker health checks integrated with existing `/api/health`
- Coolify's Traefik proxy for SSL termination

### Potential Challenges

- WebSocket proxy configuration for voice APIs
- Build cache optimization for fast rebuilds
- Environment variable injection in containerized setup
- Image size management with all dependencies

### Relevant Considerations

- [P03] **Coolify over Vercel/Netlify**: Full-stack WebSocket needs ruled out serverless
- [P03] **Docker-based deployment**: Creates consistent dev/prod parity
- [P00] **HTTPS Required**: Coolify's Let's Encrypt integration provides automatic SSL

---

## Alternative Sessions

If this session is blocked:

1. **phase04-session02-ultravox-research** - Can proceed independently as research task; doesn't require deployment infrastructure
2. **phase04-session03-ultravox-integration** - Would require Session 02 first, but could start development locally

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
