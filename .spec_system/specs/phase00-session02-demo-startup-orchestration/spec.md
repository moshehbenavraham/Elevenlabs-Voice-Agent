# Session Specification

**Session ID**: `phase00-session02-demo-startup-orchestration`
**Phase**: 00 - Ngrok Demo Mode Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session builds the core orchestration layer that brings together all ngrok demo mode components into a single, easy-to-use command. The `scripts/demo.sh` script will manage the complete lifecycle of frontend, backend, and ngrok tunnel processes, providing a seamless developer experience for running and sharing demos.

The orchestration script is the critical centerpiece of the ngrok demo mode feature. Without it, users would need to manually start each process in separate terminals, extract tunnel URLs by hand, and struggle with proper shutdown sequencing. This session transforms a fragmented manual process into a single `npm run demo` command.

This session builds directly on Session 01's ngrok configuration and detection infrastructure. The detection script will be used to verify ngrok availability before starting, and the ngrok.yml configuration defines the tunnel structure. Session 03 (Dynamic URL Configuration) depends on this session's URL extraction functionality to inject tunnel URLs into the running services.

---

## 2. Objectives

1. Create a main orchestration script (`demo.sh`) that starts and manages all demo processes with a single command
2. Implement robust process lifecycle management with PID tracking and trap-based signal handling
3. Build ngrok tunnel startup utilities with URL extraction from the ngrok API
4. Add `npm run demo` script to package.json for developer convenience

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-ngrok-configuration-detection` - Provides ngrok.yml config, detect-ngrok.sh, install-instructions.sh

### Required Tools/Knowledge

- Bash scripting with trap, wait, and process management
- ngrok CLI and API (localhost:4041/api/tunnels)
- curl/jq for API interaction
- Understanding of POSIX signals (SIGINT, SIGTERM)

### Environment Requirements

- ngrok CLI installed and authenticated (verified by detect-ngrok.sh)
- Node.js and npm installed (for frontend/backend)
- Ports 8082, 3001, and 4041 available

---

## 4. Scope

### In Scope (MVP)

- Main `scripts/demo.sh` orchestration script with process management
- `scripts/ngrok/start-tunnels.sh` for ngrok startup with URL extraction
- `scripts/ngrok/wait-for-tunnels.sh` for health check polling
- Trap-based signal handling for SIGINT (Ctrl+C) and SIGTERM
- PID tracking for all child processes (ngrok, frontend, backend)
- Graceful shutdown sequence (reverse order: frontend -> backend -> ngrok)
- Port conflict detection before starting services
- Startup failure handling with clear error messages
- npm script entry `npm run demo`

### Out of Scope (Deferred)

- Dynamic CORS/URL injection into running services - _Reason: Session 03 scope_
- Rich terminal formatting with colors/boxes - _Reason: Session 04 scope_
- Demo card generation with QR codes - _Reason: Session 04 scope_
- Password protection UI prompts - _Reason: Future enhancement_

---

## 5. Technical Approach

### Architecture

The orchestration follows a layered startup model:

```
demo.sh (main orchestrator)
    |
    +-- detect-ngrok.sh (prereq check)
    |
    +-- start-tunnels.sh (ngrok process)
    |       |
    |       +-- wait-for-tunnels.sh (health check)
    |       |
    |       +-- Extract URLs from API
    |
    +-- npm run dev (frontend on 8082)
    |
    +-- npm run server (backend on 3001)
    |
    +-- Wait for all processes
    |
    +-- Trap handlers for cleanup
