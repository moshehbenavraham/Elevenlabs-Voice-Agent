# System Architecture

This document outlines the technical architecture of the Conversational Voice AI Agents application.

## Architecture Overview

A multi-provider voice AI application built with React and TypeScript, supporting real-time voice conversations with ElevenLabs, xAI (Grok), and future providers. The architecture emphasizes provider abstraction, performance, and accessibility.

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
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser Environment                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌─────────────────────────────────────────────┐ │
│  │   React App   │  │           Provider Layer                     │ │
│  │ (ProviderCtx) │  │  ┌─────────────┐  ┌─────────────────────┐   │ │
│  │               │◄─┤  │ ElevenLabs  │  │   xAI (Grok)        │   │ │
│  │  Tab System   │  │  │ VoiceContext│  │  XAIVoiceContext    │   │ │
│  └───────────────┘  │  └─────────────┘  └─────────────────────┘   │ │
│         │           └─────────────────────────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Audio Utils │  │  Web Audio  │  │      WebSocket/HTTP         │  │
│  │ (PCM/Base64)│  │     API     │  │     Communication           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                         Platform APIs                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ ┌─────────────┐  │
│  │ getUserMedia│  │AudioWorklet │  │AudioContext │ │  WebSocket  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
           │                                     │
┌──────────┴────────────┐           ┌───────────┴────────────┐
│   Backend (Express)   │           │      Provider APIs      │
│  ┌─────────────────┐  │           │  ┌─────────────────┐   │
│  │ /api/elevenlabs │  │           │  │   ElevenLabs    │   │
│  │ /api/xai        │  │           │  │   xAI Realtime  │   │
│  │ /api/health     │  │           │  │   (Future)      │   │
│  └─────────────────┘  │           │  └─────────────────┘   │
└───────────────────────┘           └────────────────────────┘
```

## Multi-Provider Architecture

### Provider Abstraction Layer

The application uses a unified provider interface allowing seamless switching between voice AI providers:

```typescript
// src/types/voice-provider.ts
export type ProviderType = 'elevenlabs' | 'xai' | 'openai';

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
    ├── ElevenLabs VoiceContext (existing SDK integration)
    └── XAIVoiceContext (WebSocket + ephemeral token)
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
├── ThemeProvider
├── ProviderProvider              # NEW: Active provider selection
├── Router
│   ├── Index (Main Page)
│   │   ├── ProviderTabs          # NEW: Tab navigation for providers
│   │   │   └── ProviderTab       # Individual tab component
│   │   ├── ElevenLabs Provider
│   │   │   ├── HeroSection
│   │   │   ├── VoiceButton
│   │   │   ├── VoiceStatus
│   │   │   ├── VoiceVisualizer
│   │   │   └── ElevenLabsEmptyState
│   │   ├── xAI Provider          # NEW: xAI voice integration
│   │   │   ├── XAIVoiceButton
│   │   │   ├── XAIVoiceStatus
│   │   │   ├── XAIVoiceVisualizer
│   │   │   └── XAIEmptyState
│   │   ├── BackgroundEffects
│   │   └── ConfigurationModal
│   └── NotFound
├── UI Components
│   ├── EmptyState                # NEW: Generic empty state component
│   ├── Button, Card, Dialog
│   └── ... (50+ shadcn/ui components)
└── Global Components
    ├── ThemeToggle
    └── AnimatedText
```

### Component Responsibilities

#### **App Component**
- Application bootstrap and routing
- Global providers and context setup
- Error boundary implementation

#### **VoiceEnvironment**
- Voice interaction orchestration
- State management for voice features
- Integration with ElevenLabs SDK

#### **VoiceOrb**
- Visual representation of voice state
- User interaction interface
- Animation and visual feedback

#### **AudioVisualizer**
- Real-time audio visualization
- Frequency analysis and display
- Performance-optimized rendering

#### **ThemeProvider**
- Theme management and switching
- CSS variable management
- User preference persistence

## 📊 Data Flow

### Voice Interaction Flow
```
User Input → Microphone → getUserMedia → MediaRecorder → 
Audio Processing → ElevenLabs API → Voice Response → 
Audio Playback → Visual Feedback → User Interface Update
```

### State Flow
```
User Action → Event Handler → State Update → 
Component Re-render → UI Update → Side Effects
```

### API Communication Flow
```
Component → Custom Hook → API Service → 
HTTP/WebSocket → ElevenLabs API → Response → 
State Update → UI Update
```

## 🎤 Voice Processing Pipeline

### Audio Input Pipeline
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Microphone     │───▶│  getUserMedia   │───▶│  MediaRecorder  │
│  Permission     │    │  Audio Stream   │    │  Audio Capture  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Permission     │    │  Audio Context  │    │  Audio Buffer   │
│  Management     │    │  Configuration  │    │  Processing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │  Frequency      │    │  ElevenLabs     │
                    │  Analysis       │    │  API Request    │
                    └─────────────────┘    └─────────────────┘
```

