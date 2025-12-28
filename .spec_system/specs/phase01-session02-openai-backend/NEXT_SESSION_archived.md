# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 01 - OpenAI Voice Agent
**Completed Sessions**: 5 (Phase 00: 4, Phase 01: 1)

---

## Recommended Next Session

**Session ID**: `phase01-session02-openai-backend`
**Session Name**: OpenAI Backend Integration
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: 20-25

---

## Why This Session Next?

### Prerequisites Met
- [x] Session 01 research completed (phase01-session01-openai-research)
- [x] OpenAI token/session pattern understood from research
- [x] Audio format compatibility confirmed (24kHz, PCM16, base64)
- [x] Existing xAI backend pattern available for reference

### Dependencies
- **Builds on**: phase01-session01-openai-research (completed)
- **Enables**: phase01-session03-openai-frontend (requires backend endpoint)

### Project Progression
This session follows the proven pattern from Phase 00:
1. Research -> 2. Backend -> 3. Frontend -> 4. Polish

The xAI integration (Phase 00) established this flow, and OpenAI follows the same architecture. The backend endpoint must be implemented before the frontend can connect to OpenAI's Realtime API.

---

## Session Overview

### Objective
Implement the backend ephemeral token endpoint for OpenAI Realtime API, following the established pattern from xAI integration.

### Key Deliverables
1. `server/routes/openai.js` - OpenAI route handlers
2. `/api/openai/session` POST endpoint - Returns ephemeral token
3. Environment variable handling for `OPENAI_API_KEY`
4. Updated `.env.example` with OpenAI variables
5. Backend error handling matching existing patterns

### Scope Summary
- **In Scope (MVP)**: Ephemeral token endpoint, secure API key handling, route registration, environment validation
- **Out of Scope**: Frontend integration, token caching/refresh, advanced configuration

---

## Technical Considerations

### Technologies/Patterns
- Express.js route handler (existing pattern in `server/routes/`)
- OpenAI POST /v1/realtime/client_secrets endpoint
- Environment variable validation (OPENAI_API_KEY)

### Potential Challenges
- OpenAI API error response format (may differ from xAI)
- Token expiration handling (document for frontend)

### Relevant Considerations
- [P00] **API Keys**: Must use backend proxy for sensitive credentials. Never expose in browser.
- [P00] **Existing server patterns**: Express + CORS + dotenv already set up in server/index.js - extend rather than rewrite.
- [P01] **OpenAI Realtime API**: Uses ephemeral tokens via POST /v1/realtime/client_secrets. Compatible audio format (24kHz PCM16).

---

## Alternative Sessions

If this session is blocked:
1. **phase01-session03-openai-frontend** - Would require mocking backend; not recommended
2. **phase01-session04-validation** - Cannot proceed without implementation to validate

No viable alternatives - this session is the critical path.

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
