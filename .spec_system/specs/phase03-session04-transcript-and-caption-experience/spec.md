# Session Specification

**Session ID**: `phase03-session04-transcript-and-caption-experience`
**Phase**: 03 - Browser Translation MVP
**Status**: Complete
**Completed**: 2026-05-11
**Created**: 2026-05-11

---

## 1. Session Overview

This session adds the transcript and caption experience for the OpenAI Translation tab. Phase 03 Session 01 already delivers transcript events from the `oai-events` data channel through `useOpenAITranslation`, and Session 03 already renders the usable translation provider screen. This work turns that raw transcript state into a stable user-facing caption and transcript panel.

The session focuses on in-memory source and translated transcript state for the current translation session. Users should see the latest translated caption prominently, inspect source and translated lines in a scrollable panel, and clear the current transcript without interrupting an active WebRTC translation session.

The result prepares Session 05 to add Markdown export and media controls. Persistent transcript history, browser-extension overlays, advanced diagnostics, and broad E2E hardening remain deferred to later phases.

---

## 2. Objectives

1. Render a stable latest translated caption that remains readable during active translation.
2. Render source and translated transcript entries in a scrollable, accessible panel without duplicate final lines.
3. Add clear transcript controls that reset current transcript UI state without stopping an active translation session.
4. Cover transcript normalization, hook clearing behavior, and provider rendering with focused tests.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides `useOpenAITranslation`, transcript event parsing, transcript state, runtime status, and WebRTC cleanup.
- [x] `phase03-session02-source-capture-modes` - Provides microphone and browser-tab source lifecycle state used by the active translation view.
- [x] `phase03-session03-translation-tab-ui-mvp` - Provides the translation provider screen, start/stop controls, translated audio playback, and provider-switch cleanup.
- [x] `phase02-session02-shared-translation-config-library` - Provides shared translation helper and test patterns under `src/lib/openaiTranslation.ts`.

### Required Tools/Knowledge

- React 19 hooks, refs, effects, and component composition.
- TypeScript 6 strict typing for hook return types and transcript helpers.
- Existing conversation panel accessibility patterns, especially `role="log"` and polite live regions.
- Existing Vitest and React Testing Library hook/component mocking patterns.

### Environment Requirements

- Node.js and npm dependencies installed.
- Tests must use mocked media, WebRTC, data-channel events, and hook state.
- No real OpenAI, browser media, or network request should run in unit tests.

---

## 4. Scope

### In Scope (MVP)

- Translation demo user can see the latest translated caption - Render a fixed-height caption surface derived from translated transcript entries.
- Translation demo user can inspect transcript history - Render source and translated entries with stable ordering, final/partial state, and readable labels.
- Translation demo user can clear current transcript state - Add a keyboard-accessible clear control with confirmation and state reset while preserving an active runtime.
- Maintainer can rely on transcript normalization - Reuse and strengthen existing parser helpers so partial and final updates replace or update the same visible line instead of duplicating it.
- Maintainer can verify behavior - Add focused tests for parser normalization, hook clear behavior, provider rendering, empty states, active states, and clear controls.

### Out of Scope (Deferred)

- Markdown transcript export - _Reason: Session 05 owns transcript export._
- Original and translated audio mix controls - _Reason: Session 05 owns audio mix._
- Elapsed time and max-session auto-stop - _Reason: Session 05 owns session-duration guardrails._
- Advanced diagnostics and E2E coverage - _Reason: Phase 04 owns hardening and demo readiness._
- Persistent transcript storage or account-scoped transcript history - _Reason: Explicitly deferred by the PRD._
- Browser-extension overlay or cross-site subtitle companion behavior - _Reason: Explicitly deferred by the session stub and master PRD._

---

## 5. Technical Approach

### Architecture

Keep WebRTC and data-channel parsing inside the existing translation runtime hook and shared helper module. `useOpenAITranslation` should expose transcript state plus a clear action that only clears in-memory transcript entries. It must not stop peer connections, source streams, data channels, translated audio, or abort controllers.

`OpenAITranslationProvider` should compose two new presentation surfaces: a latest-caption component and a transcript panel. The latest-caption component should consume the latest translated entry and render a stable, fixed-height area that does not resize controls around it. The transcript panel should consume all entries, render source and translated rows in order, and expose empty, active, and no-transcript states with accessible live-region semantics.

