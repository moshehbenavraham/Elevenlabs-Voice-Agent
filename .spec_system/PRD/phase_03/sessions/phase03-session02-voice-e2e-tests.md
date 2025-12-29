# Session 02: Voice Flow E2E Tests

**Session ID**: `phase03-session02-voice-e2e-tests`
**Status**: Not Started
**Estimated Tasks**: ~20-25
**Estimated Duration**: 3-4 hours

---

## Objective

Implement comprehensive E2E tests for voice conversation flows across all three providers, ensuring regression prevention and feature validation.

---

## Scope

### In Scope (MVP)

- Connection flow tests for each provider
- Voice button state transitions (idle -> connecting -> connected)
- Conversation panel display tests
- Voice selector functionality tests
- Error state handling tests
- Reconnection behavior tests (OpenAI/xAI)
- Function calling UI tests

### Out of Scope

- Actual audio transmission (mocked)
- Real API calls to providers (use mock responses)
- Load testing

---

## Prerequisites

- [ ] Session 01 completed (E2E infrastructure)
- [ ] Audio mocking utilities ready
- [ ] Mock server configured

---

## Deliverables

1. Provider-specific test suites (`tests/providers/*.spec.ts`)
2. Voice UI component tests
3. Error handling test scenarios
4. Reconnection flow tests
5. Function calling display tests
6. Test coverage report

---

## Success Criteria

- [ ] 80%+ coverage of voice UI flows
- [ ] All 3 providers have connection tests
- [ ] Error states properly tested
- [ ] Reconnection logic validated
- [ ] Tests pass in CI pipeline
- [ ] No flaky tests (stable in 3 consecutive runs)
