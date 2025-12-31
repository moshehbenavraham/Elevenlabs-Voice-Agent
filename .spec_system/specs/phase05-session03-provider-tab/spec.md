# Session Specification

**Session ID**: `phase05-session03-provider-tab`
**Phase**: 05 - Vapi Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This session integrates Vapi as the fifth voice provider into the application's tabbed interface. Building upon the `useVapiVoice` hook and SDK infrastructure established in Session 02, this session creates the user-facing components that connect the hook to the existing UI architecture.

The primary deliverables include the `VapiProvider` component wrapper, a custom `VapiButton` with audio-level visualization (glow effect), and an empty state component for unconfigured installations. The session follows the proven provider integration pattern established with xAI, OpenAI, and Ultravox, ensuring consistency across the application.

Upon completion, users will be able to switch to the Vapi tab, initiate voice conversations, see real-time transcripts with typing indicators (via `activeTranscript`), and experience smooth audio-level feedback through the button's visual glow effect.

---

## 2. Objectives

1. Create `VapiProvider.tsx` component that wraps `useVapiVoice` hook and provides voice UI
2. Build `VapiButton.tsx` with color state transitions and audio-level glow visualization
3. Implement `VapiEmptyState.tsx` for unconfigured state (missing VITE_VAPI_WEB_TOKEN)
4. Integrate Vapi into the tabbed provider system with proper branding and icon

---

## 3. Prerequisites

### Required Sessions

- [x] `phase05-session01-dependencies-csp` - Vapi SDK installed, CSP configured
- [x] `phase05-session02-voice-hook` - `useVapiVoice` hook, type definitions, SDK singleton

### Required Tools/Knowledge

- React functional components with TypeScript
- Framer Motion animation patterns
- Existing provider architecture (UltravoxProvider as reference)
- Radix UI Tabs component patterns

### Environment Requirements

- `VITE_VAPI_ENABLED=true` in `.env` for tab visibility
- `VITE_VAPI_WEB_TOKEN` for SDK initialization (or empty state shown)
- Optional: `VITE_VAPI_ASSISTANT_ID` for pre-configured assistant

---

## 4. Scope

### In Scope (MVP)

- `VapiProvider.tsx` component with full hook integration
- `VapiButton.tsx` with idle/loading/active color states
- Audio-level glow effect via CSS box-shadow
- `VapiEmptyState.tsx` with setup instructions
- Add `vapi` to `ProviderType` union type
- Add `isVapiEnabled()` environment check function
- Register Vapi in `PROVIDERS` configuration object
- Update `ProviderContext.tsx` with Vapi provider
- Tab branding with PhoneCall icon from Lucide
- Pass `activeTranscript` to ConversationPanel for typing indicator

### Out of Scope (Deferred)

- Function calling UI - _Reason: Requires additional research on Vapi function call events; session 5.4_
- Configuration modal settings - _Reason: Not MVP; future enhancement_
- Comprehensive unit/integration tests - _Reason: Session 5.4 testing focus_
- Voice selection UI - _Reason: Vapi handles voice via assistant config_

---

## 5. Technical Approach

### Architecture

The Vapi provider follows the established pattern from UltravoxProvider:

1. Context wrapper component (`VapiProvider`) provides state isolation
2. Custom button component (`VapiButton`) handles visual feedback
3. Reuse existing `VoiceStatus` and `ConversationPanel` components
4. Status indicator component (`VapiVoiceStatus`) for connection state

### Design Patterns

- **Provider Pattern**: VapiProvider wraps children with context access
- **Compound Components**: Button, Status, EmptyState as separate composable units
- **Event-Driven State**: Hook exposes state derived from Vapi SDK events
- **CSS Box-Shadow Glow**: Dynamic audio visualization without canvas overhead

### Technology Stack

- React 18.3.1 with TypeScript
- Framer Motion for button animations
- Lucide React for icons (PhoneCall, Mic, Loader2, Square)
- Tailwind CSS with glassmorphism utilities
- Existing shadcn/ui component library

---

## 6. Deliverables

### Files to Create

| File                                        | Purpose                                                                  | Est. Lines |
| ------------------------------------------- | ------------------------------------------------------------------------ | ---------- |
| `src/components/providers/VapiProvider.tsx` | Main provider component with VapiButton, VapiVoiceStatus, VapiEmptyState | ~450       |

### Files to Modify

