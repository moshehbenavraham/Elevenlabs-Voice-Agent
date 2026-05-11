# PRD Phase 01: Production Deployment & DevOps

**Status**: In Progress
**Sessions**: 5 (initial estimate)
**Estimated Duration**: 3-5 days

**Progress**: 1/5 sessions validated (20%)

---

## Overview

This phase establishes production-grade deployment infrastructure for the Voice-Agent-PuPuPlatter platform. It covers Docker optimization, CI/CD pipeline setup, cloud deployment configuration, monitoring, and production security hardening.

Repository reconciliation on 2026-05-11 found substantial out-of-band baseline work: a combined multi-stage `Dockerfile`, `docker-compose.yml`, GitHub Actions workflows, Dependabot, deployment workflow, health endpoints, rate limiting, CSP meta policy, structured logging utilities, and deployment/security documentation. These baselines are not considered complete until each Phase 01 session audits them, fills gaps, validates behavior, and updates spec status.

---

## Progress Tracker

| Session | Name                           | Status          | Est. Tasks | Validated  |
| ------- | ------------------------------ | --------------- | ---------- | ---------- |
| 01      | Docker Production Optimization | Complete        | ~15        | 2026-05-11 |
| 02      | GitHub Actions CI/CD Pipeline  | Baseline Exists | ~18        | -          |
| 03      | Cloud Deployment Configuration | Baseline Exists | ~20        | -          |
| 04      | Monitoring & Observability     | Baseline Exists | ~16        | -          |
| 05      | Production Security Hardening  | Baseline Exists | ~14        | -          |

`Baseline Exists` means files exist outside the spec workflow and need audit/reconciliation before the session can be marked complete.

---

## Completed Sessions

1. Session 01: Docker Production Optimization (validated 2026-05-11)

---

## Upcoming Sessions

- Session 02: GitHub Actions CI/CD Pipeline
- Session 03: Cloud Deployment Configuration
- Session 04: Monitoring & Observability
- Session 05: Production Security Hardening

---

## Objectives

1. Create optimized multi-stage Docker builds with minimal image sizes
2. Reconcile and harden the existing GitHub Actions baseline for automated testing and deployment
3. Configure a production deployment path around Docker/GitHub Actions, with Coolify, webhook, or SSH as primary paths
4. Add monitoring, logging, and alerting infrastructure beyond the current baseline
5. Harden security for production API key management, CORS configuration, rate limiting, and security headers

---

## Prerequisites

- Phase 00 completed (ngrok demo mode provides testing infrastructure)
- Docker installed locally for development
- GitHub repository access for CI/CD setup
- Cloud provider or self-hosted deployment target for production testing

---

## Technical Considerations

### Architecture

- Multi-stage Docker builds with explicit decision between combined image and frontend/backend split
- Container orchestration considerations for local production testing and hosted deployment
- Environment-based configuration management
- Health check endpoints for container orchestration

### Technologies

- Docker & Docker Compose for containerization
- GitHub Actions for CI/CD automation
- GitHub Container Registry for image publication
- Deployment targets: Coolify/webhook/SSH as current primary path; Railway/Fly.io/Render/Vercel as alternatives where WebSocket constraints permit
- Cloud-native monitoring or external uptime/error tracking service
- Secrets management through GitHub Secrets and deployment provider secrets

### Risks

- **WebSocket Compatibility**: Voice providers require WebSocket connections; ensure cloud platforms support them
- **API Key Security**: Production must never expose API keys; implement secure backend proxying
- **CORS Complexity**: Multi-origin support needed for different deployment environments
- **Baseline Drift**: Existing out-of-band workflows and docs may not match the final Phase 01 architecture; audit before marking complete
- **Cold Start Latency**: Serverless deployments may introduce latency for voice connections; prefer long-running containers for full-stack voice demos

### Relevant Considerations

<!-- From CONSIDERATIONS.md -->

- [P00] **Demo mode CORS configuration**: Demo mode uses a single same-origin ngrok tunnel; ensure production split deployments use strict CORS settings
- [P00] **Runtime config injection pattern**: Extend the existing runtime config pattern for production environment variables
- [P00] **15-minute Gemini session limit**: Document this constraint for production users

### Existing Baseline To Audit

- `Dockerfile` and `docker-compose.yml` provide a combined production container path.
- `.github/workflows/quality.yml`, `test.yml`, `e2e.yml`, `security.yml`, `deploy.yml`, and `release.yml` provide CI/CD baseline workflows.
- `.github/dependabot.yml` provides dependency update automation.
- `server/index.js` exposes `/api/health`, applies CORS and rate limiting, and serves static files in production.
- `src/lib/logger.ts` and `src/lib/errorTracking.ts` provide structured logging/error capture foundations.
- `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `docs/environments.md`, and `docs/runbooks/incident-response.md` provide documentation baselines.

---

## Success Criteria

Phase complete when:

- [ ] All 5 sessions completed
- [ ] Docker image builds and runs successfully with all providers
- [ ] CI/CD pipeline runs tests on every PR and deploys on merge to main
- [ ] At least one cloud deployment target is fully configured and documented
- [ ] Health check endpoints respond correctly
- [ ] Production environment has monitoring/alerting set up
- [ ] Security audit passes (no exposed secrets, proper CORS, rate limiting)

---

## Dependencies

### Depends On

- Phase 00: Ngrok Demo Mode Integration (complete)

### Enables

- Future phases: Feature development can be rapidly deployed
- Production users: Platform becomes publicly accessible
