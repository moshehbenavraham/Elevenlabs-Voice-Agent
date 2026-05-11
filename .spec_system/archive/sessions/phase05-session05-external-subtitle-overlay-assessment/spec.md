# Session Specification

**Session ID**: `phase05-session05-external-subtitle-overlay-assessment`
**Phase**: 05 - Production Extensions and Media Variants
**Status**: Complete
**Created**: 2026-05-12

---

## 1. Session Overview

This session assesses whether a future external subtitle overlay companion is worth building after the browser translation MVP, production safety controls, evaluation workflow, raw-audio spike, and room/telephony architecture work. The goal is to compare the current in-app transcript and latest-caption experience against future overlay options such as in-app floating captions, a browser extension content script, an offscreen document, shadow DOM isolation, or a companion sidecar.

The work is documentation-led and must not ship a Chrome extension, cross-site overlay, content script, or runtime injection path. It should extract reusable patterns from `open-realtime-translate` and local translation UI behavior, then record privacy, CSP, permission, storage, API-key, accessibility, and compatibility constraints before making a build, defer, or reject recommendation.

This is the final planned Phase 05 session. It should leave future overlay work scoped tightly enough for a later 2-4 hour spec session if approved, while keeping the current browser translation tab as the only shipped caption and transcript surface.

---

## 2. Objectives

