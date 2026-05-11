# Observability Guide

This guide defines the production monitoring contract for Voice-Agent-PuPuPlatter. The Phase 01 baseline uses container stdout, `/api/health`, `/api/metrics`, request IDs, deployment verification, and uptime probes. It does not require a separate metrics database, dashboard, tracing system, or external error tracking service.

## Operator Checklist

- Probe `https://voice.example.com/api/health` every 1-5 minutes.
- Alert on non-200 health responses, network failures, or repeated `unhealthy` states.
- Treat `degraded` as a warning unless the deployment is expected to have every provider configured.
- Capture `X-Request-Id` from failed API responses and search container logs for that value.
- Inspect `/api/metrics` when latency, 4xx, or 5xx rates increase.
- Keep provider API keys out of logs, screenshots, tickets, and command output.

## Health Endpoint

Endpoint:

```bash
curl -i https://voice.example.com/api/health
```

Expected status values:

| Status      | HTTP | Meaning                                                         |
| ----------- | ---- | --------------------------------------------------------------- |
| `healthy`   | 200  | App is ready and all provider runtime variables are configured. |
| `degraded`  | 200  | App is ready, but one or more provider variables are missing.   |
| `unhealthy` | 503  | App is not ready to serve production traffic.                   |

Health responses include:

- `requestId`: value also returned in the `X-Request-Id` response header.
- `ready`: whether the app can serve traffic.
- `statusMapping`: operator-facing status descriptions.
- `runtime`: Node environment, static asset readiness, process uptime, and PID.
- `providerSummary` and `services`: configured/missing provider variables by provider name.
- `security`: CORS, rate limiting, and demo-mode posture.
- `observability`: request logging, metrics, request ID header, and external tracking status.

Provider misconfiguration is intentionally `degraded`, not `unhealthy`, because the app can still serve static assets and configured providers. Static asset readiness failures in production are `unhealthy`.

## Metrics Endpoint

Endpoint:

```bash
curl -s https://voice.example.com/api/metrics
```

Optional route details:

```bash
curl -s "https://voice.example.com/api/metrics?details=true"
```

The endpoint returns aggregate in-memory metrics:

- `generatedAt`, `startedAt`, and `uptimeSeconds`.
- Request totals and in-flight request count.
- Error totals split into client and server errors.
- Counts by status code, status class, and HTTP method.
- Latency summary with min, max, average, p50, p95, sample count, and sample limit.
- `lastRequestAt`.
- `requests.byRoute` only when `details=true`.

Metrics are process-local and reset when the container restarts. This is intentional for the Phase 01 stateless deployment. Do not use `/api/metrics` as a billing or audit ledger.

## Request IDs

Every API response includes:

```text
X-Request-Id: <id>
```

Clients may send `X-Request-Id` or `X-Correlation-Id`. The server accepts only bounded ASCII IDs containing letters, numbers, `.`, `_`, `:`, or `-`; otherwise it generates a new UUID.

Use request IDs when triaging incidents:

1. Capture the `X-Request-Id` header from the failed browser or API response.
2. Search server/container logs for that value.
3. Compare the log entry status code, duration, method, path, and safe client metadata.
4. Check `/api/metrics` for broader error or latency patterns.

## Logs

Server request logs are structured JSON in production and pretty-printed in development. They include:

- `requestId`
- HTTP method and path
- route when available
- status code
- duration in milliseconds
- completion event (`finish` or `close`)
- safe client metadata such as host, origin, referer path, user agent, and content length

Logs do not include authorization headers, cookies, request bodies, provider API keys, raw audio, or query strings. Container stdout is the log collection boundary for this phase; use the hosting provider, Docker logs, or Coolify logs to inspect it.

Useful commands:

```bash
docker compose logs -f voice-agent
docker compose logs voice-agent | grep '<request-id>'
npm run server
```

## OpenAI Translation Lifecycle Logs

`POST /api/openai/translation-session` emits metadata-only lifecycle events
with event name `openai.translation.lifecycle`. These records help operators
inspect token/session startup behavior without exposing translation content or
provider payloads.

