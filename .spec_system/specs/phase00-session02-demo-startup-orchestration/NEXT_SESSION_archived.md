# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 00 - Ngrok Demo Mode Integration
**Completed Sessions**: 1

---

## Recommended Next Session

**Session ID**: `phase00-session02-demo-startup-orchestration`
**Session Name**: Demo Startup Orchestration
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: ~18

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 completed (ngrok.yml, detection script exist)
- [x] ngrok CLI configuration infrastructure established

### Dependencies

- **Builds on**: Session 01 (Ngrok Configuration & Detection)
- **Enables**: Session 03 (Dynamic URL Configuration) - requires running tunnels and URL extraction

### Project Progression

Session 02 is the logical next step because it creates the core orchestration layer that ties together all the individual components from Session 01. Without the `demo.sh` script, there's no way to actually run the demo mode. Session 03 (Dynamic URL Configuration) depends on Session 02's URL extraction functionality, and Session 04 (Terminal Output) depends on Session 03's configured URLs. This is a strict sequential dependency chain.

---

## Session Overview

### Objective

Build the main demo startup script that orchestrates frontend, backend, and ngrok processes with proper signal handling and graceful shutdown.

### Key Deliverables

1. `scripts/demo.sh` - Main orchestration script with process management
2. `scripts/ngrok/start-tunnels.sh` - ngrok startup with URL extraction from API
3. `scripts/ngrok/wait-for-tunnels.sh` - Health check for tunnel readiness
4. Updated `package.json` with `npm run demo` script entry

### Scope Summary

- **In Scope (MVP)**: Process orchestration, signal handling, PID tracking, ngrok URL extraction, graceful shutdown sequence, port conflict detection, startup failure handling
- **Out of Scope**: Dynamic CORS/URL injection (Session 03), rich terminal formatting (Session 04), demo card generation (Session 04)

---

## Technical Considerations

### Technologies/Patterns

- Bash scripting with trap-based signal handling (SIGINT, SIGTERM)
- ngrok API (localhost:4041/api/tunnels) for URL extraction
- Process management with PID tracking
- Health check polling for service readiness

### Potential Challenges

- **Process orphaning**: Child processes may not terminate cleanly on Ctrl+C - requires robust PID tracking and cleanup
- **Port conflicts**: Services may fail if ports 8082, 3001, or 4041 are in use - need detection and clear error messages
- **Startup timing**: Backend should only start after ngrok URLs are available for CORS configuration
- **ngrok API timing**: Tunnel URLs may not be immediately available after ngrok starts

### Relevant Considerations

No active concerns or lessons learned in CONSIDERATIONS.md yet - this is early in Phase 00.

---

## Alternative Sessions

If this session is blocked:

1. **Session 03 (Dynamic URL Configuration)** - Cannot proceed without URL extraction from Session 02
2. **Session 04 (Terminal Output & Demo Card)** - Cannot proceed without configured services from Session 03

**Note**: All remaining sessions have strict sequential dependencies. Session 02 must be completed to unblock progress.

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
