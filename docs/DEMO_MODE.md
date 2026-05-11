# Demo Mode Documentation

Demo mode enables secure public access to your local Voice-Agent-PuPuPlatter development environment through ngrok tunnels. This is ideal for client demos, mobile testing, team collaboration, and showing work to stakeholders.

## Quick Start

```bash
# 1. Install ngrok (if not already installed)
./scripts/ngrok/install-instructions.sh

# 2. Configure ngrok authentication
ngrok config add-authtoken YOUR_AUTH_TOKEN

# 3. Start demo mode
npm run demo
```

The demo command starts:

- Production build of frontend (into `dist/`)
- Express server in production mode (serves frontend + API on port 3001)
- Single ngrok tunnel to port 3001
- Runtime config (`dist/config.js`) for same-origin API calls

## Prerequisites

### Required

1. **Node.js 18+** and npm (or Bun)
2. **ngrok CLI** installed and authenticated
3. **jq** for JSON parsing (install: `sudo apt install jq` or `brew install jq`)
4. **Voice provider credentials** configured in `.env`

### Install ngrok

Run the platform-specific installation script:

```bash
./scripts/ngrok/install-instructions.sh
```

This displays instructions for:

- **Linux**: apt, snap, or direct download
- **macOS**: Homebrew or direct download
- **Windows/WSL**: winget, Chocolatey, or direct download

After installation, authenticate ngrok:

```bash
# Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Verify installation:

```bash
./scripts/ngrok/detect-ngrok.sh
```

## Environment Variables

Demo mode uses these environment variables (set in `.env`):

### Required

| Variable          | Description                | Example      |
| ----------------- | -------------------------- | ------------ |
| `NGROK_AUTHTOKEN` | ngrok authentication token | `2abc123...` |

### Optional

| Variable               | Description                | Default          |
| ---------------------- | -------------------------- | ---------------- |
| `NGROK_DOMAIN`         | Custom domain (paid plans) | Random subdomain |
| `NGROK_AUTH_USER`      | Basic auth username        | None             |
| `NGROK_AUTH_PASS`      | Basic auth password        | None             |
| `NGROK_INSPECTOR_PORT` | ngrok web inspector port   | `4041`           |
| `NGROK_API_KEY`        | ngrok API key              | None             |

### Example Configuration

```bash
# .env file

# Required
NGROK_AUTHTOKEN=2abc123def456ghi789

# Optional - Custom domain (paid plans only)
NGROK_DOMAIN=myvoiceapp.ngrok.dev

# Optional - Password protection for demos
NGROK_AUTH_USER=demo
NGROK_AUTH_PASS=secretpass123

# Optional - Custom inspector port
NGROK_INSPECTOR_PORT=4041
```

## How Demo Mode Works

### Architecture

Demo mode uses a **single-tunnel production architecture**. Express serves both the frontend (from `dist/`) and API routes from port 3001. This eliminates CORS issues and allows basic auth to work properly.

```
+-------------------------------------------------------------+
|                        Internet                              |
+-------------------------------------------------------------+
|              +---------------------------+                   |
|              |     ngrok Tunnel          |                   |
|              |  https://xxx.ngrok-free   |                   |
|              +-------------+-------------+                   |
+----------------------------|--------------------------------+
                             |
                             v
