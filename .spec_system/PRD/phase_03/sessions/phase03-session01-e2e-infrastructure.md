# Session 01: E2E Test Infrastructure

**Session ID**: `phase03-session01-e2e-infrastructure`
**Status**: Not Started
**Estimated Tasks**: ~20-25
**Estimated Duration**: 2-4 hours

---

## Objective

Set up Playwright E2E testing infrastructure with proper audio mocking strategies and test utilities for voice agent testing.

---

## Scope

### In Scope (MVP)

- Playwright installation and configuration
- Test file structure and conventions
- Audio/WebRTC mocking utilities
- Mock backend server for API responses
- Basic smoke tests for each provider tab
- CI/CD integration with GitHub Actions

### Out of Scope

- Full voice conversation tests (Session 02)
- Visual regression testing
- Performance benchmarking

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] All 3 providers functional in development
- [ ] Backend server running for API endpoints

---

## Deliverables

1. Playwright configuration (`playwright.config.ts`)
2. Test utilities for audio mocking (`tests/utils/audio-mock.ts`)
3. Mock server setup for API endpoints
4. Smoke tests for app load and tab navigation
5. GitHub Actions workflow for E2E tests
6. Documentation for running E2E tests locally

---

## Success Criteria

- [ ] Playwright installed and configured
- [ ] Tests run successfully in CI
- [ ] Audio mocking prevents actual microphone access
- [ ] All 3 provider tabs render correctly in tests
- [ ] Tab switching works in E2E tests