| File                                         | Changes                                                                | Est. Lines Changed |
| -------------------------------------------- | ---------------------------------------------------------------------- | ------------------ |
| `src/types/voice-provider.ts`                | Add `vapi` to ProviderType, add `isVapiEnabled()`, add PROVIDERS entry | ~25                |
| `src/contexts/ProviderContext.tsx`           | Import and register Vapi provider                                      | ~15                |
| `src/pages/Index.tsx`                        | Add VapiProvider case in provider switch                               | ~20                |
| `src/components/voice/ConversationPanel.tsx` | Add `activeTranscript` prop for typing indicator                       | ~30                |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Vapi tab appears when `VITE_VAPI_ENABLED=true`
- [ ] Tab displays correct branding (PhoneCall icon, "Vapi" name)
- [ ] Connect button initiates voice call via hook
- [ ] Disconnect button ends active call
- [ ] Button color transitions: green (idle) -> orange (loading) -> red (active)
- [ ] Audio level visualized as glow effect intensity on button
- [ ] `activeTranscript` displays as typing indicator in ConversationPanel
- [ ] Empty state shown when `VITE_VAPI_WEB_TOKEN` not configured
- [ ] Tab switching disconnects active Vapi call (single connection pattern)
- [ ] Error states displayed with retry option

### Testing Requirements

- [ ] Manual testing: tab visibility, connect/disconnect, transcript display
- [ ] Verify audio level glow responds to speech
- [ ] Verify empty state appears without token
- [ ] Verify tab switching disconnects call

### Quality Gates

- [ ] All files ASCII-encoded (0-127)
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] ESLint passes (`npm run lint`)
- [ ] Component follows UltravoxProvider patterns for consistency

---

## 8. Implementation Notes

### Key Considerations

- Use `PhoneCall` icon from Lucide for Vapi branding (distinguishes from other providers)
- Audio level glow: map `audioLevel` (0-1) to box-shadow spread/opacity
- Follow UltravoxProvider color scheme conventions (consider purple/violet for Vapi)
- Ensure proper cleanup when component unmounts (hook handles this)

### Potential Challenges

- **activeTranscript prop drilling**: ConversationPanel may need interface extension to accept partial transcript
  - _Mitigation_: Add optional `activeTranscript` prop that renders as typing indicator bubble
- **Provider context coordination**: Must disconnect Vapi when switching tabs
  - _Mitigation_: Use `onDisconnect` prop pattern from UltravoxProvider
- **Button styling consistency**: Match existing provider aesthetics while being distinct
  - _Mitigation_: Use consistent size/animation patterns, unique color scheme (suggest purple/violet)

### Relevant Considerations

- [P00] **Single Connection at a Time**: Disconnect active provider before switching tabs. Implement via `onDisconnect` callback from provider context.
- [P00] **Provider-Specific Contexts**: Each provider has dedicated context for isolation. Vapi follows same pattern.
- [P01] **Empty state component for unconfigured providers**: VapiEmptyState provides clear setup instructions when token missing.
- [P02] **Provider-specific wrapper components**: VapiProvider pattern follows XAIVoiceSelector, UltravoxProvider precedent.

### ASCII Reminder

All output files must use ASCII-only characters (0-127). Avoid smart quotes, em-dashes, and non-ASCII Unicode.

---

## 9. Testing Strategy

### Unit Tests

- (Deferred to session 5.4)

### Integration Tests

- (Deferred to session 5.4)

### Manual Testing

- Tab visibility toggle via `VITE_VAPI_ENABLED` environment variable
- Connect/disconnect flow with valid `VITE_VAPI_WEB_TOKEN`
- Button color state transitions during call lifecycle
- Audio level glow responsiveness during speech
- Transcript display including partial transcript typing indicator
- Empty state display when token not configured
- Tab switching disconnects active call
- Error display and recovery flow

### Edge Cases

- Rapid connect/disconnect button clicks (debounce handling)
- Network disconnection during active call
- Invalid or expired web token
- Missing assistant configuration (should use inline defaults)
- Tab switch during loading state

---

## 10. Dependencies

### External Libraries

- `@vapi-ai/web`: ^1.0.255 (already installed in session 01)
- `framer-motion`: existing (animations)
- `lucide-react`: existing (icons)

### Other Sessions

- **Depends on**: phase05-session01-dependencies-csp, phase05-session02-voice-hook
- **Depended by**: phase05-session04-testing-polish

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
