# Session Specification

**Session ID**: `phase04-session02-ultravox-backend`
**Phase**: 04 - Deployment & New Providers
**Status**: Not Started
**Created**: 2025-12-30

---

## 1. Session Overview

This session establishes the backend infrastructure for Ultravox voice provider integration. Ultravox uses a different architecture than xAI/OpenAI - instead of ephemeral tokens, the backend creates a "call" via REST API and returns a `joinUrl` that the frontend SDK uses to connect. This pattern requires a new backend route but keeps API key security on the server.

The session focuses exclusively on backend components: the Express route for call creation, TypeScript type definitions, and environment configuration. This backend-first approach follows the proven 4-session pattern (research -> backend -> frontend -> polish) that achieved ~80% code reuse during OpenAI integration. The API key is already configured in the project `.env` file, enabling immediate development and testing.

By completing this session, the frontend (Session 03) will have a working `/api/ultravox/call` endpoint that returns the `joinUrl` needed for the `ultravox-client` SDK to establish voice connections.

---

## 2. Objectives

1. Create backend endpoint `POST /api/ultravox/call` that creates Ultravox calls and returns `joinUrl`
2. Define TypeScript interfaces for Ultravox API request/response types
3. Configure environment variables (ULTRAVOX_API_KEY, VITE_ULTRAVOX_ENABLED)
4. Update `.env.example` with Ultravox configuration documentation

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session01-coolify-deployment` - Docker production deployment complete

### Required Tools/Knowledge

- Ultravox REST API documentation
- Ultravox Call creation endpoint format
- Existing Express route patterns (openai.js, xai.js)

### Environment Requirements

- Node.js 18+ with Express server running
- ULTRAVOX_API_KEY already configured in `.env`
- Access to Ultravox API (https://api.ultravox.ai)

---

## 4. Scope

### In Scope (MVP)

- Backend route `POST /api/ultravox/call` for call creation
- Health check endpoint `GET /api/ultravox/health`
- TypeScript type definitions for Ultravox API
- Environment variable configuration (server-side and client-side)
- Rate limiting for Ultravox endpoints
- Error handling matching existing provider patterns
- `.env.example` documentation updates

### Out of Scope (Deferred)

- Frontend UltravoxVoiceContext - _Reason: Session 03_
- Frontend provider tab UI - _Reason: Session 03_
- Voice selection configuration - _Reason: Session 03_
- Function calling/tool integration - _Reason: Session 04 or future_
- Reconnection logic - _Reason: SDK handles this internally_

---

## 5. Technical Approach

### Architecture

Ultravox uses a different authentication flow than xAI/OpenAI:

```
[Frontend] --> POST /api/ultravox/call --> [Backend]
                                              |
                                              v
                                      POST https://api.ultravox.ai/api/calls
                                              |
                                              v
                                      { joinUrl: "wss://..." }
                                              |
                                              v
[Frontend] <-- { joinUrl: "..." } <-- [Backend]
                   |
                   v
         ultravoxSession.joinCall(joinUrl)
```

The backend creates a call with configured system prompt and voice, then returns the `joinUrl` for the frontend SDK to connect.

### Design Patterns

- **Route isolation**: Separate `server/routes/ultravox.js` module (matches openai.js, xai.js pattern)
- **Error mapping**: Map Ultravox API errors to user-friendly messages
- **Timeout protection**: AbortController with 30s timeout for API requests
- **Rate limiting**: Apply tokenLimiter to call creation endpoint

### Technology Stack

- Express.js v5 route handler
- Native fetch for Ultravox REST API calls
- TypeScript interfaces in `src/types/ultravox.ts`

---

## 6. Deliverables

### Files to Create

| File                        | Purpose                         | Est. Lines |
| --------------------------- | ------------------------------- | ---------- |
| `server/routes/ultravox.js` | Express route for call creation | ~120       |
| `src/types/ultravox.ts`     | TypeScript type definitions     | ~60        |

### Files to Modify

| File              | Changes                            | Est. Lines |
| ----------------- | ---------------------------------- | ---------- |
| `server/index.js` | Import and mount ultravox routes   | ~10        |
| `.env.example`    | Add Ultravox configuration section | ~25        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `POST /api/ultravox/call` returns valid `joinUrl` from Ultravox API
- [ ] `GET /api/ultravox/health` returns configuration status
- [ ] Error responses match existing provider format (error, message keys)
- [ ] Server logs Ultravox API requests and responses

### Testing Requirements

- [ ] Manual testing with curl/Postman confirms endpoint works
- [ ] Error cases tested (missing API key, invalid request, timeout)
- [ ] Rate limiting verified on call endpoint

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] ESLint passes with no new errors
- [ ] Code follows existing route patterns exactly
- [ ] No API keys exposed to client

---

## 8. Implementation Notes

### Key Considerations

- Ultravox API endpoint: `https://api.ultravox.ai/api/calls` (POST)
- Authorization header: `X-API-Key: {ULTRAVOX_API_KEY}`
- Request body requires `systemPrompt` and optional `voice` configuration
- Response contains `callId` and `joinUrl` - frontend only needs `joinUrl`
- The `joinUrl` is a WebSocket URL that the ultravox-client SDK connects to

### Potential Challenges

- **API format differences**: Ultravox may use different request/response structure than xAI/OpenAI - review docs carefully
- **Voice configuration**: Ultravox voices may have different names/IDs than other providers
- **Error codes**: Ultravox error responses may need custom mapping

### Relevant Considerations

- [P00] **API Keys**: Must use backend proxy; never expose ULTRAVOX_API_KEY in browser
- [P00] **Environment-based feature flags**: VITE_ULTRAVOX_ENABLED pattern matches existing providers
- [P01] **Research-first structure**: Backend before frontend follows proven 4-session pattern
- [P01] **~80% Code Reuse**: Expect similar structure to openai.js route implementation

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Not required for MVP backend route (manual testing sufficient)
- Type definitions will be validated by TypeScript compiler

### Integration Tests

- Manual curl test: `POST /api/ultravox/call` with valid request
- Manual curl test: `GET /api/ultravox/health`
- Verify rate limiting triggers after 10 requests/minute

### Manual Testing

- Start server with `node server/`
- Test health endpoint returns `{ configured: true, provider: "ultravox" }`
- Test call endpoint returns `{ joinUrl: "wss://..." }`
- Test error handling with missing/invalid API key
- Verify server logs show request/response details

### Edge Cases

- Missing ULTRAVOX_API_KEY environment variable
- Ultravox API timeout (>30 seconds)
- Ultravox API rate limit exceeded (429)
- Ultravox service unavailable (5xx)
- Malformed request body

---

## 10. Dependencies

### External Libraries

- None new (uses existing Express, express-rate-limit)

### NPM Packages

- `ultravox-client` - Will be needed for Session 03, can install now or defer

### Other Sessions

- **Depends on**: `phase04-session01-coolify-deployment` (Docker infrastructure)
- **Depended by**: `phase04-session03-ultravox-frontend` (Context & Provider UI)

---

## Ultravox API Reference

### Create Call Endpoint

```
POST https://api.ultravox.ai/api/calls
Headers:
  X-API-Key: {ULTRAVOX_API_KEY}
  Content-Type: application/json

Body:
{
  "systemPrompt": "You are a helpful voice assistant...",
  "voice": "Mark",  // Optional, Ultravox default voice
  "model": "fixie-ai/ultravox"  // Optional
}

Response:
{
  "callId": "uuid-string",
  "joinUrl": "wss://..."
}
```

### Available Voices (from documentation)

- Mark (default)
- Additional voices TBD during implementation

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
