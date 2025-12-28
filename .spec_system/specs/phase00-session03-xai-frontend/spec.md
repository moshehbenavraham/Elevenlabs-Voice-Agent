# Session Specification

**Session ID**: `phase00-session03-xai-frontend`
**Phase**: 00 - Multi-Provider Voice
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements the complete xAI voice agent frontend, enabling real-time voice conversations with xAI's Grok-powered realtime API. The implementation builds on the foundation established in Session 01 (provider types and tab system) and Session 02 (backend ephemeral token endpoint).

The xAI frontend integration requires native WebSocket handling since no official React SDK exists. The implementation includes audio capture via Web Audio API, PCM 16-bit encoding at 24kHz for xAI's realtime format, and base64 message handling for bidirectional audio streaming. This creates parity with the existing ElevenLabs provider while using xAI's distinct connection architecture.

Completing this session enables full end-to-end xAI voice conversations, allowing users to switch between ElevenLabs and xAI providers via the tab interface. This unlocks Phase 00's primary objective of multi-provider voice agent support.

---

## 2. Objectives

1. Create XAIVoiceContext with complete WebSocket connection lifecycle (connect, disconnect, reconnect, error handling)
2. Implement PCM 16-bit audio encoding/decoding at 24kHz for xAI realtime API format
3. Wire xAI provider to existing voice UI components (VoiceButton, VoiceVisualizer, VoiceStatus)
4. Enable xAI tab in ProviderTabs with environment-based availability detection

---

## 3. Prerequisites

### Required Sessions
- [x] `phase00-session01-foundation` - Provider types, ProviderContext, ProviderTabs component
- [x] `phase00-session02-xai-backend` - `/api/xai/session` ephemeral token endpoint

### Required Tools/Knowledge
- Web Audio API (AudioContext, AudioWorklet, MediaStream)
- WebSocket API for realtime bidirectional communication
- Base64 encoding/decoding for binary audio data
- xAI Realtime API message format specification

### Environment Requirements
- `XAI_API_KEY` configured in backend `.env` file
- `VITE_XAI_ENABLED=true` in frontend `.env` to enable xAI tab
- HTTPS in production (microphone access requirement)

---

## 4. Scope

### In Scope (MVP)
- XAIVoiceContext with WebSocket connection to xAI realtime API
- Ephemeral token retrieval from backend `/api/xai/session`
- Microphone capture using MediaStream and Web Audio API
- PCM 16-bit encoding at 24kHz via AudioWorklet
- Audio playback from xAI response deltas
- Base64 encoding/decoding for audio message transport
- Connection state management (idle, connecting, connected, error)
- Basic error handling with user-friendly toast messages
- Tab switching disconnection logic
- VoiceVisualizer integration with xAI audio stream

### Out of Scope (Deferred)
- Conversation history display - *Reason: Session 04 polish scope*
- Voice selection UI - *Reason: xAI voice is server-configured*
- Custom xAI instructions UI - *Reason: Future feature*
- Advanced reconnection strategies - *Reason: MVP uses simple retry*
- Audio effects/processing - *Reason: Out of MVP scope*

---

## 5. Technical Approach

### Architecture

```
User Click Start
       |
       v
[Index.tsx] --> [XAIVoiceContext] --> fetch /api/xai/session
                      |                       |
                      |<-- ephemeral token ---|
                      |
                      v
              WebSocket connect to xAI realtime API
                      |
       +--------------+--------------+
       |                             |
       v                             v
[AudioCapture]                [AudioPlayback]
 MediaStream                   AudioContext
    |                              ^
    v                              |
 AudioWorklet                 base64 decode
 PCM encode                        |
    |                              |
    v                              |
 base64 encode --> WS send    WS receive
                   input_audio    response.audio.delta
```

### Design Patterns
- **Context Provider Pattern**: Isolate xAI state in XAIVoiceContext, separate from ElevenLabs VoiceContext
- **Hook Composition**: useXAIVoice hook exposes context with clean API
- **Factory Pattern**: Provider registration allows dynamic tab availability based on environment

### Technology Stack
- React 18.3.1 with TypeScript
- Web Audio API (AudioContext, AudioWorklet, AudioWorkletNode)
- WebSocket (native browser API)
- Vite environment variables for feature flags

---

## 6. Deliverables

