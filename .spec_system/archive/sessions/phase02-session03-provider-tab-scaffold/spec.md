# Session Specification

**Session ID**: `phase02-session03-provider-tab-scaffold`
**Phase**: 02 - Translation Foundation
**Status**: Completed
**Completed**: 2026-05-11
**Created**: 2026-05-11

---

## 1. Session Overview

This session adds the visible frontend scaffold for the dedicated OpenAI Translation provider path. Phase 02 Session 01 created the backend translation client-secret route, and Phase 02 Session 02 created the shared frontend translation config library. Session 03 connects those foundations to the provider navigation surface without starting real media capture, SDP exchange, WebRTC transport, translated audio playback, or transcript state.

The work makes OpenAI Translation a separate provider identity from the existing OpenAI voice-agent tab. It adds feature-flag gating through `VITE_OPENAI_TRANSLATION_ENABLED`, a tab icon and labels, a placeholder provider panel consistent with the current Acoustic Noir UI, and provider-switch cleanup placeholders that future WebRTC lifecycle code can attach to without reworking navigation.

The implementation must keep all existing voice-agent providers unchanged. When the translation flag is off, the translation tab must not disrupt tab ordering, saved provider selection, or keyboard navigation. When the flag is on, users should see a clearly separate translation entry point that explains the feature is scaffolded and not yet a runnable translation session.

---

## 2. Objectives

1. Add a dedicated `openai-translation` provider identity and metadata entry that is separate from the existing `openai` voice-agent provider.
2. Gate translation provider visibility and selection with `VITE_OPENAI_TRANSLATION_ENABLED`, including safe fallback for stale saved selections.
3. Add translation tab icon, mobile label, and placeholder panel with accessible inactive controls and no real session side effects.
4. Add provider-switch cleanup placeholders so later WebRTC sessions can clean up tracks, peer connections, data channels, audio elements, timers, and transcript state from one navigation boundary.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session01-translation-api-contract-and-server-route` - Provides `/api/openai/translation-session`, server-only client-secret minting, route validation, and feature-flag/env documentation.
- [x] `phase02-session02-shared-translation-config-library` - Provides typed translation target language metadata and helper exports under `src/lib/openaiTranslation.ts` and `src/types/openai-translation.ts`.

### Required Tools/Knowledge

- Existing provider metadata and enum patterns in `src/types/voice-provider.ts`.
- Provider selection persistence and validation patterns in `src/contexts/ProviderContext.tsx`.
- Radix tab, Framer Motion, lucide icon, and Tailwind styling patterns in `src/components/tabs/ProviderTab.tsx` and `src/components/tabs/ProviderTabs.tsx`.
- Current provider page rendering and switch-cleanup logic in `src/pages/Index.tsx`.
- Vitest and React Testing Library patterns in `src/test/ProviderContext.test.tsx`, `src/test/ProviderTabs.test.tsx`, and `src/test/providers.test.tsx`.

### Environment Requirements

- Node.js and npm available locally.
- No live OpenAI request is required for this session.
- `VITE_OPENAI_TRANSLATION_ENABLED` remains false by default in env templates and must be stubbed in focused tests when the translation tab should appear.
- All output must remain ASCII-only with Unix LF line endings.

---

## 4. Scope

### In Scope (MVP)

- User can distinguish OpenAI Translation from OpenAI voice-agent mode - Add a dedicated provider type, name, description, metadata entry, and tab label.
- Maintainer can gate the scaffolded tab - Read `VITE_OPENAI_TRANSLATION_ENABLED` through the same Vite env pattern used by other providers.
- User does not get trapped on a disabled provider - Revalidate saved provider selection and fall back to the default provider when the translation flag is off or the saved value is invalid.
- User can see a scaffolded translation panel - Create a placeholder panel with source-mode, target-language, status, and start-control affordances shown as disabled or deferred.
- Future WebRTC cleanup has a navigation hook point - Add an explicit translation cleanup placeholder in provider switching so later sessions can close tracks, peer connections, data channels, audio elements, timers, and transcripts.
- Existing voice-agent providers continue to render and switch normally - Preserve current provider behavior, tab accessibility, and tests.

### Out of Scope (Deferred)

- Starting a real translation session - _Reason: Phase 03 owns the browser WebRTC hook and session lifecycle._
- Browser microphone or tab-audio capture - _Reason: Phase 03 Session 02 owns source capture modes and permission states._
- SDP exchange, `RTCPeerConnection`, data channel handling, translated audio playback, and transcript deltas - _Reason: Phase 03 owns runtime media transport._
- Transcript panel, caption rendering, export controls, and audio mix controls - _Reason: later Phase 03 sessions own those user-facing workflows._
- Backend route implementation or route test expansion - _Reason: Sessions 01 and 04 own backend route behavior and coverage._

---

## 5. Technical Approach

### Architecture

Extend the provider type system with `openai-translation` and add provider metadata for "OpenAI Translation". The translation provider must stay separate from `openai` so future WebRTC translation logic cannot accidentally inherit prompt, tool, voice selection, assistant-turn, or `response.create` assumptions from the voice-agent provider.

Update the provider context so the provider list is derived from a canonical provider order and current availability rules. The context should validate localStorage values against the active provider list, not just the static union, so a stale saved `openai-translation` value falls back cleanly when `VITE_OPENAI_TRANSLATION_ENABLED` is false. This is the main state-safety requirement for the feature flag.

Create `src/components/providers/OpenAITranslationProvider.tsx` as a non-runtime placeholder panel. It can import target language metadata from `src/lib/openaiTranslation.ts` for display-ready labels, but it must not fetch, create sessions, request permissions, own media tracks, or instantiate WebRTC objects. Wire the placeholder into `src/pages/Index.tsx` under the new provider branch and add a named cleanup placeholder in `handleProviderChange` for future translation lifecycle teardown.

### Design Patterns

- Provider metadata extension: Follow the existing `PROVIDERS` and `ProviderType` patterns while keeping the translation identity distinct.
- Feature flag gating: Use Vite `import.meta.env` checks and test stubs, matching existing provider availability helpers.
- Safe persisted state: Revalidate saved provider state when available provider membership changes.
- Placeholder component: Show future workflow structure without triggering browser permissions, network calls, or audio state.
- Lifecycle boundary: Keep cleanup centralized in provider switching so future WebRTC implementation has one clear navigation boundary.

### Technology Stack

- React 19 and Vite 8.
- TypeScript 6.
- Radix UI Tabs through existing provider tab components.
- Framer Motion for existing page transition style.
- lucide-react for the provider tab icon.
- Vitest 4 and React Testing Library for focused tests.

---

## 6. Deliverables

### Files to Create

| File                                                                                 | Purpose                                                                                                        | Est. Lines |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/components/providers/OpenAITranslationProvider.tsx`                             | Placeholder translation provider panel with disabled controls, status copy, and shared language metadata usage | ~170       |
| `src/test/OpenAITranslationProvider.test.tsx`                                        | Focused tests for placeholder rendering, disabled actions, language metadata, and accessibility basics         | ~130       |
| `.spec_system/specs/phase02-session03-provider-tab-scaffold/implementation-notes.md` | Implementation notes, decisions, command results, and Session 04/Phase 03 handoff                              | ~120       |

