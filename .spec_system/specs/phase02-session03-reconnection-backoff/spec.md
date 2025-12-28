# Session Specification

**Session ID**: `phase02-session03-reconnection-backoff`
**Phase**: 02 - Advanced Features
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements automatic reconnection with exponential backoff for all voice providers (xAI and OpenAI) to handle network interruptions gracefully. Network connectivity issues are inevitable in production voice applications, and users expect seamless recovery without manual intervention.

The reconnection system will detect abnormal WebSocket closures, automatically attempt to re-establish connections with progressively increasing delays (exponential backoff with jitter), and provide clear visual feedback to users throughout the process. This is a critical reliability feature that transforms the application from a demo-quality experience to a production-ready voice platform.

This session builds directly on the WebSocket infrastructure established in previous sessions (xAI in phase00-session03, OpenAI in phase01-session03) and enables future production deployment by ensuring robust connection handling.

---

## 2. Objectives

1. Implement a reusable `useReconnection` hook with exponential backoff algorithm and jitter
2. Integrate reconnection logic into `XAIVoiceContext` and `OpenAIVoiceContext` for automatic recovery
3. Create visual reconnection status UI that informs users of connection state and retry progress
4. Ensure intentional disconnects (user-initiated, tab switching) do not trigger reconnection

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session03-xai-frontend` - Established xAI WebSocket patterns
- [x] `phase01-session03-openai-frontend` - Established OpenAI WebSocket patterns
- [x] `phase02-session02-conversation-history` - Current WebSocket infrastructure baseline

### Required Tools/Knowledge

- Understanding of WebSocket close event codes (1000, 1006, 1011)
- Familiarity with exponential backoff algorithms
- Knowledge of React custom hooks and ref patterns for async state

### Environment Requirements

- Node.js development environment
- Access to xAI and OpenAI API keys for testing
- Network throttling tools (browser DevTools) for testing reconnection

---

## 4. Scope

### In Scope (MVP)

- Exponential backoff with jitter (1s, 2s, 4s, 8s... up to 30s max delay)
- Maximum retry attempts (5 attempts before giving up)
- Automatic reconnection on abnormal WebSocket closure (code 1006)
- Visual indicators for reconnection state (attempting, countdown, max retries)
- Manual reconnect button after max retries exceeded
- Network status detection using browser online/offline events
- Fresh token fetch on reconnect (ephemeral tokens may expire)
- Graceful handling of user-initiated disconnect (no auto-reconnect)

### Out of Scope (Deferred)

- Session state restoration after reconnect - _Reason: Conversation resumes fresh; complex state sync deferred_
- Offline mode with queued messages - _Reason: Adds significant complexity; not MVP_
- Cross-tab connection sharing - _Reason: Architecture change; consider in future phase_
- Network quality indicators - _Reason: Nice-to-have UX; not critical for reliability_
- ElevenLabs reconnection - _Reason: SDK may handle internally; investigate separately_

---

## 5. Technical Approach

### Architecture

The reconnection system follows a composable hook pattern:

```
useReconnection (generic logic)
    |
    +-- XAIVoiceContext (provider-specific integration)
    |
    +-- OpenAIVoiceContext (provider-specific integration)
    |
    +-- ReconnectionStatus (shared UI component)
