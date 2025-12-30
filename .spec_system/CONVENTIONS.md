# CONVENTIONS.md

## Guiding Principles

- Optimize for readability over cleverness
- Code is written once, read many times
- Consistency beats personal preference
- If it can be automated, automate it

## TypeScript & React

- Use TypeScript interfaces for all props (`interface FooProps {}`)
- Prefer `function` components over arrow functions for top-level components
- Use descriptive names: `isConnected`, `hasError`, `shouldRetry`
- Keep components focused on one responsibility
- Extract hooks for reusable stateful logic

## Naming

- Components: PascalCase (`VoiceButton.tsx`)
- Hooks: camelCase with `use` prefix (`useVoiceProvider.ts`)
- Contexts: PascalCase with `Context` suffix (`VoiceContext.tsx`)
- Types/Interfaces: PascalCase (`VoiceProviderState`)
- Constants: SCREAMING_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- Match domain language--use the same terms as product/design

## Files & Structure

- One component per file
- File names match their primary export
- Group by feature/domain, not by type (prefer `voice/VoiceButton.tsx` over `buttons/Voice.tsx`)
- Keep nesting shallow--if you're 4+ levels deep, reconsider

## Styling (Tailwind)

- Tailwind utilities first, custom CSS only for complex animations
- Use glassmorphism patterns: `backdrop-blur-lg`, `bg-white/10`
- Respect `prefers-reduced-motion` for animations
- Touch targets minimum 44px for mobile
- Responsive breakpoints: 375px, 768px, 1024px

## State Management

- Theme: Context API (`ThemeContext`)
- Server data: Tanstack Query
- Local component state: `useState`/`useReducer`
- Shared UI state: Custom hooks or Context
- Provider-specific state: Separate contexts (e.g., `VoiceContext`, `XAIVoiceContext`, `OpenAIVoiceContext`)

## Error Handling

- Fail fast in development, gracefully in production
- Errors should be actionable--include context for debugging
- Use toast notifications for user-facing errors
- Log errors with enough context to reproduce

## Testing

- Test behavior, not implementation
- Use React Testing Library patterns
- Mock external APIs and browser APIs (Web Audio, etc.)
- Test file: `ComponentName.test.tsx` alongside component

## Git & Version Control

- Commit messages: imperative mood, concise (`Add user validation`)
- One logical change per commit
- Branch names: `type/short-description` (e.g., `feat/xai-integration`)
- Keep commits atomic enough to revert safely

## Comments

- Explain _why_, not _what_
- TODOs include context: `// TODO(name): reason`
- Update or remove comments when code changes
- Delete commented-out code--that's what git is for

## Dependencies

- Fewer dependencies = less risk
- Justify additions; prefer well-maintained, focused libraries
- Pin versions; update intentionally

## Security

- Never expose API keys in browser code
- Use backend proxy for sensitive credentials (ephemeral token pattern)
- Validate at system boundaries (user input, external APIs)
- HTTPS required for microphone access in production

## Performance

- Audio visualizations throttled to 60fps
- Lazy loading for heavy components
- Mobile optimizations via `use-mobile` hook
- Monitor bundle size when adding dependencies

## Local Dev Tools

| Category     | Tool                | Config                                     |
| ------------ | ------------------- | ------------------------------------------ |
| Formatter    | Prettier            | `.prettierrc`                              |
| Linter       | ESLint              | `eslint.config.js`                         |
| Type Checker | TypeScript (strict) | `tsconfig.json`                            |
| Testing      | Vitest + Playwright | `vitest.config.ts`, `playwright.config.ts` |
| Git Hooks    | Husky + lint-staged | `.husky/pre-commit`                        |

## CI/CD

Platform: GitHub Actions

| Bundle       | Status     | Workflow                                                  |
| ------------ | ---------- | --------------------------------------------------------- |
| Code Quality | configured | `.github/workflows/quality.yml`                           |
| Build & Test | configured | `.github/workflows/test.yml`                              |
| Security     | configured | `.github/workflows/security.yml`                          |
| Integration  | configured | `.github/workflows/e2e.yml`                               |
| Operations   | configured | `.github/workflows/release.yml`, `.github/dependabot.yml` |

## Development Environment

**Primary Use Case**: Local Development & Self-Hosted Deployment

This project is designed to run locally during development and deploy to self-hosted infrastructure via Coolify. It is NOT optimized for serverless platforms (Vercel, Netlify) without modification.

### Local Development

| Component  | Port | Command           | Notes                         |
| ---------- | ---- | ----------------- | ----------------------------- |
| Frontend   | 8082 | `npm run dev`     | Vite dev server with HMR      |
| Backend    | 3001 | `node server/`    | Express API server            |
| Full Stack | both | `npm run dev:all` | Concurrent frontend + backend |

### Required for Local Development

- Node.js 18+ / Bun
- `.env` file with API keys (see `.env.example`)
- Modern browser with microphone access

## Infrastructure

Platform: Express.js (Node.js) + Self-Hosted (Coolify)

| Bundle   | Status     | Details                                                                            |
| -------- | ---------- | ---------------------------------------------------------------------------------- |
| Health   | configured | `/api/health` - uptime, memory, service status, security info                      |
| Security | configured | CORS + rate limiting (100 req/15min API, 10 req/min tokens) via express-rate-limit |
| Backup   | N/A        | No database in project                                                             |
| Deploy   | configured | Coolify self-hosted deployment (Docker-based)                                      |

### Coolify Deployment

**Platform**: [Coolify](https://coolify.io) - Self-hosted PaaS alternative to Heroku/Vercel

| Component   | Type         | Details                                          |
| ----------- | ------------ | ------------------------------------------------ |
| Frontend    | Static Build | Vite production build served via Nginx/Caddy     |
| Backend API | Docker       | Node.js Express server with env vars             |
| SSL/HTTPS   | Auto         | Coolify handles Let's Encrypt certificates       |
| Networking  | Internal     | Frontend/Backend communicate via Coolify network |

### Deployment Requirements

1. **Coolify Instance**: Self-hosted or managed Coolify installation
2. **Docker Support**: Coolify uses Docker for container orchestration
3. **Environment Variables**: Configure via Coolify UI (secrets managed securely)
4. **Domain**: Custom domain with DNS pointed to Coolify server
5. **SSL**: Automatic via Coolify (HTTPS required for microphone access)

### NOT Recommended Platforms (without modification)

- **Vercel**: Frontend-only focus, requires separate backend hosting
- **Netlify**: Same issues as Vercel for full-stack apps
- **AWS Lambda/Serverless**: WebSocket connections need persistent servers

## When In Doubt

- Ask
- Leave it better than you found it
- Ship, learn, iterate
