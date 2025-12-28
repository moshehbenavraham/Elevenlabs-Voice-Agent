# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 01 - OpenAI Voice Agent
**Completed Sessions**: 6 (4 from Phase 00, 2 from Phase 01)

---

## Recommended Next Session

**Session ID**: `phase01-session03-openai-frontend`
**Session Name**: OpenAI Frontend Integration
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: 25-30

---

## Why This Session Next?

### Prerequisites Met
- [x] Session 02 backend endpoint working (`POST /api/openai/session`)
- [x] OpenAI ephemeral token endpoint tested and validated
- [x] Audio format requirements documented from Session 01 (24kHz PCM16, base64)
- [x] ~80% code reuse strategy identified from xAI implementation

### Dependencies
- **Builds on**: phase01-session02-openai-backend (ephemeral token endpoint)
- **Enables**: phase01-session04-validation (final testing and polish)

### Project Progression
This is the natural next step in the OpenAI integration sequence. The backend infrastructure is complete and tested - now the frontend context and provider component need to be built to enable actual voice conversations. Session 03 is the core implementation session that brings OpenAI voice agent to users.

---

## Session Overview

### Objective
Create the OpenAI voice context and provider component, integrating OpenAI into the existing tab system with full audio conversation support.

### Key Deliverables
1. `src/contexts/OpenAIVoiceContext.tsx` - WebSocket connection and voice state management
2. `src/components/providers/OpenAIProvider.tsx` - Provider wrapper component
3. OpenAI tab in provider tabs (when `VITE_OPENAI_ENABLED=true`)
4. Full voice conversation working with OpenAI Realtime API
5. Audio visualization during OpenAI conversations
6. Graceful disconnect on tab switch

### Scope Summary
- **In Scope (MVP)**: OpenAI voice context, WebSocket connection, message handling, provider component, tab integration, audio encoding/decoding, feature flag support
- **Out of Scope**: Advanced voice customization UI, conversation history/transcript, function calling/tool use features

---

## Technical Considerations

### Technologies/Patterns
- OpenAI Realtime API (wss://api.openai.com/v1/realtime)
- Ephemeral token pattern (browser-safe authentication)
- AudioWorklet for PCM encoding (reuse from xAI)
- Web Audio API for playback and visualization
- React Context pattern (OpenAIVoiceContext)

### Potential Challenges
- **WebSocket Event Mapping**: OpenAI uses similar but slightly different event names than xAI
- **Voice Selection**: OpenAI has different voice options (alloy, ash, ballad, coral, echo, sage, shimmer, verse)
- **VAD Configuration**: OpenAI supports server_vad and semantic_vad options
- **Safari Audio Quirks**: AudioContext resume requires user gesture

### Relevant Considerations
- [P00] **Inline Blob URL for Worklets**: Reuse pattern from xAI - avoid external worklet files
- [P00] **Provider-Specific Contexts**: Create dedicated OpenAIVoiceContext for isolation
- [P00] **Switch statement for WebSocket messages**: Clean routing for OpenAI message types
- [P01] **Audio Format Compatibility**: Same specs as xAI - all audio utilities reusable
- [P01] **~80% Code Reuse**: XAIVoiceContext provides template for OpenAIVoiceContext

---

## Alternative Sessions

If this session is blocked:
1. **phase01-session04-validation** - Cannot proceed (depends on session 03 completion)
2. **New research session** - Only if OpenAI API access issues discovered

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
