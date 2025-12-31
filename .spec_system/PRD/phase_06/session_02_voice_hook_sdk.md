# Session 02: Voice Hook & SDK Integration

**Session ID**: `phase06-session02-voice-hook-sdk`
**Status**: Not Started
**Estimated Tasks**: ~15-20
**Estimated Duration**: 3-4 hours

---

## Objective

Create `useRetellVoice` hook with comprehensive event handling and SDK instance management, implementing local transcript history since SDK only provides last 5 sentences.

---

## Scope

### In Scope (MVP)

- Create `src/types/retell.ts` with type definitions
- Create `src/hooks/useRetellVoice.ts` with state management
- Handle events: `call_started`, `call_ended`, `agent_start_talking`, `agent_stop_talking`, `update`, `error`
- Implement local transcript history management
- Map Retell call status to unified state: `idle`, `connecting`, `connected`, `error`
- Implement `startCall`, `stopCall`, `toggleCall` functions
- Implement cleanup on unmount (event listener removal)
- Handle backend API communication for token generation

### Out of Scope

- Provider component UI (Session 03)
- Tab integration (Session 03)
- `metadata` event handling (Session 04 enhancement)
- `audio` event handling for visualization (Session 04 enhancement)

---

## Prerequisites

- [ ] Session 01 completed (backend endpoint working)
- [ ] `retell-client-js-sdk` package installed
- [ ] Backend `/api/retell/create-web-call` returning tokens

---

## Deliverables

1. `src/types/retell.ts` - Type definitions (RetellCallStatus, RetellTranscript, etc.)
2. `src/hooks/useRetellVoice.ts` - Main voice hook with SDK integration
3. Local transcript history implementation

---

## Success Criteria

- [ ] SDK instance created and managed properly
- [ ] Hook provides `startCall`/`stopCall`/`toggleCall` functions
- [ ] All Retell events handled with proper cleanup
- [ ] `isAgentTalking` reflects agent speaking state accurately
- [ ] `latestTranscript` updated on `update` events
- [ ] Error states properly handled and exposed
- [ ] Local transcript history maintained (since SDK only provides last 5)
- [ ] useRef pattern used for WebSocket handlers (avoid stale closures)
