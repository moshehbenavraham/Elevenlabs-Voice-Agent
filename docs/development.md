# Development Guide

## Local Environment

### Required Tools

- Node.js 18+
- npm 7+ or Bun
- Git

### Port Mappings

| Service           | Port  | URL                    |
| ----------------- | ----- | ---------------------- |
| Frontend (Vite)   | 8082  | http://localhost:8082  |
| Backend (Express) | 3001  | http://localhost:3001  |
| Test UI           | 51204 | http://localhost:51204 |

## Dev Scripts

| Command                   | Purpose                               |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | Start Vite dev server on port 8082    |
| `npm run dev:all`         | Start frontend + backend concurrently |
| `npm run build`           | Production build to `dist/`           |
| `npm run build:dev`       | Development build                     |
| `npm run preview`         | Preview production build locally      |
| `npm run lint`            | Run ESLint checks                     |
| `npm run format`          | Format code with Prettier             |
| `npm run format:check`    | Check Prettier formatting             |
| `npm run type-check`      | Run app TypeScript checks             |
| `npm run test`            | Run Vitest in watch mode              |
| `npm run test:run`        | Single test run (CI mode)             |
| `npm run test:ui`         | Visual test interface                 |
| `npm run test:e2e`        | Run Playwright E2E tests              |
| `npm run test:e2e:ui`     | Playwright visual test UI             |
| `npm run test:e2e:headed` | Run E2E tests with browser visible    |
| `npm run test:e2e:ci`     | Run the bounded CI browser subset     |
| `npm run docker:build`    | Build Docker production image         |
| `npm run docker:up`       | Start container via docker compose    |
| `npm run docker:down`     | Stop and remove container             |
| `npm run docker:logs`     | Follow container logs                 |
| `npm run docker:health`   | Check the production health endpoint  |
| `npm run docker:prod`     | Start and health-check the container  |
| `npm run demo`            | Start demo mode with ngrok            |

## Development Workflow

1. Pull latest `main`
2. Create feature branch: `git checkout -b feat/feature-name`
3. Make changes
4. Run tests: `npm run test:run`
5. Run lint: `npm run lint`
6. Commit with conventional commits
7. Open PR

## Verification Gates

Run the full local gate set before merging dependency, tooling, provider, or E2E
infrastructure changes:

```bash
npm ci
npm run lint
npm run format:check
npm run type-check
npm run test:run
npm run build
npm audit --audit-level=high
npm outdated --json
```

`npm outdated --json` should return `{}` after a planned dependency update. If it
reports newly available versions, update them or document why they are deferred.

For browser coverage:

```bash
# Chromium first for the fastest broad signal
env -u NO_COLOR npx playwright test --project=chromium --workers=1 --max-failures=1

# Full configured matrix: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
env -u NO_COLOR npx playwright test --workers=1 --max-failures=1
```

The current baseline uses a broad Vitest suite and a Playwright matrix that
passes with expected skips for disabled or intentionally skipped scenarios.

## Dependency Maintenance

- `package.json` includes an npm override for the transitive
  `node-domexception` path under `@google/genai`. Verify it with:
  `npm ls node-domexception @profoundlogic/node-domexception @google/genai --all`.
- Keep the override until upstream packages remove the deprecated dependency path.
- `@elevenlabs/react` is on the v1 provider model. Hooks that call
  `useConversation` must run under the SDK `ConversationProvider`.

## Testing

```bash
# Run all tests once
npm run test:run

# Run specific test file
npm run test:run -- src/test/ProviderContext.test.tsx

# Run with coverage
npm run test:run -- --coverage

# Watch mode for development
npm run test
```

### Test Structure

```
src/test/
|-- setup.ts                        # Test configuration and mocks
|-- App.test.tsx                    # Basic app tests
|-- ProviderContext.test.tsx        # Provider context tests
|-- ProviderTabs.test.tsx           # Tab component tests
|-- OpenAITranslationProvider.test.tsx # Translation provider tests
|-- openaiTranslation.test.ts       # Translation config helper tests
|-- openaiTranslationRoute.test.ts  # Translation backend route tests
|-- providers.test.tsx              # Voice provider tests
|-- Index.test.tsx                  # Page tests
|-- UltravoxVoiceContext.test.tsx   # Ultravox context tests (23 tests)
|-- UltravoxProvider.test.tsx       # Ultravox provider tests (21 tests)
|-- useVapiVoice.test.ts            # Vapi hook tests (41 tests)
|-- VapiProvider.test.tsx           # Vapi provider tests (41 tests)
|-- useRetellVoice.test.ts          # Retell hook tests (35 tests)
|-- RetellProvider.test.tsx         # Retell provider tests (25 tests)
|-- useGeminiVoice.test.tsx         # Gemini hook tests (41 tests)
|-- GeminiProvider.test.tsx         # Gemini provider tests (56 tests)
|-- GeminiEmptyState.test.tsx       # Gemini empty state tests (11 tests)
`-- ... (739 tests total across the repo)

