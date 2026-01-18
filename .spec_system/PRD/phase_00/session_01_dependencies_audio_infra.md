# Session 01: Dependencies & Audio Infrastructure

**Session ID**: `phase00-session01-dependencies-audio-infra`
**Status**: Not Started
**Estimated Tasks**: ~15
**Estimated Duration**: 2-4 hours

---

## Objective

Install required dependencies and implement the AudioWorklet-based audio pipeline for 16kHz microphone capture and 24kHz audio playback with proper buffering and volume control.

---

## Scope

### In Scope (MVP)

- Install @google/genai ^1.34.0 dependency
- Install eventemitter3 ^5.0.1 dependency
- Create AudioWorklet processor for microphone capture (Float32 to Int16 conversion)
- Create audio-recorder.ts for microphone initialization at 16kHz
- Create audio-streamer.ts for playback scheduling at 24kHz with GainNode
- Create audioUtils.ts for PCM encoding/decoding (float32ToBase64PCM, base64PCMToFloat32)
- Add environment variables to .env.example (VITE_GEMINI_ENABLED, VITE_GEMINI_VOICE, GEMINI_API_KEY)
- Unit tests for audio utility functions

### Out of Scope

- WebSocket client implementation (Session 02)
- React hook and context (Session 03)
- Provider component (Session 04)
- E2E tests (Session 05)

---

## Prerequisites

- [ ] Node.js and npm/bun available
- [ ] Existing project builds without errors

---

## Deliverables

1. Updated package.json with new dependencies
2. `src/lib/worklets/audio-processing-worklet.ts` - AudioWorklet processor
3. `src/lib/audio/audio-recorder.ts` - Microphone capture at 16kHz
4. `src/lib/audio/audio-streamer.ts` - Playback with GainNode at 24kHz
5. `src/lib/gemini/audioUtils.ts` - PCM encoding/decoding utilities
6. Updated `.env.example` with Gemini environment variables
7. Unit tests for audio utilities

---

## Success Criteria

- [ ] Dependencies installed and lockfile updated
- [ ] AudioWorklet registers and processes audio without errors
- [ ] Microphone capture produces valid 16kHz PCM data
- [ ] Audio playback handles 24kHz PCM with volume control
- [ ] float32ToBase64PCM correctly encodes audio data
- [ ] base64PCMToFloat32 correctly decodes audio data
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] Unit tests pass for audio utilities
