# OpenAI Translation Demo Guide

This guide is the maintainer entry point for enabling, running, and checking
the OpenAI Translation tab in local development, production-like Docker runs,
and ngrok demo mode.

OpenAI Translation is separate from the OpenAI Realtime voice-agent provider.
The voice provider uses `POST /api/openai/session` and a WebSocket
conversation. OpenAI Translation uses `POST /api/openai/translation-session`,
server-minted browser credentials, WebRTC translation calls, translated audio
playback, current-session transcript rows, and Markdown export.

For repeatable pre-demo or release checks, use the maintained
[OpenAI Translation Evaluation Workflow](./ongoing-projects/translation-evaluation.md).
It defines non-sensitive golden scripts, fixture metadata, latency checkpoints,
manual review rubrics, and private local-media guardrails.

## Prerequisites

- Install project dependencies with `npm install`.
- Keep provider secrets in `.env`, never in committed files.
- Use a modern browser with microphone support for local checks.
- Use HTTPS or localhost for media capture. ngrok demo URLs satisfy this
  browser requirement.
- Do not run live OpenAI checks without an account and usage budget approved
  for the demo.

## Configuration

### Required Server Secret

Set `OPENAI_API_KEY` only in the backend/server runtime environment:

```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
```

The browser must never receive this key. Do not create `VITE_OPENAI_API_KEY`,
do not add the key to `dist/config.js`, and do not pass it as a Docker build
argument. The Express route in `server/routes/openai.js` reads
`OPENAI_API_KEY`, calls OpenAI's translation client-secret endpoint, and
returns only browser-safe fields to the frontend.

### Frontend Build-Time Flags

Set the translation tab visibility flag before starting Vite or building the
frontend:

```bash
VITE_OPENAI_TRANSLATION_ENABLED=true
```

This is a build-time frontend setting. If you change it after a production
bundle has already been built, rebuild the frontend image or rerun the demo
startup so the browser receives the updated value.

The normal OpenAI voice tab is controlled separately:

```bash
VITE_OPENAI_ENABLED=true
```

OpenAI Translation does not require the normal OpenAI voice tab to be active,
but keeping both enabled is useful when checking provider-tab navigation.

### API Base URL

For split local development, the frontend usually calls the Express backend on
port 3001:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

For combined Docker production and ngrok demo mode, prefer same-origin API
calls:

```bash
VITE_API_BASE_URL=/
```

Demo mode writes a temporary `dist/config.js` with an empty runtime API base
URL, so browser calls use relative paths such as
`/api/openai/translation-session`. This works because Express serves both the
frontend and `/api/*` routes behind the same ngrok origin.

### Max-Session Guard

The optional frontend guard controls automatic stop timing:

```bash
VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
```

If omitted, zero, negative, or invalid, the app uses the 30-minute default.
Values above the hard maximum are capped to 120 minutes. This setting is also
compiled into the frontend bundle, so production changes require a rebuild.

### Minimal Local `.env`

```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
VITE_OPENAI_TRANSLATION_ENABLED=true
VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
VITE_API_BASE_URL=http://localhost:3001
```

### Minimal Same-Origin Production or Demo Settings

```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
VITE_OPENAI_TRANSLATION_ENABLED=true
VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
VITE_API_BASE_URL=/
```

## Local Development Check

1. Copy the template and set the translation variables:

   ```bash
   cp .env.example .env
   ```

   ```bash
   OPENAI_API_KEY=sk-your_openai_api_key_here
   VITE_OPENAI_TRANSLATION_ENABLED=true
   VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
   VITE_API_BASE_URL=http://localhost:3001
   ```

2. Start the Vite frontend and Express backend:

   ```bash
   npm run dev:all
   ```

3. Open the local frontend at `http://localhost:8082`.
4. Confirm the OpenAI Translation tab is visible.
5. Select `Microphone`, choose a target language, and start translation.
6. If you are not doing a live OpenAI check, stop at the visible-tab and media
   permission checks. Do not click through a real provider call unless the API
   key and usage budget are approved.

Useful local checks:

```bash
curl -s http://localhost:3001/api/openai/health
```

The health route confirms whether the backend sees `OPENAI_API_KEY`. It does
not create a translation session.

## Production or Docker Check

