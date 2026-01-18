# Session 03: Dynamic URL Configuration

**Session ID**: `phase00-session03-dynamic-url-configuration`
**Status**: Not Started
**Estimated Tasks**: ~14
**Estimated Duration**: 2-3 hours

---

## Objective

Implement dynamic configuration injection so the backend CORS origin and frontend API base URL are automatically updated based on ngrok tunnel URLs at startup.

---

## Scope

### In Scope (MVP)

- Parse ngrok tunnel URLs from ngrok API response
- Inject frontend tunnel URL into backend CORS_ORIGIN dynamically
- Inject backend tunnel URL into frontend VITE_API_BASE_URL
- Create environment override mechanism for demo mode
- Ensure WebSocket connections work through ngrok tunnels
- Validate CORS configuration with test request
- Handle URL parsing edge cases (trailing slashes, protocol normalization)

### Out of Scope

- Webhook URL auto-configuration for voice providers (deferred)
- Persistent URL storage (URLs are ephemeral per session)
- Terminal output formatting (Session 04)

---

## Prerequisites

- [ ] Session 02 completed (demo.sh starts services, extracts URLs)
- [ ] ngrok tunnels starting and URLs accessible via API

---

## Deliverables

1. `scripts/ngrok/configure-urls.sh` - URL extraction and configuration script
2. Updated `server/index.js` to accept dynamic CORS origin
3. Frontend configuration mechanism for dynamic API base URL
4. Validation script to test CORS and connectivity

---

## Success Criteria

- [ ] Backend CORS allows requests from ngrok frontend URL
- [ ] Frontend makes API calls to ngrok backend URL (not localhost)
- [ ] Voice provider WebSocket connections work through ngrok
- [ ] Configuration is ephemeral (resets on restart)
- [ ] No hardcoded URLs remain in demo mode
- [ ] URL injection happens before services accept connections
