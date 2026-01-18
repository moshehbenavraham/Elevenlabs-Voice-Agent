# Voice-Agent-PuPuPlatter - Product Requirements Document

## Overview

Voice-Agent-PuPuPlatter is a multi-provider voice AI demo platform showcasing real-time voice integrations with ElevenLabs, OpenAI Realtime, xAI Grok, Ultravox, Vapi, Retell, and Google Gemini Live APIs. The platform provides a unified glassmorphism UI for demonstrating and comparing voice AI providers with WebSocket-based real-time conversations, audio visualization, and function calling capabilities.

This phase focuses on adding ngrok tunnel support to enable quick external access for demos and presentations without complex deployment infrastructure.

## Goals

1. Enable one-command startup for demo mode with ngrok tunnels exposing both frontend and backend
2. Provide secure HTTPS access for microphone permissions (required by all modern browsers)
3. Support custom ngrok domains for predictable demo URLs
4. Maintain working voice provider connections through the tunnel (proper CORS and WebSocket handling)
5. Provide clear terminal output with tunnel URLs and demo instructions

## Non-Goals

- Production deployment infrastructure (Docker, Kubernetes, cloud hosting)
- Ngrok paid feature dependencies (free tier must work, paid features optional)
- Automated ngrok account provisioning
- Load balancing or high-availability configurations
- Persistent tunnel URLs without custom domain

## Users and Use Cases

### Primary Users

- **Developers**: Engineers demoing the platform to stakeholders or testing externally
- **Sales/Demo Team**: Non-technical users who need to quickly share the platform

### Key Use Cases

1. **Quick Demo**: Developer runs `npm run demo` and shares the ngrok URL with stakeholders in a meeting
2. **Mobile Testing**: Test voice features on mobile devices over HTTPS without local network setup
3. **External API Callbacks**: Some voice providers may need to call back to the server (webhooks)
4. **Remote Collaboration**: Share a working demo with remote team members for review

## Requirements

### MVP Requirements

- Single npm script (`npm run demo`) that starts frontend, backend, and ngrok tunnels
- Single ngrok process with multiple tunnels (frontend:8082, backend:3001)
- ngrok.yml configuration file for tunnel definitions
- Dynamic CORS origin update based on ngrok tunnel URL
- Dynamic API base URL injection for frontend
- Terminal output showing all URLs (frontend tunnel, backend tunnel, inspector)
- Support for custom ngrok domain via environment variable
- Graceful shutdown of all processes on Ctrl+C
- Auto-detect ngrok installation and display installation instructions (always shown for open-source users)
- ngrok basic auth (password protection) enabled by default via environment variables
- Shareable demo card output with URLs, credentials, and setup instructions

### Deferred Requirements

- QR code generation for mobile testing
- Webhook URL auto-configuration for providers that need callbacks
- ngrok event streaming for connection monitoring

## Non-Functional Requirements

- **Performance**: Tunnel startup under 10 seconds after ngrok is authenticated
- **Security**: No API keys exposed in ngrok tunnel URLs; CORS restricted to ngrok origin; password protection on all tunnels
- **Reliability**: Automatic reconnection if ngrok tunnel drops (ngrok handles this)
- **Accessibility**: Clear terminal output readable by screen readers; no emoji-only status

## Constraints and Dependencies

- ngrok CLI must be installed (script auto-detects and provides instructions)
- ngrok authtoken must be configured (free account minimum)
- Custom domains require ngrok paid plan
- Frontend port 8082, backend port 3001, ngrok inspector 4041 (configurable)
- WebSocket connections (voice providers) must work through ngrok HTTPS tunnels
- Password protection via NGROK_AUTH_USER and NGROK_AUTH_PASS environment variables

## Phases

This system delivers the product via phases. Each phase is implemented via multiple 2-4 hour sessions (12-25 tasks each).

| Phase | Name                        | Sessions | Status      |
| ----- | --------------------------- | -------- | ----------- |
| 00    | Ngrok Demo Mode Integration | TBD      | Not Started |

## Phase 00: Ngrok Demo Mode Integration

### Objectives

1. Create ngrok configuration file with multi-tunnel setup and password protection
2. Build demo startup script that orchestrates all services with auto-detection
3. Implement dynamic URL configuration for CORS and API base URL
4. Add environment variable support for ngrok customization (domain, auth, ports)
5. Provide comprehensive terminal output with shareable demo card

### Sessions (To Be Defined)

Sessions are defined via `/phasebuild` as `session_NN_name.md` stubs under `.spec_system/PRD/phase_00/`.

**Note**: This command does NOT create phase directories or session stubs. Run `/phasebuild` after creating the PRD.

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **Backend**: Express 5, Node.js (ES modules)
- **Voice SDKs**: @elevenlabs/react, @vapi-ai/web, retell-client-js-sdk, ultravox-client, @google/genai
- **Testing**: Vitest, React Testing Library, Playwright
- **Tunneling**: ngrok CLI with YAML configuration
- **Process Management**: Bash scripts with signal handling

## Success Criteria

- [ ] `npm run demo` starts all services and ngrok tunnels successfully
- [ ] Frontend accessible via ngrok HTTPS URL with working microphone permissions
- [ ] All voice providers connect and function through the tunnel
- [ ] Backend API accessible via separate ngrok tunnel with proper CORS
- [ ] Terminal displays all URLs clearly with copy-paste friendly format
- [ ] Ctrl+C gracefully shuts down all processes (no orphaned ngrok tunnels)
- [ ] Custom domain works when NGROK_DOMAIN is configured
- [ ] Inspector UI accessible at configured port (default 4041)
- [ ] ngrok installation detected with instructions always displayed
- [ ] Password protection active on tunnels (configured via NGROK_AUTH_USER/NGROK_AUTH_PASS)
- [ ] Demo card generated with shareable URLs, credentials, and quick-start instructions

## Risks

- **ngrok rate limits**: Free tier has connection limits; mitigate by documenting paid tier benefits
- **WebSocket compatibility**: Some voice providers may have issues through proxied WebSockets; mitigate by testing all providers
- **Port conflicts**: Inspector port 4041 may conflict; mitigate by making it configurable via NGROK_INSPECTOR_PORT
- **Process orphaning**: Child processes may not terminate cleanly; mitigate with robust signal handling and PID tracking

## Assumptions

- Users have at least one voice provider API key configured in .env
- Local development environment is working (npm run dev:start functions correctly)
- Users understand they need HTTPS for microphone access in browsers
- ngrok authtoken is configured (script will detect and guide if not)