### Files to Modify

| File                                  | Changes                                                                                         | Est. Lines |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| `src/types/voice-provider.ts`         | Add `openai-translation` provider type, env helper, metadata entry, and icon name               | ~25        |
| `src/contexts/ProviderContext.tsx`    | Add flag-aware provider ordering, provider validation, persisted fallback, and selection guard  | ~45        |
| `src/components/tabs/ProviderTab.tsx` | Add translation icon mapping and compact mobile label                                           | ~12        |
| `src/components/providers/index.ts`   | Export the OpenAI Translation provider placeholder                                              | ~6         |
| `src/pages/Index.tsx`                 | Render translation provider branch and add provider-switch cleanup placeholder                  | ~70        |
| `src/test/ProviderContext.test.tsx`   | Cover provider list, flag gating, saved selection fallback, and selection guard behavior        | ~80        |
| `src/test/ProviderTabs.test.tsx`      | Cover translation tab visibility, icon label, keyboard access, and unchanged existing providers | ~80        |
| `src/test/providers.test.tsx`         | Add or adjust provider scaffold export/configuration smoke coverage if needed                   | ~35        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `ProviderType` includes `openai-translation` and `PROVIDERS.openai-translation` contains translation-specific name, description, availability, API-key, and icon metadata.
- [ ] `VITE_OPENAI_TRANSLATION_ENABLED=false` prevents stale saved translation selections from becoming active and keeps existing providers usable.
- [ ] `VITE_OPENAI_TRANSLATION_ENABLED=true` allows the OpenAI Translation provider tab to render and be selected.
- [ ] The translation tab has a lucide icon, desktop label, compact mobile label, title text, and stable active/disabled tab states.
- [ ] The placeholder panel makes translation visibly separate from the OpenAI voice-agent panel.
- [ ] The placeholder panel does not request media permissions, call `/api/openai/translation-session`, create WebRTC objects, or mutate transcript/audio state.
- [ ] Provider switching includes a named OpenAI Translation cleanup placeholder for future lifecycle teardown.
- [ ] Existing providers continue to render, switch, and pass current tests.

### Testing Requirements

- [ ] Provider context tests cover flag-enabled and flag-disabled translation selection behavior.
- [ ] Provider tabs tests cover translation tab visibility or availability under the feature flag and unchanged existing tab behavior.
- [ ] Placeholder component tests cover visible scaffold sections, disabled start behavior, language metadata rendering, and accessible status/control labels.
- [ ] Focused tests pass for provider context, provider tabs, provider exports, and the translation placeholder.
- [ ] `npm run type-check`, `npm run lint`, and `npm run build` pass or exact blockers are recorded.

