# PRD Phase 00: Gemini Live Integration

**Status**: In Progress
**Sessions**: 5 (initial estimate)
**Estimated Duration**: 2-3 days

**Progress**: 2/5 sessions (40%)

---

## Overview

Integrate Google Gemini Live as a new voice AI provider, following the established patterns from existing providers (ElevenLabs, OpenAI, xAI, Ultravox, Vapi, Retell). This includes backend token generation, AudioWorklet-based audio pipeline, EventEmitter WebSocket client, React hook/context, and provider component with full UI integration.

---

## Progress Tracker

| Session | Name                                | Status      | Est. Tasks | Validated  |
| ------- | ----------------------------------- | ----------- | ---------- | ---------- |
| 01      | Dependencies & Audio Infrastructure | Complete    | 20         | 2026-01-18 |
| 02      | GenAI Client & Backend              | Complete    | 20         | 2026-01-18 |
| 03      | Voice Hook & Context                | Not Started | ~16        | -          |
| 04      | Provider Component & UI             | Not Started | ~14        | -          |
| 05      | Testing & Polish                    | Not Started | ~12        | -          |

---

## Completed Sessions

### Session 01: Dependencies & Audio Infrastructure

- **Completed**: 2026-01-18
- **Tasks**: 20/20
- **Key deliverables**: @google/genai SDK, eventemitter3, AudioWorklet processor, audio-recorder, audio-streamer, PCM utilities

### Session 02: GenAI Client & Backend

- **Completed**: 2026-01-18
- **Tasks**: 20/20
- **Key deliverables**: GenAILiveClient WebSocket wrapper, backend token endpoint, Gemini voice config (30 HD voices), TypeScript interfaces, Gemini tool format

---

## Upcoming Sessions

- Session 03: Voice Hook & Context

---

## Objectives

1. Add @google/genai and eventemitter3 dependencies
2. Create backend token generation endpoint with proper security
3. Implement AudioWorklet-based audio pipeline for 16kHz capture and 24kHz playback
4. Build GenAILiveClient with EventEmitter pattern for WebSocket management
5. Create useGeminiVoice hook following existing provider patterns
6. Develop GeminiProvider component with full UI integration
7. Add comprehensive tests for all new components
8. Update CLAUDE.md documentation with Gemini integration details

---

## Prerequisites

- Existing provider infrastructure (Context, Hook, Provider component patterns)
- Backend Express server running at VITE_API_BASE_URL
- GEMINI_API_KEY available in environment

---

## Technical Considerations

### Architecture

- Follow established provider pattern: Context + Hook + Provider component
- GenAILiveClient uses EventEmitter pattern for loose coupling
- AudioWorklet for non-blocking audio capture (no ScriptProcessorNode fallback)
- Session resumption handles WebSocket timeout (~10 min) transparently

### Technologies

- @google/genai SDK ^1.34.0 for Live API support
- eventemitter3 ^5.0.1 for client event handling
- AudioWorklet for microphone capture at 16kHz
- GainNode for playback volume control at 24kHz

### Risks

- **AudioWorklet browser support**: Safari may have limitations; verify during implementation
- **Sample rate support**: Not all browsers support 16kHz/24kHz AudioContext; test early
- **SDK stability**: @google/genai Live API is preview; monitor for breaking changes
- **Session limits**: 15 minute audio sessions; token context 128k

### Relevant Considerations

<!-- From CONSIDERATIONS.md -->

- **API Key Security**: All provider keys must stay server-side; use ephemeral tokens for WebSocket auth
- **Provider Pattern**: Each provider follows Context + Hook + Provider component architecture
- **Tab System**: New providers must integrate with ProviderTabs.tsx and ProviderContext.tsx
- **Ephemeral token pattern**: Backend generates short-lived tokens for WebSocket auth (proven with OpenAI, xAI)
- **Component composition**: VoiceButton, VoiceStatus, VoiceVisualizer reused across providers

---

## Success Criteria

Phase complete when:

- [ ] All 5 sessions completed
- [ ] Gemini Live provider connects and streams bidirectional audio
- [ ] Voice input captured at 16kHz via AudioWorklet (non-blocking)
- [ ] Voice output plays at 24kHz with smooth scheduling
- [ ] Transcriptions display in ConversationPanel (both user and AI)
- [ ] Function calling works (get_weather, get_time demo tools)
- [ ] Barge-in (interruption) clears audio queue immediately
- [ ] All 30 HD voices selectable via VoiceSelector (Puck default)
- [ ] VITE_GEMINI_ENABLED toggle shows/hides tab correctly
- [ ] No API keys exposed in client code or network requests
- [ ] Session timer shows at 12+ minutes with warning at 14 minutes
- [ ] Unit tests pass for audio utilities, GenAILiveClient, useGeminiVoice
- [ ] E2E tests pass for Gemini voice flow
- [ ] CLAUDE.md updated with Gemini integration documentation
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings

---

## Dependencies

### Depends On

- None (first phase in Gemini integration)

### Enables

- Future phases: Session resumption improvements, thinking mode visualization, Google Search grounding