```

The `useReconnection` hook encapsulates all backoff logic and exposes a simple API for providers to integrate. Each provider context calls the hook's methods when WebSocket events occur.

### Design Patterns

- **Custom Hook Pattern**: Encapsulate reconnection logic in `useReconnection` for reuse
- **State Machine**: IDLE -> CONNECTED -> DISCONNECTED -> RECONNECTING -> CONNECTED/MAX_RETRIES
- **Ref Pattern**: Use refs to track retry count and timers to avoid stale closure issues
- **Observer Pattern**: Subscribe to browser online/offline events for network awareness

### Technology Stack

- React 18.3.1 with TypeScript
- Native WebSocket API (already in use)
- Browser Events: `navigator.onLine`, `window.addEventListener('online'|'offline')`
- Existing provider contexts and audio utilities

---

## 6. Deliverables

### Files to Create

| File                                          | Purpose                                                            | Est. Lines |
| --------------------------------------------- | ------------------------------------------------------------------ | ---------- |
| `src/hooks/useReconnection.ts`                | Reconnection hook with exponential backoff, jitter, retry tracking | ~120       |
| `src/components/voice/ReconnectionStatus.tsx` | UI component showing reconnection state, countdown, retry button   | ~80        |
| `src/test/useReconnection.test.ts`            | Unit tests for backoff calculation, state transitions, edge cases  | ~150       |

### Files to Modify

| File                                   | Changes                                                                          | Est. Lines |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------- |
| `src/contexts/XAIVoiceContext.tsx`     | Integrate useReconnection, handle WebSocket close events, add reconnection state | ~40        |
| `src/contexts/OpenAIVoiceContext.tsx`  | Integrate useReconnection, handle WebSocket close events, add reconnection state | ~40        |
| `src/components/voice/VoiceStatus.tsx` | Import and render ReconnectionStatus when applicable                             | ~15        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] WebSocket abnormal closure (code 1006) triggers automatic reconnection
- [ ] Backoff delay doubles with each attempt (1s, 2s, 4s, 8s, 16s, capped at 30s)
- [ ] Jitter (0-30%) prevents thundering herd on server recovery
- [ ] Maximum 5 retry attempts before showing "max retries exceeded" state
- [ ] User-initiated disconnect does not trigger reconnection
- [ ] Tab switch (provider change) does not trigger reconnection for inactive provider
- [ ] Fresh ephemeral token is fetched on each reconnection attempt
- [ ] Browser going offline pauses reconnection; coming online resumes
- [ ] Manual reconnect button works after max retries exceeded
- [ ] Reconnection status UI clearly shows attempt count and countdown

### Testing Requirements

- [ ] Unit tests for `calculateBackoff` function with edge cases
- [ ] Unit tests for state machine transitions
- [ ] Unit tests for jitter range validation
- [ ] Manual testing: disconnect network, verify auto-reconnect
- [ ] Manual testing: click disconnect, verify no auto-reconnect
- [ ] Manual testing: exceed max retries, verify manual reconnect works

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No new ESLint warnings introduced
- [ ] TypeScript strict mode passes

---

## 8. Implementation Notes

### Key Considerations

- WebSocket close code 1000 indicates intentional closure - do not reconnect
- WebSocket close code 1006 indicates abnormal closure - trigger reconnection
- Use refs for retry count and timer IDs to avoid stale closure issues in async callbacks
- Clear any pending reconnection timers when user intentionally disconnects
- Ephemeral tokens have limited TTL; always fetch fresh token on reconnect

### Potential Challenges

- **Race conditions**: Multiple rapid disconnect/reconnect events need debouncing. _Mitigation_: Use single active timer ref, clear before setting new.
- **State synchronization**: Reconnection state must integrate cleanly with existing provider state. _Mitigation_: Extend existing state interfaces rather than parallel state.
- **Token expiry mid-reconnect**: Token may expire during backoff wait. _Mitigation_: Fetch fresh token immediately before each reconnect attempt, not during backoff.
- **Provider switching during reconnect**: User may switch tabs while reconnecting. _Mitigation_: Check if provider is still active before reconnecting.

### Relevant Considerations

- [P00] **Single Connection at a Time**: Ensure reconnection respects provider switching - abort reconnection if user changed provider
- [P00] **AudioWorklet Thread Model**: Audio context may need re-initialization after reconnect; test thoroughly
- [P01] **OpenAI WebSocket Auth**: Ephemeral tokens have TTL; fetch fresh token on each reconnect attempt

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- `calculateBackoff(attempt)` returns correct delay for attempts 0-5
- `calculateBackoff(attempt)` caps at maxDelay (30000ms)
- Jitter adds 0-30% variability to base delay
- State transitions: IDLE -> CONNECTED -> DISCONNECTED -> RECONNECTING
- `shouldReconnect(closeCode)` returns true for 1006, false for 1000
- Retry counter increments correctly
- Timer cleanup on intentional disconnect

### Integration Tests

- Mock WebSocket with simulated disconnect/reconnect cycle
- Verify UI updates during reconnection flow
- Verify fresh token fetch on reconnect

### Manual Testing

- [ ] Start voice session, disconnect network, observe auto-reconnect attempts
- [ ] Verify countdown timer displays correctly
- [ ] Let max retries exceed, verify manual reconnect button appears
- [ ] Click manual reconnect, verify new session starts
- [ ] Click disconnect button, verify no auto-reconnect
- [ ] Switch provider tabs during reconnection, verify clean abort
- [ ] Test with browser going offline then online

### Edge Cases

- Reconnection attempt during component unmount
- Multiple WebSocket close events in rapid succession
- Browser going offline during active reconnection backoff
- Provider switch while reconnection is pending

---

## 10. Dependencies

### External Libraries

- None new - uses existing project dependencies

### Internal Dependencies

- `src/contexts/XAIVoiceContext.tsx` - xAI provider integration
- `src/contexts/OpenAIVoiceContext.tsx` - OpenAI provider integration
- `src/lib/audioUtils.ts` - Audio utilities (no changes expected)
- `src/components/voice/VoiceStatus.tsx` - Status display integration

### Other Sessions

- **Depends on**: phase02-session02-conversation-history (current baseline)
- **Depended by**: phase02-session04-function-calling (stable connection required)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
