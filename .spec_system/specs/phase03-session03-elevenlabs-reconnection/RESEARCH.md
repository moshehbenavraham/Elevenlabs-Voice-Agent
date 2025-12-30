# ElevenLabs SDK Reconnection Research

**Session**: phase03-session03-elevenlabs-reconnection
**Date**: 2025-12-30
**SDK Version**: @elevenlabs/react v0.12.1

---

## 1. Research Questions

1. Does `useConversation` auto-reconnect on connection loss?
2. What close code is provided in `onDisconnect` callback?
3. Can we distinguish intentional disconnect from abnormal disconnect?

---

## 2. SDK Analysis

### useConversation Hook Behavior

The ElevenLabs React SDK (`@elevenlabs/react`) provides the `useConversation()` hook which abstracts WebSocket connections.

**Key Callbacks**:

- `onConnect`: Called when connection is established
- `onDisconnect`: Called when connection ends (no close code exposed)
- `onError`: Called on errors during conversation
- `onMessage`: Called when messages are received

**Session Management**:

- `startSession({ signedUrl, connectionType })`: Initiates connection
- `endSession()`: Gracefully terminates connection
- `status`: Current connection status ('connected' | 'connecting' | 'disconnected')

### Reconnection Behavior Findings

**The ElevenLabs SDK does NOT auto-reconnect**. Key observations:

1. The `onDisconnect` callback does not provide a WebSocket close code
2. The SDK does not distinguish between intentional vs abnormal disconnection
3. Manual reconnection logic is required

**Implication**: We must implement reconnection at the VoiceContext level using the `useReconnection` hook.

---

## 3. Implementation Decision

**Decision**: Manual reconnection implementation required

**Approach**:

1. Track intentional disconnect via ref (`intentionalDisconnectRef`)
2. Integrate `useReconnection` hook into VoiceProvider
3. On `onDisconnect` callback:
   - If intentional: reset state, do not reconnect
   - If abnormal: trigger reconnection with fresh signed URL
4. Fetch fresh signed URL on each reconnection attempt (URLs may expire)

**Pattern Source**: Follow XAIVoiceContext.tsx patterns for consistency

---

## 4. Key Considerations

### Signed URL Expiration

- ElevenLabs signed URLs have a TTL
- Must fetch fresh URL for each reconnection attempt
- Cannot reuse original signed URL

### Detecting Abnormal Disconnect

Since the SDK does not expose close codes:

- Track if `endSession()` was called intentionally
- Any `onDisconnect` without prior `endSession()` call is abnormal
- Use ref to track intentional vs unexpected disconnection

### SDK Opacity

The SDK abstracts WebSocket internals, so we cannot:

- Access raw WebSocket close codes
- Intercept WebSocket events directly
- Modify reconnection behavior at protocol level

---

## 5. Implementation Strategy

```
User clicks disconnect -> intentionalDisconnectRef = true -> call endSession()
                       -> onDisconnect fires -> check ref -> NO reconnection

Network issue -> onDisconnect fires -> intentionalDisconnectRef = false
             -> trigger useReconnection -> exponential backoff
             -> attempt reconnect with fresh signed URL
```

---

## 6. Testing Strategy

### E2E Test Approach

- Cannot easily mock SDK internals
- Use page.evaluate() to manipulate connection state
- Test reconnection UI indicators and behavior

### Unit Test Approach

- Existing useReconnection tests cover backoff logic
- Integration tests can mock useConversation hook

---
