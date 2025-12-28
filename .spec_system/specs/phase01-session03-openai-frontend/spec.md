# Session Specification

**Session ID**: `phase01-session03-openai-frontend`
**Phase**: 01 - OpenAI Voice Agent
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements the OpenAI voice integration frontend, creating the voice context and provider components that connect to OpenAI's Realtime API. This is the core implementation session that brings OpenAI voice conversations to users, enabling them to speak with GPT-4o-realtime-preview through the existing tabbed interface.

The implementation follows the proven patterns established in phase00-session03-xai-frontend, with approximately 80% code reuse from the xAI implementation. The primary differences are the WebSocket URL, authentication header format, voice options, and minor message type variations. All audio processing utilities (PCM encoding, base64 conversion, AudioWorklet) are fully reusable since OpenAI and xAI share identical audio specifications (24kHz, PCM16, mono).

This session transforms the backend infrastructure from phase01-session02-openai-backend into a complete, user-facing voice experience, completing the OpenAI integration MVP.

---

## 2. Objectives

1. Create `OpenAIVoiceContext.tsx` with WebSocket connection management, audio capture, and playback for OpenAI Realtime API
2. Create `OpenAIProvider.tsx` with voice button, status display, visualizer, and empty state components matching xAI provider pattern
3. Register OpenAI as a selectable tab in the provider system with proper feature flag support
4. Achieve full voice conversation functionality with audio visualization

---

## 3. Prerequisites

### Required Sessions
- [x] `phase01-session02-openai-backend` - Provides `/api/openai/session` endpoint for ephemeral tokens
- [x] `phase01-session01-openai-research` - Provides API documentation and audio format requirements
- [x] `phase00-session03-xai-frontend` - Provides template code for ~80% reuse

### Required Tools/Knowledge
- OpenAI Realtime API WebSocket protocol (documented in research session)
- Web Audio API (AudioContext, AudioWorklet, AnalyserNode)
- React Context pattern for state management
- Framer Motion for animations

### Environment Requirements
- Node.js 18+ with npm
- `OPENAI_API_KEY` configured on server (for backend token generation)
- `VITE_OPENAI_ENABLED=true` in frontend `.env` (optional, auto-detects from backend)
- Modern browser with Web Audio API and WebSocket support
- HTTPS for production (microphone access)

---

## 4. Scope

### In Scope (MVP)
- `OpenAIVoiceContext.tsx` with full WebSocket lifecycle management
- `OpenAIProvider.tsx` with voice button, status, visualizer, and empty state
- `useOpenAIVoice.ts` hook for consuming the context
- Health check endpoint integration (`/api/openai/health`)
- OpenAI tab registration in provider tabs system
- Audio encoding/decoding using existing utilities
- Volume control and audio visualization
- Graceful disconnect on tab switch
- Error state handling with user-friendly messages

### Out of Scope (Deferred)
- Advanced voice customization UI - *Reason: MVP uses environment variable for voice selection*
- Conversation history/transcript - *Reason: Phase 2 feature*
- Function calling / tool use - *Reason: Phase 2 feature*
- Voice activity detection mode selection UI - *Reason: MVP uses server_vad default*

---

## 5. Technical Approach

### Architecture
The OpenAI integration follows the established provider-per-context architecture:

```
OpenAIProvider (wrapper)
    |
    +-- OpenAIVoiceContext (state + WebSocket)
    |       |
    |       +-- AudioWorklet (PCM encoding)
    |       +-- AudioContext (playback + visualization)
    |       +-- WebSocket (wss://api.openai.com/v1/realtime)
    |
    +-- OpenAIVoiceButton (UI control)
    +-- OpenAIVoiceStatus (connection status)
    +-- OpenAIVoiceVisualizer (audio visualization)
    +-- OpenAIEmptyState (unconfigured state)
```

### Design Patterns
- **Provider Pattern**: OpenAIVoiceContext isolates OpenAI state from other providers
- **Reducer Pattern**: useReducer for predictable state transitions (idle -> connecting -> connected -> disconnecting)
- **Ref Pattern**: Audio queue and playback state use refs to avoid stale closures in callbacks
- **Compound Components**: Provider exports multiple related components (Button, Status, Visualizer)

### Technology Stack
- React 18.3.1 with TypeScript
- Web Audio API (AudioContext, AudioWorklet, AnalyserNode, GainNode)
- WebSocket API for OpenAI Realtime connection
- Framer Motion for animations
- Existing audio utilities from `src/lib/audio/audioUtils.ts`

