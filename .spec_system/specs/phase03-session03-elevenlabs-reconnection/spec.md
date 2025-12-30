# Session Specification

**Session ID**: `phase03-session03-elevenlabs-reconnection`
**Phase**: 03 - Testing & Configuration
**Status**: Not Started
**Created**: 2025-12-30

---

## 1. Session Overview

This session focuses on investigating and implementing reconnection resilience for the ElevenLabs voice provider. While OpenAI and xAI providers benefit from the `useReconnection` hook with exponential backoff (implemented in Phase 02), the ElevenLabs SDK-based integration (`VoiceContext.tsx`) currently lacks equivalent connection recovery mechanisms.

The ElevenLabs React SDK (`@elevenlabs/react` v0.12.1) uses `useConversation()` with high-level callbacks (`onConnect`, `onDisconnect`, `onError`), which may handle some reconnection internally. This session will research the SDK's internal behavior, determine what manual implementation is required, and ensure ElevenLabs achieves parity with other providers in handling network interruptions gracefully.

Additionally, this session includes adding connection status indicators to the ElevenLabs provider UI and writing E2E tests for reconnection scenarios, leveraging the Playwright infrastructure established in sessions 01 and 02.

---

## 2. Objectives

1. Research and document ElevenLabs SDK reconnection behavior (internal handling vs manual implementation needed)
2. Implement reconnection resilience for ElevenLabs provider, reusing `useReconnection` hook patterns where applicable
3. Add connection status indicators (reconnecting state, countdown, retry count) to ElevenLabs UI matching OpenAI/xAI
4. Create E2E tests validating ElevenLabs connection recovery scenarios

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session03-reconnection-backoff` - Provides useReconnection hook and patterns
- [x] `phase03-session01-e2e-infrastructure` - Playwright test infrastructure
- [x] `phase03-session02-voice-e2e-tests` - Voice flow E2E test patterns

### Required Tools/Knowledge

- ElevenLabs React SDK v0.12.1 documentation and source code
- Understanding of `useConversation()` hook lifecycle events
- Familiarity with `useReconnection.ts` hook implementation

### Environment Requirements

- ElevenLabs API key configured in backend
- Valid Agent ID in `VITE_ELEVENLABS_AGENT_ID`
- ElevenLabs SDK tab enabled (`VITE_ELEVENLABS_SDK_ENABLED=true`)

---

## 4. Scope

### In Scope (MVP)

- Research ElevenLabs SDK reconnection capabilities via documentation and source inspection
- Implement connection recovery mechanism (SDK-native or manual with useReconnection)
- Add reconnection state to VoiceContext (status, attempt count, countdown)
- Create VoiceStatus component updates for ElevenLabs-specific reconnection UI
- E2E tests for ElevenLabs reconnection using Playwright network interception
- Documentation of findings in session research notes

### Out of Scope (Deferred)

- ElevenLabs function calling / tool use - _Reason: Requires separate research session (session05)_
- Session state restoration across reconnections - _Reason: Complex cross-provider feature_
- WebSocket-level protocol modifications - _Reason: SDK abstraction layer_
- Custom retry strategies beyond exponential backoff - _Reason: Current pattern sufficient_

---

## 5. Technical Approach

### Architecture

The implementation will follow a research-first approach:

1. **Phase A - SDK Research**: Inspect `@elevenlabs/react` SDK source to understand:
   - Does `useConversation` auto-reconnect on connection loss?
   - What events fire during disconnection/reconnection?
   - Can we detect abnormal vs intentional disconnection?

2. **Phase B - Implementation**: Based on research findings:
   - **If SDK handles reconnection**: Add UI indicators that reflect SDK state
   - **If manual reconnection needed**: Integrate `useReconnection` hook into `VoiceContext.tsx`

3. **Phase C - UI Updates**: Add reconnection status display to ElevenLabs provider matching OpenAI/xAI patterns

4. **Phase D - E2E Tests**: Write Playwright tests using network interception to simulate disconnections

### Design Patterns

- **Hook Composition**: Compose `useReconnection` with existing `useConversation` if manual reconnection needed
- **State Machine**: Use same reconnection states as other providers (idle, connected, disconnected, reconnecting, max_retries)
- **Provider Parity**: Match UI patterns from OpenAI/xAI providers for consistent UX

### Technology Stack

- ElevenLabs React SDK v0.12.1 (`@elevenlabs/react`)
- React hooks (`useCallback`, `useEffect`, `useRef`)
- Playwright for E2E testing
- Existing `useReconnection` hook

---

## 6. Deliverables

### Files to Create

| File                                                                       | Purpose                                            | Est. Lines |
| -------------------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| `e2e/elevenlabs-reconnection.spec.ts`                                      | E2E tests for ElevenLabs reconnection scenarios    | ~120       |
| `.spec_system/specs/phase03-session03-elevenlabs-reconnection/RESEARCH.md` | SDK research findings and implementation decisions | ~80        |

### Files to Modify

| File                                              | Changes                                | Est. Lines Changed |
| ------------------------------------------------- | -------------------------------------- | ------------------ |
| `src/contexts/VoiceContext.tsx`                   | Add reconnection state and logic       | ~60                |
| `src/components/voice/VoiceStatus.tsx`            | Add reconnection UI for ElevenLabs     | ~30                |
| `src/components/providers/ElevenLabsProvider.tsx` | Pass reconnection props to VoiceStatus | ~15                |

---

## 7. Success Criteria

### Functional Requirements

- [ ] ElevenLabs provider recovers from network interruption automatically
- [ ] Reconnection attempts use exponential backoff (1s, 2s, 4s, 8s... up to 30s)
- [ ] Maximum 5 retry attempts before showing "max retries" state
- [ ] Intentional disconnection (user clicks disconnect) does not trigger reconnection
- [ ] Network offline pauses reconnection; online resumes it

### Testing Requirements

- [ ] E2E test: Connection recovery after simulated network failure
- [ ] E2E test: Intentional disconnect does not trigger reconnection
- [ ] E2E test: Max retries state reached after repeated failures
- [ ] Unit tests updated if VoiceContext internals change

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] `npm run lint` passes with no new errors
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds

---

## 8. Implementation Notes

### Key Considerations

- ElevenLabs SDK may already handle reconnection internally - research first before implementing
- The SDK uses WebSocket internally but abstracts it via `useConversation` hook
- Cannot access WebSocket close codes directly; must infer from SDK callbacks
- Signed URL may expire during reconnection; need fresh URL for each attempt

### Potential Challenges

- **SDK opacity**: Limited visibility into internal reconnection behavior; may need source inspection
- **Close code detection**: `onDisconnect` callback may not provide close code (1000 vs 1006)
- **Signed URL expiration**: ElevenLabs signed URLs have TTL; reconnection needs fresh URL
- **E2E mocking complexity**: SDK abstraction may make network mocking challenging

### Relevant Considerations

- [P00] **ElevenLabs SDK v0.12.1**: SDK behavior may differ from WebSocket-based providers; research before implementation
- [P02] **Reconnection Split Responsibility**: useReconnection handles orchestration (timing, backoff); VoiceContext handles actual connection (signed URL fetch, SDK calls)
- [P02] **Fresh token on each reconnect**: Ephemeral tokens/signed URLs may expire during backoff; fetch fresh URL each attempt
- [P02] **WebSocket close code handling**: Check if SDK exposes close code (1000 intentional vs 1006 abnormal) to determine reconnection behavior

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Test reconnection state transitions in VoiceContext (if state machine added)
- Test exponential backoff calculations (already covered in useReconnection.test.ts)

### Integration Tests

- Mock `useConversation` hook to simulate disconnect/reconnect scenarios
- Verify reconnection UI renders correctly based on state

### E2E Tests

- **Happy path**: Disconnect network, verify reconnection attempt, restore network, verify recovery
- **Max retries**: Repeatedly fail reconnection, verify max_retries state
- **Intentional disconnect**: User clicks disconnect button, verify no reconnection attempt
- **Offline/online**: Go offline during reconnection, verify pause; go online, verify resume

### Edge Cases

- Signed URL expires during backoff delay
- User initiates new connection while reconnecting
- Tab switch during reconnection (provider context cleanup)
- Rapid connect/disconnect cycles

---

## 10. Dependencies

### External Libraries

- `@elevenlabs/react`: v0.12.1 (SDK for voice conversation)
- `playwright`: existing (E2E test framework)

### Other Sessions

- **Depends on**:
  - `phase02-session03-reconnection-backoff` (useReconnection hook)
  - `phase03-session01-e2e-infrastructure` (Playwright setup)
  - `phase03-session02-voice-e2e-tests` (voice E2E patterns)
- **Depended by**:
  - `phase03-session04-provider-config-modal` (complete provider feature set)
  - `phase03-session05-elevenlabs-function-calling` (builds on resilient connection)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
