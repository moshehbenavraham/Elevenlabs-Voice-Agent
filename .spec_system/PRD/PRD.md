# Conversational Voice AI Agents - Product Requirements Document

| Field            | Value        |
| ---------------- | ------------ |
| **Status**       | Complete     |
| **Author**       | AI with Apex |
| **Created**      | 2025-12-28   |
| **Last Updated** | 2025-12-30   |

---

## 1. Executive Summary

This PRD outlines the implementation of a tabbed interface system that allows users to demo and interact with AI voice agents from multiple providers. The initial implementation adds xAI (Grok) voice agent alongside the existing ElevenLabs agent, with architecture designed for easy addition of future providers (OpenAI, Google Gemini, Anthropic).

### Goals

1. Add a tab-based navigation system to switch between voice agent providers
2. Integrate xAI voice agent using sample code from `EXAMPLE/xai/`
3. Maintain existing ElevenLabs functionality as the default tab
4. Create extensible architecture for adding more providers in the future

---

## 2. Current State Analysis

### Existing Architecture

```
src/
├── pages/Index.tsx           # Single-provider page
├── contexts/VoiceContext.tsx # ElevenLabs-specific context
├── components/voice/         # Shared voice UI components
│   ├── VoiceButton.tsx       # Interactive connection button
│   ├── VoiceStatus.tsx       # Connection status display
│   ├── VoiceVisualizer.tsx   # Audio visualization
│   └── VoiceWidget.tsx       # ElevenLabs embed widget
└── hooks/
    └── useConnectionMode.ts  # SDK vs Widget mode switching
```

### Current Connection Flow (ElevenLabs)

```
Frontend (VoiceContext)
  → Requests signed URL from Backend (/api/elevenlabs/signed-url)
  → Backend uses ELEVENLABS_API_KEY to create signed URL
  → Frontend uses signedUrl + conversation.startSession()
  → Direct WebSocket to ElevenLabs realtime API
```

### Key Observations

1. **Tightly coupled**: VoiceContext is hardcoded for ElevenLabs SDK
2. **Reusable UI**: VoiceButton, VoiceStatus, VoiceVisualizer are provider-agnostic
3. **Mode pattern exists**: `useConnectionMode` shows environment-based switching
4. **Example implementations available**: `EXAMPLE/xai/` contains working Node.js and Python backends

---

## 3. Requirements

### Functional Requirements

| ID   | Requirement                                                    | Priority |
| ---- | -------------------------------------------------------------- | -------- |
| FR-1 | Tab navigation to switch between voice agent providers         | P0       |
| FR-2 | xAI voice agent integration using ephemeral token pattern      | P0       |
| FR-3 | Persist selected tab in localStorage                           | P1       |
| FR-4 | Display provider branding/logo on each tab                     | P1       |
| FR-5 | Show connection status per provider (independent states)       | P0       |
| FR-6 | Graceful disconnect when switching tabs with active connection | P0       |
| FR-7 | Configuration modal per provider (different settings)          | P2       |

### Non-Functional Requirements

| ID    | Requirement                                                  | Priority |
| ----- | ------------------------------------------------------------ | -------- |
| NFR-1 | Tab switch latency < 100ms                                   | P1       |
| NFR-2 | No provider SDK loaded until tab is selected (lazy loading)  | P2       |
| NFR-3 | Mobile-responsive tab design (horizontal scroll or dropdown) | P1       |
| NFR-4 | Accessibility: keyboard navigation between tabs              | P1       |

---

## 4. Technical Architecture

### 4.1 Provider Abstraction Layer

Create a unified interface that all voice providers must implement:

```typescript
// src/types/voice-provider.ts

export type ProviderType = 'elevenlabs' | 'xai' | 'openai';

export interface VoiceProviderState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  isSpeaking: boolean;
  error: string | null;
  messages: VoiceMessage[];
  audioStream: MediaStream | null;
}

export interface VoiceProviderActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (audioData: ArrayBuffer) => void;
  clearError: () => void;
}

export interface VoiceProvider extends VoiceProviderState, VoiceProviderActions {
  provider: ProviderType;
  displayName: string;
  logo?: string;
  isConfigured: boolean;
}
```

### 4.2 Component Architecture

```
src/
├── components/
│   ├── tabs/
│   │   ├── ProviderTabs.tsx        # Main tab container
│   │   ├── ProviderTab.tsx         # Individual tab component
│   │   └── ProviderTabContent.tsx  # Content area wrapper
│   ├── voice/
│   │   ├── VoiceButton.tsx         # (existing, unchanged)
│   │   ├── VoiceStatus.tsx         # (existing, unchanged)
│   │   ├── VoiceVisualizer.tsx     # (existing, unchanged)
│   │   └── VoiceWidget.tsx         # (existing, unchanged)
│   └── providers/
│       ├── ElevenLabsProvider.tsx  # ElevenLabs-specific wrapper
│       └── XAIProvider.tsx         # xAI-specific wrapper
├── contexts/
│   ├── VoiceContext.tsx            # (existing ElevenLabs, refactor)
│   ├── XAIVoiceContext.tsx         # NEW: xAI-specific context
│   └── ProviderContext.tsx         # NEW: Active provider state
├── hooks/
│   ├── useVoiceProvider.ts         # NEW: Unified provider hook
│   ├── useXAIVoice.ts              # NEW: xAI-specific hook
│   └── useConnectionMode.ts        # (existing)
└── pages/
    └── Index.tsx                   # Updated with tabs
```

### 4.3 State Management Strategy

**Option Selected: Separate Contexts with Provider Switcher**

```
ProviderContext (active provider selection)
    ├── ElevenLabsVoiceContext (existing, refactored)
    └── XAIVoiceContext (new)
```

Rationale:

- Keeps provider-specific logic isolated
- Each context manages its own connection lifecycle
- Provider switching simply changes which context is "active"
- Future providers add new context without modifying existing ones

### 4.4 xAI Integration Architecture

Based on `EXAMPLE/xai/backend-nodejs/`:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │     │   xAI API       │
│   (React)       │     │   (Express)     │     │                 │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│                 │     │                 │     │                 │
│  1. Request     │────▶│  2. Create      │────▶│  Generate       │
│     Session     │     │     Ephemeral   │     │  Token          │
│                 │◀────│     Token       │◀────│                 │
│                 │     │                 │     │                 │
│  3. Direct WS   │─────────────────────────────▶│  Realtime API  │
│     Connection  │◀────────────────────────────│  (Audio Stream) │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key Pattern**: Ephemeral token for direct client-to-xAI WebSocket connection

---

## 5. Phases

| Phase | Name                       | Sessions | Status   | Completed  |
| ----- | -------------------------- | -------- | -------- | ---------- |
| 00    | Multi-Provider Voice       | 4        | Complete | 2025-12-28 |
| 01    | OpenAI Voice Agent         | 4        | Complete | 2025-12-28 |
| 02    | Advanced Features          | 5        | Complete | 2025-12-28 |
| 03    | Testing & Configuration    | 5        | Complete | 2025-12-30 |
| 04    | Deployment & New Providers | 4        | Complete | 2025-12-30 |
| 05    | Vapi Voice Agent           | 4        | Complete | 2025-12-31 |
| 06    | Retell Voice Agent         | 4        | Planned  | -          |

---

## 6. Implementation Plan

### Phase 1: Foundation (Tab System + Provider Abstraction)

#### Task 1.1: Create Provider Types

- [ ] Create `src/types/voice-provider.ts` with unified interfaces
- [ ] Define `ProviderType` enum and provider metadata

#### Task 1.2: Create Tab Components

- [ ] Create `src/components/tabs/ProviderTabs.tsx`
- [ ] Create `src/components/tabs/ProviderTab.tsx`
- [ ] Add tab styling with glassmorphism theme
- [ ] Implement keyboard navigation (arrow keys, Enter)

#### Task 1.3: Create Provider Context

- [ ] Create `src/contexts/ProviderContext.tsx`
- [ ] Implement tab selection state
- [ ] Add localStorage persistence for selected tab

#### Task 1.4: Refactor Index.tsx

- [ ] Wrap existing content with ProviderTabs
- [ ] Add tab switching logic
- [ ] Disconnect active connection on tab switch

### Phase 2: xAI Integration

#### Task 2.1: Backend Setup

- [ ] Add xAI backend routes to existing server (or separate service)
- [ ] Implement `/api/xai/session` endpoint for ephemeral tokens
- [ ] Add `XAI_API_KEY` environment variable handling
- [ ] Configure CORS for WebSocket connections

#### Task 2.2: Create xAI Voice Context

- [ ] Create `src/contexts/XAIVoiceContext.tsx`
- [ ] Implement WebSocket connection to xAI realtime API
- [ ] Handle xAI-specific message types:
  - `response.output_audio.delta`
  - `input_audio_buffer.append`
  - `conversation.item.created`
- [ ] Map xAI states to unified `VoiceProviderState`

#### Task 2.3: Create xAI Provider Component

- [ ] Create `src/components/providers/XAIProvider.tsx`
- [ ] Wire up xAI context to shared voice components
- [ ] Add xAI logo/branding to tab

#### Task 2.4: Audio Handling for xAI

- [ ] Implement audio encoding (PCM 16-bit, 24kHz sample rate)
- [ ] Handle audio decoding from xAI responses
- [ ] Connect to existing VoiceVisualizer

### Phase 3: Polish & Testing

#### Task 3.1: UI/UX Refinements

- [ ] Add smooth tab transition animations
- [ ] Show "not configured" state if API keys missing
- [ ] Add provider-specific configuration modals
- [ ] Mobile-responsive tab design

#### Task 3.2: Testing

- [ ] Unit tests for provider contexts
- [ ] Integration tests for tab switching
- [ ] E2E tests for full conversation flow per provider

#### Task 3.3: Documentation

- [ ] Update README with multi-provider setup
- [ ] Document environment variables for each provider
- [ ] Add troubleshooting guide

### Phase 4: Ultravox Voice Agent Integration

Ultravox is a voice AI platform that uses the `ultravox-client` SDK with a unique session-based architecture. Unlike xAI/OpenAI which use raw WebSocket connections, Ultravox provides a higher-level SDK that handles audio streaming, session management, and tool execution internally.

#### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │     │   Ultravox API  │
│   (React)       │     │   (Express)     │     │                 │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│                 │     │                 │     │                 │
│  1. Request     │────▶│  2. Create      │────▶│  POST /api/calls│
│     Call        │     │     Call via    │     │  with config    │
│                 │◀────│     API Key     │◀────│                 │
│  3. Receive     │     │                 │     │  Returns joinUrl│
│     joinUrl     │     │                 │     │                 │
│                 │     │                 │     │                 │
│  4. SDK joins   │────────────────────────────▶│  WebSocket      │
│     via joinUrl │◀───────────────────────────│  (Audio Stream) │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key Differences from xAI/OpenAI:**

