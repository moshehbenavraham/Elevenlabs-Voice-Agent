# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-31
**Project State**: Phase 06 - Retell Voice Agent
**Completed Sessions**: 28 total (2 in current phase)

---

## Recommended Next Session

**Session ID**: `phase06-session03-provider-tab`
**Session Name**: Provider Component & Tab Integration
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 12-18

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 02 completed (`useRetellVoice` hook working)
- [x] Existing tab system functional (since Phase 00)
- [x] VoiceButton, VoiceStatus, ConversationPanel components available (since Phase 02)

### Dependencies

- **Builds on**: `phase06-session02-voice-hook-sdk` (hook provides all state/actions)
- **Enables**: `phase06-session04-testing-polish` (tests require UI components)

### Project Progression

This follows the proven **research -> backend -> frontend -> polish** pattern established in Phase 01. With the backend (Session 01) and voice hook (Session 02) complete, the UI layer is the natural next step. The `useRetellVoice` hook exposes all necessary state (`isAgentTalking`, `latestTranscript`, `status`) and actions (`startCall`, `stopCall`, `toggleCall`) - Session 03 wires this to the visual components.

---

## Session Overview

### Objective

Create `RetellProvider` component using `useRetellVoice` hook, integrate with existing tab system, and wire up shared voice UI components.

### Key Deliverables

1. `src/components/providers/RetellProvider.tsx` - Main provider component with full UI
2. Updated `src/types/voice-provider.ts` with Retell type and `isRetellEnabled()`
3. Updated `ProviderContext.tsx` with Retell provider registration
4. Retell branding/icon integration

### Scope Summary

- **In Scope (MVP)**: RetellProvider component, ProviderType enum update, isRetellEnabled() function, PROVIDERS config update, RetellButton with talking state, RetellEmptyState for unconfigured state, transcript display in ConversationPanel
- **Out of Scope**: Unit tests (Session 04), integration tests (Session 04), metadata event UI (Session 04), audio visualization from audio event (Session 04)

---

## Technical Considerations

### Technologies/Patterns

- React functional component with `useRetellVoice` hook
- Existing VoiceButton, VoiceStatus, ConversationPanel components (or Retell-specific wrappers)
- Environment-based feature flag: `VITE_RETELL_ENABLED`
- Provider-specific wrapper pattern (RetellConversationPanel accessing hook directly)

### Potential Challenges

- **Button state visualization**: Map `isAgentTalking` boolean to visual indicator (follow existing provider patterns)
- **Empty state handling**: Create RetellEmptyState component for when `VITE_RETELL_AGENT_ID` not configured
- **Tab switching**: Ensure clean disconnect when switching away from Retell tab

### Relevant Considerations

- [P00] **Single Connection at a Time**: Disconnect active provider before switching tabs to prevent resource conflicts
- [P00] **Environment-based feature flags**: VITE_RETELL_ENABLED pattern cleanly toggles provider availability
- [P01] **Empty state component for unconfigured providers**: Clear setup instructions when API key missing
- [P02] **Provider-specific wrapper components**: Pattern used for XAIVoiceSelector, OpenAIConversationPanel - each accesses its own context automatically

---

## Alternative Sessions

If this session is blocked:

1. **phase06-session04-testing-polish** - Could write hook tests first, but UI tests require Session 03 components
2. **New Phase 07** - Could start next provider integration, but Phase 06 should complete first

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
