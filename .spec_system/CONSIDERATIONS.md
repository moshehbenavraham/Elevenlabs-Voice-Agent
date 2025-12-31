# Considerations

> Institutional memory for AI assistants. Updated between phases via /carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 06 Complete (2025-12-31)

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

<!-- Max 5 items -->

- [P00] **react-refresh/only-export-components warnings**: 14 occurrences across provider/tab/context components. Intentional pattern for co-located components - suppress if needed or restructure exports.
- [P04] **Docker image size 249MB**: Slightly over 200MB target. Could reduce by moving React deps from dependencies to devDependencies since they're bundled at build time.
- [P04] **Ultravox lacks reconnection**: No automatic reconnection with exponential backoff due to call-based model. Would require call recreation if SDK supports it in future versions.

### External Dependencies

<!-- Max 5 items -->

- [P00] **xAI Realtime API**: No official React SDK; using native WebSocket with ephemeral tokens. Works well but monitor for SDK release.
- [P00] **ElevenLabs SDK v0.12.1**: Monitor for breaking changes. SDK does not auto-reconnect; manual reconnection implemented.
- [P05] **Vapi SDK v1.0.255**: Pinned version to prevent breaking changes from active SDK development. Update cautiously.
- [P06] **Retell SDK v2.0.7**: Compatible with Vite bundler and ES modules. Only provides last 5 transcripts per update event.

### Performance / Security

<!-- Max 5 items -->

- [P00] **API Keys**: Must use backend proxy for xAI/OpenAI/Ultravox/Retell (ephemeral token pattern); never expose in browser.
- [P00] **HTTPS Required**: Microphone access requires HTTPS in production.
- [P02] **Function Allowlist**: Server-side allowlist validation for function calling security. Prevent arbitrary code execution.
- [P04] **Rate Limiting**: Token endpoints rate-limited to 10 requests/minute per IP. Prevents abuse.

### Architecture

<!-- Max 5 items -->

- [P00] **Single Connection at a Time**: Disconnect active provider before switching tabs to prevent resource conflicts.
- [P00] **Provider-Specific Contexts**: Each provider has dedicated context for isolation (VoiceContext, UltravoxVoiceContext, etc.).
- [P02] **Reconnection Split Responsibility**: useReconnection hook handles orchestration (timing, backoff); provider context handles actual connection.
- [P04] **Three Auth Models**: (1) Ephemeral tokens (xAI/OpenAI), (2) Call-based joinUrl (Ultravox/Retell), (3) Public web token (Vapi).
- [P05] **SDK Singleton vs Instance**: Vapi uses singleton (created once), Retell uses class instance (new per component).

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

<!-- Max 15 items -->

- [P00] **Radix UI primitives for accessibility**: Tabs, Dialog, Select, ScrollArea provide robust keyboard navigation and ARIA out of the box.
- [P00] **AudioWorklet for audio processing**: Runs in separate thread, non-blocking. Essential for real-time PCM encoding.
- [P00] **Inline Blob URL for Worklets**: Avoids Vite bundling complexity and CORS issues.
- [P00] **Environment-based feature flags**: VITE\_\*\_ENABLED pattern cleanly toggles provider availability.
- [P01] **Research-first 4-session structure**: For new provider integration, use research -> backend -> frontend -> polish progression.
- [P01] **~80% Code Reuse for New Providers**: OpenAI, Ultravox, Vapi, Retell integrations all reused vast majority of patterns.
- [P02] **useRef for values in SDK/WebSocket handlers**: Avoids stale closures in callbacks without recreating them. Critical for transcripts.
- [P02] **Fresh token on each reconnect**: Ephemeral tokens and signed URLs may expire during backoff; fetch fresh each attempt.
- [P03] **Page Object Model for E2E tests**: VoicePage abstraction made writing tests faster and easier to maintain.
- [P03] **Data-testid attributes first**: More stable than CSS classes or text content for element selection in tests.
- [P03] **page.addInitScript() for audio mocking**: Audio APIs accessed during React init; mocks must be present before page load.
- [P04] **SDK-based architecture simplifies audio**: ultravox-client handles audio internally - no AudioContext/AudioWorklet needed.
- [P05] **Partial vs final transcripts**: Vapi sends transcriptType 'partial' (typing indicator) and 'final' (append to messages).
- [P05] **SDK singleton pattern**: Single Vapi instance created once with web token, reused across all hook calls.
- [P06] **Local transcript accumulation**: When SDK limits transcript history (Retell: 5 sentences), track complete history locally.

### What to Avoid

<!-- Max 10 items -->

