# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 00 - Gemini Live Integration
**Completed Sessions**: 1 of 5

---

## Recommended Next Session

**Session ID**: `phase00-session02-genai-client-backend`
**Session Name**: GenAI Client & Backend
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: ~18

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 completed (dependencies installed: @google/genai, eventemitter3)
- [x] Audio utilities available (audioUtils.ts, AudioRecorder, AudioStreamer)

### Dependencies

- **Builds on**: Session 01 - Dependencies & Audio Infrastructure
- **Enables**: Session 03 - Voice Hook & Context (React integration)

### Project Progression

Session 02 is the natural next step after establishing the audio infrastructure. The GenAILiveClient is the core WebSocket wrapper that all subsequent React integration depends on. The backend token endpoint must be in place before any frontend can establish authenticated connections. This session creates the foundation layer that Session 03's useGeminiVoice hook will consume.

---

## Session Overview

### Objective

Create the GenAILiveClient WebSocket wrapper with EventEmitter pattern and implement the backend token generation endpoint with proper security.

### Key Deliverables

1. `src/lib/gemini/genai-live-client.ts` - EventEmitter WebSocket wrapper
2. `src/lib/gemini/config.ts` - Voice and model configuration (30 HD voices)
3. `src/lib/gemini/toolDefinitions.ts` - Function declarations (get_weather, get_time)
4. `server/routes/gemini.ts` - Token generation endpoint
5. Unit tests for GenAILiveClient
6. Integration tests for token endpoint

### Scope Summary

- **In Scope (MVP)**: GenAILiveClient class, WebSocket connection management, server event handling, sendRealtimeInput/sendToolResponse methods, backend token endpoint, session resumption support, all 30 HD voice definitions
- **Out of Scope**: React hook/context (Session 03), Provider component (Session 04), E2E tests (Session 05)

---

## Technical Considerations

### Technologies/Patterns

- **EventEmitter3**: Loose coupling between WebSocket and React consumers
- **@google/genai SDK**: GoogleGenAI client for token generation
- **WebSocket API**: Native browser WebSocket to Gemini Live endpoint
- **Express.js**: Token generation endpoint at `/api/gemini/token`

### Potential Challenges

- **WebSocket protocol array auth**: Must use correct format `['realtime', 'openai-insecure-api-key.{token}']`
- **Server event parsing**: Multiple message types (audio, content, toolcall, transcription, interrupted, goAway)
- **Token configuration**: Enabling sessionResumption in the token's liveConnectConstraints
- **Error handling**: Graceful disconnect on goAway messages

### Relevant Considerations

- **[P00] Ephemeral token pattern**: Backend generates short-lived tokens for WebSocket auth (proven with OpenAI, xAI)
- **[P00] API Key Security**: GEMINI_API_KEY must stay server-side; only ephemeral tokens sent to client
- **[P00] Provider-specific contexts**: GenAILiveClient will be consumed by isolated GeminiVoiceContext

---

## Alternative Sessions

If this session is blocked:

1. **Session 03 (Voice Hook & Context)** - Not recommended; requires GenAILiveClient from this session
2. **Session 04 (Provider Component)** - Not recommended; requires hook from Session 03

This session has no blockers - it only depends on Session 01 which is already complete.

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
