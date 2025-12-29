# Session Specification

**Session ID**: `phase03-session01-e2e-infrastructure`
**Phase**: 03 - Testing & Configuration
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session establishes the foundational E2E testing infrastructure for the Conversational Voice AI Agents application. With 174+ unit tests already passing across the codebase, the project now needs comprehensive E2E coverage to prevent regressions as the application grows and to validate the complete user journey across all three voice providers (ElevenLabs, OpenAI, xAI).

The primary challenge is testing voice-based applications in an automated environment. Voice agents require microphone access, WebSocket connections, and real-time audio processing--none of which can run unmodified in CI/CD pipelines. This session solves that by creating robust mocking utilities for audio/WebRTC APIs and a mock server to simulate backend responses without exposing real API keys.

This infrastructure directly enables Session 02 (Voice Flow E2E Tests) and establishes patterns that will be used throughout the remaining Phase 03 sessions and future development.

---

## 2. Objectives

1. Install and configure Playwright with proper TypeScript support and multi-browser testing capability
2. Create audio/WebRTC mocking utilities that prevent actual microphone access while simulating realistic voice interactions
3. Establish a mock server setup that simulates ephemeral token endpoints for all three providers
4. Implement smoke tests covering app load, tab navigation, and basic provider UI rendering
5. Integrate E2E tests into GitHub Actions CI/CD pipeline with proper caching and parallelization

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session05-polish` - Phase 02 complete with all providers functional
- [x] All Phase 00, 01, 02 sessions - Three-provider architecture fully implemented

### Required Tools/Knowledge

- Playwright testing framework fundamentals
- WebRTC/MediaStream API mocking strategies
- GitHub Actions workflow configuration
- Understanding of existing Vitest test setup (for consistency)

### Environment Requirements

- Node.js 18+ (already present per project requirements)
- Backend server (`server/index.js`) running for API endpoints
- All three providers configured in development (`.env` file)

---

## 4. Scope

### In Scope (MVP)

- Playwright installation and `playwright.config.ts` configuration
- Test directory structure following project conventions (`tests/e2e/`)
- Audio mocking utilities for MediaDevices, AudioContext, MediaStream
- WebSocket mocking utilities for realtime API connections
- Mock server setup simulating `/api/xai/session`, `/api/openai/session`, `/api/elevenlabs/signed-url`
- Smoke tests: app load, tab rendering, tab navigation with keyboard
- GitHub Actions workflow with browser caching
- Documentation in `tests/e2e/README.md`

### Out of Scope (Deferred)

- Full voice conversation E2E tests - _Reason: Session 02 scope_
- Visual regression testing - _Reason: Not prioritized in Phase 03_
- Performance benchmarking - _Reason: Separate concern, possible Phase 04_
- Real API key testing - _Reason: Security concern, mock-only approach_

---

## 5. Technical Approach

### Architecture

```
tests/
|-- e2e/                          # E2E test directory (new)
|   |-- fixtures/                 # Playwright fixtures
|   |   |-- audio-mock.fixture.ts # Audio mocking fixture
|   |   `-- index.ts              # Combined fixtures export
|   |-- utils/                    # Test utilities
|   |   |-- audio-mock.ts         # MediaDevices/AudioContext mocks
|   |   |-- websocket-mock.ts     # WebSocket simulation
|   |   `-- mock-server.ts        # API endpoint mocks
|   |-- smoke/                    # Smoke tests
|   |   |-- app-load.spec.ts      # App loads without errors
|   |   |-- tab-navigation.spec.ts # Tab switching and keyboard nav
|   |   `-- provider-render.spec.ts # Each provider renders correctly
|   `-- README.md                 # E2E documentation
|-- setup.ts                      # Existing Vitest setup (unchanged)
playwright.config.ts              # Playwright configuration (new)
.github/workflows/e2e.yml         # GitHub Actions workflow (new)
```

### Design Patterns

- **Fixtures Pattern**: Playwright's fixture system for reusable test setup (audio mocks, page objects)
- **Page Object Model**: Not needed for smoke tests, but structure allows future addition
- **Mock Service Worker Pattern**: Intercept network requests at the browser level for API simulation

### Technology Stack

- Playwright Test `^1.40.0` - E2E testing framework
- `@playwright/test` types for TypeScript support
- Native browser APIs mocked via `page.addInitScript()`

---

## 6. Deliverables

### Files to Create

| File                                       | Purpose                                                   | Est. Lines |
| ------------------------------------------ | --------------------------------------------------------- | ---------- |
| `playwright.config.ts`                     | Playwright configuration with browsers, timeout, base URL | ~60        |
| `tests/e2e/fixtures/audio-mock.fixture.ts` | Reusable audio mocking fixture                            | ~40        |
| `tests/e2e/fixtures/index.ts`              | Fixture exports                                           | ~10        |
| `tests/e2e/utils/audio-mock.ts`            | MediaDevices, AudioContext, MediaStream mocks             | ~80        |
| `tests/e2e/utils/websocket-mock.ts`        | WebSocket connection simulation                           | ~60        |
| `tests/e2e/utils/mock-server.ts`           | API endpoint mock responses                               | ~50        |
| `tests/e2e/smoke/app-load.spec.ts`         | Verify app loads, no console errors                       | ~40        |
| `tests/e2e/smoke/tab-navigation.spec.ts`   | Tab switching, keyboard nav (Arrow keys, Tab, Enter)      | ~70        |
| `tests/e2e/smoke/provider-render.spec.ts`  | Each provider tab renders correct UI                      | ~60        |
| `tests/e2e/README.md`                      | E2E testing documentation                                 | ~80        |
| `.github/workflows/e2e.yml`                | GitHub Actions E2E workflow                               | ~60        |

### Files to Modify

| File           | Changes                                                    | Est. Lines |
| -------------- | ---------------------------------------------------------- | ---------- |
| `package.json` | Add Playwright dev dependency and test scripts             | ~10        |
| `.gitignore`   | Add Playwright artifacts (test-results, playwright-report) | ~3         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `npx playwright test` runs successfully with all smoke tests passing
- [ ] Audio mocks prevent actual getUserMedia/microphone prompts
- [ ] Mock server returns valid ephemeral token responses
- [ ] Tab navigation tests verify keyboard accessibility (Tab, Arrow keys, Enter/Space)
- [ ] All three provider tabs render without JavaScript errors

### Testing Requirements

- [ ] Smoke tests pass in Chromium, Firefox, and WebKit (mobile Safari)
- [ ] Tests run in headless mode for CI
- [ ] Test execution completes in under 2 minutes

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No TypeScript errors in test files
- [ ] ESLint passes on new test files

---

## 8. Implementation Notes

### Key Considerations

- Playwright runs in real browsers, so mocks must be injected before page load via `page.addInitScript()`
- Audio mocking must handle both initial render and user-triggered connections
- Mock server should simulate realistic latency (~100ms) to catch race conditions
- Tests should use `test.describe.configure({ mode: 'parallel' })` for speed

### Potential Challenges

- **Safari AudioContext quirk**: Safari requires user gesture for AudioContext resume - mock should bypass this
- **WebSocket close code testing**: Need to simulate both 1000 (intentional) and 1006 (abnormal) close codes for reconnection tests
- **Flaky CI tests**: Use `test.setTimeout()` and proper `waitFor` patterns to avoid timing issues

### Relevant Considerations

<!-- From CONSIDERATIONS.md -->

- [P00] **Safari audio without user gesture**: AudioContext must be resumed on user click - tests need to simulate user interaction before audio operations
- [P00] **API Keys**: Mock server must never expose real keys; use hardcoded test tokens
- [P02] **WebSocket close code handling**: Mock WebSocket should support close code simulation for reconnection behavior tests

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- None required - this session creates E2E infrastructure, not application code
- Existing unit tests (174+) continue to run via Vitest

### Integration Tests

- N/A for this session

### Manual Testing

- Run `npm run test:e2e` locally to verify configuration
- Confirm Playwright HTML report generates correctly
- Verify GitHub Actions workflow executes successfully on push

### Edge Cases

- App load with no providers enabled (all `VITE_*_ENABLED=false`)
- Tab navigation when only one provider is configured
- Rapid tab switching (potential race conditions)
- Slow network simulation (mock server delay testing)

---

## 10. Dependencies

### External Libraries

- `@playwright/test`: ^1.40.0 (E2E testing framework)

### Other Sessions

- **Depends on**: All Phase 00-02 sessions (three-provider architecture)
- **Depended by**: `phase03-session02-voice-e2e-tests` (uses this infrastructure)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