1. Compare current in-app captions and transcripts with external overlay architecture options.
2. Document extension/content-script, offscreen document, shadow DOM, permission, storage, and cleanup constraints.
3. Define privacy, accessibility, CSP, API-key custody, and cross-site compatibility guardrails for any future overlay.
4. Produce a clear build, defer, or reject recommendation with small future-session scope if follow-up work is justified.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session04-transcript-and-caption-experience` - Provides the current transcript panel and latest-caption behavior used for comparison.
- [x] `phase03-session05-audio-mix-and-export-controls` - Provides current transcript export and translated audio controls.
- [x] `phase04-session01-lifecycle-reliability` - Provides cleanup and provider-switch teardown expectations.
- [x] `phase04-session02-error-states-and-diagnostics` - Provides current error and diagnostics posture for translation failures.
- [x] `phase05-session01-production-safety-and-usage-controls` - Provides usage, duration, and sanitized observability constraints.
- [x] `phase05-session02-evaluation-harness-and-sample-workflow` - Provides evaluation criteria for any future overlay validation.
- [x] `phase05-session03-backend-raw-audio-bridge-spike` - Provides the future media sidecar boundary that overlays must not blur.
- [x] `phase05-session04-room-telephony-translation-architecture` - Provides future room and listener fanout posture.

### Required Tools/Knowledge

- Existing in-app translation caption and transcript behavior in `src/components/providers/OpenAITranslationLatestCaption.tsx` and `src/components/conversation/TranslationTranscriptPanel.tsx`.
- `open-realtime-translate` reference assets for content-script overlay, service worker, offscreen document, message contracts, and language constraints.
- Current privacy, CSP, and browser-visible secret posture from `.spec_system/SECURITY-COMPLIANCE.md` and `docs/SECURITY.md`.
- Existing docs validation pattern from `src/test/rawAudioBridgeDocs.test.ts` and `src/test/roomTelephonyArchitectureDocs.test.ts`.

### Environment Requirements

- Node.js and npm dependencies available for optional Vitest docs validation.
- No live OpenAI API call, browser extension build, content-script injection, or browser automation required.
- All outputs must use ASCII-only characters and Unix LF line endings.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can evaluate whether an overlay companion is worth building - create an assessment document with explicit build, defer, or reject recommendation.
- Future implementer can compare overlay options - document in-app floating captions, browser extension content script, offscreen document, shadow DOM isolation, companion sidecar, and no-build alternatives.
- Security reviewer can see key boundaries - document server-only API keys, no extension-local OpenAI key storage, no raw transcript persistence, permission minimization, and sanitized messaging.
- Operator can evaluate deployment and compatibility risk - document CSP, cross-site CSS isolation, iframe/fullscreen/video site limitations, MV3 lifecycle constraints, and browser support caveats.
- Accessibility reviewer can evaluate caption behavior - document readable sizing, contrast, keyboard controls, focus behavior, live-region expectations, reduced motion, language labels, and hide/show behavior.
- Test suite can catch documentation drift - add a focused offline docs validation test if it fits current conventions.

### Out of Scope (Deferred)

- Shipping a Chrome extension, content script, or cross-site overlay - _Reason: this session is assessment-only._
- Moving API keys into extension storage - _Reason: current OpenAI key custody is server-only._
- Changing the current in-app transcript panel or latest-caption UI - _Reason: this session compares options without runtime UI changes._
- Supporting arbitrary website injection - _Reason: cross-site compatibility, permissions, consent, and CSP need a dedicated future implementation plan._
- Persisting overlay transcripts or recordings - _Reason: the current privacy posture is session-local and export-only._

---

## 5. Technical Approach

### Architecture

Use a documentation-first assessment under `docs/ongoing-projects/external-subtitle-overlay-assessment.md`. The document should compare the shipped in-app caption path with future external overlay patterns. It should treat `open-realtime-translate` as a pattern reference for segmentation, shadow DOM isolation, offscreen WebRTC ownership, service-worker routing, and content-script messaging, not as architecture to copy into the current app.

The assessment should keep API-key custody server-side. A future extension companion would need to call this app's server or a dedicated backend broker for short-lived translation client secrets, not store raw OpenAI API keys locally. Cross-site overlay injection must also be treated as a separate product with explicit permissions, user controls, privacy text, consent, and compatibility testing.

Validation should remain offline. If a docs test is added, it should assert required sections, reference paths, architecture options, no-shipped-overlay language, API-key/privacy guardrails, accessibility constraints, and the final recommendation. It should not build an extension, launch a browser, or call provider APIs.

### Design Patterns

- Assessment document: Capture options, constraints, and recommendation without runtime scope creep.
- Privacy-first boundary: Keep secrets server-side and transcripts session-local unless a future PRD adds retention.
- Overlay isolation: Treat shadow DOM and message contracts as future compatibility tools, not current runtime code.
- Offline validation: Use Vitest only to prevent docs drift and accidental shipped-feature claims.

### Technology Stack

- Markdown documentation in `docs/ongoing-projects/`.
- Existing React 19 and TypeScript 6 translation components as comparison references.
- `open-realtime-translate` reference assets as local architecture inputs only.
- Existing Vitest 4.1.5 for optional docs validation.

---

## 6. Deliverables

### Files to Create

| File                                                                                                | Purpose                                                                                                                 | Est. Lines |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| `docs/ongoing-projects/external-subtitle-overlay-assessment.md`                                     | Assessment document comparing overlay options, constraints, accessibility, privacy, and recommendation.                 | ~300       |
| `src/test/externalSubtitleOverlayDocs.test.ts`                                                      | Offline docs validation for required sections, reference paths, not-shipped language, privacy, and accessibility rules. | ~120       |
| `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` | Records references reviewed, commands run, decisions, and final recommendation.                                         | ~80        |
| `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/security-compliance.md`  | Records security, privacy, GDPR, and residual-risk review for the assessment-only session.                              | ~90        |

### Files to Modify

| File                   | Changes                                                                                               | Est. Lines |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ---------- |
| `docs/ARCHITECTURE.md` | Add a short pointer to the external subtitle overlay assessment as future-only architecture guidance. | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] The assessment makes a clear build, defer, or reject recommendation.
- [ ] The comparison covers in-app captions, extension/content-script overlay, offscreen document, shadow DOM isolation, companion sidecar, and no-build alternatives.
- [ ] API-key and privacy boundaries remain server-side and compatible with the current app posture.
- [ ] Accessibility, permission, storage, CSP, and cross-site compatibility constraints are documented.
- [ ] Overlay patterns are documented without introducing runtime code into the default app path.
- [ ] Follow-up scope is small enough for a future 2-4 hour spec session if approved.

### Testing Requirements

- [ ] Focused docs validation test is written and passing.
- [ ] Targeted Vitest command runs successfully for the docs validation test.
- [ ] ASCII encoding checks pass for new and modified artifacts.
- [ ] Manual review confirms not-shipped language is explicit.

### Non-Functional Requirements

- [ ] No extension-local raw OpenAI API key storage is recommended.
- [ ] No raw audio, transcript text, provider payload, cookie, authorization header, SDP body, client secret, or API key is logged or persisted.
- [ ] Existing process-local rate limiting and CSP residual risks are reflected where future overlay backends or browser UI would be affected.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Documentation follows project conventions and stays within assessment-only scope.

---

## 8. Implementation Notes

### Key Considerations

- The current app already has in-app translated captions and a transcript panel. The assessment must justify any external overlay by identifying value beyond those shipped surfaces.
- `open-realtime-translate` shows useful overlay patterns: content-script rendering, shadow DOM isolation, segment trimming, offscreen WebRTC ownership, service-worker routing, and message contracts.
- The reference stores or handles API credentials differently from this app's server-only key posture. Do not copy that custody model.
- Overlay injection into arbitrary pages has higher permission, compatibility, consent, and support burden than the current in-app translation tab.

### Potential Challenges

- Scope creep into extension implementation: Mitigate with explicit no-runtime, no-content-script, and not-shipped guardrails.
- API-key custody drift: Mitigate by requiring a server or broker boundary for any future client-secret minting.
- Cross-site compatibility: Mitigate by documenting iframe, fullscreen, video player, CSP, CSS isolation, and browser permission caveats.
- Accessibility gaps: Mitigate by documenting caption sizing, contrast, keyboard control, live-region behavior, reduced motion, and hide/show controls before implementation.
- Privacy ambiguity: Mitigate by requiring future consent, retention, and deletion review before persistent overlay history or recordings.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before any future endpoint or client-secret assumptions.
- [P02] **Translation protocol separation**: Do not reuse normal OpenAI voice-agent prompt, tool, or `response.create` assumptions for overlay translation.
- [P03] **Normalized transcript rows**: Use current transcript shapes as the comparison baseline for any future overlay events.
- [P03] **Explicit in-flight guards**: Future overlay controls need duplicate start/stop prevention and stable state transitions.
- [P03] **Single-stop cleanup path**: Future extension or overlay work needs one guarded cleanup path across capture, translation, messages, timers, and UI.
- [P01] **Process-local rate limiting**: Any future overlay backend traffic needs shared-store or platform limits before multi-instance production use.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Any browser-facing overlay or companion UI must be validated before CSP tightening.

---

## 9. Testing Strategy

### Unit Tests

- Add `src/test/externalSubtitleOverlayDocs.test.ts` to read the assessment document and architecture pointer.
- Assert required sections, local reference paths, overlay architecture options, not-shipped disclaimers, API-key/privacy guardrails, accessibility constraints, and recommendation terms.
- Assert the docs do not claim that a Chrome extension, content script, cross-site overlay, or arbitrary website injection is shipped.

### Integration Tests

- None required. This session must not add runtime routes, extension files, content scripts, browser automation, or UI behavior.

### Manual Testing

- Manually review the assessment against `OpenAITranslationLatestCaption.tsx`, `TranslationTranscriptPanel.tsx`, and `open-realtime-translate` reference assets.
- Manually review `docs/ARCHITECTURE.md` to confirm the pointer describes future architecture only.

### Edge Cases

- Website uses restrictive CSP, nested iframes, fullscreen video, or aggressive z-index behavior.
- User starts and stops overlay translation repeatedly or navigates while active.
- Offscreen document, service worker, or content script loses connection mid-session.
- Captions include long text, mixed languages, right-to-left scripts, or rapid segment churn.
- User denies tab capture, revokes permissions, or selected tab has no audio.
- Future overlay accidentally persists transcripts, client secrets, or raw provider payloads.

---

## 10. Dependencies

### External Libraries

- None added. Existing Vitest dependency is used for docs validation.

### Other Sessions

- **Depends on**: `phase03-session04-transcript-and-caption-experience`, `phase03-session05-audio-mix-and-export-controls`, `phase04-session01-lifecycle-reliability`, `phase04-session02-error-states-and-diagnostics`, `phase05-session01-production-safety-and-usage-controls`, `phase05-session02-evaluation-harness-and-sample-workflow`, `phase05-session03-backend-raw-audio-bridge-spike`, `phase05-session04-room-telephony-translation-architecture`
- **Depended by**: Future overlay, browser-extension, cross-site caption, or companion-sidecar implementation sessions if approved.

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
