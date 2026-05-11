# Environments

## Environment Overview

| Environment | URL                   | Purpose           |
| ----------- | --------------------- | ----------------- |
| Development | http://localhost:8082 | Local development |
| Backend Dev | http://localhost:3001 | Local API server  |
| Production  | Your deployed URL     | Live system       |

## Configuration Differences

| Config        | Development | Production                |
| ------------- | ----------- | ------------------------- |
| HTTPS         | Optional    | Required (for microphone) |
| API Keys      | `.env` file | Environment variables     |
| Debug Logging | Enabled     | Disabled                  |
| Source Maps   | Enabled     | Disabled                  |
| Bundle        | Unminified  | Minified + tree-shaken    |

## Environment Variables

### Client-Side Variables (VITE\_ prefix)

These are embedded in the build and visible to users.

| Variable                                      | Dev Default             | Description                        |
| --------------------------------------------- | ----------------------- | ---------------------------------- |
| `VITE_ELEVENLABS_ENABLED`                     | `true`                  | Show ElevenLabs tab                |
| `VITE_ELEVENLABS_SDK_ENABLED`                 | `true`                  | Show ElevenLabs SDK tab            |
| `VITE_XAI_ENABLED`                            | `true`                  | Show xAI tab                       |
| `VITE_OPENAI_ENABLED`                         | `true`                  | Show OpenAI tab                    |
| `VITE_OPENAI_TRANSLATION_ENABLED`             | `false`                 | Show OpenAI Translation tab        |
| `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES` | `30`                    | OpenAI Translation auto-stop guard |
| `VITE_ULTRAVOX_ENABLED`                       | `true`                  | Show Ultravox tab                  |
| `VITE_VAPI_ENABLED`                           | `true`                  | Show Vapi tab                      |
| `VITE_VAPI_WEB_TOKEN`                         | -                       | Vapi public web token              |
| `VITE_VAPI_ASSISTANT_ID`                      | -                       | Vapi assistant ID (opt.)           |
| `VITE_VAPI_VOICE`                             | `paula`                 | Vapi voice selection               |
| `VITE_RETELL_ENABLED`                         | `true`                  | Show Retell tab                    |
| `VITE_RETELL_AGENT_ID`                        | -                       | Retell Agent ID                    |
| `VITE_GEMINI_ENABLED`                         | `false`                 | Show Gemini tab                    |
| `VITE_GEMINI_VOICE`                           | `Zephyr`                | Gemini voice selection             |
| `VITE_DEFAULT_PROVIDER`                       | `elevenlabs`            | Default active tab                 |
| `VITE_ELEVENLABS_AGENT_ID`                    | -                       | ElevenLabs agent ID                |
| `VITE_XAI_VOICE`                              | `Ara`                   | xAI voice selection                |
| `VITE_OPENAI_VOICE`                           | `alloy`                 | OpenAI voice selection             |
| `VITE_ULTRAVOX_VOICE`                         | `Mark`                  | Ultravox voice selection           |
| `VITE_API_BASE_URL`                           | `http://localhost:3001` | Backend API URL                    |
| `VITE_NODE_ENV`                               | `development`           | Environment flag                   |

### Server-Side Variables (No prefix)

These are secure and never sent to the browser.

| Variable             | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for signed URLs                         |
| `XAI_API_KEY`        | xAI API key for ephemeral tokens                           |
| `OPENAI_API_KEY`     | OpenAI API key for Realtime and translation client secrets |
| `ULTRAVOX_API_KEY`   | Ultravox API key for call creation                         |
| `RETELL_API_KEY`     | Retell API key for web call tokens                         |
| `GEMINI_API_KEY`     | Gemini API key for Live API tokens                         |
| `SERVER_PORT`        | Backend server port (default: 3001)                        |
| `CORS_ORIGIN`        | Allowed CORS origin                                        |

OpenAI Translation uses both groups:

- `VITE_OPENAI_TRANSLATION_ENABLED` and
  `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES` are public frontend build-time
  values. Restart Vite in development after changing them. Rebuild production
  bundles or images after changing them.
- `OPENAI_API_KEY` is a server runtime secret used by
  `POST /api/openai/translation-session` to mint short-lived browser
  credentials. Never expose it as a `VITE_*` variable, Docker build argument,
  runtime config file, or frontend source value.
- Use `VITE_API_BASE_URL=http://localhost:3001` for split local dev and
  `VITE_API_BASE_URL=/` for combined production or demo mode.

See the [OpenAI Translation Demo Guide](./OPENAI_TRANSLATION_DEMO.md) for full
local, production, Docker, and ngrok run steps.

## Development Setup

```bash
# Copy example environment
cp .env.example .env

# Edit with your values
nano .env

# Start development
npm run dev:all
```

## Runtime Config Stub

`public/config.js` is generated and ignored by git. In local mode it should be a
no-op stub that prevents `/config.js` 404s and avoids stale demo-mode runtime
configuration. Demo and ngrok flows may overwrite it with runtime URLs.

Direct npm lifecycle hooks create the local stub when missing:

- `predev`
- `prebuild`
- `prebuild:dev`
- `prepreview`

The stub is safe to delete locally; `npm run dev`, `npm run build`, `npm run
build:dev`, and `npm run preview` recreate it. If demo mode leaves stale runtime
URLs behind, run:

```bash
./scripts/reset-dev-mode.sh
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

For OpenAI Translation Docker builds, pass public `VITE_*` values during the
frontend image build and inject `OPENAI_API_KEY` only when the container starts:

```bash
VITE_OPENAI_TRANSLATION_ENABLED=true
VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
VITE_API_BASE_URL=/
OPENAI_API_KEY=sk-your_openai_api_key_here
```

Changing the translation feature flag or max-session value requires a frontend
rebuild. Changing `OPENAI_API_KEY` requires only a server/container restart.

## Security Notes

1. **Never commit `.env`** - it's in `.gitignore`
2. **Server-side keys** should never have `VITE_` prefix
3. **Rotate API keys** regularly in production
4. **Use secrets management** (Vercel secrets, AWS Secrets Manager, etc.)
5. **Keep OpenAI Translation secrets server-side** - only the backend should
   read `OPENAI_API_KEY`

## Switching Environments

The application detects environment from `VITE_NODE_ENV`:

```typescript
const isDev = import.meta.env.VITE_NODE_ENV === 'development';
```

Behavior differences:

- Development: More verbose logging, relaxed CORS
- Production: Strict security headers, minified output
