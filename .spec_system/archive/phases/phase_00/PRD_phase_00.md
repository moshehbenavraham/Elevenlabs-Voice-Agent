# PRD Phase 00: Ngrok Demo Mode Integration

**Status**: Complete
**Sessions**: 4
**Estimated Duration**: 1-2 days

**Progress**: 4/4 sessions (100%)

---

## Overview

This phase adds ngrok tunnel support to enable quick external access for demos and presentations. A single `npm run demo` command builds the frontend, starts Express in production mode, exposes Express through one ngrok HTTPS tunnel, supports optional password protection, and prints a shareable demo card with connection details.

---

## Progress Tracker

| Session | Name                            | Status   | Est. Tasks | Validated  |
| ------- | ------------------------------- | -------- | ---------- | ---------- |
| 01      | Ngrok Configuration & Detection | Complete | 16         | 2026-01-18 |
| 02      | Demo Startup Orchestration      | Complete | 18         | 2026-01-18 |
| 03      | Dynamic URL Configuration       | Complete | 24         | 2026-01-18 |
| 04      | Terminal Output & Demo Card     | Complete | 20         | 2026-01-18 |

---

## Completed Sessions

### Session 01: Ngrok Configuration & Detection

**Completed**: 2026-01-18

Created ngrok configuration file and detection scripts:

- `scripts/ngrok/ngrok.yml.template` - Single-tunnel configuration template with environment variable support
- `scripts/ngrok/generate-ngrok-config.sh` - Generates gitignored `scripts/ngrok/ngrok.yml`
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

### Session 03: Dynamic URL Configuration

**Completed**: 2026-01-18

Implemented runtime URL configuration for ngrok demo mode:

- `scripts/ngrok/configure-urls.sh` - Legacy split-tunnel helper retained for compatibility
- `scripts/demo.sh` - Generates `dist/config.js` for same-origin runtime API calls
- `scripts/ngrok/validate-cors.sh` - CORS validation script for testing
- `public/config.template.js` - Template for runtime frontend config
- `src/lib/apiConfig.ts` - Shared getApiBaseUrl utility function
- Updated all 5 voice provider contexts to use dynamic API base URL
- Updated `server/index.js` for dynamic CORS origin from environment
- Updated `scripts/demo.sh` with URL configuration integration and cleanup

### Session 04: Terminal Output & Demo Card

**Completed**: 2026-01-18

Added user-facing polish layer for terminal output and documentation:

- `scripts/ngrok/output-formatter.sh` - Reusable terminal formatting library with colors
- `scripts/ngrok/demo-card.sh` - Generates shareable demo card with URLs and credentials
- `docs/DEMO_MODE.md` - Comprehensive demo mode documentation (~350 lines)
- Updated `scripts/demo.sh` to use output-formatter and display demo card
- Updated `README.md` with demo mode section and quick-start instructions
- Full NO_COLOR support for accessibility
- ASCII-only output for universal terminal compatibility

---

## Phase Complete

All 4 sessions completed successfully. The ngrok demo mode integration is now fully functional with:

- Single-command startup (`npm run demo`)
- Automatic single-tunnel ngrok configuration
- Runtime config for same-origin API calls
- Color-coded terminal output with shareable demo card
- Comprehensive documentation

---

## Objectives

1. Create ngrok configuration template with single-tunnel setup and optional password protection
2. Build demo startup script that orchestrates production build, Express, and ngrok with auto-detection
3. Implement runtime URL configuration for same-origin API calls
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

- Single ngrok tunnel to Express on port 3001, where Express serves both `dist/` and `/api/*`
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

- [x] All 4 sessions completed
- [x] `npm run demo` starts all services and ngrok tunnels successfully
- [x] Frontend accessible via ngrok HTTPS URL with working microphone permissions
- [x] All voice providers connect and function through the tunnel
- [x] Backend API accessible through the same ngrok origin as the frontend
- [x] Terminal displays all URLs clearly with copy-paste friendly format
- [x] Ctrl+C gracefully shuts down all processes (no orphaned ngrok tunnels)
- [x] Custom domain works when NGROK_DOMAIN is configured
- [x] Inspector UI accessible at configured port (default 4041)
- [x] ngrok installation detected with instructions always displayed
- [x] Password protection active on tunnels (configured via NGROK_AUTH_USER/NGROK_AUTH_PASS)
- [x] Demo card generated with shareable URLs, credentials, and quick-start instructions

---

## Dependencies

### Depends On

- None (this is Phase 00)

### Enables

- Future phases can leverage demo mode for external testing and stakeholder reviews
