# Task Checklist

**Session ID**: `phase00-session01-dependencies-audio-infra`
**Total Tasks**: 20
**Created**: 2026-01-18

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0001]` = Session reference (Phase 00, Session 01)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0001] Verify project builds without errors (`npm run build`)
- [x] T002 [S0001] Install `@google/genai` ^1.34.0 and `eventemitter3` ^5.0.1 (`package.json`)
- [x] T003 [S0001] Create directory structure: `src/lib/gemini/`, `src/lib/gemini/__tests__/`, `src/lib/worklets/`

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0001] [P] Define TypeScript types for audio recorder events and config (`src/lib/gemini/audio-recorder.ts`)
- [x] T005 [S0001] [P] Define TypeScript types for audio streamer events and config (`src/lib/gemini/audio-streamer.ts`)
- [x] T006 [S0001] [P] Define TypeScript types for PCM utility functions (`src/lib/gemini/audioUtils.ts`)
- [x] T007 [S0001] Create AudioWorklet processor message types (`src/lib/worklets/gemini-audio-worklet.ts`)
- [x] T008 [S0001] Implement PCM encoding function `float32ToBase64PCM` (`src/lib/gemini/audioUtils.ts`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0001] Implement PCM decoding function `base64PCMToFloat32` (`src/lib/gemini/audioUtils.ts`)
- [x] T010 [S0001] Implement AudioWorkletProcessor with 16kHz capture and Float32-to-Int16 conversion (`src/lib/worklets/gemini-audio-worklet.ts`)
- [x] T011 [S0001] Implement GeminiAudioRecorder class constructor and initialization (`src/lib/gemini/audio-recorder.ts`)
- [x] T012 [S0001] Implement GeminiAudioRecorder.start() with microphone access and worklet registration (`src/lib/gemini/audio-recorder.ts`)
- [x] T013 [S0001] Implement GeminiAudioRecorder.stop() and cleanup methods (`src/lib/gemini/audio-recorder.ts`)
- [x] T014 [S0001] Implement GeminiAudioStreamer class constructor with 24kHz AudioContext (`src/lib/gemini/audio-streamer.ts`)
- [x] T015 [S0001] Implement GeminiAudioStreamer.addPCM() playback queue and scheduling (`src/lib/gemini/audio-streamer.ts`)
- [x] T016 [S0001] Implement GeminiAudioStreamer volume control, stop(), and cleanup methods (`src/lib/gemini/audio-streamer.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0001] [P] Write unit tests for `float32ToBase64PCM` with edge cases (`src/lib/gemini/__tests__/audioUtils.test.ts`)
- [x] T018 [S0001] [P] Write unit tests for `base64PCMToFloat32` with edge cases (`src/lib/gemini/__tests__/audioUtils.test.ts`)
- [x] T019 [S0001] Write round-trip encoding/decoding tests (`src/lib/gemini/__tests__/audioUtils.test.ts`)
- [x] T020 [S0001] Run full test suite, build, and lint validation (`npm run test:run && npm run build && npm run lint`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing (`npm run test:run`)
- [x] Build succeeds (`npm run build`)
- [x] ESLint passes (`npm run lint`)
- [x] All files ASCII-encoded (0-127 only)
- [x] `implementation-notes.md` updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T004, T005, T006 can be worked on simultaneously (type definitions).
Tasks T017, T018 can be worked on simultaneously (independent test suites).

### Dependencies

- T002 must complete before any other tasks (installs required packages)
- T003 must complete before T004-T016 (creates directories)
- T007, T008 must complete before T010-T016 (provides types and encoding)
- T008, T009 must complete before T017-T019 (functions to test)
- T010-T016 must complete before T020 (code must exist for build)

### Technical Notes

- AudioWorklet requires Vite `new URL()` pattern for module loading
- 16kHz capture may need fallback to closest supported sample rate
- Safari requires user gesture before AudioContext initialization
- GainNode.gain.setValueAtTime() prevents audio clicks on volume change

### File Locations

| File                                          | Purpose                         |
| --------------------------------------------- | ------------------------------- |
| `src/lib/worklets/gemini-audio-worklet.ts`    | AudioWorklet processor (16kHz)  |
| `src/lib/gemini/audio-recorder.ts`            | Microphone capture module       |
| `src/lib/gemini/audio-streamer.ts`            | Playback scheduling module      |
| `src/lib/gemini/audioUtils.ts`                | PCM encoding/decoding utilities |
| `src/lib/gemini/__tests__/audioUtils.test.ts` | Unit tests                      |

---

## Next Steps

Run `/validate` to verify session completeness.
