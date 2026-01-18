# PRD Phase 00: Ngrok Demo Mode Integration

**Status**: In Progress
**Sessions**: 4 (initial estimate)
**Estimated Duration**: 1-2 days

**Progress**: 2/4 sessions (50%)

---

## Overview

This phase adds ngrok tunnel support to enable quick external access for demos and presentations. A single `npm run demo` command will start the frontend, backend, and ngrok tunnels with HTTPS access for microphone permissions, dynamic CORS configuration, password protection, and a shareable demo card with all connection details.

---

## Progress Tracker

| Session | Name                            | Status      | Est. Tasks | Validated  |
| ------- | ------------------------------- | ----------- | ---------- | ---------- |
| 01      | Ngrok Configuration & Detection | Complete    | 16         | 2026-01-18 |
| 02      | Demo Startup Orchestration      | Complete    | 18         | 2026-01-18 |
| 03      | Dynamic URL Configuration       | Not Started | ~14        | -          |
| 04      | Terminal Output & Demo Card     | Not Started | ~12        | -          |

---

## Completed Sessions

### Session 01: Ngrok Configuration & Detection

**Completed**: 2026-01-18

Created ngrok configuration file and detection scripts:

- `scripts/ngrok/ngrok.yml` - Multi-tunnel configuration with environment variable support
- `scripts/ngrok/detect-ngrok.sh` - Detection script with version extraction
- `scripts/ngrok/install-instructions.sh` - Platform-specific installation guide
- Updated `.env.example` with ngrok environment variables

### Session 02: Demo Startup Orchestration

**Completed**: 2026-01-18

Created demo orchestration scripts for single-command startup:

- `scripts/demo.sh` - Main orchestrator with PID tracking and LIFO shutdown
- `scripts/ngrok/start-tunnels.sh` - Starts ngrok and extracts tunnel URLs
- `scripts/ngrok/wait-for-tunnels.sh` - Polls ngrok API with exponential backoff
- Added `npm run demo` script to package.json
- Graceful shutdown via trap-based signal handling

---

## Upcoming Sessions

- Session 03: Dynamic URL Configuration

---

## Objectives

1. Create ngrok configuration file with multi-tunnel setup and password protection
2. Build demo startup script that orchestrates all services with auto-detection
3. Implement dynamic URL configuration for CORS and API base URL
4. Add environment variable support for ngrok customization (domain, auth, ports)
5. Provide comprehensive terminal output with shareable demo card

---

## Prerequisites

- None (this is Phase 00)
- Working local development environment (`npm run dev:start`)
- At least one voice provider API key configured in `.env`

---

## Technical Considerations

### Architecture

- Single ngrok process managing multiple tunnels (frontend:8082, backend:3001)
- Bash scripts with signal handling for process orchestration
- Environment variable-driven configuration for flexibility

### Technologies

- ngrok CLI with YAML configuration
- Bash scripting with trap for signal handling
- Node.js for URL parsing and configuration updates

### Risks

- **ngrok rate limits**: Free tier has connection limits; document paid tier benefits
- **WebSocket compatibility**: Voice providers may have issues through proxied WebSockets; test all providers
- **Port conflicts**: Inspector port 4041 may conflict; make configurable via NGROK_INSPECTOR_PORT
- **Process orphaning**: Child processes may not terminate cleanly; robust signal handling and PID tracking

### Relevant Considerations

<!-- From CONSIDERATIONS.md - no active concerns yet for Phase 00 -->

_None - this is the first phase._

---

## Success Criteria

Phase complete when:

- [ ] All 4 sessions completed
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

---

## Dependencies

### Depends On

- None (this is Phase 00)

### Enables

- Future phases can leverage demo mode for external testing and stakeholder reviews
