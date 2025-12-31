# Session 02: Vapi Voice Hook & SDK Singleton

**Session ID**: `phase05-session02-voice-hook`
**Status**: Not Started
**Estimated Tasks**: ~20
**Estimated Duration**: 3-4 hours

---

## Objective

Create SDK singleton for Vapi instance management and implement `useVapiVoice` hook with full event handling, including partial transcript support for typing indicators.

---

## Scope

### In Scope (MVP)

- Create `src/lib/vapi.ts` SDK singleton
- Create `src/hooks/useVapiVoice.ts` with state management
- Create `src/types/vapi.ts` with type definitions
- Handle all Vapi events: `call-start`, `call-end`, `speech-start`, `speech-end`, `volume-level`, `message`, `error`
- Implement `activeTranscript` state for partial transcripts (typing indicator)
- Map Vapi call status to unified state: `idle`, `connecting`, `connected`, `error`
- Implement cleanup on unmount (remove event listeners)

### Out of Scope

- Provider component and tab integration
- Function calling implementation
- Comprehensive testing

---

## Prerequisites

- [ ] Session 01 completed (dependencies installed)
- [ ] Vapi SDK importable

---

## Deliverables

1. `src/lib/vapi.ts` - SDK singleton instance
2. `src/hooks/useVapiVoice.ts` - Main hook with:
   - `callStatus` state (INACTIVE, LOADING, ACTIVE)
   - `isSpeechActive` state
   - `messages` array (final transcripts)
   - `activeTranscript` (partial transcript in progress)
   - `audioLevel` state
   - `error` state
   - `start(config?)`, `stop()`, `toggleCall(config?)` functions
3. `src/types/vapi.ts` - Type definitions:
   - `VapiCallStatus` enum
   - `VapiMessageType` enum
   - `VapiMessageRole` enum
   - `VapiTranscriptType` enum
   - `VapiTranscriptMessage`, `VapiFunctionCallMessage`, `VapiFunctionCallResultMessage` interfaces
   - `VapiMessage` union type
   - `VapiVoiceState` interface

---

## Success Criteria

- [ ] SDK singleton exports `vapi` instance
- [ ] Hook provides `start`/`stop`/`toggleCall` functions
- [ ] All Vapi events are handled with proper cleanup
- [ ] Partial transcripts stored in `activeTranscript`
- [ ] Final transcripts appended to `messages` array
- [ ] Error states are properly handled and exposed
- [ ] `CreateAssistantDTO` type used for inline config
- [ ] Hook works with both `assistantId` string and inline config