- Uses `ultravox-client` SDK (not raw WebSocket)
- Session-based with `UltravoxSession` class
- Audio handled internally by SDK (no manual PCM encoding)
- Event-driven: `status`, `transcript`, `experimental_message`
- Client-side tool registration via `registerToolImplementation()`

#### Session 4.1: Backend Setup & Dependencies

**Objectives:**

- Add Ultravox backend route for call creation
- Install `ultravox-client` package
- Configure environment variables

**Tasks:**

- [ ] Install `ultravox-client` package: `npm install ultravox-client`
- [ ] Add `ULTRAVOX_API_KEY` to `.env.example`
- [ ] Add `VITE_ULTRAVOX_ENABLED` environment variable
- [ ] Create `server/routes/ultravox.ts` with call creation endpoint
- [ ] Register route in `server/index.js`

**Backend Route Implementation:**

```typescript
// server/routes/ultravox.ts
import express from 'express';

const router = express.Router();

interface UltravoxCallConfig {
  systemPrompt: string;
  model?: string; // e.g., "fixie-ai/ultravox-70B"
  voice?: string; // e.g., "terrence"
  languageHint?: string; // e.g., "en"
  temperature?: number; // 0-1
  maxDuration?: string; // e.g., "300s"
  selectedTools?: object[];
}

router.post('/call', async (req, res) => {
  try {
    const config: UltravoxCallConfig = req.body;

    const response = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ULTRAVOX_API_KEY!,
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Ultravox API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data); // Returns { joinUrl, callId, ... }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Acceptance Criteria:**

- [ ] `POST /api/ultravox/call` returns `joinUrl` and `callId`
- [ ] API key validation works (returns 401 without key)
- [ ] Environment variables documented

#### Session 4.2: Ultravox Voice Context

**Objectives:**

- Create `UltravoxVoiceContext` with session management
- Implement event listeners for status, transcripts
- Map Ultravox states to unified `VoiceProviderState`

**Tasks:**

- [ ] Create `src/contexts/UltravoxVoiceContext.tsx`
- [ ] Implement `UltravoxSession` lifecycle management
- [ ] Handle session events: `status`, `transcript`, `experimental_message`
- [ ] Map Ultravox status to unified state: `idle`, `connecting`, `connected`, `error`
- [ ] Implement mic mute/unmute via SDK
- [ ] Store and update transcript messages

**Type Definitions:**

```typescript
// src/types/ultravox.ts

export type UltravoxStatus =
  | 'disconnected'
  | 'disconnecting'
  | 'connecting'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking';

export interface UltravoxTranscript {
  speaker: 'user' | 'agent';
  text: string;
}

export interface UltravoxCallConfig {
  systemPrompt: string;
  model?: string;
  voice?: string;
  languageHint?: string;
  temperature?: number;
  maxDuration?: string;
  selectedTools?: UltravoxToolDefinition[];
}

export interface UltravoxToolDefinition {
  temporaryTool?: {
    modelToolName: string;
    description: string;
    dynamicParameters?: Array<{
      name: string;
      location: 'PARAMETER_LOCATION_BODY';
      schema: object;
      required: boolean;
    }>;
    client?: {};
  };
}
```

**Context Implementation Pattern:**

```typescript
// src/contexts/UltravoxVoiceContext.tsx

import { UltravoxSession } from 'ultravox-client';

interface UltravoxVoiceState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  ultravoxStatus: UltravoxStatus; // Native SDK status
  isSpeaking: boolean;
  isMicMuted: boolean;
  error: string | null;
  transcripts: UltravoxTranscript[];
  callId: string | null;
}

// Status mapping
const mapUltravoxStatus = (status: UltravoxStatus): VoiceProviderState['status'] => {
  switch (status) {
    case 'disconnected':
    case 'disconnecting':
      return 'idle';
    case 'connecting':
      return 'connecting';
    case 'idle':
    case 'listening':
    case 'thinking':
    case 'speaking':
      return 'connected';
    default:
      return 'error';
  }
};
```

**Acceptance Criteria:**

- [ ] Context provides connect/disconnect functions
- [ ] Status changes trigger UI updates
- [ ] Transcripts are captured and stored
- [ ] Mic mute toggle works via SDK
- [ ] Error states are properly handled

#### Session 4.3: Provider Component & Tab Integration

**Objectives:**

- Create `UltravoxProvider` component
- Integrate with existing tab system
- Wire up shared voice UI components

**Tasks:**

- [ ] Create `src/components/providers/UltravoxProvider.tsx`
- [ ] Add Ultravox to `ProviderType` enum in `voice-provider.ts`
- [ ] Register Ultravox tab in `ProviderContext.tsx`
- [ ] Create Ultravox configuration (system prompt, voice, model)
- [ ] Connect to `VoiceButton`, `VoiceStatus`, `VoiceVisualizer`
- [ ] Add Ultravox branding/logo to tab

**Provider Component Structure:**

```typescript
// src/components/providers/UltravoxProvider.tsx

export const UltravoxProvider: React.FC = () => {
  const {
    status,
    ultravoxStatus,
    transcripts,
    isMicMuted,
    connect,
    disconnect,
    toggleMic
  } = useUltravoxVoice();

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status indicator with Ultravox-specific states */}
      <VoiceStatus
        status={status}
        customStatus={ultravoxStatus} // "listening", "thinking", "speaking"
      />

      {/* Connection button */}
      <VoiceButton
        isConnected={status === 'connected'}
        isConnecting={status === 'connecting'}
        onClick={status === 'connected' ? disconnect : connect}
      />

      {/* Mic mute control */}
      {status === 'connected' && (
        <MicToggleButton
          isMuted={isMicMuted}
          onToggle={toggleMic}
        />
      )}

      {/* Real-time transcript display */}
      <ConversationPanel transcripts={transcripts} />
    </div>
  );
};
```

**Tab Configuration:**

```typescript
// Add to ProviderContext.tsx

const ULTRAVOX_PROVIDER: ProviderConfig = {
  id: 'ultravox',
  name: 'Ultravox',
  displayName: 'Ultravox AI',
  description: 'Fixie.ai voice agent with 70B model',
  icon: UltravoxIcon,
  isEnabled: import.meta.env.VITE_ULTRAVOX_ENABLED === 'true',
  defaultConfig: {
    systemPrompt: 'You are a helpful voice assistant.',
    model: 'fixie-ai/ultravox-70B',
    voice: 'terrence',
    temperature: 0.7,
  },
};
```

**Acceptance Criteria:**

- [ ] Ultravox tab appears when `VITE_ULTRAVOX_ENABLED=true`
- [ ] Tab shows proper branding and icon
- [ ] Connect/disconnect works via button
- [ ] Status shows Ultravox-specific states (listening, thinking, speaking)
- [ ] Mic mute toggle visible when connected

#### Session 4.4: Function Calling & Tools

**Objectives:**

- Implement client-side tool registration
- Create demo tools matching existing pattern
- Display function call results in UI

**Tasks:**

- [ ] Create `src/lib/tools/ultravoxTools.ts` with tool definitions
- [ ] Implement `registerToolImplementation()` integration
- [ ] Add weather, time, calculator tools (matching existing pattern)
- [ ] Create `UltravoxFunctionCallIndicator` component
- [ ] Wire tool results to conversation display

**Tool Registration Pattern:**

```typescript
// src/lib/tools/ultravoxTools.ts

import { ClientToolImplementation } from 'ultravox-client';

export const weatherTool: ClientToolImplementation = (parameters) => {
  const { location } = parameters as { location: string };
  // Simulate weather lookup
  return JSON.stringify({
    location,
    temperature: 72,
    condition: 'Sunny',
    humidity: 45,
  });
};

export const timeTool: ClientToolImplementation = (parameters) => {
  const { timezone } = parameters as { timezone?: string };
  const now = new Date();
  return JSON.stringify({
    time: now.toLocaleTimeString('en-US', { timeZone: timezone }),
    date: now.toLocaleDateString('en-US', { timeZone: timezone }),
  });
};

export const calculatorTool: ClientToolImplementation = (parameters) => {
  const { expression } = parameters as { expression: string };
  try {
    // Safe evaluation (in production, use a proper math parser)
    const result = Function(`"use strict"; return (${expression})`)();
    return JSON.stringify({ expression, result });
  } catch {
    return JSON.stringify({ error: 'Invalid expression' });
  }
};

// Tool definitions for Ultravox API
export const ultravoxToolDefinitions = [
  {
    temporaryTool: {
      modelToolName: 'getWeather',
      description: 'Get current weather for a location',
      dynamicParameters: [
        {
          name: 'location',
          location: 'PARAMETER_LOCATION_BODY',
          schema: { type: 'string', description: 'City name' },
          required: true,
        },
      ],
      client: {},
    },
  },
  {
    temporaryTool: {
      modelToolName: 'getTime',
      description: 'Get current time, optionally in a specific timezone',
      dynamicParameters: [
        {
          name: 'timezone',
          location: 'PARAMETER_LOCATION_BODY',
          schema: { type: 'string', description: 'Timezone (e.g., America/New_York)' },
          required: false,
        },
      ],
      client: {},
    },
  },
  {
    temporaryTool: {
      modelToolName: 'calculate',
      description: 'Evaluate a mathematical expression',
      dynamicParameters: [
        {
          name: 'expression',
          location: 'PARAMETER_LOCATION_BODY',
          schema: { type: 'string', description: 'Math expression (e.g., 2 + 2)' },
          required: true,
        },
      ],
      client: {},
    },
  },
];
```

**Tool Registration in Context:**

```typescript
// In UltravoxVoiceContext.tsx connect function

const session = new UltravoxSession();

// Register client-side tools
session.registerToolImplementation('getWeather', weatherTool);
session.registerToolImplementation('getTime', timeTool);
session.registerToolImplementation('calculate', calculatorTool);

// Join with tool definitions
const response = await fetch('/api/ultravox/call', {
  method: 'POST',
  body: JSON.stringify({
    ...config,
    selectedTools: ultravoxToolDefinitions,
  }),
});
```

**Acceptance Criteria:**

- [ ] Tools are registered before session starts
- [ ] Tool calls are executed client-side
- [ ] Tool results are returned to Ultravox
- [ ] Function call indicator shows execution status
- [ ] Tool results appear in conversation

#### Session 4.5: Polish, Testing & Voice Selection

**Objectives:**

- Add voice selection dropdown
- Implement reconnection with backoff
- Add comprehensive tests
- Final UI polish

**Tasks:**

- [ ] Create `UltravoxVoiceSelector` with available voices
- [ ] Integrate `useReconnection` hook for auto-reconnect
- [ ] Add unit tests for `UltravoxVoiceContext`
- [ ] Add integration tests for tab switching with Ultravox
- [ ] Add debug message viewer (optional, via flag)
- [ ] Mobile responsive testing
- [ ] Error handling polish

**Available Ultravox Voices:**

- `terrence` (default)
- Additional voices as supported by API

**Voice Selector Implementation:**

```typescript
// Add voice selection to UltravoxProvider

