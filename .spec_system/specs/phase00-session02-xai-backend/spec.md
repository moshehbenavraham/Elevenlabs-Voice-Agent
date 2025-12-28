# Session Specification

**Session ID**: `phase00-session02-xai-backend`
**Phase**: 00 - Multi-Provider Voice
**Status**: Implemented
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements the backend infrastructure for xAI voice agent integration. The primary goal is to create an ephemeral token endpoint that enables secure client-to-xAI WebSocket connections without exposing API keys in the browser.

The xAI Realtime API requires a different authentication pattern than ElevenLabs. While ElevenLabs uses signed URLs, xAI uses ephemeral tokens generated server-side. The client requests a short-lived token from our backend, then uses that token to establish a direct WebSocket connection to xAI's servers. This pattern keeps the permanent API key secure on the server while enabling real-time voice communication.

This session is a critical dependency for Session 03 (xAI Frontend). The frontend cannot function without the ephemeral token endpoint created here. The implementation follows existing patterns in `server/index.js` and extends the Express server with a modular route structure.

---

## 2. Objectives

1. Create a POST endpoint `/api/xai/session` that generates ephemeral tokens for xAI WebSocket connections
2. Implement proper error handling that matches existing API response patterns in `server/index.js`
3. Add xAI API key validation to reject requests when server is misconfigured
4. Organize backend routes using a modular file structure (`server/routes/`)

---

## 3. Prerequisites

### Required Sessions
- [x] `phase00-session01-foundation` - Provides provider types, tab system, and base architecture

### Required Tools/Knowledge
- Express.js routing patterns
- xAI Realtime API documentation (ephemeral token flow)
- Fetch API for server-side HTTP requests

### Environment Requirements
- Node.js runtime for Express server
- `XAI_API_KEY` environment variable (already documented in `.env.example`)
- Network access to `https://api.x.ai/v1/realtime/sessions`

---

## 4. Scope

### In Scope (MVP)
- POST `/api/xai/session` endpoint for ephemeral token generation
- Request body support for `instructions` and `voice` parameters
- Error responses for missing API key, xAI API failures, and malformed requests
- Modular route structure with `server/routes/xai.js`
- Integration with existing CORS configuration

### Out of Scope (Deferred)
- Session status/cleanup endpoint - *Reason: Not required for MVP voice functionality*
- Rate limiting - *Reason: Defer to production hardening phase*
- Voice model configuration UI - *Reason: Session 03 scope (frontend)*
- Unit test coverage - *Reason: Manual testing sufficient for MVP; add tests in polish session*

---

## 5. Technical Approach

### Architecture

The implementation extends the existing Express server with a modular route file:

```
server/
  index.js           # Main server - imports and registers xai routes
  routes/
    xai.js           # xAI-specific route handlers
```

The ephemeral token flow:
1. Client sends POST to `/api/xai/session` with optional `expirySeconds`
2. Server validates `XAI_API_KEY` is configured
3. Server calls xAI Realtime API at `https://api.x.ai/v1/realtime/client_secrets`
4. Server extracts `client_secret.value` from response
5. Server returns token and expiresAt to client for WebSocket connection
6. Voice/instructions are configured during WebSocket session.update

### Design Patterns
- **Route Modularization**: Separate route file (`routes/xai.js`) for maintainability and clear separation of provider logic
- **Ephemeral Token Pattern**: Server-side token generation matching xAI's security model (similar to ElevenLabs signed URLs)
- **Consistent Error Handling**: Match existing `{ error, message }` response structure from ElevenLabs endpoint

### Technology Stack
- Express.js 4.x (existing)
- Node.js native fetch (Node 18+)
- dotenv for environment variable management (existing)

---

## 6. Deliverables

### Files to Create
| File | Purpose | Est. Lines |
|------|---------|------------|
| `server/routes/xai.js` | xAI route handlers with ephemeral token endpoint | ~80 |

### Files to Modify
| File | Changes | Est. Lines Changed |
|------|---------|------------|
| `server/index.js` | Import and register xAI routes | ~5 |

---

## 7. Success Criteria

### Functional Requirements
- [ ] POST `/api/xai/session` returns `{ token: "..." }` when API key is valid
- [ ] POST `/api/xai/session` accepts `instructions` and `voice` in request body
- [ ] Endpoint returns 500 with `{ error, message }` when `XAI_API_KEY` is missing
- [ ] Endpoint returns appropriate error when xAI API call fails
- [ ] Server starts without errors when xAI routes are registered

### Testing Requirements
- [ ] Manual testing with curl confirms token generation
- [ ] Error cases tested (missing key, invalid key, xAI API failure)
- [ ] CORS allows requests from frontend origin

### Quality Gates
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] Console logging matches existing `[Server]` prefix pattern
- [ ] No API keys exposed in responses or logs

---

## 8. Implementation Notes

### Key Considerations
- The xAI API response structure is `{ client_secret: { value: "token" } }` - must extract correctly
- Use existing CORS configuration from `server/index.js` - no additional CORS setup needed
- Log request/response at info level following existing `[Server]` pattern
- Default voice to `"verse"` and instructions to a sensible default if not provided

### Potential Challenges
- **xAI API Response Format**: Need to handle potential variations in API response structure; add defensive parsing
- **Network Timeouts**: xAI API may be slow; consider adding timeout to fetch call
- **Error Message Mapping**: Map xAI-specific errors to user-friendly messages

### Relevant Considerations
- **[Active] API Keys**: Must use backend proxy for xAI (ephemeral token pattern); never expose in browser - this session implements this pattern
- **[Lesson] Existing server/index.js**: Already has Express + CORS + dotenv; extend rather than rewrite - following this guidance with modular routes
- **[Lesson] @elevenlabs/react**: Uses signed URL pattern - xAI ephemeral token follows similar security model

### ASCII Reminder
All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Manual Testing
1. Start server: `node server/index.js`
2. Test happy path: `curl -X POST http://localhost:3001/api/xai/session -H "Content-Type: application/json" -d '{"voice":"verse"}'`
3. Test custom instructions: `curl -X POST http://localhost:3001/api/xai/session -H "Content-Type: application/json" -d '{"instructions":"Be concise","voice":"ash"}'`
4. Test missing API key: Temporarily remove `XAI_API_KEY` from `.env`
5. Test invalid API key: Set `XAI_API_KEY` to invalid value

### Edge Cases
- Empty request body (should use defaults)
- Missing `XAI_API_KEY` environment variable
- Invalid `XAI_API_KEY` (xAI returns 401/403)
- xAI API timeout or network failure
- Malformed JSON in request body

---

## 10. Dependencies

### External Libraries
- express: ^4.x (existing)
- cors: ^2.x (existing)
- dotenv: ^16.x (existing)

### Other Sessions
- **Depends on**: `phase00-session01-foundation` (completed)
- **Depended by**: `phase00-session03-xai-frontend` (requires this endpoint)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
