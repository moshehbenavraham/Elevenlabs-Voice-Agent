# Considerations

> Institutional memory for AI assistants. Updated between phases via /carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 01 (2025-12-28)

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

<!-- Max 5 items -->

- [P00] **react-refresh/only-export-components warnings**: 7 occurrences across provider/tab components. Intentional pattern for co-located components - suppress if needed or restructure exports.

### External Dependencies

<!-- Max 5 items -->

- [P00] **xAI Realtime API**: No official React SDK; using native WebSocket with ephemeral tokens. Works well but monitor for SDK release.
- [P00] **ElevenLabs SDK**: Currently v0.12.1; monitor for breaking changes.
- [P01] **OpenAI Realtime API**: GA version. Uses ephemeral tokens via POST /v1/realtime/sessions. Fully integrated with same patterns as xAI.

### Performance / Security

<!-- Max 5 items -->

- [P00] **API Keys**: Must use backend proxy for xAI (ephemeral token pattern); never expose in browser.
- [P00] **HTTPS Required**: Microphone access requires HTTPS in production.
- [P00] **Base64 Audio Overhead**: xAI API requires base64 encoding, adding ~33% data overhead. Acceptable for real-time voice but monitor bandwidth.

### Architecture

<!-- Max 5 items -->

- [P00] **Single Connection at a Time**: Disconnect active provider before switching tabs to prevent resource conflicts.
- [P00] **AudioWorklet Thread Model**: Audio processing runs in separate thread via AudioWorklet; main thread stays responsive.
- [P00] **Provider-Specific Contexts**: Each provider has dedicated context (VoiceContext, XAIVoiceContext, OpenAIVoiceContext) for isolation.
- [P01] **OpenAI WebSocket Auth**: Uses protocol array for auth (`['realtime', 'openai-insecure-api-key.{token}']`) since WebSocket doesn't support headers.

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

<!-- Max 15 items -->

- [P00] **Radix UI Tabs for accessibility**: Provides robust keyboard navigation (Tab, Arrow keys, Enter/Space) out of the box. No need to reimplement.
- [P00] **AudioWorklet for audio processing**: Runs in separate thread, non-blocking. Essential for real-time PCM encoding.
- [P00] **Inline Blob URL for Worklets**: Avoids Vite bundling complexity and CORS issues. Inline worklet code as Blob URL.
- [P00] **Compound component pattern**: ProviderTabs/ProviderTab separation allows clean styling separation and flexible composition.
- [P00] **Interface segregation (State vs Actions)**: VoiceProviderState vs VoiceProviderActions provides flexibility for different SDK patterns.
- [P00] **Framer Motion variants with reduced motion**: Create animation variants with prefers-reduced-motion alternatives for clean accessibility.
- [P00] **Environment-based feature flags**: VITE_XAI_ENABLED pattern cleanly toggles provider availability based on API key presence.
- [P00] **Existing server patterns**: Express + CORS + dotenv already set up in server/index.js - extend rather than rewrite.
- [P00] **Glassmorphism design system**: backdrop-blur + semi-transparent backgrounds (bg-white/10) create consistent premium UI.
- [P00] **localStorage for persistence**: Provider selection persists across refreshes with simple localStorage pattern.
- [P00] **Playback queue with ref pattern**: Queue audio chunks with useRef for playNextInQueue to handle async WebSocket arrival.
- [P00] **Switch statement for WebSocket messages**: Cleaner than nested if-else for routing xAI realtime message types.
- [P01] **~80% Code Reuse for New Providers**: OpenAI integration reused vast majority of xAI patterns (audio utils, WebSocket handling, playback queue).
- [P01] **Empty state component for unconfigured providers**: OpenAIEmptyState shows clear setup instructions when API key missing.
- [P01] **Health endpoint for config validation**: /api/openai/health checks if OPENAI_API_KEY is configured before showing provider.

### What to Avoid

<!-- Max 10 items -->

- [P00] **External AudioWorklet files with Vite**: Don't use separate .worklet.ts files - causes bundling and CORS issues. Use inline Blob URLs.
- [P00] **Safari audio without user gesture**: AudioContext must be resumed on user click, not on component mount. Safari enforces this strictly.
- [P00] **Exposing API keys to browser**: Always use backend proxy for sensitive credentials. Never import API keys in frontend code.
- [P00] **Simultaneous voice connections**: Resource management is cleaner with single active provider. Auto-disconnect on tab switch.
- [P00] **Nested if-else for message types**: Use switch statements for WebSocket message routing - more readable and maintainable.
- [P00] **ScriptProcessorNode for audio**: Deprecated. Use AudioWorklet instead for real-time audio processing.

### Tool/Library Notes

<!-- Max 5 items -->

- [P00] **@radix-ui/react-tabs**: Excellent accessibility out of the box. Use Radix Tabs primitive for keyboard navigation.
- [P00] **@elevenlabs/react**: Uses signed URL pattern for secure connections. Currently v0.12.1.
- [P00] **xAI Realtime API**: Requires base64 audio, 24kHz sample rate, 16-bit PCM, mono. Voice/instructions configured via session.update WebSocket message.
- [P00] **Framer Motion**: AnimatePresence with variants for smooth transitions. Combine with useReducedMotion hook.
- [P01] **OpenAI Realtime API**: Same audio specs as xAI (24kHz, PCM16, base64). Voice options: alloy, ash, ballad, coral, echo, sage, shimmer, verse. WebSocket URL: wss://api.openai.com/v1/realtime?model={MODEL}.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item                           | Resolution                                                                 |
| ----- | ------------------------------ | -------------------------------------------------------------------------- |
| P00   | Separate Contexts per Provider | Implemented XAIVoiceContext in session03, isolated from VoiceContext       |
| P00   | xAI Backend Integration        | Ephemeral token endpoint at /api/xai/session working                       |
| P00   | Tab System with Keyboard A11y  | Radix UI Tabs provides full accessibility                                  |
| P00   | Audio Visualization for xAI    | XAIVoiceVisualizer with AnalyserNode frequency data                        |
| P01   | OpenAI Realtime API Research   | Audio format matches xAI, ephemeral tokens work, ~80% code reuse confirmed |
| P01   | OpenAI Backend Integration     | Ephemeral token endpoint at /api/openai/session implemented                |
| P01   | OpenAI Frontend Integration    | OpenAIVoiceContext, OpenAIProvider components fully working                |
| P01   | Three-Provider Architecture    | ElevenLabs, xAI, and OpenAI tabs all functional with clean switching       |

---

## Future Considerations (Deferred from P00)

Items explicitly deferred for future phases:

1. **Provider-specific configuration modals** - API key management UI
2. **Reconnection with exponential backoff** - Current implementation shows error on disconnect
3. **Conversation history/transcript UI** - Text alongside audio for accessibility
4. **Swipe gestures for mobile tabs** - Touch-friendly tab navigation
5. **E2E test automation** - Playwright integration
6. **Token caching with TTL** - Reduce xAI API calls

## Phase 02 Considerations

Items to address in upcoming phases:

1. **Voice Selection UI** - Allow users to choose voice (alloy, ash, ballad, etc.) from frontend
2. **Conversation History/Transcript** - Display text alongside audio for accessibility
3. **Function Calling Integration** - Connect OpenAI function calling to backend actions
4. **Reconnection with Exponential Backoff** - Handle network flakiness gracefully
5. **E2E Test Automation** - Playwright tests for voice flows (deferred from P00)

---

_Auto-generated by /carryforward. Manual edits allowed but may be overwritten._