### Non-Functional Requirements

- [ ] The scaffold does not expose or reference `OPENAI_API_KEY` in frontend code.
- [ ] Translation remains protocol-separated from the existing OpenAI voice-agent provider.
- [ ] Placeholder controls are keyboard and screen-reader understandable even while disabled.
- [ ] The tab list remains responsive and does not wrap incoherently on mobile.
- [ ] No new external dependencies are added.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] No unrelated provider behavior is refactored.

---

## 8. Implementation Notes

### Key Considerations

- The translation provider should be named and styled as a separate mode, not as another OpenAI voice model.
- The placeholder can display the default target language and language count from `src/lib/openaiTranslation.ts`, but it should not duplicate the 13-language list manually.
- Feature flag behavior must account for localStorage. A saved translation provider value from a previous enabled build should not leave users on a hidden or unavailable provider.
- The cleanup placeholder should be explicit enough for Phase 03 to replace with real teardown of source tracks, peer connection, data channel, audio elements, timers, and transcript state.

### Potential Challenges

- Static union versus flag-aware provider list: Mitigate by separating "valid provider type" from "selectable provider in this environment".
- Test env drift: Mitigate with explicit `vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', ...)` tests and cleanup between cases.
- Placeholder overreach: Mitigate by keeping the panel non-runtime and disabling start controls until Phase 03.
- Existing provider regression: Mitigate by running focused provider context/tabs tests plus type-check, lint, and build.
- Mobile tab density: Mitigate with a short mobile label such as "Translate" and existing horizontal scrolling behavior.

### Relevant Considerations

- [P02] **Translation teardown coverage**: This session adds the navigation cleanup hook point that Phase 03 can attach to for real WebRTC resource teardown.
- [P02] **Translation client secret boundary**: The scaffold must not expose or reference `OPENAI_API_KEY`; it only points to future backend-mediated session creation.
- [P02] **Translation protocol separation**: The new provider identity must remain separate from OpenAI voice-agent prompt, tool, and assistant-turn assumptions.
- [P02] **OpenAI translation endpoint volatility**: This session should avoid protocol calls and leave endpoint-shape behavior to the already isolated backend/config layers.
- [P02-S01] **Translation token exchange remains to be implemented**: Session 01 implemented the route, but the scaffold must still treat browser-visible data as client-secret-only and avoid secret leakage.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- A stale saved translation provider could trap users on an unavailable provider after the feature flag is disabled.
- Provider switching could later leave WebRTC resources alive if the cleanup boundary is not planned now.
- Placeholder UI could imply a real translation session can start before capture and WebRTC lifecycle code exists.
- New tab controls could be inaccessible or unstable in the responsive provider list.

---

## 9. Testing Strategy

### Unit Tests

- Test `ProviderContext` provider list and selection behavior with `VITE_OPENAI_TRANSLATION_ENABLED` false and true.
- Test fallback from stale localStorage value `openai-translation` when the flag is disabled.
- Test `ProviderTab` or `ProviderTabs` rendering for the translation label and enabled/disabled behavior under the flag.
- Test `OpenAITranslationProvider` placeholder content, disabled controls, language metadata usage, and accessible status semantics.

### Integration Tests

- Use React Testing Library to render `ProviderTabs` inside `ProviderProvider` and verify existing provider tabs still render and switch.
- Use `Index`-adjacent tests only if the existing test setup can mock provider contexts without broad churn; otherwise record the handoff and keep this session focused on provider/context/tabs tests.

### Manual Testing

- Run the app with `VITE_OPENAI_TRANSLATION_ENABLED=false` and confirm the translation tab does not disrupt the default provider flow.
- Run the app with `VITE_OPENAI_TRANSLATION_ENABLED=true` and confirm the translation tab appears, can be selected, and renders the placeholder panel.
- Switch from the translation tab to other providers and confirm existing provider behavior is unchanged.

### Edge Cases

- `localStorage.voice-ai-provider` contains `openai-translation` while the flag is false.
- `localStorage.voice-ai-provider` contains an unknown provider string.
- Feature flag env value is the string `true`, boolean `true`, empty, missing, or false.
- Translation provider is selected and the user switches away before any future runtime session exists.
- Tab list at mobile width with the additional provider entry.

---

## 10. Dependencies

### External Libraries

- No new external dependency is expected.
- Existing `lucide-react`, Radix Tabs, Framer Motion, Tailwind, Vitest, and React Testing Library dependencies are sufficient.

### Other Sessions

- **Depends on**: `phase02-session01-translation-api-contract-and-server-route`, `phase02-session02-shared-translation-config-library`
- **Depended by**: `phase02-session04-backend-and-config-tests`, `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session02-source-capture-modes`, `phase03-session03-translation-tab-ui-mvp`, `phase04-session01-translation-lifecycle-hardening`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
