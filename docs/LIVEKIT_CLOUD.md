# LiveKit Cloud demo

The app and voice agent run on your local Linux/WSL machine. LiveKit Cloud provides the room, realtime media, and model inference. For a client demo, `npm run demo` opens one temporary ngrok tunnel for the app and API; the agent needs no inbound tunnel.

## Setup

Use Node.js 22 or later. From the repository root:

```bash
npm ci
npm run agent:livekit:setup
```

Set these in the ignored root `.env`:

```dotenv
VITE_LIVEKIT_ENABLED=true
LIVEKIT_ENABLED=true
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=<your-api-key>
LIVEKIT_API_SECRET=<your-api-secret>
LIVEKIT_AGENT_NAME=pupuplatter-livekit-demo
LIVEKIT_SESSION_MAX_SECONDS=600
```

The agent reads the same root `.env` regardless of the directory it is launched from. Existing process environment values take precedence. `VITE_LIVEKIT_ENABLED` controls the provider tab at build time. `LIVEKIT_ENABLED` controls server token issuance and agent startup in the demo script; it falls back to the public flag if unset. Set both together. Never add the API key or secret to a `VITE_` variable.

The default 600-second session cap is enforced by both the browser and agent. Valid values are integers from 30 to 1800 seconds. `LIVEKIT_AGENT_PORT` optionally changes the local worker health port from 8081. It is bound to loopback and is not exposed through ngrok.

The pinned pipeline is Deepgram Nova-3 STT, Gemma 4 31B LLM, Inworld TTS-2 with Ashley voice, and LiveKit's turn detector/adaptive interruptions. These use LiveKit Inference credentials and project quota. No additional model-provider keys are required for this configuration. Model changes belong in `agents/livekit/src/main.ts` and require a new real conversation test.

## Local development

Run the existing app and server in one terminal, and the agent in another:

```bash
npm run dev:all
```

```bash
npm run agent:livekit
```

Open `http://localhost:8082/livekit`, or select LiveKit Cloud in the provider switcher. The page does not ask for a microphone or issue a token until Start. Allow microphone access, speak normally, and interrupt when you want to change direction. Headphones are recommended for a client presentation. End disconnects and releases the microphone; transcripts remain visible until cleared or the page is left.

## Temporary client demo

Before the scheduled window, stop any development processes using ports 3001, 8081, or ngrok's configured inspector port (default 4041). The demo script refuses to take over occupied ports.

```bash
npm run demo
```

The script builds and registers the local agent, builds the frontend, opens the existing single ngrok tunnel, and starts Express serving both frontend and API on port 3001. It prints the client URL ending in `/livekit`. Existing ngrok credentials, domain, and basic-auth settings are reused; see the repository's ngrok setup documentation and `.env.example`.

Before sharing the URL, make one complete conversation through it. Check response audio, interruption, transcript, and End. Registration proves the agent connected to LiveKit; it does not prove billing/quota or model response readiness. Keep the machine awake and network connected for the client window.

Press Ctrl+C when finished. The script stops its tunnel, server, agent, and agent job processes and removes generated runtime configuration. It also cleans up on startup failure. Run the command again for another window; use the URL printed by that run. No permanent deployment, automatic scheduler, or cloud-hosted agent is needed.

## Troubleshooting

| Symptom                          | Check                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| No LiveKit tab                   | Set `VITE_LIVEKIT_ENABLED=true` and restart Vite/rebuild the demo                                      |
| Demo unavailable / session 503   | Check `LIVEKIT_ENABLED`, non-placeholder URL/key/secret, dispatch name, and session cap                |
| Waiting for assistant            | Confirm the local worker registered to the same project and dispatch name; restart it if needed        |
| Agent joins but cannot answer    | Check LiveKit Inference quota/billing and local agent warning logs                                     |
| Microphone denied or busy        | Allow browser microphone permission; close competing applications or choose another microphone         |
| No response sound                | Use Enable audio if shown; check browser sound settings and output device                              |
| Rate limit 429                   | Wait one minute before retrying; session creation uses the existing token limits                       |
| Port occupied                    | Stop the process owning that port, then rerun; the script does not terminate unrelated processes       |
| Tunnel cannot start              | Check ngrok authentication, configured domain/access controls, and account tunnel limits               |
| Works locally but not for client | Check the current tunnel URL, auth, HTTPS, browser WebRTC access, and the local machine's connectivity |

## Implementation and privacy

`GET /api/livekit/config` reports configuration readiness and the duration cap, with `agentOnline: null` to avoid claiming a worker is live. `POST /api/livekit/session` accepts `{}` and issues a unique room/identity and five-minute join token with explicit named-agent dispatch. It grants microphone publishing, subscribing, and data transport; no room administration, camera publishing, or inference credential is given to the browser. The join-token expiry does not end an active call; the agent enforces duration separately.

SDK `Room` owns the client connection. React LiveKit hooks observe state, tracks, and streamed transcriptions. The page cleans up on stop, cancellation, navigation, unmount, timeout, and terminal errors. The worker closes on participant departure, pipeline failure, or deadline. Transcripts are in browser memory only; the agent starts with `record: false` and suppresses SDK info-level job logs because they can include transcript text. This does not change account-level LiveKit billing or administrative telemetry.

The existing request limiter is process-local, and CORS is not authentication. Preserve the ngrok access controls for private client demos. Server credentials stay in `.env`; temporary room tokens are never persisted by the application.

## Verification

```bash
npm run type-check
npm run lint
npm run test:run
npm run build
npm run format:check
npm run build --prefix agents/livekit
npm test --prefix agents/livekit
npx playwright test tests/e2e/providers/livekit.spec.ts
```

Automated UI tests replace SDK transport in the test browser and do not spend provider credits. Separate live tests must exercise actual speech, inference, playback, and the tunnel. Current results and outstanding checks are recorded in [the implementation plan](ongoing-projects/livekit-cloud-demo-plan.md).
