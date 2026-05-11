# Considerations

> Institutional memory for AI assistants. Updated between phases via /carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 02 (2026-05-11)

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

<!-- Max 5 items -->

- [P02] **Translation teardown coverage**: Phase 03 must prove cleanup for peer connections, data channels, source tracks, translated audio elements, abort controllers, and timers on stop or provider switch.

### External Dependencies

<!-- Max 5 items -->

- [P02] **OpenAI translation endpoint volatility**: Live translation still depends on `gpt-realtime-translate`, `/v1/realtime/translations/client_secrets`, and `/v1/realtime/translations/calls`. Re-check official docs before any protocol changes.
- [P01] **Public deployment verification**: External scanner and public HTTPS verification still need a real deployment URL. Do not treat localhost verification as the final production check.

### Performance / Security

<!-- Max 5 items -->

- [P01] **Process-local rate limiting**: Production rate limiting is still process-local. Multi-instance deployments need platform-level or shared-store enforcement.
- [P01] **Production CSP compatibility**: Security headers deliberately keep some provider allowances for current SDK behavior. Tightening CSP should be tested provider by provider.

### Architecture

<!-- Max 5 items -->

- [P02] **Translation protocol separation**: OpenAI live translation is not a normal OpenAI voice-agent session. Do not reuse prompt, tool, or `response.create` assumptions from the existing OpenAI provider.

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

<!-- Max 15 items -->

- [P02] **Dedicated translation route isolation**: Keeping translation on its own backend route reduced risk to the existing voice-agent contract and made browser-safe response shaping straightforward.
- [P02] **Pure helper module**: Putting translation config and payload builders in a side-effect-free TypeScript module made reuse in hooks and UI code simpler.
- [P02] **Provider-flag gating at the list level**: Validating persisted selections against the visible provider set prevented hidden translation tabs from leaking into active state.
- [P02] **Route tests as HTTP behavior**: Mounting the real router and mocking fetch produced durable coverage for validation, sanitization, timeout, and upstream failure paths.
- [P02] **Node-environment guards in shared test setup**: Guarding DOM-specific globals let backend tests reuse the repository setup without jsdom leakage.
- [P02] **Early response normalization**: Returning only a browser-safe translation client-secret shape avoided provider-specific payload details escaping into the frontend.
- [P01] **Same-origin production default**: Keeping the combined Express container as the production default reduced config drift across Docker, Compose, docs, and runtime behavior.
- [P01] **BuildKit cache isolation**: Separate cache IDs for build and install stages prevented dependency install races in the production Docker build.
- [P01] **Server-only observability boundary**: Keeping request IDs, logging, and metrics under `server/utils/` avoided frontend bundle leakage.
- [P01] **Exact-origin production CORS**: Making unsafe production origin handling explicit surfaced misconfiguration instead of silently falling back.
- [P01] **Route-specific bounded validation**: Validating provider and function inputs at the route boundary prevented unsafe upstream calls and easier-to-debug failures.
- [P01] **Deploy verifier as a contract**: `deploy:verify` plus compose validation caught health, header, and interpolation drift before it reached operators.
- [P01] **Explicit deferred services**: Writing down deferred uptime/error tracking choices was better than implying incomplete integrations were finished.

### What to Avoid

<!-- Max 10 items -->

- [P00] **Implicit localhost fallback in production CORS**: Production should never inherit demo-only permissiveness or localhost defaults.
- [P01] **Raw provider bodies in logs or responses**: Preserve stable error mapping and sanitized summaries instead of forwarding upstream payloads.
- [P02] **Reusing voice-agent assumptions for translation**: OpenAI live translation is a separate protocol shape and cleanup model.

### Tool/Library Notes

<!-- Max 5 items -->

- [P01] **`docker compose config`**: Use it as a fast interpolation check before trusting a deployment compose file.
- [P01] **`npm run deploy:verify`**: Keep the verifier in the loop for health, headers, and request-ID checks after server changes.
- [P01] **`actionlint` + YAML parsing**: Workflow linting caught CI/CD contract drift early and kept the existing job names stable.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item                                      | Resolution                                                                                                         |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| P02   | Translation token boundary                | Phase 02 added a dedicated translation client-secret route and kept `OPENAI_API_KEY` out of browser-visible state. |
| P01   | Demo and production CORS permissiveness   | Replaced implicit localhost fallback with strict exact-origin production CORS and same-origin defaults.            |
| P01   | Stale token/session limiter paths         | Centralized the real token/session routes and applied strict limiter coverage there.                               |
| P01   | Raw Gemini API key exposure in production | Blocked returning the raw server API key to browsers.                                                              |
| P01   | Raw function arguments/results in logs    | Sanitized function execution logs to remove raw argument and result payloads.                                      |
| P00   | Unicode encoding in .env.example          | Replaced Unicode arrows with ASCII characters for shellcheck compliance.                                           |

---

_Auto-generated by /initspec. Updated by /carryforward between phases._
