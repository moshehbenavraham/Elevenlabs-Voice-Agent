# Session Specification

**Session ID**: `phase00-session03-dynamic-url-configuration`
**Phase**: 00 - Ngrok Demo Mode Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session implements the critical configuration layer that bridges ngrok tunnels with the application services. Sessions 01-02 established ngrok configuration/detection and demo orchestration with URL extraction - now Session 03 makes those tunnels functional by dynamically injecting the URLs into the backend CORS configuration and frontend API base URL.

The core challenge is timing: Vite environment variables (`VITE_*`) are typically baked in at build time, not runtime. This session implements a runtime injection strategy that configures services after ngrok URLs are known but before they begin accepting connections. The backend must accept the ngrok frontend URL as a valid CORS origin, and the frontend must route API calls through the ngrok backend tunnel instead of localhost.

Without this session, demo mode would start tunnels and services, but CORS errors would block all API calls and the frontend would still call localhost:3001 instead of the public ngrok URL. This session is the essential link between "tunnels exist" and "the app works through tunnels."

---

## 2. Objectives

1. Create `scripts/ngrok/configure-urls.sh` that extracts ngrok URLs and generates runtime configuration
2. Update `server/index.js` to accept dynamic CORS origin from demo mode environment
3. Implement frontend runtime configuration that overrides build-time `VITE_API_BASE_URL`
4. Integrate URL configuration into `demo.sh` startup sequence with proper ordering

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-ngrok-configuration-detection` - ngrok.yml config, detect-ngrok.sh, install-instructions.sh
- [x] `phase00-session02-demo-startup-orchestration` - demo.sh orchestrator, start-tunnels.sh, wait-for-tunnels.sh with URL extraction

### Required Tools/Knowledge

- Bash scripting (URL parsing, environment injection)
- Express.js CORS configuration (dynamic origin arrays)
- Vite runtime configuration patterns (window injection vs build-time env)
- jq for JSON parsing (ngrok API response)

### Environment Requirements

- ngrok CLI installed and authenticated (`NGROK_AUTHTOKEN`)
- Node.js 18+ with npm
- Working local dev environment (`npm run dev:start` passes)

---

## 4. Scope

### In Scope (MVP)

- Parse ngrok tunnel URLs from ngrok API at `localhost:4041/api/tunnels`
- Inject frontend ngrok URL into backend CORS_ORIGIN dynamically at startup
- Implement frontend runtime API base URL override (window-based injection)
- Create validation script to test CORS and connectivity through tunnels
- Handle URL edge cases: trailing slashes, https:// protocol normalization
- Update demo.sh to call configure-urls.sh with proper service restart sequencing

### Out of Scope (Deferred)

- Webhook URL auto-configuration for voice providers - _Reason: Requires provider-specific dashboard APIs; separate feature_
- Persistent URL storage across sessions - _Reason: URLs are ephemeral by design with free ngrok_
- Terminal output formatting and demo card - _Reason: Session 04 scope_
- Custom domain support for frontend routing - _Reason: Works automatically once base URL injection works_

---

## 5. Technical Approach

### Architecture

```
demo.sh (orchestrator)
    |
    +-- start_ngrok()
    |       |-- start-tunnels.sh
    |       |-- wait-for-tunnels.sh -> FRONTEND_URL, BACKEND_URL
    |
    +-- configure_urls()  [NEW]
    |       |-- configure-urls.sh
    |           |-- Generate server/.env.demo with CORS_ORIGIN
    |           |-- Generate public/config.js with window.__DEMO_CONFIG__
    |
    +-- start_frontend()  [modified: loads config.js]
    +-- start_backend()   [modified: loads .env.demo]
    +-- validate_cors()   [NEW]
            |-- validate-cors.sh (test request through tunnels)
