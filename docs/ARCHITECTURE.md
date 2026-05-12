# Architecture

This document outlines the technical architecture of Voice-Agent-PuPuPlatter.

## Architecture Overview

A multi-provider voice AI demo platform built with React and TypeScript.
It supports real-time voice conversations with ElevenLabs, xAI (Grok), OpenAI,
Ultravox, Vapi, Retell, and Google Gemini Live. It also includes a dedicated
OpenAI Translation browser MVP with WebRTC media, transcripts, audio mix
controls, and export support. The architecture emphasizes provider
abstraction, cleanup on provider switch, and browser-safe server minting of
translation client secrets.

## Table of Contents

- [System Overview](#system-overview)
- [Multi-Provider Architecture](#multi-provider-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [Voice Processing Pipeline](#voice-processing-pipeline)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Backend Services](#backend-services)
- [Performance Considerations](#performance-considerations)
- [Security Architecture](#security-architecture)
- [Mobile Architecture](#mobile-architecture)
- [Browser Compatibility](#browser-compatibility)

## System Overview

```
+---------------------------------------------------------------------+
|                         Browser Environment                          |
+---------------------------------------------------------------------+
|  +---------------+  +---------------------------------------------+ |
|  |   React App   |  |           Provider Layer                     | |
|  | (ProviderCtx) |  |  +-------------+  +---------------------+   | |
|  |               |<-+  | ElevenLabs  |  |   xAI (Grok)        |   | |
|  |  Tab System   |  |  | VoiceContext|  |  XAIVoiceContext    |   | |
|  +---------------+  |  +-------------+  +---------------------+   | |
|         |           +---------------------------------------------+ |
|  +-------------+  +-------------+  +-----------------------------+  |
|  | OpenAI      |  |  Web Audio  |  |      WebSocket/HTTP         |  |
|  | Translation |  |     API     |  |     Communication           |  |
|  +-------------+  +-------------+  +-----------------------------+  |
+---------------------------------------------------------------------+
|                         Platform APIs                                |
|  +-------------+  +-------------+  +-------------+ +-------------+  |
|  | getUserMedia|  |AudioWorklet |  |AudioContext | |  WebSocket  |  |
|  +-------------+  +-------------+  +-------------+ +-------------+  |
+---------------------------------------------------------------------+
           |                                     |
+----------+------------+           +-----------+------------+
|   Backend (Express)   |           |      Provider APIs      |
|  +-----------------+  |           |  +-----------------+   |
|  | /api/openai     |  |           |  |   ElevenLabs    |   |
|  | /api/xai        |  |           |  |   xAI Realtime  |   |
|  | /api/health     |  |           |  |   OpenAI Live   |   |
|  +-----------------+  |           |  +-----------------+   |
+-----------------------+           +------------------------+
```

## Multi-Provider Architecture

### Provider Abstraction Layer

The application uses a unified provider interface allowing seamless switching between voice AI providers:

```typescript
// src/types/voice-provider.ts
export type ProviderType =
  | 'elevenlabs'
  | 'elevenlabs-sdk'
  | 'xai'
  | 'openai'
  | 'openai-translation'
  | 'ultravox'
  | 'vapi'
  | 'retell'
  | 'gemini';

export interface VoiceProvider {
  id: ProviderType;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
}
```

### Provider Context Pattern

```
ProviderContext (active provider selection)
    |-- ElevenLabs VoiceContext (SDK with reconnection)
    |-- XAIVoiceContext (WebSocket + ephemeral token)
    |-- OpenAIVoiceContext (WebSocket + ephemeral token)
    |-- OpenAITranslationProvider (feature-flagged browser translation MVP)
    |-- UltravoxVoiceContext (SDK with joinUrl)
    |-- useVapiVoice (SDK with public web token)
    |-- useRetellVoice (SDK with backend access token)
    \-- GeminiVoiceContext (WebSocket + ephemeral token + AudioWorklet)
```

**Key Benefits**:

- Provider-specific logic stays isolated
- Each context manages its own connection lifecycle
- Provider switching changes which context is "active"
- Future providers add new context without modifying existing ones

## Component Hierarchy

### Application Structure

```
App
|-- ThemeProvider
|-- ProviderProvider
|-- Router
|   |-- Index (Main Page)
|   |   |-- ProviderTabs
|   |   |-- ElevenLabsConversationPanel
|   |   |-- XAIConversationPanel
|   |   |-- OpenAIConversationPanel
|   |   |-- OpenAITranslationProvider
|   |   |-- UltravoxConversationPanel
|   |   |-- VapiConversationPanel
|   |   |-- RetellConversationPanel
|   |   |-- GeminiConversationPanel
|   |   \-- ConfigurationDialog
|   \-- NotFound
|-- Providers
|   |-- ElevenLabsProvider
|   |-- XAIProvider
|   |-- OpenAIProvider
|   |-- OpenAITranslationProvider
|   |-- UltravoxProvider
|   |-- VapiProvider
|   |-- RetellProvider
|   \-- GeminiProvider
\-- Shared UI
    |-- BackgroundEffects
    |-- HeroSection
    |-- ThemeToggle
    \-- Conversation and settings panels
```

### Component Responsibilities

#### **App Component**

- Application bootstrap and routing
- Global providers and context setup
- Error boundary implementation

#### **ProviderContext**

- Active provider selection and switch handling
- Canonical provider ordering and availability checks
- Coordination between provider-specific tabs

#### **VoiceEnvironment**

- Voice interaction orchestration for the active provider
- State management for voice features
- Integration with provider contexts and the OpenAI translation flow

#### **VoiceButton, VoiceStatus, VoiceVisualizer**

- Primary voice controls for the supported voice providers
- Status and transcript feedback for active sessions
- Audio visualization and user feedback during conversations

#### **ConfigurationDialog**

- Provider and feature configuration UI
- Status summaries and setup guidance
- Settings persistence and diagnostics entry point

#### **ThemeProvider**

- Theme management and switching
- CSS variable management
- User preference persistence

## Data Flow

### Voice Interaction Flow

```
User Input -> Microphone -> getUserMedia -> MediaRecorder ->
Audio Processing -> ElevenLabs API -> Voice Response ->
Audio Playback -> Visual Feedback -> User Interface Update
```

### State Flow

```
User Action -> Event Handler -> State Update ->
Component Re-render -> UI Update -> Side Effects
```

### API Communication Flow

```
Component -> Custom Hook -> API Service ->
HTTP/WebSocket -> ElevenLabs API -> Response ->
State Update -> UI Update
```

## Voice Processing Pipeline

### Audio Input Pipeline

```
+-----------------+    +-----------------+    +-----------------+
|  Microphone     |--->|  getUserMedia   |--->|  MediaRecorder  |
|  Permission     |    |  Audio Stream   |    |  Audio Capture  |
+-----------------+    +-----------------+    +-----------------+
         |                       |                       |
         v                       v                       v
+-----------------+    +-----------------+    +-----------------+
|  Permission     |    |  Audio Context  |    |  Audio Buffer   |
|  Management     |    |  Configuration  |    |  Processing     |
+-----------------+    +-----------------+    +-----------------+
                                |                       |
                                v                       v
                    +-----------------+    +-----------------+
                    |  Frequency      |    |  ElevenLabs     |
                    |  Analysis       |    |  API Request    |
                    +-----------------+    +-----------------+
```

### Audio Output Pipeline

```
+-----------------+    +-----------------+    +-----------------+
|  ElevenLabs     |--->|  Audio Response |--->|  Audio Element  |
|  API Response   |    |  Processing     |    |  Playback       |
+-----------------+    +-----------------+    +-----------------+
         |                       |                       |
         v                       v                       v
+-----------------+    +-----------------+    +-----------------+
|  Response       |    |  Audio Buffer   |    |  Volume Control |
|  Validation     |    |  Management     |    |  & Effects      |
+-----------------+    +-----------------+    +-----------------+
                                |                       |
                                v                       v
                    +-----------------+    +-----------------+
                    |  Visualization  |    |  User Interface |
                    |  Update         |    |  Update         |
                    +-----------------+    +-----------------+
```

## State Management

### Global State Architecture

```typescript
// Provider Context - Active provider selection
interface ProviderContextType {
  activeProvider: ProviderType;
  setActiveProvider: (provider: ProviderType) => void;
  providers: VoiceProvider[];
  isProviderAvailable: (id: ProviderType) => boolean;
}

// Theme Context
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

// ElevenLabs Voice State
interface VoiceState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  isSpeaking: boolean;
  volume: number;
  error: string | null;
}

// xAI Voice State
interface XAIVoiceState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  isSpeaking: boolean;
  error: string | null;
  analyser: AnalyserNode | null;
}
```

### State Management Patterns

#### **Context API**

Used for global state that needs to be accessed across many components:

- `ProviderContext` - Active provider selection with localStorage persistence
- `ThemeContext` - Theme state
- `VoiceContext` - ElevenLabs voice state
- `XAIVoiceContext` - xAI voice state
- `OpenAIVoiceContext` - OpenAI voice state
- `UltravoxVoiceContext` - Ultravox voice state
- `GeminiVoiceContext` - Gemini Live voice state

#### **Custom Hooks**

Used for feature-specific state management:

- `useProvider` - Provider selection hook
- `useVoice` - ElevenLabs voice hook
- `useXAIVoice` - xAI voice hook
- `useOpenAIVoice` - OpenAI voice hook
- `useUltravoxVoice` - Ultravox voice hook
- `useVapiVoice` - Vapi voice hook
- `useRetellVoice` - Retell voice hook
- `useGeminiVoice` - Gemini Live voice hook
- `useReconnection` - WebSocket reconnection with backoff
- `useReducedMotion` - Accessibility preference detection
- `useAccessibility` - Accessibility features

#### **Settings Storage**

Persistent settings via localStorage:

- `settingsStorage.ts` - Schema-versioned settings persistence
- Provider-specific voice/prompt configuration
- Merge strategy ensures all fields exist

#### **Local State**

Used for component-specific state:

- Form inputs
- UI interaction state
- Tab animations

## API Integration

### ElevenLabs SDK Integration

```typescript
// SDK Configuration
const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
  baseURL: 'https://api.elevenlabs.io/v1',
});

// Conversation Management
class ConversationManager {
  private client: ElevenLabsClient;
  private conversationId: string | null = null;

  async startConversation(agentId: string): Promise<Conversation> {
    // Initialize conversation
  }

  async sendMessage(message: string): Promise<Response> {
    // Send message to agent
  }

  async endConversation(): Promise<void> {
    // Clean up conversation
  }
}
```

### API Layer Architecture

```
+-------------------------------------------------------------+
|                    Component Layer                          |
+-------------------------------------------------------------+
|                    Custom Hooks                             |
|  +-----------------+  +-----------------+  +-------------+  |
|  |useElevenLabs    |  |useVoiceRecording|  |useAudioPlay |  |
|  |Conversation     |  |                 |  |             |  |
|  +-----------------+  +-----------------+  +-------------+  |
+-------------------------------------------------------------+
|                    Service Layer                            |
|  +-----------------+  +-----------------+  +-------------+  |
|  |ElevenLabs       |  |Audio Processing |  |Error        |  |
|  |Service          |  |Service          |  |Handling     |  |
|  +-----------------+  +-----------------+  +-------------+  |
+-------------------------------------------------------------+
|                    SDK Layer                                |
|  +-----------------+  +-----------------+  +-------------+  |
|  |ElevenLabs       |  |WebSocket        |  |HTTP Client  |  |
|  |SDK              |  |Connection       |  |             |  |
|  +-----------------+  +-----------------+  +-------------+  |
+-------------------------------------------------------------+
```

## Backend Services

The application uses an Express.js backend (port 3001) for secure API key management.

### Server Architecture

```
server/
|-- index.js              # Main Express server
\-- routes/
    |-- xai.js            # xAI ephemeral token endpoint
    |-- openai.js         # OpenAI voice and translation token endpoints
    |-- ultravox.js       # Ultravox call creation endpoint
    |-- retell.js         # Retell web call creation endpoint
    \-- gemini.js         # Gemini ephemeral token endpoint
```

### API Endpoints

| Method | Endpoint                          | Description                             |
| ------ | --------------------------------- | --------------------------------------- |
| GET    | `/api/health`                     | Server health check                     |
| GET    | `/api/elevenlabs/signed-url`      | ElevenLabs signed URL for SDK           |
| POST   | `/api/xai/session`                | Create xAI ephemeral token              |
| POST   | `/api/openai/session`             | Create OpenAI ephemeral token           |
| POST   | `/api/openai/translation-session` | Create OpenAI translation client secret |
| POST   | `/api/ultravox/call`              | Create Ultravox call (joinUrl)          |
| POST   | `/api/retell/create-web-call`     | Create Retell call access token         |
| POST   | `/api/gemini/session`             | Create Gemini Live ephemeral token      |
| GET    | `/api/gemini/health`              | Gemini service health check             |
| GET    | `/api/gemini/voices`              | List available Gemini voices            |

For the detailed OpenAI Realtime voice-agent flow, translation client-secret
boundary, session events, and audio format assumptions, see
[OpenAI Realtime Voice Provider](./OPENAI_REALTIME.md).

### OpenAI Translation Runtime

Phase 02 added the backend contract and shared translation config. Phase 03
completed the browser translation MVP without merging it into the existing
OpenAI voice-agent context:

- `POST /api/openai/translation-session` validates a target language and mints
  a sanitized `gpt-realtime-translate` browser client secret.
- `src/lib/openaiTranslation.ts` owns supported target languages, route request
  descriptors, session config builders, audio mix helpers, and Markdown export
  helpers.
- `src/types/openai-translation.ts` defines the shared route, language, session,
  audio mix, transcript, and max-session contracts.
- `src/hooks/useOpenAITranslation.ts` owns the WebRTC translation lifecycle,
  translated audio playback, transcript parsing, and cleanup behavior.
  It waits for ICE gathering before posting the local SDP to
  `https://api.openai.com/v1/realtime/translations`.
- `src/hooks/useOpenAITranslationSource.ts` owns microphone and browser-tab
  capture modes plus source permission handling.
- `src/components/providers/OpenAITranslationProvider.tsx` renders the
  feature-flagged translation tab with source selection, language selection,
  status, transcript, mix, and export controls.

### Future Raw-Audio Translation Media

The current translation product path remains browser WebRTC. A future backend
raw-audio bridge is documented as architecture only in
[Raw-Audio Bridge Spike](./ongoing-projects/raw-audio-bridge-spike.md). That
spike covers server-side media sources such as telephony, SIP, broadcast ingest,
or media workers, and explicitly does not ship a route, webhook, provider tab,
or default UI path.

Future room and telephony translation topology is documented as architecture
only in
[Room and Telephony Translation Architecture](./ongoing-projects/room-telephony-translation-architecture.md).
That decision note compares call, SIP, room-worker, listener-language, and
speaker-language fanout models. It keeps Twilio, SIP, LiveKit, room media
workers, and telephony translation out of the shipped runtime until a later PRD
authorizes provider credentials, webhook security, shared rate limits, room
authorization, and privacy review. It is future architecture outside the
shipped runtime.

Future external subtitle overlay options are documented as assessment-only
guidance in
[External Subtitle Overlay Assessment](./ongoing-projects/external-subtitle-overlay-assessment.md).
That note compares the shipped in-app latest-caption and transcript surfaces
with future in-app floating captions, browser-extension content scripts,
offscreen documents, shadow DOM isolation, and sidecar options. It does not
ship a Chrome extension, content script, offscreen document, service worker,
cross-site overlay, arbitrary website injection path, persistent transcript
store, or runtime UI change.

### xAI Token Flow

```
Frontend                    Backend                     xAI API
   |                          |                           |
   | POST /api/xai/session    |                           |
   |------------------------->|                           |
   |                          | POST /v1/realtime/        |
   |                          |      client_secrets       |
   |                          |-------------------------->|
   |                          |                           |
   |                          | { client_secret }         |
   |                          |<--------------------------|
   |                          |                           |
   | { token, expiresAt }     |                           |
   |<-------------------------|                           |
   |                          |                           |
   | WebSocket: wss://api.x.ai/v1/realtime?model=grok-2-public
   |----------------------------------------------------->|
```

### Realtime Audio Processing (xAI and OpenAI)

```typescript
// src/lib/audio/audioUtils.ts
// PCM 16-bit, 24kHz mono format shared by xAI and OpenAI Realtime voice

encodeAudioForXAI(float32Array) -> base64String
decodeAudioFromXAI(base64String) -> Float32Array
resampleAudio(audioData, fromRate, toRate) -> Float32Array
```

The helper names still reference xAI, but OpenAI voice mode reuses the same 24
kHz PCM16 mono/base64 pipeline in `OpenAIVoiceContext`. The translation runtime
uses browser WebRTC media for source capture and translated playback instead of
the voice-agent WebSocket pipeline.

## Performance Considerations

### Bundle Optimization

```typescript
// Code splitting
const LazyVoiceVisualizer = lazy(() => import('./components/voice/VoiceVisualizer'));
const LazyConversationPanel = lazy(
  () => import('./components/conversation/ElevenLabsConversationPanel')
);

// Dynamic imports
const loadElevenLabsSDK = () => import('elevenlabs-js-sdk');
```

### Memory Management

```typescript
// Cleanup patterns
useEffect(() => {
  const audioContext = new AudioContext();

  return () => {
    audioContext.close();
  };
}, []);

// Resource cleanup
const cleanup = useCallback(() => {
  mediaRecorder?.stop();
  audioStream?.getTracks().forEach((track) => track.stop());
}, [mediaRecorder, audioStream]);
```

### Performance Monitoring

```typescript
// Performance metrics
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
};

// Web Vitals integration
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

## Security Architecture

### API Security

```typescript
// API key management
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  throw new Error('ElevenLabs API key is required');
}

// Request authentication
const authenticatedRequest = async (url: string, options: RequestInit) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
};
```

### Input Validation

```typescript
// Audio input validation
const validateAudioInput = (audioData: Blob): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/webm'];

  return audioData.size <= maxSize && allowedTypes.includes(audioData.type);
};

// User input sanitization
const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
```

### Privacy Protection

```typescript
// Audio data handling
const handleAudioData = (audioBlob: Blob) => {
  // Process audio securely
  // Don't store sensitive audio data
  // Clear audio buffers after processing
};

// User consent management
const getUserConsent = async (): Promise<boolean> => {
  const consent = await navigator.permissions.query({ name: 'microphone' });
  return consent.state === 'granted';
};
```

## Mobile Architecture

### Responsive Design Strategy

```typescript
// Mobile-first approach
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Mobile-specific components
const MobileVoiceControl = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <TouchOptimizedVoiceControl /> : <DesktopVoiceControl />;
};
```

### Touch Optimization

```typescript
// Touch event handling
const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault();
  startVoiceRecording();
};

const handleTouchEnd = (e: TouchEvent) => {
  e.preventDefault();
  stopVoiceRecording();
};

// Touch target sizing
const touchTargetStyle = {
  minHeight: '44px',
  minWidth: '44px',
  padding: '12px',
};
```

### Mobile Performance

```typescript
// Mobile-specific optimizations
const MobileOptimizedComponent = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return isVisible ? <ExpensiveComponent /> : <PlaceholderComponent />;
};
```

## Browser Compatibility

### Feature Detection

```typescript
// Browser capability detection
const checkBrowserSupport = () => {
  const support = {
    webAudio: !!(window.AudioContext || window.webkitAudioContext),
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    mediaRecorder: !!(window.MediaRecorder),
    webSocket: !!(window.WebSocket)
  };

  return support;
};