Transcript event normalization should stay in `src/lib/openaiTranslation.ts`. Existing parser coverage should be extended around partial deltas, final replacements, translated caption selection, source/translated stream filtering, and same-id updates. If implementation requires new OpenAI event names or protocol assumptions beyond existing helpers, re-check the official OpenAI realtime translation docs before changing event contracts.

### Design Patterns

- Hook-owned session state: Keep transcript state in `useOpenAITranslation` so provider UI, export work, and tests share one source of truth.
- Pure transcript selectors: Keep latest-caption and filtered-list derivation side-effect-free in `src/lib/openaiTranslation.ts` where practical.
- Component extraction: Add small transcript-specific components instead of expanding `OpenAITranslationProvider` past its orchestration role.
- Defensive event handling: Treat data-channel payloads as external input with parser validation and explicit error mapping.
- Accessible live transcript: Preserve `role="log"`, polite announcements, keyboard access, and focus-visible styling for panel actions.

### Technology Stack

- React 19.2.6
- TypeScript 6.0.3
- Vite 8.0.11
- Tailwind CSS 4.3.0
- Framer Motion 12.38.0
- lucide-react 1.14.0
- Vitest 4.1.5 and React Testing Library 16.3.2

---

## 6. Deliverables

### Files to Create

| File                                                          | Purpose                                                                     | Est. Lines |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------- |
| `src/components/providers/OpenAITranslationLatestCaption.tsx` | Fixed-height latest translated caption surface with accessible empty state  | ~90        |
| `src/components/conversation/TranslationTranscriptPanel.tsx`  | Scrollable source/translated transcript panel with clear control and states | ~150       |

### Files to Modify

| File                                                     | Changes                                                                                           | Est. Lines |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------- |
| `src/types/openai-translation.ts`                        | Add transcript clear action and any display-oriented transcript helper types                      | ~20        |
| `src/lib/openaiTranslation.ts`                           | Extend transcript normalization and selector helpers for latest caption and stable stream views   | ~120       |
| `src/hooks/useOpenAITranslation.ts`                      | Expose `clearTranscripts` without stopping active translation resources                           | ~40        |
| `src/components/providers/OpenAITranslationProvider.tsx` | Wire latest caption, transcript panel, transcript counts, and clear action into the provider view | ~120       |
| `src/test/openaiTranslation.test.ts`                     | Add parser and normalization coverage for partial/final and selector behavior                     | ~120       |
| `src/test/useOpenAITranslation.test.tsx`                 | Add hook coverage for transcript clearing and active-session retention                            | ~90        |
| `src/test/OpenAITranslationProvider.test.tsx`            | Add provider coverage for caption, panel, empty states, and clear controls                        | ~140       |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Latest translated caption renders prominently with a stable height and no overlap with controls.
- [ ] Transcript panel displays source and translated entries in a stable order.
- [ ] Partial deltas and final updates update the same visible line when they refer to the same transcript item.
- [ ] Clear controls reset current transcript UI state without stopping an active translation session.
- [ ] Empty, active, and no-transcript states are understandable and keyboard-accessible.
- [ ] Transcript state remains in memory while a session is active unless the user clears it.

### Testing Requirements

- [ ] Unit tests written and passing for transcript parser normalization and selectors.
- [ ] Hook tests written and passing for transcript clearing without runtime cleanup.
- [ ] Component tests written and passing for latest caption, panel states, and clear controls.
- [ ] Manual testing completed for desktop and mobile viewport layout.

### Non-Functional Requirements

- [ ] No server-side API key is exposed to browser-visible state.
- [ ] Translation status, captions, transcript panel, and clear controls are keyboard and screen-reader usable.
- [ ] Transcript UI keeps stable dimensions on mobile and desktop viewports.
- [ ] No persistent transcript storage, browser local storage, or account-scoped transcript history is introduced.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] `npm run test:run -- src/test/openaiTranslation.test.ts src/test/useOpenAITranslation.test.tsx src/test/OpenAITranslationProvider.test.tsx` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## 8. Implementation Notes

### Key Considerations