```

Process management uses a PID array to track all spawned processes. On signal receipt, the cleanup function iterates through PIDs in reverse order (LIFO) to ensure dependent processes shut down before their dependencies.

### Design Patterns

- **Process Supervisor**: Main script acts as supervisor, tracking and managing child processes
- **Health Check Polling**: wait-for-tunnels.sh polls ngrok API until tunnels are ready
- **Graceful Degradation**: Each startup step validates prerequisites before proceeding
- **LIFO Shutdown**: Processes shut down in reverse start order for clean termination

### Technology Stack

- Bash 4+ with `set -euo pipefail` strict mode
- curl for HTTP requests to ngrok API
- jq for JSON parsing (with fallback grep/sed for systems without jq)
- Standard POSIX utilities (kill, wait, trap, sleep)

---

## 6. Deliverables

### Files to Create

| File                                | Purpose                             | Est. Lines |
| ----------------------------------- | ----------------------------------- | ---------- |
| `scripts/demo.sh`                   | Main orchestration script           | ~180       |
| `scripts/ngrok/start-tunnels.sh`    | Start ngrok and extract URLs        | ~100       |
| `scripts/ngrok/wait-for-tunnels.sh` | Poll ngrok API for tunnel readiness | ~70        |

### Files to Modify

| File           | Changes                 | Est. Lines |
| -------------- | ----------------------- | ---------- |
| `package.json` | Add `demo` script entry | ~2         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `npm run demo` starts ngrok, frontend, and backend processes
- [ ] Script extracts frontend and backend tunnel URLs from ngrok API
- [ ] URLs are printed to stdout for user visibility
- [ ] Ctrl+C terminates all processes cleanly (no orphaned processes)
- [ ] Script verifies ngrok installation before starting (uses detect-ngrok.sh)
- [ ] Script fails gracefully if ports 8082, 3001, or 4041 are in use
- [ ] Backend starts only after ngrok URLs are extracted and available
- [ ] All spawned PIDs are tracked and killed on shutdown

### Testing Requirements

- [ ] Manual testing of full startup sequence
- [ ] Manual testing of Ctrl+C shutdown (verify no orphans with `ps aux | grep`)
- [ ] Manual testing with ngrok not installed (shows install instructions)
- [ ] Manual testing with port already in use (shows clear error)
- [ ] Manual testing with ngrok not authenticated (shows auth instructions)

### Quality Gates

- [ ] All shell scripts pass shellcheck (no warnings)
- [ ] All files ASCII-encoded (no unicode characters)
- [ ] Unix LF line endings on all scripts
- [ ] Scripts are executable (chmod +x)
- [ ] Scripts have proper shebang (#!/usr/bin/env bash)

---

## 8. Implementation Notes

### Key Considerations

- Use `#!/usr/bin/env bash` for portability across systems
- Use `set -euo pipefail` at script start for strict error handling
- All scripts must handle being run from any working directory (use script-relative paths)
- Color output should be disabled when not running in a terminal (check `[ -t 1 ]`)
- ngrok API endpoint is `http://localhost:4041/api/tunnels` (port from ngrok.yml)

### Potential Challenges

- **Process orphaning**: Child processes may not terminate on Ctrl+C if not properly trapped. Mitigation: Use trap with explicit PID kills, verify with `ps` during testing
- **Port conflicts**: Services fail silently if ports in use. Mitigation: Check port availability with `lsof` or `nc` before starting
- **ngrok API timing**: Tunnel URLs not immediately available after ngrok starts. Mitigation: wait-for-tunnels.sh with exponential backoff polling
- **jq availability**: Not all systems have jq installed. Mitigation: Provide grep/sed fallback for JSON parsing

### Relevant Considerations

No active concerns in CONSIDERATIONS.md yet - this is early in Phase 00. The patterns established in this session will inform future considerations.

### ASCII Reminder

All output files must use ASCII-only characters (0-127). No unicode arrows, checkmarks, or special characters in script output. Use [OK], [ERROR], [WARN] prefixes as established in detect-ngrok.sh.

---

## 9. Testing Strategy

### Unit Tests

- N/A - Shell scripts tested via manual execution and shellcheck

### Integration Tests

- N/A - Covered by manual testing checklist

### Manual Testing

- Start demo mode with `npm run demo`, verify all processes start
- Press Ctrl+C, verify all processes terminate (check with `ps aux | grep -E 'ngrok|node|vite'`)
- Run with ngrok not installed, verify helpful error message
- Run with port 8082 occupied, verify helpful error message
- Run with ngrok not authenticated, verify auth instructions shown

### Edge Cases

- ngrok takes longer than expected to start (timeout handling)
- User double-presses Ctrl+C during shutdown (re-entrancy guard)
- One process fails to start (cleanup other processes, exit with error)
- Network issues prevent ngrok from establishing tunnels

---

## 10. Dependencies

### External Libraries

- ngrok CLI: v3.x (detected by detect-ngrok.sh)
- curl: system utility
- jq: optional JSON parser (fallback to grep/sed if unavailable)

### Other Sessions

- **Depends on**: `phase00-session01-ngrok-configuration-detection` (ngrok.yml, detect-ngrok.sh)
- **Depended by**: `phase00-session03-dynamic-url-configuration` (requires URL extraction)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
