# Session 05: Audio Mix and Export Controls

**Session ID**: `phase03-session05-audio-mix-and-export-controls`
**Status**: Not Started
**Estimated Tasks**: 14-20
**Estimated Duration**: 2-4 hours

---

## Objective

Add original/translated audio mix controls, transcript Markdown export, elapsed time, and the default 30-minute max-session guard for the translation MVP.

---

## Scope

### In Scope (MVP)

- Add original and translated audio volume controls for browser-tab translation.
- Clamp audio mix values through the Phase 02 helper contract.
- Keep microphone mode controls simple and avoid irrelevant original-audio controls.
- Add elapsed-time display for active translation sessions.
- Enforce the default max-session guard and stop translation when the limit is reached.
- Respect environment-based reduction for test/demo cost control where already configured.
- Add Markdown export for current source and translated transcript lines.
- Add user-facing state for export-disabled and auto-stop conditions.

### Out of Scope

- Stronger production usage controls and safety identifiers, which belong to Phase 05.
- Evaluation harness and golden-script workflow, which belong to Phase 05.
- Browser-extension subtitle overlay export.
- Persistent transcript storage.

---

## Prerequisites

- [ ] Session 03 provider UI is in place.
- [ ] Session 04 transcript state is available for export.
- [ ] Phase 02 audio mix helpers and max-session configuration contracts are understood.

---

## Deliverables

1. Original and translated audio mix controls for browser-tab translation.
2. Elapsed-time display and max-session auto-stop behavior.
3. Markdown transcript export for the current session.
4. Disabled and auto-stop UI states.
5. Focused tests for mix clamping, export formatting, and timer boundaries where practical.

---

## Success Criteria

- [ ] Audio mix controls clamp values and update relevant audio elements without layout shifts.
- [ ] Browser-tab translation can balance original and translated audio.
- [ ] Microphone translation does not show irrelevant original-audio controls.
- [ ] Elapsed time updates while active and resets predictably after cleanup.
- [ ] Session automatically stops at the configured default max duration.
- [ ] Transcript Markdown export includes session metadata and current transcript lines.
