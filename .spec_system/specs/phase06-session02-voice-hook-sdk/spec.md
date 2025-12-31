# Session Specification

**Session ID**: `phase06-session02-voice-hook-sdk`
**Phase**: 06 - Retell Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This session creates the core `useRetellVoice` React hook that encapsulates all interactions with the Retell SDK. The hook will manage call lifecycle (start/stop), handle all SDK events (call_started, call_ended, agent_start_talking, agent_stop_talking, update, error), and maintain local transcript history since the Retell SDK only provides the last 5 sentences.

The hook follows the established pattern from `useVapiVoice.ts`, providing a consistent interface for the voice provider system. This is a prerequisite for Session 03, which will build the UI components that consume this hook.

The Retell SDK uses LiveKit under the hood for WebRTC audio streaming, with event-driven architecture for state updates. Our hook will map Retell's call states to the unified state model (idle, connecting, connected, error) used across all providers.

---

## 2. Objectives

1. Create comprehensive TypeScript type definitions for Retell integration (enums, interfaces, state types)
2. Implement `useRetellVoice` hook with full SDK event handling and state management
3. Build local transcript accumulation system to work around SDK's 5-sentence limit
4. Provide unified state mapping consistent with other voice providers

---

## 3. Prerequisites

### Required Sessions

- [x] `phase06-session01-dependencies-backend-setup` - Backend `/api/retell/create-web-call` endpoint and SDK package

### Required Tools/Knowledge

- React hooks (useState, useEffect, useRef, useCallback)
- EventEmitter pattern for SDK event handling
- TypeScript enum and interface patterns

### Environment Requirements

- `retell-client-js-sdk` v2.0.7 installed
- Backend running with `/api/retell/create-web-call` endpoint
- `VITE_RETELL_ENABLED=true` in environment
- `VITE_API_BASE_URL` configured (default: http://localhost:3001)

---

## 4. Scope

### In Scope (MVP)

- `src/types/retell.ts` - Complete type definitions (enums, interfaces, state types)
- `src/hooks/useRetellVoice.ts` - Main hook with SDK integration
- Event handling: call_started, call_ended, agent_start_talking, agent_stop_talking, update, error
- Local transcript history accumulation (SDK limitation workaround)
- State mapping: Retell states -> unified states (idle, connecting, connected, error)
- Control functions: startCall(), stopCall(), toggleCall()
- Proper cleanup on unmount (remove event listeners)

### Out of Scope (Deferred)

- Provider component UI (`RetellProvider.tsx`) - _Reason: Session 03 scope_
- Tab integration in `ProviderTabs.tsx` - _Reason: Session 03 scope_
- Metadata event handling - _Reason: Session 04 polish scope_
- Audio visualization from raw samples - _Reason: Session 04 polish scope_
- Mute/unmute functionality - _Reason: Session 04 polish scope_

---

## 5. Technical Approach

### Architecture

The hook follows a single-responsibility pattern: manage Retell SDK lifecycle and expose reactive state. It communicates with the backend to obtain access tokens, then uses the SDK's `RetellWebClient` for WebRTC audio streaming via LiveKit.

```
[useRetellVoice Hook]
    |
    +-- Backend API (/api/retell/create-web-call)
    |       |
    |       +-- Returns: { access_token: string }
    |
    +-- RetellWebClient (SDK)
            |
            +-- Events: call_started, call_ended, update, error, etc.
            +-- Methods: startCall(), stopCall(), mute(), unmute()
```

### Design Patterns

- **useRef for event handler values**: Prevents stale closures in WebSocket callbacks (from CONSIDERATIONS.md P02)
- **Local transcript accumulation**: Since SDK only provides last 5 sentences, we accumulate locally
- **State machine pattern**: Clear state transitions (idle -> connecting -> connected -> idle/error)
- **Interface segregation**: Separate state interface from hook return type

### Technology Stack

- `retell-client-js-sdk` v2.0.7 (EventEmitter-based)
- React 18.3.1 (hooks API)
- TypeScript (strict mode)
- Fetch API for backend token requests

---

## 6. Deliverables

### Files to Create

| File                          | Purpose                                           | Est. Lines |
| ----------------------------- | ------------------------------------------------- | ---------- |
| `src/types/retell.ts`         | Type definitions (enums, interfaces, state types) | ~120       |
| `src/hooks/useRetellVoice.ts` | Main voice hook with SDK integration              | ~200       |

### Files to Modify

| File | Changes | Est. Lines |
| ---- | ------- | ---------- |
| None | N/A     | 0          |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Hook initializes without errors when SDK is available
- [ ] `startCall()` fetches token from backend and connects via SDK
- [ ] `stopCall()` cleanly disconnects and resets state
- [ ] `toggleCall()` correctly toggles between connected/disconnected
- [ ] Event handlers correctly update state for all 6 core events
- [ ] Transcript history accumulates beyond SDK's 5-sentence limit
- [ ] State maps correctly: idle, connecting, connected, error
- [ ] Error states are captured and exposed via `error` property

### Testing Requirements

- [ ] Manual testing: start call, speak, verify transcripts appear
- [ ] Manual testing: stop call, verify clean disconnection
- [ ] Manual testing: verify error state on invalid token

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] TypeScript strict mode passes
- [ ] ESLint passes (warnings acceptable per MVP config)
- [ ] No console errors during normal operation

