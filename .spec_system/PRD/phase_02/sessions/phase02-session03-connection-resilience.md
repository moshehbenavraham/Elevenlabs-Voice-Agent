# Session 03: Connection Resilience

**Session ID**: `phase02-session03-connection-resilience`
**Status**: Not Started
**Estimated Tasks**: ~18
**Estimated Duration**: 2-4 hours

---

## Objective

Implement automatic reconnection with exponential backoff to handle network interruptions gracefully, improving reliability of voice conversations.

---

## Scope

### In Scope (MVP)

- Automatic reconnection on WebSocket disconnect
- Exponential backoff algorithm (e.g., 1s, 2s, 4s, 8s, max 30s)
- Visual reconnection status indicator
- Maximum retry limit with user notification
- Manual reconnect button after max retries
- Graceful cleanup on intentional disconnect

### Out of Scope

- Session state restoration after reconnect (conversation resumes fresh)
- Offline mode or message queuing
- Network quality indicators
- Multi-region failover

---

## Prerequisites

- [ ] Understanding of WebSocket close event codes
- [ ] Review current disconnect handling in provider contexts
- [ ] Identify edge cases (token expiry during reconnect)

---

## Deliverables

1. `useReconnection.ts` hook with backoff logic
2. Updated provider contexts with reconnection state
3. Enhanced `VoiceStatus.tsx` with reconnection indicators
4. User notification for connection failures
5. Manual reconnect action after max retries

---

## Technical Notes

### Exponential Backoff Algorithm

```typescript
const calculateBackoff = (attempt: number, maxDelay = 30000) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};
```

### WebSocket Close Codes

- 1000: Normal closure (intentional)
- 1001: Going away
- 1006: Abnormal closure (network issue)
- 1011: Unexpected error

### Reconnection State

```typescript
interface ReconnectionState {
  isReconnecting: boolean;
  attemptCount: number;
  nextRetryIn: number; // seconds
  maxAttemptsReached: boolean;
}
```

---

## Success Criteria

- [ ] Automatic reconnection triggers on network interruption
- [ ] Backoff delay increases with each failed attempt
- [ ] User sees clear reconnection status in UI
- [ ] Intentional disconnect does not trigger reconnection
- [ ] Max retry limit prevents infinite loops
- [ ] Manual reconnect works after max attempts
