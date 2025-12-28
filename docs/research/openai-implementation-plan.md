# OpenAI Realtime API Implementation Plan

**Session**: phase01-session01-openai-research
**Created**: 2025-12-28
**Status**: Planning Complete

---

## Overview

This document outlines the implementation plan for adding OpenAI Realtime API support as the third voice provider in the multi-provider voice agent application.

---

## Implementation Sessions

### Session 02: Backend Implementation

**Objective**: Create ephemeral token endpoint for OpenAI Realtime API

### Session 03: Frontend Implementation

**Objective**: Create OpenAIVoiceContext and integrate with tab system

---

## Session 02: Backend Implementation Plan

### 2.1 Environment Configuration

**File**: `.env` (update)

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
```

### 2.2 Ephemeral Token Endpoint

**File**: `server/routes/openai.ts` (new)

```typescript
// POST /api/openai/session
// Returns ephemeral token for browser WebSocket connection
```

**Implementation**:

```typescript
import express from 'express';

const router = express.Router();

router.post('/session', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview',
        voice: 'alloy',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    res.json({ token: data.client_secret.value });
  } catch (error) {
    console.error('OpenAI session error:', error);
    res.status(500).json({ message: 'Failed to create OpenAI session' });
  }
});

export default router;
```

### 2.3 Route Registration

**File**: `server/index.ts` (update)

```typescript
import openaiRoutes from './routes/openai';
app.use('/api/openai', openaiRoutes);
```

### 2.4 Testing Checklist

- [ ] POST /api/openai/session returns valid token
- [ ] Token works for WebSocket connection
- [ ] Error handling for invalid API key
- [ ] Rate limiting consideration

---

## Session 03: Frontend Implementation Plan

### 3.1 OpenAI Voice Context

**File**: `src/contexts/OpenAIVoiceContext.tsx` (new)

**Structure** (based on XAIVoiceContext):

```typescript
// State interface
interface OpenAIVoiceState {
  status: ConnectionStatus;
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  volume: number;
}

// Context value interface
interface OpenAIVoiceContextValue extends OpenAIVoiceState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setVolume: (volume: number) => void;
  clearError: () => void;
  getAnalyserNode: () => AnalyserNode | null;
}
```

### 3.2 Key Implementation Differences

| Component | xAI | OpenAI |
|-----------|-----|--------|
| WebSocket URL | `wss://api.x.ai/v1/realtime` | `wss://api.openai.com/v1/realtime` |
| Model param | `model=grok-2-public` | `model=gpt-4o-realtime-preview` |
| Token endpoint | `/api/xai/session` | `/api/openai/session` |
| Default voice | `verse` | `alloy` |
| Environment vars | `VITE_XAI_*` | `VITE_OPENAI_*` |

### 3.3 Shared Audio Utilities

**Reuse from xAI** (no changes needed):

- `encodeBase64()` - Base64 encoding
- `decodeAudioFromXAI()` - Rename to `decodeRealtimeAudio()`
- `createAudioBuffer()` - AudioBuffer creation
- `int16ToBytes()` - PCM conversion
- `pcmEncoder.worklet.ts` - Audio capture worklet

### 3.4 Message Handler Implementation

```typescript
const handleWSMessage = useCallback((event: MessageEvent) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'session.created':
      // Send session.update with config
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['audio', 'text'],
          voice: OPENAI_VOICE,
          instructions: OPENAI_INSTRUCTIONS,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      }));
      break;

    case 'session.updated':
      dispatch({ type: 'SET_STATUS', payload: 'connected' });
      dispatch({ type: 'SET_LISTENING', payload: true });
      break;

    case 'response.audio.delta':
      // Decode and queue audio (same as xAI)
      break;

    case 'error':
      dispatch({ type: 'SET_ERROR', payload: data.error?.message });
      break;
  }
}, []);
```

### 3.5 Tab Integration

**File**: `src/pages/Index.tsx` (update)

```typescript
// Add OpenAI tab
<TabsContent value="openai">
  <OpenAIVoiceProvider>
    {/* Voice UI components */}
  </OpenAIVoiceProvider>
</TabsContent>
```

### 3.6 Environment Variables

**File**: `.env` (update)