src/lib/audio/__tests__/
`-- audioUtils.test.ts          # Audio utility tests

src/lib/gemini/__tests__/
|-- audioUtils.test.ts          # Gemini PCM encoding tests (28 tests)
|-- genai-live-client.test.ts   # WebSocket client tests (26 tests)
`-- config.test.ts              # Voice/model config tests (43 tests)
```

## E2E Testing (Playwright)

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/providers/openai.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Open Playwright UI for debugging
npm run test:e2e:ui

# Generate test report
npx playwright show-report
```

### E2E Test Structure

```
tests/e2e/
|-- fixtures/                   # Playwright fixtures
|   |-- audio-mock.fixture.ts   # Combined audio/websocket mock
|   `-- index.ts                # Fixture exports
|-- page-objects/
|   `-- VoicePage.ts            # Page object model
|-- providers/                  # Provider-specific tests
|   |-- elevenlabs.spec.ts      # ElevenLabs widget/SDK tests
|   |-- openai.spec.ts          # OpenAI provider tests
|   |-- xai.spec.ts             # xAI provider tests
|   `-- gemini.spec.ts          # Gemini provider tests (19 tests)
|-- voice-ui/                   # Voice UI component tests
|   |-- voice-button.spec.ts
|   |-- voice-selector.spec.ts
|   |-- conversation-panel.spec.ts
|   `-- function-calling.spec.ts
|-- error-handling/             # Error and reconnection tests
|   |-- api-errors.spec.ts
|   |-- reconnection.spec.ts
|   `-- elevenlabs-reconnection.spec.ts
|-- smoke/                      # Quick smoke tests
|   |-- app-load.spec.ts
|   |-- tab-navigation.spec.ts
|   `-- provider-render.spec.ts
`-- utils/                      # Mock utilities
    |-- audio-mock.ts           # MediaDevices/AudioContext mock
    |-- websocket-mock.ts       # WebSocket simulation
    `-- mock-server.ts          # API route interception
```

### Browser Coverage

E2E tests run on 5 browser projects:

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Mocking

The test setup includes mocks for:

- Web Audio API (AudioContext, AnalyserNode)
- MediaDevices (getUserMedia)
- IntersectionObserver
- ResizeObserver
- matchMedia

## Debugging

### Browser DevTools

1. Open Chrome DevTools
2. Use React DevTools extension for component inspection
3. Check Network tab for API calls
4. Console for errors and logs

### Voice Connection Issues

```javascript
// In browser console
localStorage.setItem('debug', 'elevenlabs:*');
// Refresh page for verbose logging
```

### Backend Debugging

```bash
# Run server with debug logging
DEBUG=express:* node server/index.js
```

### Audio Debugging

The xAI voice context logs audio events:

- WebSocket connection status
- Audio chunk sizes
- Playback queue state

Check console for `[XAIVoice]` prefixed messages.

## Code Style

### TypeScript

- Use interfaces for object shapes
- Avoid `any` - use proper types
- Export types from `src/types/`

### Components

- Functional components only
- Props interfaces for all components
- Use custom hooks for complex logic

### Naming Conventions

- Components: `PascalCase` (e.g., `VoiceButton`)
- Hooks: `camelCase` with `use` prefix (e.g., `useVoice`)
- Files: Match export name
- Constants: `UPPER_SNAKE_CASE`

## Adding a New Provider

1. **Create Voice Context**

   ```typescript
   // src/contexts/NewProviderVoiceContext.tsx
   export const NewProviderVoiceProvider = ({ children }) => {
     // Connection logic, state management
   };
   ```

2. **Create Provider Component**

   ```typescript
   // src/components/providers/NewProvider.tsx
   export const NewProviderVoiceButton = () => { ... };
   export const NewProviderEmptyState = () => { ... };
   ```

3. **Add to Types**

   ```typescript
   // src/types/voice-provider.ts
   export type ProviderType = 'elevenlabs' | 'xai' | 'newprovider';
   ```

