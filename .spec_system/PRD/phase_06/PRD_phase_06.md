# PRD Phase 06: Retell Voice Agent Integration

**Status**: In Progress
**Sessions**: 4 (initial estimate)

**Progress**: 2/4 sessions (50%)

---

## Overview

Integrate Retell as the sixth voice provider in the multi-provider voice AI agent application. Retell is a voice AI platform that provides a simple event-driven SDK for building conversational voice applications. Unlike Vapi which uses a web token directly, Retell requires backend token generation per-call using the `retell-client-js-sdk` package.

**Key Architecture Differences:**

- Uses **per-call access tokens** (backend generates token for each call)
- Event-driven SDK with `call_started`, `call_ended`, `update`, `error` events
- Agent configuration done in Retell dashboard (not at call time)
- Transcript limited to **last 5 sentences** (must manage history locally)
- Raw audio available via `audio` event (Float32Array PCM data)
- `metadata` event for agent-to-frontend communication

**Reference Implementation:** `RETELL_EXAMPLE/` contains a working React + Express integration.

---

## Progress Tracker

| Session | Name                                 | Status      | Est. Tasks | Validated  |
| ------- | ------------------------------------ | ----------- | ---------- | ---------- |
| 01      | Dependencies & Backend Setup         | Complete    | 25         | 2025-12-31 |
| 02      | Voice Hook & SDK Integration         | Complete    | 18         | 2025-12-31 |
| 03      | Provider Component & Tab Integration | Not Started | ~12-18     | -          |
| 04      | Testing, Polish & Documentation      | Not Started | ~15-20     | -          |

---

## Completed Sessions

### Session 01: Dependencies & Backend Setup

- **Completed**: 2025-12-31
- **Tasks**: 25/25
- **Deliverables**: `server/routes/retell.js`, updated `server/index.js`, `retell-client-js-sdk` dependency
- **Summary**: Installed Retell SDK, created backend `/api/retell/create-web-call` endpoint with proper error handling, validation, rate limiting, and health check integration

### Session 02: Voice Hook & SDK Integration

- **Completed**: 2025-12-31
- **Tasks**: 18/18
- **Deliverables**: `src/types/retell.ts`, `src/hooks/useRetellVoice.ts`
- **Summary**: Created comprehensive TypeScript types and useRetellVoice hook with full SDK event handling, local transcript accumulation (working around SDK's 5-sentence limit), and unified state mapping consistent with other providers

---

## Upcoming Sessions

- Session 03: Provider Component & Tab Integration

---

## Objectives

1. **Primary**: Integrate Retell as a fully functional voice provider with SDK and backend support
2. **Secondary**: Implement local transcript history management (SDK only provides last 5 sentences)
3. **Tertiary**: Add comprehensive tests and documentation for the new provider

---

## Prerequisites

- Phase 05 completed (Vapi integration complete)
- Retell account with API key configured
- Retell Agent ID created in Retell dashboard
- Backend server running for token generation

---

## Technical Considerations

### Architecture

- Backend token generation required (unlike Vapi's frontend-safe web token)
- Event-driven SDK pattern with `RetellWebClient`
- Per-call access tokens with `POST /v2/create-web-call` API
- Local transcript history storage (SDK limitation: only last 5 sentences)

### Technologies

- `retell-client-js-sdk` v2.0.3+ for frontend SDK
- Express.js backend for token generation endpoint
- React hooks for state management (`useRetellVoice`)
- Existing component patterns (VoiceButton, VoiceStatus, ConversationPanel)

### Risks

- **SDK Transcript Limitation**: SDK only provides last 5 sentences; requires local history management
- **Backend Dependency**: Cannot operate without backend (unlike Vapi); ensure proper error handling
- **Agent Dashboard Configuration**: Agent must be pre-configured in Retell dashboard

### Relevant Considerations

- [P00] **API Keys**: Must use backend proxy for Retell API key; never expose in browser
- [P00] **HTTPS Required**: Microphone access requires HTTPS in production
- [P02] **useRef for values in WebSocket handlers**: Avoids stale closures in callbacks
- [P01] **Research-first 4-session structure**: Following established pattern for provider integration
- [P01] **~80% Code Reuse for New Providers**: Leverage existing patterns from Vapi/Ultravox

---

## Success Criteria

Phase complete when:

- [ ] All 4 sessions completed
- [ ] Retell tab functional with start/stop call capability
- [ ] Backend token endpoint working (`POST /api/retell/create-web-call`)
- [ ] Local transcript history maintained properly
- [ ] `isAgentTalking` state reflected in UI
- [ ] All tests passing (unit + integration)
- [ ] Documentation updated (CLAUDE.md, README, .env.example)

---

## Dependencies

### Depends On

- Phase 05: Vapi Voice Agent (complete)
- Existing tab system and provider abstraction
- Backend Express server infrastructure

### Enables

- Phase 07: Google Gemini Integration (planned)
- Complete 6-provider voice AI platform
