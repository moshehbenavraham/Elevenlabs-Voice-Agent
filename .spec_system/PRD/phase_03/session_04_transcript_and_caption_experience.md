# Session 04: Transcript and Caption Experience

**Session ID**: `phase03-session04-transcript-and-caption-experience`
**Status**: Not Started
**Estimated Tasks**: 14-20
**Estimated Duration**: 2-4 hours

---

## Objective

Add source and translated transcript state, latest-subtitle rendering, clear controls, and stable transcript panel behavior for the translation tab.

---

## Scope

### In Scope (MVP)

- Normalize source and translated transcript events into stable UI state.
- Render the latest translated caption prominently without layout shifts.
- Render a scrollable transcript panel with source and translated entries.
- Add clear controls for current transcript state.
- Preserve transcript state while a session is active unless the user clears it.
- Handle partial and final deltas without duplicating visible transcript lines.
- Add empty, active, and no-transcript states.

### Out of Scope

- Markdown transcript export, which belongs to Session 05.
- Advanced diagnostics and E2E coverage, which belong to Phase 04.
- Persistent transcript storage or account-scoped transcript history.
- Browser-extension overlay or cross-site subtitle companion behavior.

---

## Prerequisites

- [ ] Session 01 exposes transcript event state or testable parser helpers.
- [ ] Session 03 translation provider screen is in place.
- [ ] Existing conversation/transcript component patterns are understood.

---

## Deliverables

1. Translation transcript panel component or equivalent provider-screen section.
2. Latest-caption rendering for translated output.
3. Source and translated transcript line normalization.
4. Clear transcript controls.
5. Focused tests for transcript parsing or rendering behavior where practical.

---

## Success Criteria

- [ ] Latest translated caption remains readable and does not overlap controls.
- [ ] Transcript panel displays source and translated lines in a stable order.
- [ ] Partial and final transcript updates do not create duplicate final lines.
- [ ] Clear controls reset current transcript UI state without breaking an active session.
- [ ] Empty and no-transcript states are understandable and keyboard-accessible.
