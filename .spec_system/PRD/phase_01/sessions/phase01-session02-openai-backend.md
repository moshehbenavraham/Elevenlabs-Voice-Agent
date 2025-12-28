# Session 02: OpenAI Backend Integration

**Session ID**: `phase01-session02-openai-backend`
**Status**: Not Started
**Estimated Tasks**: ~20-25
**Estimated Duration**: 2-4 hours

---

## Objective

Implement the backend ephemeral token endpoint for OpenAI Realtime API, following the established pattern from xAI integration.

---

## Scope

### In Scope (MVP)

- Create `server/routes/openai.js` with session endpoint
- Implement `/api/openai/session` POST endpoint
- Handle OpenAI API key securely (server-side only)
- Generate ephemeral tokens for client WebSocket connection
- Add environment variable validation for `OPENAI_API_KEY`
- Register routes in `server/index.js`
- Update `.env.example` with OpenAI variables

### Out of Scope

- Frontend integration (Session 03)
- Advanced configuration options
- Token caching/refresh logic

---

## Prerequisites

- [ ] Session 01 research completed
- [ ] OpenAI API key obtained
- [ ] Understanding of OpenAI token/session pattern from research

---

## Deliverables

1. `server/routes/openai.js` - OpenAI route handlers
2. `/api/openai/session` endpoint working
3. Environment variable handling
4. Updated `.env.example`
5. Backend error handling for OpenAI-specific errors

---

## Success Criteria

- [ ] Endpoint returns valid ephemeral token
- [ ] API key never exposed to client
- [ ] Error responses match existing pattern
- [ ] Server starts without errors with/without OPENAI_API_KEY
- [ ] Endpoint documented in server health check or similar
