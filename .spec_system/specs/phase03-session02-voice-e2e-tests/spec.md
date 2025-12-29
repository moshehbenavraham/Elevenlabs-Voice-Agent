# Session Specification

**Session ID**: `phase03-session02-voice-e2e-tests`
**Phase**: 03 - Testing & Configuration
**Status**: Not Started
**Created**: 2025-12-30

---

## 1. Session Overview

This session implements comprehensive E2E tests for voice conversation flows across all three providers (ElevenLabs, OpenAI, xAI). Building on the testing infrastructure established in session 01, we will create provider-specific test suites that validate connection flows, UI state transitions, error handling, and reconnection behavior.

The tests leverage the existing audio mocking utilities, WebSocket mocking infrastructure, and mock server from session 01. This session focuses on writing the actual test scenarios that exercise the voice UI components and provider integrations. Coverage includes VoiceButton state transitions, VoiceSelector functionality, ConversationPanel display, and FunctionCallIndicator rendering.

By completing this session, we establish regression protection for the core voice agent functionality across all providers. These tests will run in CI to catch breaking changes early and ensure the voice conversation flows remain stable as the codebase evolves.

---

## 2. Objectives

1. Implement provider-specific E2E test suites for ElevenLabs, OpenAI, and xAI connection flows
2. Create comprehensive voice UI component tests covering VoiceButton, VoiceStatus, VoiceVisualizer, VoiceSelector, and ConversationPanel
3. Establish error handling and reconnection behavior test scenarios for OpenAI/xAI providers
4. Validate function calling UI displays correctly when tools are invoked

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session01-e2e-infrastructure` - Provides Playwright setup, audio mocking, WebSocket mocking, mock server

### Required Tools/Knowledge

- Playwright test framework and assertions
- Understanding of voice provider WebSocket protocols
- Knowledge of voice UI component state machines

### Environment Requirements

- Node.js 18+
- Playwright browsers installed (`npx playwright install`)
- Development server running on port 8082

---

## 4. Scope

### In Scope (MVP)

- Connection flow tests for each provider (ElevenLabs, OpenAI, xAI)
- Voice button state transitions (idle -> connecting -> connected -> disconnecting)
- Voice status indicator tests
- Voice selector functionality tests (OpenAI/xAI)
- Conversation panel message display tests
- Error state handling tests (API failures, WebSocket errors)
- Reconnection behavior tests for OpenAI/xAI
- Function calling indicator display tests

### Out of Scope (Deferred)

- Actual audio transmission testing - _Reason: Requires real microphone access, use mocks instead_
- Real API calls to providers - _Reason: Tests should be hermetic and offline-capable_
- Load testing - _Reason: Separate concern for phase 04 or later_
- ElevenLabs reconnection tests - _Reason: SDK handles internally, requires separate research (session 03)_

---

## 5. Technical Approach

### Architecture

Tests are organized by provider in `tests/e2e/providers/` with shared utilities. Each provider test suite covers the full connection lifecycle and UI interactions. Tests use the `mockedPage` fixture that automatically injects audio mocks, WebSocket mocks, and sets up the mock API server.

```
tests/e2e/
|-- providers/
|   |-- elevenlabs.spec.ts    # ElevenLabs SDK connection tests
|   |-- openai.spec.ts        # OpenAI Realtime API tests
|   `-- xai.spec.ts           # xAI Realtime API tests
|-- voice-ui/
|   |-- voice-button.spec.ts  # Button state transitions
|   |-- voice-selector.spec.ts # Voice selection dropdown
|   |-- conversation-panel.spec.ts # Transcript display
|   `-- function-calling.spec.ts # Tool execution UI
`-- error-handling/
    |-- api-errors.spec.ts    # Backend API failure scenarios
    `-- reconnection.spec.ts  # WebSocket reconnection flows
