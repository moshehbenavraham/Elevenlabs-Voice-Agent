# Session Specification

**Session ID**: `phase05-session04-validation-polish`
**Phase**: 05 - Vapi Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This is the final session of Phase 05 (Vapi Voice Agent Integration), following the established validation-and-polish pattern from previous phases. With the core Vapi integration complete (dependencies in session 01, hook in session 02, provider UI in session 03), this session ensures production readiness through comprehensive testing, function calling support, and documentation updates.

The session focuses on three main areas: (1) unit and integration tests for the `useVapiVoice` hook and `VapiProvider` component using Vitest and React Testing Library with mocked Vapi SDK; (2) function calling support via assistant configuration using Vapi's `CreateAssistantDTO` pattern; and (3) documentation updates to CLAUDE.md and README.md to reflect the new Vapi provider.

Completing this session marks the successful integration of Vapi as the fifth voice provider in the multi-provider voice AI application, following ElevenLabs (widget + SDK), xAI, OpenAI, and Ultravox.

---

## 2. Objectives

1. Achieve comprehensive test coverage for Vapi hook and components with mocked SDK
2. Implement function calling support in Vapi assistant configuration
3. Update project documentation to include Vapi integration details
4. Polish error handling and verify mobile responsiveness

---

## 3. Prerequisites

### Required Sessions

- [x] `phase05-session01-dependencies-csp` - Vapi SDK installed, CSP configured
- [x] `phase05-session02-voice-hook` - `useVapiVoice` hook and `vapi.ts` singleton created
- [x] `phase05-session03-provider-tab` - VapiProvider component with tab system integration

### Required Tools/Knowledge

- Vitest and React Testing Library (existing test infrastructure)
- Vapi SDK event system (`call-start`, `call-end`, `message`, `speech-start`, `speech-end`)
- Vapi `CreateAssistantDTO` type for function definitions

### Environment Requirements

- Node.js 18+ with npm/bun
- `.env` file with `VITE_VAPI_ENABLED=true`
- Backend with `/api/vapi/web-call` endpoint operational

---

## 4. Scope

### In Scope (MVP)

- Unit tests for `useVapiVoice` hook (initial state, events, transcripts, cleanup)
- Component tests for `VapiProvider.tsx` (rendering, connection flow, error states)
- Integration tests for Vapi tab switching behavior
- Function definitions in assistant configuration
- CLAUDE.md documentation update with Vapi section
- README.md update with Vapi setup instructions
- Error message polish for user-friendly display
- Mobile responsive verification

### Out of Scope (Deferred)

- E2E tests with real Vapi API - _Reason: Mocked tests sufficient for MVP; real API tests require credentials_
- Advanced Vapi features (custom voices, webhooks) - _Reason: Phase 06+ scope_
- ConfigurationModal Vapi section - _Reason: Voice configured in Vapi dashboard, not client-side_
- Voice selection UI - _Reason: Vapi manages voice via assistant configuration_

---

## 5. Technical Approach

### Architecture

Tests will mock the `@vapi-ai/web` SDK using Vitest's mocking capabilities. The mock will simulate the Vapi event system (`on`, `off`, `start`, `stop`) and emit events for testing state transitions. Function calling will use the existing `toolDefinitions.ts` pattern, transformed into Vapi's function definition format.

### Design Patterns

- **SDK Mocking**: Mock Vapi class with event emitter pattern for predictable test behavior
- **Shared Tool Definitions**: Reuse existing function definitions, transform for Vapi format
- **Provider-Wrapper Pattern**: Follow existing `*Provider.test.tsx` patterns from other providers

### Technology Stack

- Vitest 2.1.8 (existing)
- React Testing Library (existing)
- @vapi-ai/web SDK (existing, mocked in tests)
- TypeScript with strict mode

---

## 6. Deliverables

### Files to Create

