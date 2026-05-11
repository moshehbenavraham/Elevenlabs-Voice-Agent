# Session 03: Translation Tab UI MVP

**Session ID**: `phase03-session03-translation-tab-ui-mvp`
**Status**: Not Started
**Estimated Tasks**: 18-24
**Estimated Duration**: 2-4 hours

---

## Objective

Build the initial OpenAI Translation provider screen with source selector, target language selector, start/stop control, status, translated audio playback, and responsive UI.

---

## Scope

### In Scope (MVP)

- Replace the scaffolded translation empty state with a usable provider screen.
- Add source mode controls for microphone and browser-tab translation.
- Add target language selection using the Phase 02 supported-language list.
- Wire start and stop controls to the translation and source-capture hooks.
- Render current status, active source, selected target language, and primary error state.
- Attach translated audio stream to a browser-controlled audio element.
- Keep controls keyboard-accessible and consistent with existing provider UI patterns.
- Preserve provider-switch cleanup by stopping active translation before leaving the tab.

### Out of Scope

- Full transcript panel and latest-caption experience, which belongs to Session 04.
- Audio mix sliders, export controls, and elapsed/max-session UI, which belong to Session 05.
- Production diagnostics expansion, which belongs to Phase 04.
- E2E smoke coverage, which belongs to Phase 04.

---

## Prerequisites

- [ ] Session 01 translation hook contract is available.
- [ ] Session 02 source-capture contract is available.
- [ ] Existing provider tab and settings UI patterns are understood.
- [ ] `VITE_OPENAI_TRANSLATION_ENABLED` gating behavior remains intact.

---

## Deliverables

1. Usable `OpenAITranslationProvider` screen.
2. Source and target language controls.
3. Start/stop lifecycle integration.
4. Translated audio playback element wiring.
5. Responsive status and error presentation consistent with the app.

---

## Success Criteria

- [ ] Translation tab exposes microphone and browser-tab source choices.
- [ ] User can choose a supported target language before starting.
- [ ] Start and stop buttons reflect active, connecting, stopping, and error states.
- [ ] Translated remote audio is attached to a playable browser audio element.
- [ ] Provider switching stops active translation and leaves other provider tabs stable.
