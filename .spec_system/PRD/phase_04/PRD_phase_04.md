# PRD Phase 04: Hardening, Quality, and Demo Readiness

**Status**: In Progress
**Sessions**: 5
**Estimated Duration**: 5-8 days

**Progress**: 4/5 sessions (80%)

---

## Overview

Phase 04 hardens the browser translation MVP for repeated local demos. It focuses on deterministic lifecycle cleanup, actionable diagnostic states, focused unit and integration coverage, browser smoke tests, and documentation that lets maintainers run, debug, and demo the translation tab confidently.

---

## Progress Tracker

| Session | Name                                 | Status      | Est. Tasks | Validated  |
| ------- | ------------------------------------ | ----------- | ---------- | ---------- |
| 01      | Lifecycle Reliability                | Complete    | 16-22      | 2026-05-11 |
| 02      | Error States and Diagnostics         | Complete    | 14-20      | 2026-05-11 |
| 03      | Unit and Integration Coverage        | Complete    | 18-24      | 2026-05-11 |
| 04      | E2E and Browser Smoke Tests          | Complete    | 16-22      | 2026-05-11 |
| 05      | Documentation and Demo Configuration | Not Started | 12-18      | -          |

---

## Completed Sessions

1. Session 01: Lifecycle Reliability (validated 2026-05-11)
2. Session 02: Error States and Diagnostics (validated 2026-05-11)
3. Session 03: Unit and Integration Coverage (validated 2026-05-11)
4. Session 04: E2E and Browser Smoke Tests (validated 2026-05-11)

---

## Upcoming Sessions

- Session 05: Documentation and Demo Configuration

---

## Objectives

1. Make the browser translation MVP reliable enough for repeated local demos.
2. Add clear diagnostic states for browser, token, SDP, WebRTC, and media failures.
3. Expand unit, integration, and E2E coverage around the translation tab.
4. Document environment flags, run steps, known limitations, cost and usage notes, and demo-mode behavior.

---

## Prerequisites

- Phase 03 completed.
- Existing translation route, source capture hook, WebRTC translation hook, provider UI, transcripts, export, and audio mix controls are implemented.
- `OPENAI_API_KEY` remains server-side only.
- Official OpenAI realtime translation docs are re-checked before sessions that touch endpoint, SDP, or event contracts.
- Current security posture is reviewed before server route or CSP changes.

---

## Technical Considerations

### Architecture

Phase 04 should keep OpenAI live translation separate from the existing OpenAI voice-agent provider. Reliability work should preserve the single-stop cleanup path from Phase 03 and make errors explicit without adding new protocol assumptions, persistent storage, or production-only dependencies.

### Technologies

- React 19, TypeScript, and existing provider-tab component patterns.
- Browser media APIs: `RTCPeerConnection`, `RTCDataChannel`, `MediaStream`, `getUserMedia()`, and `getDisplayMedia()`.
- Express translation client-secret route from Phase 02.
- `gpt-realtime-translate`, `gpt-realtime-whisper`, `/v1/realtime/translations/client_secrets`, and `/v1/realtime/translations/calls`.
- Vitest, React Testing Library, and Playwright.

### Risks

- OpenAI translation endpoint volatility: re-check current docs before protocol-specific changes.
- Browser capture variability: tab-audio support differs by browser and selected share target.
- Cleanup regressions: duplicate stop paths can leak peer connections, data channels, media tracks, abort controllers, timers, or audio elements.
- Test brittleness: WebRTC and permissions need stable mocks and browser-smoke boundaries.
- Residual production risks: process-local rate limiting and broad CSP allowances should not be worsened during hardening.

### Relevant Considerations

- [P03] **Single-stop cleanup path**: Keep auto-stop, manual stop, source-ended, and provider-switch teardown on one guarded path.
- [P03] **Hook-owned resource boundaries**: Keep peer connection, data channel, remote stream, source tracks, abort controller, and timers owned by the translation hook.
- [P03] **Explicit in-flight guards**: Preserve duplicate start, stop, and clear protection while async work is pending.
- [P03] **Stable provider-switch stop handler**: Keep provider switching aligned with the active translation stop callback.
- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before any protocol changes.
- [P02] **Translation protocol separation**: Do not reuse prompt, tool, or `response.create` assumptions from the existing OpenAI provider.
- [P01-S01] **Rate limiting is process-local**: Avoid weakening route protection; shared-store enforcement remains a later production concern.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Validate provider behavior before tightening browser media or connection directives.

---

## Success Criteria

Phase complete when:

- [ ] All 5 sessions completed.
- [ ] Translation start, stop, unmount, provider switching, track-ended, and failed-start paths clean up deterministically.
- [ ] Unsupported browser APIs, token failures, SDP failures, WebRTC failures, and missing audio tracks produce actionable user-facing errors.
- [ ] Unit and integration tests cover translation config, event parsing, hook cleanup, capture option construction, route validation, and transcript export.
- [ ] Playwright smoke coverage validates tab visibility, disabled states, permission failure UX, provider switching cleanup, and mocked WebRTC events.
- [ ] Documentation covers environment flags, run steps, known limitations, cost and usage notes, and demo-mode behavior.

---

## Dependencies

### Depends On

- Phase 03: Browser Translation MVP.

### Enables

- Phase 05: Production Extensions and Media Variants.
