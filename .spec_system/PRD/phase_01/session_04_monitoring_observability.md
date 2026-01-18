# Session 04: Monitoring & Observability

**Session ID**: `phase01-session04-monitoring-observability`
**Status**: Not Started
**Estimated Tasks**: ~12
**Estimated Duration**: 2-4 hours

---

## Objective

Implement monitoring, logging, and observability infrastructure to enable operational visibility, debugging, and incident response for the production application.

---

## Scope

### In Scope (MVP)

- Structured JSON logging (pino library)
- Request logging middleware (method, path, duration, status)
- Error logging with stack traces (excluding sensitive data)
- Health check endpoint (`/api/health`)
- Readiness probe endpoint (`/api/ready`)
- Basic metrics endpoint (`/api/metrics`) - request counts, uptime
- Log redaction for API keys and sensitive data
- Frontend error boundary logging

### Out of Scope

- APM (Application Performance Monitoring)
- Distributed tracing
- Grafana dashboards
- AlertManager integration
- Log aggregation service setup (ELK, Datadog)

---

## Prerequisites

- [ ] Session 03 complete (deployment working)
- [ ] Backend API accessible

---

## Deliverables

1. `src/lib/logger.ts` - Structured logger implementation
2. `server/middleware/requestLogger.js` - Request logging middleware
3. `server/routes/health.js` - Health and readiness endpoints
4. Updated `server/index.js` with logging integration
5. `src/components/ErrorBoundary.tsx` - Enhanced error boundary
6. Updated docs/ARCHITECTURE.md with observability section

---

## Success Criteria

- [ ] All API requests logged with structured JSON
- [ ] Errors logged with context (excluding sensitive data)
- [ ] `/api/health` returns 200 with status info
- [ ] `/api/ready` validates service dependencies
- [ ] API keys never appear in logs
- [ ] Frontend errors captured and logged
- [ ] Log format compatible with JSON log aggregators
- [ ] Documentation covers log analysis procedures
