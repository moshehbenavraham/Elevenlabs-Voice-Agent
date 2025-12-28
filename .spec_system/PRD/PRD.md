# Conversational Voice AI Agents - Product Requirements Document

| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Author** | AI with Apex |
| **Created** | 2025-12-28 |
| **Last Updated** | 2025-12-28 |

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

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Tab navigation to switch between voice agent providers | P0 |
| FR-2 | xAI voice agent integration using ephemeral token pattern | P0 |
| FR-3 | Persist selected tab in localStorage | P1 |
| FR-4 | Display provider branding/logo on each tab | P1 |
| FR-5 | Show connection status per provider (independent states) | P0 |
| FR-6 | Graceful disconnect when switching tabs with active connection | P0 |
| FR-7 | Configuration modal per provider (different settings) | P2 |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Tab switch latency < 100ms | P1 |
| NFR-2 | No provider SDK loaded until tab is selected (lazy loading) | P2 |
| NFR-3 | Mobile-responsive tab design (horizontal scroll or dropdown) | P1 |
| NFR-4 | Accessibility: keyboard navigation between tabs | P1 |

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

| Phase | Name | Sessions | Status |
|-------|------|----------|--------|
| 00 | Multi-Provider Voice | TBD | Not Started |

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

---

## 8. API Endpoints

### Existing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/elevenlabs/signed-url` | Get signed URL for ElevenLabs |

### New for xAI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/xai/session` | Create ephemeral session token |
| GET | `/api/xai/session/:id` | Get session status |
| DELETE | `/api/xai/session/:id` | Terminate session |

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

| Provider | Error Type | User Message |
|----------|------------|--------------|
| ElevenLabs | Microphone denied | "Please allow microphone access to continue" |
| ElevenLabs | Invalid agent ID | "Agent not found. Check your configuration." |
| xAI | Token expired | "Session expired. Please reconnect." |
| xAI | Rate limited | "Too many requests. Please wait a moment." |
| All | Network error | "Connection lost. Retrying..." |

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

| Provider | Status |
|----------|--------|
| ElevenLabs | Complete |
| xAI (Grok) | This Phase |
| OpenAI | Planned |
| Google (Gemini) | Planned |
| Anthropic | Planned |

---

## 12. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tab switch time | < 100ms | Performance profiler |
| First connection time (xAI) | < 3s | User timing API |
| Error recovery rate | > 95% | Analytics |
| Provider switching (no crashes) | 100% | E2E tests |

---

## 13. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| xAI API changes | High | Medium | Version pin + monitoring |
| WebSocket connection issues | High | Low | Auto-reconnect + fallback |
| Audio format incompatibility | Medium | Low | Runtime format detection |
| Mobile browser audio issues | Medium | Medium | Browser capability detection |

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

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Backend architecture? | **Extend existing `server/index.js`** | Already has Express + CORS + dotenv setup. Just add `/api/xai/session` route alongside existing `/api/elevenlabs/signed-url` |
| 2 | Simultaneous connections? | **No** - disconnect before switching | VoiceContext uses single reducer/state pattern; cleaner resource management |
| 3 | Tab placement? | **Main content area**, below header | Header already has logo (left) + settings (right); tabs integrate with HeroSection |
| 4 | Default tab? | **ElevenLabs** | Current implementation; localStorage remembers last-used for returning visitors |
| 5 | Show "Coming Soon" tabs? | **No** - only show configured providers | Matches minimal design philosophy; check `VITE_XAI_ENABLED` to show/hide |
| 6 | Provider logos? | **Inline SVG or text fallback** | No existing asset pipeline; can add SVGs to `src/assets/` if needed |
| 7 | Full stack required? | **Yes** | xAI requires server-side ephemeral token (API key cannot be exposed to browser) |
| 8 | Connection status indicators? | **Yes** - subtle dot on active tab | Adds clarity without clutter |

### Backend Evidence

Existing `server/index.js` structure (port 3001):
```javascript
// Already implemented:
GET  /api/health                    // Health check
GET  /api/elevenlabs/signed-url     // ElevenLabs auth

// To add:
POST /api/xai/session               // xAI ephemeral token
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

| File | Action | Description |
|------|--------|-------------|
| `src/types/voice-provider.ts` | CREATE | Provider interface definitions |
| `src/contexts/ProviderContext.tsx` | CREATE | Active provider state |
| `src/contexts/XAIVoiceContext.tsx` | CREATE | xAI voice connection logic |
| `src/components/tabs/ProviderTabs.tsx` | CREATE | Tab container component |
| `src/components/tabs/ProviderTab.tsx` | CREATE | Individual tab component |
| `src/components/providers/XAIProvider.tsx` | CREATE | xAI provider wrapper |
| `src/pages/Index.tsx` | MODIFY | Add tab integration |
| `src/contexts/VoiceContext.tsx` | MODIFY | Minor refactor for abstraction |
| `server/routes/xai.ts` | CREATE | xAI backend routes |
| `.env.example` | MODIFY | Add xAI environment variables |
