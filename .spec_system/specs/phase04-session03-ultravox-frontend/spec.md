# Session Specification

**Session ID**: `phase04-session03-ultravox-frontend`
**Phase**: 04 - Deployment & New Providers
**Status**: Not Started
**Created**: 2025-12-30

---

## 1. Session Overview

This session implements the Ultravox voice provider frontend integration, completing the fourth voice provider in the application. With the backend `/api/ultravox/call` endpoint already implemented in session 02, this session focuses on creating the React context, provider component, and tab integration.

Ultravox differs from xAI and OpenAI in that it uses a higher-level SDK (`ultravox-client`) that handles audio streaming internally, rather than raw WebSocket connections. This simplifies the implementation but requires adapting our existing patterns to the SDK's event-driven architecture. The session leverages the proven provider pattern established with xAI and OpenAI, expecting ~80% code reuse as documented in CONSIDERATIONS.md.

The deliverables enable users to interact with Ultravox voice AI through the existing tabbed interface, with full transcript display and status indicators matching the established UX patterns.

---

## 2. Objectives

1. Create `UltravoxVoiceContext.tsx` with session lifecycle management using the `ultravox-client` SDK
2. Create `UltravoxProvider.tsx` component integrating with existing VoiceButton and VoiceStatus components
3. Add Ultravox as the fifth tab in the provider selection system with proper enable/disable logic
4. Implement real-time transcript capture and display via ConversationPanel integration

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session02-ultravox-backend` - Backend `/api/ultravox/call` endpoint ready

### Required Tools/Knowledge

- `ultravox-client` npm package (already installed per session 02)
- Understanding of Ultravox SDK event model (status, transcript events)
- React Context pattern matching existing providers

### Environment Requirements

- `ULTRAVOX_API_KEY` configured in server `.env` (confirmed present)
- `VITE_ULTRAVOX_ENABLED` environment variable for tab visibility

---

## 4. Scope

### In Scope (MVP)

- UltravoxSession lifecycle (create call via backend, join, leave)
- Status event handling with mapping to unified state (idle, connecting, connected)
- Transcript event handling with real-time message updates
- Mic mute/unmute toggle via SDK
- Integration with existing VoiceButton, VoiceStatus, ConversationPanel components
- Tab registration with Ultravox branding and enable flag
- Empty state component for unconfigured Ultravox provider
- Health check hook (`useUltravoxConfigured`)

### Out of Scope (Deferred)

- Client-side tool registration (function calling) - _Reason: Session 04 polish_
- Voice selection UI - _Reason: Need to verify available voices_
- Reconnection with exponential backoff - _Reason: Session 04 polish_
- Comprehensive unit tests - _Reason: Session 04 polish_
- Audio visualization via AnalyserNode - _Reason: SDK handles audio internally_

---

## 5. Technical Approach

### Architecture

The implementation follows the established provider pattern: a dedicated React Context (`UltravoxVoiceContext`) manages session state and exposes actions via hooks, while a Provider component (`UltravoxProvider`) wires the context to shared UI components.

Unlike xAI/OpenAI which use raw WebSockets with manual audio encoding, Ultravox uses the `ultravox-client` SDK which:

- Handles audio streaming internally (no AudioWorklet needed)
- Provides event-based status updates
- Manages transcript capture automatically
- Requires a `joinUrl` from our backend instead of direct token auth

### Design Patterns

- **Provider Context Pattern**: Isolated state per provider (matches VoiceContext, XAIVoiceContext, OpenAIVoiceContext)
- **Event-Driven State Machine**: Map Ultravox SDK status events to unified ConnectionStatus
- **Compound Components**: Provider wrapper + context hook pattern

### Technology Stack

- `ultravox-client` SDK (handles WebSocket and audio internally)
- React Context API for state management
- TypeScript with strict typing
- Existing shadcn/ui components (Button, ScrollArea)

---

## 6. Deliverables

### Files to Create

| File                                            | Purpose                             | Est. Lines |
| ----------------------------------------------- | ----------------------------------- | ---------- |
| `src/types/ultravox.ts`                         | Ultravox-specific type definitions  | ~50        |
| `src/contexts/UltravoxVoiceContext.tsx`         | Session management context          | ~350       |
| `src/components/providers/UltravoxProvider.tsx` | Provider wrapper with UI components | ~450       |
| `src/hooks/useUltravoxVoice.ts`                 | Custom hook for accessing context   | ~25        |

### Files to Modify

| File                               | Changes                                                      | Est. Lines Changed |
| ---------------------------------- | ------------------------------------------------------------ | ------------------ |
| `src/types/voice-provider.ts`      | Add 'ultravox' to ProviderType union, add PROVIDERS entry    | ~25                |
| `src/contexts/ProviderContext.tsx` | Add 'ultravox' to validation, providers array                | ~10                |
| `src/pages/Index.tsx`              | Import and render UltravoxProvider in tab content            | ~15                |
| `.env.example`                     | Add VITE_ULTRAVOX_ENABLED and ULTRAVOX_API_KEY documentation | ~5                 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Ultravox tab appears when `VITE_ULTRAVOX_ENABLED=true`
- [ ] Connect button successfully creates call and joins session
- [ ] Disconnect button cleanly leaves session and resets state
- [ ] Status displays correct states: idle, connecting, connected (listening/thinking/speaking)
- [ ] User and assistant transcripts display in ConversationPanel
- [ ] Mic mute toggle works via SDK method
- [ ] Tab switching disconnects active Ultravox session
- [ ] Empty state shows when API key not configured

### Testing Requirements

- [ ] Manual testing of full voice conversation flow
- [ ] Manual testing of connect/disconnect cycle
- [ ] Manual testing of tab switching behavior
- [ ] Manual verification of transcript display

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (TypeScript interfaces, function components)
- [ ] No ESLint errors (warnings acceptable per MVP config)
- [ ] Build completes without errors

---

## 8. Implementation Notes

### Key Considerations

- Ultravox SDK handles audio internally - no need for AudioContext, AudioWorklet, or PCM encoding
- The `joinUrl` from backend is passed to `UltravoxSession.joinCall()`
- Status mapping: `disconnected`/`disconnecting` -> idle, `connecting` -> connecting, `idle`/`listening`/`thinking`/`speaking` -> connected
- Ultravox transcript events provide both user and agent text

### Potential Challenges

- **SDK Type Definitions**: May need to create/augment types if `ultravox-client` lacks complete TypeScript definitions
- **Status Granularity**: Ultravox has more granular states (listening, thinking, speaking) - map to unified state while preserving detail for UI
- **Event Cleanup**: Ensure all event listeners are properly removed on unmount/disconnect

### Relevant Considerations

<!-- From CONSIDERATIONS.md -->

- [P00] **Provider-Specific Contexts**: Maintain isolation pattern - UltravoxVoiceContext is independent from other providers
- [P00] **Single Connection at a Time**: Disconnect Ultravox when switching tabs (handled by existing ProviderContext pattern)
- [P01] **~80% Code Reuse for New Providers**: Expect significant structure reuse from XAIVoiceContext/XAIProvider
- [P01] **Empty state component for unconfigured providers**: Show setup instructions when ULTRAVOX_API_KEY missing

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Deferred to session 04 (polish phase)

### Integration Tests

- Deferred to session 04 (polish phase)

### Manual Testing

- Start dev server with `VITE_ULTRAVOX_ENABLED=true`
- Verify Ultravox tab appears in UI
- Click connect and verify session starts
- Speak and verify user transcript appears
- Verify assistant response and transcript
- Test mic mute/unmute toggle
- Test disconnect and verify clean state reset
- Switch tabs and verify Ultravox disconnects
- Test with missing API key to verify empty state

### Edge Cases

- Backend unreachable - should show connection error
- API key invalid - should show authentication error
- Session timeout - should handle gracefully
- Rapid connect/disconnect - should not cause state issues
- Tab switch while connecting - should cancel and clean up

---

## 10. Dependencies

### External Libraries

- `ultravox-client`: SDK for Ultravox voice connections (already installed)

### Other Sessions

- **Depends on**: `phase04-session02-ultravox-backend` - Backend API endpoint
- **Depended by**: `phase04-session04-ultravox-polish` - Function calling, reconnection, tests

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
