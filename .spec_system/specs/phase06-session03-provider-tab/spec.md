# Session Specification

**Session ID**: `phase06-session03-provider-tab`
**Phase**: 06 - Retell Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This session creates the RetellProvider component and integrates Retell as the sixth voice provider in the tabbed interface. Building on the completed `useRetellVoice` hook from Session 02, we now wire up the UI layer to expose Retell voice conversations to users.

The implementation follows the proven provider integration pattern established since Phase 00 and refined through Vapi (Phase 05) and Ultravox (Phase 04). Each provider has a dedicated component that wraps shared UI elements (VoiceButton, ConversationPanel) with provider-specific state management. The `useRetellVoice` hook already exposes all necessary state (`callStatus`, `isAgentSpeaking`, `messages`, `activeTranscript`) and actions (`startCall`, `stopCall`, `toggleCall`).

This session completes the frontend integration, enabling users to select the Retell tab and conduct voice conversations with Retell-powered agents. Testing and polish are deferred to Session 04 to maintain focused scope.

---

## 2. Objectives

1. Create `RetellProvider.tsx` component with full voice UI (button, status, transcript display)
2. Register Retell in the provider type system (`ProviderType`, `PROVIDERS`, `isRetellEnabled()`)
3. Integrate with existing tab navigation so Retell appears when enabled
4. Handle unconfigured state with `RetellEmptyState` component

---

## 3. Prerequisites

### Required Sessions

- [x] `phase06-session01-dependencies-backend-setup` - Backend endpoint `/api/retell/create-web-call`
- [x] `phase06-session02-voice-hook-sdk` - `useRetellVoice` hook with SDK integration

### Required Tools/Knowledge

- React functional components with TypeScript
- Retell SDK event model (call_started, call_ended, agent_start_talking, update)
- Existing provider component patterns (VapiProvider, UltravoxProvider)

### Environment Requirements

- `VITE_RETELL_ENABLED=true` to show tab
- `VITE_RETELL_AGENT_ID` for call functionality
- Backend running with `RETELL_API_KEY` configured

---

## 4. Scope

### In Scope (MVP)

- `RetellProvider.tsx` component with RetellButton, RetellVoiceStatus, RetellEmptyState
- `ProviderType` enum addition: `'retell'`
- `isRetellEnabled()` function for feature flag
- `PROVIDERS` config entry with Retell metadata
- `ProviderContext.tsx` update with `'retell'` in providers array and `isValidProvider()`
- `RetellButton` with agent-speaking state visualization (purple/violet color scheme)
- `RetellEmptyState` for when `VITE_RETELL_AGENT_ID` not configured
- `RetellConversationPanel` wrapper for transcript display using messages/activeTranscript
- Tab switching integration (disconnect on tab change)

### Out of Scope (Deferred)

- Unit tests - _Reason: Session 04 scope_
- Integration tests - _Reason: Session 04 scope_
- Metadata event UI display - _Reason: Session 04 enhancement_
- Audio visualization from `audio` event - _Reason: Session 04 enhancement_

---

## 5. Technical Approach

### Architecture

The RetellProvider component follows the established pattern from VapiProvider:

1. Wrapper component (`RetellProvider`) handles cleanup on unmount
2. Button component (`RetellButton`) displays connection state and handles click interactions
3. Status component (`RetellVoiceStatus`) shows detailed connection and speaking state
4. Empty state component (`RetellEmptyState`) shown when agent ID not configured
5. Configuration check functions (`checkRetellConfiguration`, `useRetellConfigured`)

### Design Patterns

- **Provider-specific wrapper pattern**: RetellProvider accesses `useRetellVoice` hook directly, no context bridging needed
- **Color scheme consistency**: Purple/violet theme (matching Retell branding - similar to Vapi but distinct)
- **State mapping**: Map `RetellCallStatus` (IDLE, CONNECTING, CONNECTED, ERROR) to UI states
- **Feature flag pattern**: `VITE_RETELL_ENABLED` toggles tab visibility

### Technology Stack

- React 18.3.1 with TypeScript
- Framer Motion for animations
- lucide-react for icons
- Tailwind CSS for styling
- `useRetellVoice` hook from Session 02

