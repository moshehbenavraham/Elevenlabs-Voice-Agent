# Voice-Agent-PuPuPlatter - Product Requirements Document

## Overview

Voice-Agent-PuPuPlatter is a multi-provider voice AI comparison platform that enables developers and researchers to evaluate different conversational voice AI providers through a unified interface. The platform supports real-time audio streaming, transcription, and function calling across providers including ElevenLabs, OpenAI Realtime, xAI, Ultravox, Vapi, Retell, and Google Gemini Live.

The primary value is providing a single application where users can compare voice quality, latency, feature sets, and integration complexity across competing voice AI services. Each provider is implemented as an isolated tab with consistent UI patterns while respecting provider-specific capabilities.

## Goals

1. Integrate Google Gemini Live as a new voice AI provider following established patterns
2. Maintain feature parity with existing providers (voice input/output, transcription, function calling)
3. Implement secure authentication using ephemeral tokens (never expose API keys to client)
4. Support all 30 Gemini HD voices with voice selection UI
5. Achieve low-latency voice interaction with AudioWorklet-based audio pipeline
6. Handle interruption (barge-in) cleanly with immediate audio queue clearing
7. Update documentation to reflect new provider integration

## Non-Goals

- Video input support (Gemini Live supports it, but this phase is audio-only)
- Session resumption/checkpointing (defer to future enhancement)
- Thinking mode visualization (defer to future enhancement)
- Google Search grounding tool (defer to future enhancement)
- Proactive audio mode (model decides not to respond)
- Affective dialog mode (emotional tone matching)
- Multi-language auto-detection (users select language explicitly if needed)
- Mobile-specific optimizations beyond existing responsive design
- Provider-agnostic voice abstraction layer (each provider remains isolated)

## Users and Use Cases

### Primary Users

- **Voice AI Developers**: Engineers evaluating voice AI providers for their applications
- **Product Managers**: Decision-makers comparing provider capabilities and costs
- **Researchers**: Academics studying voice AI quality, latency, and behavior differences

### Key Use Cases

1. **Provider Comparison**: User switches between tabs to compare voice quality and responsiveness
2. **Voice Testing**: User has a conversation to evaluate natural language understanding
3. **Function Calling Demo**: User asks for weather/time to test tool integration
4. **Latency Evaluation**: User measures response time across providers
5. **Voice Selection**: User previews different voice options within a provider

## Requirements

### MVP Requirements (Phase 00)

#### Backend

- Create `/api/gemini/token` endpoint for ephemeral token generation
- Token expires in 30 minutes with single-use constraint
- Validate GEMINI_API_KEY environment variable on startup
- Return structured error responses for token generation failures

#### Audio Infrastructure

- Implement AudioWorklet for non-blocking microphone capture at 16kHz
- Create AudioStreamer for 24kHz playback with GainNode volume control
- PCM16 encoding utilities for WebSocket transmission (Float32 to base64)
- PCM16 decoding utilities for audio playback (base64 to Float32)

#### Core Client

- GenAILiveClient wrapper with EventEmitter pattern for loose coupling
- WebSocket connection to `wss://generativelanguage.googleapis.com`
- Handle server events: audio, content, toolcall, transcription, interrupted
- sendRealtimeInput for streaming microphone audio
- sendToolResponse for function calling responses

#### React Integration

- useGeminiVoice hook with connect/disconnect/toggleMute/sendText
- GeminiVoiceContext for state management
- States: idle, connecting, connected, listening, thinking, speaking, error
- Transcript accumulation with partial/final handling (refs for partials, state for finals)
- Session resumption: store handles, auto-reconnect on WebSocket timeout
- Session timer: track duration, show warning at 12+ minutes

#### UI Components

- GeminiProvider.tsx following existing provider patterns
- Reuse VoiceButton, VoiceStatus, VoiceVisualizer, ConversationPanel
- Integration with ProviderTabs via VITE_GEMINI_ENABLED toggle
- Voice selector dropdown with 30 HD voice options

#### Function Calling

- Implement get_weather and get_time demo tools (matching other providers)
- FunctionCallIndicator integration for visual feedback

### Deferred Requirements

- Session resumption with checkpoint handles
- Thinking mode with configurable token budget
- Google Search grounding integration
- Affective dialog (emotional tone matching)
- Proactive audio (model decides not to respond)
- Video input streaming
- Custom voice activity detection sensitivity tuning
- Multi-language automatic detection