const ULTRAVOX_VOICES = [
  { id: 'terrence', name: 'Terrence', description: 'Default male voice' },
  // Add more voices as Ultravox API supports them
];

<VoiceSelector
  voices={ULTRAVOX_VOICES}
  selectedVoice={config.voice}
  onVoiceChange={(voice) => updateConfig({ voice })}
  disabled={status !== 'idle'}
/>
```

**Test Cases:**

```typescript
// src/test/UltravoxVoiceContext.test.tsx

describe('UltravoxVoiceContext', () => {
  it('should start in idle state', () => {});
  it('should transition to connecting on connect()', () => {});
  it('should handle successful connection', () => {});
  it('should handle connection errors', () => {});
  it('should update transcripts on transcript event', () => {});
  it('should toggle mic mute state', () => {});
  it('should clean up session on disconnect', () => {});
  it('should register tools before joining', () => {});
});
```

**Acceptance Criteria:**

- [ ] Voice selection works before connection
- [ ] Reconnection triggers on unexpected disconnect
- [ ] All tests pass (unit + integration)
- [ ] Debug view toggleable via query param
- [ ] Mobile UI works correctly
- [ ] Error messages are user-friendly

### Phase 5: Vapi Voice Agent Integration

Vapi is a voice AI platform that provides a simple SDK for building voice-enabled applications. Unlike other providers that require backend token generation, Vapi uses a **web token** (public API key) that's safe for frontend use. Under the hood, Vapi uses Daily.co for WebRTC audio streaming.

**Reference Implementation:** `VAPI_EXAMPLE/` contains a working React + Vapi integration.

#### Architecture Overview

```
┌─────────────────┐                              ┌─────────────────┐
│   Frontend      │                              │   Vapi API      │
│   (React)       │                              │   + Daily.co    │
├─────────────────┤                              ├─────────────────┤
│                 │                              │                 │
│  1. Initialize  │─────────────────────────────▶│  Validate       │
│     Vapi SDK    │                              │  Web Token      │
│     w/ token    │                              │                 │
│                 │                              │                 │
│  2. Start call  │─────────────────────────────▶│  Create Call    │
│     w/ config   │                              │  (via Daily.co) │
│                 │                              │                 │
│  3. WebRTC      │◀────────────────────────────▶│  Audio Stream   │
│     Audio       │                              │  (Realtime)     │
│                 │                              │                 │
└─────────────────┘                              └─────────────────┘
```

**Key Differences from Other Providers:**

- Uses **web token** (no backend token exchange required)
- Can use pre-created `assistantId` OR inline `CreateAssistantDTO` config
- Built on Daily.co WebRTC infrastructure
- Rich event system: `call-start`, `call-end`, `speech-start`, `speech-end`, `message`, `volume-level`, `error`
- Native function calling support via `message` events
- Supports partial transcripts for real-time typing indicators

#### Session 5.1: Dependencies & CSP Configuration

**Objectives:**

- Install Vapi SDK package
- Configure Content Security Policy for Vapi + Daily.co
- Add environment variables

**Tasks:**

- [ ] Install `@vapi-ai/web` package: `npm install @vapi-ai/web@^1.0.255`
- [ ] Add `VITE_VAPI_ENABLED` environment variable
- [ ] Add `VITE_VAPI_WEB_TOKEN` environment variable (web token from Vapi dashboard)
- [ ] Add `VITE_VAPI_API_URL` (optional) environment variable for custom endpoints
- [ ] Add `VITE_VAPI_ASSISTANT_ID` (optional) environment variable for pre-created assistants
- [ ] Update CSP in `index.html` to allow Vapi and Daily.co domains
- [ ] Update `.env.example` with new variables
- [ ] Document CSP requirements

**CSP Configuration:**

```html
<!-- Add to connect-src in index.html -->
https://api.vapi.ai https://*.vapi.ai wss://*.vapi.ai https://*.daily.co wss://*.daily.co
https://*.pipecdn.app
```

**Environment Variables:**

```env
# Frontend (web token is safe to expose - get from Vapi dashboard)
VITE_VAPI_ENABLED=true
VITE_VAPI_WEB_TOKEN=your-vapi-web-token
VITE_VAPI_API_URL=https://api.vapi.ai      # Optional: custom API endpoint
VITE_VAPI_ASSISTANT_ID=your-assistant-id   # Optional: use pre-created assistant
VITE_VAPI_VOICE=paula                       # Default voice (11labs voice ID)
VITE_VAPI_MODEL=gpt-3.5-turbo              # Default model
VITE_VAPI_SYSTEM_PROMPT="You are a helpful voice assistant."
VITE_VAPI_FIRST_MESSAGE="Hello! How can I help you today?"
```

**Acceptance Criteria:**

- [ ] Package installed and importable (`@vapi-ai/web` v1.0.255+)
- [ ] CSP allows all required Vapi/Daily.co domains
- [ ] Environment variables documented in `.env.example`
- [ ] `CreateAssistantDTO` type importable from `@vapi-ai/web/dist/api`

#### Session 5.2: Vapi Voice Hook & SDK Singleton

**Objectives:**

- Create SDK singleton for Vapi instance management
- Create `useVapiVoice` hook (follows sample code pattern)
- Implement event listeners for all Vapi events
- Handle partial transcripts for real-time typing indicators

**Tasks:**

- [ ] Create `src/lib/vapi.ts` for SDK singleton instance
- [ ] Create `src/hooks/useVapiVoice.ts` with state management
- [ ] Create `src/types/vapi.ts` with type definitions
- [ ] Handle events: `call-start`, `call-end`, `speech-start`, `speech-end`, `volume-level`, `message`, `error`
- [ ] Implement `activeTranscript` state for partial transcripts (typing indicator UX)
- [ ] Map Vapi call status to unified state: `idle`, `connecting`, `connected`, `error`
- [ ] Store and update final transcript messages
- [ ] Implement cleanup on unmount (remove event listeners)

**Type Definitions:**

```typescript
// src/types/vapi.ts

export enum VapiCallStatus {
  INACTIVE = 'inactive',
  LOADING = 'loading',
  ACTIVE = 'active',
}

export enum VapiMessageType {
  TRANSCRIPT = 'transcript',
  FUNCTION_CALL = 'function-call',
  FUNCTION_CALL_RESULT = 'function-call-result',
  ADD_MESSAGE = 'add-message', // System-added messages
}

export enum VapiMessageRole {
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
}

export enum VapiTranscriptType {
  PARTIAL = 'partial',
  FINAL = 'final',
}

export interface VapiTranscriptMessage {
  type: VapiMessageType.TRANSCRIPT;
  role: VapiMessageRole;
  transcriptType: VapiTranscriptType;
  transcript: string;
}

export interface VapiFunctionCallMessage {
  type: VapiMessageType.FUNCTION_CALL;
  functionCall: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

export interface VapiFunctionCallResultMessage {
  type: VapiMessageType.FUNCTION_CALL_RESULT;
  functionCallResult: {
    forwardToClientEnabled?: boolean;
    result: unknown;
    [key: string]: unknown;
  };
}

export type VapiMessage =
  | VapiTranscriptMessage
  | VapiFunctionCallMessage
  | VapiFunctionCallResultMessage;

export interface VapiVoiceState {
  callStatus: VapiCallStatus;
  isSpeechActive: boolean;
  error: string | null;
  messages: VapiMessage[];
  activeTranscript: VapiTranscriptMessage | null; // Partial transcript in progress
  audioLevel: number;
}
```

**SDK Singleton Pattern (from sample):**

```typescript
// src/lib/vapi.ts

import Vapi from '@vapi-ai/web';

const token = import.meta.env.VITE_VAPI_WEB_TOKEN;
const apiUrl = import.meta.env.VITE_VAPI_API_URL ?? 'https://api.vapi.ai';

export const vapi = new Vapi(token);
```

**Hook Implementation Pattern (from sample):**

```typescript
// src/hooks/useVapiVoice.ts

import { CreateAssistantDTO } from '@vapi-ai/web/dist/api';
import { useEffect, useState } from 'react';
import { vapi } from '@/lib/vapi';
import {
  VapiCallStatus,
  VapiMessage,
  VapiMessageType,
  VapiTranscriptMessage,
  VapiTranscriptType,
} from '@/types/vapi';

export function useVapiVoice() {
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [callStatus, setCallStatus] = useState<VapiCallStatus>(VapiCallStatus.INACTIVE);
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<VapiTranscriptMessage | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onSpeechStart = () => setIsSpeechActive(true);
    const onSpeechEnd = () => setIsSpeechActive(false);
    const onCallStart = () => setCallStatus(VapiCallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(VapiCallStatus.INACTIVE);
    const onVolumeLevel = (volume: number) => setAudioLevel(volume);
    const onError = (e: Error) => {
      setError(e.message);
      setCallStatus(VapiCallStatus.INACTIVE);
    };

    // Handle messages with partial transcript support
    const onMessage = (message: VapiMessage) => {
      if (
        message.type === VapiMessageType.TRANSCRIPT &&
        message.transcriptType === VapiTranscriptType.PARTIAL
      ) {
        // Show partial transcript as typing indicator
        setActiveTranscript(message as VapiTranscriptMessage);
      } else {
        // Final message - add to history and clear active
        setMessages((prev) => [...prev, message]);
        setActiveTranscript(null);
      }
    };

    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('volume-level', onVolumeLevel);
    vapi.on('message', onMessage);
    vapi.on('error', onError);

    return () => {
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('volume-level', onVolumeLevel);
      vapi.off('message', onMessage);
      vapi.off('error', onError);
    };
  }, []);

  const start = async (config?: CreateAssistantDTO | string) => {
    setCallStatus(VapiCallStatus.LOADING);
    setError(null);
    vapi.start(config);
  };

  const stop = () => {
    setCallStatus(VapiCallStatus.LOADING);
    vapi.stop();
  };

  const toggleCall = (config?: CreateAssistantDTO | string) => {
    if (callStatus === VapiCallStatus.ACTIVE) {
      stop();
    } else {
      start(config);
    }
  };