---

## 6. Deliverables

### Files to Create

| File                                          | Purpose                                                  | Est. Lines |
| --------------------------------------------- | -------------------------------------------------------- | ---------- |
| `src/components/providers/RetellProvider.tsx` | Main provider component with button, status, empty state | ~500       |

### Files to Modify

| File                               | Changes                                                                  | Est. Lines |
| ---------------------------------- | ------------------------------------------------------------------------ | ---------- |
| `src/types/voice-provider.ts`      | Add 'retell' to ProviderType, add isRetellEnabled(), add PROVIDERS entry | ~25        |
| `src/contexts/ProviderContext.tsx` | Add 'retell' to providers array and isValidProvider()                    | ~5         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Retell tab appears when `VITE_RETELL_ENABLED=true`
- [ ] Tab displays correct Retell branding and icon
- [ ] Connect/disconnect works via RetellButton click
- [ ] Button visually indicates agent-speaking state (animated glow)
- [ ] Transcript messages display in conversation panel
- [ ] Active/partial transcript shows as typing indicator
- [ ] Empty state shown when `VITE_RETELL_AGENT_ID` not configured
- [ ] Clean tab switching (call disconnected when switching away)

### Testing Requirements

- [ ] Manual testing: Tab visibility with env flag
- [ ] Manual testing: Full call lifecycle (connect, conversation, disconnect)
- [ ] Manual testing: Empty state display
- [ ] Manual testing: Tab switching behavior

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (TypeScript interfaces, descriptive names)
- [ ] No ESLint errors
- [ ] Build succeeds without errors

---

## 8. Implementation Notes

### Key Considerations

- **State Mapping**: `RetellCallStatus.CONNECTED` maps to 'connected', `CONNECTING` to 'loading', etc.
- **Speaking Indicator**: Use `isAgentSpeaking` from hook to animate button and show speaking status
- **Transcript Display**: Combine `messages` array with `activeTranscript` for real-time display
- **Color Scheme**: Use teal/cyan (`hsl(180, ...)`) to distinguish from Vapi's purple/violet
- **Icon Choice**: Consider `Phone` or custom icon for Retell branding

### Potential Challenges

- **Button State Sync**: Ensure `isAgentSpeaking` updates reflect immediately in UI
- **Transcript Accumulation**: Hook handles local accumulation; UI just renders `messages` array
- **Tab Disconnect**: Ensure `stopCall()` is called in cleanup effect when unmounting

### Relevant Considerations

- [P00] **Single Connection at a Time**: Call `stopCall()` in useEffect cleanup when RetellProvider unmounts
- [P00] **Environment-based feature flags**: `VITE_RETELL_ENABLED` follows established pattern
- [P01] **Empty state component for unconfigured providers**: RetellEmptyState shows when agent ID missing
- [P02] **Provider-specific wrapper components**: RetellProvider accesses hook directly, no context bridging

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- _Deferred to Session 04_

### Integration Tests

- _Deferred to Session 04_

### Manual Testing

1. Set `VITE_RETELL_ENABLED=false` - verify Retell tab hidden
2. Set `VITE_RETELL_ENABLED=true` - verify Retell tab appears
3. Remove `VITE_RETELL_AGENT_ID` - verify empty state shows
4. Set valid agent ID - verify button appears
5. Click button - verify connecting state shows
6. Wait for connection - verify connected state shows
7. Speak to agent - verify agent-speaking animation
8. View transcript - verify messages appear with correct roles
9. Click button again - verify disconnect
10. Switch tabs during call - verify clean disconnect

### Edge Cases

- Rapid connect/disconnect clicks
- Tab switch during connecting state
- Network error during call (backend down)
- Invalid agent ID response

---

## 10. Dependencies

### External Libraries

- `retell-client-js-sdk`: Already installed (Session 01)
- `framer-motion`: ^11.15.0 (existing)
- `lucide-react`: ^0.468.0 (existing)

### Other Sessions

- **Depends on**: `phase06-session01-dependencies-backend-setup`, `phase06-session02-voice-hook-sdk`
- **Depended by**: `phase06-session04-testing-polish`

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
