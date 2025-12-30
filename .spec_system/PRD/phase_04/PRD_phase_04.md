# PRD Phase 04: Deployment & New Providers

**Status**: In Progress
**Sessions**: 4
**Estimated Duration**: 3-5 days

**Progress**: 3/4 sessions (75%)

---

## Overview

Phase 04 focuses on production-ready deployment via Coolify self-hosted platform and expanding provider support with Ultravox voice integration. This phase establishes the deployment infrastructure that matches the local development experience.

---

## Progress Tracker

| Session | Name                      | Status      | Est. Tasks | Validated  |
| ------- | ------------------------- | ----------- | ---------- | ---------- |
| 01      | Coolify Deployment Bundle | Complete    | 20         | 2025-12-30 |
| 02      | Ultravox Backend          | Complete    | 18         | 2025-12-30 |
| 03      | Ultravox Frontend         | Complete    | 20         | 2025-12-30 |
| 04      | Validation & Polish       | Not Started | ~12-15     | -          |

---

## Objectives

1. **Coolify Deployment**: Create Docker-based deployment artifacts for self-hosted Coolify platform
2. **Local Docker Testing**: docker-compose setup for production parity testing locally
3. **Ultravox Integration**: Add Ultravox.ai as fourth voice provider
4. **Documentation**: Production deployment guide for Coolify

---

## Prerequisites

- Phase 03 completed (Testing & Configuration)
- All providers functional (ElevenLabs, OpenAI, xAI)
- 215+ tests passing
- Coolify instance available for deployment testing
- **Ultravox API key already configured** in project `.env` file (accelerates Session 02-03)

---

## Technical Considerations

### Deployment Architecture

- **Frontend**: Static Vite build served via Nginx/Caddy
- **Backend**: Node.js Express server in Docker container
- **Networking**: Coolify internal network for frontend-backend communication
- **SSL**: Automatic via Coolify (Let's Encrypt)
- **Environment**: Secrets managed via Coolify UI

### Docker Strategy

- Multi-stage Dockerfile for optimized image size
- Production Node.js runtime (not dev dependencies)
- Nginx for static frontend serving
- Health checks for container orchestration

### Coolify-Specific

- Single repository, multiple services pattern
- Environment variables via Coolify secrets
- Automatic SSL certificate provisioning
- Built-in monitoring and logging

### Risks

- **WebSocket support**: Verify Coolify proxy handles WebSocket connections
- **Audio latency**: Container networking may add latency
- **Large Docker images**: Optimize multi-stage builds

### Relevant Considerations (from CONSIDERATIONS.md)

- [P00] **API Keys**: Must use backend proxy for all providers (ephemeral token pattern)
- [P00] **HTTPS Required**: Microphone access requires HTTPS - Coolify handles via Let's Encrypt
- [P02] **Function Allowlist**: Server-side validation for function calling security
- [P00] **Radix UI primitives**: Tabs, Select, ScrollArea provide accessibility out of the box
- [P01] **Research-first 4-session structure**: For new provider integration, use research -> backend -> frontend -> polish progression
- [P01] **~80% Code Reuse for New Providers**: OpenAI integration reused vast majority of xAI patterns - expect similar for Ultravox
- [P02] **Fresh token on each reconnect**: Ephemeral tokens may expire during backoff

---

## Success Criteria

Phase complete when:

- [ ] Dockerfile creates working production image
- [ ] docker-compose.yml enables local production testing
- [ ] Coolify deployment documentation complete
- [ ] Ultravox provider integrated (if API available)
- [ ] All existing tests pass in container environment
- [ ] HTTPS working with microphone access

---

## Dependencies

### Depends On

- Phase 03: Testing & Configuration (E2E tests, configuration modal)

### Enables

- Production deployment
- Fourth voice provider (Ultravox)
- Future provider expansions

---

## Sessions

### Session 01: Coolify Deployment Bundle

Create Docker-based deployment infrastructure:

- Multi-stage Dockerfile (build + production)
- docker-compose.yml for local testing
- Nginx configuration for frontend
- Environment variable documentation
- Health check endpoints
- Deployment guide for Coolify

### Session 02: Ultravox Research

Research Ultravox.ai Realtime API:

- API documentation review
- Authentication patterns
- Audio format requirements
- WebSocket protocol analysis
- Code reuse assessment (vs xAI/OpenAI patterns)

### Session 03: Ultravox Integration

Implement Ultravox as fourth provider:

- Backend ephemeral token endpoint
- Frontend context and hooks
- Provider tab UI
- Voice selection (if applicable)
- Transcript integration
- Function calling (if supported)

### Session 04: Validation & Polish

Final validation and polish:

- Cross-platform Docker testing
- Coolify deployment testing
- Performance validation
- Documentation review
- All provider parity check