## Non-Functional Requirements

- **Performance**: Voice latency under 500ms perceived response time; AudioWorklet prevents main thread blocking
- **Security**: API keys never exposed to client; ephemeral tokens only; HTTPS required in production
- **Reliability**: Graceful handling of WebSocket disconnects; clear error states in UI
- **Accessibility**: All existing accessibility patterns maintained (ARIA, focus management, reduced motion)
- **Compatibility**: Chrome, Firefox, Safari, Edge; requires Web Audio API with custom sample rates

## Constraints and Dependencies

- **@google/genai SDK**: Version ^1.34.0 required for Live API support
- **eventemitter3**: Version ^5.0.1 for client event handling
- **AudioWorklet support**: Required for non-blocking audio capture (no ScriptProcessorNode fallback)
- **Sample rates**: Capture at 16kHz, playback at 24kHz - AudioContext must support custom rates
- **HTTPS**: Required for microphone access in production (localhost exempt)
- **Model deprecation**: gemini-2.0-flash models retire March 3, 2026 - use 2.5 models only
- **Session limits**: 15 minute maximum session duration; 5000 concurrent sessions per project
- **Token context**: 128k tokens for native audio model

## Phases

This system delivers the product via phases. Each phase is implemented via multiple 2-4 hour sessions (12-25 tasks each).

| Phase | Name                      | Sessions | Status      |
| ----- | ------------------------- | -------- | ----------- |
| 00    | Gemini Live Integration   | 5        | Complete    |
| 01    | Production Infrastructure | 4        | Not Started |

## Phase 00: Gemini Live Integration

### Objectives

1. Add @google/genai and eventemitter3 dependencies
2. Create backend token generation endpoint with proper security
3. Implement AudioWorklet-based audio pipeline for 16kHz capture and 24kHz playback
4. Build GenAILiveClient with EventEmitter pattern for WebSocket management
5. Create useGeminiVoice hook following existing provider patterns
6. Develop GeminiProvider component with full UI integration
7. Add comprehensive tests for all new components
8. Update CLAUDE.md documentation with Gemini integration details

### Sessions

| Session | Name                                | Est. Tasks |
| ------- | ----------------------------------- | ---------- |
| 01      | Dependencies & Audio Infrastructure | ~15        |
| 02      | GenAI Client & Backend              | ~18        |
| 03      | Voice Hook & Context                | ~16        |
| 04      | Provider Component & UI             | ~14        |
| 05      | Testing & Polish                    | ~12        |

See `.spec_system/PRD/phase_00/` for detailed session specifications.

## Phase 01: Production Infrastructure

### Objectives

1. Establish continuous integration with automated testing and quality checks
2. Create production-ready Docker containerization with multi-stage builds
3. Implement deployment automation for staging and production environments
4. Add monitoring, logging, and error tracking for operational visibility

### Sessions

| Session | Name                        | Est. Tasks |
| ------- | --------------------------- | ---------- |
| 01      | CI Pipeline & Quality Gates | ~15        |
| 02      | Containerization & Build    | ~14        |
| 03      | Deployment & Environments   | ~16        |
| 04      | Monitoring & Observability  | ~12        |

See `.spec_system/PRD/phase_01/` for detailed session specifications.

## Technical Stack

- **Framework**: React 18.3.1 with TypeScript - existing foundation
- **Build Tool**: Vite with SWC - fast HMR for development
- **Styling**: Tailwind CSS with glassmorphism - consistent with existing design
- **UI Components**: Radix UI / shadcn/ui - accessible component primitives
- **Voice SDKs**: @google/genai ^1.34.0 for Gemini Live API
- **Events**: eventemitter3 ^5.0.1 for loose coupling in WebSocket client
- **State**: React Context + custom hooks - provider-isolated state management
- **Testing**: Vitest + RTL for unit tests; Playwright for E2E
- **Backend**: Express.js server for token generation endpoint

## Success Criteria

