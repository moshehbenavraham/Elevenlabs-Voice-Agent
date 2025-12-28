# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 02 - Advanced Features
**Completed Sessions**: 10 (including 2 in current phase)

---

## Recommended Next Session

**Session ID**: `phase02-session03-reconnection-backoff`
**Session Name**: Reconnection with Exponential Backoff
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 18-24

---

## Why This Session Next?

### Prerequisites Met

- [x] Voice Selection UI complete (phase02-session01)
- [x] Conversation History complete (phase02-session02)
- [x] All three providers (ElevenLabs, xAI, OpenAI) fully integrated
- [x] WebSocket connection patterns established for xAI and OpenAI

### Dependencies

- **Builds on**: phase02-session02-conversation-history (WebSocket infrastructure)
- **Enables**: Robust production deployment, better UX during network issues

### Project Progression

This is the logical next step because:

1. **High-priority item** in the Phase 02 roadmap per CONSIDERATIONS.md
2. **Core reliability feature** - voice applications are sensitive to network interruptions
3. **Foundation for production** - reconnection handling is essential before advanced features like function calling
4. **Shared pattern** - once implemented for one provider, pattern applies to xAI and OpenAI contexts

---

## Session Overview

### Objective

Implement automatic reconnection with exponential backoff for all voice providers to handle network flakiness gracefully.

### Key Deliverables

1. **Reconnection utility hook** (`useReconnection`) with exponential backoff logic
2. **Provider integration** - Apply to XAIVoiceContext and OpenAIVoiceContext
3. **UI feedback** - Show reconnection state to users (attempting, countdown, max retries)
4. **ElevenLabs consideration** - Evaluate SDK's built-in handling vs custom implementation
5. **Testing** - Unit tests for backoff logic and reconnection states

### Scope Summary

- **In Scope (MVP)**:
  - Exponential backoff with jitter (1s, 2s, 4s, 8s... up to 30s max)
  - Maximum retry attempts (5-10)
  - UI indicators for reconnection state
  - Graceful degradation after max retries
  - Network status detection (online/offline events)
- **Out of Scope**:
  - Session resumption/continuation after reconnect
  - Offline mode with queued messages
  - Cross-tab connection sharing

---

## Technical Considerations

### Technologies/Patterns

- React custom hook (`useReconnection`) with configurable options
- `navigator.onLine` and `window.addEventListener('online'/'offline')` for network detection
- WebSocket close event handling (code 1006 for abnormal closure)
- Ref-based retry tracking to avoid stale closure issues

### Potential Challenges

- **State synchronization** - Reconnection state must integrate cleanly with existing provider contexts
- **Race conditions** - Multiple rapid disconnect/reconnect events need proper debouncing
- **ElevenLabs SDK** - May have built-in reconnection; need to investigate SDK behavior
- **User-initiated disconnect** - Don't auto-reconnect if user clicked disconnect

### Relevant Considerations

- [P00] **Single Connection at a Time**: Ensure reconnection respects tab switching - don't reconnect if provider changed
- [P00] **AudioWorklet Thread Model**: Audio context may need re-initialization after reconnect
- [P01] **OpenAI WebSocket Auth**: Ephemeral tokens may expire; need fresh token on reconnect

---

## Alternative Sessions

If this session is blocked:

1. **phase02-session04-function-calling** - Medium priority; can proceed if reconnection is deferred
2. **phase02-session05-config-modals** - Provider-specific configuration UI; independent of reconnection

---

## Implementation Approach

### Backoff Strategy

```typescript
const calculateDelay = (attempt: number, baseDelay = 1000, maxDelay = 30000) => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};
```

### State Machine

```
IDLE → CONNECTED → DISCONNECTED → RECONNECTING → CONNECTED
                              ↳ RECONNECTING → MAX_RETRIES_EXCEEDED
```

### Files to Create/Modify

| File                                          | Action | Description                         |
| --------------------------------------------- | ------ | ----------------------------------- |
| `src/hooks/useReconnection.ts`                | CREATE | Reconnection logic with backoff     |
| `src/contexts/XAIVoiceContext.tsx`            | MODIFY | Integrate reconnection hook         |
| `src/contexts/OpenAIVoiceContext.tsx`         | MODIFY | Integrate reconnection hook         |
| `src/components/voice/ReconnectionStatus.tsx` | CREATE | UI component for reconnection state |
| `src/test/useReconnection.test.ts`            | CREATE | Unit tests for backoff logic        |

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