The translation tab is controlled by frontend build-time variables. A
production bundle must be built with `VITE_OPENAI_TRANSLATION_ENABLED=true`.
Setting that variable only when the container starts is too late because the
compiled frontend has already been generated.

For a local production-style check without Docker:

```bash
VITE_OPENAI_TRANSLATION_ENABLED=true \
VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30 \
VITE_API_BASE_URL=/ \
npm run build

NODE_ENV=production \
OPENAI_API_KEY=sk-your_openai_api_key_here \
npm run server
```

Then open `http://localhost:3001` and run the same tab, microphone, and route
checks.

For Docker or remote image deploys:

- Build the image with public `VITE_*` values, including
  `VITE_OPENAI_TRANSLATION_ENABLED=true` and the optional
  `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES` value.
- Inject `OPENAI_API_KEY` only as a container runtime secret.
- Use `VITE_API_BASE_URL=/` for the combined image so frontend and API requests
  stay same-origin.
- Rebuild and redeploy the image whenever the translation feature flag or
  max-session value changes.
- Verify the public HTTPS origin can reach `/api/openai/health` and that the
  app does not expose `OPENAI_API_KEY` in browser config or page source.

## ngrok Demo Mode Check

Demo mode builds the frontend, starts Express on port 3001, and exposes that
single origin through ngrok. This is the preferred shareable check because the
ngrok URL is HTTPS and the API uses relative same-origin paths.

1. Set demo values in `.env`:

   ```bash
   OPENAI_API_KEY=sk-your_openai_api_key_here
   VITE_OPENAI_TRANSLATION_ENABLED=true
   VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES=30
   VITE_API_BASE_URL=/
   NGROK_AUTHTOKEN=your-ngrok-token
   ```

2. Start demo mode:

   ```bash
   npm run demo
   ```

3. Open the displayed Demo URL.
4. If ngrok shows an interstitial, click through before testing media
   permissions.
5. If basic auth is configured with `NGROK_AUTH_USER` and `NGROK_AUTH_PASS`,
   sign in before starting microphone or tab capture.
6. Confirm the OpenAI Translation tab is visible.
7. Start with `Microphone`, then test `Tab audio` only in a browser and share
   target that exposes audio.

Because Express serves `dist/` and `/api/*` from one origin in demo mode, the
browser requests `POST /api/openai/translation-session` through the same ngrok
URL. No second backend tunnel is required.

## Browser Support and Capture Limits

OpenAI Translation supports two source modes:

| Source mode   | UI label     | Browser API                                            | Notes                                                                             |
| ------------- | ------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `microphone`  | `Microphone` | `navigator.mediaDevices.getUserMedia({ audio: true })` | Best first check for local demos. Requires microphone permission.                 |
| `browser-tab` | `Tab audio`  | `navigator.mediaDevices.getDisplayMedia(...)`          | Depends on browser support and the selected share target exposing an audio track. |

### Secure Contexts

Browsers require a secure context for microphone and display capture. Localhost
is allowed for development. Shared demos should use HTTPS, which ngrok provides
automatically.

If a recipient opens a non-HTTPS URL that is not localhost, media capture can
be unavailable before the app reaches OpenAI.

### Microphone Capture

Microphone capture is the simplest translation source. If it fails, check:

- The page is HTTPS or localhost.
- The browser permission prompt was accepted.
- The operating system allows the browser to access the microphone.
- Another app is not exclusively using the microphone.
- The selected input device is connected and unmuted.

Permission denial maps to a user-visible permission error. If the user cancels
or dismisses the prompt before capture starts, the app treats it as a cancelled
capture attempt rather than a backend failure.

### Browser-Tab Audio Capture

Browser-tab capture is useful for listen-along translation demos, but support is
not universal. It depends on:

- Browser support for `getDisplayMedia`.
- A secure browser context.
- The selected share target. A tab can expose audio; a window or screen may not.
- Whether the browser presents and honors an audio-sharing checkbox.
- Operating-system and browser policy for tab/system audio capture.

When checking tab audio, choose a browser tab that is actively playing audio and
enable any "share audio" option in the browser picker. If the selected target
does not include an audio track, the app reports that the selected browser share
did not include audio and asks the user to choose a tab with audio sharing
enabled.

### Unsupported and Cancelled Capture

