# Deployment Guide

This guide covers deploying Voice-Agent-PuPuPlatter to production. The recommended platform is **Coolify** with the combined full-stack Docker container. GHCR image deployments and SSH-based Docker hosts are supported automation paths.

## Quick Deploy (Coolify)

```bash
# Copy and configure production environment
cp .env.production.example .env.production

# For combined same-origin Docker production
# keep VITE_API_BASE_URL=/ before building.

# Test locally
npm run docker:prod

# Push to Coolify via Git integration, or let GitHub Actions publish to GHCR
git push origin main
```

## Table of Contents

- [Deployment Philosophy](#deployment-philosophy)
- [Coolify Deployment (Recommended)](#coolify-deployment-recommended)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Local Production Testing](#local-production-testing)
- [Environment Configuration](#environment-configuration)
- [Alternative Platforms](#alternative-platforms)
- [SSL/HTTPS Setup](#ssl-https-setup)
- [Troubleshooting](#troubleshooting)

## Deployment Philosophy

This project is a **full-stack application** with:

- React frontend (Vite build)
- Express.js backend (Node.js)
- WebSocket connections (voice APIs)

### Why Self-Hosted (Coolify)?

| Requirement            | Coolify | Vercel/Netlify  |
| ---------------------- | ------- | --------------- |
| Full-stack Node.js     | Yes     | Serverless only |
| Persistent WebSockets  | Yes     | Limited/No      |
| Single deployment      | Yes     | Split services  |
| Environment secrets    | Yes     | Yes             |
| Automatic SSL          | Yes     | Yes             |
| Infrastructure control | Full    | Limited         |

### When to Use Alternatives

- **Vercel/Netlify**: Frontend-only deployments (requires separate backend hosting)
- **Railway/Render**: Full-stack but managed (less control)
- **AWS/GCP**: Enterprise scale (more complexity)

## Coolify Deployment (Recommended)

### Prerequisites

- [Coolify](https://coolify.io) instance (self-hosted or managed)
- Docker installed on Coolify server
- Git repository access
- Custom domain with DNS control
- At least one provider credential for a fully configured health response

### Option A: Repository Build

Use this path when Coolify can access the repository and build the image itself.

1. Create a Coolify application from the Git repository.
2. Select the root `Dockerfile` as the build source.
3. Set public build-time `VITE_*` variables from `.env.production.example`.
4. Set runtime provider secrets and `CORS_ORIGIN` in Coolify environment variables.
5. Expose port `3001` or the value of `SERVER_PORT`.
6. Add the production domain and enable SSL.

Repository builds are the easiest way to change frontend values such as provider toggles, ElevenLabs agent ID, Vapi web token, Retell agent ID, voice labels, and `VITE_API_BASE_URL`. These values are compiled into the Vite bundle during the Docker build.

### Option B: GHCR Image

Use this path when GitHub Actions publishes the image and Coolify should only pull and run it.

1. Make the GHCR package visible to the Coolify host, or configure a GHCR registry credential in Coolify.
2. Create a Docker image application in Coolify.
3. Set the image to `ghcr.io/<owner>/<repo>:latest` or an immutable `sha-<commit>` tag from the Deploy workflow.
4. Configure runtime variables from `.env.production.example`.
5. Set `CORS_ORIGIN` to the exact HTTPS origin, for example `https://voice.example.com`.
6. Expose the container port `3001`.
7. Add the production domain and enable SSL.

When using a prebuilt GHCR image, changing frontend `VITE_*` values requires rebuilding and republishing the image. Runtime server secrets can change without rebuilding.

### Required Runtime Variables

Set these in Coolify for both deployment options:

```bash
NODE_ENV=production
SERVER_PORT=3001
CORS_ORIGIN=https://voice.example.com

ELEVENLABS_API_KEY=CHANGE_ME_ELEVENLABS_API_KEY
XAI_API_KEY=CHANGE_ME_XAI_API_KEY
OPENAI_API_KEY=CHANGE_ME_OPENAI_API_KEY
ULTRAVOX_API_KEY=CHANGE_ME_ULTRAVOX_API_KEY
RETELL_API_KEY=CHANGE_ME_RETELL_API_KEY
GEMINI_API_KEY=CHANGE_ME_GEMINI_API_KEY
VITE_ELEVENLABS_AGENT_ID=CHANGE_ME_ELEVENLABS_AGENT_ID
VITE_VAPI_WEB_TOKEN=CHANGE_ME_VAPI_PUBLIC_WEB_TOKEN
```

### Domain And SSL

1. Add custom domain in Coolify
2. Configure DNS (A record pointing to Coolify server)
3. Enable automatic SSL (Let's Encrypt)
4. Verify HTTPS is working (required for microphone access)

### Deploy And Verify

1. Click "Deploy" or push to your connected branch
2. Monitor build logs in Coolify dashboard
3. Verify health endpoint: `https://your-domain.com/api/health`
4. Run `npm run deploy:verify -- --url https://your-domain.com`
5. Test voice connection in browser

### Dockerfile Reference

The root `Dockerfile` is the source of truth. It builds the Vite frontend, installs production dependencies, copies `dist/` and `server/`, runs as a non-root user through `dumb-init`, exposes port 3001, and checks `/api/health`.

### Docker Strategy

The production default is one combined full-stack container:

- Express serves the Vite `dist/` output and all `/api/*` routes.
- Provider API keys are injected at container runtime only.
- Public `VITE_*` frontend values are passed as build args.
- Same-origin production builds should set `VITE_API_BASE_URL=/`.
- Split frontend/backend hosting is supported only when a platform requires it; then set `VITE_API_BASE_URL` to the backend URL and configure `CORS_ORIGIN` for the frontend URL.

Image size target: keep the production image under 325 MB decimal. The pre-optimization baseline was 302.4 MB decimal; a larger final image should be justified by runtime dependencies or platform requirements.

## GitHub Actions CI/CD

GitHub Actions owns the repository CI/CD baseline. See
[CI/CD Operations Guide](CI_CD.md) for branch protection checks, required
secrets, repository variables, and workflow behavior.

### Workflow Names

| Workflow     | File                             | Purpose                                           |
| ------------ | -------------------------------- | ------------------------------------------------- |
| Code Quality | `.github/workflows/quality.yml`  | Lint, format, and TypeScript checks               |
| Build & Test | `.github/workflows/test.yml`     | Production build and unit tests                   |
| E2E Tests    | `.github/workflows/e2e.yml`      | Playwright browser tests                          |
| Security     | `.github/workflows/security.yml` | Secrets, CodeQL, dependency review, and npm audit |
| Deploy       | `.github/workflows/deploy.yml`   | GHCR image publication and deployment trigger     |
| Release      | `.github/workflows/release.yml`  | Tag-based release artifact publication            |

### GHCR Image Tags

Pushes to `main` run the Deploy workflow and publish a production image to:

```text
ghcr.io/<owner>/<repo>
```

Generated tags include:

- `sha-<commit>` for immutable deployments.
- `latest` on the default branch.
- The branch reference tag.
- Tag reference metadata when applicable.

The workflow selects one image reference for deployment and also reports the
image digest in logs and failure issues.

### Deployment Variables

Webhook deployment uses:

| Name                   | Type                               | Required        | Notes                                |
| ---------------------- | ---------------------------------- | --------------- | ------------------------------------ |
| `DEPLOY_WEBHOOK_URL`   | Repository or environment variable | Yes for webhook | HTTPS endpoint to trigger deployment |
| `DEPLOY_WEBHOOK_TOKEN` | Environment secret                 | Yes for webhook | Bearer token sent to the webhook     |

SSH deployment uses:

| Name              | Type                               | Required    | Notes                          |
| ----------------- | ---------------------------------- | ----------- | ------------------------------ |
| `DEPLOY_SSH_HOST` | Repository or environment variable | Yes for SSH | Remote host                    |
| `DEPLOY_SSH_USER` | Repository or environment variable | Yes for SSH | Remote SSH user                |
| `DEPLOY_SSH_KEY`  | Environment secret                 | Yes for SSH | Private key for remote access  |
| `DEPLOY_PATH`     | Repository or environment variable | Optional    | Defaults to `/opt/voice-agent` |

Optional post-deploy health checks use:

| Name               | Type                               | Required | Notes                                        |
| ------------------ | ---------------------------------- | -------- | -------------------------------------------- |
| `HEALTH_CHECK_URL` | Repository or environment variable | Optional | Usually `https://your-domain.com/api/health` |

If neither webhook nor SSH settings are configured, the Deploy workflow still
builds and pushes the GHCR image, then exits with a notice. That no-config path
is expected before the final deployment target exists.

### Webhook Deployment Contract

Configure webhook deployment when a platform such as Coolify, a deploy proxy, or a custom automation service should receive the image reference and redeploy the app.

Required GitHub settings:

| Name                   | Type                               | Notes                                           |
| ---------------------- | ---------------------------------- | ----------------------------------------------- |
| `DEPLOY_WEBHOOK_URL`   | Repository or environment variable | HTTPS endpoint called by the Deploy workflow    |
| `DEPLOY_WEBHOOK_TOKEN` | Environment secret                 | Bearer token sent in the `Authorization` header |
| `HEALTH_CHECK_URL`     | Repository or environment variable | Optional post-deploy `/api/health` URL          |

The workflow sends a JSON payload:

```json
{
  "image": "ghcr.io/<owner>/<repo>:sha-<commit>",
  "digest": "sha256:<image-digest>",
  "sha": "<commit-sha>",
  "run_url": "https://github.com/<owner>/<repo>/actions/runs/<run-id>"
}
```

The webhook target must:

1. Authenticate `Authorization: Bearer <DEPLOY_WEBHOOK_TOKEN>`.
2. Pull and run the `image` value from the payload.
3. Treat the payload as a deployment request, not as trusted user input.
4. Return an HTTP 2xx response within 30 seconds.
5. Complete long-running deployment work asynchronously if the platform cannot finish within the webhook timeout.
6. Preserve runtime secrets on the target host or platform; the webhook payload never includes provider API keys.

### SSH Deployment With Remote Compose

Use SSH deployment when the target is a Docker host that should pull the image published by GitHub Actions.

Remote directory layout:

```text
/opt/voice-agent/
|-- docker-compose.deploy.yml
|-- .env.production
```

Initial host setup:

```bash
sudo mkdir -p /opt/voice-agent
sudo chown "$USER":"$USER" /opt/voice-agent
cd /opt/voice-agent

# Upload docker-compose.deploy.yml from this repository.
# Create .env.production from .env.production.example and fill in values.
cp .env.production.example .env.production
```

If the GHCR package is private, log in on the host before the first pull:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

Manual deploy command on the host:

```bash
cd /opt/voice-agent
export IMAGE_REF=ghcr.io/<owner>/<repo>:sha-<commit>
docker compose --env-file .env.production -f docker-compose.deploy.yml pull
docker compose --env-file .env.production -f docker-compose.deploy.yml up -d --remove-orphans
docker compose --env-file .env.production -f docker-compose.deploy.yml ps
```

GitHub SSH deployment runs the same Compose file. Configure:

| Name               | Type                               | Notes                                  |
| ------------------ | ---------------------------------- | -------------------------------------- |
| `DEPLOY_SSH_HOST`  | Repository or environment variable | Remote Docker host                     |
| `DEPLOY_SSH_USER`  | Repository or environment variable | User that can run Docker Compose       |
| `DEPLOY_SSH_KEY`   | Environment secret                 | Private key for the SSH user           |
| `DEPLOY_PATH`      | Repository or environment variable | Defaults to `/opt/voice-agent`         |
| `HEALTH_CHECK_URL` | Repository or environment variable | Optional post-deploy `/api/health` URL |

Rollback to a previous image by exporting the prior immutable tag or digest and running `docker compose up` again:

```bash
cd /opt/voice-agent
export IMAGE_REF=ghcr.io/<owner>/<repo>:sha-<previous-commit>
docker compose --env-file .env.production -f docker-compose.deploy.yml up -d
```

Keep at least the last known-good image tag in deployment notes or release notes. Avoid rolling back only to `latest`, because it may already point at the failed version.

### Health Check Behavior

When `HEALTH_CHECK_URL` is configured, the Deploy workflow waits for the
deployment, retries the URL, and treats HTTP 200 as success. The endpoint may
return `healthy` or `degraded`; both mean the app is serving. Non-200 responses
or network failures fail the health-check job and create a deployment failure
issue with the image reference, digest, run URL, and failed job summary.

## Local Production Testing

Test production builds locally before deploying:

### Using Docker Compose

```bash
# Build, start, and health check
npm run docker:prod

# Access the app
open http://localhost:3001

# Check health directly
npm run docker:health

# Follow logs
npm run docker:logs

# Stop the stack
npm run docker:down
```

### Manual Production Build

```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production node server/index.js

# Access at http://localhost:3001
```

## Environment Configuration

### Required Variables

| Variable      | Description           | Example                     |
| ------------- | --------------------- | --------------------------- |
| `NODE_ENV`    | Environment mode      | `production`                |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://voice.example.com` |
| `SERVER_PORT` | Container server port | `3001`                      |
| `HOST_PORT`   | Local Compose port    | `3001`                      |

### Provider API Keys (at least one required)

| Variable             | Provider   | Notes                       |
| -------------------- | ---------- | --------------------------- |
| `ELEVENLABS_API_KEY` | ElevenLabs | For ElevenLabs SDK provider |
| `XAI_API_KEY`        | xAI Grok   | For xAI Realtime API        |
| `OPENAI_API_KEY`     | OpenAI     | For OpenAI Realtime API     |
| `ULTRAVOX_API_KEY`   | Ultravox   | For Ultravox call creation  |
| `RETELL_API_KEY`     | Retell     | For Retell web call tokens  |
| `GEMINI_API_KEY`     | Gemini     | For Gemini Live API tokens  |

### Frontend Variables (build-time)

| Variable                   | Description         | Example             |
| -------------------------- | ------------------- | ------------------- |
| `VITE_ELEVENLABS_AGENT_ID` | ElevenLabs Agent ID | `agent_xxx`         |
| `VITE_API_BASE_URL`        | Backend API URL     | `/` for same-origin |
| `VITE_ELEVENLABS_ENABLED`  | Enable ElevenLabs   | `true`              |
| `VITE_XAI_ENABLED`         | Enable xAI          | `true`              |
| `VITE_OPENAI_ENABLED`      | Enable OpenAI       | `true`              |
| `VITE_ULTRAVOX_ENABLED`    | Enable Ultravox     | `true`              |
| `VITE_VAPI_ENABLED`        | Enable Vapi         | `true`              |
| `VITE_VAPI_WEB_TOKEN`      | Vapi web token      | `your-token`        |
| `VITE_RETELL_ENABLED`      | Enable Retell       | `true`              |
| `VITE_RETELL_AGENT_ID`     | Retell Agent ID     | `agent_xxx`         |
| `VITE_GEMINI_ENABLED`      | Enable Gemini       | `false`             |
| `VITE_GEMINI_VOICE`        | Gemini voice        | `Zephyr`            |

### Docker Environment Rules

- Server-side provider keys are runtime variables only. Do not add `ELEVENLABS_API_KEY`, `XAI_API_KEY`, `OPENAI_API_KEY`, `ULTRAVOX_API_KEY`, `RETELL_API_KEY`, or `GEMINI_API_KEY` as Docker build args.
- Public `VITE_*` values are compiled into the frontend bundle at image build time.
- For combined Docker production, set `VITE_API_BASE_URL=/` before building.
- For local Vite development on port 8082, use `VITE_API_BASE_URL=http://localhost:3001`.
- For split hosting, set `VITE_API_BASE_URL` to the backend URL and `CORS_ORIGIN` to the frontend origin.

### Health Checks

Run the repeatable verifier after deployment:

```bash
npm run deploy:verify -- --url https://voice.example.com
```

The script checks:

1. The root page returns HTML.
2. `/api/health` returns valid JSON.
3. The health status is `healthy` or intentionally `degraded`.

`/api/health` returns:

| Status      | HTTP | Meaning                                                       |
| ----------- | ---- | ------------------------------------------------------------- |
| `healthy`   | 200  | App is serving and all provider runtime variables are present |
| `degraded`  | 200  | App is serving but one or more providers are not configured   |
| `unhealthy` | 503  | App is not ready to serve production traffic                  |

`degraded` is acceptable when:

- The app is intentionally deployed with only a subset of providers.
- A provider tab is disabled at build time but its runtime key is not set.
- A staging deployment is checking platform readiness before all provider keys are configured.

`degraded` is not acceptable when the production launch expectation is that every enabled provider can connect. In that case, inspect the `providerSummary` and `services` fields in the health response and configure the missing variables.

Docker and Compose health checks use `/api/health`. A container with no provider keys should start and report `degraded`; provider tabs should show their unconfigured states instead of making the container unhealthy. `unhealthy` means the app is not ready, commonly because production static assets are missing or the server cannot serve the app.

### Gemini Live Session Limit

Gemini Live sessions are limited to 15 minutes by the provider/API behavior used by this app. This is not a Docker or reverse-proxy failure. Users should expect the Gemini tab to require a new session after that limit.

### WebSocket Provider Verification

Before testing providers, confirm the browser page is loaded over HTTPS and the backend health endpoint is `healthy` or intentionally `degraded`.

Proxy requirements:

- Preserve `Upgrade` and `Connection` headers for WebSocket traffic.
- Avoid short idle timeouts for voice sessions.
- Use `wss://` provider connections from HTTPS pages.
- Keep token endpoints under `/api/*` on the same origin for combined Docker deployments.

Provider checks:

| Provider | Verification path                                                                               | Expected result                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI   | Open the OpenAI tab, grant microphone permission, start a conversation, then stop it.           | `/api/openai/token` returns an ephemeral token and the browser WebSocket reaches connected state.                                        |
| xAI      | Open the xAI tab, start a conversation, speak one short sentence, then stop it.                 | `/api/xai/token` returns an ephemeral token and the WebSocket remains connected long enough for a response.                              |
| Gemini   | Enable Gemini at build time, open the Gemini tab, start a session, and watch the session timer. | `/api/gemini/token` returns an ephemeral token and the Gemini Live WebSocket connects; session expiration around 15 minutes is expected. |
| Ultravox | Open the Ultravox tab and start a call.                                                         | `/api/ultravox/call` returns a join URL and the Ultravox client connects to the provider WebSocket.                                      |
| Vapi     | Open the Vapi tab with `VITE_VAPI_WEB_TOKEN` built into the frontend and start a call.          | The Vapi SDK starts a WebRTC session; no backend token endpoint is required.                                                             |
| Retell   | Open the Retell tab with `VITE_RETELL_AGENT_ID` built into the frontend and start a call.       | `/api/retell/create-web-call` returns an access token and the Retell client connects through LiveKit.                                    |

If token endpoints fail, check runtime provider secrets and `CORS_ORIGIN`. If token endpoints pass but media does not connect, check HTTPS, microphone permission, provider dashboard configuration, proxy timeouts, and WebSocket/WebRTC support on the host.

### Security Notes

- Never commit `.env` files to version control
- Use Coolify's built-in secrets management
- Rotate API keys periodically
- Restrict CORS to your domain only

## Alternative Platforms

Coolify remains the recommended path because it supports a single full-stack Docker container, HTTPS, reverse proxying, environment management, and persistent WebSocket connections. Use the alternatives below only when the hosting constraints are acceptable.

### Railway

Railway can run the full-stack Docker image from the repository or a container image.

Required settings:

1. Use the root `Dockerfile` or the published GHCR image.
2. Set `SERVER_PORT=3001` and expose that port through Railway.
3. Set `VITE_API_BASE_URL=/` before repository builds.
4. Configure `CORS_ORIGIN` to the Railway domain or custom domain.
5. Verify WebSocket and WebRTC provider behavior after deploy.

### Fly.io

Fly.io can run the combined Docker app close to users, but it requires explicit app and proxy configuration.

Required settings:

1. Use the root `Dockerfile` as the image source.
2. Map the internal service port to `3001`.
3. Configure secrets with `fly secrets set`, keeping provider API keys runtime-only.
4. Use a custom domain with HTTPS for microphone permissions.
5. Confirm proxy idle timeouts are compatible with voice sessions.

### Render

Render Docker services can run the combined app when configured as a web service.

Required settings:

1. Select Docker runtime and the repository root `Dockerfile`.
2. Set `SERVER_PORT=3001` unless Render injects a required port variable.
3. Set all runtime secrets in Render environment variables.
4. Use `VITE_API_BASE_URL=/` for same-origin builds.
5. Test provider connections because platform idle timeouts can interrupt long voice sessions.

### Vercel Frontend With External Backend

Use split hosting only when a frontend-only platform is required.

1. Deploy the Vite frontend to Vercel.
2. Deploy the Express backend to Coolify, Railway, Fly.io, Render, or another Docker host.
3. Build the frontend with `VITE_API_BASE_URL=https://api.voice.example.com`.
4. Set backend `CORS_ORIGIN=https://voice.example.com`.
5. Ensure the backend host supports WebSocket upgrades and long-lived provider connections.
6. Keep provider API keys only on the backend host.

Split hosting increases CORS and proxy complexity. A browser error on token creation usually points to `VITE_API_BASE_URL` or `CORS_ORIGIN`; a failure after token creation usually points to provider credentials, HTTPS, microphone permission, or WebSocket/proxy behavior.

### Traditional VPS

For manual Docker deployment:

```bash
# On your server
docker pull ghcr.io/owner/repo:latest
docker run -d \
  --name voice-agent \
  -p 3001:3001 \
  --env-file /path/to/.env \
  ghcr.io/owner/repo:latest
```

Configure Nginx/Caddy for reverse proxy and SSL.

## Custom Domain, HTTPS, And CORS Checklist

Use one canonical HTTPS origin for the production app, for example `https://voice.example.com`.

DNS and proxy:

- Point the domain to the platform or host with an `A`, `AAAA`, or `CNAME` record as required by the provider.
- Enable HTTPS before testing microphone access.
- Redirect HTTP to HTTPS.
- Forward the public host to container port `3001` or the configured `SERVER_PORT`.
- Preserve `Host`, `X-Forwarded-Proto`, and WebSocket upgrade headers in any custom proxy.

Same-origin Docker deployment:

```bash
VITE_API_BASE_URL=/
CORS_ORIGIN=https://voice.example.com
```

Split frontend/backend deployment:

```bash
VITE_API_BASE_URL=https://api.voice.example.com
CORS_ORIGIN=https://voice.example.com
```

Production CORS rules:

- Do not use `*` for `CORS_ORIGIN` in production.
- Do not reuse demo-mode ngrok origins in production.
- Configure exactly one browser-facing origin unless the deployment intentionally supports multiple domains.
- Rebuild the frontend image when changing `VITE_API_BASE_URL`.
- Restart the backend container when changing `CORS_ORIGIN`.

Browser microphone access requires HTTPS on public domains. `http://localhost` is allowed for local development, but production domains must use HTTPS.

## SSL/HTTPS Setup

### Why HTTPS is Required

- **Microphone Access**: Browsers require HTTPS for `getUserMedia()`
- **WebSocket Security**: Secure WebSocket (wss://) connections
- **Security**: Protects API keys and user data

### Coolify (Automatic)

Coolify handles SSL automatically via Let's Encrypt when you:

1. Add a custom domain
2. Enable "Generate SSL Certificate"
3. Wait for DNS propagation

### Manual (Certbot)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

## Troubleshooting

### Build Failures

```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker build --no-cache -t voice-agent .
```

### WebSocket Connection Issues

1. Verify Coolify/proxy supports WebSocket upgrades
2. Check CORS configuration matches frontend URL
3. Ensure backend is accessible from frontend

### Microphone Not Working

1. Verify HTTPS is properly configured
2. Check browser permissions
3. Test in incognito mode (no cached permissions)

### Health Check Failures

```bash
# Test health endpoint
curl -f https://your-domain.com/api/health

# Check container logs
docker logs voice-agent
```

If `/api/health` returns `degraded`, the app is serving but one or more provider variables are missing. Check the `providerSummary` and `services` fields in the response.

### Environment Variable Issues

```bash
# Verify variables in container
docker exec voice-agent printenv | grep -E 'API|CORS|NODE'
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm run test:run`)
- [ ] Production build works locally (`npm run build && npm run preview`)
- [ ] Docker build completes successfully
- [ ] Docker image is under 325 MB decimal or variance is justified
- [ ] Environment variables documented
- [ ] Required GitHub branch protection checks are configured

### Deployment

- [ ] Environment variables configured in Coolify
- [ ] GitHub deployment variables and secrets configured when using the Deploy workflow
- [ ] Domain/DNS configured
- [ ] SSL certificate generated
- [ ] Health check passing
- [ ] `/api/health` is `healthy` or intentionally `degraded`

### Post-Deployment

- [ ] Frontend loads correctly
- [ ] All voice providers connect
- [ ] WebSocket connections stable
- [ ] Microphone permissions working
- [ ] Mobile testing complete

---

## Support

For deployment issues:

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [Coolify Documentation](https://coolify.io/docs)
- Open GitHub issue with deployment logs

---

**Last Updated**: 2026-05-11
