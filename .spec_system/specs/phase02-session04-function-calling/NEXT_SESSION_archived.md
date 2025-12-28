# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 02 - Advanced Features
**Completed Sessions**: 11 (3 in current phase)

---

## Recommended Next Session

**Session ID**: `phase02-session04-function-calling`
**Session Name**: Function Calling Integration
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: 20-25

---

## Why This Session Next?

### Prerequisites Met

- [x] Voice Selection UI complete (session01) - users can select voices
- [x] Conversation History complete (session02) - text transcripts available
- [x] Reconnection Backoff complete (session03) - stable WebSocket connections
- [x] OpenAI and xAI WebSocket infrastructure operational
- [x] Backend Express server with provider endpoints

### Dependencies

- **Builds on**: phase02-session03-reconnection-backoff (stable connections)
- **Enables**: Real-world voice assistant use cases (weather, calculations, actions)

### Project Progression

Function calling is the next logical step because:

1. **Voice + Actions = Practical**: Without function calling, voice agents can only chat. Function calling enables weather queries, calculations, API integrations, and real actions.
2. **Both OpenAI and xAI support it**: The realtime APIs for both providers support function/tool calling natively.
3. **Medium Priority in Roadmap**: Listed as #4 in CONSIDERATIONS.md Phase 02 roadmap.
4. **Showcases Full Potential**: Demonstrates the real power of voice AI agents beyond simple Q&A.

---

## Session Overview

### Objective

Enable voice agents to execute backend functions (tools) in response to user requests, with results spoken back to the user.

### Key Deliverables

1. **Tool Definition System**: Configure available functions per provider
2. **Backend Function Handlers**: Express routes to execute tool actions
3. **WebSocket Tool Flow**: Handle function_call events and return results
4. **Example Functions**: Weather lookup, calculator, time/date queries
5. **UI Feedback**: Show function execution status in conversation transcript

### Scope Summary

- **In Scope (MVP)**:
  - OpenAI function calling integration
  - xAI tool calling integration
  - 2-3 example functions (weather, calculator, get_time)
  - Function results displayed in transcript
  - Error handling for failed function calls

- **Out of Scope**:
  - ElevenLabs function calling (different architecture)
  - Async/long-running functions
  - User-defined custom functions
  - Function calling configuration UI

---

## Technical Considerations

### Technologies/Patterns

- OpenAI Realtime API `tools` configuration in session.update
- xAI function_call message type handling
- Express.js function execution endpoints
- Existing WebSocket message routing patterns

### Potential Challenges

- **Tool schema definition**: Each provider has slightly different tool schema formats
- **Error propagation**: Function failures need clear error messages back to voice
- **Timeout handling**: Functions must complete quickly for real-time response
- **State management**: Track pending function calls in context

### Relevant Considerations

- [P00] **Switch statement for WebSocket messages**: Use for routing function_call events
- [P01] **~80% Code Reuse**: Function calling patterns likely similar between OpenAI/xAI
- [P00] **Existing server patterns**: Extend server/index.js with function execution routes

---

## Alternative Sessions

If this session is blocked:

1. **phase02-session05-configuration-modals** - Provider-specific settings UI, API key management
2. **phase02-session05-e2e-testing** - Playwright tests for voice flows (lower priority)

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
