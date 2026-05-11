# Voice-Agent-PuPuPlatter - Product Requirements Document

## Overview

Voice-Agent-PuPuPlatter is a multi-provider voice AI demo platform showcasing real-time voice integrations with ElevenLabs, OpenAI Realtime, xAI Grok, Ultravox, Vapi, Retell, and Google Gemini Live APIs. The platform provides a unified glassmorphism UI for demonstrating and comparing voice AI providers with WebSocket-based real-time conversations, audio visualization, and function calling capabilities.

This PRD was reconciled against the repository on 2026-05-11 after out-of-band implementation work. Phase 00 is complete. Phase 01 is in progress, with several CI/CD, deployment, monitoring, and security baselines already present in the codebase but not yet validated through formal Phase 01 spec sessions.

The next product expansion is a dedicated OpenAI live language translation tab using `gpt-realtime-translate`. This feature is intentionally separate from the existing OpenAI voice-agent provider because OpenAI's live translation API uses dedicated `/v1/realtime/translations` sessions, browser WebRTC media, translated audio as a remote track, and transcript deltas over an `oai-events` data channel instead of normal assistant turns, tools, prompts, or `response.create`.

## Goals

1. Maintain a unified demo surface for all supported voice AI providers
2. Enable one-command demo mode with HTTPS access for microphone permissions
3. Support production-ready containerization and deployment workflows
4. Automate quality, testing, security, release, and deployment checks through CI/CD
5. Keep provider API keys server-side with strict CORS, rate limiting, and observable health checks
6. Add a dedicated OpenAI live translation tab that supports browser-safe, low-latency speech translation with translated audio playback and transcript output
7. Preserve the downloaded `EXAMPLE/` assets as implementation references while moving all valuable planning knowledge into this master PRD

## Non-Goals

- Authentication, multi-user accounts, and tenant management
- Persistent database-backed application state
- Kubernetes, multi-region deployment, or high-availability orchestration
- Ngrok paid feature dependencies (free tier must work, paid features optional)
- Automated ngrok account provisioning
- Persistent tunnel URLs without custom domain
- Folding live translation into the existing OpenAI voice-agent conversation mode
- Translation prompts, function calling, assistant chat turns, tool execution, or fixed voice selection for the first translation implementation
- Backend raw-audio, SIP, telephony, LiveKit room fanout, browser extension overlays, or one-session-per-listener language fanout in the first browser-tab MVP
- Persistent translated transcript storage or account-scoped transcript history

## Users and Use Cases

### Primary Users

- **Developers**: Engineers demoing the platform to stakeholders or testing externally
- **Sales/Demo Team**: Non-technical users who need to quickly share the platform
- **Maintainers**: Engineers validating changes through tests, CI, Docker, and deployment workflows
- **Operators**: People deploying and monitoring the production demo instance
- **Translation Demo Users**: People who need to translate live microphone or browser-tab audio during a demo, meeting, video, or local test

### Key Use Cases

1. **Quick Demo**: Developer runs `npm run demo` and shares the ngrok URL with stakeholders in a meeting
2. **Mobile Testing**: Test voice features on mobile devices over HTTPS without local network setup
3. **External API Callbacks**: Some voice providers may need to call back to the server (webhooks)
4. **Remote Collaboration**: Share a working demo with remote team members for review
5. **Production Deployment**: Maintainer deploys a containerized full-stack app behind HTTPS
6. **Change Validation**: Pull requests run lint, format, type, unit, E2E, build, and security checks
7. **Live Browser Translation**: User opens the OpenAI Translation tab, captures microphone or browser-tab audio, selects a target language, and hears translated audio in near real time
8. **Caption Review and Export**: User reviews source and translated transcript lines during a session, clears the panel, and exports a Markdown transcript for demo notes
9. **Translation Reliability Testing**: Maintainer validates browser permission errors, WebRTC failures, session cleanup, token-route hardening, and provider-switch cleanup through unit and E2E tests

## Requirements

### Completed Demo Mode Requirements

- Single npm script (`npm run demo`) that builds the frontend, starts Express in production mode, and starts ngrok
- Single ngrok tunnel to Express on port 3001, where Express serves both `dist/` and `/api/*`
- ngrok YAML template and generator for tunnel configuration
- Runtime `dist/config.js` injection for same-origin API calls during demo mode
- Terminal output showing the demo URL, local URL, optional credentials, and setup instructions
- Support for custom ngrok domain via `NGROK_DOMAIN`
- Optional ngrok basic auth via `NGROK_AUTH_USER` and `NGROK_AUTH_PASS`
- Graceful shutdown of Express and ngrok on Ctrl+C
- Auto-detect ngrok installation and display installation instructions
- Shareable demo card output with URLs, credentials when configured, and quick-start instructions

### Phase 01 Requirements

- Production Docker image(s) with minimal runtime footprint and non-root execution
- Local production Docker Compose workflow for full-stack testing
- GitHub Actions workflows for quality, build, unit tests, E2E tests, security scans, release, and deployment
- Container registry build/push workflow with deployment hooks or SSH deployment path
- Health checks that expose provider configuration status, uptime, memory, CORS, and rate limit posture
- Production documentation for environment variables, deployment, security, and incident response

### OpenAI Live Translation Requirements

