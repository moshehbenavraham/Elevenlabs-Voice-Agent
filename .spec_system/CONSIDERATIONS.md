# Considerations

> Institutional memory for AI assistants. Updated between phases via /carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 02 Complete (2025-12-28)

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

<!-- Max 5 items -->

- [P00] **react-refresh/only-export-components warnings**: 14 occurrences across provider/tab/context components. Intentional pattern for co-located components - suppress if needed or restructure exports.
- [P02] **act() warnings in keyboard tests**: ProviderTabs keyboard navigation tests have React state timing warnings. Would require waitFor wrappers but non-blocking.
- [P02] **ElevenLabs function calling**: Different architecture than OpenAI/xAI - requires separate research and implementation.

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
- [P02] **WebSocket close code handling**: Check 1000 (intentional) vs 1006 (abnormal) to determine reconnection behavior.
- [P02] **ScrollArea for cross-browser scrolling**: Radix UI ScrollArea provides better experience than native overflow styling.
- [P02] **Function timeout protection**: 5-second timeout on function execution prevents hanging requests.

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

- [P00] **Radix UI primitives**: Tabs, Select, ScrollArea provide excellent accessibility out of the box.
- [P00] **xAI/OpenAI Realtime API**: Requires base64 audio, 24kHz, 16-bit PCM, mono. Voice via session.update.
- [P02] **useReconnection hook**: Exponential backoff with jitter, close code detection, network status monitoring. Max 10 retries, 30s max delay.
- [P02] **OpenAI function_call events**: Use `response.function_call_arguments.done` event for complete function arguments.
- [P02] **Provider transcript events**: ElevenLabs SDK callbacks, xAI response.text.delta, OpenAI conversation.item.created.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item                         | Resolution                                                                       |
| ----- | ---------------------------- | -------------------------------------------------------------------------------- |
| P02   | Phase 02 Complete            | All 5 sessions delivered: voice selection, transcript, reconnection, functions   |
| P02   | Voice Selection UI           | VoiceSelector component with 8 OpenAI + 5 xAI voices, localStorage persistence   |
| P02   | Conversation Transcript      | MessageBubble + ConversationPanel with streaming, auto-scroll, copy-to-clipboard |
| P02   | Reconnection with Backoff    | useReconnection hook with exponential backoff, jitter, UI status indicators      |
| P02   | Function Calling             | Tool definitions, server execution endpoint, FunctionCallIndicator UI            |
| P01   | OpenAI Realtime API Research | Audio format matches xAI, ephemeral tokens work, ~80% code reuse confirmed       |
| P01   | OpenAI Backend Integration   | Ephemeral token endpoint at /api/openai/session implemented                      |
| P01   | OpenAI Frontend Integration  | OpenAIVoiceContext, OpenAIProvider components fully working                      |
| P01   | Three-Provider Architecture  | ElevenLabs, xAI, and OpenAI tabs all functional with clean switching             |

---

## Deployment Strategy

### Target Platform: Coolify (Self-Hosted)

This project is designed for local development and self-hosted deployment via Coolify. The full-stack architecture (React + Express) requires persistent server connections for WebSocket-based voice APIs.

### Key Decisions

- [P03] **Coolify over Vercel/Netlify**: Full-stack app with WebSocket needs; serverless doesn't fit
- [P03] **Docker-based deployment**: Coolify uses Docker; creates consistent dev/prod parity
- [P03] **Single repo, dual services**: Frontend (static) and Backend (Node) deployed together
- [P03] **Internal networking**: Frontend/Backend communicate via Coolify's internal network

### Deployment Artifacts Required

| Artifact       | Status  | Location                              |
| -------------- | ------- | ------------------------------------- |
| Dockerfile     | pending | `/Dockerfile` (multi-stage build)     |
| docker-compose | pending | `/docker-compose.yml` (local testing) |
| Coolify config | pending | Coolify UI configuration              |
| Nginx config   | pending | Frontend static file serving          |

---

## Phase 04 Roadmap

Consolidated items for next phase planning:

### High Priority

1. **Coolify Deployment Bundle** - Dockerfile, docker-compose, and deployment documentation
2. **Ultravox Voice Agent Integration** - Fourth voice provider (Ultravox.ai realtime API)
   - **API key already configured** in project `.env` file - ready for immediate development

### Medium Priority

3. **Google Gemini Integration** - Fifth voice provider (when Realtime API available)
4. **ElevenLabs Function Calling** - Research architecture, implement tool integration
5. **Token Caching with TTL** - Reduce ephemeral token fetches for better performance

### Lower Priority (Stretch Goals)

6. **Swipe Gestures for Mobile Tabs** - Enhanced touch interactions for mobile users
7. **Session State Restoration** - Preserve conversation context across reconnections
8. **Voice Activity Visualization** - Show when user vs AI is speaking

---

_Auto-generated by /carryforward. Manual edits allowed but may be overwritten._
