# Session Specification

**Session ID**: `phase00-session01-ngrok-configuration-detection`
**Phase**: 00 - Ngrok Demo Mode Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session establishes the foundational ngrok infrastructure for the Voice-Agent-PuPuPlatter demo platform. The primary goal is to enable developers and demo presenters to quickly expose their local development environment to the internet with HTTPS support, making it possible to share voice AI demos with external stakeholders without deploying to a production server.

The deliverables include an ngrok configuration file that defines dual tunnels (one for the Vite frontend on port 8082, one for the Express backend on port 3001), shell scripts for detecting ngrok CLI availability, and environment variable definitions that allow runtime customization of tunnel behavior. This session is the foundation upon which Session 02 (orchestration), Session 03 (dynamic URL configuration), and Session 04 (terminal output) will build.

By the end of this session, a developer will be able to verify that ngrok is properly installed and configured, understand which environment variables control tunnel behavior, and see clear installation instructions if ngrok is not present on their system.

---

## 2. Objectives

1. Create a valid `ngrok.yml` configuration file that defines frontend and backend tunnels with environment variable substitution
2. Create a detection script that reliably checks for ngrok CLI presence across Linux, macOS, and Windows (via WSL/Git Bash)
3. Update `.env.example` with comprehensive ngrok environment variable documentation including basic auth credentials
4. Create platform-appropriate installation instructions that guide users through ngrok setup

---

## 3. Prerequisites

### Required Sessions

- [x] None - this is the foundational session for Phase 00

### Required Tools/Knowledge

- Basic understanding of ngrok YAML configuration format (v2)
- Familiarity with Bash scripting and exit codes
- Understanding of environment variable substitution patterns

### Environment Requirements

- Local development environment working (`npm run dev:start`)
- Bash-compatible shell (Linux/macOS/WSL/Git Bash)
- Internet access for ngrok documentation reference

---

## 4. Scope

### In Scope (MVP)

- Create `scripts/ngrok/ngrok.yml` with dual tunnel definitions (frontend:8082, backend:3001)
- Create `scripts/ngrok/detect-ngrok.sh` with version check and proper exit codes
- Create `scripts/ngrok/install-instructions.sh` with platform detection
- Update `.env.example` with ngrok environment variables (NGROK_AUTHTOKEN, NGROK_DOMAIN, NGROK_AUTH_USER, NGROK_AUTH_PASS, NGROK_INSPECTOR_PORT, NGROK_API_KEY)
- Configure basic auth support via environment variable placeholders
- Configure custom domain support via NGROK_DOMAIN
- Configure inspector port via NGROK_INSPECTOR_PORT (default 4041)

### Out of Scope (Deferred)

- Demo orchestration script - _Reason: Session 02 scope_
- Dynamic URL injection into frontend/backend - _Reason: Session 03 scope_
- Terminal output formatting and demo card display - _Reason: Session 04 scope_
- Automated ngrok installation - _Reason: Platform complexity, user should install manually_
- ngrok account creation or authtoken retrieval automation - _Reason: Requires user interaction with ngrok dashboard_

---

## 5. Technical Approach

### Architecture

The ngrok configuration uses ngrok's YAML v2 format with environment variable substitution. Two named tunnels are defined: `frontend` pointing to localhost:8082 (Vite dev server) and `backend` pointing to localhost:3001 (Express API server). The configuration supports optional features like custom domains (paid plans) and basic auth (password protection for demos).

The detection script uses `command -v` for POSIX-compliant command detection, falling back to `which` where necessary. It outputs the ngrok version on success and returns appropriate exit codes for script chaining.

### Design Patterns

- **Environment Variable Substitution**: ngrok.yml uses `${VAR}` syntax for runtime configuration
- **Exit Code Convention**: 0 = success/found, 1 = not found/error (standard Unix convention)
- **Platform Detection**: `uname` for OS detection, enables platform-specific instructions
- **Fail-Fast Validation**: Scripts check prerequisites before proceeding

### Technology Stack

- Bash 4.0+ (POSIX-compatible subset for broader support)
- ngrok YAML configuration v2 format
- Environment variables loaded via shell or dotenv

---

## 6. Deliverables

### Files to Create

| File                                    | Purpose                                             | Est. Lines |
| --------------------------------------- | --------------------------------------------------- | ---------- |
| `scripts/ngrok/ngrok.yml`               | Dual tunnel configuration with env var substitution | ~35        |
| `scripts/ngrok/detect-ngrok.sh`         | CLI detection with version check                    | ~50        |
| `scripts/ngrok/install-instructions.sh` | Platform-appropriate installation guide             | ~80        |

### Files to Modify

