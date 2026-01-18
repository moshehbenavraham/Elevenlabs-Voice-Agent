# Session Specification

**Session ID**: `phase00-session05-testing-polish`
**Phase**: 00 - Gemini Live Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session completes Phase 00 by adding comprehensive test coverage for the Gemini Live provider implementation and ensuring all quality gates are met. The Gemini provider components (GeminiProvider, GeminiEmptyState, useGeminiVoice hook, GenAILiveClient, audio utilities) were implemented in sessions 01-04 and now require thorough testing to validate correctness and prevent regressions.

The session focuses on three areas: (1) E2E tests using Playwright to validate the complete Gemini voice flow in a browser environment, (2) unit tests for components not yet covered, and (3) documentation updates to CLAUDE.md to capture all Gemini integration details for future development. This final session ensures the Gemini provider meets the same quality bar as existing providers before the phase is marked complete.

Cross-browser verification is also in scope to confirm AudioWorklet behavior works consistently across Chrome, Firefox, Safari, and Edge. This is particularly important because Safari has historically had different AudioWorklet support.

---

## 2. Objectives

1. Add E2E test suite for Gemini provider voice flow using Playwright
2. Add unit tests for GeminiProvider and GeminiEmptyState components
3. Update CLAUDE.md documentation with complete Gemini integration details
4. Verify all quality gates pass (TypeScript, ESLint, tests, cross-browser)

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-dependencies-audio-infra` - AudioWorklet, audio utilities
- [x] `phase00-session02-genai-client-backend` - GenAILiveClient, backend token endpoint
- [x] `phase00-session03-voice-hook-context` - useGeminiVoice, GeminiVoiceContext
- [x] `phase00-session04-provider-component` - GeminiProvider, GeminiEmptyState, UI integration

### Required Tools/Knowledge

- Vitest + React Testing Library for unit tests
- Playwright for E2E tests
- WebSocket mocking patterns from existing provider tests
- Existing test infrastructure in src/test/ and tests/e2e/

### Environment Requirements

- Node.js runtime for running tests
- Playwright browsers installed for E2E tests
- Backend server available for token endpoint testing (can be mocked)

---

## 4. Scope

### In Scope (MVP)

- E2E tests for Gemini voice flow (tab display, button states, connection, disconnect)
- Unit tests for GeminiProvider component (render, connection flow, UI states)
- Unit tests for GeminiEmptyState component (render, props)
- Update CLAUDE.md with Gemini integration section (item 7 in Key Integration Points)
- Verify TypeScript compilation with no errors
- Verify ESLint passes with no warnings
- Document cross-browser testing results (manual verification notes)

### Out of Scope (Deferred)

- GenAILiveClient unit tests - _Reason: Already tested indirectly via useGeminiVoice.test.tsx mocks_
- Audio utility unit tests - _Reason: Audio code is tightly coupled to browser APIs; E2E coverage sufficient_
- Performance optimization - _Reason: Baseline implementation is sufficient for MVP_
- Session resumption improvements - _Reason: Advanced feature for future phases_
- Thinking mode visualization - _Reason: Advanced feature for future phases_
- Automated cross-browser CI - _Reason: Manual verification sufficient for MVP_

---

## 5. Technical Approach

### Architecture

Tests follow the existing project patterns:

- Unit tests use Vitest + React Testing Library with mocked dependencies
- E2E tests use Playwright with page objects and mock servers
- WebSocket connections are mocked to avoid external dependencies
- Audio APIs are mocked in jsdom environment

### Design Patterns

- **Page Object Pattern**: E2E tests use VoicePage class for consistent selectors
- **Mock Injection**: Tests inject mocks before navigation via addInitScript
- **Component Testing**: Unit tests render components with provider wrappers
- **Behavior-Driven Tests**: Test names describe scenarios and expectations

### Technology Stack

- Vitest 2.x for unit test runner
- @testing-library/react for component testing
- Playwright for E2E browser automation
- jsdom for simulated DOM environment
- Custom mocks for WebSocket, Web Audio API

---

## 6. Deliverables

### Files to Create

| File                                 | Purpose                                   | Est. Lines |
| ------------------------------------ | ----------------------------------------- | ---------- |
| `tests/e2e/providers/gemini.spec.ts` | E2E tests for Gemini voice flow           | ~200       |
| `src/test/GeminiProvider.test.tsx`   | Unit tests for GeminiProvider component   | ~150       |
| `src/test/GeminiEmptyState.test.tsx` | Unit tests for GeminiEmptyState component | ~60        |

### Files to Modify

| File                                  | Changes                                        | Est. Lines |
| ------------------------------------- | ---------------------------------------------- | ---------- |
| `CLAUDE.md`                           | Add Gemini to Key Integration Points section 7 | ~30        |
| `tests/e2e/page-objects/VoicePage.ts` | Add Gemini provider selectors if needed        | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] E2E tests pass for Gemini tab display
- [ ] E2E tests pass for Gemini voice button states (idle, loading, connected)
- [ ] E2E tests pass for Gemini WebSocket connection mock
- [ ] E2E tests pass for Gemini disconnect flow
- [ ] Unit tests pass for GeminiProvider rendering
- [ ] Unit tests pass for GeminiProvider connection states
- [ ] Unit tests pass for GeminiEmptyState rendering

### Testing Requirements

- [ ] All new unit tests pass via `bun run test:run`
- [ ] E2E tests pass via `bun run test:e2e` (or playwright test)
- [ ] Existing tests continue to pass (no regressions)

### Quality Gates

- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions from CONVENTIONS.md

---

## 8. Implementation Notes

### Key Considerations

- Follow existing provider test patterns (see VapiProvider.test.tsx, RetellProvider.test.tsx)
- E2E tests should use existing mock utilities from tests/e2e/utils/
- GeminiProvider tests need to mock GeminiVoiceContext
- useGeminiVoice.test.tsx already exists with 867 lines of coverage - no need to duplicate

### Potential Challenges

- **AudioWorklet Mocking**: jsdom does not support AudioWorklet; must mock at module level
- **Safari AudioWorklet**: May have different behavior; document manual testing results
- **WebSocket Mock Timing**: E2E connection state transitions require careful timing
- **Context Provider Wrapping**: Components need GeminiVoiceProvider wrapper for testing

### Relevant Considerations

- [P00] **Provider Pattern**: Tests should verify Context + Hook + Provider component architecture matches other providers
- [P00] **API Key Security**: Tests must verify token endpoint is called, not raw API key exposed
- [P00] **Ephemeral token pattern**: E2E tests should mock token endpoint response

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- GeminiProvider: Render test, connection state display, button click handlers
- GeminiEmptyState: Render test, props forwarding, styling classes

### Integration Tests

- Covered by E2E tests (provider + context + hook integration)

### E2E Tests

- Tab display and selection
- Voice button state transitions (idle -> loading -> connected -> idle)
- WebSocket connection establishment (mocked)
- Disconnect flow and cleanup
- Voice selector interaction (if applicable)
- Conversation panel display

### Manual Testing

- Chrome: Full voice flow with real Gemini API
- Firefox: Full voice flow with real Gemini API
- Safari: AudioWorklet behavior verification
- Edge: Full voice flow with real Gemini API

### Edge Cases

- Token fetch failure should show error state
- WebSocket disconnect should return to idle state
- Mute toggle should not break audio pipeline
- Provider switch should disconnect cleanly

---

## 10. Dependencies

### External Libraries

- `vitest`: ^2.0.0
- `@testing-library/react`: ^16.0.0
- `@playwright/test`: ^1.40.0
- `jsdom`: ^24.0.0

### Other Sessions

- **Depends on**: phase00-session01, phase00-session02, phase00-session03, phase00-session04
- **Depended by**: None (final session of Phase 00)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
