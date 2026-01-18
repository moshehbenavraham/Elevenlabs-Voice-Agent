# Session Specification

**Session ID**: `phase00-session02-genai-client-backend`
**Phase**: 00 - Gemini Live Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session creates the foundational WebSocket client layer for Google Gemini Live voice integration. The GenAILiveClient class will serve as the core communication bridge between the browser and Gemini Live API, using the EventEmitter pattern to provide loose coupling with React consumers in subsequent sessions.

The backend token endpoint is equally critical - it implements the ephemeral token security pattern already proven with OpenAI and xAI providers in this codebase. By generating short-lived tokens server-side, we keep the GEMINI_API_KEY secure while enabling browser-based WebSocket connections.

This session is the essential middle layer: Session 01 provided the audio utilities (PCM encoding, AudioRecorder, AudioStreamer), and Session 03 will build the React hook/context that consumes GenAILiveClient. Without this session's WebSocket wrapper and token endpoint, no Gemini Live functionality can work.

---

## 2. Objectives

1. Create GenAILiveClient class with EventEmitter3-based event system for all Gemini Live server message types
2. Implement backend `/api/gemini/token` endpoint with ephemeral token generation and session resumption support
3. Define Gemini voice configuration with all 30 HD voices and model settings
4. Extend existing toolDefinitions.ts with Gemini-compatible function declaration format

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-dependencies-audio-infra` - Provides @google/genai, eventemitter3, audioUtils.ts, AudioRecorder, AudioStreamer

### Required Tools/Knowledge

- Google Gemini Live API documentation
- WebSocket API (browser native)
- EventEmitter3 library patterns
- Express.js routing (existing patterns in server/routes/)

### Environment Requirements

- `GEMINI_API_KEY` environment variable configured on backend
- Node.js 18+ for backend server
- Modern browser with WebSocket support

---

## 4. Scope

### In Scope (MVP)

- GenAILiveClient class with WebSocket connection management
- EventEmitter events: audio, content, toolcall, transcription, interrupted, goAway, setupComplete, error, close
- Setup message with voice, tools, input/output transcription configuration
- sendRealtimeInput method for streaming microphone audio
- sendToolResponse method for function calling results
- Backend token generation endpoint with 30-minute expiry
- Session resumption via liveConnectConstraints
- Voice configuration for all 30 Gemini HD voices
- Gemini-specific tool declaration format
- Unit tests for GenAILiveClient event emission and message handling
- Integration tests for token endpoint

### Out of Scope (Deferred)

- React hook and context - _Reason: Session 03 scope_
- Provider component and UI - _Reason: Session 04 scope_
- E2E browser tests - _Reason: Session 05 scope_
- Screen sharing / video input - _Reason: MVP focuses on voice_

---

## 5. Technical Approach

### Architecture

```
Browser                              Backend                    Gemini Live
  |                                    |                           |
  |--- POST /api/gemini/token -------->|                           |
  |                                    |--- Create Session ------->|
  |<-- { token, expiresAt } -----------|<-- Token + Constraints ---|
  |                                    |                           |
  |==== WebSocket (wss://...) + token auth ======================>|
  |                                    |                           |
  |--- setup { voice, tools, ... } -------------------------------->|
  |<-- setupComplete ------------------------------------------------|
  |                                    |                           |
  |--- realtimeInput { audio } ---------------------------------------->|
  |<-- audio / content / transcription / toolcall <-----------------|
```

The GenAILiveClient encapsulates all WebSocket logic and emits typed events that React consumers will subscribe to. This follows the same pattern as existing providers (OpenAI, xAI) but adapted for Gemini Live's specific message format.

### Design Patterns

- **EventEmitter Pattern**: Decouples WebSocket message handling from React rendering cycle
- **Factory Function**: Token endpoint uses factory pattern for creating configured sessions
- **Adapter Pattern**: Tool definitions adapted to Gemini's function declaration format

### Technology Stack

- **TypeScript**: Strict typing for all interfaces and events
- **EventEmitter3**: Lightweight event emitter (3KB, already installed in Session 01)
- **@google/genai**: GoogleGenAI SDK for token generation (already installed)
- **Express.js**: Backend routing (existing server infrastructure)
- **Vitest**: Unit testing framework (existing test setup)

---

## 6. Deliverables

### Files to Create

| File                                                 | Purpose                                       | Est. Lines |
| ---------------------------------------------------- | --------------------------------------------- | ---------- |
| `src/lib/gemini/genai-live-client.ts`                | WebSocket wrapper with EventEmitter           | ~250       |
| `src/lib/gemini/config.ts`                           | Voice definitions and model configuration     | ~150       |
| `src/lib/gemini/types.ts`                            | TypeScript interfaces for messages and events | ~120       |
| `server/routes/gemini.js`                            | Token generation endpoint                     | ~120       |
| `src/lib/gemini/__tests__/genai-live-client.test.ts` | Unit tests for client                         | ~200       |
| `src/lib/gemini/__tests__/config.test.ts`            | Tests for voice config                        | ~50        |

### Files to Modify

| File                               | Changes                                     | Est. Lines |
| ---------------------------------- | ------------------------------------------- | ---------- |
| `src/lib/tools/toolDefinitions.ts` | Add Gemini tool format and getGeminiTools() | ~40        |
| `server/index.js`                  | Import and mount gemini routes              | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] GenAILiveClient.connect() establishes WebSocket to Gemini Live endpoint
- [ ] Setup message sent automatically after connection with voice/tools/transcription config
- [ ] GenAILiveClient emits 'audio' event with base64 PCM data on server audio
- [ ] GenAILiveClient emits 'content' event on text content from server
- [ ] GenAILiveClient emits 'toolcall' event with function name and arguments
- [ ] GenAILiveClient emits 'transcription' event for both user and model transcripts
- [ ] GenAILiveClient emits 'interrupted' event on barge-in detection
- [ ] GenAILiveClient emits 'goAway' event and handles graceful disconnect
- [ ] sendRealtimeInput correctly formats base64 audio for Gemini protocol
- [ ] sendToolResponse sends function results in Gemini format
- [ ] Token endpoint returns valid ephemeral token with expiresAt timestamp
- [ ] Token includes sessionResumption enabled in liveConnectConstraints
- [ ] All 30 HD voices defined and selectable via config

### Testing Requirements

- [ ] Unit tests for GenAILiveClient message parsing (all event types)
- [ ] Unit tests for sendRealtimeInput audio formatting
- [ ] Unit tests for sendToolResponse message structure
- [ ] Unit tests for config voice validation
- [ ] Integration tests for token endpoint (success and error cases)

### Quality Gates

- [ ] TypeScript compilation succeeds with strict mode
- [ ] ESLint passes with no errors (warnings acceptable per MVP config)
- [ ] All unit tests pass
- [ ] All files use ASCII-only characters (0-127)
- [ ] Unix LF line endings throughout

---

## 8. Implementation Notes

### Key Considerations

- Gemini Live uses different message types than OpenAI/xAI - parse carefully
- WebSocket connection URL format: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`
- Token goes in URL query parameter, not protocol array (differs from OpenAI)
- Audio format: 16kHz input, 24kHz output (matching Session 01 audioUtils)

### Potential Challenges

- **Message Type Parsing**: Gemini sends serverContent, toolCall, setupComplete etc. in different structures - robust type guards needed
- **goAway Handling**: Server sends goAway when session should end - must emit event and close cleanly
- **Session Resumption**: Token must include correct liveConnectConstraints for resume to work

### Relevant Considerations

- [P00] **Ephemeral token pattern**: Backend generates short-lived tokens - proven with OpenAI/xAI, applying same pattern to Gemini
- [P00] **API Key Security**: GEMINI_API_KEY stays server-side; token endpoint only returns ephemeral client credentials
- [P00] **Provider-specific contexts**: GenAILiveClient designed for consumption by isolated GeminiVoiceContext in Session 03
- [P00] **EventEmitter pattern for WebSocket clients**: Following CONVENTIONS.md guidance for loose coupling

### ASCII Reminder

All output files must use ASCII-only characters (0-127). No smart quotes, em-dashes, or other Unicode.

---

## 9. Testing Strategy

### Unit Tests

- GenAILiveClient event emission for each server message type
- Message parsing with malformed/edge case inputs
- sendRealtimeInput audio encoding validation
- sendToolResponse structure validation
- Voice config lookup and validation
- Tool definition Gemini format conversion

### Integration Tests

- Token endpoint returns 200 with valid token structure
- Token endpoint returns 500 when GEMINI_API_KEY missing
- Token endpoint handles API errors gracefully
- Token endpoint rate limiting (verify tokenLimiter applied)

### Manual Testing

- Connect to Gemini Live via browser WebSocket with generated token
- Verify audio streaming round-trip
- Verify function calling invokes tools and returns results

### Edge Cases

- Empty audio buffer handling in sendRealtimeInput
- WebSocket disconnect during active conversation
- Multiple rapid connect/disconnect cycles
- Tool call with missing or malformed arguments
- Token expiration mid-conversation

---

## 10. Dependencies

### External Libraries

- `@google/genai`: ^1.3.0 (already installed)
- `eventemitter3`: ^5.0.1 (already installed)
- `express`: ^5.0.1 (already installed)
- `vitest`: ^2.1.8 (already installed)

### Other Sessions

- **Depends on**: `phase00-session01-dependencies-audio-infra` (completed)
- **Depended by**: `phase00-session03-voice-hook-context`

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
