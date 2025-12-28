# Session 03: xAI Frontend Integration

| Field | Value |
|-------|-------|
| **Session ID** | phase00-session03-xai-frontend |
| **Phase** | 00 - Multi-Provider Voice |
| **Status** | Not Started |
| **Estimated Duration** | 3-4 hours |
| **Estimated Tasks** | 25-30 |

---

## Objective

Implement the complete xAI voice agent frontend by creating the XAIVoiceContext for WebSocket connections, building the XAIProvider component, and integrating audio handling with the existing VoiceVisualizer.

---

## Prerequisites

- [x] Session 01 completed (provider types and tab system)
- [x] Session 02 completed (xAI backend routes)
- [ ] xAI API key configured in `.env`

---

## Key Deliverables

### 1. XAI Voice Context
- `src/contexts/XAIVoiceContext.tsx` - xAI connection logic
- WebSocket connection to xAI realtime API
- Ephemeral token retrieval from backend
- Message handling for xAI event types

### 2. XAI Provider Component
- `src/components/providers/XAIProvider.tsx` - Provider wrapper
- Wire xAI context to shared voice components
- Provider registration in ProviderTabs

### 3. Audio Handling
- Audio encoding: PCM 16-bit, 24kHz sample rate
- Audio decoding from xAI responses
- MediaStream integration with VoiceVisualizer
- Microphone capture and streaming

### 4. Integration
- Add xAI tab to ProviderTabs
- Graceful disconnect on tab switch
- Error state handling

---

## Scope

### In Scope (MVP)
- XAIVoiceContext with full connection lifecycle
- Audio capture and encoding
- Audio playback from xAI responses
- Basic error handling and reconnection
- Integration with existing voice UI components

### Out of Scope
- Conversation history display (use messages for debug only)
- Voice selection UI
- Custom xAI instructions UI
- Advanced audio processing

---

## Technical Approach

### WebSocket Connection Flow
```
1. User clicks "Start" on xAI tab
2. Frontend requests ephemeral token from /api/xai/session
3. Frontend opens WebSocket to xAI realtime API
4. Microphone capture begins, audio sent as base64
5. xAI responses decoded and played through AudioContext
```

### xAI Message Types
```typescript
// Send
{ type: "input_audio_buffer.append", audio: "<base64>" }

// Receive
{ type: "response.output_audio.delta", delta: "<base64>" }
{ type: "conversation.item.created", item: {...} }
```

### Audio Processing
```typescript
// Encode for xAI (PCM 16-bit, 24kHz)
const audioWorklet = new AudioWorkletNode(ctx, 'pcm-encoder');

// Decode from xAI
const audioData = base64ToArrayBuffer(delta);
const source = ctx.createBufferSource();
```

---

## Dependencies

### Internal
- Session 01: ProviderContext, tab system
- Session 02: `/api/xai/session` endpoint
- `src/components/voice/VoiceVisualizer.tsx`
- `src/components/voice/VoiceButton.tsx`

### External
- xAI Realtime API (WebSocket)
- Web Audio API support

---

## Success Criteria

1. xAI tab appears when `VITE_XAI_ENABLED=true`
2. Clicking "Start" connects to xAI successfully
3. Voice input is captured and sent to xAI
4. xAI audio responses play back correctly
5. VoiceVisualizer animates with xAI audio
6. Disconnecting works cleanly
7. Tab switching disconnects properly

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/XAIVoiceContext.tsx` | CREATE | xAI voice connection logic |
| `src/components/providers/XAIProvider.tsx` | CREATE | xAI provider wrapper |
| `src/components/providers/index.ts` | CREATE | Barrel export |
| `src/hooks/useXAIVoice.ts` | CREATE | xAI-specific hook (optional) |
| `src/pages/Index.tsx` | MODIFY | Add XAI provider to tabs |
| `src/components/tabs/ProviderTabs.tsx` | MODIFY | Register XAI tab |

---

## Testing Strategy

- Unit tests for XAIVoiceContext state management
- Mock WebSocket for connection tests
- Manual end-to-end testing with real xAI API
- Audio playback verification
