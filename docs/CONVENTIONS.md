# CONVENTIONS.md

## Guiding Principles

- Optimize for readability over cleverness
- Code is written once, read many times
- Consistency beats personal preference
- If it can be automated, automate it
- When writing code: Make NO assumptions. Do not be lazy. Pattern match precisely. Do not skim when you need detailed info from documents. Validate systematically.

## TypeScript

- Prefer `interface` for object shapes, `type` for unions/intersections
- Explicit return types on exported functions
- Use `unknown` over `any`; narrow types explicitly
- Readonly by default: `readonly` arrays, `as const` assertions
- No non-null assertions (`!`) without comment explaining why it's safe

## Naming

- **Files**: kebab-case for files (`voice-button.tsx`), PascalCase for components
- **Components**: PascalCase (`VoiceButton`, `ProviderTab`)
- **Hooks**: camelCase with `use` prefix (`useVoiceState`, `useReconnection`)
- **Contexts**: PascalCase with `Context` suffix (`VoiceContext`, `ThemeContext`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants, camelCase for config objects
- **Booleans**: `is`, `has`, `should`, `can` prefixes (`isConnected`, `hasError`)

## React Components

- One component per file; co-locate styles and tests
- Props interface named `ComponentNameProps`
- Destructure props in function signature
- Default exports for page components, named exports for reusable components
- Prefer composition over prop drilling
- Keep components under 150 lines; extract hooks for complex logic

## Hooks

- Custom hooks in `src/hooks/` directory
- Return object for multiple values: `{ state, actions }`
- Handle cleanup in useEffect return
- Memoize expensive computations with useMemo
- Memoize callbacks passed to children with useCallback

## State Management

- Local state for UI-only concerns (useState)
- Context for cross-cutting concerns (theme, voice state, provider selection)
- Tanstack Query for server state
- Avoid prop drilling beyond 2 levels; use context or composition

## Files & Structure

```
src/
  components/       # Reusable UI components
    ui/            # shadcn/ui primitives
    voice/         # Voice-specific components
    providers/     # Provider-specific components
  hooks/           # Custom React hooks
  contexts/        # React contexts
  lib/             # Utilities and helpers
  pages/           # Route components
  test/            # Test utilities and setup
server/
  routes/          # Express route handlers
  utils/           # Server utilities
scripts/           # Shell scripts for dev/build/demo
```

## Error Handling

- Try/catch at component boundaries with error boundaries
- Log errors with context: `console.error('[ComponentName]', error)`
- User-facing errors via toast notifications (sonner)
- API errors return structured JSON: `{ error: string, message: string }`

## Async/Await

- Always use async/await over raw promises
- Handle errors with try/catch, not .catch()
- Cleanup WebSocket connections in useEffect return

## Testing

- Test files co-located: `Component.tsx` / `Component.test.tsx`
- Describe blocks mirror component/function structure
- Test user behavior, not implementation details
- Mock external APIs and SDKs; never call real voice providers in tests
- Use React Testing Library queries: `getByRole` > `getByTestId`

## Styling (Tailwind CSS)

- Utility classes in JSX; avoid @apply except for complex animations
- Use CSS variables for theme colors (defined in Tailwind config)
- Glassmorphism: `backdrop-blur-md bg-white/10 border border-white/20`
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Motion: respect `prefers-reduced-motion` via Tailwind `motion-safe:`

## Comments

- Explain _why_, not _what_
- Delete commented-out code
- TODOs: `// TODO(name): reason`
- Document non-obvious WebSocket/audio behavior

## Git & Version Control

- Commit messages: imperative mood (`Add ngrok support` not `Added ngrok`)
- Branch names: `type/short-description` (e.g., `feat/ngrok-demo`)
- One logical change per commit
- Co-author AI commits: `Co-Authored-By: Claude <noreply@anthropic.com>`

## Dependencies

- Fewer dependencies = less risk
- Justify new packages in PR description
- Pin exact versions in package.json
- Optional deps for dev tooling (concurrently, etc.)

## Environment Variables

- Client-side: `VITE_` prefix required for Vite exposure
- Server-side: no prefix, loaded via dotenv
- Never commit `.env`; keep `.env.example` updated
- Document all variables in `.env.example` with comments

## Local Dev Tools

| Category      | Tool                | Config                    |
| ------------- | ------------------- | ------------------------- |
| Formatter     | Prettier            | `.prettierrc`             |
| Linter        | ESLint 9            | `eslint.config.js`        |
| Type Safety   | TypeScript 5        | `tsconfig.json`           |
| Testing       | Vitest + RTL        | `vitest.config.ts`        |
| E2E Testing   | Playwright          | `playwright.config.ts`    |
| Observability | pino + pino-pretty  | `src/lib/logger.ts`       |
| Git Hooks     | Husky + lint-staged | `.husky/`, `package.json` |

## CI/CD

| Bundle       | Status     | Workflow                                                                                |
| ------------ | ---------- | --------------------------------------------------------------------------------------- |
| Code Quality | configured | `.github/workflows/quality.yml` (Lint, Format, Type Check)                              |
| Build & Test | configured | `.github/workflows/test.yml` (Build, Unit Tests)                                        |
| Security     | configured | `.github/workflows/security.yml` (Gitleaks, CodeQL, Dependency Review, NPM Audit)       |
| Integration  | configured | `.github/workflows/e2e.yml` (E2E Tests)                                                 |
| Operations   | configured | `.github/workflows/release.yml`, `.github/dependabot.yml` (Release tagging, Dependabot) |

## Infrastructure

| Component     | Provider                  | Details                                                         |
| ------------- | ------------------------- | --------------------------------------------------------------- |
| Container     | Docker                    | Multi-stage build, non-root user                                |
| Registry      | GitHub Container Registry | ghcr.io, auto-push on main                                      |
| Health        | Express endpoint          | `/api/health` with service status, memory, uptime               |
| Health Probe  | Docker HEALTHCHECK        | 30s interval, 10s timeout, 3 retries                            |
| WAF           | Hosting platform          | Edge WAF or managed ruleset; not provisioned in repo            |
| Rate Limiting | express-rate-limit        | API: 100/15min, Tokens: 10/min, Static: 500/15min               |
| CORS          | Express middleware        | Exact origins via CORS_ORIGIN; local Docker smoke override only |
| Deploy        | GitHub Actions            | Webhook or SSH, on push to main                                 |
| Backup        | N/A                       | Stateless application, no persistent data                       |
| Local Dev     | Docker Compose            | `npm run docker:prod` builds, starts, and probes `/api/health`  |

## When In Doubt

- Ask
- Leave it better than you found it
- Ship, learn, iterate
