# Task Checklist

**Session ID**: `phase01-session02-openai-backend`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-28

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0102]` = Session reference (Phase 01, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Setup | 3 | 3 | 0 |
| Foundation | 4 | 4 | 0 |
| Implementation | 8 | 8 | 0 |
| Testing | 5 | 5 | 0 |
| **Total** | **20** | **20** | **0** |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0102] Verify prerequisites: Node.js 18+, existing server running (`server/index.js`)
- [x] T002 [S0102] Review xAI route implementation for pattern reference (`server/routes/xai.js`)
- [x] T003 [S0102] Confirm OpenAI Realtime API endpoint URL and request format from research notes

---

## Foundation (4 tasks)

Core structures and base implementations.

- [x] T004 [S0102] Create `server/routes/openai.js` with Router import and module exports
- [x] T005 [S0102] Define OpenAI API constants: URL, timeout, default model (`server/routes/openai.js`)
- [x] T006 [S0102] [P] Create validateApiKey function for OPENAI_API_KEY validation (`server/routes/openai.js`)
- [x] T007 [S0102] [P] Define consistent error response shape matching xAI pattern (`server/routes/openai.js`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T008 [S0102] Implement createEphemeralToken async function structure (`server/routes/openai.js`)
- [x] T009 [S0102] Add AbortController timeout handling (30s) (`server/routes/openai.js`)
- [x] T010 [S0102] Implement fetch request to OpenAI client_secrets endpoint (`server/routes/openai.js`)
- [x] T011 [S0102] Parse OpenAI response: extract client_secret.value and expires_at (`server/routes/openai.js`)
- [x] T012 [S0102] Add error code mapping: 401, 403, 429, 5xx to user-friendly messages (`server/routes/openai.js`)
- [x] T013 [S0102] Implement POST /session route handler (`server/routes/openai.js`)
- [x] T014 [S0102] Import and register OpenAI routes in server (`server/index.js`)
- [x] T015 [S0102] Add OpenAI API key status to server startup log (`server/index.js`)

---

## Testing (5 tasks)

Verification and quality assurance.

- [x] T016 [S0102] Update .env.example with OPENAI_API_KEY variable (`.env.example`)
- [x] T017 [S0102] Manual test: Start server without OPENAI_API_KEY, verify startup log shows "No"
- [x] T018 [S0102] Manual test: POST /api/openai/session without key returns 500 error
- [x] T019 [S0102] Manual test: POST /api/openai/session with valid key returns token + expiresAt
- [x] T020 [S0102] Validate all files ASCII-encoded, Unix LF line endings, ESLint passes

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization
Tasks marked `[P]` can be worked on simultaneously:
- T006 and T007 can be done in parallel (independent validation/error utilities)

### Task Timing
Target ~20-25 minutes per task.

### Dependencies
- T004-T007 must complete before T008-T013
- T014-T015 require T004-T013 to complete
- T016-T020 are verification tasks after implementation

### Key Implementation Details
- OpenAI endpoint: `https://api.openai.com/v1/realtime/client_secrets`
- Request body: `{ model: "gpt-4o-realtime-preview-2024-12-17" }`
- Response: `{ client_secret: { value: "...", expires_at: ... } }`
- Must match xAI route structure for consistency

---

## Next Steps

Run `/validate` to verify session completeness.
