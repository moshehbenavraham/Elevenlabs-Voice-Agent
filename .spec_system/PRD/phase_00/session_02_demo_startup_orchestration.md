# Session 02: Demo Startup Orchestration

**Session ID**: `phase00-session02-demo-startup-orchestration`
**Status**: Not Started
**Estimated Tasks**: ~18
**Estimated Duration**: 3-4 hours

---

## Objective

Build the main demo startup script that orchestrates frontend, backend, and ngrok processes with proper signal handling and graceful shutdown.

---

## Scope

### In Scope (MVP)

- Create main `scripts/demo.sh` orchestration script
- Implement ngrok tunnel startup and URL extraction
- Start frontend dev server (Vite on port 8082)
- Start backend server (Express on port 3001)
- Implement trap-based signal handling for Ctrl+C (SIGINT, SIGTERM)
- Track PIDs for all child processes
- Implement graceful shutdown sequence (ngrok → frontend → backend)
- Add npm script `npm run demo` to package.json
- Wait for services to be healthy before proceeding
- Handle startup failures gracefully with error messages

### Out of Scope

- Dynamic CORS/URL configuration injection (Session 03)
- Rich terminal output formatting (Session 04)
- Demo card generation (Session 04)

---

## Prerequisites

- [ ] Session 01 completed (ngrok.yml, detection script exist)
- [ ] ngrok CLI installed and authenticated

---

## Deliverables

1. `scripts/demo.sh` - Main orchestration script
2. Updated `package.json` with `demo` script entry
3. `scripts/ngrok/start-tunnels.sh` - ngrok startup with URL extraction
4. `scripts/ngrok/wait-for-tunnels.sh` - Health check for tunnel readiness

---

## Success Criteria

- [ ] `npm run demo` starts all three processes (ngrok, frontend, backend)
- [ ] Script extracts tunnel URLs from ngrok API (localhost:4041/api/tunnels)
- [ ] Ctrl+C terminates all processes cleanly (no orphaned processes)
- [ ] Script fails gracefully if ngrok is not installed (shows instructions)
- [ ] Script fails gracefully if ports are already in use
- [ ] All PIDs are tracked and killed on shutdown
- [ ] Backend starts only after ngrok URLs are available