- User can open a dedicated OpenAI Translation provider tab without disrupting existing voice-agent provider tabs
- User can choose a supported target output language from the documented `gpt-realtime-translate` language list: `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, `en`
- User can start and stop a live translation session for microphone audio and, in the preferred MVP, browser-tab audio
- User can hear translated output audio through a browser-controlled playback element
- User can view translated transcript output and optionally source-language transcript deltas when source transcription is enabled
- User can adjust original/translated audio mix for browser-tab translation, because same-language or mixed-language source segments may intentionally produce silence
- User can clear translation state and export a Markdown transcript from the current session
- User can see actionable errors for unsupported browser APIs, permission denial, missing audio tracks, token route failures, SDP exchange failures, and WebRTC connection failures
- Maintainer can mint translation client secrets through a dedicated Express route that never exposes `OPENAI_API_KEY` to the browser
- Maintainer can validate target language server-side before calling OpenAI
- Maintainer can sanitize the OpenAI client-secret response before returning it to the browser
- Maintainer can rate-limit the translation token route using the existing token limiter posture
- Maintainer can gate the tab with `VITE_OPENAI_TRANSLATION_ENABLED`
- Maintainer can verify start/stop cleanup closes data channels, peer connections, source tracks, translated audio elements, and active timers
- Maintainer can run unit, integration, and E2E smoke coverage for language config, audio mix clamping, route validation, transcript parsing, source capture options, permission errors, and provider switching

### Deferred Requirements

- QR code generation for mobile testing
- Webhook URL auto-configuration for providers that need callbacks
- ngrok event streaming for connection monitoring
- Full external monitoring/alerting integration beyond the baseline health endpoint
- Browser extension or cross-site subtitle overlay companion
- Backend raw-audio WebSocket bridge for server-side media workers
- SIP, telephony, Twilio, LiveKit room, or one-session-per-listener translation architecture
- Evaluation harness beyond the initial local/manual workflow
- Production safety identifier once the app has a stable hashed user or session identifier

## Non-Functional Requirements

- **Performance**: Demo startup should complete quickly after ngrok authentication; container startup target is under 30 seconds
- **Security**: No server-side API keys exposed to the browser; production CORS must be strict; rate limiting must protect API/token routes
- **Reliability**: Health endpoints must support container and deployment checks; ngrok handles tunnel reconnection
- **Accessibility**: Clear terminal output readable by screen readers; no emoji-only status
- **Translation Latency**: Browser translation should use WebRTC for client media and should avoid app-level PCM relays for the first implementation
- **Translation Security**: Browser translation must use short-lived client secrets minted server-side through `/v1/realtime/translations/client_secrets`; raw `OPENAI_API_KEY` must never be exposed to frontend code
- **Translation Reliability**: Switching away from the translation tab or pressing stop must tear down active tracks, peer connections, data channels, audio elements, abort controllers, timers, and transcript streams
- **Translation Accessibility**: Translation status, errors, language selection, start/stop controls, and transcripts must be usable by keyboard and screen-reader users

## Constraints and Dependencies

- ngrok CLI must be installed (script auto-detects and provides instructions)
- ngrok authtoken must be configured (free account minimum)
- Custom domains require ngrok paid plan
- Local development uses Vite on port 8082 and Express on port 3001
- Demo and production single-container mode serve frontend and API from Express on port 3001
- ngrok inspector defaults to port 4041 and is configurable
- WebSocket connections (voice providers) must work through ngrok HTTPS tunnels
- Password protection is optional and enabled when `NGROK_AUTH_USER` and `NGROK_AUTH_PASS` are set
- OpenAI live translation must use `gpt-realtime-translate` on `/v1/realtime/translations`
- Browser/client translation media must use WebRTC and `/v1/realtime/translations/calls`
- Browser client secrets must be created server-side via `/v1/realtime/translations/client_secrets`
- Target output language must be configured with `session.audio.output.language`
- `gpt-realtime-whisper` is used only when source-language transcript deltas are needed
- Translation implementation must not rely on custom prompts, function calls, fixed output voice selection, `response.create`, or assistant turn state
- `getDisplayMedia()` tab-audio capture availability and behavior varies by browser and must be detected in the UI
- The downloaded `EXAMPLE/` directory is gitignored reference material; durable implementation guidance must live in this PRD and future specs

## Phases

This system delivers the product via phases. Each phase is implemented via multiple 2-4 hour sessions (12-25 tasks each).

| Phase | Name                                     | Sessions | Status      | Completed  |
| ----- | ---------------------------------------- | -------- | ----------- | ---------- |
| 00    | Ngrok Demo Mode Integration              | 4        | Complete    | 2026-01-18 |
| 01    | Production Deployment & DevOps           | 5        | In Progress | -          |
| 02    | Translation Foundation                   | 4        | Planned     | -          |
| 03    | Browser Translation MVP                  | 5        | Planned     | -          |
| 04    | Hardening, Quality, and Demo Readiness   | 5        | Planned     | -          |
| 05    | Production Extensions and Media Variants | 5        | Planned     | -          |

## Phase 00: Ngrok Demo Mode Integration

### Objectives

1. Create ngrok configuration template with single-tunnel setup and optional password protection
2. Build demo startup script that orchestrates production build, Express, and ngrok with auto-detection
3. Implement runtime URL configuration for same-origin API calls
4. Add environment variable support for ngrok customization (domain, auth, ports)
5. Provide comprehensive terminal output with shareable demo card

### Sessions

| Session | Name                            | Status   | Tasks | Validated  |
| ------- | ------------------------------- | -------- | ----- | ---------- |
| 01      | Ngrok Configuration & Detection | Complete | 16    | 2026-01-18 |
| 02      | Demo Startup Orchestration      | Complete | 18    | 2026-01-18 |
| 03      | Dynamic URL Configuration       | Complete | 24    | 2026-01-18 |
| 04      | Terminal Output & Demo Card     | Complete | 20    | 2026-01-18 |

Session details in `.spec_system/archive/phases/phase_00/`.

## Phase 01: Production Deployment & DevOps

### Objectives

1. Create optimized multi-stage Docker builds with minimal image sizes
2. Implement comprehensive CI/CD pipeline with automated testing and deployments
3. Configure cloud deployment path using the current Docker/GitHub Actions baseline, with Coolify/webhook/SSH as primary options and managed platforms as alternatives
4. Add monitoring, logging, and alerting infrastructure
5. Harden security for production API key management and CORS configuration

### Sessions

| Session | Name                           | Status          | Tasks | Validated  |
| ------- | ------------------------------ | --------------- | ----- | ---------- |
| 01      | Docker Production Optimization | Complete        | ~15   | 2026-05-11 |
| 02      | GitHub Actions CI/CD Pipeline  | Baseline Exists | ~18   | -          |
| 03      | Cloud Deployment Configuration | Baseline Exists | ~20   | -          |
| 04      | Monitoring & Observability     | Baseline Exists | ~16   | -          |
| 05      | Production Security Hardening  | Baseline Exists | ~14   | -          |

`Baseline Exists` means relevant files exist in the repository from out-of-band work, but the session is not complete until it is audited, reconciled, implemented where needed, validated, and marked complete through the spec workflow.

Session details in `.spec_system/PRD/phase_01/`.

### Completed Sessions

1. Session 01: Docker Production Optimization (validated 2026-05-11)

## Phase 02: Translation Foundation

### Objectives

1. Establish the OpenAI Translation API contract through a dedicated backend route
2. Add shared frontend translation configuration, supported languages, validation helpers, audio mix helpers, and session-update builders
3. Add the new provider-tab identity, feature flag, icon, empty state, and provider-switch cleanup placeholders
4. Cover backend route behavior and shared config behavior with focused tests

### Sessions

Phase 02 starts the translation work because Phases 00 and 01 are already reserved for existing base work. Each session is one implementation spec: one clear objective, about 2-4 hours of work, and roughly 12-25 concrete tasks that a top coding agent can complete in one context window.

| Session | Name                                      | Status  | Clear Objective                                                                                                                | Target Size | Primary Repo Touchpoints                                                                                                        | EXAMPLE/ References                                                                                                                                                                                                                                                                                                                                                            |
| ------- | ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01      | Translation API Contract and Server Route | Planned | Add a dedicated Express route that creates sanitized `gpt-realtime-translate` browser client secrets.                          | 14-18 tasks | `server/routes/openai.js`, `server/index.js`, server route tests if added                                                       | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/session.js`, `EXAMPLE/LinguaForge/yt-translate-poc/server.js`, `EXAMPLE/LinguaForge/yt-translate-poc/test/server.test.js`                                                                                                                       |
| 02      | Shared Translation Config Library         | Planned | Add typed frontend constants, supported output languages, validation helpers, audio-mix helpers, and session-update builders.  | 12-16 tasks | `src/lib/openaiTranslation.ts`, `src/types/`, `src/test/`                                                                       | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation-config.js`, `EXAMPLE/open-realtime-translate/src/shared/languages.ts`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/audio-mix.js` |
| 03      | Provider-Tab Scaffold                     | Planned | Add the new translation provider identity, feature flag, icon, empty state, and provider-switch cleanup placeholders.          | 12-18 tasks | `src/types/voice-provider.ts`, `src/contexts/ProviderContext.tsx`, `src/components/tabs/ProviderTab.tsx`, `src/pages/Index.tsx` | Existing repo OpenAI/Gemini provider patterns; reference translation labels from `EXAMPLE/open-realtime-translate/src/shared/languages.ts`                                                                                                                                                                                                                                     |
| 04      | Backend and Config Tests                  | Planned | Cover route validation, OpenAI response sanitization, missing key handling, language list correctness, and audio-mix clamping. | 14-20 tasks | `src/test/`, route tests under existing test conventions, `vitest.config.ts` as needed                                          | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/session.test.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/audio-mix.test.js`, `EXAMPLE/LinguaForge/yt-translate-poc/test/server.test.js`               |

## Phase 03: Browser Translation MVP

### Objectives

1. Deliver the first usable in-app translation tab for microphone and/or browser-tab audio
2. Use browser WebRTC for media transport and translated audio playback
3. Add source capture modes, target language selection, status, translated audio, transcripts, and export controls
4. Preserve clear lifecycle boundaries so this feature does not destabilize the existing voice-agent providers

### Sessions

| Session | Name                              | Status  | Clear Objective                                                                                                                                  | Target Size | Primary Repo Touchpoints                                                                                       | EXAMPLE/ References                                                                                                                                                                                                                                                                                    |
| ------- | --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01      | Reusable WebRTC Translation Hook  | Planned | Implement `useOpenAITranslation` around `RTCPeerConnection`, `oai-events`, translated audio playback, transcript deltas, and cleanup.            | 18-24 tasks | `src/hooks/useOpenAITranslation.ts`, `src/lib/openaiTranslation.ts`, `src/test/`                               | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation.ts`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js` |
| 02      | Source Capture Modes              | Planned | Add source acquisition for microphone and browser-tab audio, including permission errors, track-ended handling, and `getDisplayMedia()` options. | 16-22 tasks | `src/hooks/useOpenAITranslationSource.ts`, `src/components/providers/OpenAITranslationProvider.tsx`            | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/capture-options.js`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`, `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`                      |
| 03      | Translation Tab UI MVP            | Planned | Build the initial provider screen with source selector, language selector, start/stop control, status, translated audio, and core responsive UI. | 18-24 tasks | `src/components/providers/OpenAITranslationProvider.tsx`, `src/pages/Index.tsx`, `src/components/ui/`          | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/index.html`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`                                                                                            |
| 04      | Transcript and Caption Experience | Planned | Add source/translated transcript state, latest-subtitle rendering, clear controls, and stable transcript panel behavior.                         | 14-20 tasks | `src/components/conversation/TranslationTranscriptPanel.tsx`, `src/hooks/useOpenAITranslation.ts`, `src/test/` | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation.ts`, `EXAMPLE/open-realtime-translate/src/content/subtitle.ts`                                                                                     |
| 05      | Audio Mix and Export Controls     | Planned | Add original/translated mix controls for tab audio, transcript Markdown export, elapsed time, and basic max-session guard.                       | 14-20 tasks | `src/components/providers/OpenAITranslationProvider.tsx`, `src/lib/openaiTranslation.ts`                       | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/audio-mix.js`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`                                                                                          |

