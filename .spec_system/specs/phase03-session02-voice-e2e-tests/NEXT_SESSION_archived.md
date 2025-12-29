# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-30
**Project State**: Phase 03 - Testing & Configuration
**Completed Sessions**: 14

---

## Recommended Next Session

**Session ID**: `phase03-session02-voice-e2e-tests`
**Session Name**: Voice Flow E2E Tests
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: 20-25

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 completed (E2E infrastructure)
- [x] Playwright configured with test utilities
- [x] Audio mocking utilities ready
- [x] Mock server infrastructure in place

### Dependencies

- **Builds on**: phase03-session01-e2e-infrastructure
- **Enables**: phase03-session05-validation-polish (comprehensive test coverage)

### Project Progression

Session 01 established the E2E testing infrastructure (Playwright, mock server, audio utilities). This session is the natural next step to implement the actual voice flow tests that validate the core functionality. These tests will provide regression protection for all three voice providers (ElevenLabs, OpenAI, xAI) and ensure the voice UI components work correctly.

---

## Session Overview

### Objective

Implement comprehensive E2E tests for voice conversation flows across all three providers, ensuring regression prevention and feature validation.

### Key Deliverables

1. Provider-specific test suites (`tests/providers/*.spec.ts`)
2. Voice UI component tests (VoiceButton, VoiceVisualizer, VoiceStatus)
3. Error handling test scenarios
4. Reconnection behavior tests (OpenAI/xAI)
5. Function calling display tests
6. Test coverage report

### Scope Summary

- **In Scope (MVP)**: Connection flow tests, voice button state transitions, conversation panel display, voice selector functionality, error state handling, reconnection behavior, function calling UI
- **Out of Scope**: Actual audio transmission (mocked), real API calls (use mocks), load testing

---

## Technical Considerations

### Technologies/Patterns

- Playwright test framework
- MSW (Mock Service Worker) for API mocking
- Audio mocking utilities from session 01
- Provider-specific mock responses

### Potential Challenges

- Ensuring test stability (avoiding flaky tests)
- Mocking WebSocket connections accurately
- Simulating reconnection scenarios
- Testing audio visualization without real audio

### Relevant Considerations

- [P02] **act() warnings in keyboard tests**: May encounter similar timing issues; use waitFor wrappers as needed
- [P02] **Reconnection Split Responsibility**: Tests should verify useReconnection hook orchestration separately from provider context connection

---

## Alternative Sessions

If this session is blocked:

1. **phase03-session03-elevenlabs-resilience** - Research-focused session requiring less infrastructure dependency
2. **phase03-session04-configuration-modal** - UI-focused session that can be developed independently

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
