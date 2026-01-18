# Session Specification

**Session ID**: `phase00-session01-dependencies-audio-infra`
**Phase**: 00 - Gemini Live Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session establishes the foundational infrastructure for Google Gemini Live voice integration. The work involves installing the required `@google/genai` SDK and `eventemitter3` dependencies, then building an AudioWorklet-based audio pipeline optimized for Gemini's specific requirements: 16kHz microphone capture and 24kHz audio playback.

The existing codebase has audio utilities in `src/lib/audio/` designed for xAI's 24kHz-only format. Gemini Live requires a dual-sample-rate pipeline (16kHz input, 24kHz output) with different buffer management. Rather than modifying shared utilities that other providers depend on, this session creates Gemini-specific modules in `src/lib/gemini/` following the established provider isolation pattern.

This session is the critical first step for Phase 00. Without the audio infrastructure, the GenAI WebSocket client (Session 02) cannot send or receive audio data, and all subsequent sessions would be blocked.

---

## 2. Objectives

1. Install `@google/genai` SDK (^1.34.0) and `eventemitter3` (^5.0.1) dependencies
2. Implement a Gemini-specific AudioWorklet processor for 16kHz microphone capture with Float32-to-Int16 conversion
3. Create an audio recorder module for microphone initialization and streaming at 16kHz
4. Create an audio streamer module for playback scheduling at 24kHz with GainNode volume control
5. Implement PCM encoding/decoding utilities (`float32ToBase64PCM`, `base64PCMToFloat32`) for Gemini format
6. Add comprehensive unit tests for all audio utility functions

---

## 3. Prerequisites

### Required Sessions

- [x] None - First session in phase

### Required Tools/Knowledge

- Understanding of Web Audio API and AudioWorklet architecture
- PCM audio encoding (16-bit signed little-endian)
- Base64 encoding/decoding for WebSocket transport

### Environment Requirements

- Node.js 18+ with npm/bun package manager
- Modern browser with AudioWorklet support (Chrome 64+, Firefox 76+, Safari 14.1+)
- Existing project builds without errors (`npm run build`)

---

## 4. Scope

### In Scope (MVP)

- Dependency installation with lockfile update
- Gemini-specific AudioWorklet processor at `src/lib/worklets/gemini-audio-worklet.ts`
- Audio recorder module at `src/lib/gemini/audio-recorder.ts` (16kHz capture)
- Audio streamer module at `src/lib/gemini/audio-streamer.ts` (24kHz playback)
- PCM utilities at `src/lib/gemini/audioUtils.ts`
- Unit tests for encoding/decoding functions
- `.env.example` already includes Gemini variables (verified)

### Out of Scope (Deferred)

- GenAI WebSocket client - _Reason: Session 02 scope_
- React hook and context - _Reason: Session 03 scope_
- Provider UI component - _Reason: Session 04 scope_
- E2E tests - _Reason: Session 05 scope_
- Modification of existing `src/lib/audio/` utilities - _Reason: Provider isolation pattern_

---

## 5. Technical Approach

### Architecture

```
src/lib/
  worklets/
    gemini-audio-worklet.ts  # AudioWorkletProcessor for 16kHz capture
  gemini/
    audio-recorder.ts         # Microphone init, AudioContext 16kHz
    audio-streamer.ts         # Playback queue, GainNode, 24kHz
    audioUtils.ts             # PCM encoding/decoding for Gemini
    __tests__/
      audioUtils.test.ts      # Unit tests
```

The audio pipeline follows Web Audio API best practices:

1. **Capture**: AudioWorklet runs in separate thread, never blocks main thread
2. **Encoding**: Float32 samples converted to Int16 PCM, base64 encoded for WebSocket
3. **Decoding**: Base64 decoded, Int16 PCM converted to Float32 for playback
4. **Playback**: AudioBufferSourceNode scheduled with precise timing via GainNode

### Design Patterns

- **AudioWorklet**: Non-blocking audio processing (CONVENTIONS.md requirement)
- **EventEmitter**: Loose coupling between audio modules and React components
- **Separation of concerns**: Capture and playback in separate modules
- **Provider isolation**: Gemini-specific code in `src/lib/gemini/` directory

### Technology Stack

