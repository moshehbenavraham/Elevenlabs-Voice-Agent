# Session 03: Provider-Tab Scaffold

**Session ID**: `phase02-session03-provider-tab-scaffold`
**Status**: Not Started
**Estimated Tasks**: 12-18
**Estimated Duration**: 2-4 hours

---

## Objective

Add the OpenAI Translation provider identity, feature flag, icon, empty state, and provider-switch cleanup placeholders without disrupting existing provider tabs.

---

## Scope

### In Scope (MVP)

- Add a dedicated translation provider type and provider metadata entry.
- Gate the translation tab with `VITE_OPENAI_TRANSLATION_ENABLED`.
- Add a suitable lucide icon in the provider tab UI.
- Add an empty or placeholder translation provider panel consistent with the current app structure.
- Add provider-switch cleanup placeholders so later WebRTC sessions have a clear lifecycle integration point.
- Keep existing voice-agent providers unchanged.

### Out of Scope

- Starting a real translation session.
- Browser media capture, WebRTC SDP exchange, or translated audio playback.
- Transcript panel, export controls, and audio mix controls.
- Backend route implementation, which belongs to Session 01.

---

## Prerequisites

- [ ] Existing provider tab and provider context patterns are understood.
- [ ] Shared translation config exports from Session 02 are available or expected names are documented.
- [ ] The translation tab remains disabled by default unless the feature flag enables it.

---

## Deliverables

1. New provider identity and metadata.
2. Feature flag handling for the translation tab.
3. Provider tab icon and label integration.
4. Placeholder translation provider panel.
5. Cleanup integration placeholder for provider switching.

---

## Success Criteria

- [ ] Existing provider tabs continue to render and switch normally.
- [ ] Translation tab visibility follows the feature flag.
- [ ] The scaffold makes translation visibly separate from the existing OpenAI voice-agent tab.
- [ ] Later WebRTC lifecycle cleanup can attach without reworking provider navigation.
