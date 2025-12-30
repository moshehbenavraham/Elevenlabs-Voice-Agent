# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-30
**Project State**: Phase 03 - Testing & Configuration
**Completed Sessions**: 15 (2 of 5 in current phase)

---

## Recommended Next Session

**Session ID**: `phase03-session03-elevenlabs-reconnection`
**Session Name**: ElevenLabs Reconnection & Resilience
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 15-20

---

## Why This Session Next?

### Prerequisites Met

- [x] E2E test infrastructure complete (session01)
- [x] Voice flow E2E tests complete (session02)
- [x] Reconnection patterns established for OpenAI/xAI (Phase 02)
- [x] useReconnection hook exists and is battle-tested

### Dependencies

- **Builds on**: Phase 02 reconnection logic (useReconnection.ts), E2E testing infrastructure
- **Enables**: Complete provider parity, Provider Configuration Modal (session04)

### Project Progression

ElevenLabs is the primary voice provider but currently lacks the reconnection resilience implemented for OpenAI and xAI in Phase 02. With E2E testing infrastructure now in place, this is the ideal time to investigate and implement ElevenLabs reconnection handling. The ElevenLabs SDK may handle reconnection internally, so this session includes research to determine the appropriate approach - whether to leverage SDK capabilities or implement manual recovery similar to the WebSocket-based providers.

---

## Session Overview

### Objective

Ensure ElevenLabs voice connections are resilient to network interruptions with automatic reconnection, matching the reliability of OpenAI and xAI providers.

### Key Deliverables

1. Research ElevenLabs SDK reconnection capabilities
2. Implement reconnection handling (SDK-native or manual)
3. Add connection status indicators to ElevenLabs provider
4. E2E tests for ElevenLabs reconnection scenarios
5. Documentation of ElevenLabs resilience patterns

### Scope Summary

- **In Scope (MVP)**: SDK research, reconnection implementation, status UI, basic E2E tests
- **Out of Scope**: ElevenLabs function calling (separate session), session state restoration, advanced error recovery

---

## Technical Considerations

### Technologies/Patterns

- ElevenLabs React SDK v0.12.1 (@elevenlabs/react)
- useConversation() hook lifecycle events
- useReconnection hook (potential reuse)
- Playwright E2E testing

### Potential Challenges

- SDK may handle reconnection internally (requires research)
- Different reconnection semantics than raw WebSocket providers
- Testing network failures with ElevenLabs SDK may require mocking

### Relevant Considerations

- [P00] **ElevenLabs SDK v0.12.1**: Monitor for breaking changes; SDK behavior may differ from WebSocket-based providers
- [P02] **Reconnection Split Responsibility**: useReconnection handles orchestration; provider context handles actual connection
- [P02] **Fresh token on each reconnect**: Ephemeral tokens may expire during backoff; fetch fresh token each attempt
- [P02] **WebSocket close code handling**: Check 1000 (intentional) vs 1006 (abnormal) to determine reconnection behavior

---

## Alternative Sessions

If this session is blocked (e.g., SDK already handles reconnection perfectly):

1. **phase03-session04-provider-config-modal** - UI for provider settings management
2. **phase03-session05-elevenlabs-function-calling** - Function calling integration for ElevenLabs

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