## Phase 04: Hardening, Quality, and Demo Readiness

### Objectives

1. Make the browser translation MVP reliable enough for repeated local demos
2. Add clear diagnostic states for browser, token, SDP, WebRTC, and media failures
3. Expand unit, integration, and E2E coverage around the translation tab
4. Document environment flags, run steps, known limitations, cost/usage notes, and demo-mode behavior

### Sessions

| Session | Name                                 | Status  | Clear Objective                                                                                                                           | Target Size | Primary Repo Touchpoints                                                                                                 | EXAMPLE/ References                                                                                                                                                                                                                                                                                      |
| ------- | ------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01      | Lifecycle Reliability                | Planned | Harden start/stop, tab switching, abort handling, track cleanup, peer-connection cleanup, and duplicate-start protection.                 | 16-22 tasks | `src/hooks/useOpenAITranslation.ts`, `src/pages/Index.tsx`, provider cleanup code                                        | `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`, `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`                                                                                                                                                                                   |
| 02      | Error States and Diagnostics         | Planned | Add user-facing errors for unsupported browser APIs, token failures, SDP failures, WebRTC connection failures, and missing audio tracks.  | 14-20 tasks | `src/components/providers/OpenAITranslationProvider.tsx`, `src/hooks/useOpenAITranslation.ts`, `server/routes/openai.js` | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`                                                                                                  |
| 03      | Unit and Integration Coverage        | Planned | Add focused tests for config, event parsing, hook cleanup, capture option construction, route validation, and transcript export.          | 18-24 tasks | `src/test/`, `server/` route tests, `tests/e2e/utils/` as needed                                                         | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/test/realtime-translation-config.test.mjs` |
| 04      | E2E and Browser Smoke Tests          | Planned | Add Playwright coverage for tab visibility, disabled states, permission failure UX, provider switching cleanup, and mocked WebRTC events. | 16-22 tasks | `tests/e2e/`, `tests/e2e/page-objects/VoicePage.ts`, `tests/e2e/utils/`                                                  | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/scripts/smoke-realtime.mjs`, `EXAMPLE/LinguaForge/yt-translate-poc/test/index-html.test.js`                                                                                   |
| 05      | Documentation and Demo Configuration | Planned | Document environment flags, run steps, known limitations, cost/usage notes, and demo-mode behavior.                                       | 12-18 tasks | `README.md`, `docs/DEMO_MODE.md`, `docs/API_INTEGRATION.md`, `.env.example`                                              | `EXAMPLE/README.md`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/README.md`, `EXAMPLE/LinguaForge/README.md`, `EXAMPLE/open-realtime-translate/README.md`                                                                 |