---

## 8. Implementation Notes

### Key Considerations

- Backend must be running for token generation (`/api/retell/create-web-call`)
- SDK uses LiveKit WebRTC under the hood - ensure HTTPS in production
- Access tokens are short-lived; fetch fresh token on each call start

### Potential Challenges

- **Stale closures**: Use useRef pattern for transcript accumulation and handlers
- **SDK event cleanup**: Must remove listeners on unmount to prevent memory leaks
- **Transcript deduplication**: SDK update events may repeat content; track last seen index
- **Connection timing**: Handle rapid start/stop sequences gracefully

### Relevant Considerations

- [P02] **useRef for values in WebSocket handlers**: Avoids stale closures in callbacks. Critical for transcript accumulation.
- [P02] **Fresh token on each reconnect**: Ephemeral tokens may expire; fetch fresh token each call start.
- [P00] **Single Connection at a Time**: Ensure `stopCall()` before new `startCall()` to prevent conflicts.

### Retell SDK Events Reference

| Event                 | Payload | Purpose                              |
| --------------------- | ------- | ------------------------------------ |
| `call_started`        | none    | Call connected successfully          |
| `call_ended`          | none    | Call disconnected                    |
| `call_ready`          | none    | Audio track subscribed               |
| `error`               | string  | Error occurred                       |
| `update`              | object  | Transcript update (last 5 sentences) |
| `agent_start_talking` | none    | Agent started speaking               |
| `agent_stop_talking`  | none    | Agent stopped speaking               |

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Type definitions compile correctly
- Hook initializes with correct default state
- State transitions are correct for each event

### Integration Tests

- Not applicable for this session (no external dependencies mocked)

### Manual Testing

1. Start dev server and backend
2. Navigate to Retell tab (once Session 03 complete, use console for now)
3. Call `startCall()` and verify connection
4. Speak and verify transcripts accumulate
5. Call `stopCall()` and verify clean disconnect
6. Test error handling with invalid agent ID

### Edge Cases

- Rapid start/stop sequences
- Network disconnection during call
- Backend unavailable (token fetch fails)
- SDK initialization failure

---

## 10. Dependencies

### External Libraries

- `retell-client-js-sdk`: v2.0.7 (already installed)
- `eventemitter3`: v5.0.1 (transitive via SDK)
- `livekit-client`: v2.5.1 (transitive via SDK)

### Other Sessions

- **Depends on**: `phase06-session01-dependencies-backend-setup` (backend endpoint)
- **Depended by**: `phase06-session03-provider-tab` (UI components)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
