# Session Specification

**Session ID**: `phase06-session04-testing-polish`
**Phase**: 06 - Retell Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This session completes Phase 06 by adding comprehensive test coverage for the Retell voice integration, polishing the user experience, and updating documentation. The core Retell implementation (backend infrastructure, voice hook SDK, and provider tab UI) was delivered in Sessions 01-03 - this final session validates that work through rigorous testing and ensures the codebase documentation reflects the new provider.

The testing strategy mirrors the established patterns from Phase 05 (Vapi) with `useVapiVoice.test.ts` and `VapiProvider.test.tsx` serving as templates. We will create equivalent tests for Retell covering the hook lifecycle, event handling, component state transitions, and accessibility. Additionally, we will enhance error messages for better user experience and update CLAUDE.md and README with Retell setup instructions.

Upon completion, Phase 06 will be marked complete in state.json, bringing the total provider count to six (ElevenLabs Widget, ElevenLabs SDK, OpenAI, xAI, Ultravox, Vapi, Retell).

---

## 2. Objectives

1. Create comprehensive unit tests for `useRetellVoice` hook covering initial state, connection lifecycle, event handling, transcript accumulation, and cleanup
2. Create component tests for `RetellProvider.tsx` covering VapiButton, VapiVoiceStatus, and VapiEmptyState equivalents (RetellButton, RetellVoiceStatus, RetellEmptyState)
3. Update CLAUDE.md and README.md with complete Retell documentation and setup instructions
4. Mark Phase 06 complete in state.json upon successful validation

---

## 3. Prerequisites

### Required Sessions

- [x] `phase06-session01-dependencies-backend-setup` - Retell SDK installed, backend endpoint created
- [x] `phase06-session02-voice-hook-sdk` - useRetellVoice hook implemented
- [x] `phase06-session03-provider-tab` - RetellProvider components and tab UI working

### Required Tools/Knowledge

- Vitest + React Testing Library
- Retell SDK event model (call_started, call_ended, agent_start_talking, agent_stop_talking, update, error)
- Existing test patterns from useVapiVoice.test.ts and VapiProvider.test.tsx

### Environment Requirements

- Node.js 18+
- Test environment with jsdom and Web Audio API mocks (already configured in src/test/setup.ts)

---

## 4. Scope

### In Scope (MVP)

- Create `src/test/useRetellVoice.test.ts` with unit tests for hook
- Create `src/test/RetellProvider.test.tsx` with component tests
- Integration tests for Retell tab switching with existing ProviderTabs.test.tsx patterns
- Update CLAUDE.md with Retell section in Key Integration Points
- Update README with Retell setup instructions
- Update .env.example with complete Retell configuration (VITE_RETELL_ENABLED, VITE_RETELL_AGENT_ID)
- Enhanced error messages in useRetellVoice for user-friendly display
- Mobile responsive testing verification
- Mark Phase 06 complete in state.json

### Out of Scope (Deferred)

- E2E Playwright tests - _Reason: existing infrastructure covers basic flows_
- Performance optimization - _Reason: not needed for MVP_
- Metadata event handling - _Reason: optional enhancement, not required for completion_
- Audio event handling for visualization - _Reason: optional enhancement, not required for completion_

---

## 5. Technical Approach

### Architecture

Tests follow the established patterns from Vapi implementation:

- Hook tests use `renderHook` from React Testing Library with mocked SDK
- Component tests use `render` with mocked `useRetellVoice` hook
- Mock factory pattern for consistent test setup

### Design Patterns

- **Mock Factory Pattern**: `createMockHookReturn()` helper for consistent mock state
- **Event Emitter Pattern**: `retellMocks.emit()` for simulating SDK events
- **Isolation Pattern**: Each test resets mocks via `beforeEach`/`afterEach`

### Technology Stack

- Vitest 2.1.8
- @testing-library/react 16.1.0
- @testing-library/jest-dom 6.6.3
- jsdom environment

