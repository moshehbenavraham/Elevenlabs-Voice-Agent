# Session Specification

**Session ID**: `phase03-session05-audio-mix-and-export-controls`
**Phase**: 03 - Browser Translation MVP
**Status**: Not Started
**Created**: 2026-05-11

---

## 1. Session Overview

This session completes the Phase 03 browser translation MVP by adding the remaining controls around an active OpenAI Translation session. Sessions 01 through 04 already provide the WebRTC runtime, source capture, provider screen, translated audio playback, and transcript/caption state. This work adds browser-tab audio mix controls, Markdown transcript export, elapsed-time visibility, and the default max-session guard.

The session focuses on the current in-memory translation session only. Users should be able to balance original and translated audio during browser-tab capture, export the current source and translated transcript lines as Markdown with session metadata, and see elapsed time while the app automatically stops unattended sessions at the configured limit.

The implementation must preserve the existing protocol boundary. It should not change OpenAI translation endpoints, SDP exchange behavior, or data-channel event assumptions. It should only compose existing runtime state, source state, transcript state, and pure helper contracts into demo-ready controls.

---

## 2. Objectives

1. Add browser-tab original/translated audio mix controls that use the Phase 02 clamp helper contract.
2. Add elapsed-time display and default max-session auto-stop behavior with a 120-minute hard maximum.
3. Add Markdown export for current source and translated transcript lines with clear disabled and error states.
4. Cover mix, export, timer, and provider behavior with focused tests.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session02-shared-translation-config-library` - Provides audio mix helpers and shared translation config patterns.
- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides translated audio stream, WebRTC runtime state, and cleanup.
- [x] `phase03-session02-source-capture-modes` - Provides microphone and browser-tab source capture state.
- [x] `phase03-session03-translation-tab-ui-mvp` - Provides the translation provider screen and start/stop controls.
- [x] `phase03-session04-transcript-and-caption-experience` - Provides transcript state, latest caption, clear controls, and display selectors.

### Required Tools/Knowledge

- React 19 hooks, refs, effects, and component composition.
- TypeScript 6 strict typing for exported helpers and hook return types.
- Radix slider accessibility patterns through the existing shadcn `Slider` wrapper.
- Existing Vitest, React Testing Library, and fake-timer testing patterns.
- Browser media element volume behavior for local source and remote translated streams.

### Environment Requirements

- Node.js and npm dependencies installed.
- Unit tests must mock media streams, audio elements, downloads, object URLs, timers, and provider hooks.
- No real OpenAI, browser media, or network requests should run in unit tests.

---

## 4. Scope

### In Scope (MVP)

- Translation demo user can balance browser-tab audio - Render original and translated volume mix controls only when browser-tab source audio is relevant.
- Translation demo user can hear translated output at the selected mix - Apply clamped translated volume to the existing translated audio element.
- Translation demo user can hear original source audio at the selected mix - Attach browser-tab source stream to an original audio element with cleanup and hide this path for microphone mode.
- Translation demo user can export current transcript lines - Generate a Markdown file from in-memory transcript entries and session metadata.
- Translation demo user can understand export availability - Disable export when there are no transcript lines and show export failure state if download setup fails.
- Translation demo user can see elapsed time - Render stable elapsed-time text for active and recently stopped translation sessions.
- Maintainer can enforce demo cost guardrails - Stop translation automatically at the configured default max duration and never exceed the 120-minute hard maximum.
- Maintainer can reduce demo/test session limits - Support an optional frontend max-session setting suitable for local demos and tests.

### Out of Scope (Deferred)

- Stronger production usage controls and safety identifiers - _Reason: Phase 05 owns production safety policy._
- Persistent transcript storage or account-scoped transcript history - _Reason: Explicitly deferred by the master PRD._
- Evaluation harness and golden-script workflow - _Reason: Phase 05 owns repeatable translation evaluation._
- Browser-extension subtitle overlay export - _Reason: Explicitly deferred by the master PRD._
- Backend raw-audio bridge, SIP, telephony, or LiveKit fanout - _Reason: Phase 05 owns media variant architecture._
- Advanced diagnostics and E2E coverage - _Reason: Phase 04 owns hardening and demo readiness._

---

## 5. Technical Approach

### Architecture

Keep `OpenAITranslationProvider` as the orchestration boundary for source, runtime, mix, export, and timer state. Add pure helpers in `src/lib/openaiTranslation.ts` for max-session config normalization, duration formatting, and Markdown export so provider code stays focused on UI state and side effects.

Add a small session timer hook that owns interval and timeout lifecycle. The hook should expose elapsed seconds, configured max seconds, and auto-stop callbacks without knowing about OpenAI runtime details. Provider code should decide when a session starts, stops, resets, or auto-stops, and then call existing runtime/source cleanup paths.

Use presentation components for audio mix and export controls. `OpenAITranslationAudioPlayer` should be extended to accept label and volume props so both translated and original audio elements use one cleanup-tested media element path. Browser-tab original audio should use the captured source stream; microphone mode should not render irrelevant original-audio controls.

### Design Patterns

- Pure helper contracts: Put Markdown export, duration labels, and max-session bounds in `src/lib/openaiTranslation.ts`.
- Hook-owned timer lifecycle: Keep intervals and timeouts in a dedicated hook with cleanup on unmount and session re-entry.
- Component extraction: Add focused mix/export components instead of expanding provider markup beyond orchestration.
- Re-entry safety: Reset or revalidate timer, export metadata, and mix state when starting a new session, changing source mode, stopping, or provider switching.
- Accessible controls: Use slider semantics, explicit labels, disabled states, focus-visible styling, and stable button labels.

### Technology Stack

- React 19.2.6
- TypeScript 6.0.3
- Vite 8.0.11
- Tailwind CSS 4.3.0
- Radix UI Slider 1.3.6 through `src/components/ui/slider.tsx`
- lucide-react 1.14.0
- Vitest 4.1.5 and React Testing Library 16.3.2

---

## 6. Deliverables

### Files to Create

| File                                                             | Purpose                                                                | Est. Lines |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| `src/hooks/useOpenAITranslationSessionTimer.ts`                  | Session elapsed timer and max-session auto-stop lifecycle hook         | ~120       |
| `src/components/providers/OpenAITranslationAudioMixControls.tsx` | Accessible original/translated audio mix controls                      | ~130       |
| `src/components/providers/OpenAITranslationExportControls.tsx`   | Markdown transcript export action with disabled and error states       | ~120       |
| `src/test/useOpenAITranslationSessionTimer.test.tsx`             | Fake-timer coverage for elapsed time, auto-stop, cleanup, and re-entry | ~140       |

### Files to Modify

| File                                                        | Changes                                                                                     | Est. Lines |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- |
| `src/types/openai-translation.ts`                           | Add session metadata, export payload, max-session config, and auto-stop reason types        | ~80        |
| `src/lib/openaiTranslation.ts`                              | Add max-session normalization, duration formatting, Markdown export, and existing mix reuse | ~180       |
| `src/components/providers/OpenAITranslationAudioPlayer.tsx` | Add reusable label/volume/source-kind props while preserving cleanup behavior               | ~60        |
| `src/components/providers/OpenAITranslationProvider.tsx`    | Wire timer, mix controls, original audio, export, elapsed time, and auto-stop behavior      | ~220       |
| `src/test/openaiTranslation.test.ts`                        | Add helper coverage for max config, duration labels, export formatting, and mix reuse       | ~160       |
| `src/test/OpenAITranslationProvider.test.tsx`               | Add provider coverage for mix, export, elapsed time, auto-stop, and source-mode behavior    | ~220       |
| `.env.example`                                              | Document optional max-session reduction setting                                             | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Audio mix controls clamp values and update translated/original audio element volume.
- [ ] Browser-tab translation can balance original and translated audio.
- [ ] Microphone translation does not show irrelevant original-audio controls.
- [ ] Elapsed time updates while active and resets predictably after cleanup or new start.
- [ ] Session automatically stops at the configured default max duration.
- [ ] Configured max-session duration cannot exceed the 120-minute hard maximum.
- [ ] Transcript Markdown export includes session metadata, target language, source mode, duration, and current transcript lines.
- [ ] Export action is disabled when there are no transcript lines and reports download setup failure.

### Testing Requirements

- [ ] Unit tests written and passing for mix helpers, max-session config, duration formatting, and Markdown export.
- [ ] Hook tests written and passing for timer tick, auto-stop callback, cleanup, and re-entry.
- [ ] Component/provider tests written and passing for mix controls, export states, elapsed display, and auto-stop cleanup.
- [ ] Manual testing completed for desktop and mobile viewport layout.

### Non-Functional Requirements

- [ ] No server-side API key is exposed to browser-visible state.
- [ ] Max-session configuration is bounded and cannot bypass the hard maximum.
- [ ] Timers, object URLs, source audio elements, translated audio elements, peer connections, data channels, and tracks clean up on stop or unmount.
- [ ] Translation status, elapsed time, mix controls, export controls, and transcript actions are keyboard and screen-reader usable.
- [ ] No persistent transcript storage, browser local storage, or account-scoped transcript history is introduced.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] `npm run test:run -- src/test/openaiTranslation.test.ts src/test/useOpenAITranslationSessionTimer.test.tsx src/test/OpenAITranslationProvider.test.tsx` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## 8. Implementation Notes

### Key Considerations

- Do not change OpenAI translation endpoints, SDP exchange behavior, data-channel event names, or client-secret contracts in this session.
- Original audio controls should render only for browser-tab capture. Microphone capture must stay simple and should not play microphone input back to the user.
- Keep `OPENAI_API_KEY` server-side only. Any new frontend environment variable must be non-secret and documented as browser-visible.
- Do not persist transcripts or session metadata outside current page memory.
- Export should use normalized display entries so partial/final labels and ordering match the visible transcript panel.

### Potential Challenges

- Browser-tab captured audio may duplicate source playback depending on browser and share target: keep controls explicit and allow the user to lower original volume to zero.
- Auto-stop can race with manual stop: use a single in-flight stop path and avoid duplicate cleanup calls.
- Download creation can fail in restricted browser contexts: surface an inline error and revoke object URLs after use.
- Long transcript lines can make Markdown large: use current in-memory lines only and avoid unbounded background persistence.
- Timer cleanup bugs are easy to miss: cover intervals, timeouts, unmount, and new-session re-entry with fake timers.

### Relevant Considerations

- [P02] **Translation teardown coverage**: Auto-stop and manual stop must preserve cleanup for peer connections, data channels, source tracks, translated audio elements, abort controllers, and timers.
- [P02] **OpenAI translation endpoint volatility**: This session should not change protocol endpoints; if protocol changes appear necessary, check official docs before implementation.
- [P02] **Translation protocol separation**: Do not reuse OpenAI voice-agent prompts, tools, `response.create`, assistant turns, or fixed voice assumptions.
- [P02] **Pure helper module**: Keep max-session config, duration labels, audio mix state, and Markdown export side-effect-free where possible.
- [P01-S01] **Rate limiting is process-local**: Max-session guardrails reduce frontend demo cost risk but do not replace production shared rate limiting.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- Auto-stop and manual stop are state-mutating actions and must prevent duplicate stop triggers while in-flight.
- Timer intervals, max-duration timeouts, object URLs, source audio elements, and translated audio elements require cleanup on scope exit.
- Export consumes external transcript event output and must use normalized display entries with deterministic ordering.
- Mix sliders and export buttons are interactive controls and need accessibility labels, focus management, disabled states, and keyboard support.
- Browser-tab and microphone modes are revisitable contexts and must reset or revalidate audio mix and original playback state on re-entry.

---

## 9. Testing Strategy

### Unit Tests

- Verify `buildTranslationAudioMixState` remains the single clamped mix contract used by UI state.
- Verify max-session config parsing applies defaults, allows lower demo/test limits, rejects unsafe values, and caps at 120 minutes.
- Verify duration formatting handles zero, active, stopped, and over-limit values.
- Verify Markdown export includes metadata, source/translated rows, final/partial labels, and no raw provider secrets.

### Integration Tests

- Mock `useOpenAITranslation`, `useOpenAITranslationSource`, timers, object URLs, and audio elements in `OpenAITranslationProvider` tests.
- Verify browser-tab mode renders mix controls and original audio, while microphone mode hides original audio controls.
- Verify translated and original audio elements receive clamped volume values.
- Verify export button is disabled with no transcript lines, creates a Markdown download with lines, revokes object URLs, and reports failures.
- Verify max-session timeout calls the same stop path as the Stop button and does not double-stop on races.

### Manual Testing

- Open the translation tab with `VITE_OPENAI_TRANSLATION_ENABLED=true`.
- Confirm desktop layout keeps caption, source/language controls, status, audio, mix, timer, export, and transcript panel visible without overlap.
- Confirm mobile viewport stacks controls without horizontal scrolling or clipped button text.
- Confirm microphone mode hides original-audio controls and browser-tab mode shows original/translated mix controls.
- Confirm auto-stop status is visible after a configured short demo limit.

### Edge Cases

- No transcript lines exist when export is pressed.
- Source transcript exists but translated transcript has not arrived yet.
- Translated transcript exists without source transcript.
- Browser-tab source ends before auto-stop.
- User presses Stop at the same time max-session timeout fires.
- User switches source mode after a stopped browser-tab session.
- Object URL creation or link click fails.
- Configured max duration is empty, non-numeric, negative, zero, fractional, or above the hard maximum.

---

## 10. Dependencies

### External Libraries

- React: 19.2.6
- Radix UI Slider: 1.3.6
- lucide-react: 1.14.0
- Vitest: 4.1.5
- React Testing Library: 16.3.2

### Other Sessions

- **Depends on**: `phase02-session02-shared-translation-config-library`, `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session02-source-capture-modes`, `phase03-session03-translation-tab-ui-mvp`, `phase03-session04-transcript-and-caption-experience`
- **Depended by**: Phase 04 hardening, diagnostics, E2E, and documentation sessions

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