| File                             | Purpose                           | Est. Lines |
| -------------------------------- | --------------------------------- | ---------- |
| `src/test/useVapiVoice.test.ts`  | Unit tests for Vapi voice hook    | ~200       |
| `src/test/VapiProvider.test.tsx` | Component tests for Vapi provider | ~150       |

### Files to Modify

| File                               | Changes                              | Est. Lines |
| ---------------------------------- | ------------------------------------ | ---------- |
| `src/hooks/useVapiVoice.ts`        | Add function call handling if needed | ~20        |
| `src/lib/tools/toolDefinitions.ts` | Add Vapi function format transformer | ~30        |
| `CLAUDE.md`                        | Add Vapi integration documentation   | ~40        |
| `README.md`                        | Add Vapi setup instructions          | ~30        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `useVapiVoice` hook tests cover: initial state, connection, events, transcripts, errors, cleanup
- [ ] `VapiProvider` tests cover: rendering, button states, error display
- [ ] Tab switching integration tests pass
- [ ] Function definitions are accepted by Vapi assistant config
- [ ] `activeTranscript` shows typing indicator correctly during speech

### Testing Requirements

- [ ] All unit tests written and passing
- [ ] All component tests written and passing
- [ ] Integration tests for tab behavior passing
- [ ] Manual testing completed on desktop and mobile

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] Build passes without warnings
- [ ] Lint passes (`npm run lint`)
- [ ] No new TypeScript errors

---

## 8. Implementation Notes

### Key Considerations

- Mock Vapi SDK event system using vi.fn() and EventEmitter pattern
- Follow existing test patterns from `src/test/` directory
- Vapi function calling uses `CreateAssistantDTO.model.functions` format
- Test file naming: `ComponentName.test.tsx` alongside component

### Potential Challenges

- **Mocking Vapi Event System**: Vapi uses callback-based events; mock must trigger correctly
  - _Mitigation_: Create mock class with `on`/`off`/`emit` methods
- **TypeScript Types for Functions**: Vapi function types may differ from OpenAI/xAI
  - _Mitigation_: Inspect `CreateAssistantDTO` type for exact format
- **act() Warnings**: Async state updates may cause React warnings
  - _Mitigation_: Use `waitFor` and `act()` wrappers as documented in CONSIDERATIONS.md

### Relevant Considerations

- [P02] **act() warnings in keyboard tests**: Use `waitFor` wrappers for async state updates in Vapi tests
- [P00] **react-refresh/only-export-components warnings**: VapiProvider may trigger this; acceptable for co-located components
- [P02] **Function timeout protection**: Apply 5-second timeout pattern if adding client-side function execution

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests (`useVapiVoice.test.ts`)

- Initial state verification (disconnected, no messages, no error)
- `connect()` triggers Vapi start with correct config
- `disconnect()` triggers Vapi stop
- Event handling: `call-start`, `call-end`, `message`, `speech-start`, `speech-end`
- Partial transcript updates via `activeTranscript`
- Error state on connection failure
- Cleanup on unmount (event listeners removed)

### Component Tests (`VapiProvider.test.tsx`)

- Renders VoiceButton with correct initial state
- Shows "Connect" when disconnected
- Shows "Disconnect" when connected
- Displays error messages
- Renders VapiConversationPanel with messages
- VoiceVisualizer integration (mocked audio)

### Integration Tests

- Tab switching disconnects Vapi when leaving tab
- Tab switching allows reconnection when returning
- Provider context provides correct state to children

### Edge Cases

- Double-connect prevention
- Rapid connect/disconnect cycles
- Error recovery after failure
- Empty message handling

---

## 10. Dependencies

### External Libraries

- `@vapi-ai/web`: ^2.3.1 (existing, mocked in tests)
- `vitest`: ^2.1.8 (existing)
- `@testing-library/react`: (existing)

### Other Sessions

- **Depends on**: phase05-session01, phase05-session02, phase05-session03
- **Depended by**: None (final session of phase)
- **Enables**: Phase 05 completion, Phase 06 (Retell Voice Agent)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
