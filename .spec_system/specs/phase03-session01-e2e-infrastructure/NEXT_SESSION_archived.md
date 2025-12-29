# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 03 - Testing & Configuration
**Completed Sessions**: 13 (Phases 00-02 complete)

---

## Recommended Next Session

**Session ID**: `phase03-session01-e2e-infrastructure`
**Session Name**: E2E Test Infrastructure
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: ~20-25

---

## Why This Session Next?

### Prerequisites Met

- [x] Phase 02 completed (Advanced Features)
- [x] All 3 providers functional (ElevenLabs, OpenAI, xAI)
- [x] Existing unit test infrastructure (174+ tests passing)
- [x] Node.js 18+ environment available
- [x] Backend server running for API endpoints

### Dependencies

- **Builds on**: Phase 02 complete application with voice selection, conversation history, reconnection, and function calling
- **Enables**: Session 02 (Voice Flow E2E Tests) - requires this infrastructure

### Project Progression

This is the natural first step for Phase 03. E2E test infrastructure must be established before any voice flow tests can be written. The project has 174+ unit tests but lacks E2E coverage, which is critical for preventing regressions as the application grows. Setting up Playwright with proper audio mocking utilities will enable comprehensive testing of all three voice providers.

---

## Session Overview

### Objective

Set up Playwright E2E testing infrastructure with proper audio mocking strategies and test utilities for voice agent testing.

### Key Deliverables

1. Playwright configuration (`playwright.config.ts`)
2. Test utilities for audio mocking (`tests/utils/audio-mock.ts`)
3. Mock server setup for API endpoints
4. Smoke tests for app load and tab navigation
5. GitHub Actions workflow for E2E tests
6. Documentation for running E2E tests locally

### Scope Summary

- **In Scope (MVP)**: Playwright installation/config, test file structure, audio/WebRTC mocking utilities, mock backend server, basic smoke tests, CI/CD integration
- **Out of Scope**: Full voice conversation tests (Session 02), visual regression testing, performance benchmarking

---

## Technical Considerations

### Technologies/Patterns

- Playwright Test for E2E automation
- Audio/MediaStream mocking for voice tests
- Mock server for API response simulation
- GitHub Actions for CI integration

### Potential Challenges

- **Audio mocking complexity**: Voice tests require WebRTC/MediaStream mocking strategies
- **Cross-browser audio differences**: Safari has known audio autoplay restrictions
- **Mock server coordination**: Need to mock ephemeral token endpoints for all 3 providers

### Relevant Considerations

- [P00] **Safari audio without user gesture**: AudioContext must be resumed on user click - tests need to simulate user interaction
- [P00] **API Keys**: Mock server should simulate backend proxy pattern, never expose real keys
- [P02] **WebSocket close code handling**: Tests should verify 1000 vs 1006 reconnection behavior

---

## Alternative Sessions

If this session is blocked:

1. **phase03-session03-elevenlabs-resilience** - Can be done independently as research-focused session
2. **phase03-session04-configuration-modal** - Lower priority but has no hard dependencies

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
