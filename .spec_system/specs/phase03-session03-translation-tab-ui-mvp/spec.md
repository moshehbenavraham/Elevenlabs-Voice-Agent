# Session Specification

**Session ID**: `phase03-session03-translation-tab-ui-mvp`
**Phase**: 03 - Browser Translation MVP
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session replaces the disabled OpenAI Translation scaffold with the first usable translation provider screen. The screen will let a user select microphone or browser-tab audio, choose one of the supported `gpt-realtime-translate` target languages, start and stop a live translation session, see current status and errors, and hear translated audio through a browser audio element.

The work builds directly on Phase 03 Session 01 and Session 02. Session 01 delivered the reusable WebRTC translation hook for client-secret creation, SDP exchange, translated audio, transcript deltas, and cleanup. Session 02 delivered the reusable source-capture hook for microphone and browser-tab audio, including capability detection, permission errors, missing audio-track handling, and source cleanup.

The result is still an MVP UI. Full transcript panels, latest captions, audio mix controls, elapsed-time guards, export controls, production diagnostics, and E2E coverage remain in later sessions. This session focuses on the core in-app control surface and lifecycle wiring needed before those later experiences can be built safely.

---

## 2. Objectives

1. Replace the translation scaffold with a responsive provider UI that exposes real source, language, start, stop, status, error, and audio playback controls.
2. Wire the UI to `useOpenAITranslationSource` and `useOpenAITranslation` without requesting media or network access until the user starts translation.
3. Preserve lifecycle cleanup for stop, unmount, and provider switching so tracks, peer connections, data channels, audio elements, abort controllers, and timers do not leak.
4. Cover the new UI behavior with focused React Testing Library tests and repository quality checks.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides `useOpenAITranslation`, translated audio stream state, runtime status, runtime errors, and WebRTC cleanup.
- [x] `phase03-session02-source-capture-modes` - Provides `useOpenAITranslationSource`, microphone and browser-tab capture, source capabilities, permission errors, missing-audio handling, and source cleanup.
- [x] `phase02-session02-shared-translation-config-library` - Provides supported target language metadata, language validation, source metadata, and shared helper contracts.
- [x] `phase02-session03-provider-tab-scaffold` - Provides the OpenAI Translation provider identity, feature-flag gating, provider tab, and current scaffold component.

### Required Tools/Knowledge

- React 19 hooks, refs, effects, and local component state.
- TypeScript 6 strict typing for exported props and helper contracts.
- WebRTC `MediaStream` audio element attachment through `srcObject`.
- React Testing Library and Vitest hook mocking patterns.
- Existing provider-switch cleanup patterns in `src/pages/Index.tsx`.

### Environment Requirements

- Node.js and npm dependencies installed.
- Vite frontend available through existing `npm run dev` and `npm run build` workflows.
- Tests must mock media, fetch, and WebRTC behavior; no real OpenAI or browser media request should run in unit tests.

---

## 4. Scope

### In Scope (MVP)

- Translation demo user can choose microphone or browser-tab capture - Use source metadata and capability state from `src/lib/openaiTranslation.ts`.
- Translation demo user can choose a supported target language - Use the Phase 02 supported language list and validation helpers.
- Translation demo user can start translation - Capture the selected source and call `useOpenAITranslation.start` only after a valid source stream is ready, with duplicate-trigger prevention while in-flight.
- Translation demo user can stop translation - Stop runtime and source resources with deterministic cleanup and state reset on re-entry.
- Translation demo user can hear translated output - Attach `translatedAudioStream` to a browser audio element and clear it on stop, unmount, and stream replacement.
- Translation demo user can understand current state - Render source request, client-secret request, connecting, connected, stopping, stopped, offline, and error states with accessible status semantics.
- Maintainer can rely on provider switching cleanup - Expose a stop handler from the provider screen and call it from `Index` before leaving the translation tab.
- Maintainer can verify behavior - Update focused component tests for interactive controls, start/stop orchestration, audio attachment, status rendering, and cleanup wiring.

### Out of Scope (Deferred)

- Transcript panel and latest-caption rendering - _Reason: Session 04 owns transcript and caption experience._
- Audio mix sliders, elapsed timer, max-session guard, and Markdown export - _Reason: Session 05 owns audio mix and export controls._
- Production diagnostics expansion and E2E smoke coverage - _Reason: Phase 04 owns hardening and demo readiness._
- Persistent transcript storage or account-scoped session history - _Reason: Explicitly deferred by the PRD._
- Translation prompt, tool, assistant-turn, or `response.create` behavior - _Reason: OpenAI live translation is a separate protocol from the existing OpenAI voice-agent provider._

