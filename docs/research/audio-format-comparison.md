# Audio Format Comparison: OpenAI vs xAI

**Session**: phase01-session01-openai-research
**Created**: 2025-12-28
**Status**: Research Complete

---

## Audio Format Specifications

| Property | OpenAI Realtime | xAI Realtime | Compatible? |
|----------|-----------------|--------------|-------------|
| Sample Rate | 24,000 Hz | 24,000 Hz | Yes |
| Bit Depth | 16-bit signed integer | 16-bit signed integer | Yes |
| Channels | Mono (1 channel) | Mono (1 channel) | Yes |
| Encoding | PCM16 (primary) | PCM16 | Yes |
| Alternative Formats | G.711 u-law, G.711 A-law | None documented | - |
| Transport Encoding | Base64 | Base64 | Yes |
| Compression | Optional permessage-deflate | None documented | - |

---

## Audio Format Identifiers

### OpenAI Supported Formats

| Format ID | Description | Use Case |
|-----------|-------------|----------|
| `pcm16` | 16-bit PCM, 24kHz mono | Default, highest quality |
| `g711_ulaw` | G.711 mu-law compression | Telephony, reduced bandwidth |
| `g711_alaw` | G.711 A-law compression | European telephony |

### xAI Supported Formats

| Format ID | Description | Use Case |
|-----------|-------------|----------|
| `pcm16` | 16-bit PCM, 24kHz mono | Only supported format |

---

## Bitrate Analysis

### OpenAI PCM16 Bitrate

```
24,000 samples/sec x 16 bits/sample = 384,000 bits/sec = 384 kbps
With Base64 overhead (4/3): ~512 kbps
With WebSocket compression: ~300-400 kbps
```

### xAI PCM16 Bitrate

```
24,000 samples/sec x 16 bits/sample = 384,000 bits/sec = 384 kbps
With Base64 overhead (4/3): ~512 kbps
```

---

## Browser Capture Settings

### Recommended MediaDevices Configuration

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    channelCount: 1,           // Mono
    sampleRate: { ideal: 48000 }, // Capture at 48kHz, resample to 24kHz
    echoCancellation: true,
    noiseSuppression: true,
  },
});
```

### Resampling Requirement

Both APIs expect 24kHz input. Browsers typically capture at 48kHz.

**Current xAI approach** (reusable for OpenAI):
- AudioWorklet captures at browser sample rate (48kHz)
- Downsamples 2:1 to 24kHz in worklet
- Outputs Int16Array (PCM16)

---

## Audio Encoding Pipeline

### Shared Pipeline (Both Providers)

```
Microphone (48kHz float32)
    |
    v
AudioWorklet (downsample to 24kHz)
    |
    v
Int16Array (PCM16)
    |
    v
Uint8Array (bytes)
    |
    v
Base64 string
    |
    v
WebSocket send
```

### Code Reference

From `src/lib/audio/audioUtils.ts`:

```typescript
export const XAI_SAMPLE_RATE = 24000;

// Convert Int16Array to bytes
export function int16ToBytes(int16Array: Int16Array): Uint8Array

// Encode bytes to base64
export function encodeBase64(bytes: Uint8Array): string
```

---

## Audio Decoding Pipeline

### OpenAI Response Audio

```
response.audio.delta (base64 PCM16)
    |
    v
Decode base64 to Uint8Array
    |
    v
Convert to Int16Array
    |
    v
Convert to Float32Array
    |
    v
Create AudioBuffer (24kHz)
    |
    v
Play via AudioBufferSourceNode
```

### xAI Response Audio

Same pipeline - uses `decodeAudioFromXAI` in `audioUtils.ts`.

---

## Compatibility Summary

### Fully Reusable Components

| Component | Location | Notes |
|-----------|----------|-------|
| `XAI_SAMPLE_RATE` | `audioUtils.ts` | Rename to `REALTIME_SAMPLE_RATE` |
| `encodeBase64()` | `audioUtils.ts` | No changes needed |
| `int16ToBytes()` | `audioUtils.ts` | No changes needed |
| `decodeAudioFromXAI()` | `audioUtils.ts` | Rename for generic use |
| `createAudioBuffer()` | `audioUtils.ts` | No changes needed |
| `pcmEncoder.worklet.ts` | `lib/audio/` | No changes needed |

### Recommended Refactoring

1. **Rename constants** for provider-agnostic naming:
   - `XAI_SAMPLE_RATE` -> `REALTIME_SAMPLE_RATE`
   - `decodeAudioFromXAI` -> `decodeRealtimeAudio`

2. **Extract shared utilities** to `audioUtils.ts`:
   - Base64 encoding/decoding
   - PCM conversion functions
   - AudioBuffer creation

---

## G.711 Considerations (OpenAI Only)

If G.711 support is needed for telephony integration:

### G.711 mu-law (u-law)
- 8-bit compressed audio
- ~64 kbps
- Lower quality than PCM16
- Common in North American telephony

### G.711 A-law
- 8-bit compressed audio
- ~64 kbps
- Common in European telephony

### Implementation Note

G.711 would require additional encoding/decoding logic not present in current codebase. Defer to future enhancement if telephony integration needed.

---

## Latency Considerations

| Factor | OpenAI | xAI |
|--------|--------|-----|
| Audio chunk size | Variable | Variable |
| Round-trip latency | ~50-150ms (same region) | ~50-150ms (same region) |
| VAD response time | Configurable via silence_duration_ms | Similar |
| Recommended chunk size | ~100ms of audio | ~100ms of audio |

---

## Summary

**OpenAI and xAI use identical audio specifications (24kHz, PCM16, mono, base64).**

The existing xAI audio infrastructure in `src/lib/audio/` can be reused entirely for OpenAI integration with minimal renaming for clarity.
