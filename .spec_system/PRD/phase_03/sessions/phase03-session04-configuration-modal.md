# Session 04: Provider Configuration Modal

**Session ID**: `phase03-session04-configuration-modal`
**Status**: Not Started
**Estimated Tasks**: ~20-25
**Estimated Duration**: 3-4 hours

---

## Objective

Create a unified configuration modal for managing provider settings, voice preferences, and displaying connection diagnostics. Consolidate scattered settings into a single, accessible interface.

---

## Scope

### In Scope (MVP)

- Configuration modal component using Radix UI Dialog
- Voice selection per provider (consolidate from VoiceSelector)
- Provider enable/disable toggles
- Connection status diagnostics
- System prompt customization (OpenAI/xAI)
- Settings persistence to localStorage
- Reset to defaults option

### Out of Scope

- API key input in browser (security concern - keep in .env)
- Backend configuration UI
- Provider-specific advanced settings

---

## Prerequisites

- [ ] Session 03 completed (ElevenLabs resilience)
- [ ] All provider voice options documented
- [ ] Existing ConfigurationModal pattern reviewed

---

## Deliverables

1. ConfigurationModal component refactor
2. Provider settings panel per provider
3. Voice preference management
4. Connection diagnostics display
5. Settings persistence layer
6. Keyboard accessibility (Escape to close, Tab navigation)

---

## Success Criteria

- [ ] Modal accessible from header settings button
- [ ] Voice selection works for all 3 providers
- [ ] Settings persist across page reloads
- [ ] Reset to defaults functional
- [ ] Keyboard navigation complete
- [ ] Mobile responsive design
- [ ] Tests for modal interactions
