# Task Checklist

**Session ID**: `phase04-session02-ultravox-backend`
**Total Tasks**: 18
**Estimated Duration**: 6-7 hours
**Created**: 2025-12-30

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0402]` = Session reference (Phase 04, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 4      | 4      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0402] Verify prerequisites met (Node.js 18+, server running, ULTRAVOX_API_KEY in .env)
- [x] T002 [S0402] Create route file structure (`server/routes/ultravox.js`)

---

## Foundation (4 tasks)

Core structures and base implementations.

- [x] T003 [S0402] [P] Create TypeScript interfaces for Ultravox API (`src/types/ultravox.ts`)
- [x] T004 [S0402] [P] Define UltravoxCallRequest interface with systemPrompt, voice, model fields
- [x] T005 [S0402] [P] Define UltravoxCallResponse interface with callId, joinUrl fields
- [x] T006 [S0402] Define UltravoxErrorResponse interface matching existing provider error format

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T007 [S0402] Implement validateApiKey helper function (`server/routes/ultravox.js`)
- [x] T008 [S0402] Implement createUltravoxCall function with AbortController timeout (`server/routes/ultravox.js`)
- [x] T009 [S0402] Add X-API-Key header and request body construction for Ultravox API
- [x] T010 [S0402] Implement error mapping (401/403, 429, 5xx) matching openai.js pattern
- [x] T011 [S0402] Implement POST /api/ultravox/call route handler (`server/routes/ultravox.js`)
- [x] T012 [S0402] Implement GET /api/ultravox/health endpoint (`server/routes/ultravox.js`)
- [x] T013 [S0402] Mount ultravox routes in server index with rate limiting (`server/index.js`)
- [x] T014 [S0402] Update .env.example with Ultravox configuration section (`.env.example`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T015 [S0402] Manual test: GET /api/ultravox/health returns configuration status
- [x] T016 [S0402] Manual test: POST /api/ultravox/call returns joinUrl with valid API key
- [x] T017 [S0402] Manual test: Verify error handling (missing API key, timeout, rate limit)
- [x] T018 [S0402] Validate ASCII encoding and ESLint passes on all new/modified files

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

Tasks T003-T005 (TypeScript interfaces) can be worked on simultaneously as they define independent types in the same file.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003-T006 must complete before T007-T012 (types needed for implementation)
- T007-T012 must complete before T013 (routes needed before mounting)
- T013-T014 must complete before T015-T017 (server must be running for manual tests)

### Key Implementation Details

- Ultravox API endpoint: `https://api.ultravox.ai/api/calls`
- Authorization: `X-API-Key` header (not Bearer token)
- Request body: `{ systemPrompt, voice?, model? }`
- Response: `{ callId, joinUrl }` - frontend only needs joinUrl
- Timeout: 30 seconds with AbortController
- Rate limiting: Apply tokenLimiter to /api/ultravox/call endpoint

### Reference Files

- `server/routes/openai.js` - Pattern for route structure, error mapping, timeout
- `server/routes/xai.js` - Alternative pattern reference
- `server/index.js` - Route mounting pattern

---

## Next Steps

Run `/implement` to begin AI-led implementation.
