# Session: Coolify Deployment Bundle

**Phase**: 04 - Deployment & New Providers
**Session**: 01
**Status**: Pending
**Estimated Tasks**: 15-18

---

## Objective

Create Docker-based deployment infrastructure for self-hosted Coolify platform, enabling production deployment with the same developer experience as local development.

---

## Context

### Why Coolify?

- **Full-stack support**: Handles both static frontend and Node.js backend
- **WebSocket compatible**: Proper proxy support for realtime voice APIs
- **Self-hosted**: Control over infrastructure, no vendor lock-in
- **Docker-based**: Consistent dev/prod parity
- **Automatic SSL**: Let's Encrypt integration for HTTPS (required for microphone)

### Why NOT Vercel/Netlify?

- Optimized for serverless/edge functions, not persistent WebSocket connections
- Would require separate backend hosting (Render, Railway, etc.)
- More complex deployment for full-stack applications
- Environment variable management split across platforms

---

## Deliverables

### 1. Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app
# Copy backend
COPY --from=backend-builder /app/server ./server
COPY server/*.js ./server/
# Copy frontend build
COPY --from=frontend-builder /app/dist ./dist
# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O /dev/null http://localhost:3001/api/health || exit 1
EXPOSE 3001
CMD ["node", "server/index.js"]
```

### 2. docker-compose.yml (Local Testing)

```yaml
version: '3.8'

services:
  voice-agent:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - XAI_API_KEY=${XAI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CORS_ORIGIN=http://localhost:3001
    volumes:
      - ./dist:/app/dist:ro
    healthcheck:
      test: ['CMD', 'wget', '-q', '-O', '/dev/null', 'http://localhost:3001/api/health']
      interval: 30s
      timeout: 3s
      retries: 3
```

### 3. Server Static File Serving

Update `server/index.js` to serve frontend in production:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}
```

### 4. Environment Variables Documentation

| Variable             | Required | Description                 | Example                     |
| -------------------- | -------- | --------------------------- | --------------------------- |
| `NODE_ENV`           | Yes      | Environment mode            | `production`                |
| `ELEVENLABS_API_KEY` | Yes\*    | ElevenLabs API key          | `sk_xxx`                    |
| `XAI_API_KEY`        | Yes\*    | xAI API key                 | `xai-xxx`                   |
| `OPENAI_API_KEY`     | Yes\*    | OpenAI API key              | `sk-xxx`                    |
| `CORS_ORIGIN`        | Yes      | Frontend URL for CORS       | `https://voice.example.com` |
| `PORT`               | No       | Server port (default: 3001) | `3001`                      |

\*At least one provider API key required

### 5. Coolify Configuration Guide

Document Coolify setup steps:

- Repository connection
- Environment variables via Coolify secrets
- Domain/SSL configuration
- Health check setup
- Deployment triggers

---

## Technical Specifications

### Docker Image Requirements

- Base: `node:20-alpine` (small footprint)
- Multi-stage build (reduce final image size)
- Non-root user for security
- Health check endpoint integration
- Production dependencies only

### Static File Serving

- Express serves `/dist` in production
- SPA fallback for client-side routing
- Gzip compression enabled
- Cache headers for static assets

### Networking

- Single container serves both frontend and API
- Internal networking via localhost
- Coolify proxy handles SSL termination
- WebSocket upgrade headers preserved

---

## Acceptance Criteria

- [ ] `docker build` creates working image under 200MB
- [ ] `docker-compose up` starts application locally
- [ ] Health endpoint returns 200 at `/api/health`
- [ ] Frontend loads and displays correctly
- [ ] All three voice providers connect successfully
- [ ] WebSocket connections work through Docker
- [ ] Environment variables properly injected
- [ ] Coolify deployment guide documented

---

## Dependencies

- Express.js backend (existing)
- Vite production build (existing)
- Health endpoint (existing at `/api/health`)

---

## Risks & Mitigations

| Risk                     | Mitigation                        |
| ------------------------ | --------------------------------- |
| Large Docker image       | Multi-stage build, alpine base    |
| WebSocket proxy issues   | Test with Coolify's Traefik proxy |
| Audio latency            | Performance testing in container  |
| Build cache invalidation | Layer ordering optimization       |
