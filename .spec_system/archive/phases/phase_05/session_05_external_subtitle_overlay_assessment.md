# Session 05: External Subtitle Overlay Assessment

**Session ID**: `phase05-session05-external-subtitle-overlay-assessment`
**Status**: Complete
**Estimated Tasks**: 12-16
**Estimated Duration**: 2-4 hours

---

## Objective

Assess whether a future browser-extension or external subtitle overlay companion is worth building, and document reusable overlay patterns without adding a cross-site overlay to the current app.

---

## Scope

### In Scope (MVP)

- Review browser-extension subtitle overlay references for segmentation, positioning, isolation, and cleanup patterns.
- Document overlay architecture options such as in-app captions, companion extension, content script, offscreen document, and shadow DOM isolation.
- Identify browser permission, capture, storage, and API-key boundary constraints.
- Compare overlay value against the existing in-app transcript and latest-subtitle experience.
- Capture accessibility, privacy, CSP, and cross-site compatibility concerns.
- Recommend whether to build, defer, or reject an overlay companion in a future phase.

### Out of Scope

- Shipping a Chrome extension, content script, or cross-site overlay.
- Moving API keys into extension storage.
- Changing the current in-app transcript panel or latest-subtitle UI unless needed for documentation screenshots or references.
- Supporting arbitrary website injection in this phase.

---

## Prerequisites

- [ ] Phase 03 and Phase 04 transcript and caption behavior is understood.
- [ ] `open-realtime-translate` reference assets are reviewed as patterns, not as direct architecture.
- [ ] Current privacy and CSP posture is reviewed before making overlay recommendations.

---

## Deliverables

1. External subtitle overlay assessment document.
2. Comparison of in-app captions versus extension/content-script overlay approaches.
3. Security, privacy, permission, and accessibility constraints for a future overlay.
4. Recommendation and scoped next steps for any later overlay implementation.

---

## Success Criteria

- [ ] The assessment makes a clear build, defer, or reject recommendation.
- [ ] API-key and privacy boundaries remain server-side and compatible with the current app posture.
- [ ] Overlay patterns are documented without introducing runtime code into the default app path.
- [ ] Follow-up scope is small enough for a future 2-4 hour spec session if approved.
