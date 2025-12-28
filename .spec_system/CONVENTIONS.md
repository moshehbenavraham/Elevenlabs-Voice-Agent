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
- Provider-specific state: Separate contexts (e.g., `VoiceContext`, `XAIVoiceContext`)

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

- Explain *why*, not *what*
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

## When In Doubt

- Ask
- Leave it better than you found it
- Ship, learn, iterate
