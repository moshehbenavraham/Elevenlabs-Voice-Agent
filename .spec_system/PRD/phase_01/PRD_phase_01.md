# PRD Phase 01: OpenAI Voice Agent

**Status**: In Progress
**Sessions**: 4 (initial estimate)
**Estimated Duration**: 2-3 days

**Progress**: 1/4 sessions (25%)

---

## Overview

Add OpenAI Realtime API as the third voice provider in the multi-provider voice agent application. This phase leverages the extensible architecture established in Phase 00 (provider abstraction layer, tab system, and backend patterns) to integrate OpenAI's real-time voice capabilities.

---

## Progress Tracker

| Session | Name | Status | Est. Tasks | Validated |
|---------|------|--------|------------|-----------|
| 01 | OpenAI Research & Planning | Complete | 22 | 2025-12-28 |
| 02 | OpenAI Backend Integration | Not Started | ~20-25 | - |
| 03 | OpenAI Frontend Integration | Not Started | ~25-30 | - |
| 04 | Validation & Polish | Not Started | ~15-20 | - |

---

## Completed Sessions

### Session 01: OpenAI Research & Planning
- **Completed**: 2025-12-28
- **Tasks**: 22/22
- **Deliverables**: 4 research documents (~1,717 lines)
- **Key Findings**: Audio format 100% compatible with xAI (24kHz PCM16), ~80% code reuse possible

---

## Upcoming Sessions

- Session 02: OpenAI Backend Integration

---

## Objectives

1. Research OpenAI Realtime API patterns and requirements
2. Implement backend ephemeral token endpoint for OpenAI
3. Create OpenAIVoiceContext with WebSocket connection logic
4. Integrate OpenAI provider into existing tab system
5. Ensure feature parity with ElevenLabs and xAI providers
6. Validate audio format compatibility (PCM encoding/decoding)

---

## Prerequisites

- Phase 00 completed (Multi-Provider Voice with tab system)
- OpenAI API key with Realtime API access
- Understanding of provider abstraction layer from Phase 00

---

## Technical Considerations

### Architecture

The extensible provider architecture from Phase 00 enables straightforward OpenAI integration:

```
src/contexts/
├── VoiceContext.tsx       # ElevenLabs (existing)
├── XAIVoiceContext.tsx    # xAI (existing)
└── OpenAIVoiceContext.tsx # OpenAI (new)

src/components/providers/
├── ElevenLabsProvider.tsx # (existing)
├── XAIProvider.tsx        # (existing)
└── OpenAIProvider.tsx     # (new)

server/routes/
├── elevenlabs.js          # (existing)
├── xai.js                 # (existing)
└── openai.js              # (new)
```

### Technologies

- OpenAI Realtime API (WebSocket-based)
- Backend ephemeral token pattern (same as xAI)
- Web Audio API with AudioWorklet for PCM encoding
- Existing Radix UI Tabs for provider switching

### Audio Format

OpenAI Realtime API audio specifications (to be confirmed in Session 01):
- Format: PCM 16-bit
- Sample rate: 24kHz (likely, similar to xAI)
- Channels: Mono
- Encoding: Base64 for WebSocket transport

### Risks

- **API Access**: OpenAI Realtime API may require beta access or specific plan
- **Rate Limiting**: OpenAI may have different rate limits than xAI
- **Audio Format Differences**: May need format conversion if specs differ from xAI
- **SDK Availability**: No official React SDK; using native WebSocket (same pattern as xAI)

### Relevant Considerations from Phase 00

- [P00] **AudioWorklet Thread Model**: Reuse existing PCM encoder worklet pattern
- [P00] **Inline Blob URL for Worklets**: Avoid external worklet files for bundling compatibility
- [P00] **Provider-Specific Contexts**: Each provider gets dedicated context for isolation
- [P00] **API Keys via Backend Proxy**: Never expose OpenAI API key to browser
- [P00] **Switch statement for WebSocket messages**: Clean routing for OpenAI message types

---

## Success Criteria

Phase complete when:
- [ ] All 4 sessions completed
- [ ] OpenAI provider appears in tab system (when configured)
- [ ] Voice conversation works end-to-end with OpenAI
- [ ] Audio visualization displays during OpenAI conversations
- [ ] Graceful disconnect when switching from/to OpenAI tab
- [ ] "Not configured" state displays when OPENAI_API_KEY missing
- [ ] All existing tests pass
- [ ] No new linting errors or warnings

---

## Dependencies

### Depends On

- Phase 00: Multi-Provider Voice (provides tab system, provider abstraction)

### Enables

- Phase 02: Additional Providers (Google Gemini, Anthropic)
- Phase 03: Enhanced Features (configuration modals, conversation history)

---

## Environment Variables

### New Variables (OpenAI)

```env
# Server-side only (never expose to browser)
OPENAI_API_KEY=sk-...

# Frontend configuration
VITE_OPENAI_ENABLED=true
VITE_OPENAI_VOICE=alloy  # or: echo, fable, onyx, nova, shimmer
VITE_OPENAI_INSTRUCTIONS="You are a helpful assistant..."
```

---

## API Endpoints

### New Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/openai/session` | Create ephemeral session token for OpenAI Realtime |

---

## Sessions

- [Session 01: OpenAI Research & Planning](sessions/phase01-session01-openai-research.md)
- [Session 02: OpenAI Backend Integration](sessions/phase01-session02-openai-backend.md)
- [Session 03: OpenAI Frontend Integration](sessions/phase01-session03-openai-frontend.md)
- [Session 04: Validation & Polish](sessions/phase01-session04-validation.md)

---

## Next Steps

Run `/nextsession` to begin Session 01: OpenAI Research & Planning.
