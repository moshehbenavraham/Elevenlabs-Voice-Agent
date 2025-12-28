# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 01 - OpenAI Voice Agent
**Completed Sessions**: 4 (Phase 00 complete)

---

## Recommended Next Session

**Session ID**: `phase01-session01-openai-research`
**Session Name**: OpenAI Research & Planning
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: ~15-20

---

## Why This Session Next?

### Prerequisites Met
- [x] Phase 00: Multi-Provider Voice (complete)
- [x] Tab system and provider abstraction layer established
- [x] xAI backend/frontend patterns available as reference
- [x] AudioWorklet and PCM encoding patterns proven

### Dependencies
- **Builds on**: Phase 00 provider architecture (contexts, tabs, backend patterns)
- **Enables**: Session 02 (Backend) and Session 03 (Frontend) implementation

### Project Progression
This is the natural first step for Phase 01. Research must precede implementation to:
1. Understand OpenAI Realtime API specifications
2. Confirm audio format compatibility with existing infrastructure
3. Map OpenAI message types to the established provider interface
4. Identify differences from xAI that require code changes

Starting implementation without this research risks rework if OpenAI's patterns differ significantly from xAI.

---

## Session Overview

### Objective
Research OpenAI Realtime API specifications, document integration patterns, and plan the implementation approach for subsequent sessions.

### Key Deliverables
1. Research document: OpenAI Realtime API specifications
2. Audio format comparison table (OpenAI vs xAI)
3. WebSocket message type mapping
4. Implementation plan for backend endpoint
5. Implementation plan for frontend context

### Scope Summary
- **In Scope (MVP)**: API research, documentation, pattern analysis, implementation planning
- **Out of Scope**: Actual code implementation, OpenAI-specific settings UI, advanced features (function calling)

---

## Technical Considerations

### Technologies/Patterns
- OpenAI Realtime API (WebSocket-based)
- Ephemeral token authentication pattern
- Web Audio API with AudioWorklet
- PCM 16-bit audio at 24kHz (likely)

### Potential Challenges
- OpenAI Realtime API may require beta access or specific plan tier
- Audio format specifications may differ from xAI (sample rate, encoding)
- No official React SDK - will use native WebSocket (same as xAI)
- Rate limiting differences from xAI

### Relevant Considerations
- [P00] **AudioWorklet Thread Model**: Reuse existing PCM encoder worklet pattern for OpenAI
- [P00] **Inline Blob URL for Worklets**: Avoid external worklet files to maintain bundling compatibility
- [P00] **Provider-Specific Contexts**: OpenAI will get dedicated OpenAIVoiceContext
- [P00] **API Keys via Backend Proxy**: Never expose OpenAI API key to browser
- [P00] **Switch statement for WebSocket messages**: Clean routing for OpenAI message types

---

## Alternative Sessions

If this session is blocked (e.g., no OpenAI Realtime API access):

1. **Phase 02+ Planning** - Begin architecture planning for Google Gemini or Anthropic providers
2. **Phase 00 Enhancements** - Address deferred items: reconnection backoff, conversation history UI

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
