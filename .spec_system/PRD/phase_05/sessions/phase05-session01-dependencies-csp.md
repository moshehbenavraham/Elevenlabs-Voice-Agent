# Session 01: Dependencies & CSP Configuration

**Session ID**: `phase05-session01-dependencies-csp`
**Status**: Not Started
**Estimated Tasks**: ~15
**Estimated Duration**: 2-3 hours

---

## Objective

Install Vapi SDK, configure Content Security Policy for Vapi and Daily.co domains, and set up environment variables for the integration.

---

## Scope

### In Scope (MVP)

- Install `@vapi-ai/web` package (v1.0.255+)
- Add Vapi-specific environment variables
- Update CSP in `index.html` for Vapi/Daily.co domains
- Update `.env.example` with new variables
- Document CSP requirements

### Out of Scope

- Backend routes (Vapi uses web token, no backend needed)
- Provider component implementation
- Testing infrastructure

---

## Prerequisites

- [ ] Phase 04 completed
- [ ] Access to Vapi dashboard for web token

---

## Deliverables

1. `@vapi-ai/web` package installed
2. Environment variables added:
   - `VITE_VAPI_ENABLED`
   - `VITE_VAPI_WEB_TOKEN`
   - `VITE_VAPI_API_URL` (optional)
   - `VITE_VAPI_ASSISTANT_ID` (optional)
   - `VITE_VAPI_VOICE`
   - `VITE_VAPI_MODEL`
   - `VITE_VAPI_SYSTEM_PROMPT`
   - `VITE_VAPI_FIRST_MESSAGE`
3. CSP updated in `index.html` to allow:
   - `https://api.vapi.ai`
   - `https://*.vapi.ai`
   - `wss://*.vapi.ai`
   - `https://*.daily.co`
   - `wss://*.daily.co`
   - `https://*.pipecdn.app`
4. Updated `.env.example`

---

## Success Criteria

- [ ] Package installed and importable (`import Vapi from '@vapi-ai/web'`)
- [ ] `CreateAssistantDTO` type importable from `@vapi-ai/web/dist/api`
- [ ] CSP allows all required Vapi/Daily.co domains
- [ ] Environment variables documented in `.env.example`
- [ ] Build passes without errors
