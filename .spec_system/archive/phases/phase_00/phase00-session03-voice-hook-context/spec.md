# Session Specification

**Session ID**: `phase00-session03-voice-hook-context`
**Phase**: 00 - Gemini Live Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session creates the React state management layer for Gemini Live voice conversations. The `useGeminiVoice` hook and `GeminiVoiceContext` will bridge the low-level `GenAILiveClient` WebSocket infrastructure (Session 02) with the UI components that Session 04 will implement. This layer handles connection lifecycle, transcript accumulation, session timing, and all voice state management.

The hook follows the established provider pattern used by all existing voice providers in the codebase (OpenAI, xAI, Ultravox, Vapi, Retell). It subscribes to EventEmitter events from `GenAILiveClient`, manages React state transitions, and exposes a clean API for UI components. Key differentiators for Gemini include thinking state detection (300ms delay after VAD ends), session timer warnings (Gemini has a 15-minute session limit), and barge-in handling with immediate audio queue clearing.

This session is critical infrastructure that enables Session 04's GeminiProvider component to simply consume the hook and render UI without managing complex WebSocket and audio state.

---

## 2. Objectives

1. Create `GeminiVoiceContext` with typed state management following the reducer pattern used by `XAIVoiceContext`
2. Implement `useGeminiVoice` hook with connect/disconnect/toggleMute/sendText API matching existing provider hooks
3. Implement transcript accumulation with partial/final handling and deduplication (partials in refs, finals in state)
4. Add session timer tracking with 12min warning, 14min urgent, and 15min graceful disconnect

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-dependencies-audio-infra` - AudioRecorder, AudioStreamer, PCM encoder worklet
- [x] `phase00-session02-genai-client-backend` - GenAILiveClient, ephemeral token endpoint

### Required Tools/Knowledge

- React Context API and useReducer pattern
- EventEmitter3 subscription management in useEffect
- Web Audio API basics (AudioContext, MediaStream)
- TypeScript generics for typed events

### Environment Requirements

- Node.js 18+ with npm/bun
- Backend server running for token endpoint (`npm run dev` on backend)
- Microphone access for manual testing

---

## 4. Scope

### In Scope (MVP)

- GeminiVoiceContext with provider state management
- useGeminiVoice hook with connect/disconnect/toggleMute/sendText
- Status states: idle, connecting, connected, listening, thinking, speaking, error
- Transcript accumulation (partials in refs, finals in state)
- Partial transcript handling for typing indicator (`activeTranscript`)
- Session timer tracking with warnings (12min, 14min, 15min)
- Thinking state detection (300ms after VAD end, no audio)
- Barge-in handling (interrupted) with audio queue clearing
- Error handling with user-friendly messages
- Unit tests for useGeminiVoice hook

### Out of Scope (Deferred)

- Provider component UI (GeminiButton, GeminiVoiceStatus, etc.) - _Reason: Session 04 scope_
- Tab integration with ProviderTabs - _Reason: Session 04 scope_
- E2E tests - _Reason: Session 05 scope_
- Session resumption with stored handles - _Reason: Advanced feature, revisit if time permits_
- Voice selection UI - _Reason: Session 04 scope_

---

## 5. Technical Approach

### Architecture

```
GeminiVoiceProvider (Context Provider)
  |
  +-- useReducer (state management)
  |     - status: idle | connecting | connected | listening | thinking | speaking | error
  |     - isConnected, isMuted, isSpeaking, isListening
  |     - messages: VoiceMessage[]
  |     - error: string | null
  |     - sessionDuration: number
  |
  +-- GenAILiveClient (WebSocket)
  |     - EventEmitter subscriptions in useEffect
  |     - Cleanup on unmount
  |
  +-- AudioRecorder (capture)
  |     - 16kHz PCM input to client
  |
  +-- AudioStreamer (playback)
  |     - 24kHz PCM output from client
  |
  +-- Session Timer
        - useRef for interval ID
        - 12min warning, 14min urgent, 15min disconnect
