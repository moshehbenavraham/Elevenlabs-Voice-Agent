# Session 02: Error States and Diagnostics

**Session ID**: `phase04-session02-error-states-and-diagnostics`
**Status**: Complete
**Estimated Tasks**: 14-20
**Estimated Duration**: 2-4 hours

---

## Objective

Add actionable user-facing diagnostics for unsupported browser APIs, token failures, SDP failures, WebRTC connection failures, and missing audio tracks.

---

## Scope

### In Scope (MVP)

- Normalize translation error categories across source capture, token creation, SDP exchange, peer-connection setup, data-channel events, and media playback.
- Improve user-facing messages for unsupported `getUserMedia()`, unsupported `getDisplayMedia()`, permission denial, and missing tab-audio tracks.
- Map backend translation token failures to stable frontend states without exposing provider payloads or secrets.
- Surface WebRTC and SDP failure details at the right level for demo debugging.
- Keep diagnostic copy concise and accessible in the existing translation provider UI.

### Out of Scope

- External observability integrations or telemetry exports.
- Production safety identifiers or usage controls, which belong to Phase 05.
- Large layout redesign of the translation tab.

---

## Prerequisites

- [ ] Session 01 lifecycle hardening is complete or its cleanup contracts are understood.
- [ ] Existing server route error mapping is reviewed before changing client diagnostics.
- [ ] Current security posture is reviewed before exposing any additional error detail.

---

## Deliverables

1. Stable translation diagnostic categories and error mapping.
2. User-facing messages for browser support, permission, media-track, token, SDP, WebRTC, and playback failures.
3. UI states that make retry and stop behavior clear.
4. Focused tests for error mapping where local patterns support it.

---

## Success Criteria

- [ ] Unsupported microphone and tab-audio APIs produce distinct actionable messages.
- [ ] Permission denial and no-audio-track cases are distinguishable.
- [ ] Token and SDP failures do not leak raw upstream provider responses.
- [ ] WebRTC connection failures leave the session stopped or retryable.
- [ ] Error states are keyboard and screen-reader accessible in the existing UI.