| File           | Changes                                                 | Est. Lines Changed |
| -------------- | ------------------------------------------------------- | ------------------ |
| `.env.example` | Add NGROK_AUTH_USER, NGROK_AUTH_PASS with documentation | ~15                |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `ngrok.yml` defines `frontend` tunnel on port 8082
- [ ] `ngrok.yml` defines `backend` tunnel on port 3001
- [ ] `ngrok.yml` accepts NGROK_DOMAIN for custom domain configuration
- [ ] `ngrok.yml` accepts NGROK_AUTH_USER/NGROK_AUTH_PASS for basic auth
- [ ] `ngrok.yml` accepts NGROK_INSPECTOR_PORT for web inspector port
- [ ] `detect-ngrok.sh` returns exit code 0 when ngrok is installed
- [ ] `detect-ngrok.sh` returns exit code 1 when ngrok is not found
- [ ] `detect-ngrok.sh` outputs ngrok version string on success
- [ ] `install-instructions.sh` detects Linux and shows apt/snap instructions
- [ ] `install-instructions.sh` detects macOS and shows brew instructions
- [ ] `install-instructions.sh` handles Windows/WSL appropriately

### Testing Requirements

- [ ] Manual test: Run `detect-ngrok.sh` on system with ngrok installed
- [ ] Manual test: Run `detect-ngrok.sh` on system without ngrok (or with PATH modified)
- [ ] Manual test: Run `install-instructions.sh` and verify correct platform detection
- [ ] Manual test: Validate `ngrok.yml` syntax with `ngrok config check --config scripts/ngrok/ngrok.yml`

### Quality Gates

- [ ] All shell scripts have executable permission (`chmod +x`)
- [ ] All files use ASCII-only characters (0-127)
- [ ] All files use Unix LF line endings
- [ ] Shell scripts pass `shellcheck` with no errors
- [ ] Code follows project conventions (CONVENTIONS.md)

---

## 8. Implementation Notes

### Key Considerations

- ngrok v3 uses a different YAML format than v2; we target v3 syntax (`version: 2` in config refers to config file version, not ngrok CLI version)
- Custom domains require ngrok paid plans (free tier uses random subdomains)
- Basic auth credentials should never be committed to git (use env vars)
- Inspector web UI defaults to port 4040; we use 4041 to avoid conflicts with other ngrok instances

### Potential Challenges

- **Cross-platform detection**: Windows users may have ngrok in different locations; rely on PATH lookup
  - _Mitigation_: Use `command -v` which works in Git Bash, WSL, and native bash
- **Environment variable syntax**: ngrok uses `${VAR}` but may not support default values like `${VAR:-default}`
  - _Mitigation_: Document required variables clearly; let ngrok fail fast if missing
- **Paid feature detection**: Custom domain only works with paid plans
  - _Mitigation_: Make NGROK_DOMAIN optional; tunnels work without it

### Relevant Considerations

<!-- From CONSIDERATIONS.md - no active concerns apply to this foundational session -->

_No active concerns from CONSIDERATIONS.md apply to this session._

### ASCII Reminder

All output files must use ASCII-only characters (0-127). Avoid smart quotes, em-dashes, and non-ASCII symbols.

---

## 9. Testing Strategy

### Unit Tests

- Not applicable for shell scripts in this project; rely on manual testing and shellcheck

### Integration Tests

- Not applicable for this session; integration with orchestration script is Session 02 scope

### Manual Testing

- Run `./scripts/ngrok/detect-ngrok.sh` with ngrok installed; expect exit 0 and version output
- Run `./scripts/ngrok/detect-ngrok.sh` with ngrok not in PATH; expect exit 1 and error message
- Run `./scripts/ngrok/install-instructions.sh`; verify platform detection matches actual OS
- Run `ngrok config check --config scripts/ngrok/ngrok.yml`; expect validation success
- Test env var substitution: `NGROK_DOMAIN=test.ngrok.dev ngrok config check --config scripts/ngrok/ngrok.yml`

### Edge Cases

- ngrok installed but not authenticated (missing NGROK_AUTHTOKEN)
- ngrok installed via snap (different path on Ubuntu)
- Windows with ngrok in `C:\Program Files\` (accessed via Git Bash)
- Environment variables with special characters (spaces, quotes)

---

## 10. Dependencies

### External Libraries

- ngrok CLI v3.x (user-installed external dependency)

### Other Sessions

- **Depends on**: None
- **Depended by**:
  - Session 02 (Demo Startup Orchestration) - needs ngrok.yml and detect-ngrok.sh
  - Session 03 (Dynamic URL Configuration) - needs environment variable definitions
  - Session 04 (Terminal Output & Demo Card) - needs working tunnel infrastructure

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
