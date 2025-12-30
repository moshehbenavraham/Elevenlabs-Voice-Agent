# Session Specification

**Session ID**: `phase03-session04-configuration-modal`
**Phase**: 03 - Testing & Configuration
**Status**: Not Started
**Created**: 2025-12-30

---

## 1. Session Overview

This session creates a unified provider configuration modal that consolidates voice selection, provider settings, and connection diagnostics into a single, accessible interface. The current ConfigurationModal only displays ElevenLabs setup instructions; this refactor transforms it into a comprehensive settings hub for all three voice providers.

The modal replaces the scattered voice selection dropdowns currently embedded in each provider tab with a centralized settings panel. Users can configure voice preferences, view connection status, customize system prompts for OpenAI/xAI, and reset settings to defaults--all from one location.

This session is critical for polish before the final validation phase. A unified configuration experience significantly improves usability, especially when switching between providers or adjusting settings during a voice session.

---

## 2. Objectives

1. Refactor ConfigurationModal to use Radix UI Dialog with proper accessibility (focus trap, Escape to close)
2. Implement tabbed provider settings with voice selection, system prompt editing, and enable/disable toggles
3. Add connection diagnostics panel displaying real-time status for each provider
4. Create settings persistence layer with localStorage and reset-to-defaults functionality

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session03-elevenlabs-reconnection` - Connection resilience patterns
- [x] `phase02-session01-voice-selection` - VoiceSelector component and voiceConfig utilities
- [x] `phase02-session03-reconnection-backoff` - useReconnection hook for status monitoring

### Required Tools/Knowledge

- Radix UI Dialog and Tabs primitives
- Existing VoiceSelector component patterns
- Provider-specific context APIs (VoiceContext, XAIVoiceContext, OpenAIVoiceContext)

### Environment Requirements

- All three providers must be configurable via environment variables
- localStorage available for settings persistence

---

## 4. Scope

### In Scope (MVP)

- Configuration modal component using Radix UI Dialog
- Provider settings tabs (ElevenLabs, OpenAI, xAI)
- Voice selection per provider using existing VoiceSelector component
- System prompt customization for OpenAI and xAI
- Connection status diagnostics (connected, disconnected, reconnecting)
- Settings persistence to localStorage
- Reset to defaults option per provider and global
- Keyboard accessibility (Escape, Tab, Enter/Space)
- Mobile responsive modal design

### Out of Scope (Deferred)

- API key input in browser - _Reason: Security concern; keys stay in .env_
- Backend configuration UI - _Reason: Requires server-side endpoints_
- Provider-specific advanced settings (temperature, etc.) - _Reason: Complexity; defer to future session_
- ElevenLabs voice selection - _Reason: Voices managed via ElevenLabs dashboard_

---

## 5. Technical Approach

### Architecture

The ConfigurationModal becomes a compound component with:

- `ConfigurationModal` (Radix Dialog root) - manages open/close state
- `ProviderSettingsPanel` - tabbed interface for each provider
- `ProviderSettingsTab` - individual provider settings (voice, prompt, status)
- `ConnectionDiagnostics` - displays status for all providers
- `SettingsFooter` - reset and save actions

Settings are stored in localStorage under `voice-agent-settings` key with schema versioning for future migrations.

### Design Patterns

- **Compound Component**: Modal with composable sections for maintainability
- **Controlled Component**: Settings form state managed locally, synced on save
- **Context Integration**: Read provider status from existing contexts; write voice preferences via context actions
- **Optimistic UI**: Settings appear applied immediately, persist on close

### Technology Stack

- Radix UI Dialog ^1.1.1 (already in deps)
- Radix UI Tabs ^1.1.0 (already in deps)
- Radix UI Switch ^1.1.0 (already in deps)
- Existing VoiceSelector component
- localStorage API

---

## 6. Deliverables

### Files to Create

| File                                                | Purpose                            | Est. Lines |
| --------------------------------------------------- | ---------------------------------- | ---------- |
| `src/components/settings/ConfigurationDialog.tsx`   | Main modal using Radix Dialog      | ~80        |
| `src/components/settings/ProviderSettingsPanel.tsx` | Tabbed provider settings container | ~60        |
| `src/components/settings/ProviderSettingsTab.tsx`   | Individual provider settings form  | ~100       |
| `src/components/settings/ConnectionDiagnostics.tsx` | Connection status display          | ~70        |
| `src/components/settings/SettingsFooter.tsx`        | Reset and close actions            | ~40        |
| `src/lib/settingsStorage.ts`                        | localStorage persistence utilities | ~60        |
| `src/test/ConfigurationDialog.test.tsx`             | Modal behavior tests               | ~120       |
| `src/test/settingsStorage.test.ts`                  | Settings persistence tests         | ~80        |

### Files to Modify

| File                                    | Changes                                           | Est. Lines |
| --------------------------------------- | ------------------------------------------------- | ---------- |
| `src/components/ConfigurationModal.tsx` | Deprecate or replace with new ConfigurationDialog | ~-160      |
| `src/pages/Index.tsx`                   | Update modal import and trigger                   | ~10        |
| `src/contexts/OpenAIVoiceContext.tsx`   | Add systemPrompt state and setter                 | ~20        |
| `src/contexts/XAIVoiceContext.tsx`      | Add systemPrompt state and setter                 | ~20        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Modal opens from header settings button
- [ ] Modal closes on Escape key, backdrop click, or close button
- [ ] Voice selection works for OpenAI and xAI providers
- [ ] System prompt can be edited for OpenAI and xAI
- [ ] Connection status displays correctly for all providers
- [ ] Settings persist across page reloads
- [ ] Reset to defaults restores initial voice and prompt values
- [ ] Provider tabs show correct content for each provider

### Testing Requirements

- [ ] Unit tests for ConfigurationDialog open/close behavior
- [ ] Unit tests for settings persistence (save, load, reset)
- [ ] Unit tests for voice selection integration
- [ ] Manual testing on desktop and mobile viewports

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No new ESLint errors or warnings
- [ ] All existing tests pass
- [ ] Accessibility: focus trap, keyboard navigation, ARIA labels

---

## 8. Implementation Notes

### Key Considerations

- Existing ConfigurationModal uses Framer Motion; new component uses Radix Dialog for better accessibility
- VoiceSelector already handles voice selection UI; integrate rather than rebuild
- Provider contexts already persist voice to localStorage; settings layer adds system prompts
- ElevenLabs doesn't support browser-side voice selection (managed via dashboard)

### Potential Challenges

- **State synchronization**: Modal reads from multiple contexts; ensure consistent state on open
  - _Mitigation_: Read context values on modal open, not on every render
- **Mobile keyboard**: System prompt textarea may cause viewport issues on mobile
  - _Mitigation_: Use proper input mode, test on mobile viewport
- **Context dependencies**: Each provider settings tab needs its own context
  - _Mitigation_: Use provider-specific wrapper pattern (XAIProviderSettings, OpenAIProviderSettings)

### Relevant Considerations

- [P00] **Provider-Specific Contexts**: Each provider has dedicated context - modal must read/write to correct context. Use provider-specific wrapper components.
- [P02] **Provider-specific wrapper components**: Follow XAIVoiceSelector, OpenAIConversationPanel pattern for settings tabs.
- [P00] **Environment-based feature flags**: Modal should respect VITE\_\*\_ENABLED flags to show/hide provider tabs.
- [P00] **Radix UI primitives**: Use Dialog, Tabs, Switch for accessibility out of the box.

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- ConfigurationDialog opens when trigger clicked
- ConfigurationDialog closes on Escape key
- ConfigurationDialog closes on backdrop click
- Settings load from localStorage on open
- Settings save to localStorage on close
- Reset button restores default values
- Voice selection updates context state

### Integration Tests

- Full settings flow: open modal, change voice, close, verify persisted
- Provider tab switching maintains correct context

### Manual Testing

- Open modal on desktop (1024px+)
- Open modal on tablet (768px)
- Open modal on mobile (375px)
- Keyboard navigation: Tab through all controls
- Screen reader: Verify ARIA labels announced

### Edge Cases

- Modal opens with no localStorage data (first use)
- Modal opens with corrupted localStorage (graceful fallback)
- Provider disabled via env var (tab hidden)
- Very long system prompt text
- Rapid open/close cycles

---

## 10. Dependencies

### External Libraries

- @radix-ui/react-dialog: ^1.1.1 (existing)
- @radix-ui/react-tabs: ^1.1.0 (existing)
- @radix-ui/react-switch: ^1.1.0 (existing)

### Other Sessions

- **Depends on**: phase02-session01-voice-selection (VoiceSelector, voiceConfig)
- **Depends on**: phase03-session03-elevenlabs-reconnection (connection status patterns)
- **Depended by**: phase03-session05-validation-polish (requires complete UI for final validation)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