- [P00] **External AudioWorklet files with Vite**: Don't use separate .worklet.ts files - causes bundling and CORS issues. Use inline Blob URLs.
- [P00] **Safari audio without user gesture**: AudioContext must be resumed on user click, not on component mount.
- [P00] **Exposing API keys to browser**: Always use backend proxy for sensitive credentials.
- [P02] **Date.now() in render or useRef init**: React 19 flags as impure. Use constants or index-based values.
- [P02] **Self-referencing functions in useCallback**: Causes "accessed before declaration" error. Use ref pattern: `funcRef.current = func`.
- [P03] **Missing ARIA on custom modals**: Custom modal implementations often lack focus trap, aria-modal, aria-labelledby. Audit or use Radix.
- [P04] **Express 4 wildcard syntax in Express 5**: The `*` wildcard changed to require named wildcards like `{*path}`. Common gotcha.
- [P04] **npm prepare scripts in Docker**: The prepare script runs during npm ci, failing if devDeps missing. Use --ignore-scripts in production.
- [P04] **Docker non-root user without --chown**: All COPY commands need --chown to ensure the user can read the files.
- [P06] **Assuming consistent SDK event naming**: Event names differ across SDKs (Retell: `call_started`, Vapi: `call-start`). Check docs.

### Tool/Library Notes

<!-- Max 5 items -->

- [P00] **xAI/OpenAI Realtime API**: Requires base64 audio, 24kHz, 16-bit PCM, mono. Voice via session.update.
- [P02] **useReconnection hook**: Exponential backoff with jitter, close code detection, network status monitoring. Max 10 retries, 30s max delay.
- [P03] **Playwright E2E**: Multi-browser support. WebKit doesn't support mouse.wheel() - use mouse.click() for scroll.
- [P04] **ultravox-client SDK**: Handles audio internally, provides granular states (listening/thinking/speaking).
- [P06] **RetellWebClient**: Class-based SDK, can be reused across calls. Uses LiveKit WebRTC under the hood.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item                             | Resolution                                                                 |
| ----- | -------------------------------- | -------------------------------------------------------------------------- |
| P06   | Retell Voice Agent Integration   | 4 sessions: SDK, hook, provider UI, testing. 7th provider complete.        |
| P06   | Retell transcript limitation     | Local accumulation with index tracking works around 5-sentence SDK limit   |
| P05   | Vapi Voice Agent Integration     | 4 sessions complete with frontend-only auth (no backend required)          |
| P05   | Typing indicator support         | activeTranscript prop for partial transcripts works across providers       |
| P04   | Docker deployment infrastructure | Multi-stage Dockerfile, docker-compose, Express static serving             |
| P04   | Ultravox Voice Agent Integration | 4th provider with call-based model and ultravox-client SDK                 |
| P03   | E2E test infrastructure          | Playwright with 184 tests across 12 spec files, 5 browser targets          |
| P03   | ElevenLabs reconnection          | Manual reconnection with useReconnection hook (SDK doesn't auto-reconnect) |
| P03   | Configuration Modal              | Radix Dialog with settings, diagnostics, schema-versioned localStorage     |
| P03   | Accessibility audit              | ARIA attributes added to modals, alerts, loading states                    |

---

## Provider Architecture Summary

Quick reference for the 7 voice providers implemented.

| Provider          | Auth Model       | SDK                  | Audio Handling | Reconnection    |
| ----------------- | ---------------- | -------------------- | -------------- | --------------- |
| ElevenLabs Widget | Agent ID         | CDN Widget           | Built-in       | Built-in        |
| ElevenLabs SDK    | Signed URL       | @elevenlabs/react    | SDK manages    | Manual via hook |
| OpenAI            | Ephemeral token  | Native WebSocket     | AudioWorklet   | Manual via hook |
| xAI               | Ephemeral token  | Native WebSocket     | AudioWorklet   | Manual via hook |
| Ultravox          | Call joinUrl     | ultravox-client      | SDK manages    | Not implemented |
| Vapi              | Public web token | @vapi-ai/web         | SDK manages    | SDK manages     |
| Retell            | Access token     | retell-client-js-sdk | SDK manages    | SDK manages     |

---

## Future Roadmap

Consolidated items for future phase planning:

### High Priority

1. **E2E tests for Vapi/Retell** - Playwright tests for newer providers
2. **Docker image optimization** - Move frontend deps to devDependencies (~100MB reduction)

### Medium Priority

3. **Ultravox reconnection** - Add if SDK supports call recreation
4. **Voice selection for all providers** - Currently only OpenAI/xAI have selection UI
5. **Function calling expansion** - Vapi/Retell/Ultravox function calling support
6. **Token caching with TTL** - Reduce ephemeral token fetches

### Lower Priority (Stretch Goals)

7. **Google Gemini Integration** - When Realtime API available
8. **Session state restoration** - Preserve conversation context across reconnections
9. **Settings export/import** - Backup and sharing configurations
10. **Visual regression testing** - Playwright screenshot comparisons

---

_Auto-generated by /carryforward. Manual edits allowed but may be overwritten._
