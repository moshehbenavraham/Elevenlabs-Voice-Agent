# Task Checklist

**Session ID**: `phase00-session02-genai-client-backend`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2026-01-18

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0002]` = Session reference (Phase 00, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 6      | 6      | 0         |
| Implementation | 7      | 7      | 0         |
| Testing        | 5      | 5      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0002] Verify prerequisites (Session 01 complete, dependencies installed, GEMINI_API_KEY available)
- [x] T002 [S0002] Create directory structure (`src/lib/gemini/`, `src/lib/gemini/__tests__/`)

---

## Foundation (6 tasks)

Core types, interfaces, and configuration.

- [x] T003 [S0002] [P] Define TypeScript interfaces for Gemini messages and events (`src/lib/gemini/types.ts`)
- [x] T004 [S0002] [P] Define Gemini HD voice configuration with all 30 voices (`src/lib/gemini/config.ts`)
- [x] T005 [S0002] [P] Define GeminiTool interface and getGeminiTools() function (`src/lib/tools/toolDefinitions.ts`)
- [x] T006 [S0002] Define GenAILiveClient class skeleton with EventEmitter3 (`src/lib/gemini/genai-live-client.ts`)
- [x] T007 [S0002] Define GenAILiveClientEvents interface for typed event listeners (`src/lib/gemini/types.ts`)
- [x] T008 [S0002] Define SetupMessage and LiveConnectConstraints types (`src/lib/gemini/types.ts`)

---

## Implementation (7 tasks)

Main feature implementation.

- [x] T009 [S0002] Implement GenAILiveClient.connect() with WebSocket connection logic (`src/lib/gemini/genai-live-client.ts`)
- [x] T010 [S0002] Implement setup message sending after connection established (`src/lib/gemini/genai-live-client.ts`)
- [x] T011 [S0002] Implement WebSocket message parsing and event emission (`src/lib/gemini/genai-live-client.ts`)
- [x] T012 [S0002] Implement sendRealtimeInput() for streaming audio to Gemini (`src/lib/gemini/genai-live-client.ts`)
- [x] T013 [S0002] Implement sendToolResponse() for function calling results (`src/lib/gemini/genai-live-client.ts`)
- [x] T014 [S0002] Create backend token endpoint route file (`server/routes/gemini.js`)
- [x] T015 [S0002] Mount gemini routes and add rate limiting in server index (`server/index.js`)

---

## Testing (5 tasks)

Verification and quality assurance.

- [x] T016 [S0002] [P] Write unit tests for GenAILiveClient event emission (`src/lib/gemini/__tests__/genai-live-client.test.ts`)
- [x] T017 [S0002] [P] Write unit tests for voice config validation (`src/lib/gemini/__tests__/config.test.ts`)
- [x] T018 [S0002] Run full test suite and verify all tests pass
- [x] T019 [S0002] Validate ASCII encoding and lint on all new files
- [x] T020 [S0002] Manual verification: token endpoint returns valid response

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing (`npm run test:run`)
- [x] ESLint passes (`npm run lint`)
- [x] All files ASCII-encoded (characters 0-127 only)
- [x] implementation-notes.md updated with decisions and learnings
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T003, T004, T005 can be implemented simultaneously (independent files).
Tasks T016, T017 can be implemented simultaneously (independent test files).

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T002 must complete before T003-T008 (directories needed)
- T003-T008 must complete before T009-T015 (types needed for implementation)
- T009-T015 must complete before T016-T017 (code needed for tests)
- T016-T017 must complete before T018 (tests need to exist to run)

### Key Implementation Details

- WebSocket URL: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`
- Token passed as URL query parameter (differs from OpenAI protocol array approach)
- Audio format: 16kHz input, 24kHz output (matches Session 01 audioUtils)
- 30 Gemini HD voices to define in config

### Backend Pattern

Follow existing `server/routes/openai.js` pattern:

- validateApiKey() helper function
- Timeout handling with AbortController
- Detailed error mapping for different HTTP status codes
- Export default router

---

## Next Steps

Run `/implement` to begin AI-led implementation.
