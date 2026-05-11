# Session 01: Reusable WebRTC Translation Hook

**Session ID**: `phase03-session01-reusable-webrtc-translation-hook`
**Status**: Complete
**Estimated Tasks**: 18-24
**Estimated Duration**: 2-4 hours

---

## Objective

Implement `useOpenAITranslation` around browser WebRTC translation calls, translated audio playback, data-channel events, transcript deltas, status state, and cleanup.

---

## Scope

### In Scope (MVP)

- Create a reusable translation runtime hook for `gpt-realtime-translate`.
- Request browser client-secret data through the existing server route.
- Create and manage an `RTCPeerConnection` for translation calls.
- Exchange SDP with `/v1/realtime/translations/calls`.
- Attach caller-provided source audio tracks to the peer connection.
- Receive translated audio as a remote media stream.
- Create and parse the `oai-events` data channel for session and transcript events.
- Expose lifecycle state, errors, transcript deltas, remote audio stream, start, and stop APIs.
- Clean up peer connections, data channels, senders, abort controllers, source tracks, remote streams, and event listeners.

### Out of Scope

- Microphone and browser-tab media acquisition, which belongs to Session 02.
- Full translation provider UI, which belongs to Session 03.
- Transcript panel presentation, which belongs to Session 04.
- Audio mix sliders, export controls, and max-session timer polish, which belong to Session 05.

---

## Prerequisites

- [x] Phase 02 translation route and shared config are complete.
- [x] Existing frontend API base URL conventions are understood.
- [x] Official OpenAI realtime translation docs have been checked for current SDP, call, and event contracts.

---

## Deliverables

1. `useOpenAITranslation` hook with start, stop, status, errors, translated audio, and transcript state.
2. WebRTC call setup and SDP exchange against the dedicated translations endpoint.
3. Data-channel event parsing for translated and source transcript deltas where available.
4. Cleanup logic that is safe to call repeatedly.
5. Focused unit tests or testable helper coverage for event parsing and cleanup-sensitive behavior.

---

## Success Criteria

- [x] Hook starts a translation call from an existing source media stream.
- [x] Hook exposes translated remote audio stream state.
- [x] Hook parses recognized transcript events without throwing on unknown events.
- [x] Hook maps token, SDP, WebRTC, and cleanup failures to stable error state.
- [x] Calling stop more than once does not leak tracks, peer connections, data channels, abort controllers, or event listeners.