## Phase 05: Production Extensions and Media Variants

### Objectives

1. Complete the broader translation feature goals beyond the first browser-tab MVP
2. Add production controls, observability, safety posture, and evaluation workflow
3. Decide which future media variants deserve implementation after the browser MVP proves out
4. Document or prototype backend raw-audio, telephony, room translation, and subtitle overlay paths without making them default UI dependencies

### Sessions

| Session | Name                                    | Status  | Clear Objective                                                                                                                                               | Target Size | Primary Repo Touchpoints                                                | EXAMPLE/ References                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | --------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01      | Production Safety and Usage Controls    | Planned | Add stronger server controls: safety identifier hook, token rate-limit coverage, session duration limits, transcript privacy notes, and observability events. | 14-20 tasks | `server/index.js`, `server/routes/openai.js`, `src/lib/logger.ts`, docs | `EXAMPLE/LinguaForge/yt-translate-poc/server.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/security.js`                                                                                                                                                                                                                                                                    |
| 02      | Evaluation Harness and Sample Workflow  | Planned | Define a repeatable manual and automated evaluation flow for latency, translated transcript quality, names/numbers, and mixed-language behavior.              | 12-18 tasks | `docs/ongoing-projects/`, optional `tests/fixtures/translation/`        | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide.mdx`, `EXAMPLE/LinguaForge/test-output/realtime-translation-vs-obsidian-clipper-comparison.md`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/scripts/smoke-realtime.mjs`                                                                                                        |
| 03      | Backend/Raw-Audio Bridge Spike          | Planned | Create a contained proof or design spec for server-side WebSocket translation if the app later ingests raw audio, SIP, telephony, or media-worker audio.      | 12-18 tasks | New docs/spec or isolated server prototype, no default UI dependency    | `EXAMPLE/mtg-realtime-translator/app.py`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/realtime-translation.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/audio.js`                                                                                                                       |
| 04      | Room/Telephony Translation Architecture | Planned | Document and optionally scaffold future one-session-per-direction and one-session-per-listener-language patterns for calls or rooms.                          | 12-18 tasks | `docs/ongoing-projects/`, optional future server routes                 | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/room.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/languages.js`, `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/StreamSocket.ts`, `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/AudioInterceptor.ts` |
| 05      | External Subtitle Overlay Assessment    | Planned | Decide whether a later browser-extension or overlay companion is worth building, and document the reusable overlay patterns.                                  | 12-16 tasks | `docs/ongoing-projects/`, optional future overlay component             | `EXAMPLE/open-realtime-translate/src/content/subtitle.ts`, `EXAMPLE/open-realtime-translate/src/background/service-worker.ts`, `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`                                                                                                                                                                                                                                                                     |