### Audio Output Pipeline
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  ElevenLabs     │───▶│  Audio Response │───▶│  Audio Element  │
│  API Response   │    │  Processing     │    │  Playback       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Response       │    │  Audio Buffer   │    │  Volume Control │
│  Validation     │    │  Management     │    │  & Effects      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │  Visualization  │    │  User Interface │
                    │  Update         │    │  Update         │
                    └─────────────────┘    └─────────────────┘
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

#### **Custom Hooks**
Used for feature-specific state management:
- `useProvider` - Provider selection hook
- `useVoice` - ElevenLabs voice hook
- `useXAIVoice` - xAI voice hook
- `useReducedMotion` - Accessibility preference detection
- `useAccessibility` - Accessibility features

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
  apiKey: process.env.VITE_ELEVENLABS_API_KEY,
  baseURL: 'https://api.elevenlabs.io/v1'
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
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                          │
├─────────────────────────────────────────────────────────────┤
│                    Custom Hooks                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │useElevenLabs    │  │useVoiceRecording│  │useAudioPlay │  │
│  │Conversation     │  │                 │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ElevenLabs       │  │Audio Processing │  │Error        │  │
│  │Service          │  │Service          │  │Handling     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    SDK Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ElevenLabs       │  │WebSocket        │  │HTTP Client  │  │
│  │SDK              │  │Connection       │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Backend Services

The application uses an Express.js backend (port 3001) for secure API key management.

### Server Architecture

```
server/
├── index.js              # Main Express server
└── routes/
    └── xai.js            # xAI ephemeral token endpoint
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/elevenlabs/signed-url` | ElevenLabs signed URL for SDK |
| POST | `/api/xai/session` | Create xAI ephemeral token |

### xAI Token Flow

```
Frontend                    Backend                     xAI API
   │                          │                           │
   │ POST /api/xai/session    │                           │
   │─────────────────────────>│                           │
   │                          │ POST /v1/realtime/        │
   │                          │      client_secrets       │
   │                          │──────────────────────────>│
   │                          │                           │
   │                          │ { client_secret }         │
   │                          │<──────────────────────────│
   │                          │                           │
   │ { token, expiresAt }     │                           │
   │<─────────────────────────│                           │
   │                          │                           │
   │ WebSocket: wss://api.x.ai/v1/realtime?model=grok-2-public
   │─────────────────────────────────────────────────────>│
```

### Audio Processing (xAI)

```typescript
// src/lib/audio/audioUtils.ts
// PCM 16-bit, 24kHz mono format for xAI Realtime API

encodeAudioForXAI(float32Array) -> base64String
decodeAudioFromXAI(base64String) -> Float32Array
resampleAudio(audioData, fromRate, toRate) -> Float32Array
```

## Performance Considerations

### Bundle Optimization
```typescript
// Code splitting
const LazyVoiceOrb = lazy(() => import('./components/VoiceOrb'));
const LazyAudioVisualizer = lazy(() => import('./components/AudioVisualizer'));

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
  audioStream?.getTracks().forEach(track => track.stop());
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

## 🔐 Security Architecture

### API Security
```typescript
// API key management
const apiKey = process.env.VITE_ELEVENLABS_API_KEY;
if (!apiKey) {
  throw new Error('ElevenLabs API key is required');
}

// Request authentication
const authenticatedRequest = async (url: string, options: RequestInit) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
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

## 📱 Mobile Architecture

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
const MobileVoiceOrb = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <TouchOptimizedOrb /> : <DesktopOrb />;
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
  padding: '12px'
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

## 🌐 Browser Compatibility

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
  navigator.mediaDevices.getUserMedia = function(constraints) {
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

## 🔧 Build Architecture

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
    https: true // Required for microphone access
  },
  define: {
    'process.env': process.env
  }
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
          audio: ['audio-processing-utilities']
        }
      }
    },
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
});
```

## 📊 Monitoring and Analytics

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

## 🔮 Future Architecture Considerations

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

## 📚 Additional Resources

- [React Architecture Patterns](https://reactjs.org/docs/thinking-in-react.html)
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Performance Best Practices](https://web.dev/performance/)

---

**Last Updated**: December 28, 2025

This architecture is designed to be maintainable, scalable, and performant while providing excellent user experience for multi-provider voice AI interactions.