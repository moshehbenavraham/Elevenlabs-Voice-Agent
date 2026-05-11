# Session Specification

**Session ID**: `phase04-session05-documentation-and-demo-configuration`
**Phase**: 04 - Hardening, Quality, and Demo Readiness
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session closes the Phase 04 hardening loop by turning the OpenAI live translation implementation, tests, diagnostics, and demo behavior into maintainer-facing operating guidance. A maintainer should be able to enable the feature flag, provide the server-side OpenAI key, run local or demo mode, understand browser capture limits, and verify the translation tab without reading application code first.

The session is documentation-focused. It should not change the translation runtime, server route contract, media capture behavior, or provider UI. The technical work is to consolidate the scattered translation guidance into one dedicated guide and connect it from the README, demo-mode docs, OpenAI realtime docs, troubleshooting docs, and environment templates.

This is next because Phase 04 Sessions 01 through 04 are complete. Lifecycle cleanup, diagnostics, unit/integration coverage, and Playwright smoke tests now define the reliable behavior that the docs need to describe for repeated local demos.

---

## 2. Objectives

1. Document the OpenAI Translation feature flag, server-side API key boundary, max-session guard variables, and same-origin API behavior.
2. Document local development, production/Docker, and ngrok demo-mode run steps for microphone and browser-tab translation checks.
3. Document browser support limitations for `getUserMedia`, `getDisplayMedia`, permissions, HTTPS, tab sharing, and no-audio-track cases.
4. Document cost and usage guardrails, including the default 30-minute session duration and the 120-minute hard maximum posture.
5. Link the translation guide from the README and relevant operational docs so maintainers can find it quickly.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session01-lifecycle-reliability` - Provides guarded cleanup, duplicate-trigger prevention, source-ended handling, and provider-switch teardown behavior.
- [x] `phase04-session02-error-states-and-diagnostics` - Provides user-facing errors and diagnostics for browser, token, SDP, WebRTC, and media failures.
- [x] `phase04-session03-unit-and-integration-coverage` - Provides tested contracts for config helpers, route validation, hook cleanup, capture options, and transcript export.
- [x] `phase04-session04-e2e-and-browser-smoke-tests` - Provides browser smoke coverage and the known demo-readiness limitations that docs should reflect.

### Required Tools/Knowledge

- Markdown documentation conventions in `README.md` and `docs/`.
- Environment-variable conventions from `.env.example`, `.env.production.example`, and `docs/environments.md`.
- Current OpenAI Translation code constants in `src/lib/openaiTranslation.ts` and `server/routes/openai.js`.
- Demo-mode single-tunnel behavior from `scripts/demo.sh` and `docs/DEMO_MODE.md`.

### Environment Requirements

- Node/npm dependencies are installed for optional docs-related verification commands.
- No live OpenAI call, real microphone access, browser-tab sharing, or ngrok tunnel is required to complete the docs.
- Documentation must not instruct users to expose `OPENAI_API_KEY` through `VITE_*` variables or browser-visible config.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can enable OpenAI Translation - Document `VITE_OPENAI_TRANSLATION_ENABLED=true`, build-time feature-flag behavior, and server-side `OPENAI_API_KEY` ownership.
- Maintainer can control demo duration - Document `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES`, the 30-minute default, and the 120-minute hard cap.
- Maintainer can run local and demo checks - Document `npm run dev:all`, `npm run demo`, same-origin demo routing, HTTPS requirements, and focused browser smoke expectations.
- Translation demo user can understand browser limits - Document microphone support, browser-tab audio support, permissions, unsupported APIs, user cancellation, and no-audio-track share targets.
- Maintainer can troubleshoot startup failures - Document checks for missing feature flag, backend key, token route errors, SDP exchange failures, WebRTC failures, offline state, and source capture failures.
- Maintainer can find the docs - Link the dedicated guide from README and relevant docs entry points.

### Out of Scope (Deferred)

- New production safety controls, evaluation harnesses, analytics, or observability events - _Reason: Phase 05 owns production extensions and evaluation workflow._
- Runtime changes to the translation route, WebRTC hook, media capture hooks, provider UI, or Playwright mocks - _Reason: This session documents completed hardening behavior._
- Full architecture rewrite of the docs folder - _Reason: Keep updates targeted to translation demo readiness._
- Marketing copy, screenshots, or visual asset work - _Reason: The session is operational documentation, not product launch material._
- Live OpenAI docs/API verification that changes protocol behavior - _Reason: No protocol implementation changes are planned in this session._

---

## 5. Technical Approach

### Architecture

Create a dedicated `docs/OPENAI_TRANSLATION_DEMO.md` guide as the primary maintainer entry point. Existing docs should stay focused on their current jobs: README for setup and navigation, demo-mode docs for ngrok behavior, OpenAI realtime docs for protocol separation, troubleshooting docs for failure diagnosis, environment docs for variable references, and env templates for copy-paste-safe configuration.

The guide should derive settings and defaults from code instead of restating stale assumptions. For example, use `src/lib/openaiTranslation.ts` for max-session constants and language/source terminology, `server/routes/openai.js` for the server-owned `OPENAI_API_KEY` boundary, and `docs/DEMO_MODE.md` for same-origin ngrok behavior.

No app code should change. If the docs audit finds an implementation mismatch, record it in implementation notes or as a future follow-up instead of fixing runtime behavior during this documentation session.

### Design Patterns

- Dedicated guide plus links: Put durable translation instructions in one doc and link to it from existing entry points.
- Code-derived configuration reference: Verify variable names, defaults, and security boundaries from source before writing docs.
- Operational checklist style: Make local, demo, and production checks actionable without requiring broad code knowledge.
- Secret-minimizing documentation: Always describe `OPENAI_API_KEY` as server-side only and keep browser config limited to `VITE_*` flags.
- Residual-risk callouts: Document process-local rate limiting and CSP compatibility as existing production considerations without expanding scope.

### Technology Stack

- Markdown documentation under `docs/` and `README.md`.
- Environment templates: `.env.example` and `.env.production.example`.
- Existing scripts: `npm run dev:all`, `npm run demo`, `npm run test:e2e`, `npm run type-check`, `npm run lint`.
- Existing app stack for context: React 19, TypeScript 6, Vite 8, Express 5, Playwright 1.59.

---

## 6. Deliverables

### Files to Create

| File                              | Purpose                                                                                                                | Est. Lines |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- |
| `docs/OPENAI_TRANSLATION_DEMO.md` | Dedicated maintainer guide for enabling, running, demoing, troubleshooting, and cost-managing OpenAI live translation. | ~220       |

### Files to Modify

| File                                                                                                | Changes                                                                                                             | Est. Lines |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| `README.md`                                                                                         | Add a clearer translation setup summary and link the dedicated guide from the docs index.                           | ~30        |
| `docs/DEMO_MODE.md`                                                                                 | Add OpenAI Translation demo-mode notes for HTTPS, same-origin API calls, browser-tab audio, and basic auth caveats. | ~60        |
| `docs/OPENAI_REALTIME.md`                                                                           | Refresh remaining Phase 04 wording and link the dedicated translation demo guide.                                   | ~35        |
| `docs/TROUBLESHOOTING.md`                                                                           | Add OpenAI Translation startup and capture failure checks.                                                          | ~70        |
| `docs/environments.md`                                                                              | Add translation max-session flag and build-time/runtime separation notes.                                           | ~35        |
| `docs/API_INTEGRATION.md`                                                                           | Add a concise cross-link to the OpenAI Translation guide without rewriting the ElevenLabs content.                  | ~15        |
| `.env.example`                                                                                      | Refresh translation feature flag, max-session guard, and server-side OpenAI key comments.                           | ~20        |
| `.env.production.example`                                                                           | Add production translation max-session guidance and reinforce the server secret boundary.                           | ~20        |
| `.spec_system/specs/phase04-session05-documentation-and-demo-configuration/implementation-notes.md` | Record doc audit findings, verification commands, and any residual follow-ups.                                      | ~100       |

---

## 7. Success Criteria

### Functional Requirements

- [ ] A maintainer can enable the OpenAI Translation tab using docs alone.
- [ ] Docs clearly state that `OPENAI_API_KEY` is server-side only and must not be exposed through browser-visible variables.
- [ ] Docs explain local development, Docker/production, and ngrok demo-mode behavior for the translation tab.
- [ ] Docs cover microphone capture, browser-tab capture, HTTPS, permissions, unsupported APIs, user cancellation, and no-audio-track share targets.
- [ ] Docs cover default and configurable translation session duration guardrails.
- [ ] README and relevant docs link to the dedicated OpenAI Translation guide.

### Testing Requirements

- [ ] Updated Markdown files pass formatting or targeted style checks used in this repo.
- [ ] Targeted `rg` checks find no new guidance that suggests browser-side OpenAI API keys.
- [ ] Links and referenced commands are manually reviewed for accuracy.

### Non-Functional Requirements

- [ ] Documentation is concise, operational, and avoids marketing copy.
- [ ] Documentation preserves translation protocol separation from the normal OpenAI voice-agent provider.
- [ ] Documentation does not weaken the existing security posture around server secrets, rate limiting, CORS, CSP, or transcript privacy.

### Quality Gates

- [ ] All session artifacts are ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Docs follow project conventions.
- [ ] No runtime code changes unless an implementation blocker is discovered and explicitly documented.

---

## 8. Implementation Notes

### Key Considerations

- This session does not produce application code, so the Behavioral Quality Checklist is not active.
- Keep `OPENAI_API_KEY` documented only as a backend/runtime server secret.
- Make clear that `VITE_OPENAI_TRANSLATION_ENABLED` and `VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES` are build-time frontend settings.
- Use same-origin relative API behavior for demo mode, where Express serves both frontend and API behind one ngrok tunnel.
- Do not claim browser-tab audio support is universal; it depends on browser support and the selected share target exposing an audio track.

### Potential Challenges

- Existing docs already contain partial translation notes: Consolidate instead of duplicating competing instructions.
- Env flags are build-time values in Vite: Make rebuild/restart requirements explicit.
- Demo-mode docs currently describe voice providers broadly: Add translation-specific notes without changing the ngrok architecture explanation.
- `docs/API_INTEGRATION.md` is ElevenLabs-focused: Add only a small cross-link and avoid a broad rewrite.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Avoid inventing new endpoint behavior in docs; describe the implemented route and link official OpenAI references where appropriate.
- [P02] **Translation protocol separation**: Keep docs clear that OpenAI Translation uses a separate WebRTC translation protocol, not prompts, tools, voices, assistant turns, or `response.create`.
- [P03] **Single-stop cleanup path**: Document that stop, provider switch, source-ended, and auto-stop flows clean up the current translation session.
- [P03] **Normalized transcript rows**: Describe source/translated transcript export as current-session artifacts, not persistent history.
- [P01-S01] **Rate limiting is process-local**: Mention this as a production scaling caveat without adding new controls.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Do not recommend CSP tightening without provider-by-provider validation.

---

## 9. Testing Strategy

### Unit Tests

- No unit-test additions are planned because this is a documentation session.

### Integration Tests

- Run targeted text checks for stale "future translation" wording, missing guide links, and unsafe API-key guidance.
- Run formatting checks for updated Markdown files when practical.

### Manual Testing

- Read the new guide as a maintainer and verify the documented sequence from `.env` setup to `npm run dev:all`, translation tab visibility, and demo-mode expectations.
- Confirm documented commands match `package.json`.
- Confirm browser limitation notes match the implemented diagnostics and Playwright smoke scenarios.

### Edge Cases

- Feature flag enabled after the frontend was already built.
- Backend `OPENAI_API_KEY` missing while the frontend translation tab is visible.
- Browser does not support `getDisplayMedia`.
- Browser-tab sharing succeeds but exposes no audio track.
- User denies or cancels microphone/tab permissions.
- Demo URL uses ngrok basic auth and recipients must pass the interstitial/auth step before browser permissions.
- Session duration value is omitted, too low, or above the hard maximum.

---

## 10. Dependencies

### External Libraries

- None new.

### Other Sessions

- **Depends on**: `phase04-session01-lifecycle-reliability`, `phase04-session02-error-states-and-diagnostics`, `phase04-session03-unit-and-integration-coverage`, `phase04-session04-e2e-and-browser-smoke-tests`
- **Depended by**: Phase transition workflow (`audit`, `pipeline`, `infra`, `carryforward`, `documents`) and Phase 05 production extension planning.

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
