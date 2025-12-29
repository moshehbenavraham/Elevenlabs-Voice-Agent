# E2E Testing

End-to-end testing infrastructure for the Conversational Voice AI Agents application using Playwright.

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

## Test Structure

```
tests/e2e/
|-- fixtures/              # Playwright fixtures for test setup
|   |-- audio-mock.fixture.ts   # Audio mocking fixture
|   `-- index.ts           # Fixture exports
|-- utils/                 # Testing utilities
|   |-- audio-mock.ts      # MediaDevices/AudioContext mocks
|   |-- websocket-mock.ts  # WebSocket simulation
|   `-- mock-server.ts     # API endpoint mocks
|-- smoke/                 # Smoke tests
|   |-- app-load.spec.ts   # Application load tests
|   |-- tab-navigation.spec.ts  # Tab navigation tests
|   `-- provider-render.spec.ts # Provider render tests
`-- README.md              # This file
```

## Running Tests

### Local Development

```bash
# Run all tests in Chromium (fastest)
npx playwright test --project=chromium

# Run specific test file
npx playwright test tests/e2e/smoke/app-load.spec.ts

# Run tests with debugging
npx playwright test --debug

# Run with trace on first retry
npx playwright test --trace on-first-retry
```

### Cross-Browser Testing

```bash
# Run in all browsers
npx playwright test --project=chromium --project=firefox --project=webkit

# Run mobile viewports
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
```

### CI/CD

Tests automatically run on push/PR to main via GitHub Actions (`.github/workflows/e2e.yml`).

## Mocking Strategy

### Audio APIs

Audio APIs are mocked to prevent actual microphone access during testing:

- `navigator.mediaDevices.getUserMedia()` - Returns mock MediaStream
- `AudioContext` - Returns mock implementation with silent operation
- `MediaStream` / `MediaStreamTrack` - Full mock implementations

Mocks are injected via `page.addInitScript()` before page load.

### WebSocket Connections

WebSocket connections to voice providers are mocked:

- OpenAI Realtime API (`wss://api.openai.com/v1/realtime`)
- xAI Realtime API (`wss://api.x.ai/v1/realtime`)
- ElevenLabs WebSocket connections

Mock WebSocket simulates:

- Connection lifecycle (open, close, error)
- Message responses for common patterns
- Close codes 1000 (intentional) and 1006 (abnormal)

### API Endpoints

Backend API endpoints are intercepted with Playwright routing:

- `/api/openai/session` - Returns mock ephemeral token
- `/api/xai/session` - Returns mock ephemeral token
- `/api/elevenlabs/signed-url` - Returns mock signed URL

Configure mock behavior:

```typescript
await setupMockServer(page, {
  latency: 100, // Simulate network delay
  failOpenAI: false, // Simulate API failure
  failXAI: false,
  failElevenLabs: false,
});
```

## Writing Tests

### Using Fixtures

```typescript
import { test, expect } from '../fixtures';

test('my test', async ({ mockedPage }) => {
  // mockedPage has audio mocks and API routes pre-configured
  await mockedPage.goto('/');
  await expect(mockedPage.locator('h1')).toBeVisible();
});
```

### Test Patterns

```typescript
// Wait for full page load
await mockedPage.waitForLoadState('networkidle');

// Handle optional elements
const tabs = mockedPage.locator('[role="tab"]');
if ((await tabs.count()) < 2) {
  test.skip();
  return;
}

// Parallel test execution
test.describe.configure({ mode: 'parallel' });
```

## Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:8082`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeout**: 30s per test
- **Retries**: 2 in CI, 0 locally
- **Web Server**: Automatically starts dev server before tests

## Debugging

### View Test Report

```bash
npx playwright show-report
```

### Debug Mode

```bash
# Step through test
npx playwright test --debug

# Headed mode with slowMo
npx playwright test --headed --slow-mo=1000
```

### Screenshots

Failed tests automatically capture screenshots. Find them in:

- `test-results/` (local)
- GitHub Actions artifacts (CI)

## Troubleshooting

### Tests Timeout

- Increase timeout: `test.setTimeout(60000)`
- Check if dev server is running
- Verify mocks are injecting correctly

### Browser-Specific Failures

- Firefox: May have WebGL/AudioContext quirks (filtered in error checks)
- Safari: Requires user gesture simulation for audio

### Flaky Tests

1. Add explicit waits: `await expect(element).toBeVisible()`
2. Use `waitForLoadState("networkidle")`
3. Add small delays after interactions: `await page.waitForTimeout(200)`
4. CI has 2 retries configured for transient failures
