# Session 02: Source Capture Modes

**Session ID**: `phase03-session02-source-capture-modes`
**Status**: Complete
**Estimated Tasks**: 16-22
**Estimated Duration**: 2-4 hours

---

## Objective

Add source acquisition for microphone and browser-tab audio, including permission errors, feature detection, missing-track handling, and track-ended cleanup.

---

## Scope

### In Scope (MVP)

- Add a reusable source-capture hook or helper for translation audio input.
- Support microphone capture through `navigator.mediaDevices.getUserMedia()`.
- Support browser-tab or screen audio capture through `navigator.mediaDevices.getDisplayMedia()`.
- Detect unsupported browser APIs before prompting where possible.
- Detect browser-tab captures that do not include an audio track.
- Handle permission denial, capture cancellation, device errors, and track-ended events.
- Expose source stream, capture mode, lifecycle state, and user-facing error metadata.
- Provide cleanup that stops all source tracks and removes track event listeners.

### Out of Scope

- WebRTC translation call setup, which belongs to Session 01.
- Full provider screen layout, which belongs to Session 03.
- Transcript rendering and export behavior.
- Backend raw-audio, telephony, or room translation sources.

---

## Prerequisites

- [ ] Session 01 translation hook contract is available or its expected source-stream API is agreed.
- [ ] Browser media permission behavior has been reviewed in current target browsers.
- [ ] Existing toast/error presentation patterns are understood.

---

## Deliverables

1. Source capture hook or helper for microphone and browser-tab audio.
2. Capability detection for `getUserMedia()` and `getDisplayMedia()`.
3. Stable error mapping for unsupported APIs, permission denial, cancellation, device failure, and missing audio tracks.
4. Track-ended callback path that can stop active translation.
5. Focused tests for capture option construction and cleanup where practical.

---

## Success Criteria

- [ ] Microphone capture returns a usable audio stream when permission is granted.
- [ ] Browser-tab capture returns a usable audio stream only when an audio track is present.
- [ ] Missing browser support and permission denial produce actionable error state.
- [ ] Track-ended events trigger the expected cleanup path.
- [ ] Cleanup stops every owned source track and can be called repeatedly.
