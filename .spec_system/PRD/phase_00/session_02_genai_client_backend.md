# Session 02: GenAI Client & Backend

**Session ID**: `phase00-session02-genai-client-backend`
**Status**: Not Started
**Estimated Tasks**: ~18
**Estimated Duration**: 2-4 hours

---

## Objective

Create the GenAILiveClient WebSocket wrapper with EventEmitter pattern and implement the backend token generation endpoint with proper security.

---

## Scope

### In Scope (MVP)

- Create GenAILiveClient class with EventEmitter pattern
- Implement WebSocket connection to Gemini Live API endpoint
- Handle setup message with session configuration
- Handle server events: audio, content, toolcall, transcription, interrupted, goAway
- Implement sendRealtimeInput for streaming microphone audio
- Implement sendToolResponse for function calling
- Create config.ts with voice and model configuration (30 HD voices)
- Create toolDefinitions.ts with get_weather and get_time functions
- Create backend `/api/gemini/token` endpoint
- Implement ephemeral token generation with 30-minute expiry
- Enable session resumption in token configuration
- Validate GEMINI_API_KEY on backend startup
- Unit tests for GenAILiveClient
- Integration tests for token endpoint

### Out of Scope

- React hook and context (Session 03)
- Provider component (Session 04)
- E2E tests (Session 05)

---

## Prerequisites

- [ ] Session 01 completed (dependencies installed)
- [ ] Audio utilities available (audioUtils.ts)

---

## Deliverables

1. `src/lib/gemini/genai-live-client.ts` - EventEmitter WebSocket wrapper
2. `src/lib/gemini/config.ts` - Voice and model configuration
3. `src/lib/gemini/toolDefinitions.ts` - Function declarations
4. `server/routes/gemini.ts` - Token generation endpoint
5. Unit tests for GenAILiveClient
6. Integration tests for token endpoint

---

## Success Criteria

- [ ] GenAILiveClient emits events correctly for all server message types
- [ ] WebSocket connection establishes to Gemini Live endpoint
- [ ] Setup message configures session with voice, tools, transcription
- [ ] sendRealtimeInput correctly formats and sends audio data
- [ ] sendToolResponse correctly formats and sends function results
- [ ] Token endpoint returns valid ephemeral token
- [ ] Token expires in 30 minutes with single-use constraint
- [ ] Session resumption enabled in token configuration
- [ ] GEMINI_API_KEY validation rejects missing/invalid keys
- [ ] All 30 HD voices defined in config.ts
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] Unit tests pass for GenAILiveClient
- [ ] Integration tests pass for token endpoint
