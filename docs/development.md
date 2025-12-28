# Development Guide

## Local Environment

### Required Tools

- Node.js 18+
- npm 7+ or Bun
- Git

### Port Mappings

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 8082 | http://localhost:8082 |
| Backend (Express) | 3001 | http://localhost:3001 |
| Test UI | 51204 | http://localhost:51204 |

## Dev Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server on port 8082 |
| `npm run dev:all` | Start frontend + backend concurrently |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Single test run (CI mode) |
| `npm run test:ui` | Visual test interface |

## Development Workflow

1. Pull latest `main`
2. Create feature branch: `git checkout -b feat/feature-name`
3. Make changes
4. Run tests: `npm run test:run`
5. Run lint: `npm run lint`
6. Commit with conventional commits
7. Open PR

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
├── setup.ts                    # Test configuration and mocks
├── App.test.tsx                # Basic app tests
├── ProviderContext.test.tsx    # Provider context tests
├── ProviderTabs.test.tsx       # Tab component tests
├── providers.test.tsx          # Voice provider tests
└── Index.test.tsx              # Page tests

src/lib/audio/__tests__/
└── audioUtils.test.ts          # Audio utility tests
```

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

## Common Gotchas

1. **AudioWorklet requires HTTPS** in production
2. **Microphone access** needs user gesture on Safari
3. **WebSocket connections** close on tab background (mobile)
4. **localStorage** is synchronous - don't store large data
