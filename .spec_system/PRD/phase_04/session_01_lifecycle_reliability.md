# Session 01: Lifecycle Reliability

**Session ID**: `phase04-session01-lifecycle-reliability`
**Status**: Complete
**Estimated Tasks**: 16-22
**Estimated Duration**: 2-4 hours

---

## Objective

Harden translation start, stop, tab switching, abort handling, track cleanup, peer-connection cleanup, and duplicate-start protection so translation teardown is deterministic.

---

## Scope

### In Scope (MVP)

- Audit the Phase 03 translation lifecycle for duplicate cleanup paths and missing guards.
- Harden manual stop, auto-stop, failed-start, unmount, provider-switch, and source-ended cleanup.
- Ensure peer connections, data channels, media senders, source tracks, remote streams, audio elements, abort controllers, timers, and listeners are closed or detached exactly once.
- Preserve user-visible state transitions during cleanup and failed starts.
- Add focused regression coverage for cleanup-sensitive helpers or hook behavior where local test patterns allow.

### Out of Scope

- New UI diagnostic taxonomy, which belongs to Session 02.
- Broad unit, integration, or E2E expansion, which belongs to Sessions 03 and 04.
- Documentation updates beyond implementation notes, which belong to Session 05.

---

## Prerequisites

- [x] Phase 03 translation hook, source capture hook, provider UI, audio mix, and export controls are present.
- [x] Current provider-switch cleanup behavior is understood.
- [x] Official OpenAI realtime translation docs are re-checked if endpoint, SDP, or event contracts are touched.

---

## Deliverables

1. Hardened translation lifecycle cleanup around start, stop, failed-start, provider switching, and unmount.
2. Duplicate-start and duplicate-stop guards that preserve stable UI state.
3. Cleanup-sensitive regression tests or testable helper coverage.
4. Implementation notes identifying any lifecycle risks deferred to later sessions.

---

## Success Criteria

- [x] Calling start while a start is pending or active cannot create competing translation sessions.
- [x] Calling stop more than once is safe and does not leak browser media or WebRTC resources.
- [x] Provider switching and source-ended events use the same guarded cleanup path as manual stop.
- [x] Failed token, capture, SDP, or peer-connection starts leave the app ready for a later retry.
- [x] Existing provider behavior outside the translation tab is not regressed.