### Files to Create
| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/contexts/XAIVoiceContext.tsx` | xAI WebSocket connection and state management | ~300 |
| `src/components/providers/XAIProvider.tsx` | Provider component wiring context to UI | ~80 |
| `src/components/providers/index.ts` | Barrel export for providers | ~10 |
| `src/lib/audio/pcmEncoder.worklet.ts` | AudioWorklet for PCM 16-bit encoding | ~50 |
| `src/lib/audio/audioUtils.ts` | Base64 encode/decode, audio buffer helpers | ~60 |
| `src/hooks/useXAIVoice.ts` | Convenience hook for XAIVoiceContext | ~20 |

### Files to Modify
| File | Changes | Est. Lines |
|------|---------|------------|
| `src/types/voice-provider.ts` | Update xAI.isAvailable based on env var | ~5 |
| `src/pages/Index.tsx` | Conditionally render XAIProvider for xAI tab | ~30 |
| `vite.config.ts` | Configure AudioWorklet asset handling if needed | ~5 |
| `public/` or `src/lib/audio/` | Place worklet script for production build | ~0 |

---

## 7. Success Criteria

### Functional Requirements
- [ ] xAI tab appears and is selectable when `VITE_XAI_ENABLED=true`
- [ ] Clicking "Start" on xAI tab retrieves ephemeral token from backend
- [ ] WebSocket connects to xAI realtime API with ephemeral token
- [ ] Microphone audio is captured and sent to xAI as base64 PCM
- [ ] xAI audio responses are decoded and played back through speakers
- [ ] VoiceVisualizer animates with xAI audio data
- [ ] "End conversation" cleanly disconnects WebSocket
- [ ] Tab switching disconnects active xAI connection

### Testing Requirements
- [ ] Unit tests for XAIVoiceContext state transitions
- [ ] Unit tests for audio encoding/decoding utilities
- [ ] Mock WebSocket tests for connection flow
- [ ] Manual end-to-end test with live xAI API

### Quality Gates
- [ ] All files ASCII-encoded (0-127 characters only)
- [ ] Unix LF line endings
- [ ] Code follows project CONVENTIONS.md patterns
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] ESLint passes (`npm run lint`)
- [ ] Components respect prefers-reduced-motion

---

## 8. Implementation Notes

### Key Considerations
- WebSocket connection requires ephemeral token in Authorization header or query param
- Audio must be PCM 16-bit signed integer at 24kHz sample rate
- xAI uses `input_audio_buffer.append` for sending audio, `response.output_audio.delta` for receiving
- AudioWorklet runs in separate thread; must handle message passing carefully
- Safari may require user gesture before AudioContext can start

### Potential Challenges
- **AudioWorklet Build**: Vite may need configuration to properly bundle worklet as separate file
  - *Mitigation*: Use `new URL('./worklet.js', import.meta.url)` pattern or public folder
- **Safari Audio**: May block AudioContext until user interaction
  - *Mitigation*: Resume AudioContext on button click, not on mount
- **Connection Drops**: Network issues may disconnect WebSocket unexpectedly
  - *Mitigation*: Detect close event, show error toast, allow manual reconnect

### Relevant Considerations
- **[Architecture]** Separate Contexts per Provider: Creating XAIVoiceContext isolated from VoiceContext as required
- **[Security]** API Keys: Using ephemeral token pattern from Session 02; never exposing XAI_API_KEY to browser
- **[Lesson]** useConnectionMode hook: Reusing environment-based switching pattern for xAI enablement
- **[External Dependency]** xAI Realtime API: No official SDK; native WebSocket implementation required

### ASCII Reminder
All output files must use ASCII-only characters (0-127). Avoid curly quotes, em-dashes, or other extended Unicode.

---

## 9. Testing Strategy

### Unit Tests
- XAIVoiceContext state machine transitions (idle -> connecting -> connected -> disconnecting)
- Audio utility functions (base64 encode/decode, PCM conversion)
- Error state handling in context

### Integration Tests
- Mock WebSocket to verify message format compliance
- Test ephemeral token fetch failure handling
- Verify disconnect is called on provider switch

### Manual Testing
- Start xAI conversation, speak, hear response
- End conversation, verify clean disconnect
- Switch tabs while connected, verify disconnect
- Test with xAI disabled (tab should be grayed out)
- Test on Safari for AudioContext permission behavior

### Edge Cases
- Token fetch failure (backend down or XAI_API_KEY missing)
- WebSocket connection timeout or rejection
- Microphone permission denied by user
- Audio playback interrupted by system

---

## 10. Dependencies

### External Libraries
- No new dependencies required
- Uses existing: React, TypeScript, Framer Motion, Radix UI

### Other Sessions
- **Depends on**: `phase00-session01-foundation`, `phase00-session02-xai-backend`
- **Depended by**: `phase00-session04-polish` (animations, accessibility refinements)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