- Web Audio API (AudioContext, AudioWorklet, GainNode, AudioBufferSourceNode)
- TypeScript strict mode
- `@google/genai` ^1.34.0 (SDK for Gemini API)
- `eventemitter3` ^5.0.1 (typed event emitter)

---

## 6. Deliverables

### Files to Create

| File                                          | Purpose                                  | Est. Lines |
| --------------------------------------------- | ---------------------------------------- | ---------- |
| `src/lib/worklets/gemini-audio-worklet.ts`    | AudioWorklet processor for 16kHz capture | ~80        |
| `src/lib/gemini/audio-recorder.ts`            | Microphone initialization and streaming  | ~120       |
| `src/lib/gemini/audio-streamer.ts`            | Playback scheduling with volume control  | ~150       |
| `src/lib/gemini/audioUtils.ts`                | PCM encoding/decoding utilities          | ~80        |
| `src/lib/gemini/__tests__/audioUtils.test.ts` | Unit tests for audio utilities           | ~100       |

### Files to Modify

| File           | Changes                                       | Est. Lines |
| -------------- | --------------------------------------------- | ---------- |
| `package.json` | Add @google/genai, eventemitter3 dependencies | ~3         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `@google/genai` ^1.34.0 installed and importable
- [ ] `eventemitter3` ^5.0.1 installed and importable
- [ ] AudioWorklet registers with name `gemini-audio-processor`
- [ ] Microphone capture produces 16kHz Int16 PCM data
- [ ] Audio playback handles 24kHz PCM with adjustable volume (0.0-1.0)
- [ ] `float32ToBase64PCM` correctly encodes audio samples
- [ ] `base64PCMToFloat32` correctly decodes audio data
- [ ] Round-trip encoding/decoding preserves audio fidelity

### Testing Requirements

- [ ] Unit tests for `float32ToBase64PCM` with edge cases
- [ ] Unit tests for `base64PCMToFloat32` with edge cases
- [ ] Unit tests for sample clamping and overflow handling
- [ ] All tests pass with `npm run test:run`

### Quality Gates

- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] All files use ASCII-only characters (0-127)
- [ ] Unix LF line endings throughout
- [ ] Code follows CONVENTIONS.md patterns

---

## 8. Implementation Notes

### Key Considerations

- AudioWorklet modules must be loaded via URL, not ES import (Vite handles via `new URL()`)
- Safari requires user gesture before AudioContext can start
- 16kHz sample rate may need AudioContext constraints on some systems
- GainNode.gain.setValueAtTime() for click-free volume changes

### Potential Challenges

- **AudioWorklet browser support**: Safari 14.1+ required; consider graceful degradation message
- **16kHz AudioContext**: Some devices may not support exactly 16kHz; validate at creation time
- **Worklet registration timing**: Must await `addModule()` before creating AudioWorkletNode

### Relevant Considerations

- [P00] **API Key Security**: GEMINI*API_KEY is backend-only (no VITE* prefix) per CONSIDERATIONS.md
- [P00] **Provider Pattern**: Files placed in `src/lib/gemini/` following established structure
- [P00] **AudioWorklet requirement**: CONVENTIONS.md mandates AudioWorklet over ScriptProcessorNode

### ASCII Reminder

All output files must use ASCII-only characters (0-127). Avoid curly quotes, em-dashes, or other Unicode characters in strings and comments.

---

## 9. Testing Strategy

### Unit Tests

- `float32ToBase64PCM`: Normal samples, silence, max amplitude, clamping
- `base64PCMToFloat32`: Valid input, empty string, malformed base64
- Round-trip: Encode then decode preserves values within tolerance

### Integration Tests

- Deferred to Session 05 (E2E testing)

### Manual Testing

- Verify `npm install` adds dependencies to node_modules
- Verify `npm run build` succeeds after adding new modules
- Verify no console errors when importing new modules

### Edge Cases

- Empty audio buffers (zero-length arrays)
- Single-sample buffers
- Maximum amplitude samples (+1.0, -1.0)
- Samples exceeding range (should clamp)

---

## 10. Dependencies

### External Libraries

- `@google/genai`: ^1.34.0 (new dependency)
- `eventemitter3`: ^5.0.1 (new dependency)

### Other Sessions

- **Depends on**: None
- **Depended by**: Session 02 (GenAI Client), Session 03 (Voice Hook/Context)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