---

## 5. Technical Approach

### Architecture

The translation provider should become a self-contained React control surface composed from the two completed hooks. `OpenAITranslationProvider` owns selected source mode, selected target language, in-flight action state, and the orchestration between source capture and WebRTC startup. Presentation details should be split into small provider-local components so the main provider file remains readable.

The start flow should be user-driven and sequential. The user selects source and language, presses Start, source capture requests permission, and then the runtime hook starts with the captured stream and selected language. The stop flow should guard against duplicate clicks and clean up both runtime and source resources. Provider switching should use an exposed stop handler from the translation provider rather than the stale scaffold placeholder resources currently held by `Index`.

Translated audio playback should be handled through a dedicated audio component or focused effect that assigns `translatedAudioStream` to `audioRef.current.srcObject`. That effect must clear `srcObject`, remove any `src`, pause the element, and call `load()` when the stream changes to null or the component unmounts.

### Design Patterns

- Hook composition: Keep media and WebRTC behavior in the existing hooks and use the provider component as the UI orchestrator.
- Ref-backed cleanup handoff: Match the Gemini provider-switch pattern by registering a stable stop handler that `Index` can call when leaving the provider.
- Derived status model: Map source status, runtime status, offline state, and errors into a single UI status object for labels, disabled states, and `aria-live` messaging.
- Component extraction: Move repeated panels and controls into provider-local components to follow the repository convention for readable component size.
- Defensive async flow: Use in-flight flags and latest-operation refs where needed so repeated Start or Stop interactions cannot race.

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

| File                                                           | Purpose                                                                          | Est. Lines |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------- |
| `src/components/providers/OpenAITranslationSourceSelector.tsx` | Accessible microphone and browser-tab source selector backed by capability state | ~120       |
| `src/components/providers/OpenAITranslationLanguageSelect.tsx` | Supported target language select using shared translation metadata               | ~80        |
| `src/components/providers/OpenAITranslationStatusPanel.tsx`    | Status, error, empty, offline, and lifecycle summary panel                       | ~120       |
| `src/components/providers/OpenAITranslationAudioPlayer.tsx`    | Browser audio element that attaches and clears translated audio streams          | ~80        |

### Files to Modify

| File                                                     | Changes                                                                                  | Est. Lines |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- |
| `src/components/providers/OpenAITranslationProvider.tsx` | Replace scaffold with hook-driven control surface and lifecycle orchestration            | ~180       |
| `src/pages/Index.tsx`                                    | Replace scaffold runtime placeholder cleanup with registered translation stop handler    | ~40        |
| `src/test/OpenAITranslationProvider.test.tsx`            | Replace scaffold tests with interactive UI, start/stop, status, audio, and cleanup tests | ~220       |
| `src/components/providers/index.ts`                      | Export any provider-local helper component only if needed by tests or future reuse       | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Translation tab exposes enabled microphone and browser-tab source choices when browser capabilities allow them.
- [ ] Unsupported, restricted, or unavailable source choices render as disabled with actionable status text.
- [ ] User can choose any supported target language before starting translation.
- [ ] Start requests media only after an explicit user action and calls translation startup only when a valid audio source is ready.
- [ ] Stop tears down runtime and source resources and leaves the UI ready for another start.
- [ ] Translated remote audio is attached to a playable browser audio element and cleared on cleanup.
- [ ] Provider switching stops active translation and leaves other provider tabs stable.

### Testing Requirements

- [ ] Unit tests written and passing for source and language controls.
- [ ] Unit tests written and passing for start/stop orchestration and disabled states.
- [ ] Unit tests written and passing for translated audio stream attachment and cleanup.
- [ ] Unit tests written and passing for provider-switch stop handler registration.
- [ ] Manual testing completed for desktop and mobile viewport layout.

### Non-Functional Requirements

- [ ] No server-side API key is exposed to browser-visible state.
- [ ] No media permissions or OpenAI requests are made during initial render.
- [ ] Translation status, errors, language selection, start/stop controls, and audio playback are keyboard and screen-reader usable.
- [ ] Cleanup covers tracks, peer connections, data channels, audio elements, abort controllers, timers, and source listeners through the existing hook contracts.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] `npm run test:run -- src/test/OpenAITranslationProvider.test.tsx` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## 8. Implementation Notes

