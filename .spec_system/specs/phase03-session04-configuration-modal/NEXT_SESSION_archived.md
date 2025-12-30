# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-30
**Project State**: Phase 03 - Testing & Configuration
**Completed Sessions**: 16

---

## Recommended Next Session

**Session ID**: `phase03-session04-configuration-modal`
**Session Name**: Provider Configuration Modal
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: 20-25

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 03 completed (ElevenLabs reconnection resilience)
- [x] All three providers functional (ElevenLabs, OpenAI, xAI)
- [x] E2E test infrastructure in place
- [x] Voice selection patterns established from Phase 02

### Dependencies

- **Builds on**: phase03-session03-elevenlabs-reconnection (connection resilience)
- **Enables**: phase03-session05-validation-polish (final validation requires complete UI)

### Project Progression

This is the natural next step in Phase 03. Sessions 01-03 established testing infrastructure and connection resilience. Session 04 creates a unified configuration interface that consolidates scattered settings (voice selection, provider toggles, diagnostics) into a single modal. This provides a polished user experience before the final validation session.

---

## Session Overview

### Objective

Create a unified configuration modal for managing provider settings, voice preferences, and displaying connection diagnostics. Consolidate scattered settings into a single, accessible interface.

### Key Deliverables

1. Refactored ConfigurationModal component using Radix UI Dialog
2. Provider settings panel per provider (voice selection, enable/disable)
3. Connection diagnostics display
4. System prompt customization for OpenAI/xAI
5. Settings persistence to localStorage with reset option
6. Full keyboard accessibility

### Scope Summary

- **In Scope (MVP)**: Configuration modal, voice selection consolidation, provider toggles, connection diagnostics, settings persistence, reset to defaults
- **Out of Scope**: API key input in browser, backend configuration UI, provider-specific advanced settings

---

## Technical Considerations

### Technologies/Patterns

- Radix UI Dialog for modal implementation
- Radix UI Tabs for provider settings sections
- localStorage for settings persistence
- Existing VoiceSelector pattern as reference

### Potential Challenges

- Consolidating VoiceSelector without breaking provider-specific contexts
- Managing settings state across multiple providers
- Ensuring mobile-responsive modal design

### Relevant Considerations

- [P00] **Provider-Specific Contexts**: Each provider has dedicated context - modal must read/write to correct context
- [P02] **Provider-specific wrapper components**: Follow XAIVoiceSelector, OpenAIConversationPanel pattern
- [P00] **Environment-based feature flags**: Modal should respect VITE\_\*\_ENABLED flags

---

## Alternative Sessions

If this session is blocked:

1. **phase03-session05-validation-polish** - Could run partial validation on existing features if modal work is blocked
2. **Phase 04 research** - Begin Ultravox research while modal issues are resolved

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