Allowed fields:

- `event`
- `phase`
- `result`
- `route`
- `requestId`
- `targetLanguage`
- `statusCategory`
- `statusCode`
- `errorCode`
- `durationConfig`
- `safetyIdentifier`
- `elapsedMs`

Lifecycle phases include validation failure, missing server configuration,
upstream request start, upstream failure, upstream timeout, invalid upstream
response, network failure, and success. `durationConfig` includes the resolved
max-session minutes/seconds, default, hard maximum, and config source.
`safetyIdentifier` reports only status and reason; it never logs a stable user
identifier value.

Translation lifecycle logs exclude raw request bodies, raw upstream response
bodies, client secrets, provider API keys, cookies, authorization headers,
audio, transcripts, and SDP payloads.

## Environment Controls

Server runtime variables:

```bash
LOG_LEVEL=info
REQUEST_LOGGING_ENABLED=true
METRICS_ENABLED=true
UPTIME_MONITOR_URL=https://voice.example.com/api/health
UPTIME_ALERT_DESTINATION=ops@example.com
```

`REQUEST_LOGGING_ENABLED=false` disables request completion logs but does not remove request IDs. `METRICS_ENABLED=false` disables metrics collection and makes `/api/metrics` return an explicit disabled response. Keep both enabled in production unless a hosting policy requires otherwise.

Frontend build-time variables:

```bash
VITE_ERROR_TRACKING_ENABLED=false
VITE_ERROR_TRACKING_PROVIDER=console
```

Frontend values are compiled into the Vite bundle. Rebuild and redeploy the image when changing `VITE_*` values.

## Uptime Monitoring

Recommended probe:

| Field                 | Value                                                    |
| --------------------- | -------------------------------------------------------- |
| URL                   | `https://voice.example.com/api/health`                   |
| Method                | `GET`                                                    |
| Interval              | 1-5 minutes                                              |
| Timeout               | 10-15 seconds                                            |
| Expected HTTP         | 200                                                      |
| Accepted app statuses | `healthy`, `degraded`                                    |
| Alert on              | network error, timeout, non-200, or repeated `unhealthy` |

Recommended alert routing:

1. Primary destination: team email, Slack channel, or monitoring provider contact group.
2. Include response status, response preview, and timestamp.
3. Include recent deployment run URL when alert follows deployment.
4. Link this guide and `docs/runbooks/incident-response.md`.

The repository cannot provision a real uptime monitor without the production URL, chosen provider, and alert destination. Until those are supplied, document the setup as deferred and keep deployment verification in use.

## Deployment Verification

Run after deploy:

```bash
npm run deploy:verify -- --url https://voice.example.com
```

For local server-only smoke checks:

```bash
npm run deploy:verify -- --url http://localhost:3001 --skip-root
```

The verifier checks root HTML unless skipped, health JSON, request ID headers, and metrics when enabled.

## Frontend Error Tracking

No external frontend error tracking provider is selected in the repository at this time. Production frontend errors use structured console output that can be captured by browser tooling or hosting logs, but this is not the same as Sentry, LogRocket, or a managed alerting product.

To enable a managed provider later:

1. Choose the provider and confirm data handling requirements.
2. Add the public build-time DSN or project ID using a `VITE_*` variable.
3. Keep server-side API keys out of the frontend bundle.
4. Update `src/lib/errorTracking.ts` to call the provider SDK.
5. Update this guide, `.env.production.example`, and the incident runbook.

## Escalation

Escalate when:

- `/api/health` is `unhealthy`.
- `/api/health` is unreachable from more than one network.
- 5xx counts increase in `/api/metrics`.
- p95 latency remains elevated across multiple probes.
- A provider is unexpectedly unconfigured or failing after credentials were rotated.

Include:

- Production URL.
- Timestamp and timezone.
- `X-Request-Id`.
- Health response status and provider summary.
- Metrics snapshot.
- Recent deployment SHA or image tag.