  return {
    isSpeechActive,
    callStatus,
    audioLevel,
    activeTranscript,
    messages,
    error,
    start,
    stop,
    toggleCall,
  };
}
```

**Acceptance Criteria:**

- [ ] SDK singleton exports `vapi` instance
- [ ] Hook provides `start`/`stop`/`toggleCall` functions
- [ ] All Vapi events are handled with proper cleanup
- [ ] Partial transcripts stored in `activeTranscript` (typing indicator)
- [ ] Final transcripts appended to `messages` array
- [ ] Error states are properly handled and exposed
- [ ] `CreateAssistantDTO` type used for inline config

#### Session 5.3: Provider Component & Tab Integration

**Objectives:**

- Create `VapiProvider` component using `useVapiVoice` hook
- Integrate with existing tab system
- Wire up shared voice UI components with activeTranscript support

**Tasks:**

- [ ] Create `src/components/providers/VapiProvider.tsx`
- [ ] Add `vapi` to `ProviderType` enum in `voice-provider.ts`
- [ ] Add `isVapiEnabled()` function in `voice-provider.ts`
- [ ] Register Vapi in `PROVIDERS` configuration
- [ ] Update `ProviderContext.tsx` with Vapi provider
- [ ] Create `VapiButton.tsx` with audio level visualization (glow effect)
- [ ] Add Vapi branding/icon (use existing icons or add Vapi logo)
- [ ] Create `VapiEmptyState` for unconfigured state (no token)
- [ ] Pass `activeTranscript` to `ConversationPanel` for typing indicator

**Provider Component Structure (from sample):**

```typescript
// src/components/providers/VapiProvider.tsx

import { CreateAssistantDTO } from '@vapi-ai/web/dist/api';
import { useVapiVoice } from '@/hooks/useVapiVoice';
import { VapiCallStatus } from '@/types/vapi';
import { VapiButton } from './VapiButton';
import { MessageList } from '@/features/Messages';

// Build assistant config from env vars or use assistantId
const getAssistantConfig = (): CreateAssistantDTO | string => {
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
  if (assistantId) return assistantId;

  return {
    name: 'Voice Assistant',
    model: {
      provider: 'openai',
      model: import.meta.env.VITE_VAPI_MODEL ?? 'gpt-3.5-turbo',
      temperature: 0.7,
      systemPrompt: import.meta.env.VITE_VAPI_SYSTEM_PROMPT ?? 'You are a helpful voice assistant.',
      functions: [], // Add functions here if needed
    },
    voice: {
      provider: '11labs',
      voiceId: import.meta.env.VITE_VAPI_VOICE ?? 'paula',
    },
    firstMessage: import.meta.env.VITE_VAPI_FIRST_MESSAGE ?? 'Hello! How can I help you today?',
  };
};

export const VapiProvider: React.FC = () => {
  const {
    callStatus,
    isSpeechActive,
    messages,
    activeTranscript,
    audioLevel,
    error,
    toggleCall,
  } = useVapiVoice();

  const handleToggle = () => {
    toggleCall(getAssistantConfig());
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status indicator */}
      <VoiceStatus
        status={callStatus === VapiCallStatus.ACTIVE ? 'connected' : 'idle'}
        isSpeaking={isSpeechActive}
      />

      {/* Error display */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {/* Voice button with audio level visualization */}
      <VapiButton
        callStatus={callStatus}
        audioLevel={audioLevel}
        toggleCall={handleToggle}
      />

      {/* Conversation panel with activeTranscript for typing indicator */}
      <MessageList
        messages={messages}
        activeTranscript={activeTranscript}
      />
    </div>
  );
};
```

**VapiButton Component (from sample):**

```typescript
// src/components/providers/VapiButton.tsx

import { Loader2, Mic, Square } from 'lucide-react';
import { VapiCallStatus } from '@/types/vapi';

interface VapiButtonProps {
  callStatus: VapiCallStatus;
  audioLevel?: number;
  toggleCall: () => void;
}

export const VapiButton: React.FC<VapiButtonProps> = ({
  callStatus,
  audioLevel = 0,
  toggleCall,
}) => {
  const color =
    callStatus === VapiCallStatus.ACTIVE
      ? 'red'
      : callStatus === VapiCallStatus.LOADING
      ? 'orange'
      : 'green';

  const buttonStyle = {
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    color: 'white',
    border: 'none',
    boxShadow: `1px 1px ${10 + audioLevel * 40}px ${audioLevel * 10}px ${color}`,
    cursor: 'pointer',
  };

  return (
    <button
      style={buttonStyle}
      className={`transition ease-in-out ${
        callStatus === VapiCallStatus.ACTIVE
          ? 'bg-red-500 hover:bg-red-700'
          : callStatus === VapiCallStatus.LOADING
          ? 'bg-orange-500 hover:bg-orange-700'
          : 'bg-green-500 hover:bg-green-700'
      } flex items-center justify-center`}
      onClick={toggleCall}
    >
      {callStatus === VapiCallStatus.ACTIVE ? (
        <Square />
      ) : callStatus === VapiCallStatus.LOADING ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Mic />
      )}
    </button>
  );
};
```

**Tab Configuration:**

```typescript
// Add to voice-provider.ts

const isVapiEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_VAPI_ENABLED;
  return envValue === 'true' || envValue === true;
};

// Add to PROVIDERS
vapi: {
  id: 'vapi',
  name: 'Vapi',
  description: 'Vapi AI voice conversations',
  isAvailable: isVapiEnabled(),
  requiresApiKey: true,
  icon: 'PhoneCall',
},
```

**Acceptance Criteria:**

- [ ] Vapi tab appears when `VITE_VAPI_ENABLED=true`
- [ ] Tab shows proper branding and icon
- [ ] Connect/disconnect works via button
- [ ] Button color changes: green (idle) → orange (loading) → red (active)
- [ ] Audio level visualization (glow effect) works during call
- [ ] `activeTranscript` displayed as typing indicator in conversation
- [ ] Empty state shown when `VITE_VAPI_WEB_TOKEN` not configured

#### Session 5.4: Testing, Polish & Documentation

**Objectives:**

- Add comprehensive tests for hook and components
- Implement function calling support (via CreateAssistantDTO)
- Final UI polish and documentation

**Tasks:**

- [ ] Create `src/test/useVapiVoice.test.ts` with unit tests
- [ ] Create `src/test/VapiProvider.test.tsx` with component tests
- [ ] Add integration tests for tab switching with Vapi
- [ ] Implement function definitions in assistant config
- [ ] Create `VapiFunctionCallResult` component (from sample)
- [ ] Add Vapi configuration to `ConfigurationModal`
- [ ] Mobile responsive testing
- [ ] Error handling polish (user-friendly messages)
- [ ] Update CLAUDE.md with Vapi documentation
- [ ] Update README with Vapi setup instructions

**Function Calling Implementation (via CreateAssistantDTO):**

Functions are defined in the assistant configuration and handled automatically:

```typescript
// Define functions in assistant config
const assistantConfig: CreateAssistantDTO = {
  name: 'Voice Assistant',
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are a helpful assistant that can get weather info.',
    functions: [
      {
        name: 'getWeather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name (e.g., "San Francisco")',
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'getTime',
        description: 'Get current time in a timezone',
        parameters: {
          type: 'object',
          properties: {
            timezone: {
              type: 'string',
              description: 'Timezone (e.g., "America/New_York")',
            },
          },
        },
      },
    ],
  },
  voice: { provider: '11labs', voiceId: 'paula' },
  firstMessage: 'Hello! I can help you check the weather or time.',
};

// Function call results come through message events
// Display using FunctionCallResult component
```

**FunctionCallResult Component (from sample):**

```typescript
// src/components/voice/FunctionCallResult.tsx

import { VapiFunctionCallResultMessage } from '@/types/vapi';

interface FunctionCallResultProps {
  message: VapiFunctionCallResultMessage;
}

export const FunctionCallResult: React.FC<FunctionCallResultProps> = ({ message }) => {
  return (
    <div className="flex w-4/5 text-sm mb-4 justify-end font-medium mx-auto">
      <div className="p-3 rounded-xl bg-green-100 mx-auto">
        <p className="leading-relaxed">{String(message.functionCallResult.result)}</p>
      </div>
    </div>
  );
};
```

**Test Cases:**

```typescript
// src/test/useVapiVoice.test.ts

describe('useVapiVoice', () => {
  it('should start with INACTIVE call status', () => {});
  it('should set LOADING status on start()', () => {});
  it('should set ACTIVE status on call-start event', () => {});
  it('should set INACTIVE status on call-end event', () => {});
  it('should update isSpeechActive on speech events', () => {});
  it('should update audioLevel on volume-level event', () => {});
  it('should store partial transcripts in activeTranscript', () => {});
  it('should move final transcripts to messages array', () => {});
  it('should clear activeTranscript when final message received', () => {});
  it('should handle function-call messages', () => {});
  it('should handle function-call-result messages', () => {});
  it('should set error state on error event', () => {});
  it('should cleanup event listeners on unmount', () => {});
  it('should accept assistantId string in start()', () => {});
  it('should accept CreateAssistantDTO in start()', () => {});
});

// src/test/VapiProvider.test.tsx

describe('VapiProvider', () => {
  it('should render VapiButton component', () => {});
  it('should display error message when error state set', () => {});
  it('should show activeTranscript in MessageList', () => {});
  it('should call toggleCall with config on button click', () => {});
});
```

**Acceptance Criteria:**

- [ ] All tests pass (unit + integration)
- [ ] Function definitions work in assistant config
- [ ] Function call results display in conversation
- [ ] `activeTranscript` shows typing indicator correctly
- [ ] Configuration modal has Vapi settings
- [ ] Mobile UI works correctly
- [ ] Error messages are user-friendly
- [ ] Documentation is complete (CLAUDE.md, README)

### Phase 6: Retell Voice Agent Integration

Retell is a voice AI platform that provides a simple event-driven SDK for building conversational voice applications. Unlike Vapi which uses a web token directly, Retell requires backend token generation per-call using the `retell-client-js-sdk` package.

**Reference Implementation:** `RETELL_EXAMPLE/` contains a working React + Express integration.

#### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │     │   Retell API    │
│   (React)       │     │   (Express)     │     │                 │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│                 │     │                 │     │                 │
│  1. Request     │────▶│  2. Register    │────▶│  POST           │
│     Call        │     │     Web Call    │     │  /v2/create-    │
│                 │◀────│     via API Key │◀────│  web-call       │
│  3. Receive     │     │                 │     │                 │
│     accessToken │     │                 │     │  Returns token  │
│                 │     │                 │     │                 │
│  4. SDK starts  │────────────────────────────▶│  WebSocket      │
│     call w/     │◀───────────────────────────│  Audio Stream   │
│     token       │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key Differences from Other Providers:**

- Uses **per-call access tokens** (backend generates token for each call)
- Event-driven SDK with `call_started`, `call_ended`, `update`, `error` events
- Agent configuration done in Retell dashboard (not at call time)
- Transcript limited to **last 5 sentences** (must manage history locally)
- Raw audio available via `audio` event (Float32Array PCM data)
- `metadata` event for agent-to-frontend communication
- No built-in conversation history persistence

#### Session 6.1: Dependencies & Backend Setup

**Objectives:**

- Install Retell client SDK package
- Create backend endpoint for call registration
- Configure environment variables

**Tasks:**

- [ ] Install `retell-client-js-sdk` package: `npm install retell-client-js-sdk@^2.0.3`
- [ ] Add `VITE_RETELL_ENABLED` environment variable
- [ ] Add `VITE_RETELL_AGENT_ID` environment variable (agent created in Retell dashboard)
- [ ] Add `RETELL_API_KEY` backend environment variable
- [ ] Create `server/routes/retell.ts` with call registration endpoint
- [ ] Register route in `server/index.js`
- [ ] Update `.env.example` with new variables

**Backend Route Implementation:**

```typescript
// server/routes/retell.ts
import express from 'express';
import axios from 'axios';

