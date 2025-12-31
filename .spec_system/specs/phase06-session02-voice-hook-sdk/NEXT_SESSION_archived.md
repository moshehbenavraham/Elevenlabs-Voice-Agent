# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-31
**Project State**: Phase 06 - Retell Voice Agent
**Completed Sessions**: 27

---

## Recommended Next Session

**Session ID**: `phase06-session02-voice-hook-sdk`
**Session Name**: Voice Hook & SDK Integration
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: 15-20

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 completed (backend endpoint working)
- [x] `retell-client-js-sdk` package installed (via phase06-session01)
- [x] Backend `/api/retell/create-web-call` returning tokens

### Dependencies

- **Builds on**: phase06-session01-dependencies-backend-setup (completed)
- **Enables**: phase06-session03-provider-tab (UI integration)

### Project Progression

Session 02 is the natural next step in the Retell integration sequence. The backend infrastructure is complete, providing the `/api/retell/create-web-call` endpoint for token generation. This session creates the core `useRetellVoice` hook that encapsulates all SDK interactions, event handling, and state management. This hook is required before building the UI components in Session 03.

---

## Session Overview

### Objective

Create `useRetellVoice` hook with comprehensive event handling and SDK instance management, implementing local transcript history since SDK only provides last 5 sentences.

### Key Deliverables

1. `src/types/retell.ts` - Type definitions (RetellCallStatus, RetellTranscript, etc.)
2. `src/hooks/useRetellVoice.ts` - Main voice hook with SDK integration
3. Local transcript history implementation (SDK limitation workaround)

### Scope Summary

- **In Scope (MVP)**: Type definitions, hook with state management, event handling (call_started, call_ended, agent_start_talking, agent_stop_talking, update, error), local transcript history, unified state mapping, startCall/stopCall/toggleCall functions, proper cleanup on unmount
- **Out of Scope**: Provider component UI (Session 03), tab integration (Session 03), metadata event handling (Session 04), audio event visualization (Session 04)

---

## Technical Considerations

### Technologies/Patterns

- `retell-client-js-sdk` for WebSocket connection and audio handling
- React hooks pattern (useState, useEffect, useRef, useCallback)
- useRef pattern for WebSocket handlers (avoid stale closures)
- Backend API communication for token generation

### Potential Challenges

- **Stale closure prevention**: Must use useRef pattern for values accessed in WebSocket event handlers
- **Transcript history**: SDK only provides last 5 sentences; need local accumulation
- **State mapping**: Map Retell call status to unified state (idle, connecting, connected, error)

### Relevant Considerations

- [P02] **useRef for values in WebSocket handlers**: Avoids stale closures in callbacks. Critical for event handlers.
- [P02] **Fresh token on each reconnect**: Ephemeral tokens may expire during backoff; fetch fresh token each attempt.
- [P00] **Single Connection at a Time**: Ensure proper disconnect before any new connection.

---

## Alternative Sessions

If this session is blocked:

1. **None available** - Session 03 requires the hook from Session 02
2. **Phase 07 planning** - If Phase 06 is blocked, could begin research for next provider

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
