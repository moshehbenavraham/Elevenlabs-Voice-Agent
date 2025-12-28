# Task Checklist

**Session ID**: `phase00-session02-xai-backend`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-28

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0002]` = Session reference (Phase 00, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Setup | 3 | 3 | 0 |
| Foundation | 5 | 5 | 0 |
| Implementation | 8 | 8 | 0 |
| Testing | 4 | 4 | 0 |
| **Total** | **20** | **20** | **0** |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0002] Verify prerequisites - confirm session01 completed and server runs (`server/index.js`)
- [x] T002 [S0002] Create routes directory structure (`server/routes/`)
- [x] T003 [S0002] Verify XAI_API_KEY environment variable is documented (`.env.example`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0002] Create xai.js route file with Express Router boilerplate (`server/routes/xai.js`)
- [x] T005 [S0002] Define default configuration constants for token expiry (`server/routes/xai.js`)
- [x] T006 [S0002] Create API key validation helper function (`server/routes/xai.js`)
- [x] T007 [S0002] Create xAI API request helper function (`server/routes/xai.js`)
- [x] T008 [S0002] Export router and register routes in main server (`server/index.js`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0002] Implement POST /api/xai/session route handler skeleton (`server/routes/xai.js`)
- [x] T010 [S0002] Add request body parsing for expirySeconds parameter (`server/routes/xai.js`)
- [x] T011 [S0002] Implement API key validation with 500 error response (`server/routes/xai.js`)
- [x] T012 [S0002] Implement xAI ephemeral token API call with fetch (`server/routes/xai.js`)
- [x] T013 [S0002] Add response parsing to extract client_secret.value token (`server/routes/xai.js`)
- [x] T014 [S0002] Implement success response returning token to client (`server/routes/xai.js`)
- [x] T015 [S0002] Add error handling for xAI API failures (401, 403, network, timeout) (`server/routes/xai.js`)
- [x] T016 [S0002] Add console logging following [Server] prefix pattern (`server/routes/xai.js`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0002] [P] Manual test - happy path with valid API key (curl command)
- [x] T018 [S0002] [P] Manual test - error case with missing XAI_API_KEY
- [x] T019 [S0002] [P] Manual test - error case with invalid API key
- [x] T020 [S0002] Validate ASCII encoding and Unix LF line endings on all created files

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] Server starts without errors
- [x] Ephemeral token endpoint returns valid tokens (with valid API key)
- [x] Error cases return proper `{ error, message }` format
- [x] All files ASCII-encoded with Unix LF line endings
- [x] Console logging uses `[Server]` prefix pattern
- [x] No API keys exposed in responses or logs
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization
Tasks T017-T019 (manual testing) can be run simultaneously with different terminal windows.

### Task Timing
Target ~20-25 minutes per task.

### Dependencies
- T001-T003 must complete before T004
- T004-T007 must complete before T008
- T008 must complete before T009
- T009-T016 are sequential (building the endpoint incrementally)
- T017-T019 can run in parallel after T016

### xAI API Details (Updated)
- Endpoint: `https://api.x.ai/v1/realtime/client_secrets`
- Method: POST
- Headers: `Authorization: Bearer {XAI_API_KEY}`, `Content-Type: application/json`
- Body: `{ "expires_after": { "seconds": 300 } }`
- Response: `{ "client_secret": { "value": "token" } }`

Note: Voice and instructions are configured during WebSocket session.update, not during token creation.

### Curl Commands for Testing

Happy path (with valid XAI_API_KEY):
```bash
curl -X POST http://localhost:3001/api/xai/session \
  -H "Content-Type: application/json" \
  -d '{}'
```

Custom expiry:
```bash
curl -X POST http://localhost:3001/api/xai/session \
  -H "Content-Type: application/json" \
  -d '{"expirySeconds": 600}'
```

---

## Session Complete

All 20 tasks completed. Run `/validate` to verify session completeness.