// Progressive enhancement
const VoiceComponent = () => {
  const support = checkBrowserSupport();

  if (!support.webAudio) {
    return <FallbackComponent />;
  }

  return <FullVoiceComponent />;
};
```

### Polyfills and Fallbacks

```typescript
// Audio context polyfill
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// getUserMedia polyfill
if (!navigator.mediaDevices) {
  navigator.mediaDevices = {};
}

if (!navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia = function (constraints) {
    const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not supported'));
    }

    return new Promise((resolve, reject) => {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}
```

## Build Architecture

### Development Environment

```typescript
// Vite configuration
export default defineConfig({
  plugins: [
    react(),
    // Development plugins
  ],
  server: {
    port: 5173,
    host: true,
    https: true, // Required for microphone access
  },
  define: {
    'process.env': process.env,
  },
});
```

### Production Build

```typescript
// Production optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          elevenlabs: ['elevenlabs-js-sdk'],
          audio: ['audio-processing-utilities'],
        },
      },
    },
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
});
```

## Monitoring and Analytics

### Performance Monitoring

```typescript
// Performance observer
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

observer.observe({ entryTypes: ['measure', 'navigation'] });
```

### Error Tracking

```typescript
// Error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }
}
```

## Testing Architecture

### Unit Tests (Vitest)

```
src/test/
|-- setup.ts                        # Test configuration and mocks
|-- ProviderContext.test.tsx        # Provider context tests
|-- ProviderTabs.test.tsx           # Tab component tests
|-- OpenAITranslationProvider.test.tsx # Translation provider tests
|-- openaiTranslation.test.ts       # Translation config helper tests
|-- openaiTranslationRoute.test.ts  # Translation backend route tests
|-- settingsStorage.test.ts         # Settings persistence tests
|-- ConfigurationDialog.test.tsx    # Modal accessibility tests
|-- UltravoxVoiceContext.test.tsx   # Ultravox context tests
|-- UltravoxProvider.test.tsx       # Ultravox provider tests
|-- useVapiVoice.test.ts            # Vapi hook tests
|-- VapiProvider.test.tsx           # Vapi provider tests
|-- useRetellVoice.test.ts          # Retell hook tests
|-- RetellProvider.test.tsx         # Retell provider tests
|-- useGeminiVoice.test.tsx         # Gemini hook tests (41 tests)
|-- GeminiProvider.test.tsx         # Gemini provider tests (56 tests)
|-- GeminiEmptyState.test.tsx       # Gemini empty state tests (11 tests)
\-- ... (679 tests total across 33 files)

