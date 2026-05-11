# Session 03: Cloud Deployment Configuration

**Session ID**: `phase01-session03-cloud-deployment-configuration`
**Status**: Not Started
**Estimated Tasks**: ~20
**Estimated Duration**: 3-4 hours

---

## Objective

Configure and document the production deployment path with proper environment configuration, using the current Docker/GitHub Actions baseline and a WebSocket-compatible hosting target.

---

## Scope

### In Scope (MVP)

- Coolify, webhook, or SSH deployment path for the combined Docker app
- Alternative managed-platform notes for Railway, Fly.io, Render, or split Vercel/frontend deployments
- Environment variable setup for each platform
- Custom domain configuration
- WebSocket support verification
- Deployment documentation

### Out of Scope

- AWS/GCP/Azure enterprise deployments
- Multi-region deployments
- Database persistence (stateless design)
- CDN configuration

---

## Prerequisites

- [ ] Session 01 completed or Docker baseline accepted
- [ ] Session 02 completed or deployment workflow baseline accepted
- [ ] Deployment target selected

---

## Deliverables

1. Deployment target configuration or documented webhook/SSH variables
2. Environment variable template for the selected target
3. Deployment script or workflow updates if needed
4. Reconciled deployment documentation
5. WebSocket and health-check verification notes

---

## Success Criteria

- [ ] Full-stack app deploys to production URL via CI/CD or documented manual trigger
- [ ] All voice providers connect through deployed services
- [ ] WebSocket connections work in production
- [ ] Environment variables properly configured
- [ ] Custom domain (if available) points to deployment
- [ ] CORS configured for production origins
