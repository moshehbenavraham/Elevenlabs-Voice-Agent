# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-31
**Project State**: Phase 05 - Vapi Voice Agent
**Completed Sessions**: 23 (including phase05-session01-dependencies-csp)

---

## Recommended Next Session

**Session ID**: `phase05-session02-voice-hook`
**Session Name**: Vapi Voice Hook & SDK Singleton
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: ~20

---

## Why This Session Next?

### Prerequisites Met

- [x] Phase 04 completed (Ultravox integration provides pattern reference)
- [x] Session 01 completed (dependencies installed, CSP configured)
- [x] Vapi SDK `@vapi-ai/web@1.0.255` installed and importable
- [x] CSP updated for Vapi/Daily.co domains
- [x] Environment variables documented in `.env.example`

### Dependencies

- **Builds on**: phase05-session01-dependencies-csp (SDK installation, CSP setup)
- **Enables**: phase05-session03-provider-component (provider UI integration)

### Project Progression

This session creates the core voice hook infrastructure for Vapi. Following the established pattern from OpenAI/xAI/Ultravox integrations (research/hook -> component -> polish), the voice hook must be implemented before the provider component can be created. The hook encapsulates all Vapi SDK interactions, event handling, and state management.

---

## Session Overview

### Objective

Create SDK singleton for Vapi instance management and implement `useVapiVoice` hook with full event handling, including partial transcript support for typing indicators.

### Key Deliverables

1. `src/lib/vapi.ts` - SDK singleton instance for Vapi
2. `src/hooks/useVapiVoice.ts` - Main voice hook with state management and event handling
3. `src/types/vapi.ts` - Type definitions (enums, interfaces, union types)

### Scope Summary

- **In Scope (MVP)**: SDK singleton, voice hook, type definitions, event handling, partial transcript support, cleanup on unmount
- **Out of Scope**: Provider component, tab integration, function calling, comprehensive testing

---

## Technical Considerations

### Technologies/Patterns

- `@vapi-ai/web` SDK v1.0.255 (already installed)
- React hooks pattern (following existing `useReconnection.ts` structure)
- Singleton pattern for SDK instance management
- TypeScript enums and interfaces for type safety

### Key Implementation Details

- **No backend required**: Vapi uses web token (public API key) safe for frontend
- **SDK singleton**: Single `Vapi` instance manages all calls
- **Partial transcripts**: Unique `activeTranscript` state for typing indicators (differs from other providers)
- **Dual config mode**: Support both `assistantId` (string) and inline `CreateAssistantDTO` configuration

### Potential Challenges

- **Event listener cleanup**: Must properly remove all event listeners on unmount to prevent memory leaks
- **Partial transcript handling**: Different from other providers - requires separate `activeTranscript` state vs `messages` array
- **Type imports**: `CreateAssistantDTO` imports from `@vapi-ai/web/dist/api` (verify path)

### Relevant Considerations

- [P00] **Radix UI Tabs for accessibility**: Will use existing tab infrastructure (Session 03)
- [P01] **~80% Code Reuse**: Follow established provider patterns from Ultravox/OpenAI
- [P02] **Fresh token on each reconnect**: Not needed for Vapi (web token doesn't expire)
- [P02] **Streaming transcript with placeholder**: Use `activeTranscript` pattern for typing indicators

---

## Alternative Sessions

If this session is blocked:

1. **phase05-session03-provider-component** - Only if hook already exists elsewhere
2. **Phase 06 planning** - If Vapi integration needs to be deferred

---

## Reference Implementation

The `VAPI_EXAMPLE/` directory contains a working React + Vapi integration that should be used as reference for:

- SDK initialization pattern
- Event listener setup
- Hook state management
- Partial transcript handling

---

## Next Steps

Run `/sessionspec` to generate the formal specification with task checklist.
