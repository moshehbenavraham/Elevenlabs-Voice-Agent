# Session 03: Dynamic URL Configuration

**Session ID**: `phase00-session03-dynamic-url-configuration`
**Status**: Not Started
**Estimated Tasks**: ~14
**Estimated Duration**: 2-3 hours

---

## Objective

Implement runtime configuration injection so demo-mode API calls use the same ngrok origin as the frontend.

---

## Scope

### In Scope (MVP)

- Parse ngrok tunnel URLs from ngrok API response
- Generate runtime config for same-origin API calls
- Create environment override mechanism for demo mode
- Ensure WebSocket connections work through the ngrok HTTPS origin
- Retain CORS validation helpers for split-service compatibility checks
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

1. `scripts/ngrok/configure-urls.sh` - Legacy URL extraction and configuration helper
2. Updated `server/index.js` to accept dynamic CORS origin
3. Frontend configuration mechanism for runtime API base URL
4. Validation script to test CORS and connectivity

---

## Success Criteria

- [ ] Frontend makes API calls to the same ngrok origin in demo mode
- [ ] Voice provider WebSocket connections work through ngrok
- [ ] Configuration is ephemeral (resets on restart)
- [ ] No hardcoded URLs remain in demo mode
- [ ] URL injection happens before services accept connections