- [x] Gemini Live provider connects and streams bidirectional audio
- [x] Voice input captured at 16kHz via AudioWorklet (non-blocking)
- [x] Voice output plays at 24kHz with smooth scheduling
- [x] Transcriptions display in ConversationPanel (both user and AI)
- [x] Partial transcripts show typing indicator, finals added to message list
- [x] Function calling works (get_weather, get_time demo tools)
- [x] Barge-in (interruption) clears audio queue immediately
- [x] All 30 HD voices selectable via VoiceSelector (Puck default)
- [x] VITE_GEMINI_ENABLED toggle shows/hides tab correctly
- [x] No API keys exposed in client code or network requests
- [x] Session resumption auto-reconnects on WebSocket timeout (~10 min)
- [x] Session timer shows at 12+ minutes with warning at 14 minutes
- [x] Thinking indicator displays during model processing
- [x] Unit tests pass for audio utilities, GenAILiveClient, useGeminiVoice
- [x] E2E tests pass for Gemini voice flow
- [x] CLAUDE.md updated with Gemini integration documentation
- [x] TypeScript compilation succeeds with no errors
- [x] ESLint passes with no warnings (25 pre-existing warnings acceptable)

## Risks

- **AudioWorklet browser support**: Safari may have limitations; verify during implementation
- **Sample rate support**: Not all browsers support 16kHz/24kHz AudioContext; test early
- **SDK stability**: @google/genai Live API is preview; monitor for breaking changes
- **Latency variance**: Network conditions affect perceived responsiveness; set expectations
- **Token expiration during conversation**: 30-minute limit may interrupt long sessions

## Assumptions

- GEMINI_API_KEY will be provided in environment variables
- Backend server (Express) is available at VITE_API_BASE_URL
- Modern browser with Web Audio API support is required
- Users have microphone permissions enabled
- Existing provider patterns (Context, Hook, Provider component) are suitable for Gemini

## Resolved Decisions

### 1. Token Refresh Strategy

**Decision**: No automatic token refresh needed. Use **session resumption** instead.

**Rationale**: The token expires in 30 minutes, but sessions are limited to 15 minutes anyway. The WebSocket connection times out at ~10 minutes. Google's recommended approach is to enable session resumption, which provides resumption handles valid for 2 hours. This handles reconnection seamlessly without needing fresh tokens mid-session.

**Implementation**:

- Enable `sessionResumption: {}` in setup config
- Store resumption handles from `SessionResumptionUpdate` messages
- On WebSocket disconnect, reconnect using the last handle
- No mid-session token refresh required

### 2. Default Voice

**Decision**: Use **Puck** as the default voice.

**Rationale**: Google's official documentation states Puck is the default voice when none is specified. Puck is described as "Upbeat, friendly" - suitable for a general assistant. The research document incorrectly suggested Zephyr, but we align with Google's default for consistency.

**Implementation**:

- `VITE_GEMINI_VOICE` defaults to `Puck` if not set
- Voice selector shows all 30 HD voices with Puck pre-selected
- User selection persisted to localStorage (matching existing provider patterns)

### 3. Transcript Deduplication

**Decision**: Accumulate partials in refs, commit on `finished: true`.

**Rationale**: Gemini sends transcripts in small chunks that must be concatenated. The API provides a `finished` boolean to indicate completion. Existing providers (Vapi, Retell) use the same pattern - store partial separately for typing indicators, only add to permanent messages when final.

**Implementation**:

- Store `partialUserTranscript` and `partialAiTranscript` in refs (no re-renders)
- Concatenate chunks as they arrive
- When `finished: true`, create permanent message and clear partial
- Display partial in UI via `activeTranscript` prop for typing indicator
- Match Vapi/Retell pattern exactly

### 4. Session Duration UX

**Decision**: Display timer warning at 12+ minutes, enable auto-reconnect via session resumption.

**Rationale**: Audio-only sessions are limited to 15 minutes. The WebSocket connection times out at ~10 minutes independently. Google recommends session resumption as the standard approach for production. Users need visibility into session time to manage expectations.

**Implementation**:

- Track `sessionStartTime` in state
- At 12 minutes: Show subtle "12:00" timer in status area
- At 14 minutes: Show warning "Session ending soon (1:00 remaining)"
- At ~10 minutes (if WebSocket disconnects): Auto-reconnect using session resumption handle (transparent to user)
- At 15 minutes: Gracefully disconnect with message "Session ended - click to start new conversation"
- Session resumption handles reconnection automatically for the 10-minute WebSocket limit

### 5. Thinking Indicator

**Decision**: Yes, show "Thinking..." indicator during model processing.

