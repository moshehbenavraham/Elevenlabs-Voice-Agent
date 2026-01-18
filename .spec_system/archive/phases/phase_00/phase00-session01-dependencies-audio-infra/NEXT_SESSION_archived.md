# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 00 - Gemini Live Integration
**Completed Sessions**: 0

---

## Recommended Next Session

**Session ID**: `phase00-session01-dependencies-audio-infra`
**Session Name**: Dependencies & Audio Infrastructure
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: ~15

---

## Why This Session Next?

### Prerequisites Met

- [x] Node.js and npm/bun available
- [x] Existing project builds without errors

### Dependencies

- **Builds on**: None (first session in phase)
- **Enables**: Session 02 (GenAI Client & Backend) - requires audio utilities for WebSocket audio streaming

### Project Progression

This is the natural starting point for Phase 00 (Gemini Live Integration). The audio infrastructure must be in place before the WebSocket client can send/receive audio data. The session establishes:

1. **Dependencies**: @google/genai SDK and eventemitter3 are required by all subsequent sessions
2. **Audio Pipeline**: The AudioWorklet-based capture and playback system is a prerequisite for real-time voice interaction
3. **Encoding Utilities**: PCM encoding/decoding functions are needed by the GenAILiveClient in Session 02

Without this foundational work, no other session can proceed.

---

## Session Overview

### Objective

Install required dependencies and implement the AudioWorklet-based audio pipeline for 16kHz microphone capture and 24kHz audio playback with proper buffering and volume control.

### Key Deliverables

1. Updated package.json with @google/genai ^1.34.0 and eventemitter3 ^5.0.1
2. AudioWorklet processor for non-blocking audio capture (Float32 to Int16)
3. Audio recorder module for microphone initialization at 16kHz
4. Audio streamer module for playback scheduling at 24kHz with GainNode
5. PCM encoding/decoding utilities (float32ToBase64PCM, base64PCMToFloat32)
6. Updated .env.example with Gemini environment variables
7. Unit tests for audio utility functions

### Scope Summary

- **In Scope (MVP)**: Dependency installation, AudioWorklet processor, audio-recorder.ts, audio-streamer.ts, audioUtils.ts, environment variable templates, unit tests
- **Out of Scope**: WebSocket client (Session 02), React hook/context (Session 03), Provider component (Session 04), E2E tests (Session 05)

---

## Technical Considerations

### Technologies/Patterns

- AudioWorklet API for non-blocking audio processing
- Web Audio API with custom sample rates (16kHz, 24kHz)
- PCM16 encoding (little-endian, base64 for WebSocket)
- GainNode for volume control with smooth transitions
- TypeScript strict mode for all new modules

### Potential Challenges

- **AudioWorklet browser support**: Safari may require polyfills or user gesture handling
- **Sample rate support**: Verify 16kHz/24kHz AudioContext support across browsers
- **Worklet registration**: AudioWorklet modules must be loaded via URL, not import

### Relevant Considerations

- [P##] **API Key Security**: Ensure GEMINI*API_KEY is added as backend-only variable (not VITE* prefixed)
- [P##] **Provider Pattern**: Audio utilities should be placed in `src/lib/gemini/` to match existing provider structure

---

## Alternative Sessions

If this session is blocked:

1. **phase00-session02-genai-client-backend** - Could stub audio utilities, but creates technical debt
2. **N/A** - No other sessions are viable without dependencies installed

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
