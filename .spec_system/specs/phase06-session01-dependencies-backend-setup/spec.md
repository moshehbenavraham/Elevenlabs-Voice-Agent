# Session Specification

**Session ID**: `phase06-session01-dependencies-backend-setup`
**Phase**: 06 - Retell Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This session establishes the foundation for integrating Retell AI as the sixth voice provider in the multi-provider voice agent application. Retell uses a backend-required authentication model where each call requires a server-generated access token, similar to the Ultravox and OpenAI/xAI ephemeral token patterns already implemented.

The session focuses exclusively on infrastructure setup: installing the client SDK, creating the backend endpoint for call registration, and ensuring all environment variables are properly configured. This follows the proven 4-session provider integration pattern (dependencies -> hook -> tab -> polish) that has successfully delivered Ultravox and Vapi integrations.

By the end of this session, the backend will be capable of creating Retell web calls and returning access tokens, ready for the frontend hook implementation in Session 02.

---

## 2. Objectives

1. Install `retell-client-js-sdk` package (v2.0.3+) and verify it is importable in the build
2. Create `server/routes/retell.js` backend route with proper error handling and validation
3. Implement `POST /api/retell/create-web-call` endpoint that returns `access_token` and `call_id`
4. Register the Retell route in `server/index.js` with appropriate rate limiting

---

## 3. Prerequisites

### Required Sessions

- [x] `phase05-session04-validation-polish` - Phase 05 complete, all provider patterns established
- [x] `phase04-session02-ultravox-backend` - Backend token pattern reference implementation

### Required Tools/Knowledge

- Retell account created at https://dashboard.retellai.com/
- Retell API key obtained from dashboard
- Retell Agent created and configured in dashboard
- Node.js/npm for package installation

### Environment Requirements

- Backend Express server running on port 3001
- `.env` file with RETELL_API_KEY configured
- Vite frontend configured for environment variables

---

## 4. Scope

### In Scope (MVP)

- Install `retell-client-js-sdk` package (v2.0.3+)
- Create `server/routes/retell.js` with ES module syntax
- Implement `POST /api/retell/create-web-call` endpoint
- Implement `GET /api/retell/health` endpoint for configuration status
- Add route registration in `server/index.js`
- Apply token rate limiter to `/api/retell/create-web-call`
- Add Retell service to health check endpoint
- Update startup logging to show Retell API key status

### Out of Scope (Deferred)

- Frontend `useRetellVoice` hook - _Reason: Session 02 deliverable_
- `RetellProvider.tsx` UI component - _Reason: Session 03 deliverable_
- Tab integration in `ProviderTabs` - _Reason: Session 03 deliverable_
- Tests and documentation - _Reason: Session 04 deliverable_
- CSP configuration - _Reason: Not required; Retell uses SDK-managed WebRTC connections_

---

## 5. Technical Approach

### Architecture

The backend route follows the established Ultravox pattern: a dedicated route file that validates the API key, calls the Retell REST API to create a web call, and returns the access token to the frontend. The frontend SDK (`retell-client-js-sdk`) uses this token to establish the call via `RetellWebClient.startCall({ accessToken })`.

```
Frontend                    Backend                     Retell API
   |                           |                            |
   |-- POST /api/retell/       |                            |
   |   create-web-call ------->|                            |
   |   { agent_id }            |-- POST /v2/create-web-call |
   |                           |   Bearer RETELL_API_KEY -->|
   |                           |<-- { access_token, call_id }
   |<-- { access_token,        |                            |
   |      call_id }            |                            |
   |                           |                            |
   |-- RetellWebClient.        |                            |
   |   startCall(accessToken)  |                            |
```

### Design Patterns

- **Backend Proxy Pattern**: API key never exposed to browser; backend generates per-call tokens
- **Route Module Pattern**: Dedicated `server/routes/retell.js` following Ultravox structure
- **Validation-First Pattern**: Validate API key before external call, return early on failure
- **Timeout Protection**: AbortController with 30s timeout to prevent hanging requests