---

## 6. Deliverables

### Files to Create

| File                               | Purpose                          | Est. Lines |
| ---------------------------------- | -------------------------------- | ---------- |
| `src/test/useRetellVoice.test.ts`  | Unit tests for Retell voice hook | ~350       |
| `src/test/RetellProvider.test.tsx` | Component tests for Retell UI    | ~300       |

### Files to Modify

| File                          | Changes                                       | Est. Lines |
| ----------------------------- | --------------------------------------------- | ---------- |
| `src/test/setup.ts`           | Add retellMocks parallel to vapiMocks         | ~40        |
| `CLAUDE.md`                   | Add Retell section to Key Integration Points  | ~25        |
| `README.md`                   | Add Retell setup instructions                 | ~20        |
| `.env.example`                | Add VITE_RETELL_ENABLED, VITE_RETELL_AGENT_ID | ~5         |
| `.spec_system/state.json`     | Mark phase 06 complete                        | ~5         |
| `src/hooks/useRetellVoice.ts` | Enhance error messages                        | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] useRetellVoice.test.ts passes all tests (initial state, lifecycle, events, transcripts, cleanup)
- [ ] RetellProvider.test.tsx passes all tests (button states, status display, empty state)
- [ ] Existing tests still pass (no regressions)
- [ ] Build succeeds with no errors
- [ ] Lint passes with no new warnings

### Testing Requirements

- [ ] Unit tests cover: initial state, startCall, stopCall, toggleCall
- [ ] Event tests cover: call_started, call_ended, agent_start_talking, agent_stop_talking, update, error
- [ ] Component tests cover: button rendering, state transitions, click handlers, accessibility
- [ ] Integration verified: tab switching with other providers

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] Test file naming: `ComponentName.test.tsx` alongside component

---

## 8. Implementation Notes

### Key Considerations

- Retell SDK uses RetellWebClient class, not a singleton like Vapi
- Must mock the entire RetellWebClient class and its methods (on, off, startCall, stopCall)
- Transcript accumulation is unique to Retell (SDK only provides last 5 sentences)
- Event naming differs from Vapi: `call_started` vs `call-start`, `agent_start_talking` vs `speech-start`

### Potential Challenges

- **Mocking RetellWebClient class**: Use vi.mock with factory to return mock instance
- **Testing async call state transitions**: Use act() and waitFor() from RTL
- **Transcript accumulation logic**: Test index tracking and deduplication

### Relevant Considerations

- [P02] **act() warnings in keyboard tests**: May need waitFor wrappers for state timing - use established patterns from Vapi tests
- [P00] **Provider-Specific Contexts**: RetellProvider follows same isolation pattern as other providers; no cross-contamination with other contexts

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests (useRetellVoice.test.ts)

- Initial state: callStatus IDLE, isAgentSpeaking false, empty messages, null activeTranscript
- Connection lifecycle: startCall sets CONNECTING, stopCall triggers cleanup
- Event handling: call_started/call_ended, agent speaking events, update event with transcripts
- Error handling: backend fetch failures, SDK errors
- Cleanup: event listeners removed on unmount

### Integration Tests

- Tab switching: Retell tab renders correctly when selected
- Provider isolation: Retell state doesn't leak to other providers

### Manual Testing

- Start/stop call works correctly
- Error messages display properly
- Mobile responsive layout
- Button states transition correctly

### Edge Cases

- Rapid connect/disconnect cycles
- Error during connection
- Empty transcript arrays
- Missing access token response

---

## 10. Dependencies

### External Libraries

- retell-client-js-sdk: ^3.0.0 (already installed)
- vitest: ^2.1.8
- @testing-library/react: ^16.1.0

### Other Sessions

- **Depends on**: phase06-session01, phase06-session02, phase06-session03 (all completed)
- **Depended by**: None (this completes Phase 06)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
