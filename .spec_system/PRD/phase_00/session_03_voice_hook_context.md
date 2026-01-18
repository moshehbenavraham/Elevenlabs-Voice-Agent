# Session 03: Voice Hook & Context

**Session ID**: `phase00-session03-voice-hook-context`
**Status**: Not Started
**Estimated Tasks**: ~16
**Estimated Duration**: 2-4 hours

---

## Objective

Create the useGeminiVoice hook and GeminiVoiceContext for React state management, including connection lifecycle, transcript accumulation, and session timer.

---

## Scope

### In Scope (MVP)

- Create GeminiVoiceContext with provider state management
- Implement useGeminiVoice hook with connect/disconnect/toggleMute/sendText
- Define status states: idle, connecting, connected, listening, thinking, speaking, error
- Implement transcript accumulation (partials in refs, finals in state)
- Handle partial/final transcript deduplication
- Implement activeTranscript for typing indicator
- Add session timer tracking (sessionStartTime)
- Display warning at 12+ minutes, urgent at 14 minutes
- Graceful disconnect at 15 minutes
- Handle session resumption on WebSocket timeout (~10 min)
- Store resumption handles from SessionResumptionUpdate messages
- Implement thinking state detection (300ms after VAD end, no audio)
- Handle barge-in (interrupted) with audio queue clearing
- Error handling with user-friendly messages
- Unit tests for useGeminiVoice hook

### Out of Scope

- Provider component UI (Session 04)
- E2E tests (Session 05)

---

## Prerequisites

- [ ] Session 02 completed (GenAILiveClient, token endpoint)
- [ ] Audio infrastructure available (audio-recorder, audio-streamer)

---

## Deliverables

1. `src/contexts/GeminiVoiceContext.tsx` - Context provider with state management
2. `src/hooks/useGeminiVoice.ts` - Core voice hook
3. Unit tests for useGeminiVoice hook

---

## Success Criteria

- [ ] useGeminiVoice hook provides connect/disconnect/toggleMute/sendText
- [ ] Status transitions correctly through lifecycle states
- [ ] Thinking state activates 300ms after user speech ends (no audio response)
- [ ] Transcripts accumulate without duplication
- [ ] Partial transcripts available for typing indicator
- [ ] Session timer tracks duration and shows warnings
- [ ] Session resumption reconnects transparently on WebSocket timeout
- [ ] Barge-in clears audio queue immediately
- [ ] Error states display user-friendly messages
- [ ] Context provides state to child components
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] Unit tests pass for useGeminiVoice