## OpenAI Live Translation Reference Assessment

This section imports the valuable findings from `docs/ongoing-projects/openai-live-translation-tab-assets-evaluation.md`. Source date: 2026-05-11. The standalone ongoing-project note can be deleted without losing the implementation plan, API constraints, UX scope, test plan, or `EXAMPLE/` code references.

### Executive Finding

The best path is not to extend the existing OpenAI voice-agent WebSocket provider. That provider is built around normal Realtime voice-agent behavior: prompts, tools, `response.create`, function calls, assistant turns, and `/v1/realtime`. OpenAI's current live translation docs define a different contract: dedicated `/v1/realtime/translations` sessions, target-language configuration through `session.audio.output.language`, browser media over WebRTC, translated audio as a remote media track, and transcript deltas over an `oai-events` data channel.

For this app, the highest-quality implementation source is a combination:

1. Official cookbook `livekit-translation-demo/lib/realtime-translation.ts` for the reusable React/WebRTC sidecar hook pattern.
2. Official cookbook `browser-translation-demo` for tab-audio capture, SDP exchange, audio mix controls, and tests.
3. LinguaForge for Express route hardening, local session controls, timers, and transcript export.

`open-realtime-translate` is a strong browser-extension example, but it is mainly useful if a later phase builds a cross-site subtitle overlay or Chrome extension flow. `mtg-realtime-translator` and Twilio assets are valuable for raw audio and telephony, not for the first browser tab inside this web app.

### Current Repo Fit

The app already has the right shell for a new tab:

- Provider tabs are driven by `ProviderType`, `PROVIDERS`, `ProviderProvider`, and `ProviderTabs`.
- The main screen branches by `activeProvider` in `src/pages/Index.tsx`.
- OpenAI server auth already lives under `server/routes/openai.js`.
- Frontend API URL resolution already goes through `getApiBaseUrl()`.
- The settings and provider UI patterns are established enough to add a translation-specific tab without inventing a new navigation model.

The main mismatch is that the existing OpenAI provider uses a WebSocket voice-agent session. It should be treated as a nearby example for lifecycle UI, status, toasts, and cleanup discipline, not as the protocol implementation for translation.

### Official Docs Constraints

Official references checked on 2026-05-11:

- Live translation guide: https://developers.openai.com/api/docs/guides/realtime-translation
- Model reference: https://developers.openai.com/api/docs/models/gpt-realtime-translate
- WebRTC guide: https://developers.openai.com/api/docs/guides/realtime-webrtc
- Release announcement: https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/

Implementation constraints that matter here:

- Use `gpt-realtime-translate` on `/v1/realtime/translations`.
- For browser/client media, use WebRTC and `/v1/realtime/translations/calls`.
- Create browser client secrets server-side via `/v1/realtime/translations/client_secrets`.
- Configure target output language with `session.audio.output.language`.
- Use `gpt-realtime-whisper` only when source-language transcript deltas are needed.
- Do not plan around custom prompts, tool calls, fixed output voice selection, `response.create`, or assistant turn state for translation.
- Keep an original-audio mix or ducking option because same-language or mixed-language segments may intentionally produce silence.