src/lib/gemini/__tests__/
|-- audioUtils.test.ts              # PCM encoding/decoding tests (28 tests)
|-- genai-live-client.test.ts       # WebSocket client tests (26 tests)
\-- config.test.ts                  # Voice/model config tests (43 tests)
```

### E2E Tests (Playwright)

```
tests/e2e/
|-- fixtures/                   # Test fixtures and helpers
|   |-- audio-mock.fixture.ts   # Audio API mocking
|   \-- index.ts
|-- page-objects/
|   \-- VoicePage.ts            # Page object model
|-- providers/                  # Provider-specific tests
|   |-- elevenlabs.spec.ts
|   |-- openai.spec.ts
|   |-- xai.spec.ts
|   \-- gemini.spec.ts          # Gemini provider tests (19 tests)
|-- voice-ui/                   # Voice UI component tests
|   |-- voice-button.spec.ts
|   |-- voice-selector.spec.ts
|   |-- conversation-panel.spec.ts
|   \-- function-calling.spec.ts
|-- error-handling/             # Error and reconnection tests
|   |-- api-errors.spec.ts
|   |-- reconnection.spec.ts
|   \-- elevenlabs-reconnection.spec.ts
|-- smoke/                      # Smoke tests
|   |-- app-load.spec.ts
|   |-- tab-navigation.spec.ts
|   \-- provider-render.spec.ts
\-- utils/                      # Mock utilities
    |-- audio-mock.ts
    |-- websocket-mock.ts
    \-- mock-server.ts
```

### Reconnection Pattern

All providers use `useReconnection` hook for connection recovery:

```typescript
// Exponential backoff: 1s, 2s, 4s, 8s, up to 30s max
// Maximum 10 retry attempts
const { reconnect, cancelReconnect, reconnectionState } = useReconnection({
  maxRetries: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  onReconnect: performReconnect,
});
```

## Future Architecture Considerations

### Scalability

- Microservices architecture for API layer
- Edge computing for reduced latency
- CDN optimization for global reach

### Enhanced Features

- Offline voice processing capabilities
- Multi-language support
- Voice authentication integration
- Real-time collaboration features

### Performance Improvements

- WebAssembly for audio processing
- Service worker for offline functionality
- HTTP/3 for improved network performance

---

## Additional Resources

- [React Architecture Patterns](https://reactjs.org/docs/thinking-in-react.html)
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Performance Best Practices](https://web.dev/performance/)

---

**Last Updated**: January 18, 2026

This architecture is designed to be maintainable, scalable, and performant while providing excellent user experience for multi-provider voice AI interactions.