4. **Register in PROVIDERS**

   ```typescript
   // src/types/voice-provider.ts
   export const PROVIDERS: VoiceProvider[] = [
     // ... existing
     { id: 'newprovider', name: 'New Provider', ... }
   ];
   ```

5. **Add Backend Route** (if needed)

   ```javascript
   // server/routes/newprovider.js
   ```

6. **Update Index.tsx**
   Add conditional rendering for the new provider tab.

## Performance Tips

- Use `React.memo` for expensive components
- Avoid unnecessary re-renders with `useMemo`/`useCallback`
- Audio visualization runs at 60fps - keep handlers lean
- Use `useReducedMotion` hook for accessibility

## Mode Switching (Local vs Demo)

This project supports two runtime modes during development:

| Aspect         | Local development                | Demo mode                        |
| -------------- | -------------------------------- | -------------------------------- |
| Command        | `npm run dev:all`                | `npm run demo`                   |
| Frontend       | Vite HMR on port 8082            | Production build from `dist/`    |
| Backend        | Express on port 3001             | Express on port 3001             |
| Public access  | None                             | Single ngrok tunnel to port 3001 |
| API routing    | Cross-origin frontend to backend | Same-origin relative API paths   |
| Runtime config | `public/config.js` local stub    | `dist/config.js` demo config     |
| Hot reload     | Yes                              | No                               |

### Switching Modes

Before starting demo mode:

1. Stop local servers.
2. Verify ports 3001 and 4041 are free.
3. Confirm `.env` has the provider credentials needed for the demo.
4. Run `npm run demo`.

After stopping demo mode, run the full reset when returning to local work:

```bash
./scripts/reset-dev-mode.sh
npm run dev:all
```

`npm run dev:all` recreates the local `public/config.js` stub through the npm
`predev` hook, but the reset script is the full cleanup path for stale ngrok
files, old demo environment overrides, and occupied ports.

### API URL Pattern

Frontend code that calls backend routes should resolve the API base URL at call
time:

```typescript
import { getApiBaseUrl } from '@/lib/apiConfig';

const response = await fetch(`${getApiBaseUrl()}/api/endpoint`);
```

Avoid hardcoded `localhost` API URLs in provider code. In demo mode,
`getApiBaseUrl()` can intentionally return an empty string so requests use
same-origin relative paths.

### Quick Cleanup

After running demo mode, reset to local development:

```bash
./scripts/reset-dev-mode.sh
```

### Generated Files

These files can cause issues if they persist after mode switching:

| File                      | Created By                                | Cleanup                                                             |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `dist/config.js`          | Demo mode                                 | Deleted by `npm run demo` shutdown or `./scripts/reset-dev-mode.sh` |
| `public/config.js`        | npm lifecycle hooks and older ngrok flows | Reset to a local stub by npm lifecycle hooks or reset script        |
| `server/.env.demo`        | Older ngrok URL configuration flow        | Deleted by `./scripts/reset-dev-mode.sh`                            |
| `scripts/ngrok/ngrok.yml` | ngrok tunnel startup                      | Deleted by `./scripts/reset-dev-mode.sh`                            |

### High-Risk Files

Changes in these files should be tested in both local and demo mode:

| File                             | Risk                                                 |
| -------------------------------- | ---------------------------------------------------- |
| `src/lib/apiConfig.ts`           | API route resolution can break local or demo mode    |
| `server/index.js`                | Static serving, CORS, and demo environment loading   |
| `vite.config.ts`                 | Build output, dev server, and proxy behavior         |
| `scripts/demo.sh`                | Demo startup, runtime config, and cleanup            |
| `src/contexts/*VoiceContext.tsx` | Provider-specific connection lifecycle and API calls |

### Mode Verification

For API routing, server, Vite, or demo-script changes, verify:

```bash
npm run lint
npm run test:run
npm run build
```

Then smoke-test both modes:

1. Local: `npm run dev:all`, open `http://localhost:8082`, and confirm API calls
   target `http://localhost:3001`.
2. Demo: `npm run demo`, open the ngrok URL, and confirm API calls use relative
   `/api/*` paths on the same origin.

## Common Gotchas

1. **AudioWorklet requires HTTPS** in production
2. **Microphone access** needs user gesture on Safari
3. **WebSocket connections** close on tab background (mobile)
4. **localStorage** is synchronous - don't store large data
5. **Stale config files** can break API calls after mode switching - run `./scripts/reset-dev-mode.sh`
