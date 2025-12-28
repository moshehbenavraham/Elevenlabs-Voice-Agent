# Session Specification

**Session ID**: `phase02-session04-function-calling`
**Phase**: 02 - Advanced Features
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements function calling (tool use) integration for OpenAI and xAI voice providers, enabling voice agents to execute backend functions in response to user requests. Currently, voice agents can only engage in conversational Q&A. Function calling transforms them into practical assistants capable of performing real actions like weather lookups, calculations, and time queries.

The implementation follows the established WebSocket message routing pattern using switch statements. Both OpenAI and xAI Realtime APIs support function calling natively through their WebSocket protocols. Tool definitions are sent during session configuration, and function_call events are handled via new switch cases in the existing message handlers.

This session is a medium priority item from the Phase 02 roadmap. It builds on the stable WebSocket connections from session03 (reconnection/backoff) and demonstrates the practical power of voice AI beyond simple conversation.

---

## 2. Objectives

1. Define and configure tool schemas for both OpenAI and xAI providers during session initialization
2. Implement backend function execution endpoints that handle tool invocations securely
3. Handle function_call WebSocket events and return results to the voice conversation
4. Display function execution status and results in the conversation transcript UI

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session01-voice-selection` - Voice configuration via session.update
- [x] `phase02-session02-conversation-history` - Transcript display for function results
- [x] `phase02-session03-reconnection-backoff` - Stable WebSocket connections

### Required Tools/Knowledge

- OpenAI Realtime API tools configuration (session.update with tools array)
- xAI function calling message format
- Express.js route handlers (existing patterns in server/routes/)

### Environment Requirements

- Node.js server running on port 3001
- Valid OpenAI and/or xAI API keys configured
- HTTPS in production for microphone access

---

## 4. Scope

### In Scope (MVP)

- Tool definition system for OpenAI (tools array in session.update)
- Tool definition system for xAI (matching format)
- Backend function execution route: POST /api/functions/execute
- Three example functions: get_weather, calculate, get_current_time
- WebSocket handler cases for response.function_call_arguments.done (OpenAI)
- WebSocket handler cases for function_call events (xAI)
- Function result display in ConversationPanel with distinct styling
- Error handling for failed function calls with user-friendly messages

### Out of Scope (Deferred)

- ElevenLabs function calling - _Reason: Different architecture, requires separate research_
- Async/long-running functions - _Reason: Real-time voice requires fast responses_
- User-defined custom functions - _Reason: Requires configuration UI (session05)_
- Function calling configuration UI - _Reason: Deferred to session05_
- External API integrations (real weather API) - _Reason: Use mock data for MVP_

---

## 5. Technical Approach

### Architecture

```
Frontend (WebSocket)                    Backend (Express)
+------------------------+              +------------------------+
| OpenAIVoiceContext.tsx |              | server/routes/         |
| - session.update with  |              |   functions.js         |
|   tools array          |              | - POST /execute        |
| - Handle function_call |  HTTP POST   | - Tool implementations |
|   events               |------------->| - get_weather()        |
| - Send results back    |<-------------| - calculate()          |
+------------------------+              | - get_current_time()   |
                                        +------------------------+
