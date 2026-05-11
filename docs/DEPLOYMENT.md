# Deployment Guide

This guide covers deploying Voice-Agent-PuPuPlatter to production. The recommended platform is **Coolify** (self-hosted), with alternative options for other deployment scenarios.

## Quick Deploy (Coolify)

```bash
# Copy and configure environment
cp .env.example .env

# For combined same-origin Docker production
# set VITE_API_BASE_URL=/ before building.

# Test locally
npm run docker:prod

# Push to Coolify via Git integration
git push origin main
```

## Table of Contents

- [Deployment Philosophy](#deployment-philosophy)
- [Coolify Deployment (Recommended)](#coolify-deployment-recommended)
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
- Custom domain (optional but recommended for HTTPS)

### Step 1: Prepare Repository

Ensure your repository has:

- `Dockerfile` (multi-stage build)
- `docker-compose.yml` (for local testing)
- `.env.example` (document required variables)

### Step 2: Connect to Coolify

1. Log into Coolify dashboard
2. Add new application -> Select "Docker"
3. Connect your Git repository
4. Select branch (usually `main`)

### Step 3: Configure Environment Variables

In Coolify's environment configuration:

```bash
# Required - Node environment
NODE_ENV=production

# Required - At least one provider
ELEVENLABS_API_KEY=sk_your_key_here

# Optional - Additional providers
XAI_API_KEY=xai-your_key_here
OPENAI_API_KEY=sk-your_key_here
ULTRAVOX_API_KEY=your_ultravox_key_here
RETELL_API_KEY=key_your_retell_key_here
GEMINI_API_KEY=your_gemini_key_here

# Required - CORS configuration
CORS_ORIGIN=https://your-domain.com

# Optional - Server port (default: 3001)
SERVER_PORT=3001
```

### Step 4: Configure Domain & SSL

1. Add custom domain in Coolify
2. Configure DNS (A record pointing to Coolify server)
3. Enable automatic SSL (Let's Encrypt)
4. Verify HTTPS is working (required for microphone access)

### Step 5: Deploy

1. Click "Deploy" or push to your connected branch
2. Monitor build logs in Coolify dashboard
3. Verify health endpoint: `https://your-domain.com/api/health`
4. Test voice connection in browser

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

`/api/health` returns:

| Status      | HTTP | Meaning                                                       |
| ----------- | ---- | ------------------------------------------------------------- |
| `healthy`   | 200  | App is serving and all provider runtime variables are present |
| `degraded`  | 200  | App is serving but one or more providers are not configured   |
| `unhealthy` | 503  | App is not ready to serve production traffic                  |

Docker and Compose health checks use `/api/health`. A container with no provider keys should start and report `degraded`; provider tabs should show their unconfigured states instead of making the container unhealthy.

### Gemini Live Session Limit

Gemini Live sessions are limited to 15 minutes by the provider/API behavior used by this app. This is not a Docker or reverse-proxy failure. Users should expect the Gemini tab to require a new session after that limit.

### Security Notes

- Never commit `.env` files to version control
- Use Coolify's built-in secrets management
- Rotate API keys periodically
- Restrict CORS to your domain only

## Alternative Platforms

### Railway / Render

Full-stack platforms with Docker support:

1. Connect Git repository
2. Configure environment variables
3. Set build command: `docker build`
4. Deploy

### Vercel + External Backend

If you must use Vercel for frontend:

1. Deploy frontend to Vercel
2. Deploy backend to Railway/Render/Fly.io
3. Configure `VITE_API_BASE_URL` to point to backend
4. Handle CORS between services

### Traditional VPS

For manual Docker deployment:

```bash
# On your server
docker pull your-registry/voice-agent:latest
docker run -d \
  --name voice-agent \
  -p 3001:3001 \
  --env-file /path/to/.env \
  your-registry/voice-agent:latest
```

Configure Nginx/Caddy for reverse proxy and SSL.

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

### Deployment

- [ ] Environment variables configured in Coolify
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

**Last Updated**: 2025-12-31