**Rationale**: Gemini 2.5 native audio has dynamic thinking enabled by default. Ultravox is the only existing provider with a thinking state, and it improves UX by showing activity during processing delays. Users need feedback that the model received their input and is working.

**Implementation**:

- Add `thinking` to status enum: `idle | connecting | connected | listening | thinking | speaking | error`
- Detect thinking: When VAD detects end of user speech, start 300ms timer
- If no audio chunk arrives within timer, set status to `thinking`
- Clear thinking status when first audio chunk arrives (transition to `speaking`)
- VoiceStatus displays "Thinking..." with amber color (matching loading states)

---

## Technical Reference Appendix

### Model Configuration

| Property       | Value                                           |
| -------------- | ----------------------------------------------- |
| Model ID       | `gemini-2.5-flash-native-audio-preview-12-2025` |
| Stable Alias   | `gemini-2.5-flash-native-audio-latest`          |
| Context Window | 128k tokens                                     |
| Deprecation    | gemini-2.0-flash models retire March 3, 2026    |

### WebSocket Endpoint

```
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
```

### Audio Specifications

| Property    | Input (Microphone)     | Output (Speakers)      |
| ----------- | ---------------------- | ---------------------- |
| Format      | PCM                    | PCM                    |
| Bit Depth   | 16-bit                 | 16-bit                 |
| Sample Rate | 16,000 Hz              | 24,000 Hz              |
| Channels    | Mono                   | Mono                   |
| Byte Order  | Little-endian          | Little-endian          |
| MIME Type   | `audio/pcm;rate=16000` | `audio/pcm;rate=24000` |
| Encoding    | Base64 for WebSocket   | Base64 from WebSocket  |

### Audio Buffer Configuration

| Setting            | Value        | Notes                 |
| ------------------ | ------------ | --------------------- |
| Input Buffer Size  | 2048 samples | ~128ms at 16kHz       |
| Output Buffer Size | 7680 samples | 320ms at 24kHz        |
| Schedule Lookahead | 200ms        | Schedule audio ahead  |
| Initial Buffer     | 100ms        | Buffer before playing |
| Volume Ramp Time   | 100ms        | Smooth transitions    |

### Available Voices (30 HD Voices)

| Voice            | Characteristic             | Voice             | Characteristic       |
| ---------------- | -------------------------- | ----------------- | -------------------- |
| **Puck**         | Upbeat, friendly (DEFAULT) | **Zephyr**        | Bright, higher pitch |
| **Charon**       | Informative, deep          | **Kore**          | Firm, neutral        |
| **Fenrir**       | Excitable, energetic       | **Leda**          | Youthful             |
| **Orus**         | Firm                       | **Aoede**         | Breezy               |
| **Callirrhoe**   | Easygoing                  | **Autonoe**       | Bright               |
| **Enceladus**    | Breathy                    | **Iapetus**       | Clear                |
| **Umbriel**      | Easygoing                  | **Algieba**       | Gravelly             |
| **Despina**      | Smooth                     | **Erinome**       | Clear                |
| **Algenib**      | Gravelly, deeper           | **Rasalgethi**    | Informative          |
| **Laomedeia**    | Upbeat                     | **Achernar**      | Soft                 |
| **Alnilam**      | Firm                       | **Schedar**       | Even                 |
| **Gacrux**       | Mature                     | **Pulcherrima**   | Forward              |
| **Achird**       | Friendly                   | **Zubenelgenubi** | Casual               |
| **Vindemiatrix** | Gentle                     | **Sadachbia**     | Lively               |
| **Sadaltager**   | Knowledgeable              | **Sulafat**       | Warm                 |

### Supported Languages (24)

English (US), English (India), French, Spanish (US), Arabic (Egyptian), German, Hindi, Indonesian, Italian, Japanese, Korean, Portuguese (Brazil), Russian, Dutch, Polish, Thai, Turkish, Vietnamese, Romanian, Ukrainian, Bengali, Marathi, Tamil, Telugu

### Environment Variables

```env
# Frontend (VITE_ prefix - exposed to client)
VITE_GEMINI_ENABLED=true
VITE_GEMINI_VOICE=Puck
VITE_GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025

# Backend (server-side only - never exposed)
GEMINI_API_KEY=your_api_key_here
```

### File Structure