```

### Design Patterns

- **Context + Hook + Provider**: Follows established provider pattern for loose coupling
- **Reducer for State**: Centralized state transitions matching XAIVoiceContext pattern
- **Refs for High-Frequency Data**: Partial transcripts, audio buffers, timers (no re-renders)
- **EventEmitter Subscriptions**: Clean subscribe/unsubscribe in useEffect
- **Memoized Callbacks**: useCallback for functions passed to children

### Technology Stack

- React 18.3.1 with TypeScript
- EventEmitter3 (from GenAILiveClient)
- Vitest + React Testing Library for unit tests

---

## 6. Deliverables

### Files to Create

| File                                  | Purpose                                     | Est. Lines |
| ------------------------------------- | ------------------------------------------- | ---------- |
| `src/contexts/GeminiVoiceContext.tsx` | Context provider with reducer state         | ~350       |
| `src/hooks/useGeminiVoice.ts`         | Thin wrapper hook (for pattern consistency) | ~30        |
| `src/test/useGeminiVoice.test.ts`     | Unit tests for hook behavior                | ~200       |
| `src/types/gemini.ts`                 | TypeScript types for context/hook           | ~60        |

### Files to Modify

| File                 | Changes             | Est. Lines |
| -------------------- | ------------------- | ---------- |
| `src/types/index.ts` | Export gemini types | ~5         |

---

## 7. Success Criteria

### Functional Requirements

- [ ] useGeminiVoice hook provides connect/disconnect/toggleMute/sendText
- [ ] Status transitions correctly: idle -> connecting -> connected -> listening/thinking/speaking -> idle
- [ ] Thinking state activates 300ms after user speech ends (no audio response yet)
- [ ] Speaking state activates when audio events arrive from GenAILiveClient
- [ ] Transcripts accumulate without duplication (partials merged correctly)
- [ ] Partial transcripts available via `activeTranscript` for typing indicators
- [ ] Session timer displays warning toast at 12 minutes
- [ ] Session timer displays urgent warning at 14 minutes
- [ ] Session auto-disconnects gracefully at 15 minutes
- [ ] Barge-in (interrupted event) clears audio queue immediately
- [ ] Error states display user-friendly messages
- [ ] Context provides all state to child components via useGeminiVoice

### Testing Requirements

- [ ] Unit tests for all status transitions
- [ ] Unit tests for transcript accumulation
- [ ] Unit tests for session timer warnings
- [ ] Unit tests for error handling
- [ ] All tests pass with `npm run test:run`

### Quality Gates

- [ ] All files ASCII-encoded (0-127 characters only)
- [ ] Unix LF line endings
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] Code follows CONVENTIONS.md naming patterns

---

## 8. Implementation Notes

### Key Considerations

- **Refs vs State**: Use refs for partial transcripts and audio buffers to avoid re-renders during conversation
- **Timer Cleanup**: Session timer interval must be cleared on unmount and disconnect
- **Thinking Detection**: 300ms setTimeout after VAD end; clear if audio arrives before timeout
- **Muted State**: toggleMute should pause AudioRecorder, not disconnect

### Potential Challenges

- **Thinking vs Speaking Race**: Audio event might arrive exactly at 300ms boundary
  - _Mitigation_: Check if already speaking before setting thinking state
- **Transcript Deduplication**: Partials can overlap with finals
  - _Mitigation_: Track last committed text, only append new content
- **AudioContext Resume**: Safari requires user gesture before AudioContext.resume()
  - _Mitigation_: Connect function is triggered by button click (user gesture)

### Relevant Considerations

- [P00] **Provider Pattern**: Following Context + Hook + Provider architecture exactly as documented
- [P00] **Ephemeral token pattern**: Using backend-generated tokens from Session 02's `/api/gemini/session` endpoint
- [P00] **Provider-specific contexts**: GeminiVoiceContext is isolated, no shared state with other providers
- [P00] **API Key Security**: Keys stay server-side; only ephemeral tokens used in frontend

### ASCII Reminder

All output files must use ASCII-only characters (0-127). No curly quotes, em-dashes, or non-ASCII characters.

---

## 9. Testing Strategy

### Unit Tests

- Connection lifecycle: idle -> connecting -> connected -> idle
- Status transitions: listening, thinking, speaking states
- Transcript accumulation with mock events
- Session timer warnings at 12min, 14min, 15min thresholds
- Error handling for connection failures
- Mute toggle behavior
- Barge-in handling (interrupted event)

### Integration Tests

- Context provides state to multiple child components (via test wrapper)
- Hook returns consistent state across re-renders

### Manual Testing

- Connect to live Gemini API and verify audio flows
- Speak and verify transcripts appear correctly
- Wait for 12-minute warning (can mock timer for faster test)
- Interrupt AI mid-speech and verify barge-in clears audio

### Edge Cases

- Connect called while already connecting
- Disconnect called while not connected
- Multiple rapid connect/disconnect cycles
- Empty audio buffer handling
- Network disconnection mid-conversation

---

## 10. Dependencies

### External Libraries

- `eventemitter3`: ^5.0.1 (used by GenAILiveClient)
- `@testing-library/react`: ^16.3.0 (testing)
- `vitest`: ^3.2.4 (testing)

### Other Sessions

- **Depends on**: `phase00-session01-dependencies-audio-infra`, `phase00-session02-genai-client-backend`
- **Depended by**: `phase00-session04-gemini-provider-ui`, `phase00-session05-e2e-tests`

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
