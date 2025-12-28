# OpenAI Realtime API Specification

**Session**: phase01-session01-openai-research
**Created**: 2025-12-28
**Status**: Research Complete

---

## 1. Overview

The OpenAI Realtime API enables low-latency, multimodal voice conversations with GPT-4o models. It supports speech-to-speech interactions via WebSocket or WebRTC connections.

### Key Capabilities

- **Real-time audio streaming**: Bidirectional audio over persistent connections
- **Native speech-to-speech**: Direct audio processing without intermediate STT/TTS
- **Server-side VAD**: Automatic turn detection and response triggering
- **Function calling**: Tool use within voice conversations
- **Multi-modal**: Support for text, audio, and image inputs/outputs

### Supported Models

| Model ID | Version | Notes |
|----------|---------|-------|
| `gpt-4o-realtime-preview` | 2024-12-17 | Primary realtime model |
| `gpt-4o-mini-realtime-preview` | 2024-12-17 | Smaller, faster variant |
| `gpt-realtime` | 2025-08-28 | GA version |
| `gpt-realtime-mini` | 2025-10-06 | Mini GA version |

### Available Regions

- East US 2
- Sweden Central

---

## 2. Connection Lifecycle

### WebSocket URL

```
wss://api.openai.com/v1/realtime?model={MODEL}
```

Example:
```
wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview
```

### Connection Flow

```
1. Client -> Server: WebSocket handshake with Authorization header
2. Server -> Client: session.created (initial session config)
3. Client -> Server: session.update (configure session)
4. Server -> Client: session.updated (confirm config)
5. Server -> Client: conversation.created (conversation ready)
6. [Conversation loop begins]
```

### Session Events

1. **session.created**: First server event after connection
   - Contains default session configuration
   - Includes session ID and model info

2. **session.update** (client): Configure session parameters
   - Voice, modalities, audio formats
   - Turn detection settings
   - Tools and instructions

3. **session.updated** (server): Confirms configuration applied

### Connection Limits

- **Maximum session duration**: 15 minutes
- **Maximum context length**: 128,000 tokens
- **Recommended connection**: WebRTC for browsers, WebSocket for servers

---

## 3. Authentication

### WebSocket Authentication (Server-to-Server)

For backend applications, use API key in Authorization header:

```
Authorization: Bearer sk-...
```

### Ephemeral Tokens (Browser Clients)

For browser applications, use short-lived tokens to avoid exposing API keys:

**Endpoint**: `POST https://api.openai.com/v1/realtime/client_secrets`

**Request**:
```json
{
  "model": "gpt-4o-realtime-preview",
  "voice": "alloy"
}
```

**Response**:
```json
{
  "client_secret": {
    "value": "ek_...",
    "expires_at": 1234567890
  }
}
```

### Token Usage

- Tokens are short-lived (configurable TTL)
- Session configuration can be attached to token
- Never expose main API key to browser clients

### Security Best Practices

1. Always use HTTPS for API calls
2. Generate ephemeral tokens server-side
3. Use backend proxy for all API key operations
4. Implement token refresh before expiration

---

## 4. Audio Streaming

### Input Audio Flow

```
1. Client captures microphone audio
2. Audio encoded to PCM16 or G.711
3. Base64 encode the audio bytes
4. Send via input_audio_buffer.append events
5. Server VAD detects end of speech
6. Server commits buffer and triggers response
```

### Output Audio Flow

```
1. Server generates response
2. Audio chunks sent via response.audio.delta events
3. Client decodes base64 audio
4. Client plays audio through AudioContext
5. Server sends response.audio.done when complete
```

### Audio Buffer Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `input_audio_buffer.append` | Client | Send audio chunk |
| `input_audio_buffer.commit` | Client | Manually commit buffer |
| `input_audio_buffer.clear` | Client | Clear pending audio |
| `input_audio_buffer.committed` | Server | Buffer committed confirmation |
| `input_audio_buffer.cleared` | Server | Buffer cleared confirmation |
| `input_audio_buffer.speech_started` | Server | VAD detected speech start |
| `input_audio_buffer.speech_stopped` | Server | VAD detected speech end |

---

## 5. Turn Detection (VAD)

### VAD Types

#### Server VAD (`server_vad`)
- Server-side voice activity detection
- Automatically commits buffer on silence
- Triggers response generation automatically

#### Semantic VAD (`semantic_vad`)
- Detects turn completion based on semantic content
- Better understanding of natural pauses
- Configurable eagerness (low, high, auto)

### VAD Configuration

