# Considerations

> Institutional memory for AI assistants. Updated between phases via carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 04 (2026-05-12)

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

- [P04] **Chromium-only translation smoke coverage**: Browser smoke tests cover Chromium only. Expand to other engines only if cross-browser validation becomes a release requirement.

### External Dependencies

- [P04] **Docker frontend env propagation**: The translation guide now documents build-time `VITE_OPENAI_TRANSLATION_ENABLED` and `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES`, but Docker and Compose plumbing still must pass them into frontend builds.
- [P02] **OpenAI translation endpoint volatility**: Live translation still depends on `gpt-realtime-translate`, `/v1/realtime/translations/client_secrets`, and `/v1/realtime/translations/calls`. Re-check official docs before any protocol change.

### Performance / Security

- [P01] **Process-local rate limiting**: Production rate limiting is still process-local. Multi-instance deployments need platform-level or shared-store enforcement.
- [P01] **Production CSP compatibility**: Security headers deliberately keep some provider allowances for current SDK behavior. Tightening CSP should be tested provider by provider.

### Architecture

- [P02] **Translation protocol separation**: OpenAI live translation is not a normal OpenAI voice-agent session. Do not reuse prompt, tool, or `response.create` assumptions from the existing OpenAI provider.

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

- [P04] **Dedicated translation runbook**: Centralizing setup, demo, troubleshooting, and verification in one guide kept the operational story consistent across README, demo mode, and environment docs.
- [P04] **Route-safe diagnostics**: Stable category/code metadata is enough for browser-visible errors as long as raw upstream payloads stay out of client state.
- [P03] **Single-stop cleanup path**: Keeping auto-stop, manual stop, source-ended, and provider-switch teardown on one guarded path prevented duplicate cleanup and state races.
- [P03] **Separate source capture from runtime setup**: Treating media acquisition as a distinct hook made the translation runtime easier to compose and test.
- [P03] **Hook-owned resource boundaries**: Owning peer connection, data channel, remote stream, source tracks, abort controller, and timers in one hook kept stop and unmount deterministic.
- [P03] **Tolerant event parsing**: Ignoring unknown `oai-events` messages kept the hook resilient without weakening the test surface.
- [P03] **Normalized transcript rows**: Converting transcript events into one display and export shape kept captions, transcript panels, and Markdown export aligned.
- [P03] **Explicit in-flight guards**: Blocking duplicate start, stop, and clear actions while async work was pending kept the provider state machine stable.
- [P03] **Media listener cleanup before stop**: Removing `ended` listeners before stopping tracks prevented stale teardown events in browser capture tests.
- [P03] **Stable provider-switch stop handler**: Wiring a single stop callback through tab switching kept lifecycle cleanup aligned with the active provider.
- [P02] **Dedicated translation route isolation**: Keeping translation on its own backend route reduced risk to the existing voice-agent contract and made browser-safe response shaping straightforward.
- [P02] **Pure helper module**: Putting translation config and payload builders in a side-effect-free TypeScript module made reuse in hooks and UI code simpler.
- [P02] **Route tests as HTTP behavior**: Mounting the real router and mocking fetch produced durable coverage for validation, sanitization, timeout, and upstream failure paths.
- [P02] **Early response normalization**: Returning only a browser-safe translation client-secret shape avoided provider-specific payload details escaping into the frontend.
- [P01] **Same-origin production default**: Keeping the combined Express container as the production default reduced config drift across Docker, Compose, docs, and runtime behavior.
- [P01] **Route-specific bounded validation**: Validating provider and function inputs at the route boundary prevented unsafe upstream calls and easier-to-debug failures.
- [P01] **Deploy verifier as a contract**: `deploy:verify` plus compose validation caught health, header, and interpolation drift before it reached operators.

### What to Avoid

- [P04] **Leaving build-time env wiring implicit**: Documentation now calls out the translation build-time flags, but Docker and Compose should not assume those variables are present unless the build path proves it.
- [P03] **Parallel stop paths**: Duplicate cleanup entry points make auto-stop, manual stop, and unmount race each other.
- [P00] **Implicit localhost fallback in production CORS**: Production should never inherit demo-only permissiveness or localhost defaults.
- [P01] **Raw provider bodies in logs or responses**: Preserve stable error mapping and sanitized summaries instead of forwarding upstream payloads.
- [P02] **Reusing voice-agent assumptions for translation**: OpenAI live translation is a separate protocol shape and cleanup model.

### Tool/Library Notes

- [P04] **Accessible diagnostic names**: E2E and provider tests should query the real accessible label exposed by the diagnostics panel, not a guessed summary label.
- [P01] **`docker compose config`**: Use it as a fast interpolation check before trusting a deployment compose file.
- [P01] **`npm run deploy:verify`**: Keep the verifier in the loop for health, headers, and request-ID checks after server changes.
- [P01] **`actionlint` + YAML parsing**: Workflow linting caught CI/CD contract drift early and kept the existing job names stable.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item                                            | Resolution                                                                                                                                                    |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P04   | OpenAI Translation demo documentation gap       | Added a dedicated maintainer guide and updated README, demo mode, troubleshooting, environment, and API docs with translation setup and verification details. |
| P04   | Translation lifecycle and diagnostics hardening | Cleanup, retryability, and sanitized failure mapping are now stable across hook, provider, source, and route layers.                                          |
| P03   | Translation teardown coverage                   | Phase 03 added deterministic cleanup for peer connections, data channels, remote streams, source tracks, abort controllers, and timers on stop and unmount.   |
| P03   | Translation token boundary                      | Phase 02 added a dedicated translation client-secret route and kept `OPENAI_API_KEY` out of browser-visible state.                                            |
| P03   | Demo and production CORS permissiveness         | Replaced implicit localhost fallback with strict exact-origin production CORS and same-origin defaults.                                                       |
| P03   | Raw Gemini API key exposure in production       | Blocked returning the raw server API key to browsers.                                                                                                         |

---

_Auto-generated by /initspec. Updated by /carryforward between phases._
