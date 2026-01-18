# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 00 - Gemini Live Integration
**Completed Sessions**: 2

---

## Recommended Next Session

**Session ID**: `phase00-session03-voice-hook-context`
**Session Name**: Voice Hook & Context
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: ~16

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 completed (Dependencies & Audio Infrastructure)
- [x] Session 02 completed (GenAI Client & Backend)

### Dependencies

- **Builds on**: Session 02's GenAILiveClient, audio-recorder, and audio-streamer
- **Enables**: Session 04's GeminiProvider component and full UI integration

### Project Progression

Session 03 is the logical next step because it bridges the low-level infrastructure (WebSocket client, audio pipeline) with the high-level UI components. The hook and context layer provides the React-friendly interface that Session 04's GeminiProvider component will consume. This follows the established provider pattern used by all existing voice providers (OpenAI, xAI, Ultravox, Vapi, Retell).

---

## Session Overview

### Objective

Create the useGeminiVoice hook and GeminiVoiceContext for React state management, including connection lifecycle, transcript accumulation, and session timer.

### Key Deliverables

1. `src/contexts/GeminiVoiceContext.tsx` - Context provider with state management
2. `src/hooks/useGeminiVoice.ts` - Core voice hook with connect/disconnect/toggleMute/sendText
3. Unit tests for useGeminiVoice hook

### Scope Summary

- **In Scope (MVP)**: Status states (idle, connecting, connected, listening, thinking, speaking, error), transcript accumulation with partial/final handling, session timer with warnings, session resumption on WebSocket timeout, barge-in handling, thinking state detection
- **Out of Scope**: Provider component UI (Session 04), E2E tests (Session 05)

---

## Technical Considerations

### Technologies/Patterns

- React Context API for state management (matches existing provider patterns)
- Custom hook pattern following useVapiVoice/useRetellVoice conventions
- EventEmitter subscriptions for GenAILiveClient events
- Refs for partial transcripts (no re-renders), state for finals
- Session resumption handles stored for auto-reconnect

### Potential Challenges

- **Thinking state timing**: 300ms delay detection requires careful coordination with VAD events
- **Session resumption**: Must store and use resumption handles from SessionResumptionUpdate messages
- **Transcript deduplication**: Partials must be accumulated correctly and committed only on `finished: true`
- **Session timer coordination**: Multiple timers (12min warning, 14min urgent, 15min disconnect) need proper cleanup

### Relevant Considerations

- [P00] **Provider Pattern**: Follow Context + Hook + Provider component architecture
- [P00] **Ephemeral token pattern**: Use backend-generated tokens (already implemented in Session 02)
- [P00] **Provider-specific contexts**: Maintain isolated state management

---

## Alternative Sessions

If this session is blocked:

1. **None applicable** - Sessions 04 and 05 both depend on Session 03 being completed first
2. **If blocked on Session 02 artifacts** - Verify GenAILiveClient and audio utilities exist before proceeding

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