```json
{
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 200,
    "create_response": true,
    "interrupt_response": true
  }
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | "server_vad" | VAD algorithm type |
| `threshold` | number | 0.5 | Speech detection sensitivity (0-1) |
| `prefix_padding_ms` | number | 300 | Audio before speech to include |
| `silence_duration_ms` | number | 200 | Silence before end-of-speech |
| `create_response` | boolean | true | Auto-create response on speech end |
| `interrupt_response` | boolean | true | Allow user to interrupt assistant |
| `eagerness` | string | "auto" | Semantic VAD eagerness |

---

## 6. Session Configuration

### Full Session Options

```json
{
  "type": "session.update",
  "session": {
    "modalities": ["text", "audio"],
    "instructions": "You are a helpful assistant.",
    "voice": "alloy",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": {
      "model": "whisper-1"
    },
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "silence_duration_ms": 200
    },
    "tools": [],
    "tool_choice": "auto",
    "temperature": 0.8,
    "max_response_output_tokens": "inf"
  }
}
```

### Voice Options

| Voice | Description |
|-------|-------------|
| `alloy` | Default, neutral |
| `ash` | Alternative voice |
| `ballad` | Alternative voice |
| `coral` | Alternative voice |
| `echo` | Alternative voice |
| `sage` | Alternative voice |
| `shimmer` | Alternative voice |
| `verse` | Alternative voice |

### Transcription Models

- `whisper-1` - Standard Whisper model
- `gpt-4o-transcribe` - GPT-4o transcription
- `gpt-4o-mini-transcribe` - Mini transcription model

---

## 7. Rate Limits and Pricing

### Rate Limit Events

Server sends `rate_limits.updated` at response start:

```json
{
  "type": "rate_limits.updated",
  "rate_limits": [
    {
      "name": "requests_per_min",
      "limit": 500,
      "remaining": 495,
      "reset_seconds": 60
    },
    {
      "name": "tokens_per_min",
      "limit": 90000,
      "remaining": 89500,
      "reset_seconds": 60
    }
  ]
}
```

### Token Usage

Response includes usage data:

```json
{
  "usage": {
    "total_tokens": 150,
    "input_tokens": 50,
    "output_tokens": 100,
    "input_token_details": {
      "cached_tokens": 0,
      "text_tokens": 20,
      "audio_tokens": 30
    },
    "output_token_details": {
      "text_tokens": 50,
      "audio_tokens": 50
    }
  }
}
```

---

## 8. Error Handling

### Error Event Structure

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_audio_format",
    "message": "Audio format not supported",
    "param": "input_audio_format",
    "event_id": "evt_123"
  }
}
```

### Error Types

| Type | Description |
|------|-------------|
| `invalid_request_error` | Client sent invalid request |
| `server_error` | Internal server error |
| `rate_limit_error` | Rate limit exceeded |
| `authentication_error` | Invalid or expired credentials |

### Best Practices

1. Monitor for error events
2. Implement reconnection with exponential backoff
3. Handle rate limits gracefully
4. Log errors with context for debugging

---

## 9. Comparison with xAI Implementation

| Feature | OpenAI | xAI (Current) |
|---------|--------|---------------|
| WebSocket URL | `wss://api.openai.com/v1/realtime` | `wss://api.x.ai/v1/realtime` |
| Sample Rate | 24kHz | 24kHz (compatible) |
| Audio Format | pcm16, g711 | pcm16 |
| Token Endpoint | `/v1/realtime/client_secrets` | `/api/xai/session` (custom) |
| VAD Types | server_vad, semantic_vad | server_vad |
| Default Voice | alloy | verse |

### Reusable Patterns

The following xAI patterns can be reused for OpenAI:

1. **AudioContext setup** - Same sample rate (24kHz)
2. **PCM encoder worklet** - Same format (pcm16)
3. **Base64 encoding/decoding** - Same approach
4. **WebSocket message routing** - Similar event structure
5. **Audio playback queue** - Same pattern
6. **Volume control via GainNode** - Same approach
7. **Analyser for visualization** - Same approach

### New Implementations Required

1. **OpenAI ephemeral token endpoint** - Backend: `/api/openai/session`
2. **OpenAIVoiceContext** - Frontend: Similar to XAIVoiceContext
3. **Voice options** - Different set (alloy, ash, etc.)
4. **Model selection** - gpt-4o-realtime-preview

---

## Sources

- [OpenAI Realtime API Guide](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Realtime API Reference](https://platform.openai.com/docs/api-reference/realtime)
- [Azure OpenAI Realtime Audio Reference](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/realtime-audio-reference)
- [Latent Space: OpenAI Realtime API Manual](https://www.latent.space/p/realtime-api)
