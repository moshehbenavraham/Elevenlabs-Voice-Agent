# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 00 - Multi-Provider Voice
**Completed Sessions**: 2 of 4

---

## Recommended Next Session

**Session ID**: `phase00-session03-xai-frontend`
**Session Name**: xAI Frontend Integration
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: 25-30

---

## Why This Session Next?

### Prerequisites Met
- [x] Session 01 completed (provider types and tab system)
- [x] Session 02 completed (xAI backend routes with ephemeral token endpoint)

### Dependencies
- **Builds on**: `phase00-session02-xai-backend` - Uses the `/api/xai/session` endpoint for ephemeral tokens
- **Enables**: `phase00-session04-polish` - Frontend must exist before polish/testing

### Project Progression
This is the natural next step in the xAI integration flow:
1. Foundation (Session 01) - established provider abstraction and tab system
2. Backend (Session 02) - created secure ephemeral token endpoint
3. **Frontend (Session 03)** - complete the integration with WebSocket client and audio handling
4. Polish (Session 04) - refine animations, accessibility, and testing

The xAI backend is fully implemented and ready; the frontend integration completes the end-to-end voice agent functionality.

---

## Session Overview

### Objective
Implement the complete xAI voice agent frontend by creating the XAIVoiceContext for WebSocket connections, building the XAIProvider component, and integrating audio handling with the existing VoiceVisualizer.

### Key Deliverables
1. **XAI Voice Context** - `src/contexts/XAIVoiceContext.tsx` with WebSocket connection logic, ephemeral token retrieval, and xAI message handling
2. **XAI Provider Component** - `src/components/providers/XAIProvider.tsx` wiring context to shared voice UI
3. **Audio Handling** - PCM 16-bit encoding/decoding at 24kHz, microphone capture, and AudioContext playback
4. **Tab Integration** - xAI tab in ProviderTabs with proper disconnect on switch

### Scope Summary
- **In Scope (MVP)**: XAIVoiceContext with full connection lifecycle, audio capture/encoding, audio playback from xAI responses, basic error handling, integration with existing voice UI components
- **Out of Scope**: Conversation history display, voice selection UI, custom xAI instructions UI, advanced audio processing

---

## Technical Considerations

### Technologies/Patterns
- **Native WebSocket** - No official xAI React SDK; direct WebSocket to realtime API
- **Web Audio API** - AudioWorklet for PCM encoding, AudioContext for playback
- **Ephemeral Token Pattern** - Secure token from backend before WebSocket connection
- **Base64 Audio Encoding** - xAI message format for audio data

### Potential Challenges
- **Audio Encoding** - PCM 16-bit at 24kHz requires careful AudioWorklet implementation
- **WebSocket Reliability** - Need reconnection logic for dropped connections
- **Browser Compatibility** - Safari may need special handling for audio

### Relevant Considerations
- **[Architecture]** Separate contexts per provider - Create XAIVoiceContext isolated from existing VoiceContext
- **[Security]** API Keys - Ephemeral token pattern already implemented in Session 02; frontend just consumes it
- **[Lesson]** useConnectionMode hook - Environment-based switching pattern is reusable for provider detection

---

## Alternative Sessions

If this session is blocked:
1. **phase00-session04-polish** - Could do non-xAI-specific polish work (ElevenLabs animations, accessibility) but would need to revisit for xAI
2. **Start Phase 01** - Only if xAI integration is deprioritized entirely

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
