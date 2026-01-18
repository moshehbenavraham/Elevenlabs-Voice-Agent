# CONVENTIONS.md

## Guiding Principles

- Optimize for readability over cleverness
- Code is written once, read many times
- Consistency beats personal preference
- If it can be automated, automate it
- When writing code: Make NO assumptions. Do not be lazy. Pattern match precisely. Do not skim when you need detailed info from documents. Validate systematically.

## Naming

- Be descriptive over concise: `getUserById` > `getUser` > `fetch`
- Booleans read as questions: `isActive`, `hasPermission`, `shouldRetry`
- Functions describe actions: `calculateTotal`, `validateInput`, `sendNotification`
- Avoid abbreviations unless universally understood (`id`, `url`, `config` are fine)
- Match domain language--use the same terms as product/design/stakeholders

### Project-Specific Naming

- Provider hooks: `use{Provider}Voice.ts` (e.g., `useVapiVoice.ts`, `useRetellVoice.ts`)
- Provider contexts: `{Provider}VoiceContext.tsx` (e.g., `XAIVoiceContext.tsx`)
- Provider components: `{Provider}Provider.tsx` (e.g., `VapiProvider.tsx`)
- Voice components: `{Provider}Button`, `{Provider}VoiceStatus`, `{Provider}EmptyState`

## Files & Structure

- One concept per file where practical
- File names reflect their primary export or purpose
- Group by feature/domain, not by type (prefer `/orders/api.ts` over `/api/orders.ts`)
- Keep nesting shallow--if you're 4+ levels deep, reconsider

### Project Structure

```
src/
  components/
    voice/          # Shared voice components
    providers/      # Provider-specific UI components
    tabs/           # Tab navigation
    ui/             # shadcn/ui components
  hooks/            # Custom React hooks
  contexts/         # React contexts for state
  lib/              # Utilities and helpers
  pages/            # Route components
  test/             # Test files and setup
```

## Functions & Modules

- Functions do one thing
- If a function needs a comment explaining what it does, consider renaming it
- Keep functions short enough to read without scrolling
- Avoid side effects where possible; be explicit when they exist

## React Hooks

- Custom hooks start with `use` and return object with named properties
- Use refs for values that change frequently but don't need re-renders (turn tracking, audio buffers)
- Memoize callbacks with useCallback when passed to child components or event emitters
- Cleanup subscriptions and listeners in useEffect return function
- Batch state updates to minimize re-renders during voice conversations

## Audio & WebSocket

- AudioWorklet for capture (never ScriptProcessorNode - deprecated and blocks main thread)
- Separate AudioContext instances for capture (16kHz) and playback (24kHz)
- Fire-and-forget for non-critical operations (analytics, logging) - never block audio pipeline
- Clear audio queues immediately on interruption (barge-in)
- EventEmitter pattern for WebSocket clients - loose coupling with React components

## Comments

- Explain _why_, not _what_
- Delete commented-out code--that's what git is for
- TODOs include context: `// TODO(name): reason, ticket if applicable`
- Update or remove comments when code changes

## Error Handling

- Fail fast and loud in development
- Fail gracefully in production
- Errors should be actionable--include context for debugging
- Don't swallow errors silently
- Voice providers should show connection errors via VoiceStatus components

## Testing

- Test behavior, not implementation
- A test's name should describe the scenario and expectation
- If it's hard to test, the design might need rethinking
- Flaky tests get fixed or deleted--never ignored
- Mock Web Audio API and WebSocket connections in voice tests

## Git & Version Control

- Commit messages: imperative mood, concise (`Add user validation` not `Added some validation stuff`)
- One logical change per commit
- Branch names: `type/short-description` (e.g., `feat/user-auth`, `fix/cart-total`)
- Keep commits atomic enough to revert safely

## Pull Requests

- Small PRs get better reviews
- Description explains the _what_ and _why_--reviewers can see the _how_
- Link relevant tickets/context
- Review your own PR before requesting others

## Code Review

- Critique code, not people
- Ask questions rather than make demands
- Approve when it's good enough, not perfect
- Nitpicks are labeled as such

## Dependencies

- Fewer dependencies = less risk
- Justify additions; prefer well-maintained, focused libraries
- Pin versions; update intentionally

## Local Dev Tools

| Category    | Tool                      | Config                                     |
| ----------- | ------------------------- | ------------------------------------------ |
| Formatter   | Prettier                  | `.prettierrc`                              |
| Linter      | ESLint                    | `eslint.config.js`                         |
| Type Safety | TypeScript                | `tsconfig.json`                            |
| Testing     | Vitest + RTL + Playwright | `vitest.config.ts`, `playwright.config.ts` |
| Build       | Vite + SWC                | `vite.config.ts`                           |
| Git Hooks   | not configured            | -                                          |

## When In Doubt

- Ask
- Leave it better than you found it
- Ship, learn, iterate