---

## 6. Deliverables

### Files to Create
| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/contexts/OpenAIVoiceContext.tsx` | WebSocket connection, state management, audio handling | ~550 |
| `src/components/providers/OpenAIProvider.tsx` | Voice button, status, visualizer, empty state | ~770 |
| `src/hooks/useOpenAIVoice.ts` | Hook to consume OpenAIVoiceContext | ~20 |

### Files to Modify
| File | Changes | Est. Lines |
|------|---------|------------|
| `src/pages/Index.tsx` | Import OpenAI provider, add to tabs array, render OpenAI tab content | ~40 |
| `server/index.js` | Add `/api/openai/health` endpoint for configuration check | ~15 |

---

## 7. Success Criteria

### Functional Requirements
- [ ] OpenAI tab visible when backend reports `configured: true`
- [ ] Can start voice conversation with click on voice button
- [ ] User's microphone audio sent to OpenAI correctly (PCM16, 24kHz, base64)
- [ ] OpenAI audio responses play back correctly
- [ ] Audio visualization animates during playback
- [ ] Can stop/disconnect conversation with button click
- [ ] Switching tabs disconnects OpenAI cleanly
- [ ] "Not configured" empty state when API key missing
- [ ] Error states display with actionable messages

### Testing Requirements
- [ ] Manual testing: Full conversation flow works
- [ ] Manual testing: Tab switching disconnects properly
- [ ] Manual testing: Error states display correctly
- [ ] Manual testing: Works in Chrome, Firefox, Safari

### Quality Gates
- [ ] All files ASCII-encoded (0-127)
- [ ] Unix LF line endings
- [ ] TypeScript strict mode passes
- [ ] ESLint passes (warnings acceptable per MVP config)
- [ ] No API keys exposed in frontend code

---

## 8. Implementation Notes

### Key Considerations
- OpenAI WebSocket URL: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`
- Authentication: Header format `Authorization: Bearer {ephemeral_token}` (differs from xAI subprotocol pattern)
- Voice options: alloy, ash, ballad, coral, echo, sage, shimmer, verse (use env var or default to "alloy")
- VAD: Use `server_vad` by default (same as xAI)

### Potential Challenges
- **WebSocket Auth Header**: OpenAI uses standard Authorization header vs xAI's subprotocol approach. WebSocket API doesn't support custom headers, so we'll pass token via query parameter or use the client_secret approach.
- **Safari AudioContext**: Must resume on user gesture. Already handled in xAI pattern - reuse.
- **Event Name Differences**: Verify exact OpenAI event names (session.created, response.audio.delta, etc.) match research findings.

### Relevant Considerations
- [P00] **Inline Blob URL for Worklets**: Reusing existing worklet pattern - no external file needed
- [P00] **Provider-Specific Contexts**: OpenAIVoiceContext isolated from XAIVoiceContext and VoiceContext
- [P00] **Switch statement for WebSocket messages**: Clean routing for OpenAI message types
- [P01] **Audio Format Compatibility**: Same specs as xAI (24kHz, PCM16, mono) - all utilities reusable
- [P01] **~80% Code Reuse**: XAIVoiceContext/XAIProvider provide template for OpenAI implementation

### ASCII Reminder
All output files must use ASCII-only characters (0-127). No smart quotes, em dashes, or non-ASCII symbols.

---

## 9. Testing Strategy

### Unit Tests
- Not required for MVP (manual testing sufficient)
- Future: Mock WebSocket and AudioContext for context tests

### Integration Tests
- Not required for MVP
- Future: E2E with Playwright for full conversation flow

### Manual Testing
- [ ] Start conversation, speak, verify response plays
- [ ] Check audio visualization animates during response
- [ ] Disconnect via button, verify clean cleanup
- [ ] Switch to different tab, verify auto-disconnect
- [ ] Test without API key configured, verify empty state
- [ ] Test network error, verify error message displays
- [ ] Test in Chrome, Firefox, Safari (desktop)

### Edge Cases
- Rapid connect/disconnect cycles
- Tab switch during active conversation
- Network disconnection mid-conversation
- AudioContext suspended state on Safari
- Missing microphone permission

---

## 10. Dependencies

### External Libraries
- `framer-motion`: ^11.x (already installed)
- `lucide-react`: ^0.x (already installed)
- No new dependencies required

### Other Sessions
- **Depends on**: phase01-session02-openai-backend (ephemeral token endpoint)
- **Depended by**: phase01-session04-validation (final testing and polish)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