```

Function calling flow:

1. Session starts: tools array included in session.update message
2. User speaks: "What's the weather in Tokyo?"
3. AI decides to call function: response.function_call_arguments.done event
4. Frontend extracts function name and arguments
5. Frontend calls backend: POST /api/functions/execute
6. Backend executes function and returns result
7. Frontend sends result back to WebSocket: conversation.item.create
8. AI speaks the result to user
9. Function call displayed in transcript

### Design Patterns

- **Switch statement routing**: Extend existing handleWSMessage switch for function events
- **Provider abstraction**: Shared tool definitions with provider-specific message formats
- **Backend execution**: All functions run server-side for security and consistency
- **Message type extension**: Add 'function' role to VoiceMessage type for transcript

### Technology Stack

- React 18.3.1 with TypeScript
- Express.js backend routes
- WebSocket (native, existing)
- Existing audio infrastructure (no changes)

---

## 6. Deliverables

### Files to Create

| File                                             | Purpose                                          | Est. Lines |
| ------------------------------------------------ | ------------------------------------------------ | ---------- |
| `server/routes/functions.js`                     | Function execution endpoint and implementations  | ~150       |
| `src/lib/tools/toolDefinitions.ts`               | Shared tool schema definitions for all providers | ~80        |
| `src/components/voice/FunctionCallIndicator.tsx` | UI indicator during function execution           | ~40        |

### Files to Modify

| File                                         | Changes                                                  | Est. Lines |
| -------------------------------------------- | -------------------------------------------------------- | ---------- |
| `server/index.js`                            | Add functions route import and mount                     | ~5         |
| `src/contexts/OpenAIVoiceContext.tsx`        | Add tools to session.update, handle function_call events | ~80        |
| `src/contexts/XAIVoiceContext.tsx`           | Add tools to session.update, handle function_call events | ~80        |
| `src/types/index.ts`                         | Add FunctionCall type, extend VoiceMessage               | ~20        |
| `src/components/voice/MessageBubble.tsx`     | Style function call messages distinctly                  | ~30        |
| `src/components/voice/ConversationPanel.tsx` | Handle function message type                             | ~15        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Voice agent can execute get_weather function when asked about weather
- [ ] Voice agent can execute calculate function for math expressions
- [ ] Voice agent can execute get_current_time function when asked about time
- [ ] Function results are spoken back by the voice agent
- [ ] Function calls appear in conversation transcript with distinct styling
- [ ] Failed function calls show user-friendly error messages
- [ ] Functions work for both OpenAI and xAI providers

### Testing Requirements

- [ ] Unit tests for toolDefinitions.ts schema validation
- [ ] Unit tests for function execution endpoint
- [ ] Unit tests for FunctionCallIndicator component
- [ ] Integration test for function call WebSocket flow (mock)
- [ ] Manual testing with live voice conversation

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] ESLint passes with no new warnings
- [ ] All 148+ existing tests pass
- [ ] TypeScript strict mode satisfied

---

## 8. Implementation Notes

### Key Considerations

- Tool schemas must match provider-specific formats exactly
- Function execution must be fast (<2s) for real-time voice
- Backend validates function names against allowlist to prevent injection
- Use mock data for weather (no external API dependency in MVP)

### Potential Challenges

- **Schema differences**: OpenAI uses JSON Schema, xAI may have variations - test both
- **Result format**: Function results must be formatted for natural speech
- **Timeout handling**: Add timeout to function execution to prevent hanging
- **State tracking**: Track pending function calls to show loading indicator

### Relevant Considerations

- [P00] **Switch statement for WebSocket messages**: Extend with function_call cases
- [P01] **~80% Code Reuse**: Tool definitions shared, only message format differs
- [P00] **Existing server patterns**: Follow xai.js/openai.js patterns for functions.js
- [P00] **API Keys via Backend Proxy**: Function execution runs server-side only

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- toolDefinitions.ts: Validate schema structure matches provider requirements
- functions.js: Test each function handler with various inputs
- FunctionCallIndicator.tsx: Render states (loading, success, error)
- MessageBubble.tsx: Function message styling

### Integration Tests

- WebSocket message flow: Mock function_call event and verify response sent
- Backend route: POST /api/functions/execute returns expected results
- Error propagation: Invalid function name returns proper error

### Manual Testing

- Start OpenAI voice conversation, ask "What's the weather in Tokyo?"
- Verify function executes and result is spoken
- Check transcript shows function call with result
- Repeat for xAI provider
- Test error case: trigger invalid function somehow

### Edge Cases

- Empty function arguments
- Invalid function name (should return error, not crash)
- Network timeout during function execution
- Function called while audio is playing
- Rapid consecutive function calls

---

## 10. Dependencies

### External Libraries

- No new external libraries required
- Uses existing: express, react, websocket (native)

### Other Sessions

- **Depends on**: phase02-session01 (voice config), phase02-session02 (transcript), phase02-session03 (stable connections)
- **Depended by**: phase02-session05-polish (final validation)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