### Ranked Assets

| Rank | Asset                                                                                                   | Immediate Value   | Use It For                                                                                                                                  | Do Not Copy                                                              |
| ---- | ------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | `EXAMPLE/openai-cookbook-realtime-translation/.../livekit-translation-demo/lib/realtime-translation.ts` | Highest           | React hook shape, `RTCPeerConnection`, data-channel event handling, translated audio playback, subtitle extraction, live `session.update`   | Next.js path assumptions and LiveKit-specific source-track lookup        |
| 2    | `EXAMPLE/openai-cookbook-realtime-translation/.../browser-translation-demo/`                            | Highest           | Browser tab capture, `/translations/calls` SDP flow, `getDisplayMedia()` constraints, audio mix, diagnostics, smoke/unit tests              | Vanilla DOM structure and demo-specific UI                               |
| 3    | `EXAMPLE/LinguaForge/yt-translate-poc/`                                                                 | High              | Express token route hardening, loopback-origin ideas, session timers, silence timeout, transcript Markdown export, local testing discipline | Limited target-language set, Korean-only UI, single HTML file structure  |
| 4    | `EXAMPLE/open-realtime-translate/`                                                                      | Medium-high       | Subtitle overlay segmentation, closed shadow DOM, Chrome tab capture/offscreen constraints, MV3 security separation                         | Extension-only architecture and API-key-in-extension storage             |
| 5    | `EXAMPLE/mtg-realtime-translator/app.py`                                                                | Medium            | Raw WebSocket mechanics, 24 kHz PCM chunks, local VAD lessons, silence-tail behavior, device-switch ideas                                   | Browser implementation path and unsupported output languages in its list |
| 6    | Official cookbook `twilio-translation-demo/`                                                            | Medium for future | Server-side WebSocket bridge, one translation session per direction, Twilio audio format conversion, supported language validation          | First in-app browser tab                                                 |
| 7    | `EXAMPLE/twilio-live-translation-openai-realtime-api/`                                                  | Low for this tab  | Older Twilio Media Streams plumbing and call-center operational shape                                                                       | Its generic Realtime prompt-based translation model                      |

### Best Source Details

#### 1. Official React WebRTC Sidecar

Best files:

- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation.ts`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation-config.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/app/api/realtime/translation-token/route.ts`

Why it is the best base:

- It is already React-shaped and isolates translation into a reusable hook.
- It accepts a `MediaStreamTrack`, which lets this repo support both microphone translation and browser-tab translation with the same hook.
- It uses the dedicated translation WebRTC call endpoint.
- It handles `session.input_transcript.delta`, `session.output_transcript.delta`, `session.output_audio.delta`, and `session.updated`.
- It has a clean supported-language list matching the 13 target output languages.

Adaptation needed:

- Replace Next.js API route assumptions with `getApiBaseUrl()` calls into Express.
- Convert config helpers to TypeScript under `src/lib/openaiTranslation.ts`.
- Decide whether the first version supports `mic`, `tab audio`, or both. The hook should support any source track either way.

#### 2. Official Browser Tab Translation Demo

Best files:

- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/session.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/capture-options.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/audio-mix.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/`

Why it matters:

- It is the closest official example to "new tab in our app translates another browser tab."
- It shows `getDisplayMedia()` options that request tab audio and `suppressLocalAudioPlayback` where supported.
- It explicitly uses WebRTC rather than hand-sending PCM from browser code.
- It includes small tests for language validation, server behavior, capture options, audio mix clamping, and smoke coverage.

Adaptation needed:

- Keep its media and protocol flow, but rebuild the UI in this app's React style.
- Keep audio mix controls. They are important for mixed-language source audio.
- Use this as the main basis for browser-tab capture.

#### 3. LinguaForge

Best files:

- `EXAMPLE/LinguaForge/yt-translate-poc/server.js`
- `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`
- `EXAMPLE/LinguaForge/yt-translate-poc/test/server.test.js`
- `EXAMPLE/LinguaForge/README.md`

Why it matters:

- It is the closest shape to this repo's Express plus browser runtime.
- The server code forwards only the short-lived client secret and strips extra response data.
- It adds concrete session safety controls: max session duration, silence timeout, tab-ended stop, abort controller, and transcript Markdown export.
- Its tests are a good model for route-level coverage in this project.

Adaptation needed:

- Expand the language list from its PoC subset to the full 13 OpenAI output languages.
- Translate the single-page DOM implementation into React state/components.
- Reuse the idea of not forwarding raw OpenAI response bodies back to the browser.

#### 4. open-realtime-translate

Best files:

- `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`
- `EXAMPLE/open-realtime-translate/src/background/service-worker.ts`
- `EXAMPLE/open-realtime-translate/src/content/subtitle.ts`
- `EXAMPLE/open-realtime-translate/src/shared/languages.ts`

Why it matters:

- It is the cleanest non-official browser sidecar implementation.
- The subtitle overlay uses a shadow DOM and segment trimming, which is useful if translation should overlay external pages.
- It documents practical product limitations: tab-only capture, no prompts, no glossary, no fixed output voice, silence for already-target-language speech.

Why it is not the main base:

- Chrome extension offscreen documents, service workers, tabCapture stream IDs, and extension storage are not this app's architecture.
- This repo already has a backend, so API keys should stay server-side rather than in extension-local storage.

#### 5. mtg-realtime-translator

Best file:

- `EXAMPLE/mtg-realtime-translator/app.py`

Why it matters:

- It exposes raw WebSocket translation mechanics very clearly.
- It captures the important operational lesson that the translation endpoint is continuous-audio based and does not accept a normal manual commit flow.
- Its local VAD plus silence-tail approach is useful if this product later builds a backend/raw-audio bridge.

Why it is not the first implementation:

- OpenAI docs recommend WebRTC for browser media.
- This project is a web app, not a PySide desktop sidecar.
- Its output language list includes languages outside the 13 target languages currently documented for `gpt-realtime-translate`; do not copy that list.

#### 6. Twilio Assets

Best direct endpoint files:

- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/realtime-translation.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/room.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/languages.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/security.js`

