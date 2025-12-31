# Session 01: Dependencies & Backend Setup

**Session ID**: `phase06-session01-dependencies-backend-setup`
**Status**: Not Started
**Estimated Tasks**: ~12-15
**Estimated Duration**: 2-3 hours

---

## Objective

Install Retell client SDK, create backend endpoint for call registration, and configure all necessary environment variables.

---

## Scope

### In Scope (MVP)

- Install `retell-client-js-sdk` package (v2.0.3+)
- Create `server/routes/retell.ts` backend route
- Implement `POST /api/retell/create-web-call` endpoint
- Add `VITE_RETELL_ENABLED` environment variable
- Add `VITE_RETELL_AGENT_ID` environment variable
- Add `RETELL_API_KEY` backend environment variable
- Register route in `server/index.js`
- Update `.env.example` with new variables
- Update CSP if needed for Retell connections

### Out of Scope

- Frontend hook implementation (Session 02)
- Provider component and tab integration (Session 03)
- Tests and documentation (Session 04)

---

## Prerequisites

- [ ] Retell account created
- [ ] Retell API key obtained
- [ ] Retell Agent created in dashboard
- [ ] Backend server infrastructure working

---

## Deliverables

1. `retell-client-js-sdk` package installed
2. `server/routes/retell.ts` - Backend route with token generation
3. Updated `server/index.js` with Retell route registration
4. Updated `.env.example` with Retell variables
5. CSP configuration updated (if required)

---

## Success Criteria

- [ ] Package installed and importable (`retell-client-js-sdk` v2.0.3+)
- [ ] `POST /api/retell/create-web-call` returns `access_token` and `call_id`
- [ ] API key validation works (returns 401 without key)
- [ ] Environment variables documented in `.env.example`
- [ ] Build passes with no errors
- [ ] Lint passes with no new warnings
