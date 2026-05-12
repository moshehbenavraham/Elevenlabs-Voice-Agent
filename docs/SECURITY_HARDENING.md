# Production Security Hardening

This guide documents the production security controls for Voice-Agent-PuPuPlatter.
It is intended for deployment owners who operate the Docker container, rotate
provider keys, and verify browser-facing security behavior.

## Security Boundary

The Express server is the security boundary for provider credentials. Browser
clients must never receive raw provider API keys in production. Browser clients
may receive provider-scoped connection material only when the provider supports a
browser-safe token or signed URL flow.

Protected token and session routes:

| Provider   | Route                              |
| ---------- | ---------------------------------- |
| ElevenLabs | `GET /api/elevenlabs/signed-url`   |
| OpenAI     | `POST /api/openai/session`         |
| xAI        | `POST /api/xai/session`            |
| Ultravox   | `POST /api/ultravox/call`          |
| Retell     | `POST /api/retell/create-web-call` |
| Gemini     | `POST /api/gemini/session`         |

## Production CORS

Set `CORS_ORIGIN` to one or more exact HTTPS origins:

```bash
CORS_ORIGIN=https://voice.example.com
```

Multiple origins are comma-separated:

```bash
CORS_ORIGIN=https://voice.example.com,https://admin.example.com
```

Production rejects unsafe CORS posture:

- Missing `CORS_ORIGIN` with `NODE_ENV=production`
- `CORS_ORIGIN=*`
- Invalid origin strings
- localhost-only production origins

`docker-compose.yml` sets `ALLOW_LOCALHOST_PRODUCTION_CORS=true` for local
production smoke tests only. Remote production deployments must keep this flag
unset or `false`; `docker-compose.deploy.yml` forces it to `false`.

Requests without an `Origin` header remain allowed for same-origin navigation,
health probes, curl checks, and container health checks. Browser requests with
an unauthorized `Origin` do not receive an allow-origin header.

## Security Headers

The server applies security headers to every response before API and static
routes:

- `Content-Security-Policy`
- `Strict-Transport-Security` in production
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy: same-origin`

The CSP keeps current voice-provider behavior working by allowing same-origin
assets, provider HTTPS and WSS endpoints, Blob/data media sources, and audio
workers. Keep CSP changes small and verify each provider tab after changes.

## Body Limits And Validation

JSON request bodies use an explicit size limit. The default is `128kb`; override
only when a deployment has a documented need:

```bash
JSON_BODY_LIMIT=128kb
```

Provider routes validate request shapes before external API calls. Validation
covers allowed fields, string lengths, integer ranges, object depth, object key
counts, and malformed JSON behavior. Validation failures return structured 400
responses and do not call provider APIs.

## Rate Limits

All `/api` routes use the broad API limiter:

- 100 requests per 15 minutes per client

Token and session routes use the stricter limiter:

- 10 requests per minute per client

Token and session routes also reject duplicate matching requests while an
earlier request is still in flight. This prevents double-click and retry races
from creating multiple provider sessions at the same time.

## Gemini Production Posture

The Gemini Live browser flow uses a server-side `GEMINI_API_KEY` to mint
short-lived Live API auth tokens. The browser receives only the
`auth_tokens/...` value from `/api/gemini/session`, not the long-lived server
credential.

Development still has a local compatibility fallback that can return the raw key
if the auth-token exchange is unavailable. Production does not use that fallback:

```bash
VITE_GEMINI_ENABLED=true
GEMINI_API_KEY=CHANGE_ME_GEMINI_API_KEY
```

If token creation fails in production, the frontend shows a Gemini session error.
Other providers are unaffected.

## API Key Rotation

Rotate provider keys on a regular cadence and immediately after suspected
exposure. A 90-day cadence is a reasonable baseline for demo deployments.

1. Create a new provider API key in the provider dashboard.
2. Add the new key to the deployment environment as the runtime secret.
3. Restart or redeploy the container so Node reads the new environment.
4. Verify `/api/health` and the affected provider tab.
5. Revoke the old provider key.
6. Watch `/api/metrics` and server logs for 401, 403, or 429 spikes.

Rollback if the new key fails:

1. Restore the previous known-good runtime secret.
2. Restart or redeploy the container.
3. Re-run health and provider checks.
4. Keep the failed key disabled unless the provider dashboard confirms it was
   never used.

Never add provider keys to `VITE_*` variables, Docker build args, commits, logs,
or issue text.

## Verification Commands

Run local verification after deployment:

```bash
npm run deploy:verify -- --url https://voice.example.com
```

Check headers:

```bash
curl -sS -D - -o /dev/null https://voice.example.com/api/health
```

Check unauthorized CORS behavior:

```bash
curl -sS -D - -o /dev/null \
  -X OPTIONS https://voice.example.com/api/xai/session \
  -H 'Origin: https://evil.example.com' \
  -H 'Access-Control-Request-Method: POST'
```

The unauthorized response should not include an `Access-Control-Allow-Origin`
header for the unauthorized origin.

Check allowed CORS behavior:

```bash
curl -sS -D - -o /dev/null \
  -X OPTIONS https://voice.example.com/api/xai/session \
  -H 'Origin: https://voice.example.com' \
  -H 'Access-Control-Request-Method: POST'
```

The allowed response should include the configured origin.

## External Scanner Checks

After a real HTTPS production URL exists, run a browser security header scanner
against the public origin. Recommended checks:

- Mozilla Observatory
- securityheaders.com
- OWASP ZAP baseline scan, if approved for the environment

Scanner verification is blocked for local-only deployments because scanners need
public HTTPS access. Record the blocker in the release notes or validation file
until a production URL is available.

## Incident Response Triggers

Open an incident if any of these occur:

- `/api/health` reports unsafe production CORS configuration
- Security headers disappear from production responses
- Token/session routes return broad API limiter headers only
- Raw provider API keys appear in a browser response, browser console, network
  capture, or server log
- Provider routes accept malformed or oversized payloads and call upstream APIs

Follow `docs/runbooks/incident-response.md` for containment, rotation, rollback,
and escalation steps.

## Known Deferrals

This phase does not add user authentication, tenant authorization, DDoS
protection, secret-manager integration, penetration testing, or a CSP
reporting endpoint. WAF rules are expected to be enforced by the hosting
platform or edge provider, not by the repo itself, and should be configured
before public launch. Those controls otherwise belong to later product phases.
