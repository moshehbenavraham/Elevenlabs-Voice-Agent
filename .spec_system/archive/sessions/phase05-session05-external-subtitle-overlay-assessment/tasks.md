# Task Checklist

**Session ID**: `phase05-session05-external-subtitle-overlay-assessment`
**Total Tasks**: 16
**Estimated Duration**: 2.5-3.5 hours
**Created**: 2026-05-12

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[SNNMM]` = Session reference (NN=phase number, MM=session number)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 4      | 4      | 0         |
| Implementation | 6      | 6      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **16** | **16** | **0**     |

---

## Setup (3 tasks)

Initial reference review and session scaffolding.

- [x] T001 [S0505] Review current in-app translation captions, transcript panel, export behavior, and provider cleanup constraints (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T002 [S0505] Review `open-realtime-translate` content script, service worker, offscreen document, message contract, and language references as patterns only (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T003 [S0505] Create external subtitle overlay assessment structure with explicit no-extension, no-content-script, and not-shipped scope (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)

---

## Foundation (4 tasks)

Core comparison models and boundaries.

- [x] T004 [S0505] Document current in-app caption and transcript baseline, including source/translated rows, latest caption, export, clear, accessibility, and cleanup behavior (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T005 [S0505] Compare overlay architecture options: in-app floating captions, extension content script, offscreen document, shadow DOM isolation, companion sidecar, and no-build alternatives (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T006 [S0505] Define API-key custody, client-secret minting, message routing, permission, storage, and server-boundary constraints for future overlay designs (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T007 [S0505] Define accessibility and UX constraints for caption sizing, contrast, keyboard controls, live regions, reduced motion, language labels, and hide/show behavior (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)

---

## Implementation (6 tasks)

Assessment content, risk posture, and recommendation.

- [x] T008 [S0505] Document privacy, consent, retention, transcript persistence, local-only review, and no-raw-payload guardrails for future overlay work (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T009 [S0505] Document cross-site compatibility risks for CSP, iframes, fullscreen video, z-index conflicts, CSS isolation, navigation, and unsupported browser APIs (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T010 [S0505] Document overlay lifecycle and cleanup states for capture, offscreen document, service worker, content script, timers, transcript segments, and translated audio playback (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T011 [S0505] Compare overlay value against the existing in-app transcript and latest-caption experience, including when an overlay is not worth building (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T012 [S0505] Add build, defer, or reject recommendation with future implementation prerequisites, a 2-4 hour follow-up scope, and unproven assumptions (`docs/ongoing-projects/external-subtitle-overlay-assessment.md`)
- [x] T013 [S0505] [P] Add architecture document pointer that labels external subtitle overlays as future-only architecture guidance (`docs/ARCHITECTURE.md`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T014 [S0505] [P] Add docs validation test for required sections, reference paths, overlay options, not-shipped disclaimers, privacy guardrails, accessibility constraints, and recommendation terms (`src/test/externalSubtitleOverlayDocs.test.ts`)
- [x] T015 [S0505] Run targeted Vitest validation and ASCII checks for the overlay assessment artifacts, recording commands and results (`.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md`)
- [x] T016 [S0505] Update implementation notes and security compliance with references reviewed, commands run, privacy review, GDPR posture, residual risks, and no-runtime-change confirmation (`.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/security-compliance.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] security-compliance.md updated
- [x] Ready for the validate workflow step

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