```
src/
  components/
    providers/
      GeminiProvider.tsx        # Main provider component
  contexts/
    GeminiVoiceContext.tsx      # Context for state management
  hooks/
    useGeminiVoice.ts           # Core voice hook
  lib/
    audio/
      audio-recorder.ts         # Microphone capture with AudioWorklet
      audio-streamer.ts         # Playback scheduling with GainNode
    worklets/
      audio-processing-worklet.ts  # AudioWorklet for Float32 to Int16
    gemini/
      genai-live-client.ts      # EventEmitter WebSocket wrapper
      config.ts                 # Voice and model configuration
      audioUtils.ts             # PCM encoding/decoding utilities
      toolDefinitions.ts        # Function declarations
server/
  routes/
    gemini.ts                   # Token generation endpoint
```

### SDK Imports

```typescript
// Client-side
import { GoogleGenAI, Modality } from '@google/genai';
import EventEmitter from 'eventemitter3';

// Server-side (token generation)
import { GoogleGenAI } from '@google/genai';
```

### Token Generation (Backend)

```typescript
const token = await client.authTokens.create({
  config: {
    uses: 1, // Single-use token
    expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    liveConnectConstraints: {
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        sessionResumption: {}, // Enable session resumption
        temperature: 0.7,
        responseModalities: ['AUDIO'],
      },
    },
    httpOptions: { apiVersion: 'v1alpha' },
  },
});
```

### Session Configuration

```typescript
const config = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: 'Puck' }
    }
  },
  systemInstruction: {
    parts: [{ text: 'You are a helpful assistant.' }]
  },
  inputAudioTranscription: { enabled: true },
  outputAudioTranscription: { enabled: true },
  sessionResumption: {},
  tools: [{ functionDeclarations: [...] }]
};
```

### WebSocket Message Types

**Client Messages:**

- `setup` - First message, session configuration
- `realtimeInput` - Audio/video/text streaming
- `clientContent` - Conversation history updates
- `toolResponse` - Function call responses

**Server Messages:**

- `setupComplete` - Configuration acknowledged
- `serverContent.modelTurn` - Audio/text response chunks
- `serverContent.inputTranscription` - User speech-to-text
- `serverContent.outputTranscription` - AI speech-to-text
- `serverContent.interrupted` - Barge-in detected
- `serverContent.turnComplete` - Response finished
- `toolCall` - Function call request
- `goAway` - Connection terminating soon
- `sessionResumptionUpdate` - Resumption handle

### Audio Conversion Functions

```typescript
// Float32 (Web Audio) to base64 PCM16 (for sending)
function float32ToBase64PCM(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const uint8 = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

// Base64 PCM16 to Float32 (for playback)
function base64PCMToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}
```

### Function Calling Schema

```typescript
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
          },
          required: ['location'],
        },
      },
      {
        name: 'get_time',
        description: 'Get current time for a timezone',
        parameters: {
          type: 'object',
          properties: {
            timezone: { type: 'string', description: 'IANA timezone' },
          },
          required: ['timezone'],
        },
      },
    ],
  },
];
```

### Session Limits

| Limit                      | Value                                |
| -------------------------- | ------------------------------------ |
| Max concurrent sessions    | 5,000 per project                    |
| Token rate limit           | 4M tokens/minute                     |
| Session duration (audio)   | 15 minutes                           |
| Session duration (video)   | 2 minutes                            |
| WebSocket connection       | ~10 minutes (use session resumption) |
| Context window             | 128k tokens                          |
| Resumption handle validity | 2 hours                              |

### Browser Requirements

- HTTPS required for microphone (except localhost)
- Web Audio API with custom sample rates (16kHz, 24kHz)
- AudioWorklet support (no ScriptProcessorNode fallback)
- Modern browser: Chrome, Firefox, Safari, Edge
- Safari may require user gesture for audio initialization

### Official Resources

- [Live API Getting Started](https://ai.google.dev/gemini-api/docs/live)
- [Live API Capabilities Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [Session Management](https://ai.google.dev/gemini-api/docs/live-session)
- [WebSocket API Reference](https://ai.google.dev/api/live)
- [Ephemeral Tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)
- [Speech Generation](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Best Practices (Vertex AI)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/best-practices)
- [JS SDK (npm)](https://www.npmjs.com/package/@google/genai)
- [JS SDK (GitHub)](https://github.com/googleapis/js-genai)
