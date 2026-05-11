# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 00 - Ngrok Demo Mode Integration
**Completed Sessions**: 2

---

## Recommended Next Session

**Session ID**: `phase00-session03-dynamic-url-configuration`
**Session Name**: Dynamic URL Configuration
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: ~14

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 completed (ngrok configuration and detection)
- [x] Session 02 completed (demo.sh starts services, extracts URLs)
- [x] ngrok tunnels starting and URLs accessible via API

### Dependencies

- **Builds on**: Session 02's demo startup orchestration and URL extraction
- **Enables**: Session 04's terminal output and demo card (which displays configured URLs)

### Project Progression

This session is the natural continuation of the ngrok demo mode implementation. Sessions 01-02 established the foundation (ngrok config, detection, and process orchestration). Now Session 03 makes the tunnels actually useful by dynamically injecting the ngrok URLs into the backend CORS configuration and frontend API base URL. Without this session, the demo would start tunnels but the services wouldn't properly communicate through them.

---

## Session Overview

### Objective

Implement dynamic configuration injection so the backend CORS origin and frontend API base URL are automatically updated based on ngrok tunnel URLs at startup.

### Key Deliverables

1. `scripts/ngrok/configure-urls.sh` - URL extraction and configuration script
2. Updated `server/index.js` to accept dynamic CORS origin
3. Frontend configuration mechanism for dynamic API base URL
4. Validation script to test CORS and connectivity

### Scope Summary

- **In Scope (MVP)**: Parse ngrok URLs from API, inject frontend URL into backend CORS, inject backend URL into frontend API base, validate CORS configuration, handle URL parsing edge cases
- **Out of Scope**: Webhook URL auto-configuration, persistent URL storage, terminal output formatting (Session 04)

---

## Technical Considerations

### Technologies/Patterns

- Bash scripting for URL extraction and environment injection
- ngrok API (`localhost:4041/api/tunnels`) for tunnel URL retrieval
- Express.js CORS configuration (dynamic origin support)
- Vite environment variable injection at build/runtime
- WebSocket proxy considerations for voice providers

### Potential Challenges

- **Timing**: URLs must be injected before services accept connections; may need restart sequence
- **Vite environment variables**: `VITE_*` vars are typically build-time; may need runtime injection strategy
- **WebSocket CORS**: Some voice providers have specific CORS/WebSocket requirements through proxies
- **URL parsing**: Handle trailing slashes, protocol normalization, custom domains

---

## Alternative Sessions

If this session is blocked:

1. **Session 04 (Terminal Output & Demo Card)** - Could start output formatting with placeholder URLs, but limited value without actual URL configuration

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
