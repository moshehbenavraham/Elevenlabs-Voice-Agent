# Session Specification

**Session ID**: `phase02-session01-voice-selection`
**Phase**: 02 - Advanced Features
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements a voice selection UI that allows users to choose from available voices for the OpenAI and xAI providers. Currently, both contexts use hardcoded voice values from environment variables (`OPENAI_VOICE`, `XAI_VOICE`), which limits user customization.

The implementation will add a VoiceSelector dropdown component integrated into each provider tab, with selections persisting to localStorage and applied via the `session.update` WebSocket message when connecting. This is a high-priority item from the Phase 02 roadmap that directly enhances user experience without requiring new infrastructure.

ElevenLabs voice selection is explicitly out of scope since that provider uses Agent-level configuration rather than session-level voice selection.

---

## 2. Objectives

1. Create a reusable VoiceSelector component using Radix UI Select primitive
2. Add voice state management to OpenAIVoiceContext and XAIVoiceContext
3. Persist selected voice per provider to localStorage
4. Apply selected voice during session.update WebSocket message

---

## 3. Prerequisites

### Required Sessions
- [x] `phase01-session04-openai-polish` - Three-provider architecture working

### Required Tools/Knowledge
- Radix UI Select component API
- WebSocket session.update message format (documented in Phase 01 research)
- localStorage persistence pattern (established in Phase 00)

### Environment Requirements
- OpenAI API key configured in .env
- xAI API key configured in .env

---

## 4. Scope

### In Scope (MVP)
- VoiceSelector dropdown component with Radix UI Select
- OpenAI voice options: alloy, ash, ballad, coral, echo, sage, shimmer, verse
- xAI voice options: Same voice set (compatible API format)
- localStorage persistence per provider (`openai-voice`, `xai-voice`)
- Dynamic voice application in session.update message
- Visual display of current voice selection in provider tabs

### Out of Scope (Deferred)
- ElevenLabs voice selection - *Reason: Uses Agent configuration, not session.update*
- Voice preview/sample playback - *Reason: Phase 02 stretch goal*
- Custom voice cloning - *Reason: Not supported by current provider APIs*
- Voice settings in ConfigurationModal - *Reason: Keeping UI simple for MVP*

---

## 5. Technical Approach

### Architecture
The VoiceSelector component will be provider-agnostic, receiving voice options and callbacks as props. Each provider context will manage its own voice state, initialized from localStorage with fallback to defaults. The voice value is passed to the session.update WebSocket message during connection.

### Design Patterns
- **Provider-specific state isolation**: Voice state lives in each context, not a shared store
- **localStorage with lazy initialization**: useState with initializer function for synchronous localStorage read
- **Controlled component pattern**: VoiceSelector receives value and onChange, context owns the state

### Technology Stack
- Radix UI Select (`@radix-ui/react-select`) - Already in dependencies
- localStorage Web API
- TypeScript interfaces for voice types

---

## 6. Deliverables

### Files to Create
| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/components/voice/VoiceSelector.tsx` | Reusable voice dropdown component | ~80 |
| `src/lib/voiceConfig.ts` | Voice options constants and types | ~40 |

### Files to Modify
| File | Changes | Est. Lines Changed |
|------|---------|------------|
| `src/contexts/OpenAIVoiceContext.tsx` | Add selectedVoice state, setVoice action, localStorage persistence, use in session.update | ~30 |
| `src/contexts/XAIVoiceContext.tsx` | Add selectedVoice state, setVoice action, localStorage persistence, use in session.update | ~30 |
| `src/components/providers/OpenAIProvider.tsx` | Integrate VoiceSelector component | ~15 |
| `src/components/providers/XAIProvider.tsx` | Integrate VoiceSelector component | ~15 |

---

## 7. Success Criteria

### Functional Requirements
- [ ] Voice selector visible in OpenAI provider tab when not connected
- [ ] Voice selector visible in xAI provider tab when not connected
- [ ] Voice selection changes actual voice in conversation
- [ ] Selected voice persists across page reloads
- [ ] Default voice (alloy for OpenAI, verse for xAI) works when no selection made
- [ ] Selector is disabled during active connection

### Testing Requirements
- [ ] Unit tests for VoiceSelector component
- [ ] Unit tests for voiceConfig utilities
- [ ] Manual testing with both providers

### Quality Gates
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No new lint warnings
- [ ] Build passes without errors

---

## 8. Implementation Notes

### Key Considerations
- Voice selection must happen BEFORE connecting (cannot change mid-session)
- Disable selector when connected to prevent confusion
- Keep voice options as constants to avoid API calls
- Use same glassmorphism styling as existing UI components

### Potential Challenges
- **xAI voice parity**: Assume same voice options as OpenAI; if different, handle gracefully with fallbacks
- **UI placement**: Must fit in provider tab without cluttering; place near connect button
- **State sync**: If voice changes while connected, don't apply until next connection

### Relevant Considerations
- [P00] **localStorage for persistence**: Provider selection pattern already established, extend for voice
- [P00] **Radix UI for accessibility**: Use Radix Select primitive for keyboard navigation
- [P01] **OpenAI voice options**: alloy, ash, ballad, coral, echo, sage, shimmer, verse - well documented
- [P00] **Provider-Specific Contexts**: Extend OpenAIVoiceContext and XAIVoiceContext with voice state

### ASCII Reminder
All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests
- VoiceSelector renders with correct voice options
- VoiceSelector calls onChange with selected value
- VoiceSelector shows current selection
- voiceConfig exports correct voice lists

### Integration Tests
- Voice context initializes from localStorage
- Voice context updates localStorage on change
- Voice value is passed to session.update message

### Manual Testing
- Select voice in OpenAI tab, refresh, verify persisted
- Select voice in xAI tab, refresh, verify persisted
- Connect with selected voice, verify voice in conversation
- Switch voices between connections, verify new voice applied

### Edge Cases
- No localStorage value (use default)
- Invalid localStorage value (use default)
- Corrupted localStorage (use default)
- Switching providers with different voice selections

---

## 10. Dependencies

### External Libraries
- `@radix-ui/react-select`: Already installed (part of shadcn/ui)

### Other Sessions
- **Depends on**: phase01-session04-openai-polish (three-provider architecture)
- **Depended by**: phase02-session05-polish (may refine voice UI)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
