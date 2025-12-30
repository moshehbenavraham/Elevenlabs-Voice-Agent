# Known Issues

This file documents intentional patterns that trigger warnings but are acceptable.

## ESLint Warnings

### E2E Test Stubs (tests/e2e/\*\*)

Pattern: `@typescript-eslint/no-unused-vars`

Many E2E tests contain placeholder/stub code with unused variables. These are intentional as the tests are scaffolded for future implementation.

Affected paths:

- `tests/e2e/error-handling/*.spec.ts`
- `tests/e2e/providers/*.spec.ts`
- `tests/e2e/smoke/*.spec.ts`
- `tests/e2e/voice-ui/*.spec.ts`

**Status**: Acceptable - stub tests for future implementation

### React Refresh Warnings (src/components/**, src/contexts/**)

Pattern: `react-refresh/only-export-components`

Provider components export both the component and helper functions (e.g., mock data, constants). This is an intentional pattern for co-locating related exports.

Affected files:

- `src/components/providers/ElevenLabsProvider.tsx`
- `src/components/providers/OpenAIProvider.tsx`
- `src/components/providers/XAIProvider.tsx`
- `src/components/tabs/ProviderTab.tsx`
- `src/components/tabs/ProviderTabs.tsx`
- `src/contexts/VoiceContext.tsx`
- `src/contexts/OpenAIVoiceContext.tsx`
- `src/contexts/XAIVoiceContext.tsx`

**Status**: Acceptable - HMR limitation, not a bug

---

Last updated: 2025-12-30