### Key Considerations

- Do not call `navigator.mediaDevices` capture methods or fetch the translation route during render.
- Avoid duplicating language lists or source metadata in UI code; consume shared helpers from `src/lib/openaiTranslation.ts`.
- Keep the translation provider visually aligned with the existing dark cockpit UI while prioritizing a dense, operational control surface over decorative copy.
- Preserve existing `VITE_OPENAI_TRANSLATION_ENABLED` provider-list gating behavior.

### Potential Challenges

- Async source capture and translation startup can race if the user double-clicks Start: gate with explicit in-flight state and check hook busy statuses before starting.
- Source capture returns hook state after async updates rather than returning the stream directly: orchestrate startup through source state, a pending-start ref, or a helper path that avoids stale closure reads.
- Stopping during startup can leave partial resources: call runtime stop/reset and source stop in a deterministic order and tolerate already-cleaned resources.
- Audio element cleanup can retain a stale `srcObject`: centralize attachment and cleanup in the audio player component.

### Relevant Considerations

- [P02] **Translation teardown coverage**: This session must make stop, unmount, and provider-switch cleanup visible in the UI layer and covered by tests where practical.
- [P02] **OpenAI translation endpoint volatility**: This session should not change protocol endpoints; if protocol changes appear necessary, check official OpenAI docs before implementation.
- [P02] **Translation protocol separation**: Do not reuse OpenAI voice-agent prompts, tools, `response.create`, assistant turns, or fixed voice assumptions.
- [P02] **Dedicated translation route isolation**: Keep all client-secret calls behind the existing translation route through the hook; do not introduce frontend API-key access.
- [P02] **Pure helper module**: Reuse helper metadata and validation rather than hardcoding lists in UI components.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- Start can be triggered repeatedly while capture or WebRTC startup is still pending.
- Stop or provider switch can happen while source capture, client-secret creation, SDP exchange, or connection setup is in progress.
- Audio playback can retain a stale stream after stop, provider switch, or component unmount.
- Browser source capabilities and permission failures can leave inaccessible or misleading controls.
- Mobile layouts can overlap controls if source cards, language select, status, and audio player are not constrained.

---

## 9. Testing Strategy

### Unit Tests

- Mock `useOpenAITranslationSource` and `useOpenAITranslation` to verify rendering for idle, requesting, connected, stopping, stopped, offline, and error states.
- Verify source controls use shared metadata, apply capability-disabled states, and call the correct capture path only from explicit Start interactions.
- Verify language selection uses shared target language options and passes the selected code to runtime startup.
- Verify Start and Stop are disabled while relevant source or runtime actions are in flight.
- Verify audio player assigns `srcObject` when a translated stream is present and clears it on stream removal or unmount.

### Integration Tests

- Use component-level tests around `OpenAITranslationProvider` and `Index` cleanup wiring where practical.
- Verify registered provider-switch stop handler calls the translation stop path before the active provider changes.

### Manual Testing

- Open the translation tab with `VITE_OPENAI_TRANSLATION_ENABLED=true`.
- Confirm no media permission prompt appears before pressing Start.
- Confirm desktop layout keeps source, language, status, start/stop, and audio controls visible without overlap.
- Confirm mobile viewport stacks controls without horizontal scrolling or clipped text.
- Confirm provider switching after a started or partially started translation returns the UI to an idle state.

### Edge Cases

- Browser is offline when user presses Start.
- `getDisplayMedia` is unavailable, restricted, denied, cancelled, or returns no audio track.
- `getUserMedia` is denied or unavailable.
- Runtime startup fails during client-secret creation, SDP exchange, or WebRTC connection.
- User presses Stop while source capture or runtime startup is in progress.
- Translated audio stream appears, disappears, and appears again during repeated sessions.

---

## 10. Dependencies

### External Libraries

- React: 19.2.6
- Framer Motion: 12.38.0
- lucide-react: 1.14.0
- Vitest: 4.1.5
- React Testing Library: 16.3.2

### Other Sessions

- **Depends on**: `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session02-source-capture-modes`, `phase02-session02-shared-translation-config-library`, `phase02-session03-provider-tab-scaffold`
- **Depended by**: `phase03-session04-transcript-and-caption-experience`, `phase03-session05-audio-mix-and-export-controls`, Phase 04 hardening sessions

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