```

### Design Patterns

- **Page Object Pattern**: Encapsulate page interactions for maintainability
- **Fixture Composition**: Build on `mockedPage` fixture for consistent setup
- **Arrange-Act-Assert**: Clear test structure for readability
- **Data-testid attributes**: Reliable element selection

### Technology Stack

- Playwright Test v1.52.0+
- TypeScript for type-safe tests
- Existing mock utilities from session 01
- Page Object Models for voice components

---

## 6. Deliverables

### Files to Create

| File                                            | Purpose                             | Est. Lines |
| ----------------------------------------------- | ----------------------------------- | ---------- |
| `tests/e2e/providers/elevenlabs.spec.ts`        | ElevenLabs connection flow tests    | ~120       |
| `tests/e2e/providers/openai.spec.ts`            | OpenAI Realtime connection tests    | ~150       |
| `tests/e2e/providers/xai.spec.ts`               | xAI Realtime connection tests       | ~150       |
| `tests/e2e/voice-ui/voice-button.spec.ts`       | Voice button state transition tests | ~100       |
| `tests/e2e/voice-ui/voice-selector.spec.ts`     | Voice selection dropdown tests      | ~80        |
| `tests/e2e/voice-ui/conversation-panel.spec.ts` | Conversation transcript tests       | ~100       |
| `tests/e2e/voice-ui/function-calling.spec.ts`   | Function call indicator tests       | ~80        |
| `tests/e2e/error-handling/api-errors.spec.ts`   | API error scenario tests            | ~100       |
| `tests/e2e/error-handling/reconnection.spec.ts` | Reconnection behavior tests         | ~120       |
| `tests/e2e/page-objects/VoicePage.ts`           | Page object for voice interactions  | ~80        |

### Files to Modify

| File                                | Changes                             | Est. Lines |
| ----------------------------------- | ----------------------------------- | ---------- |
| `tests/e2e/utils/mock-server.ts`    | Add function calling mock responses | ~30        |
| `tests/e2e/utils/websocket-mock.ts` | Enhance reconnection simulation     | ~40        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] ElevenLabs SDK connection can be initiated and terminated
- [ ] OpenAI Realtime connection cycle works end-to-end with mocks
- [ ] xAI Realtime connection cycle works end-to-end with mocks
- [ ] Voice button shows correct states during connection lifecycle
- [ ] Voice selector changes voice for OpenAI/xAI providers
- [ ] Conversation panel displays user and assistant messages
- [ ] Error states display appropriate UI feedback
- [ ] Reconnection attempts are visible in UI (OpenAI/xAI)
- [ ] Function call indicators appear when tools are invoked

### Testing Requirements

- [ ] All tests pass in local Chromium
- [ ] Tests pass in headless mode for CI
- [ ] No flaky tests (stable in 3 consecutive runs)
- [ ] Test execution completes within 5 minutes

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] ESLint passes with no errors
- [ ] TypeScript compiles without errors

---

## 8. Implementation Notes

### Key Considerations

- Use `data-testid` attributes for reliable element selection - avoid CSS class selectors
- Tests must be hermetic - no dependencies on external services
- Each test should be independent and not rely on state from other tests
- Use `waitFor` patterns to handle async state transitions
- Keep test timeouts reasonable (30s max per test)

### Potential Challenges

- **Test Flakiness**: Timing-sensitive tests may fail intermittently
  - _Mitigation_: Use explicit waits (`waitForSelector`, `waitForFunction`) instead of fixed delays
- **WebSocket Simulation**: Complex message sequences may be hard to mock accurately
  - _Mitigation_: Start with basic flows, add complexity incrementally
- **State Cleanup**: Tests may leave residual state affecting subsequent tests
  - _Mitigation_: Use `beforeEach`/`afterEach` hooks for consistent cleanup

### Relevant Considerations

- [P02] **act() warnings in keyboard tests**: May encounter similar timing issues in tab navigation tests; use waitFor wrappers as needed
- [P02] **Reconnection Split Responsibility**: Tests should verify useReconnection hook orchestration by observing UI status changes, not internal hook state
- [P02] **WebSocket close code handling**: Use `simulateClose(index, 1006)` utility to trigger abnormal disconnects for reconnection tests

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Not applicable - this session creates E2E tests

### Integration Tests

- Provider connection tests verify frontend + mock backend integration
- UI component tests verify React components respond to voice context changes

### Manual Testing

- Run tests locally with `npx playwright test --ui` to observe behavior
- Verify tests pass in both headed and headless modes
- Confirm test output is readable and failures are diagnosable

### Edge Cases

- Connection attempt when already connected
- Disconnect during connecting state
- Voice selection during active conversation
- Multiple rapid connect/disconnect cycles
- Network offline during conversation (if navigator.onLine mock available)
- WebSocket close with code 1000 (intentional) vs 1006 (abnormal)

---

## 10. Dependencies

### External Libraries

- `@playwright/test`: ^1.52.0 (already installed from session 01)

### Other Sessions

- **Depends on**: `phase03-session01-e2e-infrastructure`
- **Depended by**: `phase03-session05-validation-polish`

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
