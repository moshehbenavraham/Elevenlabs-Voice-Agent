# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 00 - Ngrok Demo Mode Integration
**Completed Sessions**: 0

---

## Recommended Next Session

**Session ID**: `phase00-session01-ngrok-configuration-detection`
**Session Name**: Ngrok Configuration & Detection
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: ~15

---

## Why This Session Next?

### Prerequisites Met

- [x] Local development environment working (`npm run dev:start`)
- [x] Understanding of ngrok YAML configuration syntax (documented in session spec)

### Dependencies

- **Builds on**: Nothing - this is the foundational session for Phase 00
- **Enables**: Session 02 (Demo Startup Orchestration), Session 03 (Dynamic URL Configuration), Session 04 (Terminal Output & Demo Card)

### Project Progression

Session 01 is the logical starting point because it establishes all the foundational infrastructure that the remaining sessions depend on. The ngrok configuration file (`ngrok.yml`) and detection scripts are required before the orchestration script (Session 02) can start tunnels. Without the environment variable definitions, Sessions 03 and 04 cannot configure or display the tunnel URLs. This session creates the building blocks for the entire demo mode feature.

---

## Session Overview

### Objective

Set up the foundational ngrok infrastructure including configuration file, CLI detection, and environment variable support for tunnel customization.

### Key Deliverables

1. `scripts/ngrok/ngrok.yml` - ngrok configuration with dual tunnel definitions (frontend:8082, backend:3001)
2. `scripts/ngrok/detect-ngrok.sh` - CLI detection and version check script
3. Updated `.env.example` with ngrok-related environment variables
4. `scripts/ngrok/install-instructions.sh` - Display platform-appropriate installation guide

### Scope Summary

- **In Scope (MVP)**: ngrok.yml configuration, CLI detection script, environment variables (NGROK_DOMAIN, NGROK_AUTH_USER, NGROK_AUTH_PASS, NGROK_INSPECTOR_PORT), installation instructions display
- **Out of Scope**: Demo orchestration (Session 02), dynamic URL injection (Session 03), terminal formatting (Session 04), automated ngrok installation

---

## Technical Considerations

### Technologies/Patterns

- Bash scripting with POSIX compliance for cross-platform support
- ngrok YAML configuration v2 format
- Environment variable placeholders in ngrok.yml for runtime configuration
- Exit codes for script chaining (0 = success, 1 = not found)

### Potential Challenges

- Cross-platform ngrok detection (different installation paths on Linux/macOS/Windows)
- ngrok.yml syntax for basic auth with environment variable substitution
- Handling custom domain configuration that only works with ngrok paid plans

### Relevant Considerations

_No active concerns in CONSIDERATIONS.md apply to this foundational session._

---

## Alternative Sessions

If this session is blocked:

1. **None applicable** - Session 01 has no blockers as it's the foundational session
2. If ngrok itself is not desired, the entire Phase 00 would need to be reconsidered for alternative tunneling solutions

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
