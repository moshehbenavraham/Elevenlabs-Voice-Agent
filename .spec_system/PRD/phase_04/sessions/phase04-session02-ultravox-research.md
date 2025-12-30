# Session: Ultravox Research

**Phase**: 04 - Deployment & New Providers
**Session**: 02
**Session ID**: `phase04-session02-ultravox-research`
**Status**: Not Started
**Estimated Tasks**: 12-15
**Estimated Duration**: 2-3 hours

---

## Objective

Research Ultravox.ai Realtime API architecture, authentication patterns, and integration requirements to determine code reuse potential from existing OpenAI/xAI implementations.

---

## Scope

### In Scope (MVP)

- Review Ultravox API documentation and SDK
- Analyze `ultravox-client` npm package capabilities
- Document authentication patterns (session-based vs ephemeral tokens)
- Identify audio format requirements
- Map Ultravox events to existing VoiceProviderState
- Assess code reuse from xAI/OpenAI patterns (~80% expected)
- Review client-side tool registration approach

### Out of Scope

- Implementation code (Session 03)
- UI components (Session 03)
- Performance optimization (Session 04)

---

## Prerequisites

- [x] Phase 03 completed (E2E tests, configuration modal)
- [x] **Ultravox API key already configured** in project `.env` file - ready for immediate testing
- [ ] Access to Ultravox.ai documentation
- [ ] Review of existing xAI/OpenAI implementation patterns

### API Key Status

The project `.env` file already contains a valid Ultravox API key (`ULTRAVOX_API_KEY`). This accelerates research by enabling immediate API testing without account setup delays.

---

## Deliverables

1. **API Analysis Document**: Ultravox API patterns vs existing providers
2. **Type Definitions Draft**: `src/types/ultravox.ts` interface definitions
3. **Integration Checklist**: Required components for Session 03
4. **Audio Format Specification**: PCM requirements (if different from 24kHz/16-bit)
5. **Tool Calling Comparison**: Ultravox client-side tools vs server-side pattern

---

## Research Areas

### 1. Authentication Pattern

Ultravox uses a different pattern from xAI/OpenAI:

- Backend creates "call" via POST /api/calls with API key
- Backend returns `joinUrl` to frontend
- Frontend SDK joins via `session.joinCall(joinUrl)`
- No ephemeral token needed on client side

### 2. SDK Architecture

The `ultravox-client` package provides:

- `UltravoxSession` class for connection management
- Event-driven architecture (status, transcript, experimental_message)
- Built-in audio handling (no manual PCM encoding)
- Client-side tool registration via `registerToolImplementation()`

### 3. Status Mapping

| Ultravox Status | Unified Status | UI Behavior              |
| --------------- | -------------- | ------------------------ |
| disconnected    | idle           | Show connect button      |
| disconnecting   | idle           | Transitioning            |
| connecting      | connecting     | Show spinner             |
| idle            | connected      | Ready state              |
| listening       | connected      | User speaking indicator  |
| thinking        | connected      | Processing indicator     |
| speaking        | connected      | Agent speaking indicator |

### 4. Event Comparison

| Feature    | xAI/OpenAI                   | Ultravox                             |
| ---------- | ---------------------------- | ------------------------------------ |
| Transcript | Manual delta parsing         | SDK event with full transcript array |
| Audio      | Manual PCM encoding/decoding | Handled by SDK                       |
| Tools      | Server-side execution        | Client-side registration             |
| Status     | WebSocket close codes        | SDK status events                    |

---

## Key Questions to Answer

1. **Audio format**: Does Ultravox require same 24kHz/16-bit PCM as xAI/OpenAI?
2. **Voice selection**: What voices are available? Configuration options?
3. **Tool execution**: How does client-side tool return work?
4. **Error handling**: What error events does the SDK emit?
5. **Reconnection**: Does SDK handle reconnection or do we use useReconnection hook?
6. **Microphone control**: How does muteMic/unmuteMic integrate with our UI?

---

## Success Criteria

- [ ] Complete understanding of Ultravox API architecture
- [ ] Type definitions drafted for UltravoxVoiceContext
- [ ] Clear mapping between Ultravox and unified provider interface
- [ ] Integration complexity estimated (hours/effort)
- [ ] Known risks documented with mitigations
- [ ] Code reuse assessment completed (target: 70-80%)

---

## References

- [Ultravox API Documentation](https://docs.ultravox.ai/)
- [ultravox-client npm package](https://www.npmjs.com/package/ultravox-client)
- Master PRD Appendix C: Ultravox SDK Reference
- Existing: `src/contexts/XAIVoiceContext.tsx` (pattern reference)
- Existing: `src/contexts/OpenAIVoiceContext.tsx` (pattern reference)
