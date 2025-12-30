# Session: Ultravox Integration

**Phase**: 04 - Deployment & New Providers
**Session**: 03
**Session ID**: `phase04-session03-ultravox-integration`
**Status**: Not Started
**Estimated Tasks**: 18-22
**Estimated Duration**: 3-4 hours

---

## Objective

Implement Ultravox as the fourth voice provider with full feature parity: connection management, voice selection, conversation transcript, function calling, and seamless tab integration.

---

## Scope

### In Scope (MVP)

- Install `ultravox-client` npm package
- Create backend `/api/ultravox/call` endpoint
- Create `UltravoxVoiceContext.tsx` with session management
- Create `UltravoxProvider.tsx` component
- Add Ultravox tab to provider selection
- Integrate with existing VoiceButton, VoiceStatus components
- Implement transcript display via ConversationPanel
- Create client-side tool implementations (weather, time, calculator)
- Add voice selection (if multiple voices available)
- Environment variable configuration

### Out of Scope

- Advanced audio processing (SDK handles this)
- Custom visualizations beyond existing VoiceVisualizer
- Performance optimization (Session 04)

---

## Prerequisites

- [ ] Session 02 (Ultravox Research) completed
- [x] **API access confirmed** - Ultravox API key already present in project `.env` file (`ULTRAVOX_API_KEY`)
- [ ] Type definitions reviewed from research phase

---

## Deliverables

### Backend

1. **`server/routes/ultravox.js`**: Call creation endpoint
2. **Route registration** in `server/index.js`
3. **Environment variables**: `ULTRAVOX_API_KEY`

### Frontend

4. **`src/types/ultravox.ts`**: Type definitions
5. **`src/contexts/UltravoxVoiceContext.tsx`**: Session management
6. **`src/components/providers/UltravoxProvider.tsx`**: Provider component
7. **`src/lib/tools/ultravoxTools.ts`**: Client-side tool implementations
8. **`src/components/voice/UltravoxVoiceSelector.tsx`**: Voice selection (if applicable)

### Configuration

9. **ProviderContext.tsx update**: Add Ultravox provider config
10. **voice-provider.ts update**: Add 'ultravox' to ProviderType
11. **.env.example update**: Add Ultravox environment variables

---

## Implementation Checklist

### Backend Setup

- [ ] Install dependencies (if any server-side)
- [ ] Create `/api/ultravox/call` POST endpoint
- [ ] Implement call creation with Ultravox API
- [ ] Return joinUrl to frontend
- [ ] Add error handling for API failures
- [ ] Register route in server/index.js

### Context Implementation

- [ ] Create UltravoxVoiceContext with initial state
- [ ] Implement connect() - fetch joinUrl, create session, join call
- [ ] Implement disconnect() - leave call, cleanup
- [ ] Add status event listener with state mapping
- [ ] Add transcript event listener with message updates
- [ ] Implement mic mute toggle via SDK
- [ ] Add error handling and state management

### Tool Registration

- [ ] Create weatherTool implementation
- [ ] Create timeTool implementation
- [ ] Create calculatorTool implementation
- [ ] Register tools before joinCall
- [ ] Pass tool definitions to backend call creation

### Provider Component

- [ ] Create UltravoxProvider.tsx
- [ ] Wire VoiceButton for connect/disconnect
- [ ] Wire VoiceStatus for status display
- [ ] Add Ultravox-specific status indicators (listening, thinking, speaking)
- [ ] Integrate ConversationPanel for transcripts
- [ ] Add mic mute toggle button when connected
- [ ] Add FunctionCallIndicator for tool execution

### Tab Integration

- [ ] Add ULTRAVOX_PROVIDER config to ProviderContext
- [ ] Add 'ultravox' to ProviderType enum
- [ ] Create Ultravox logo/icon
- [ ] Enable tab when VITE_ULTRAVOX_ENABLED=true

---

## Technical Specifications

### Backend Endpoint

```javascript
// POST /api/ultravox/call
// Request body:
{
  systemPrompt: string,
  model?: string,         // default: "fixie-ai/ultravox-70B"
  voice?: string,         // default: "terrence"
  temperature?: number,   // default: 0.7
  maxDuration?: string,   // default: "300s"
  selectedTools?: object[]
}

// Response:
{
  joinUrl: string,
  callId: string,
  model: string,
  systemPrompt: string
}
```

### Context State

```typescript
interface UltravoxVoiceState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  ultravoxStatus: UltravoxStatus; // Native SDK status
  isSpeaking: boolean;
  isMicMuted: boolean;
  error: string | null;
  transcripts: UltravoxTranscript[];
  callId: string | null;
}
```

### Provider Config

```typescript
const ULTRAVOX_PROVIDER: ProviderConfig = {
  id: 'ultravox',
  name: 'Ultravox',
  displayName: 'Ultravox AI',
  description: 'Fixie.ai voice agent with 70B model',
  isEnabled: import.meta.env.VITE_ULTRAVOX_ENABLED === 'true',
  defaultConfig: {
    systemPrompt: 'You are a helpful voice assistant.',
    model: 'fixie-ai/ultravox-70B',
    voice: 'terrence',
    temperature: 0.7,
  },
};
```

---

## Success Criteria

- [ ] Ultravox tab appears when VITE_ULTRAVOX_ENABLED=true
- [ ] Connect button starts voice session
- [ ] Disconnect button cleanly ends session
- [ ] Status displays Ultravox-specific states (listening, thinking, speaking)
- [ ] Transcripts display in ConversationPanel
- [ ] Mic mute toggle works
- [ ] Function calling executes tools and shows results
- [ ] Error states handled gracefully
- [ ] Tab switching disconnects active session (existing pattern)

---

## Dependencies

- `ultravox-client` npm package
- Existing VoiceButton, VoiceStatus, ConversationPanel components
- Existing ProviderContext and tab system
- Existing useReconnection hook (if applicable)

---

## Risks & Mitigations

| Risk                          | Mitigation                        |
| ----------------------------- | --------------------------------- |
| SDK version compatibility     | Pin version, monitor for updates  |
| Audio format differences      | SDK handles internally            |
| Tool execution timing         | Add timeout protection (5s)       |
| Transcript format differences | Map to existing VoiceMessage type |
