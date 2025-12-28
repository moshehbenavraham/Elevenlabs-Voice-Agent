# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 00 - Multi-Provider Voice
**Completed Sessions**: 1

---

## Recommended Next Session

**Session ID**: `phase00-session02-xai-backend`
**Session Name**: xAI Backend Integration
**Estimated Duration**: 2 hours
**Estimated Tasks**: 15-20

---

## Why This Session Next?

### Prerequisites Met
- [x] Session 01 completed (provider types and tab system)
- [x] Existing `server/index.js` Express setup available
- [ ] xAI API key obtained (runtime requirement)

### Dependencies
- **Builds on**: Session 01 Foundation (tab system, provider types)
- **Enables**: Session 03 xAI Frontend (frontend needs backend endpoints)

### Project Progression
Session 02 is the essential backend foundation for xAI integration. The frontend (Session 03) cannot function without the ephemeral token endpoint this session creates. The architecture follows a secure pattern where API keys remain server-side, with the backend generating short-lived tokens for client-to-xAI WebSocket connections.

---

## Session Overview

### Objective
Create the backend infrastructure for xAI voice agent integration by implementing an ephemeral token endpoint that enables secure client-to-xAI WebSocket connections without exposing API keys.

### Key Deliverables
1. **xAI Routes** (`server/routes/xai.js`) - Express routes for xAI session management
2. **Environment Configuration** - `XAI_API_KEY` and `VITE_XAI_ENABLED` variables
3. **Server Integration** - Register routes in `server/index.js` with proper error handling

### Scope Summary
- **In Scope (MVP)**: Ephemeral token endpoint, environment variable handling, basic error responses, CORS configuration
- **Out of Scope**: Session cleanup, rate limiting, voice model configuration UI, frontend integration

---

## Technical Considerations

### Technologies/Patterns
- Express.js routes (extending existing server)
- Ephemeral token pattern (similar to ElevenLabs signed URL)
- xAI Realtime API (`https://api.x.ai/v1/realtime/sessions`)
- Environment-based configuration

### Potential Challenges
1. **xAI API Response Format** - Need to verify exact response structure for ephemeral tokens
2. **Error Handling** - Map xAI API errors to user-friendly responses

### Relevant Considerations
- **[Active]** API Keys: Must use backend proxy for xAI (ephemeral token pattern); never expose in browser
- **[Lesson]** Existing server/index.js: Already has Express + CORS + dotenv; extend rather than rewrite
- **[Lesson]** @elevenlabs/react: Uses signed URL pattern - xAI ephemeral token follows similar security model

---

## Alternative Sessions

If this session is blocked:

1. **phase00-session04-polish** - Could polish existing ElevenLabs implementation if xAI API access is unavailable (not recommended - breaks dependency chain)

Note: Session 03 (xAI Frontend) cannot proceed without Session 02 completing first.

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