const router = express.Router();

interface RetellWebCallRequest {
  agent_id: string;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, string>;
}

interface RetellWebCallResponse {
  access_token: string;
  call_id: string;
}

router.post('/create-web-call', async (req, res) => {
  try {
    const { agent_id, metadata, retell_llm_dynamic_variables } = req.body as RetellWebCallRequest;

    const payload: RetellWebCallRequest = { agent_id };
    if (metadata) payload.metadata = metadata;
    if (retell_llm_dynamic_variables)
      payload.retell_llm_dynamic_variables = retell_llm_dynamic_variables;

    const response = await axios.post<RetellWebCallResponse>(
      'https://api.retellai.com/v2/create-web-call',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Retell API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create web call',
    });
  }
});

export default router;
```

**Environment Variables:**

```env
# Frontend
VITE_RETELL_ENABLED=true
VITE_RETELL_AGENT_ID=your-retell-agent-id  # Created in Retell dashboard

# Backend (server-side only)
RETELL_API_KEY=your-retell-api-key
```

**Acceptance Criteria:**

- [ ] Package installed and importable (`retell-client-js-sdk` v2.0.3+)
- [ ] `POST /api/retell/create-web-call` returns `access_token` and `call_id`
- [ ] API key validation works (returns 401 without key)
- [ ] Environment variables documented in `.env.example`

#### Session 6.2: Retell Voice Hook & SDK Integration

**Objectives:**

- Create `useRetellVoice` hook with event handling
- Implement SDK instance management
- Handle all Retell events: `call_started`, `call_ended`, `update`, `error`, `agent_start_talking`, `agent_stop_talking`

**Tasks:**

- [ ] Create `src/types/retell.ts` with type definitions
- [ ] Create `src/hooks/useRetellVoice.ts` with state management
- [ ] Handle events: `call_started`, `call_ended`, `agent_start_talking`, `agent_stop_talking`, `update`, `error`
- [ ] Implement local transcript history management (SDK only provides last 5 sentences)
- [ ] Map Retell call status to unified state: `idle`, `connecting`, `connected`, `error`
- [ ] Implement cleanup on unmount (event listener removal)

**Type Definitions:**

```typescript
// src/types/retell.ts

export enum RetellCallStatus {
  INACTIVE = 'inactive',
  LOADING = 'loading',
  ACTIVE = 'active',
}

export interface RetellTranscript {
  role: 'user' | 'agent';
  content: string;
  timestamp?: number;
}

export interface RetellUpdateEvent {
  transcript?: string;
  [key: string]: unknown;
}

export interface RetellMetadataEvent {
  [key: string]: unknown;
}

export interface RetellVoiceState {
  callStatus: RetellCallStatus;
  isAgentTalking: boolean;
  error: string | null;
  transcripts: RetellTranscript[];
  latestTranscript: string | null; // Last 5 sentences from SDK
}

export interface RetellCallConfig {
  agentId: string;
  metadata?: Record<string, unknown>;
  llmDynamicVariables?: Record<string, string>;
}
```

**Hook Implementation Pattern:**

```typescript
// src/hooks/useRetellVoice.ts