+-------------------------------------------------------------+
|                    Local Machine                             |
|              +---------------------------+                   |
|              |    Express Server         |                   |
|              |    localhost:3001         |                   |
|              |                           |                   |
|              |  /api/*  -> API routes     |                   |
|              |  /*      -> dist/ (static) |                   |
|              +---------------------------+                   |
+-------------------------------------------------------------+
```

### Startup Sequence

1. **Port Check**: Verifies ports 3001 and 4041 are available
2. **ngrok Detection**: Confirms ngrok is installed and authenticated
3. **Build Frontend**: Runs `npm run build` to create `dist/`
4. **Start Tunnel**: Creates single ngrok tunnel to port 3001
5. **Generate Config**: Creates `dist/config.js` for same-origin API calls
6. **Start Server**: Launches Express in production mode (serves dist/ + API)
7. **Display Demo Card**: Shows shareable URL

### Generated Files

Demo mode creates one ephemeral config file in the production build output
(deleted on normal shutdown):

**`dist/config.js`**

```javascript
window.__DEMO_CONFIG__ = {
  apiBaseUrl: '', // Empty = same-origin (relative paths)
  frontendUrl: '',
  isDemoMode: true,
  generatedAt: '2024-...',
};
```

> **Note**: The empty `apiBaseUrl` means API calls use relative paths (e.g., `/api/token`), which works because frontend and API are served from the same origin.

The local development stub lives at `public/config.js`. It is generated by npm
lifecycle hooks and should be a no-op outside demo flows. Older ngrok helper
flows may also generate `server/.env.demo` and `scripts/ngrok/ngrok.yml`; run
`./scripts/reset-dev-mode.sh` if either file remains after switching back to
local development.

### Local vs Demo Mode

| Aspect       | Local development                         | Demo mode                              |
| ------------ | ----------------------------------------- | -------------------------------------- |
| Frontend     | Vite HMR on port 8082                     | Static files from `dist/`              |
| Backend      | Express on port 3001                      | Express on port 3001                   |
| Tunnel       | None                                      | Single ngrok tunnel to port 3001       |
| CORS         | Cross-origin local frontend/backend       | Same-origin requests                   |
| API base URL | `VITE_API_BASE_URL` or localhost fallback | Empty runtime value for relative paths |
| Config file  | `public/config.js` local stub             | `dist/config.js` demo config           |

## Usage

### Start Demo Mode

```bash
npm run demo
```

This displays a demo card with the connection URL:

```
+============================================================+
|                                                            |
|  Voice-Agent-PuPuPlatter                                   |
|  Demo Mode Active                                          |
|                                                            |
+============================================================+
|  DEMO URL                                                  |
+============================================================+
|                                                            |
|  https://abc123.ngrok-free.app                             |
|                                                            |
+============================================================+
|  LOCAL URL (your machine only)                             |
+============================================================+
|                                                            |
|  http://localhost:3001                                     |
|                                                            |
+============================================================+
|  QUICK START                                               |
+============================================================+
|                                                            |
|  1. Open the Demo URL in your browser                      |
|  2. Click the microphone button to start                   |
|  3. Speak to interact with the voice agent                 |
|                                                            |
|  Press Ctrl+C to stop the demo                             |
|                                                            |
+============================================================+
```

### Stop Demo Mode

Press `Ctrl+C` to gracefully shut down all services:

1. Stops Express server
2. Stops ngrok tunnel
3. Removes `dist/config.js`

### Share Demo URL

Copy the Demo URL from the demo card and share it with:

- Clients for live demos
- Team members for testing
- Mobile devices for cross-device testing

## Provider-Specific Notes

### Providers That Work in Demo Mode

| Provider           | Works in Demo | Notes                                        |
| ------------------ | ------------- | -------------------------------------------- |
| ElevenLabs Widget  | Yes           | No changes needed                            |
| ElevenLabs SDK     | Yes           | No changes needed                            |
| OpenAI Realtime    | Yes           | Backend generates ephemeral tokens           |
| OpenAI Translation | Yes           | Backend generates translation client secrets |
| xAI Grok           | Yes           | Backend generates ephemeral tokens           |
| Ultravox           | Yes           | Backend creates call with joinUrl            |
| Vapi               | Yes           | Frontend-only, uses public web token         |
| Retell             | Yes           | Backend generates access tokens              |
| Gemini Live        | Yes           | Backend generates ephemeral tokens           |

### Provider Configuration for Demo

All providers work through ngrok tunnels. The key is that:

1. **Frontend-only providers** (ElevenLabs, Vapi) work immediately
2. **Backend-required providers** (OpenAI, xAI, Ultravox, Retell, Gemini) need:
   - API keys set in `.env`
   - Backend running with correct CORS (handled automatically)

### HTTPS Requirement

All voice providers require HTTPS for microphone access. ngrok tunnels provide HTTPS automatically, solving the localhost HTTPS limitation.

### OpenAI Translation Demo Checks

OpenAI Translation uses the same single-tunnel demo architecture as the rest of
the app. Express serves the built frontend and `/api/*` routes on port 3001, so
the browser calls `POST /api/openai/translation-session` through the same ngrok
origin. Do not configure a second backend tunnel for translation demos.
For the full runbook, see the
[OpenAI Translation Demo Guide](./OPENAI_TRANSLATION_DEMO.md).

Before starting a shared translation demo:

1. Set `OPENAI_API_KEY` in `.env` for the server runtime.
2. Set `VITE_OPENAI_TRANSLATION_ENABLED=true` before `npm run demo` builds the
   frontend.
3. Optionally set `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30` or a shorter
   demo-specific value.
4. Keep `VITE_API_BASE_URL=/` or allow demo mode to generate an empty runtime
   API base URL for same-origin requests.
5. Start demo mode with `npm run demo`.

For recipients:

- If ngrok shows an interstitial page, they must click through before the app
  can request microphone or tab permissions.
- If `NGROK_AUTH_USER` and `NGROK_AUTH_PASS` are set, they must authenticate
  before browser media permission prompts appear.
- Start with `Microphone` to confirm media capture and translation startup.
- Use `Tab audio` only in browsers that support tab capture, and choose a tab
  that is actively playing audio with audio sharing enabled.
- If a selected tab/window/screen exposes no audio track, the app reports the
  no-audio-track state; choose a browser tab with share audio enabled or fall
  back to microphone.

For live OpenAI checks, confirm the usage budget before clicking Start. The
browser receives only short-lived translation credentials; the server-side
`OPENAI_API_KEY` must never be exposed as a `VITE_*` value or browser config.

## Troubleshooting

### ngrok Not Found

```
[ERROR] ngrok CLI not found in PATH
```

**Solution**: Install ngrok using the installation script:

```bash
./scripts/ngrok/install-instructions.sh
```

### ngrok Not Authenticated

```
[WARN] ngrok may not be authenticated
```

**Solution**: Add your auth token:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Port Already in Use

```
[ERROR] Port 8082 is already in use (frontend)
```

**Solution**: Find and stop the process using the port:

```bash
# Find process
lsof -i :8082

# Kill process (replace PID with actual process ID)
kill PID
```

### jq Not Installed

```
[ERROR] jq is required but not installed
```

**Solution**: Install jq:

```bash
# Debian/Ubuntu
sudo apt install jq

# macOS
brew install jq

# Windows (with Chocolatey)
choco install jq
```

### CORS Errors in Browser

```
Access to fetch at 'https://xxx.ngrok-free.app' has been blocked by CORS
```

**Solution**: This usually means the backend didn't start with the correct CORS config. Restart demo mode:

```bash
# Stop with Ctrl+C, then restart
npm run demo
```

### Connection Failed

```
[ERROR] Failed to connect to ngrok API
```

**Solution**: Ensure ngrok is running and the inspector port is correct:

```bash
# Check if ngrok is running
curl http://localhost:4041/api/tunnels

# If using custom port, set it in .env
NGROK_INSPECTOR_PORT=4041
```

### Free Tier Limitations

ngrok free tier has these limitations:

- Random subdomain on each restart
- Interstitial page for first-time visitors
- Rate limits on connections

**Workarounds**:

- Upgrade to paid plan for custom domains
- Use the same ngrok session for extended demos
- Warn demo recipients about the interstitial page

### Mobile Browser Issues

If voice doesn't work on mobile:

1. **iOS Safari**: May require user gesture to start audio
2. **Chrome Android**: Works with HTTPS (provided by ngrok)
3. **All browsers**: Ensure microphone permission is granted

## Scripts Reference

### Main Scripts

| Script            | Description               |
| ----------------- | ------------------------- |
| `npm run demo`    | Start complete demo mode  |
| `scripts/demo.sh` | Main orchestration script |

### Helper Scripts

| Script                                  | Description                    |
| --------------------------------------- | ------------------------------ |
| `scripts/ngrok/detect-ngrok.sh`         | Check ngrok installation       |
| `scripts/ngrok/install-instructions.sh` | Show installation instructions |
| `scripts/ngrok/start-tunnels.sh`        | Start ngrok tunnels            |
| `scripts/ngrok/configure-urls.sh`       | Generate runtime configs       |
| `scripts/ngrok/demo-card.sh`            | Generate demo card output      |
| `scripts/ngrok/output-formatter.sh`     | Terminal formatting library    |
| `scripts/ngrok/validate-cors.sh`        | Validate CORS configuration    |
| `scripts/ngrok/wait-for-tunnels.sh`     | Wait for tunnel establishment  |

### Configuration Files

| File                        | Description                 |
| --------------------------- | --------------------------- |
| `scripts/ngrok/ngrok.yml`   | ngrok tunnel configuration  |
| `public/config.template.js` | Template for runtime config |

## Security Considerations

### API Keys

- Never commit `.env` files to git
- Backend API keys stay server-side
- ngrok tunnels use HTTPS encryption

### Basic Auth Protection

For sensitive demos, enable basic auth:

```bash
# In .env
NGROK_AUTH_USER=demo
NGROK_AUTH_PASS=your-secure-password
```

This adds a username/password prompt before accessing the tunnel.

### Session Security

- Demo mode generates ephemeral tokens for voice providers
- Tokens expire quickly (60s for OpenAI, per-call for others)
- ngrok sessions can be monitored at http://localhost:4041

## Cleanup

Demo mode automatically cleans up on shutdown:

- Stops Express server and ngrok tunnel
- Removes `dist/config.js`

Manual cleanup (if needed):

```bash
# Use the reset script (recommended)
./scripts/reset-dev-mode.sh

# Or manually:
rm -f dist/config.js public/config.js server/.env.demo
pkill -f "ngrok"
pkill -f "node.*server"
```

See [Development Guide](./development.md#mode-switching-local-vs-demo) for
mode switching procedures and API URL coding rules.

## FAQ

### Can I run demo mode in production?

No, demo mode is for development only. For production, deploy to a proper hosting platform (see [DEPLOYMENT.md](./DEPLOYMENT.md)).

### Can multiple people use the same demo URL?

Yes, ngrok URLs are publicly accessible. Multiple users can connect simultaneously.

### How long do ngrok URLs last?

- **Free tier**: URLs change on each restart
- **Paid tier**: Custom domains persist

### Can I use demo mode with Docker?

Not directly. Demo mode runs local processes. For Docker-based demos, configure ngrok separately.

### Why does the first visit show an ngrok page?

Free tier ngrok shows an interstitial page on first visit. Click "Visit Site" to continue. Paid plans skip this page.