- Do not clear transcripts in the runtime stop path unless the user explicitly starts a new session or presses the clear control.
- Do not introduce persistent transcript storage.
- Keep clear behavior separate from `reset` if `reset` remains responsible for runtime teardown and idle-state restoration.
- Keep latest-caption and panel rendering independent from audio playback so missing remote audio does not hide transcript text.
- Avoid duplicating event-name maps outside `src/lib/openaiTranslation.ts`.

### Potential Challenges

- Final transcript events can arrive with a different text shape than delta events: keep parser fallback fields explicit and covered by tests.
- Data-channel events can arrive while the user clears the panel: subsequent events should repopulate from the next event without reintroducing cleared stale entries.
- Long transcript rows can push controls around on mobile: use bounded panel height, wrapping text, and stable caption dimensions.
- Clear confirmation can disrupt keyboard focus: return focus to a predictable control after the clear action where practical.

### Relevant Considerations

- [P02] **Translation teardown coverage**: Clear transcript must not weaken stop, unmount, and provider-switch cleanup for peer connections, data channels, source tracks, translated audio elements, abort controllers, or timers.
- [P02] **OpenAI translation endpoint volatility**: This session should not change protocol endpoints; if event-contract changes appear necessary, check official docs before implementation.
- [P02] **Translation protocol separation**: Do not reuse OpenAI voice-agent prompts, tools, `response.create`, assistant turns, or fixed voice assumptions.
- [P02] **Pure helper module**: Keep transcript normalization and display selectors side-effect-free where possible.
- [P02] **Dedicated translation route isolation**: Keep all client-secret calls behind the existing translation route through the hook; do not introduce frontend API-key access.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- Data-channel transcript payloads are external input and must remain parser-validated with explicit error mapping.
- Clear transcript is a state-mutating action and must avoid duplicate or stale state effects.
- Transcript and caption surfaces display streaming remote data and need explicit empty, active, error-adjacent, and no-transcript states.
- Transcript controls are interactive and need accessibility labels, focus management, and keyboard support.
- The transcript panel is revisitable during a running session and must reset or revalidate correctly after clear and re-entry.

---

## 9. Testing Strategy

### Unit Tests

- Verify `parseOpenAITranslationDataChannelMessage` maps source and translated delta/final events into typed transcript events.
- Verify `applyOpenAITranslationTranscriptEvent` appends deltas, replaces same-id final updates, preserves stable ordering, and does not duplicate visible final lines for same-id events.
- Verify pure selectors return latest translated caption and filtered source/translated entries without mutating input.
- Verify `useOpenAITranslation.clearTranscripts` clears transcript state without closing peer connections, data channels, audio streams, or source tracks.

### Integration Tests

- Mock `useOpenAITranslation` in `OpenAITranslationProvider` tests to render empty, active, source-only, translated-only, and mixed transcript states.
- Verify the provider passes transcript entries to the caption and panel surfaces.
- Verify clear control calls the hook clear action, leaves Start/Stop state intact, and renders the empty state after clear.

### Manual Testing

- Open the translation tab with `VITE_OPENAI_TRANSLATION_ENABLED=true`.
- Confirm desktop layout keeps caption, source/language controls, status, audio player, and transcript panel visible without overlap.
- Confirm mobile viewport stacks caption and transcript panel without horizontal scrolling or clipped text.
- Confirm clear transcript does not stop an active translation session.

### Edge Cases

- Source transcript exists but translated transcript has not arrived yet.
- Translated transcript exists without source transcript.
- Partial deltas arrive before a final event.
- Final event arrives without prior deltas.
- User clears transcripts while the runtime remains connected and new events arrive afterward.
- Long single-word text, multiline text, and empty/whitespace text from malformed events.

---

## 10. Dependencies

### External Libraries

- React: 19.2.6
- Framer Motion: 12.38.0
- lucide-react: 1.14.0
- Vitest: 4.1.5
- React Testing Library: 16.3.2

### Other Sessions

- **Depends on**: `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session02-source-capture-modes`, `phase03-session03-translation-tab-ui-mvp`, `phase02-session02-shared-translation-config-library`
- **Depended by**: `phase03-session05-audio-mix-and-export-controls`, Phase 04 hardening sessions

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