```

### Design Patterns

- **Runtime Configuration Injection**: Generate config files after URLs are known, before services start
- **Environment Layering**: Server loads `.env.demo` on top of `.env` in demo mode
- **Window Config Pattern**: Frontend loads `config.js` that sets `window.__DEMO_CONFIG__` before React hydrates
- **Graceful Degradation**: If config.js missing, fall back to `VITE_API_BASE_URL` (localhost)

### Technology Stack

- Bash 4+ for scripting (associative arrays, parameter expansion)
- jq for JSON parsing (ngrok API tunnels response)
- Express.js CORS middleware with dynamic origin callback
- Vite with runtime config via public/config.js

---

## 6. Deliverables

### Files to Create

| File                              | Purpose                                    | Est. Lines |
| --------------------------------- | ------------------------------------------ | ---------- |
| `scripts/ngrok/configure-urls.sh` | Extract URLs, generate runtime configs     | ~120       |
| `scripts/ngrok/validate-cors.sh`  | Test CORS and connectivity through tunnels | ~80        |
| `public/config.template.js`       | Template for runtime frontend config       | ~15        |

### Files to Modify

| File                           | Changes                                                 | Est. Lines |
| ------------------------------ | ------------------------------------------------------- | ---------- |
| `server/index.js`              | Add dynamic CORS origin support for demo mode           | ~25        |
| `scripts/demo.sh`              | Integrate configure_urls() and validate_cors() steps    | ~40        |
| `src/contexts/*.tsx` (6 files) | Read from window.**DEMO_CONFIG** before import.meta.env | ~5 each    |
| `.gitignore`                   | Add server/.env.demo, public/config.js                  | ~3         |
| `.env.example`                 | Document DEMO_MODE variable                             | ~5         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `npm run demo` starts all services with ngrok URLs configured
- [ ] Backend CORS allows requests from ngrok frontend URL (no CORS errors)
- [ ] Frontend makes API calls to ngrok backend URL (not localhost)
- [ ] All 6 voice provider contexts use the dynamic API base URL
- [ ] Health check at `<ngrok-backend>/api/health` returns 200 from external network
- [ ] Configuration is ephemeral (deleted on shutdown, not committed to git)

### Testing Requirements

- [ ] validate-cors.sh passes after demo startup
- [ ] Manual test: access frontend via ngrok URL, make API call, verify no CORS error
- [ ] Manual test: voice provider connection works through ngrok tunnels

### Quality Gates

- [ ] All files ASCII-encoded (no unicode in shell scripts)
- [ ] Unix LF line endings
- [ ] Shell scripts pass shellcheck
- [ ] Code follows project conventions (kebab-case files, SCREAMING_SNAKE for env vars)
- [ ] No hardcoded localhost URLs in demo mode code paths

---

## 8. Implementation Notes

### Key Considerations

- **Service restart ordering**: Backend must restart after CORS_ORIGIN is set, before frontend makes requests
- **Vite HMR**: In dev mode, Vite hot-reloads; ensure config.js is served and not cached
- **Protocol handling**: ngrok always uses HTTPS; ensure no http:// URLs leak through
- **Cleanup on exit**: demo.sh must delete generated config files in cleanup() trap

### Potential Challenges

- **Vite caching**: May need cache-busting query param on config.js or disable in dev
  - _Mitigation_: Use timestamp query param, configure Vite to not cache public/config.js
- **CORS preflight**: OPTIONS requests need same origin handling
  - _Mitigation_: Express cors() middleware handles this automatically
- **Window config timing**: config.js must execute before React contexts initialize
  - _Mitigation_: Script tag in index.html head, before React bundle
- **jq availability**: Not installed by default on all systems
  - _Mitigation_: Check for jq in configure-urls.sh, provide install instruction or grep fallback

### Relevant Considerations

<!-- From CONSIDERATIONS.md - no active concerns affect this session -->

_No active concerns from CONSIDERATIONS.md apply to this session._

### ASCII Reminder

All output files must use ASCII-only characters (0-127). No smart quotes, em-dashes, or non-ASCII symbols in shell scripts or generated configs.

---

## 9. Testing Strategy

### Unit Tests

- N/A for bash scripts (integration testing preferred)

### Integration Tests

- validate-cors.sh performs end-to-end CORS validation
- Health check endpoint test through ngrok tunnel

### Manual Testing

1. Run `npm run demo`
2. Wait for "Demo Mode Active" output
3. Copy frontend ngrok URL to browser (external device or incognito)
4. Click a voice provider tab
5. Verify no CORS errors in browser console
6. Start a voice session (requires provider API key)
7. Ctrl+C to stop - verify cleanup deletes generated files

### Edge Cases

- ngrok tunnel URL changes mid-session (rare but possible with free tier)
- config.js served from cache after URL change
- Backend started before config generated (race condition)
- jq not installed on system

---

## 10. Dependencies

### External Libraries

- jq: JSON parsing (recommended but with fallback)
- curl: HTTP requests for validation

### Other Sessions

- **Depends on**: phase00-session01, phase00-session02 (both completed)
- **Depended by**: phase00-session04 (Terminal Output & Demo Card displays these URLs)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