import { RetellWebClient } from 'retell-client-js-sdk';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  RetellCallStatus,
  RetellTranscript,
  RetellUpdateEvent,
  RetellCallConfig,
} from '@/types/retell';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function useRetellVoice() {
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const [callStatus, setCallStatus] = useState<RetellCallStatus>(RetellCallStatus.INACTIVE);
  const [isAgentTalking, setIsAgentTalking] = useState(false);
  const [transcripts, setTranscripts] = useState<RetellTranscript[]>([]);
  const [latestTranscript, setLatestTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize SDK
    retellClientRef.current = new RetellWebClient();
    const client = retellClientRef.current;

    // Event handlers
    client.on('call_started', () => {
      setCallStatus(RetellCallStatus.ACTIVE);
      setError(null);
    });

    client.on('call_ended', () => {
      setCallStatus(RetellCallStatus.INACTIVE);
      setIsAgentTalking(false);
    });

    client.on('agent_start_talking', () => {
      setIsAgentTalking(true);
    });

    client.on('agent_stop_talking', () => {
      setIsAgentTalking(false);
    });

    client.on('update', (update: RetellUpdateEvent) => {
      if (update.transcript) {
        setLatestTranscript(update.transcript);
        // Parse and add to local transcript history if needed
      }
    });

    client.on('error', (err: Error) => {
      console.error('Retell error:', err);
      setError(err.message);
      setCallStatus(RetellCallStatus.INACTIVE);
    });

    return () => {
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
    };
  }, []);

  const registerCall = async (config: RetellCallConfig) => {
    const response = await fetch(`${API_BASE_URL}/api/retell/create-web-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: config.agentId,
        metadata: config.metadata,
        retell_llm_dynamic_variables: config.llmDynamicVariables,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register call');
    }

    return response.json();
  };

  const startCall = useCallback(async (config: RetellCallConfig) => {
    if (!retellClientRef.current) return;

    setCallStatus(RetellCallStatus.LOADING);
    setError(null);
    setTranscripts([]);

    try {
      const { access_token } = await registerCall(config);
      await retellClientRef.current.startCall({ accessToken: access_token });
    } catch (err: any) {
      setError(err.message);
      setCallStatus(RetellCallStatus.INACTIVE);
    }
  }, []);

  const stopCall = useCallback(() => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
    }
  }, []);

  const toggleCall = useCallback(
    (config: RetellCallConfig) => {
      if (callStatus === RetellCallStatus.ACTIVE) {
        stopCall();
      } else {
        startCall(config);
      }
    },
    [callStatus, startCall, stopCall]
  );

  return {
    callStatus,
    isAgentTalking,
    transcripts,
    latestTranscript,
    error,
    startCall,
    stopCall,
    toggleCall,
  };
}
```

**Acceptance Criteria:**

- [ ] SDK instance created and managed properly
- [ ] Hook provides `startCall`/`stopCall`/`toggleCall` functions
- [ ] All Retell events handled with proper cleanup
- [ ] `isAgentTalking` reflects agent speaking state
- [ ] `latestTranscript` updated on `update` events
- [ ] Error states properly handled and exposed
- [ ] Local transcript history maintained (since SDK only provides last 5)

#### Session 6.3: Provider Component & Tab Integration

**Objectives:**

- Create `RetellProvider` component using `useRetellVoice` hook
- Integrate with existing tab system
- Wire up shared voice UI components

**Tasks:**

- [ ] Create `src/components/providers/RetellProvider.tsx`
- [ ] Add `retell` to `ProviderType` enum in `voice-provider.ts`
- [ ] Add `isRetellEnabled()` function in `voice-provider.ts`
- [ ] Register Retell in `PROVIDERS` configuration
- [ ] Update `ProviderContext.tsx` with Retell provider
- [ ] Create `RetellButton.tsx` with talking state visualization
- [ ] Add Retell branding/icon
- [ ] Create `RetellEmptyState` for unconfigured state (no agent ID)
- [ ] Display transcript in `ConversationPanel`

**Provider Component Structure:**

```typescript
// src/components/providers/RetellProvider.tsx

import { useRetellVoice } from '@/hooks/useRetellVoice';
import { RetellCallStatus } from '@/types/retell';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { VoiceStatus } from '@/components/voice/VoiceStatus';
import { ConversationPanel } from '@/components/voice/ConversationPanel';

const RETELL_AGENT_ID = import.meta.env.VITE_RETELL_AGENT_ID;

export const RetellProvider: React.FC = () => {
  const {
    callStatus,
    isAgentTalking,
    transcripts,
    latestTranscript,
    error,
    toggleCall,
  } = useRetellVoice();

  const handleToggle = () => {
    toggleCall({ agentId: RETELL_AGENT_ID });
  };

  // Map to unified status
  const status = callStatus === RetellCallStatus.ACTIVE
    ? 'connected'
    : callStatus === RetellCallStatus.LOADING
    ? 'connecting'
    : 'idle';

  if (!RETELL_AGENT_ID) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Retell Agent ID not configured. Set VITE_RETELL_AGENT_ID in your environment.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status indicator */}
      <VoiceStatus
        status={status}
        isSpeaking={isAgentTalking}
      />

      {/* Error display */}
      {error && (
        <div className="text-red-500 text-sm" role="alert">{error}</div>
      )}

      {/* Voice button */}
      <VoiceButton
        isConnected={callStatus === RetellCallStatus.ACTIVE}
        isConnecting={callStatus === RetellCallStatus.LOADING}
        onClick={handleToggle}
        isSpeaking={isAgentTalking}
      />

      {/* Conversation panel */}
      <ConversationPanel
        messages={transcripts.map(t => ({
          role: t.role === 'agent' ? 'assistant' : 'user',
          content: t.content,
        }))}
      />

      {/* Latest transcript indicator */}
      {latestTranscript && callStatus === RetellCallStatus.ACTIVE && (
        <div className="text-sm text-muted-foreground italic max-w-md text-center">
          {latestTranscript}
        </div>
      )}
    </div>
  );
};
```

**Tab Configuration:**

```typescript
// Add to voice-provider.ts

export const isRetellEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_RETELL_ENABLED;
  return envValue === 'true' || envValue === true;
};

// Add to PROVIDERS
retell: {
  id: 'retell',
  name: 'Retell',
  description: 'Retell AI voice conversations',
  isAvailable: isRetellEnabled(),
  requiresApiKey: true,
  icon: 'Phone',  // or custom Retell icon
},
```

**Acceptance Criteria:**

- [ ] Retell tab appears when `VITE_RETELL_ENABLED=true`
- [ ] Tab shows proper branding and icon
- [ ] Connect/disconnect works via button
- [ ] Button shows `isAgentTalking` state visually
- [ ] Transcript displayed in conversation panel
- [ ] Empty state shown when `VITE_RETELL_AGENT_ID` not configured

#### Session 6.4: Testing, Polish & Documentation

**Objectives:**

- Add comprehensive tests for hook and components
- Handle metadata events for enhanced functionality
- Final UI polish and documentation

**Tasks:**

- [ ] Create `src/test/useRetellVoice.test.ts` with unit tests
- [ ] Create `src/test/RetellProvider.test.tsx` with component tests
- [ ] Add integration tests for tab switching with Retell
- [ ] Handle `metadata` event for agent-to-frontend communication
- [ ] Handle `audio` event for optional raw audio visualization
- [ ] Mobile responsive testing
- [ ] Error handling polish (user-friendly messages)
- [ ] Update CLAUDE.md with Retell documentation
- [ ] Update README with Retell setup instructions

**Metadata Event Handling (Optional Enhancement):**

```typescript
// In useRetellVoice.ts - handle metadata from agent

const [agentMetadata, setAgentMetadata] = useState<Record<string, unknown> | null>(null);

client.on('metadata', (metadata: Record<string, unknown>) => {
  setAgentMetadata(metadata);
  // Can trigger UI changes, show information, etc.
});
```

**Audio Event Handling (Optional Enhancement):**

```typescript
// For custom audio visualization
client.on('audio', (audioData: Float32Array) => {
  // Process PCM audio data for visualization
  // audioData is raw Float32Array PCM samples
});
```

**Test Cases:**

```typescript
// src/test/useRetellVoice.test.ts

describe('useRetellVoice', () => {
  it('should start with INACTIVE call status', () => {});
  it('should set LOADING status on startCall()', () => {});
  it('should set ACTIVE status on call_started event', () => {});
  it('should set INACTIVE status on call_ended event', () => {});
  it('should update isAgentTalking on agent_start/stop_talking events', () => {});
  it('should update latestTranscript on update event', () => {});
  it('should set error state on error event', () => {});
  it('should cleanup event listeners on unmount', () => {});
  it('should call backend /api/retell/create-web-call on startCall', () => {});
  it('should handle backend errors gracefully', () => {});
});

// src/test/RetellProvider.test.tsx

describe('RetellProvider', () => {
  it('should render VoiceButton component', () => {});
  it('should display error message when error state set', () => {});
  it('should show empty state when agent ID not configured', () => {});
  it('should display transcripts in ConversationPanel', () => {});
  it('should call toggleCall on button click', () => {});
});
```

**Acceptance Criteria:**

- [ ] All tests pass (unit + integration)
- [ ] Metadata events handled (if used by agent)
- [ ] Audio events handled for visualization (optional)
- [ ] Mobile UI works correctly
- [ ] Error messages are user-friendly
- [ ] Documentation complete (CLAUDE.md, README)

---

## 7. Environment Variables

### Current (ElevenLabs)

```env
VITE_ELEVENLABS_AGENT_ID=your-agent-id
VITE_API_BASE_URL=http://localhost:3001
ELEVENLABS_API_KEY=sk-... # Server-side only
```

### New (xAI)

```env
VITE_XAI_ENABLED=true
VITE_XAI_VOICE=default
VITE_XAI_INSTRUCTIONS="You are a helpful assistant..."
XAI_API_KEY=xai-... # Server-side only
```

### Future (OpenAI)

```env
VITE_OPENAI_ENABLED=true
OPENAI_API_KEY=sk-... # Server-side only
```

### New (Ultravox)

```env
VITE_ULTRAVOX_ENABLED=true
VITE_ULTRAVOX_VOICE=terrence
VITE_ULTRAVOX_MODEL=fixie-ai/ultravox-70B
VITE_ULTRAVOX_SYSTEM_PROMPT="You are a helpful voice assistant..."
ULTRAVOX_API_KEY=uvx-... # Server-side only
```

### New (Vapi)

```env
# Frontend (web token is safe to expose - get from Vapi dashboard)
VITE_VAPI_ENABLED=true
VITE_VAPI_WEB_TOKEN=your-vapi-web-token
VITE_VAPI_API_URL=https://api.vapi.ai      # Optional: custom API endpoint
VITE_VAPI_ASSISTANT_ID=your-assistant-id   # Optional: use pre-created assistant
VITE_VAPI_VOICE=paula                       # Default voice (11labs voice ID)
VITE_VAPI_MODEL=gpt-3.5-turbo              # Default model
VITE_VAPI_SYSTEM_PROMPT="You are a helpful voice assistant."
VITE_VAPI_FIRST_MESSAGE="Hello! How can I help you today?"
```

### New (Retell)

```env
# Frontend
VITE_RETELL_ENABLED=true
VITE_RETELL_AGENT_ID=your-retell-agent-id  # Created in Retell dashboard

# Backend (server-side only)
RETELL_API_KEY=your-retell-api-key
```

---

## 8. API Endpoints

### Existing

| Method | Endpoint                     | Description                   |
| ------ | ---------------------------- | ----------------------------- |
| POST   | `/api/elevenlabs/signed-url` | Get signed URL for ElevenLabs |

### New for xAI

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| POST   | `/api/xai/session`     | Create ephemeral session token |
| GET    | `/api/xai/session/:id` | Get session status             |
| DELETE | `/api/xai/session/:id` | Terminate session              |

### New for Ultravox

| Method | Endpoint             | Description                         |
| ------ | -------------------- | ----------------------------------- |
| POST   | `/api/ultravox/call` | Create call and get joinUrl for SDK |

**Request Body:**

```json
{
  "systemPrompt": "You are a helpful assistant...",
  "model": "fixie-ai/ultravox-70B",
  "voice": "terrence",
  "languageHint": "en",
  "temperature": 0.7,
  "maxDuration": "300s",
  "selectedTools": [...]
}
```

**Response:**

```json
{
  "joinUrl": "wss://...",
  "callId": "call_abc123",
  "model": "fixie-ai/ultravox-70B",
  "systemPrompt": "...",
  "temperature": 0.7
}
```

### New for Retell

| Method | Endpoint                      | Description                        |
| ------ | ----------------------------- | ---------------------------------- |
| POST   | `/api/retell/create-web-call` | Register call and get access token |

**Request Body:**

```json
{
  "agent_id": "agent_xxx",
  "metadata": { ... },                    // Optional: custom metadata
  "retell_llm_dynamic_variables": { ... } // Optional: LLM context variables
}
```

**Response:**

```json
{
  "access_token": "eyJhbG...",
  "call_id": "call_xxx"
}
```

---

## 9. UI/UX Design

### Tab Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │ ◉ ElevenLabs │  │   xAI Grok   │  │   OpenAI     │     │
│   │   (Active)   │  │              │  │  (Coming)    │     │
│   └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │              [Voice Interface Content]              │   │
│   │                                                     │   │
│   │                    ┌─────────┐                      │   │
│   │                    │  START  │                      │   │
│   │                    └─────────┘                      │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tab States

- **Default**: Semi-transparent with border
- **Active**: Solid background with glow effect
- **Hover**: Slight scale + brightness increase
- **Disabled**: Grayed out with "Coming Soon" badge

### Mobile Behavior

- Tabs become horizontally scrollable
- Active tab indicator follows selection
- Swipe gestures to switch tabs (optional P2)

---

## 10. Error Handling

### Provider-Specific Errors

| Provider   | Error Type        | User Message                                 |
| ---------- | ----------------- | -------------------------------------------- |
| ElevenLabs | Microphone denied | "Please allow microphone access to continue" |
| ElevenLabs | Invalid agent ID  | "Agent not found. Check your configuration." |
| xAI        | Token expired     | "Session expired. Please reconnect."         |
| xAI        | Rate limited      | "Too many requests. Please wait a moment."   |
| Vapi       | Invalid token     | "Invalid API token. Check your Vapi config." |
| Vapi       | Call failed       | "Failed to start call. Please try again."    |
| Retell     | Invalid agent ID  | "Agent not found. Check your Retell config." |
| Retell     | Token failed      | "Failed to start call. Please try again."    |
| Retell     | Call ended        | "Call ended. Click to start a new call."     |
| All        | Microphone denied | "Please allow microphone access to continue" |
| All        | Network error     | "Connection lost. Retrying..."               |

### Graceful Degradation

- If provider not configured, show "Setup Required" state
- If connection fails, offer manual retry button
- Auto-reconnect on network recovery (with backoff)

---

## 11. Future Extensibility

### Adding a New Provider (Checklist)

1. **Backend**
   - [ ] Add API key environment variable
   - [ ] Create session/token endpoint
   - [ ] Implement WebSocket proxy (if needed)

2. **Frontend**
   - [ ] Create `{Provider}VoiceContext.tsx`
   - [ ] Create `{Provider}Provider.tsx` component
   - [ ] Add provider to `ProviderType` enum
   - [ ] Register in ProviderTabs configuration
   - [ ] Add provider logo/branding assets

3. **Configuration**
   - [ ] Add environment variables to `.env.example`
   - [ ] Update documentation

### Planned Providers

| Provider        | Status   |
| --------------- | -------- |
| ElevenLabs      | Complete |
| xAI (Grok)      | Complete |
| OpenAI          | Complete |
| Ultravox        | Complete |
| Vapi            | Complete |
| Retell          | Phase 06 |
| Google (Gemini) | Planned  |
| Anthropic       | Planned  |

---

## 12. Success Metrics

| Metric                          | Target  | Measurement          |
| ------------------------------- | ------- | -------------------- |
| Tab switch time                 | < 100ms | Performance profiler |
| First connection time (xAI)     | < 3s    | User timing API      |
| Error recovery rate             | > 95%   | Analytics            |
| Provider switching (no crashes) | 100%    | E2E tests            |

---

## 13. Risks & Mitigations

| Risk                         | Impact | Probability | Mitigation                   |
| ---------------------------- | ------ | ----------- | ---------------------------- |
| xAI API changes              | High   | Medium      | Version pin + monitoring     |
| WebSocket connection issues  | High   | Low         | Auto-reconnect + fallback    |
| Audio format incompatibility | Medium | Low         | Runtime format detection     |
| Mobile browser audio issues  | Medium | Medium      | Browser capability detection |

---

## 14. Dependencies

### External

- xAI Realtime API access
- xAI API key with appropriate permissions

### Internal

- Existing backend infrastructure
- ElevenLabs integration (unchanged)
- Current UI component library

### New Packages (Potential)

```json
{
  "dependencies": {
    // No new packages required for basic WebSocket implementation
    // xAI doesn't have an official React SDK yet
  }
}
```

---

## 15. Design Decisions (Resolved)

Based on codebase analysis, these questions have been answered:

| #   | Question                      | Decision                                | Rationale                                                                                                                    |
| --- | ----------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Backend architecture?         | **Extend existing `server/index.js`**   | Already has Express + CORS + dotenv setup. Just add `/api/xai/session` route alongside existing `/api/elevenlabs/signed-url` |
| 2   | Simultaneous connections?     | **No** - disconnect before switching    | VoiceContext uses single reducer/state pattern; cleaner resource management                                                  |
| 3   | Tab placement?                | **Main content area**, below header     | Header already has logo (left) + settings (right); tabs integrate with HeroSection                                           |
| 4   | Default tab?                  | **ElevenLabs**                          | Current implementation; localStorage remembers last-used for returning visitors                                              |
| 5   | Show "Coming Soon" tabs?      | **No** - only show configured providers | Matches minimal design philosophy; check `VITE_XAI_ENABLED` to show/hide                                                     |
| 6   | Provider logos?               | **Inline SVG or text fallback**         | No existing asset pipeline; can add SVGs to `src/assets/` if needed                                                          |
| 7   | Full stack required?          | **Yes**                                 | xAI requires server-side ephemeral token (API key cannot be exposed to browser)                                              |
| 8   | Connection status indicators? | **Yes** - subtle dot on active tab      | Adds clarity without clutter                                                                                                 |

### Backend Evidence

Existing `server/index.js` structure (port 3001):

```javascript
// Already implemented:
GET / api / health; // Health check
GET / api / elevenlabs / signed - url; // ElevenLabs auth

// To add:
POST / api / xai / session; // xAI ephemeral token
```

### Dev Command

```bash
npm run dev:all  # Runs both Vite (8082) and Express server (3001) concurrently
```

---

## 16. Technical Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC
- **Styling**: Tailwind CSS with glassmorphism design system
- **UI Components**: Radix UI / shadcn/ui pattern
- **Voice AI**: ElevenLabs React SDK + Native WebSocket for xAI
- **Animations**: Framer Motion
- **State**: React Context + Custom hooks
- **Backend**: Express.js for secure API key handling

---

## 17. References

- [xAI Realtime API Documentation](https://docs.x.ai/docs/api-reference#realtime)
- [EXAMPLE/xai/backend-nodejs/](../EXAMPLE/xai/backend-nodejs/) - Reference implementation
- [EXAMPLE/client/](../EXAMPLE/client/) - Universal client reference
- [ElevenLabs React SDK](https://github.com/elevenlabs/elevenlabs-js)
- [Ultravox API Documentation](https://docs.ultravox.ai/) - Ultravox voice AI platform
- [Ultravox Client SDK](https://www.npmjs.com/package/ultravox-client) - NPM package
- [EXAMPLE/](../EXAMPLE/) - Ultravox reference implementation (Dr. Donut demo)
- [Retell AI Documentation](https://docs.retellai.com/) - Retell voice AI platform
- [Retell Web Call Guide](https://docs.retellai.com/make-calls/web-call) - Web call integration
- [Retell Client SDK](https://www.npmjs.com/package/retell-client-js-sdk) - NPM package
- [RETELL_EXAMPLE/](../RETELL_EXAMPLE/) - Retell reference implementation

---

## Appendix A: xAI Message Types

From `EXAMPLE/xai/backend-nodejs/`:

```typescript
// Client -> Server (via WebSocket)
{
  type: "input_audio_buffer.append",
  audio: "<base64-encoded-audio>"
}

// Server -> Client
{
  type: "response.output_audio.delta",
  delta: "<base64-encoded-audio>"
}

{
  type: "conversation.item.created",
  item: {
    role: "assistant" | "user",
    content: [{ type: "text", text: "..." }]
  }
}
```

---

## Appendix B: File Changes Summary

| File                                       | Action | Description                    |
| ------------------------------------------ | ------ | ------------------------------ |
| `src/types/voice-provider.ts`              | CREATE | Provider interface definitions |
| `src/contexts/ProviderContext.tsx`         | CREATE | Active provider state          |
| `src/contexts/XAIVoiceContext.tsx`         | CREATE | xAI voice connection logic     |
| `src/components/tabs/ProviderTabs.tsx`     | CREATE | Tab container component        |
| `src/components/tabs/ProviderTab.tsx`      | CREATE | Individual tab component       |
| `src/components/providers/XAIProvider.tsx` | CREATE | xAI provider wrapper           |
| `src/pages/Index.tsx`                      | MODIFY | Add tab integration            |
| `src/contexts/VoiceContext.tsx`            | MODIFY | Minor refactor for abstraction |
| `server/routes/xai.ts`                     | CREATE | xAI backend routes             |
| `.env.example`                             | MODIFY | Add xAI environment variables  |

### Phase 4: Ultravox File Changes

| File                                            | Action | Description                      |
| ----------------------------------------------- | ------ | -------------------------------- |
| `src/types/ultravox.ts`                         | CREATE | Ultravox type definitions        |
| `src/contexts/UltravoxVoiceContext.tsx`         | CREATE | Ultravox session management      |
| `src/components/providers/UltravoxProvider.tsx` | CREATE | Ultravox provider wrapper        |
| `src/lib/tools/ultravoxTools.ts`                | CREATE | Client-side tool implementations |
| `server/routes/ultravox.ts`                     | CREATE | Ultravox backend route           |
| `src/contexts/ProviderContext.tsx`              | MODIFY | Add Ultravox provider config     |
| `src/types/voice-provider.ts`                   | MODIFY | Add 'ultravox' to ProviderType   |
| `.env.example`                                  | MODIFY | Add Ultravox environment vars    |
| `package.json`                                  | MODIFY | Add ultravox-client dependency   |

### Phase 5: Vapi File Changes

| File                                          | Action | Description                               |
| --------------------------------------------- | ------ | ----------------------------------------- |
| `src/lib/vapi.ts`                             | CREATE | Vapi SDK singleton instance               |
| `src/types/vapi.ts`                           | CREATE | Vapi type definitions (enums, interfaces) |
| `src/hooks/useVapiVoice.ts`                   | CREATE | Vapi voice hook with event handling       |
| `src/components/providers/VapiProvider.tsx`   | CREATE | Vapi provider wrapper component           |
| `src/components/providers/VapiButton.tsx`     | CREATE | Vapi button with audio level glow         |
| `src/components/voice/FunctionCallResult.tsx` | CREATE | Function call result display              |
| `src/test/useVapiVoice.test.ts`               | CREATE | Vapi hook unit tests                      |
| `src/test/VapiProvider.test.tsx`              | CREATE | Vapi provider component tests             |
| `src/types/voice-provider.ts`                 | MODIFY | Add 'vapi' to ProviderType                |
| `src/types/index.ts`                          | MODIFY | Export Vapi types                         |
| `src/contexts/ProviderContext.tsx`            | MODIFY | Add Vapi to providers list                |
| `src/components/voice/MessageList.tsx`        | MODIFY | Add activeTranscript prop support         |
| `index.html`                                  | MODIFY | Add Vapi/Daily.co CSP domains             |
| `.env.example`                                | MODIFY | Add Vapi environment vars                 |
| `package.json`                                | MODIFY | Add @vapi-ai/web@^1.0.255 dependency      |
| `CLAUDE.md`                                   | MODIFY | Document Vapi integration                 |

### Phase 6: Retell File Changes

| File                                          | Action | Description                                 |
| --------------------------------------------- | ------ | ------------------------------------------- |
| `src/types/retell.ts`                         | CREATE | Retell type definitions (enums, interfaces) |
| `src/hooks/useRetellVoice.ts`                 | CREATE | Retell voice hook with event handling       |
| `src/components/providers/RetellProvider.tsx` | CREATE | Retell provider wrapper component           |
| `server/routes/retell.ts`                     | CREATE | Retell backend route for call registration  |
| `src/test/useRetellVoice.test.ts`             | CREATE | Retell hook unit tests                      |
| `src/test/RetellProvider.test.tsx`            | CREATE | Retell provider component tests             |
| `src/types/voice-provider.ts`                 | MODIFY | Add 'retell' to ProviderType                |
| `src/types/index.ts`                          | MODIFY | Export Retell types                         |
| `src/contexts/ProviderContext.tsx`            | MODIFY | Add Retell to providers list                |
| `server/index.js`                             | MODIFY | Register Retell route                       |
| `.env.example`                                | MODIFY | Add Retell environment vars                 |
| `package.json`                                | MODIFY | Add retell-client-js-sdk@^2.0.3 dependency  |
| `CLAUDE.md`                                   | MODIFY | Document Retell integration                 |

---

## Appendix C: Ultravox SDK Reference

### Session Lifecycle

```typescript
import { UltravoxSession } from 'ultravox-client';

// Create session with optional debug messages
const debugMessages = new Set(['debug']);
const session = new UltravoxSession({ experimentalMessages: debugMessages });

// Join call using joinUrl from backend
session.joinCall(joinUrl);

// Leave call
session.leaveCall();
```

### Event Listeners

```typescript
// Status changes
session.addEventListener('status', (event) => {
  // event.status: 'disconnected' | 'connecting' | 'idle' |
  //               'listening' | 'thinking' | 'speaking'
});

// Real-time transcripts
session.addEventListener('transcript', (event) => {
  // event.transcripts: Array<{ speaker: 'user' | 'agent', text: string }>
});

// Debug messages (requires experimentalMessages in constructor)
session.addEventListener('experimental_message', (event) => {
  // event.message.message: string
});
```

### Audio Controls

```typescript
// Microphone mute toggle
if (session.isMicMuted) {
  session.unmuteMic();
} else {
  session.muteMic();
}

// Speaker mute toggle
if (session.isSpeakerMuted) {
  session.unmuteSpeaker();
} else {
  session.muteSpeaker();
}
```

### Tool Registration

```typescript
import { ClientToolImplementation } from 'ultravox-client';

// Define client-side tool
const myTool: ClientToolImplementation = (parameters) => {
  const { param1 } = parameters as { param1: string };
  // Process and return result as string
  return JSON.stringify({ result: 'success' });
};

// Register before joining call
session.registerToolImplementation('myToolName', myTool);
```

### Tool Definition for API

```typescript
const toolDefinition = {
  temporaryTool: {
    modelToolName: 'myToolName',
    description: 'Description of what the tool does',
    dynamicParameters: [
      {
        name: 'param1',
        location: 'PARAMETER_LOCATION_BODY',
        schema: { type: 'string', description: 'Parameter description' },
        required: true,
      },
    ],
    client: {}, // Marks this as a client-side tool
  },
};
```

### Ultravox Status States

| Status        | Description                           | Maps To    |
| ------------- | ------------------------------------- | ---------- |
| disconnected  | Not connected to any call             | idle       |
| disconnecting | Leaving a call in progress            | idle       |
| connecting    | Establishing WebSocket connection     | connecting |
| idle          | Connected but not actively processing | connected  |
| listening     | Actively listening to user audio      | connected  |
| thinking      | Processing user input                 | connected  |
| speaking      | Agent is speaking response            | connected  |

### Call Configuration Options

| Option              | Type   | Description                              |
| ------------------- | ------ | ---------------------------------------- |
| systemPrompt        | string | Agent instructions and personality       |
| model               | string | Model ID (e.g., "fixie-ai/ultravox-70B") |
| voice               | string | Voice ID (e.g., "terrence")              |
| languageHint        | string | Language code (e.g., "en")               |
| temperature         | number | Response creativity (0-1)                |
| maxDuration         | string | Call timeout (e.g., "300s")              |
| timeExceededMessage | string | Message when timeout reached             |
| selectedTools       | array  | Tool definitions for function calling    |
| initialMessages     | array  | Pre-seed conversation with messages      |

---

## Appendix D: Vapi SDK Reference

**Reference:** `VAPI_EXAMPLE/` contains a working implementation.

### SDK Initialization

```typescript
import Vapi from '@vapi-ai/web';

// Initialize with web token (from Vapi dashboard)
const vapi = new Vapi(import.meta.env.VITE_VAPI_WEB_TOKEN);

// Or with explicit token
const vapi = new Vapi('your-vapi-web-token');
```

### Starting a Call

```typescript
import { CreateAssistantDTO } from '@vapi-ai/web/dist/api';

// Option 1: Start with pre-created assistant ID
vapi.start('assistant-id-here');

// Option 2: Start with inline configuration (CreateAssistantDTO)
const config: CreateAssistantDTO = {
  name: 'My Assistant',
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo', // or 'gpt-4o-mini'
    temperature: 0.7,
    systemPrompt: 'You are a helpful voice assistant.',
    functions: [
      {
        name: 'getWeather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' },
          },
          required: ['location'],
        },
      },
    ],
  },
  voice: {
    provider: '11labs',
    voiceId: 'paula', // ElevenLabs voice ID
  },
  firstMessage: 'Hello! How can I help you today?',
};

vapi.start(config);
```

### Stopping a Call

```typescript
vapi.stop();
```

### Event Listeners

```typescript
// Call lifecycle events
vapi.on('call-start', () => {
  console.log('Call has started');
});

vapi.on('call-end', () => {
  console.log('Call has ended');
});

// Speech detection
vapi.on('speech-start', () => {
  console.log('User/assistant started speaking');
});

vapi.on('speech-end', () => {
  console.log('User/assistant stopped speaking');
});

// Audio level for visualization
vapi.on('volume-level', (level: number) => {
  console.log('Audio level:', level); // 0-1 range
});

// Messages (transcripts, function calls)
vapi.on('message', (message) => {
  if (message.type === 'transcript') {
    console.log(`${message.role}: ${message.transcript}`);
  } else if (message.type === 'function-call') {
    console.log('Function call:', message.functionCall);
  }
});

// Error handling
vapi.on('error', (error) => {
  console.error('Vapi error:', error.message);
});

// Cleanup
vapi.off('call-start', handler);
```

### Message Types

| Type                 | Description                          |
| -------------------- | ------------------------------------ |
| transcript           | User or assistant speech transcript  |
| function-call        | Function call request from assistant |
| function-call-result | Result of function execution         |
| add-message          | System message added to conversation |

### Transcript Message Structure

```typescript
interface TranscriptMessage {
  type: 'transcript';
  role: 'user' | 'assistant';
  transcriptType: 'partial' | 'final';
  transcript: string;
}
```

### Function Call Message Structure

```typescript
interface FunctionCallMessage {
  type: 'function-call';
  functionCall: {
    name: string;
    parameters: Record<string, unknown>;
  };
}
```

### Function Call Result Message Structure

```typescript
interface FunctionCallResultMessage {
  type: 'function-call-result';
  functionCallResult: {
    forwardToClientEnabled?: boolean;
    result: unknown;
    [key: string]: unknown;
  };
}
```

### Call Status States

| Status   | Description               |
| -------- | ------------------------- |
| inactive | No active call            |
| loading  | Call starting or stopping |
| active   | Call in progress          |

### Handling Partial Transcripts (Typing Indicator)

Partial transcripts allow showing real-time speech as a typing indicator:

```typescript
const [activeTranscript, setActiveTranscript] = useState<TranscriptMessage | null>(null);
const [messages, setMessages] = useState<Message[]>([]);

vapi.on('message', (message) => {
  if (message.type === 'transcript' && message.transcriptType === 'partial') {
    // Store partial for typing indicator display
    setActiveTranscript(message);
  } else {
    // Final message - add to history
    setMessages((prev) => [...prev, message]);
    setActiveTranscript(null); // Clear typing indicator
  }
});
```

### CSP Domain Requirements

For Content Security Policy, allow these domains in `connect-src`:

```
https://api.vapi.ai
https://*.vapi.ai
wss://*.vapi.ai
https://*.daily.co
wss://*.daily.co
https://*.pipecdn.app
```

### Voice Providers Supported by Vapi

| Provider | Voice IDs                                              |
| -------- | ------------------------------------------------------ |
| 11labs   | paula, jennifer, sarah, adam, etc. (ElevenLabs voices) |
| openai   | alloy, echo, fable, onyx, nova, shimmer                |
| deepgram | Various Deepgram voice IDs                             |
| playht   | Play.ht voice IDs                                      |

### Model Providers Supported by Vapi

| Provider  | Models                                    |
| --------- | ----------------------------------------- |
| openai    | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5 |
| anthropic | claude-3-5-sonnet, claude-3-opus          |
| groq      | llama-3.1-70b, mixtral-8x7b               |
| together  | Various open-source models                |

---

## Appendix E: Retell SDK Reference

**Reference:** `RETELL_EXAMPLE/` contains a working implementation.

**Documentation:** https://docs.retellai.com/make-calls/web-call

### SDK Installation

```bash
npm install retell-client-js-sdk@^2.0.3
```

### SDK Initialization

```typescript
import { RetellWebClient } from 'retell-client-js-sdk';

// Create client instance (no configuration needed)
const retellWebClient = new RetellWebClient();
```

### Starting a Call

```typescript
// 1. Get access token from backend
const response = await fetch('/api/retell/create-web-call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_id: 'your-agent-id',
    metadata: { userId: '123' }, // Optional
    retell_llm_dynamic_variables: { userName: 'John' }, // Optional
  }),
});
const { access_token } = await response.json();

// 2. Start call with token
await retellWebClient.startCall({
  accessToken: access_token,
});
```

### Stopping a Call

```typescript
retellWebClient.stopCall();
```

### Event Listeners

```typescript
// Call lifecycle events
retellWebClient.on('call_started', () => {
  console.log('Call has started');
});

retellWebClient.on('call_ended', () => {
  console.log('Call has ended');
});

// Agent speech events
retellWebClient.on('agent_start_talking', () => {
  console.log('Agent started speaking');
});

retellWebClient.on('agent_stop_talking', () => {
  console.log('Agent stopped speaking');
});

// Transcript updates (last 5 sentences only)
retellWebClient.on('update', (update) => {
  console.log('Transcript:', update.transcript);
  // Note: Only contains last 5 sentences
  // Must maintain full history locally if needed
});

// Raw audio data (for visualization)
retellWebClient.on('audio', (audioData: Float32Array) => {
  // PCM audio samples for custom visualization
  console.log('Audio samples:', audioData.length);
});

// Metadata from agent (custom data sent by agent)
retellWebClient.on('metadata', (metadata) => {
  console.log('Agent metadata:', metadata);
  // Use for agent-to-frontend communication
});

// Error handling
retellWebClient.on('error', (error) => {
  console.error('Retell error:', error.message);
});
```

### Backend API

**Endpoint:** `POST https://api.retellai.com/v2/create-web-call`

**Headers:**

```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**

```json
{
  "agent_id": "agent_xxx",
  "metadata": {
    "userId": "123",
    "sessionId": "abc"
  },
  "retell_llm_dynamic_variables": {
    "userName": "John",
    "accountType": "premium"
  }
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "call_id": "call_xxx"
}
```

### Event Types Reference

| Event                 | Trigger                           | Data                      |
| --------------------- | --------------------------------- | ------------------------- |
| `call_started`        | Call successfully established     | -                         |
| `call_ended`          | Call terminated                   | -                         |
| `agent_start_talking` | Agent begins speaking utterance   | -                         |
| `agent_stop_talking`  | Agent finishes speaking utterance | -                         |
| `update`              | Transcript or state update        | `{ transcript, ... }`     |
| `audio`               | Raw audio data available          | `Float32Array` (PCM)      |
| `metadata`            | Agent sends custom metadata       | `Record<string, unknown>` |
| `error`               | Error occurred during call        | `Error`                   |

### Call Status States

| State    | Description                                |
| -------- | ------------------------------------------ |
| inactive | No active call                             |
| loading  | Call starting (token obtained, connecting) |
| active   | Call in progress                           |

### Key Characteristics

**Transcript Limitation:**

- SDK only provides the **last 5 sentences** in `update.transcript`
- Must maintain full conversation history locally if needed
- Parse and append new content to local state

**Agent Configuration:**

- Agents are configured in the Retell dashboard
- Voice, personality, and behavior defined at agent creation
- `agent_id` references pre-configured agent
- Cannot modify agent settings at call time (unlike inline configs)

**Dynamic Variables:**

- `retell_llm_dynamic_variables` passed at call creation
- Available to the agent's LLM as context
- Use for personalization (user name, account info, etc.)

**Metadata Events:**

- Agent can send custom metadata to frontend
- Useful for structured data, UI updates, or state changes
- Configured in agent's behavior/tool definitions

### Security Considerations

- **API Key:** Server-side only, never exposed to frontend
- **Access Token:** Short-lived, per-call credential
- **Agent ID:** Safe to expose (references dashboard config)
- **HTTPS:** Required for microphone access in browser

### References

- [Retell AI Documentation](https://docs.retellai.com/)
- [Web Call Guide](https://docs.retellai.com/make-calls/web-call)
- [Client SDK GitHub](https://github.com/adam-team/retell-client-js-sdk)
- [Agent Creation Guide](https://docs.retellai.com/get-started/create-agent)
