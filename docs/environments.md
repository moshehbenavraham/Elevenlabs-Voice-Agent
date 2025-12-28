# Environments

## Environment Overview

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | http://localhost:8082 | Local development |
| Backend Dev | http://localhost:3001 | Local API server |
| Production | Your deployed URL | Live system |

## Configuration Differences

| Config | Development | Production |
|--------|-------------|------------|
| HTTPS | Optional | Required (for microphone) |
| API Keys | `.env` file | Environment variables |
| Debug Logging | Enabled | Disabled |
| Source Maps | Enabled | Disabled |
| Bundle | Unminified | Minified + tree-shaken |

## Environment Variables

### Client-Side Variables (VITE_ prefix)

These are embedded in the build and visible to users.

| Variable | Dev Default | Description |
|----------|-------------|-------------|
| `VITE_ELEVENLABS_ENABLED` | `true` | Show ElevenLabs tab |
| `VITE_XAI_ENABLED` | `true` | Show xAI tab |
| `VITE_DEFAULT_PROVIDER` | `elevenlabs` | Default active tab |
| `VITE_ELEVENLABS_AGENT_ID` | - | ElevenLabs agent ID |
| `VITE_VOICE_CONNECTION_MODE` | `agent-sdk` | SDK or widget mode |
| `VITE_XAI_VOICE` | `verse` | xAI voice selection |
| `VITE_API_BASE_URL` | `http://localhost:3001` | Backend API URL |
| `VITE_NODE_ENV` | `development` | Environment flag |

### Server-Side Variables (No prefix)

These are secure and never sent to the browser.

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key for signed URLs |
| `XAI_API_KEY` | xAI API key for ephemeral tokens |
| `SERVER_PORT` | Backend server port (default: 3001) |
| `CORS_ORIGIN` | Allowed CORS origin |

## Development Setup

```bash
# Copy example environment
cp .env.example .env

# Edit with your values
nano .env

# Start development
npm run dev:all
```

## Production Setup

### Vercel

Set environment variables in Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add each variable with appropriate scope (Production/Preview)

### Netlify

Set in Netlify dashboard:
1. Site Settings > Build & Deploy > Environment
2. Add environment variables

### Docker

```dockerfile
ENV VITE_ELEVENLABS_AGENT_ID=your_agent_id
ENV VITE_XAI_ENABLED=true
ENV ELEVENLABS_API_KEY=sk_...
ENV XAI_API_KEY=xai-...
```

## Security Notes

1. **Never commit `.env`** - it's in `.gitignore`
2. **Server-side keys** should never have `VITE_` prefix
3. **Rotate API keys** regularly in production
4. **Use secrets management** (Vercel secrets, AWS Secrets Manager, etc.)

## Switching Environments

The application detects environment from `VITE_NODE_ENV`:

```typescript
const isDev = import.meta.env.VITE_NODE_ENV === 'development';
```

Behavior differences:
- Development: More verbose logging, relaxed CORS
- Production: Strict security headers, minified output