### Technology Stack

- `retell-client-js-sdk` v2.0.3+ - Official Retell client SDK
- Express.js Router - Backend route handling
- Native fetch API - Retell REST API calls
- AbortController - Request timeout management

---

## 6. Deliverables

### Files to Create

| File                      | Purpose                                | Est. Lines |
| ------------------------- | -------------------------------------- | ---------- |
| `server/routes/retell.js` | Backend route for Retell call creation | ~120       |

### Files to Modify

| File              | Changes                                                                             | Est. Lines |
| ----------------- | ----------------------------------------------------------------------------------- | ---------- |
| `package.json`    | Add `retell-client-js-sdk` dependency                                               | ~1         |
| `server/index.js` | Import route, add rate limiter, register route, update health check, update logging | ~15        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `npm install` completes without errors
- [ ] `retell-client-js-sdk` v2.0.3+ installed and importable
- [ ] `POST /api/retell/create-web-call` returns `{ access_token, call_id }` with valid API key
- [ ] `POST /api/retell/create-web-call` returns 500 error when RETELL_API_KEY not configured
- [ ] `POST /api/retell/create-web-call` returns proper error for invalid API key (401/403)
- [ ] `GET /api/retell/health` returns `{ configured: true/false, provider: "retell" }`
- [ ] `/api/health` includes Retell in services status
- [ ] Server startup logs show Retell API key status

### Testing Requirements

- [ ] Manual test: `POST /api/retell/create-web-call` with valid agent_id returns access_token
- [ ] Manual test: Endpoint returns error without API key configured
- [ ] Manual test: Health endpoint reflects configuration status

### Quality Gates

- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no new warnings
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] ES module syntax (import/export) used in route file

---

## 8. Implementation Notes

### Key Considerations

- Retell API uses Bearer token auth: `Authorization: Bearer ${RETELL_API_KEY}`
- Endpoint is `https://api.retellai.com/v2/create-web-call`
- Request body requires `agent_id`, optionally accepts `metadata` and `retell_llm_dynamic_variables`
- Response includes `access_token` (for SDK) and `call_id` (for reference)
- Agent ID comes from frontend request, not environment variable (different from ElevenLabs pattern)

### Potential Challenges

- **SDK Compatibility**: Verify `retell-client-js-sdk` works with Vite bundler (reference example uses Create React App)
- **API Key Format**: Retell keys start with `key_` prefix; ensure proper validation
- **Error Response Format**: Map Retell error codes to user-friendly messages

### Relevant Considerations

- [P00] **API Keys**: Must use backend proxy; RETELL_API_KEY never exposed in browser
- [P01] **Research-first 4-session structure**: Following established pattern for provider integration
- [P01] **~80% Code Reuse for New Providers**: Leveraging Ultravox backend route as template

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Deferred to Session 04 (testing/polish phase)

### Integration Tests

- Deferred to Session 04 (testing/polish phase)

### Manual Testing

1. Start backend server with RETELL_API_KEY configured
2. Send POST request to `/api/retell/create-web-call` with `{ "agent_id": "your-agent-id" }`
3. Verify response contains `access_token` and optionally `call_id`
4. Verify `GET /api/retell/health` returns `{ configured: true, provider: "retell" }`
5. Verify `GET /api/health` shows `retell: { configured: true }` in services
6. Test without API key configured - verify 500 error with clear message
7. Test with invalid API key - verify appropriate error response

### Edge Cases

- Missing RETELL_API_KEY environment variable -> 500 with "API key not configured"
- Invalid API key (wrong format) -> 401/403 from Retell API
- Missing agent_id in request body -> 400 with validation error
- Retell API timeout -> 504 with timeout message
- Retell API rate limit -> 429 with rate limit message

---

## 10. Dependencies

### External Libraries

- `retell-client-js-sdk`: ^2.0.3

### Other Sessions

- **Depends on**: phase05-session04-validation-polish (completed)
- **Depended by**: phase06-session02-voice-hook-sdk (frontend hook implementation)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
