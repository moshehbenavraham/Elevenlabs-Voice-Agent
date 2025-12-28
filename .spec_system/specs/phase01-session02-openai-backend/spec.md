# Session Specification

**Session ID**: `phase01-session02-openai-backend`
**Phase**: 01 - OpenAI Voice Agent
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements the backend ephemeral token endpoint for OpenAI Realtime API integration. The endpoint follows the proven architecture established in Phase 00 with xAI: a secure backend proxy that generates browser-safe ephemeral tokens, ensuring API keys never reach the client.

OpenAI's Realtime API uses the same ephemeral token pattern as xAI, with tokens obtained via POST to `/v1/realtime/client_secrets`. The audio format compatibility (24kHz PCM16 mono base64) means no audio infrastructure changes are needed - only the token generation endpoint.

This session is critical path for Phase 01. The frontend (Session 03) cannot connect to OpenAI's WebSocket without an ephemeral token, making this the next logical step after research completion.

---

## 2. Objectives

1. Create `/api/openai/session` POST endpoint that returns ephemeral tokens for WebSocket authentication
2. Implement secure server-side API key management following established patterns
3. Provide consistent error responses matching existing xAI endpoint format
4. Enable graceful degradation when OPENAI_API_KEY is not configured

---

## 3. Prerequisites

### Required Sessions
- [x] `phase01-session01-openai-research` - Documented OpenAI Realtime API patterns, endpoint URLs, and audio format compatibility

### Required Tools/Knowledge
- OpenAI API key with Realtime API access
- Understanding of ephemeral token pattern from research notes

### Environment Requirements
- Node.js runtime with fetch support
- Express server running (existing infrastructure)
- `.env` file capability (already in place)

---

## 4. Scope

### In Scope (MVP)
- Create `server/routes/openai.js` route handler module
- Implement POST `/api/openai/session` endpoint
- Call OpenAI's POST `https://api.openai.com/v1/realtime/client_secrets` endpoint
- Return ephemeral token and expiration timestamp to client
- Handle OpenAI-specific error codes (401, 403, 429, 5xx)
- Register OpenAI routes in `server/index.js`
- Update `.env.example` with `OPENAI_API_KEY` variable
- Add startup log indicating OpenAI API key status

### Out of Scope (Deferred)
- Frontend WebSocket connection - *Reason: Session 03 scope*
- Token caching/refresh logic - *Reason: Future optimization*
- Model selection via request body - *Reason: Frontend can configure via WebSocket*
- Rate limiting middleware - *Reason: OpenAI handles rate limits*

---

## 5. Technical Approach

### Architecture
```
[Frontend] --> POST /api/openai/session --> [Express Server]
                                                    |
                                                    v
                                        POST /v1/realtime/client_secrets
                                                    |
                                                    v
                                              [OpenAI API]
                                                    |
                                                    v
[Frontend] <-- { token, expiresAt } <-- [Express Server]
```

### Design Patterns
- **Backend Proxy Pattern**: API key stays server-side, ephemeral token returned to client
- **Module Pattern**: Separate route file (`openai.js`) matching existing `xai.js` structure
- **Consistent Error Shape**: All errors return `{ error: string, message: string }`

### Technology Stack
- Express.js Router
- Native fetch API (Node.js 18+)
- dotenv for environment variables

---

## 6. Deliverables

### Files to Create
| File | Purpose | Est. Lines |
|------|---------|------------|
| `server/routes/openai.js` | OpenAI route handler with session endpoint | ~120 |

### Files to Modify
| File | Changes | Est. Lines |
|------|---------|------------|
| `server/index.js` | Import and register OpenAI routes, add startup log | ~5 |
| `.env.example` | Add OPENAI_API_KEY variable | ~2 |

---

## 7. Success Criteria

### Functional Requirements
- [ ] POST `/api/openai/session` returns `{ token: string, expiresAt: string }` on success
- [ ] Endpoint returns 500 with error object when OPENAI_API_KEY missing
- [ ] Endpoint returns appropriate error codes for OpenAI API failures (401, 429, 5xx)
- [ ] Server starts without errors when OPENAI_API_KEY is not set

### Testing Requirements
- [ ] Manual test: Endpoint returns token with valid API key
- [ ] Manual test: Endpoint returns error without API key
- [ ] Manual test: Error response matches xAI endpoint format

### Quality Gates
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (ESLint passes)
- [ ] No API key exposure in client-accessible code
- [ ] Console logging matches existing patterns (`[Server] ...`)

---

## 8. Implementation Notes

### Key Considerations
- OpenAI endpoint: `https://api.openai.com/v1/realtime/client_secrets`
- Request body format: `{ model: "gpt-4o-realtime-preview-2024-12-17" }` (model required)
- Response structure: `{ client_secret: { value: "...", expires_at: ... } }`
- Token expiration: OpenAI controls expiration, extract from response

### Potential Challenges
- **OpenAI response format differences**: OpenAI may structure response differently than xAI. Verify field names during implementation.
- **Model parameter requirement**: OpenAI may require model in request body unlike xAI.

### Relevant Considerations
- [P00] **API Keys**: Must use backend proxy for sensitive credentials. Never expose in browser.
- [P00] **Existing server patterns**: Express + CORS + dotenv already set up in server/index.js - extend rather than rewrite.
- [P01] **OpenAI Realtime API**: Uses ephemeral tokens via POST /v1/realtime/client_secrets. Compatible audio format (24kHz PCM16).

### ASCII Reminder
All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests
- Not required for MVP backend endpoint (manual testing sufficient)

### Integration Tests
- Not in scope for this session

### Manual Testing
1. Start server with OPENAI_API_KEY set
2. POST to `http://localhost:3001/api/openai/session`
3. Verify response contains `token` and `expiresAt` fields
4. Start server without OPENAI_API_KEY
5. Verify POST returns 500 with error message
6. Verify startup log shows "OpenAI API key: No"

### Edge Cases
- Missing API key in environment
- Invalid API key (401 from OpenAI)
- Rate limiting (429 from OpenAI)
- OpenAI service unavailable (5xx)
- Request timeout handling

---

## 10. Dependencies

### External Libraries
- `express`: ^4.21.2 (existing)
- `cors`: ^2.8.5 (existing)
- `dotenv`: ^16.4.7 (existing)

### Other Sessions
- **Depends on**: `phase01-session01-openai-research` (completed)
- **Depended by**: `phase01-session03-openai-frontend` (requires this endpoint)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