```bash
# OpenAI Voice Configuration
VITE_OPENAI_VOICE=alloy
VITE_OPENAI_INSTRUCTIONS="You are a helpful voice assistant."
```

---

## Reusable Components Mapping

### From XAIVoiceContext

| xAI Component | OpenAI Equivalent | Changes |
|---------------|-------------------|---------|
| `getEphemeralToken()` | `getEphemeralToken()` | Change URL to `/api/openai/session` |
| `handleWSMessage()` | `handleWSMessage()` | Same event types |
| `initializeAudioCapture()` | `initializeAudioCapture()` | No changes |
| `playNextInQueue()` | `playNextInQueue()` | No changes |
| `connect()` | `connect()` | Update URL, model |
| `disconnect()` | `disconnect()` | No changes |

### From audioUtils.ts

| Function | Changes |
|----------|---------|
| `XAI_SAMPLE_RATE` | Rename to `REALTIME_SAMPLE_RATE` |
| `encodeBase64()` | No changes |
| `int16ToBytes()` | No changes |
| `decodeAudioFromXAI()` | Rename to `decodeRealtimeAudio()` |
| `createAudioBuffer()` | No changes |

---

## Testing Plan

### Backend Tests

1. **Unit Tests**
   - Token generation endpoint
   - Error handling for API failures
   - Response format validation

2. **Integration Tests**
   - End-to-end token flow
   - WebSocket connection with token

### Frontend Tests

1. **Unit Tests**
   - OpenAIVoiceContext state management
   - Message handler event processing
   - Error state handling

2. **Integration Tests**
   - Full connection flow
   - Audio playback pipeline
   - Tab switching behavior

3. **Manual Tests**
   - Voice conversation quality
   - Latency measurement
   - Interruption handling
   - Error recovery

---

## File Checklist

### Session 02 (Backend)

| File | Action | Priority |
|------|--------|----------|
| `server/routes/openai.ts` | Create | P0 |
| `server/index.ts` | Update | P0 |
| `.env.example` | Update | P1 |
| `server/routes/openai.test.ts` | Create | P1 |

### Session 03 (Frontend)

| File | Action | Priority |
|------|--------|----------|
| `src/contexts/OpenAIVoiceContext.tsx` | Create | P0 |
| `src/hooks/useOpenAIVoice.ts` | Create | P0 |
| `src/pages/Index.tsx` | Update | P0 |
| `src/lib/audio/audioUtils.ts` | Update (rename) | P1 |
| `.env.example` | Update | P1 |
| `src/test/OpenAIVoiceContext.test.tsx` | Create | P1 |

---

## Risk Assessment

### Low Risk

- Audio format compatibility (confirmed 24kHz PCM16)
- Message event structure (very similar to xAI)
- Shared audio utilities (proven working)

### Medium Risk

- OpenAI API rate limits (need to implement backoff)
- Token expiration handling
- Browser compatibility (same as xAI)

### High Risk

- OpenAI Realtime API availability (beta access)
- Pricing impact (more expensive than xAI)
- Model performance differences

---

## Success Criteria

### Session 02 Complete When

- [ ] `/api/openai/session` endpoint returns valid token
- [ ] Token successfully authenticates WebSocket connection
- [ ] Error handling covers common failure cases
- [ ] Environment variables documented

### Session 03 Complete When

- [ ] OpenAI tab appears in provider selector
- [ ] Voice conversation works end-to-end
- [ ] Audio quality matches xAI implementation
- [ ] Error states displayed correctly
- [ ] Volume control works
- [ ] Visualizer animates during speech

---

## Dependencies

### External

- OpenAI API key with Realtime API access
- Stable OpenAI Realtime API (currently in preview)

### Internal

- Phase 00 completed (tab system, xAI integration)
- Backend server running
- Audio utilities tested

---

## Timeline Estimate

| Session | Tasks | Complexity |
|---------|-------|------------|
| Session 02 | Backend endpoint | Low |
| Session 03 | Frontend context | Medium |
| Session 04 | Polish & testing | Low |

---

## Notes

1. **Code Reuse**: 80%+ of xAI implementation can be reused
2. **Pattern Consistency**: Follow established patterns from XAIVoiceContext
3. **Testing Priority**: Focus on integration tests over unit tests
4. **Documentation**: Update CLAUDE.md with OpenAI configuration
