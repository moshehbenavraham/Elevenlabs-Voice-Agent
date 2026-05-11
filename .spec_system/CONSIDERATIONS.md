# Considerations

> Institutional memory for AI assistants. Updated between phases via /carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 01 (2026-05-11)

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

<!-- Max 5 items -->

- [P02] **Translation teardown coverage**: The next translation phase must prove cleanup for peer connections, data channels, source tracks, timers, and provider switches. Regressions here are user-visible and hard to debug.

### External Dependencies

<!-- Max 5 items -->

- [P02] **OpenAI translation endpoint volatility**: Live translation depends on `gpt-realtime-translate`, `/v1/realtime/translations/client_secrets`, and `/v1/realtime/translations/calls`. Re-check official docs before implementation sessions that touch protocol details.
- [P01] **Public deployment verification**: External scanner and public HTTPS verification still need a real deployment URL. Do not treat localhost verification as the final production check.

### Performance / Security

<!-- Max 5 items -->

- [P01] **Process-local rate limiting**: Production rate limiting is still process-local. Multi-instance deployments need platform-level or shared-store enforcement.
- [P01] **Production CSP compatibility**: Security headers deliberately keep some provider allowances for current SDK behavior. Tightening CSP should be tested provider by provider.
- [P02] **Translation client secret boundary**: Browser translation must never receive `OPENAI_API_KEY`; only short-lived sanitized client secrets should cross the backend/frontend boundary.

### Architecture

<!-- Max 5 items -->

- [P01] **Same-origin production default**: The combined Express container is the production default. Keep docs, Compose, and runtime config aligned to avoid split-origin drift.
- [P02] **Translation protocol separation**: OpenAI live translation is not a normal OpenAI voice-agent session. Do not reuse prompt/tool/`response.create` assumptions from the existing OpenAI provider.

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

<!-- Max 15 items -->

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

| Phase | Item                                      | Resolution                                                                                              |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| P01   | Demo and production CORS permissiveness   | Replaced implicit localhost fallback with strict exact-origin production CORS and same-origin defaults. |
| P01   | Stale token/session limiter paths         | Centralized the real token/session routes and applied strict limiter coverage there.                    |
| P01   | Raw Gemini API key exposure in production | Blocked returning the raw server API key to browsers.                                                   |
| P01   | Raw function arguments/results in logs    | Sanitized function execution logs to remove raw argument and result payloads.                           |
| P00   | Unicode encoding in .env.example          | Replaced Unicode arrows with ASCII characters for shellcheck compliance.                                |

---

_Auto-generated by /initspec. Updated by /carryforward between phases._
