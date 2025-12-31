# Session Specification

**Session ID**: `phase05-session02-voice-hook`
**Phase**: 05 - Vapi Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This session implements the core voice hook infrastructure for the Vapi voice provider. Following the established research-first pattern from OpenAI/xAI/Ultravox integrations, the voice hook must be implemented before the provider component can be created in Session 03.

The implementation creates an SDK singleton for Vapi instance management and a `useVapiVoice` hook with full event handling. A key differentiator from other providers is Vapi's unique partial transcript handling, which requires a separate `activeTranscript` state for typing indicators (showing text as the user speaks, before the final transcript is confirmed).

This hook will encapsulate all Vapi SDK interactions, event handling, and state management, providing a clean interface for the provider component to consume. The pattern follows ~80% code reuse from existing providers while adapting to Vapi-specific behaviors like web token authentication (no backend required) and the partial/final transcript distinction.

---

## 2. Objectives

1. Create SDK singleton (`src/lib/vapi.ts`) for Vapi instance management with web token initialization
2. Implement `useVapiVoice` hook with complete state management and event handling for all Vapi events
3. Create comprehensive type definitions (`src/types/vapi.ts`) with enums, interfaces, and union types
4. Support both `assistantId` string and inline `CreateAssistantDTO` configuration modes

---

## 3. Prerequisites

### Required Sessions

- [x] `phase05-session01-dependencies-csp` - Vapi SDK installed, CSP configured

### Required Tools/Knowledge

- TypeScript and React hooks patterns
- Vapi SDK event model (`call-start`, `call-end`, `speech-start`, `speech-end`, `volume-level`, `message`, `error`)
- Existing provider patterns from `UltravoxVoiceContext.tsx`, `XAIVoiceContext.tsx`

### Environment Requirements

- `VITE_VAPI_PUBLIC_KEY` environment variable (documented in `.env.example`)
- Vapi SDK `@vapi-ai/web@1.0.255` (already installed in Session 01)

---

## 4. Scope

### In Scope (MVP)

- SDK singleton with lazy initialization pattern
- Voice hook with `callStatus`, `isSpeechActive`, `messages`, `activeTranscript`, `audioLevel`, `error` states
- `start(config?)`, `stop()`, `toggleCall(config?)` functions
- Event listener setup and cleanup on unmount
- Partial transcript handling (separate from final transcripts)
- Dual config mode support (assistantId string OR CreateAssistantDTO inline)
- Type exports for use in Session 03

### Out of Scope (Deferred)

- Provider component and tab integration - _Reason: Session 03 scope_
- Function calling implementation - _Reason: Session 04 or future phase_
- Comprehensive unit tests - _Reason: Testing phase_
- Reconnection with backoff - _Reason: Vapi SDK handles internally; no ephemeral token expiry_

---

## 5. Technical Approach

### Architecture

```
src/
  lib/
    vapi.ts           # SDK singleton - exports `vapi` instance
  hooks/
    useVapiVoice.ts   # Main hook with state and event handling
  types/
    vapi.ts           # All Vapi-specific type definitions
```

The hook follows the established pattern from VAPI_EXAMPLE reference implementation:

- SDK singleton instantiated once with web token (public key)
- Event listeners attached in `useEffect` with cleanup
- State managed via `useState` for simplicity (no reducer needed)
- `activeTranscript` separates partial from final transcripts

### Design Patterns

- **Singleton**: SDK instance created once, reused across hook calls
- **Event-driven state**: State updates driven by Vapi SDK events
- **Discriminated unions**: TypeScript union types for message types

### Technology Stack

- React 18.3.1 (useState, useEffect, useCallback)
- `@vapi-ai/web` v1.0.255
- TypeScript 5.x with strict mode

---

## 6. Deliverables

### Files to Create

| File                        | Purpose                              | Est. Lines |
| --------------------------- | ------------------------------------ | ---------- |
| `src/lib/vapi.ts`           | SDK singleton with web token init    | ~15        |
| `src/hooks/useVapiVoice.ts` | Main voice hook with events          | ~130       |
| `src/types/vapi.ts`         | Type definitions (enums, interfaces) | ~80        |