Older adjacent sample:

- `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/StreamSocket.ts`
- `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/AudioInterceptor.ts`

Why it matters:

- The official Twilio demo is the best future reference for telephony or server-side media.
- It demonstrates one translation session per direction and target language based on the listener, not the speaker.
- It has Twilio request signature and caller allow-list patterns.

Why it is not the first implementation:

- The requested feature is an app tab, not a phone bridge.
- The older Twilio sample predates `gpt-realtime-translate` and uses generic Realtime prompts. Treat it as media-stream plumbing only.

### Recommended Implementation Shape

Add a separate provider/tab, for example `openai-translation`, instead of folding translation into the existing `openai` voice-agent provider.

Suggested backend route:

- Add `POST /api/openai/translation-session` in `server/routes/openai.js`.
- Validate `targetLanguage` against the 13 supported output languages: `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, `en`.
- Call `https://api.openai.com/v1/realtime/translations/client_secrets`.
- Request:

```json
{
  "session": {
    "model": "gpt-realtime-translate",
    "audio": {
      "input": {
        "transcription": { "model": "gpt-realtime-whisper" },
        "noise_reduction": { "type": "near_field" }
      },
      "output": { "language": "es" }
    }
  }
}
```

- Return only a normalized shape such as `{ "clientSecret": "...", "expiresAt": 1234567890, "targetLanguage": "es" }`.
- Add the route to the existing token rate limiter.
- Add `OpenAI-Safety-Identifier` on the server-side OpenAI request once this app has a stable hashed user/session identifier.

Suggested frontend modules:

- `src/lib/openaiTranslation.ts`
  - Supported languages
  - Constants for call endpoint and model
  - Target-language validation
  - `buildSessionUpdate()`
- `src/hooks/useOpenAITranslation.ts`
  - Adapted from the official LiveKit `useRemoteTranslation`
  - Accepts `sourceTrack`, `targetLanguage`, `sourceTranscriptionEnabled`, `noiseReductionEnabled`, `translatedVolume`
  - Owns `RTCPeerConnection`, `RTCDataChannel`, translated `<audio>` element, transcript state, cleanup
- `src/components/providers/OpenAITranslationProvider.tsx`
  - Status, start/stop, source selector, language selector, audio mix, subtitles, export button
- `src/components/conversation/TranslationTranscriptPanel.tsx`
  - Two-channel transcript display for source and translated text

Suggested tab wiring:

- Add a new `ProviderType` value.
- Add a `PROVIDERS` entry gated by `VITE_OPENAI_TRANSLATION_ENABLED`.
- Add a `Languages`-style lucide icon in `ProviderTab`.
- Add provider switching cleanup in `Index.tsx`.
- Reuse `OPENAI_API_KEY`; do not require a second OpenAI secret.

### Initial UX Scope

Preferred scope:

- Source mode: `Microphone` and `Browser tab`.
- Target language selector.
- Start/stop control.
- Translated audio playback.
- Original/translated mix slider for browser-tab source.
- Source transcript toggle.
- Translated transcript panel.
- Markdown export.
- Clear status and error states.

Smaller MVP:

- Browser-tab source only.
- Target language selector.
- Start/stop.
- Translated audio and translated captions.
- Original/translated mix.

Avoid for the first version:

- Prompt editor.
- Voice selector.
- Function calling.
- Assistant chat transcript.
- Tool execution.
- Backend raw-audio WebSocket bridge.
- Telephony/LiveKit room fanout.

### Translation Test Plan

Backend tests:

- Missing `OPENAI_API_KEY` returns a clear 500.
- Unsupported language returns 400 before calling OpenAI.
- OpenAI error status/message maps cleanly.
- Successful OpenAI response is sanitized before returning to browser.
- Token route is rate-limited with existing token limiter.

Frontend/unit tests:

- Supported language list contains exactly the 13 documented output languages.
- Audio mix clamps to 0..100 and computes original/translated volumes.
- Hook cleanup closes data channel, peer connection, source track, and audio element.
- Realtime event parser appends source and translated deltas correctly.

E2E smoke:

- Translation tab renders when enabled.
- Start button is disabled while connecting.
- Browser without `getDisplayMedia` gets a useful error.
- Switching tabs stops any active translation session.

### Translation Decision

