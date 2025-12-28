# Considerations

> Institutional memory for AI assistants. Updated between phases via /carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 02 (2025-12-28)

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

<!-- Max 5 items -->

- [P00] **react-refresh/only-export-components warnings**: 18 occurrences across provider/tab/context components. Intentional pattern for co-located components - suppress if needed or restructure exports.
- [P02] **act() warnings in keyboard tests**: ProviderTabs keyboard navigation tests have React state timing warnings. Would require waitFor wrappers but non-blocking.

### External Dependencies

<!-- Max 5 items -->

- [P00] **xAI Realtime API**: No official React SDK; using native WebSocket with ephemeral tokens. Works well but monitor for SDK release.
- [P00] **ElevenLabs SDK**: Currently v0.12.1; monitor for breaking changes.
- [P01] **OpenAI Realtime API**: GA version. Uses ephemeral tokens via POST /v1/realtime/sessions. Fully integrated with same patterns as xAI.

### Performance / Security

<!-- Max 5 items -->

- [P00] **API Keys**: Must use backend proxy for xAI/OpenAI (ephemeral token pattern); never expose in browser.
- [P00] **HTTPS Required**: Microphone access requires HTTPS in production.
- [P02] **Function Allowlist**: Server-side allowlist validation for function calling security. Prevent arbitrary code execution.

### Architecture

<!-- Max 5 items -->

- [P00] **Single Connection at a Time**: Disconnect active provider before switching tabs to prevent resource conflicts.
- [P00] **Provider-Specific Contexts**: Each provider has dedicated context (VoiceContext, XAIVoiceContext, OpenAIVoiceContext) for isolation.
- [P01] **OpenAI WebSocket Auth**: Uses protocol array for auth (`['realtime', 'openai-insecure-api-key.{token}']`) since WebSocket doesn't support headers.
- [P02] **Reconnection Split Responsibility**: useReconnection hook handles orchestration (timing, backoff); provider context handles actual connection (token fetch, WebSocket).

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

<!-- Max 15 items -->

- [P00] **Radix UI Tabs for accessibility**: Provides robust keyboard navigation (Tab, Arrow keys, Enter/Space) out of the box.
- [P00] **AudioWorklet for audio processing**: Runs in separate thread, non-blocking. Essential for real-time PCM encoding.
- [P00] **Inline Blob URL for Worklets**: Avoids Vite bundling complexity and CORS issues.
- [P00] **Compound component pattern**: ProviderTabs/ProviderTab separation allows clean styling and flexible composition.
- [P00] **Interface segregation (State vs Actions)**: VoiceProviderState vs VoiceProviderActions provides flexibility for different SDK patterns.
- [P00] **Environment-based feature flags**: VITE_XAI_ENABLED pattern cleanly toggles provider availability.
- [P01] **Research-first 4-session structure**: For new provider integration, use research -> backend -> frontend -> polish progression.
- [P01] **~80% Code Reuse for New Providers**: OpenAI integration reused vast majority of xAI patterns.
- [P01] **Empty state component for unconfigured providers**: Clear setup instructions when API key missing.
- [P02] **useRef for values in WebSocket handlers**: Avoids stale closures in callbacks without recreating them. Used for selectedVoice, handleWSMessage, intentionalDisconnect.
- [P02] **Provider-specific wrapper components**: XAIVoiceSelector, OpenAIConversationPanel pattern - each accesses its own context automatically.
- [P02] **Fresh token on each reconnect**: Ephemeral tokens may expire during backoff; fetch fresh token each attempt.
- [P02] **Shared tool definitions with transformers**: Single source of truth for functions, getOpenAITools/getXAITools for provider-specific format.
- [P02] **Index-based timestamps for VoiceMessage**: Avoids React purity issues with Date.now() in render.
- [P02] **Streaming transcript with placeholder**: Create message on response.created, update with deltas for real-time display.

### What to Avoid

<!-- Max 10 items -->

- [P00] **External AudioWorklet files with Vite**: Don't use separate .worklet.ts files - causes bundling and CORS issues. Use inline Blob URLs.
- [P00] **Safari audio without user gesture**: AudioContext must be resumed on user click, not on component mount.
- [P00] **Exposing API keys to browser**: Always use backend proxy for sensitive credentials.
- [P00] **Simultaneous voice connections**: Resource management is cleaner with single active provider.
- [P00] **ScriptProcessorNode for audio**: Deprecated. Use AudioWorklet instead.
- [P02] **Date.now() in render or useRef init**: React 19 flags as impure. Use constants or index-based values.
- [P02] **Self-referencing functions in useCallback**: Causes "accessed before declaration" error. Use ref pattern: `funcRef.current = func`.
- [P02] **Checking for UI components**: Verify shadcn/ui components exist before using them (scroll-area, etc.).

### Tool/Library Notes

<!-- Max 5 items -->

- [P00] **@radix-ui/react-tabs**: Excellent accessibility out of the box. Use for keyboard navigation.
- [P00] **@radix-ui/react-select**: Used for VoiceSelector dropdown. Accessible, customizable.
- [P00] **xAI Realtime API**: Requires base64 audio, 24kHz, 16-bit PCM, mono. Voice via session.update.
- [P01] **OpenAI Realtime API**: Same audio specs as xAI. 8 voices available. WebSocket URL: wss://api.openai.com/v1/realtime?model={MODEL}.
- [P02] **useReconnection hook**: Exponential backoff with jitter, close code detection, network status monitoring. Max 10 retries, 30s max delay.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item                          | Resolution                                                                       |
| ----- | ----------------------------- | -------------------------------------------------------------------------------- |
| P02   | Voice Selection UI            | VoiceSelector component with 8 OpenAI + 5 xAI voices, localStorage persistence   |
| P02   | Conversation Transcript       | MessageBubble + ConversationPanel with streaming, auto-scroll, copy-to-clipboard |
| P02   | Reconnection with Backoff     | useReconnection hook with exponential backoff, jitter, UI status indicators      |
| P02   | Function Calling              | Tool definitions, server execution endpoint, FunctionCallIndicator UI            |
| P01   | OpenAI Realtime API Research  | Audio format matches xAI, ephemeral tokens work, ~80% code reuse confirmed       |
| P01   | OpenAI Backend Integration    | Ephemeral token endpoint at /api/openai/session implemented                      |
| P01   | OpenAI Frontend Integration   | OpenAIVoiceContext, OpenAIProvider components fully working                      |
| P01   | Three-Provider Architecture   | ElevenLabs, xAI, and OpenAI tabs all functional with clean switching             |
| P00   | xAI Backend Integration       | Ephemeral token endpoint at /api/xai/session working                             |
| P00   | Tab System with Keyboard A11y | Radix UI Tabs provides full accessibility                                        |

---

## Phase 03 Roadmap

Consolidated items for next phase planning:

### High Priority

1. **E2E Test Automation** - Playwright tests for voice flows (stretch goal from P02)
2. **Provider-specific configuration modals** - API key management UI (medium priority from P02)

### Medium Priority

3. **Google Gemini Integration** - Fourth voice provider
4. **Anthropic Claude Integration** - Fifth voice provider

### Lower Priority (Stretch Goals)

5. **Swipe gestures for mobile tabs** - Touch-friendly tab navigation
6. **Token caching with TTL** - Reduce API calls for repeated sessions
7. **Voice activity visualization** - Show when user vs AI is speaking

---

_Auto-generated by /carryforward. Manual edits allowed but may be overwritten._
