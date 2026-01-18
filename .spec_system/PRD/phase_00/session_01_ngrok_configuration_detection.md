# Session 01: Ngrok Configuration & Detection

**Session ID**: `phase00-session01-ngrok-configuration-detection`
**Status**: Not Started
**Estimated Tasks**: ~15
**Estimated Duration**: 2-3 hours

---

## Objective

Set up the foundational ngrok infrastructure including configuration file, CLI detection, and environment variable support for tunnel customization.

---

## Scope

### In Scope (MVP)

- Create `ngrok.yml` configuration file with dual tunnel definitions (frontend:8082, backend:3001)
- Create ngrok detection script that checks if ngrok CLI is installed
- Add environment variable definitions to `.env.example` for ngrok settings
- Configure basic auth support in ngrok.yml using environment variable placeholders
- Configure custom domain support via NGROK_DOMAIN environment variable
- Configure inspector port via NGROK_INSPECTOR_PORT (default 4041)
- Create installation instructions display function

### Out of Scope

- Full demo orchestration script (Session 02)
- Dynamic URL configuration (Session 03)
- Terminal output formatting and demo card (Session 04)
- Automated ngrok installation

---

## Prerequisites

- [ ] Local development environment working (`npm run dev:start`)
- [ ] Understanding of ngrok YAML configuration syntax

---

## Deliverables

1. `scripts/ngrok/ngrok.yml` - ngrok configuration with tunnel definitions
2. `scripts/ngrok/detect-ngrok.sh` - CLI detection and version check script
3. Updated `.env.example` with ngrok-related environment variables
4. `scripts/ngrok/install-instructions.sh` - Display installation guide

---

## Success Criteria

- [ ] `ngrok.yml` defines frontend and backend tunnels correctly
- [ ] Detection script returns proper exit codes (0 = installed, 1 = not found)
- [ ] Basic auth placeholders in ngrok.yml work with environment variables
- [ ] Custom domain configuration works when NGROK_DOMAIN is set
- [ ] Inspector port is configurable via environment variable
- [ ] Installation instructions are clear and platform-appropriate (Linux/macOS/Windows)