Use the official cookbook React/WebRTC hook and browser-tab demo as the primary source. Use LinguaForge as the secondary source for Express hardening and product controls. Keep `open-realtime-translate`, `mtg-realtime-translator`, and Twilio assets as pattern references for later variants.

The first implementation should be a dedicated translation tab, not a mode inside the existing OpenAI voice-agent tab.

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **Backend**: Express 5, Node.js (ES modules)
- **Voice SDKs**: @elevenlabs/react, @vapi-ai/web, retell-client-js-sdk, ultravox-client, @google/genai
- **OpenAI Translation**: `gpt-realtime-translate`, `gpt-realtime-whisper`, `/v1/realtime/translations/client_secrets`, `/v1/realtime/translations/calls`
- **Browser Media**: WebRTC `RTCPeerConnection`, `RTCDataChannel`, `MediaStreamTrack`, microphone capture, browser-tab `getDisplayMedia()` audio capture
- **Testing**: Vitest, React Testing Library, Playwright
- **Tunneling**: ngrok CLI with YAML configuration
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions, GitHub Container Registry
- **Observability/Security Baseline**: pino, structured frontend error logging, express-rate-limit, CSP meta policy
- **Process Management**: Bash scripts with signal handling

## Success Criteria

- [x] `npm run demo` starts all services and ngrok tunnels successfully
- [x] Frontend accessible via ngrok HTTPS URL with working microphone permissions
- [x] All voice providers connect and function through the tunnel
- [x] Backend API accessible through the same ngrok origin as the frontend
- [x] Terminal displays all URLs clearly with copy-paste friendly format
- [x] Ctrl+C gracefully shuts down all processes (no orphaned ngrok tunnels)
- [x] Custom domain works when NGROK_DOMAIN is configured
- [x] Inspector UI accessible at configured port (default 4041)
- [x] ngrok installation detected with instructions always displayed
- [x] Password protection active when configured via NGROK_AUTH_USER/NGROK_AUTH_PASS
- [x] Demo card generated with shareable URLs, credentials, and quick-start instructions
- [ ] Phase 01 sessions audited and validated through the spec workflow
- [ ] Phase 02 defines and validates the OpenAI translation backend route, shared config, provider-tab scaffold, and focused backend/config tests
- [ ] Phase 03 delivers a usable OpenAI Translation tab with source capture, language selection, translated audio playback, transcripts, and export controls
- [ ] Phase 04 hardens translation lifecycle cleanup, diagnostics, automated tests, and documentation to demo-ready quality
- [ ] Phase 05 documents or prototypes production safety controls, evaluation workflow, raw-audio bridge, room/telephony architecture, and optional subtitle overlay posture
- [ ] Translation client secrets are minted only server-side and sanitized before reaching the browser
- [ ] Translation sessions use WebRTC for browser media and the dedicated `/v1/realtime/translations/calls` endpoint
- [ ] Existing provider tabs continue to work after translation feature integration

## Risks

- **WebSocket compatibility**: Some voice providers may have issues through proxies or deployed platforms; mitigate by testing all providers in demo and production-like environments
- **Port conflicts**: Server port 3001 or inspector port 4041 may conflict; mitigate by checks and configurable NGROK_INSPECTOR_PORT
- **Process orphaning**: Child processes may not terminate cleanly; mitigate with robust signal handling and PID tracking
- **Protocol mismatch**: Treating translation as a normal OpenAI voice-agent session would produce the wrong architecture; mitigate by using the dedicated translation endpoints and official WebRTC examples
- **Browser media limitations**: `getDisplayMedia()` tab-audio support and permission UX vary by browser; mitigate with feature detection, useful errors, microphone fallback, and E2E coverage
- **Session leakage**: Failed cleanup can leave active audio tracks, peer connections, or translated audio playback; mitigate with explicit stop routines, tab-switch cleanup, duplicate-start guards, and hook cleanup tests
- **Language drift**: Example projects may include unsupported target languages; mitigate by validating against the documented 13-language list in both frontend and backend code
- **Data exposure**: Returning raw OpenAI responses or storing transcripts by default could leak more than needed; mitigate by response sanitization, no persistent transcript storage, and explicit transcript export only
- **Future-media overreach**: Telephony, raw-audio bridges, and overlays can distract from the browser-tab MVP; mitigate by keeping them in Phase 05 docs/spec spikes until the core tab is stable

## Assumptions

- Users have at least one voice provider API key configured in .env
- Local development environment is working (npm run dev:start functions correctly)
- Users understand they need HTTPS for microphone access in browsers
- ngrok authtoken is configured (script will detect and guide if not)
- `OPENAI_API_KEY` is available server-side and can be reused for live translation client-secret minting
- OpenAI `gpt-realtime-translate` and the realtime translation endpoints remain available to this project
- The first browser MVP can use WebRTC directly from the browser instead of a backend PCM relay
- Translation transcripts are session-local unless a future PRD explicitly adds persistence
- The `EXAMPLE/` assets remain available locally during implementation, but this PRD is the durable source of truth for the plan

## Open Questions

1. Should the first shipping MVP include both microphone and browser-tab source modes, or should browser-tab source ship first with microphone added in the same phase if time allows?
2. What maximum session duration should the production guard use for translation demos?
3. Which local sample audio or meeting/video workflow should be used for the repeatable Phase 05 evaluation harness?