If `getUserMedia` or `getDisplayMedia` is missing, the corresponding source is
shown as unavailable. If the user denies permission, cancels the picker, closes
the selected tab, or the track ends, the session surfaces a capture/source-ended
state and cleans up the current translation session.

### Demo Expectations

For a reliable first demo:

1. Start with `Microphone`.
2. Confirm the translated audio player becomes ready.
3. Switch to `Tab audio` only after confirming the browser can share tab audio.
4. Keep a fallback microphone check ready for browsers that do not expose tab
   audio.

## Troubleshooting

Use this section to diagnose feature-flag, backend-key, client-secret, SDP,
WebRTC, media-capture, and offline failures.

## Cost and Usage Guardrails

OpenAI Translation starts a live WebRTC session after the app obtains a
translation client secret and exchanges SDP with OpenAI. Treat every live
session as billable provider usage.

The browser WebRTC exchange posts completed ICE-gathered SDP to
`https://api.openai.com/v1/realtime/translations`. Keep the runtime's SDP
normalization in place; OpenAI can reject otherwise valid-looking offers when
the body is missing the final newline.

As of the 2026-05-12 official docs re-check, `gpt-realtime-translate` is priced
by realtime audio duration rather than text tokens. Check the current OpenAI
pricing page before any production demo, customer demo, or long-running test.

Built-in frontend guardrails:

- Default max session duration: 30 minutes.
- Optional override: `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES`.
- Hard maximum: 120 minutes. Higher configured values are capped.
- Invalid, missing, zero, or negative values fall back to the 30-minute default.
- The guard runs in the browser session and automatically stops the current
  translation when the limit is reached.

Recommended demo posture:

1. Keep the default 30-minute limit for ordinary demos.
2. Use shorter values for smoke checks, for example `0.05` for about three
   seconds in test-only environments.
3. Avoid the 120-minute cap unless the demo plan explicitly requires it.
4. Stop the session manually when the demo segment ends.
5. Watch provider usage outside the app if the demo uses a real OpenAI account.

Transcript and audio posture:

- Source and translated transcript rows are current-session UI state.
- Markdown export downloads the current transcript summary and rows when the
  maintainer clicks export.
- The app does not persist translation transcripts to a database.
- Stop, provider switch, source-ended, and max-session paths clean up the
  active translation session.

Server-side operational guardrails:

- `POST /api/openai/translation-session` is part of the strict token route
  limiter and duplicate in-flight guard.
- Translation lifecycle logs use sanitized metadata only: request ID, route,
  target language, status category/code, result, duration config source, and
  safety-identifier status.
- Translation lifecycle logs exclude raw request bodies, raw upstream bodies,
  client secrets, API keys, cookies, authorization headers, audio, transcripts,
  and SDP payloads.
- `OpenAI-Safety-Identifier` remains deferred until the app has a stable
  non-PII identifier. Do not derive it from IP address, user agent, cookies,
  authorization headers, transcripts, audio, or provider responses.

Production caveats:

- Token route rate limiting is process-local. Multi-instance production
  deployments need external/shared controls if stricter global limits are
  required.
- Keep existing CORS and CSP compatibility allowances provider-aware. Do not
  tighten CSP for translation demos without checking all active providers.

## Verification Checklist

- [ ] OpenAI Translation tab appears only when the frontend feature flag is
      enabled before build/start.
- [ ] `OPENAI_API_KEY` is set only in the server runtime environment.
- [ ] `POST /api/openai/translation-session` is reachable from the browser
      through the configured API origin.
- [ ] Microphone capture can start in HTTPS or localhost contexts.
- [ ] Browser-tab capture is presented as browser and share-target dependent.
- [ ] Stop, provider switch, source-ended, and max-session paths are described
      as current-session cleanup paths.
- [ ] The evaluation workflow is used when a run needs repeatable golden
      scripts, latency checkpoints, bilingual review, or local media guardrails.

## References

- [OpenAI Realtime Provider](./OPENAI_REALTIME.md)
- [OpenAI Translation Evaluation Workflow](./ongoing-projects/translation-evaluation.md)
- [Demo Mode](./DEMO_MODE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Environment Variables](./environments.md)
- [API Integration Guide](./API_INTEGRATION.md)
