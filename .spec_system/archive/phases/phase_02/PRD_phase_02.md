# PRD Phase 02: Translation Foundation

**Status**: Complete
**Completed**: 2026-05-11
**Sessions**: 4
**Estimated Duration**: 2-4 days

**Progress**: 4/4 sessions (100%)

---

## Overview

Phase 02 establishes the foundation for a dedicated OpenAI live translation tab. It creates the backend client-secret contract, shared frontend translation configuration, provider-tab scaffold, and focused backend/config test coverage needed before the browser WebRTC MVP.

---

## Progress Tracker

| Session | Name                                      | Status    | Est. Tasks | Validated  |
| ------- | ----------------------------------------- | --------- | ---------- | ---------- |
| 01      | Translation API Contract and Server Route | Completed | 14-18      | 2026-05-11 |
| 02      | Shared Translation Config Library         | Completed | 12-16      | 2026-05-11 |
| 03      | Provider-Tab Scaffold                     | Completed | 12-18      | 2026-05-11 |
| 04      | Backend and Config Tests                  | Completed | 14-20      | 2026-05-11 |

---

## Completed Sessions

1. Session 01: Translation API Contract and Server Route
2. Session 02: Shared Translation Config Library
3. Session 03: Provider-Tab Scaffold
4. Session 04: Backend and Config Tests

---

## Upcoming Sessions

None.

---

## Objectives

1. Establish the OpenAI Translation API contract through a dedicated backend route.
2. Add shared frontend translation configuration, supported languages, validation helpers, audio mix helpers, and session-update builders.
3. Add the new provider-tab identity, feature flag, icon, empty state, and provider-switch cleanup placeholders.
4. Cover backend route behavior and shared config behavior with focused tests.

---

## Prerequisites

- Phase 01 completed.
- `OPENAI_API_KEY` remains server-side only.
- `EXAMPLE/` reference assets remain available locally during implementation.
- Official OpenAI realtime translation docs are re-checked before implementation sessions that touch protocol details.

---

## Technical Considerations

### Architecture

OpenAI live translation must be implemented as a separate provider tab and protocol path. Do not reuse normal OpenAI voice-agent assumptions such as prompts, tools, `response.create`, assistant turns, or the generic `/v1/realtime` endpoint.

### Technologies

- Express 5 and existing OpenAI route conventions.
- React 19, TypeScript, Vite 7, and existing provider-tab wiring.
- `gpt-realtime-translate`, `gpt-realtime-whisper`, `/v1/realtime/translations/client_secrets`, and `/v1/realtime/translations/calls`.
- Vitest and existing server/frontend test conventions.

### Risks

- OpenAI translation endpoint volatility: re-check official docs before implementing protocol details.
- Translation client secret leakage: return only sanitized short-lived browser secrets and never expose `OPENAI_API_KEY`.
- Translation protocol drift: keep the translation tab separate from existing OpenAI voice-agent session code.
- Test undercoverage: Phase 02 must leave route/config behavior covered before Phase 03 adds WebRTC runtime complexity.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Validate current endpoint and model details before coding protocol-specific behavior.
- [P02] **Translation client secret boundary**: Keep API keys server-side and expose only sanitized client-secret data to the browser.
- [P02] **Translation protocol separation**: Build translation as a separate protocol surface, not a normal OpenAI voice-agent mode.
- [P02] **Translation teardown coverage**: Establish cleanup placeholders and testable contracts before the WebRTC MVP.
- [P02-S01] **Translation token exchange remains to be implemented**: Session 01 must close this open finding by adding the server-side token route.

---

## Success Criteria

Phase complete when:

- [x] All 4 sessions completed.
- [x] Backend translation client-secret route exists and validates target language server-side.
- [x] OpenAI client-secret responses are normalized and sanitized before reaching the browser.
- [x] Shared translation config exposes the documented 13 target languages and audio mix helpers.
- [x] Provider tab scaffold can be feature-gated without disrupting existing providers.
- [x] Focused route/config tests cover validation, missing key handling, sanitization, language list correctness, and audio mix clamping.

---

## Dependencies

### Depends On

- Phase 01: Production Deployment and DevOps.

### Enables

- Phase 03: Browser Translation MVP.