### Files to Modify

| File                 | Changes                       | Est. Lines |
| -------------------- | ----------------------------- | ---------- |
| `src/types/index.ts` | Add Vapi type exports         | ~5         |
| `.env.example`       | Document VITE_VAPI_PUBLIC_KEY | ~2         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] SDK singleton exports `vapi` instance initialized with public key
- [ ] Hook provides `start`/`stop`/`toggleCall` functions
- [ ] `start()` works with assistantId string
- [ ] `start()` works with CreateAssistantDTO inline config
- [ ] All 7 Vapi events are handled: `call-start`, `call-end`, `speech-start`, `speech-end`, `volume-level`, `message`, `error`
- [ ] Partial transcripts stored in `activeTranscript` (cleared on final)
- [ ] Final transcripts appended to `messages` array
- [ ] Error states are properly handled and exposed
- [ ] Event listeners removed on hook cleanup (no memory leaks)

### Testing Requirements

- [ ] Manual testing: verify hook compiles without errors
- [ ] Manual testing: import hook in a test component
- [ ] Manual testing: verify type exports work

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No TypeScript errors
- [ ] ESLint passes (warnings acceptable per MVP config)

---

## 8. Implementation Notes

### Key Considerations

- **No backend required**: Vapi uses web token (public API key) safe for frontend exposure - unlike OpenAI/xAI ephemeral tokens
- **SDK singleton pattern**: Single `Vapi` instance manages all calls; do not create new instances per hook call
- **Partial vs Final transcripts**: Vapi sends `transcriptType: 'partial'` during speech, then `transcriptType: 'final'` when complete
- **Event listener cleanup**: Must use `vapi.off()` to remove all listeners on unmount

### Potential Challenges

- **Type imports**: `CreateAssistantDTO` imports from `@vapi-ai/web/dist/api` - verify path exists, may need type assertion
- **Event typing**: Vapi SDK may have loose typings; use type assertions or `any` where needed with comments
- **Public key not set**: Must handle missing `VITE_VAPI_PUBLIC_KEY` gracefully (error state)

### Relevant Considerations

- [P01] **~80% Code Reuse for New Providers**: Follow established provider patterns from Ultravox/OpenAI hooks
- [P02] **Streaming transcript with placeholder**: Use `activeTranscript` pattern for typing indicators (distinct from message array)
- [P00] **Provider-Specific Contexts**: Vapi will have its own context in Session 03, hook provides the foundation
- [P00] **Environment-based feature flags**: VITE_VAPI_ENABLED pattern (to be added in Session 03)

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Deferred to testing session (out of scope for MVP)

### Integration Tests

- Deferred to testing session (out of scope for MVP)

### Manual Testing

- Import `useVapiVoice` hook in a test component
- Verify TypeScript compilation succeeds
- Verify all types export correctly from `src/types/index.ts`
- Test `start()` with assistantId (if test assistant available)

### Edge Cases

- Missing `VITE_VAPI_PUBLIC_KEY` - should error gracefully
- Calling `stop()` when not connected - should be no-op
- Calling `start()` while already connected - should be no-op or warn
- Rapid `toggleCall()` presses - should handle state transitions

---

## 10. Dependencies

### External Libraries

- `@vapi-ai/web`: 1.0.255 (already installed)

### Other Sessions

- **Depends on**: `phase05-session01-dependencies-csp` (SDK, CSP, env vars)
- **Depended by**: `phase05-session03-provider-component` (uses hook for UI)

---

## Reference Implementation

The `VAPI_EXAMPLE/` directory contains a working React + Vapi integration:

- `VAPI_EXAMPLE/src/features/Assistant/vapi.sdk.ts` - SDK singleton pattern
- `VAPI_EXAMPLE/src/features/Assistant/useVapi.ts` - Hook implementation
- `VAPI_EXAMPLE/src/lib/types/conversation.type.ts` - Type definitions

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
