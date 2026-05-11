# Voice-Agent-PuPuPlatter - Product Requirements Document

## Overview

Voice-Agent-PuPuPlatter is a multi-provider voice AI demo platform showcasing real-time voice integrations with ElevenLabs, OpenAI Realtime, xAI Grok, Ultravox, Vapi, Retell, and Google Gemini Live APIs. The platform provides a unified glassmorphism UI for demonstrating and comparing voice AI providers with WebSocket-based real-time conversations, audio visualization, and function calling capabilities.

This PRD was reconciled against the repository on 2026-05-11 after out-of-band implementation work. Phase 00 is complete. Phase 01 is in progress, with several CI/CD, deployment, monitoring, and security baselines already present in the codebase but not yet validated through formal Phase 01 spec sessions.

## Goals

1. Maintain a unified demo surface for all supported voice AI providers
2. Enable one-command demo mode with HTTPS access for microphone permissions
3. Support production-ready containerization and deployment workflows
4. Automate quality, testing, security, release, and deployment checks through CI/CD
5. Keep provider API keys server-side with strict CORS, rate limiting, and observable health checks

## Non-Goals

- Authentication, multi-user accounts, and tenant management
- Persistent database-backed application state
- Kubernetes, multi-region deployment, or high-availability orchestration
- Ngrok paid feature dependencies (free tier must work, paid features optional)
- Automated ngrok account provisioning
- Persistent tunnel URLs without custom domain

## Users and Use Cases

### Primary Users

- **Developers**: Engineers demoing the platform to stakeholders or testing externally
- **Sales/Demo Team**: Non-technical users who need to quickly share the platform
- **Maintainers**: Engineers validating changes through tests, CI, Docker, and deployment workflows
- **Operators**: People deploying and monitoring the production demo instance

### Key Use Cases

1. **Quick Demo**: Developer runs `npm run demo` and shares the ngrok URL with stakeholders in a meeting
2. **Mobile Testing**: Test voice features on mobile devices over HTTPS without local network setup
3. **External API Callbacks**: Some voice providers may need to call back to the server (webhooks)
4. **Remote Collaboration**: Share a working demo with remote team members for review
5. **Production Deployment**: Maintainer deploys a containerized full-stack app behind HTTPS
6. **Change Validation**: Pull requests run lint, format, type, unit, E2E, build, and security checks

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

### Deferred Requirements

- QR code generation for mobile testing
- Webhook URL auto-configuration for providers that need callbacks
- ngrok event streaming for connection monitoring
- Full external monitoring/alerting integration beyond the baseline health endpoint

## Non-Functional Requirements

- **Performance**: Demo startup should complete quickly after ngrok authentication; container startup target is under 30 seconds
- **Security**: No server-side API keys exposed to the browser; production CORS must be strict; rate limiting must protect API/token routes
- **Reliability**: Health endpoints must support container and deployment checks; ngrok handles tunnel reconnection
- **Accessibility**: Clear terminal output readable by screen readers; no emoji-only status

## Constraints and Dependencies

- ngrok CLI must be installed (script auto-detects and provides instructions)
- ngrok authtoken must be configured (free account minimum)
- Custom domains require ngrok paid plan
- Local development uses Vite on port 8082 and Express on port 3001
- Demo and production single-container mode serve frontend and API from Express on port 3001
- ngrok inspector defaults to port 4041 and is configurable
- WebSocket connections (voice providers) must work through ngrok HTTPS tunnels
- Password protection is optional and enabled when `NGROK_AUTH_USER` and `NGROK_AUTH_PASS` are set

## Phases

This system delivers the product via phases. Each phase is implemented via multiple 2-4 hour sessions (12-25 tasks each).

| Phase | Name                           | Sessions | Status      | Completed  |
| ----- | ------------------------------ | -------- | ----------- | ---------- |
| 00    | Ngrok Demo Mode Integration    | 4        | Complete    | 2026-01-18 |
| 01    | Production Deployment & DevOps | 5        | In Progress | -          |

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

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **Backend**: Express 5, Node.js (ES modules)
- **Voice SDKs**: @elevenlabs/react, @vapi-ai/web, retell-client-js-sdk, ultravox-client, @google/genai
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

## Risks

- **WebSocket compatibility**: Some voice providers may have issues through proxies or deployed platforms; mitigate by testing all providers in demo and production-like environments
- **Port conflicts**: Server port 3001 or inspector port 4041 may conflict; mitigate by checks and configurable NGROK_INSPECTOR_PORT
- **Process orphaning**: Child processes may not terminate cleanly; mitigate with robust signal handling and PID tracking

## Assumptions

- Users have at least one voice provider API key configured in .env
- Local development environment is working (npm run dev:start functions correctly)
- Users understand they need HTTPS for microphone access in browsers
- ngrok authtoken is configured (script will detect and guide if not)
