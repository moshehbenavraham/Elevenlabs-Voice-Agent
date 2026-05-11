# Session Specification

**Session ID**: `phase04-session04-e2e-and-browser-smoke-tests`
**Phase**: 04 - Hardening, Quality, and Demo Readiness
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session adds deterministic browser-level smoke coverage for the OpenAI Translation tab after the Phase 04 lifecycle, diagnostics, and unit/integration coverage work. The goal is to verify the translation user flow through Playwright without requiring a real microphone, browser-tab audio share, OpenAI credentials, or live OpenAI network calls.

The work focuses on the real app shell and translation provider UI: feature-flagged tab visibility, initial controls, disabled/pending states, permission and no-audio-track diagnostics, provider switching cleanup, and mocked WebRTC/data-channel events. These tests should complement the existing Vitest coverage rather than duplicate every hook or helper assertion.

The session is next because Phase 04 Sessions 01 through 03 are complete. The cleanup and diagnostics contracts are now stable enough to model in browser smoke tests, and Session 05 documentation should be written after these browser limitations and residual gaps are known.

---

## 2. Objectives

1. Add reusable Playwright helpers for OpenAI Translation tab navigation, source selection, startup, stop, diagnostics, and mock runtime inspection.
2. Add deterministic browser media and WebRTC mocks for microphone, browser-tab audio, permission denial, no-audio-track, client-secret, SDP, remote audio, and data-channel events.
3. Cover translation tab visibility, disabled states, permission failure UX, missing tab-audio UX, microphone fallback, mocked connected state, transcript smoke behavior, and provider-switch cleanup.
4. Verify the focused Playwright command runs locally without real OpenAI credentials, real media devices, or live provider network calls.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session01-lifecycle-reliability` - Provides guarded start/stop cleanup, provider-switch stop reason, source ownership, and retryable cleanup state.
- [x] `phase04-session02-error-states-and-diagnostics` - Provides stable diagnostic categories and accessible translation status/diagnostics panels.
- [x] `phase04-session03-unit-and-integration-coverage` - Provides unit/integration contracts for helpers, hooks, route behavior, diagnostics, and provider rendering.

### Required Tools/Knowledge

- Playwright 1.59.1 fixtures, route interception, init scripts, locator best practices, and per-test browser API mocking.
- Existing `tests/e2e/page-objects/VoicePage.ts`, `tests/e2e/fixtures/`, `tests/e2e/utils/audio-mock.ts`, and `tests/e2e/utils/mock-server.ts` patterns.
- OpenAI live translation protocol separation: browser WebRTC media, `/api/openai/translation-session`, `/v1/realtime/translations/calls`, translated remote audio, and `oai-events` data channel messages.

### Environment Requirements

- Node/npm dependencies are installed.
- Playwright browsers are available for the current environment.
- `VITE_OPENAI_TRANSLATION_ENABLED=true` is used for the focused translation smoke run.
- Tests must not require `OPENAI_API_KEY`, real microphone permission, browser-tab sharing, or live OpenAI requests.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can run focused browser smoke tests for the OpenAI Translation tab - Add Playwright spec coverage with local mocks and deterministic route interception.
- Translation demo user can see feature-flagged translation UI in browser tests - Verify the tab renders when enabled and the initial controls/status are accessible.
- Translation demo user gets actionable source errors - Verify unsupported tab capture, permission denial, and missing audio track diagnostics.
- Translation demo user can use microphone fallback when tab audio is unavailable - Verify microphone source can start with mocked media while tab source is blocked.
- Maintainer can verify mocked WebRTC behavior - Simulate client-secret, SDP exchange, remote translated audio, and transcript data-channel events.
- Maintainer can verify provider-switch cleanup - Start a mocked-active translation session, switch providers, and assert cleanup runs before or during navigation without duplicate stop effects.

### Out of Scope (Deferred)

- Full live translation quality evaluation against OpenAI - _Reason: Phase 05 owns evaluation harness and sample workflows._
- Cross-browser matrix expansion beyond existing Playwright projects - _Reason: Keep this session focused on stable Chromium smoke coverage plus compatibility-safe helpers._
- Production deployment smoke tests - _Reason: Deployment validation belongs to production or pipeline workflows._
- Browser extension overlays, LiveKit rooms, telephony, or raw-audio server bridge tests - _Reason: These are Phase 05 or later media variants._
- New persistent transcript storage, telemetry providers, or analytics - _Reason: The product remains current-session only._

---

## 5. Technical Approach

### Architecture

Keep translation E2E support under `tests/e2e/`. Extend the existing `VoicePage` page object with OpenAI Translation locators and actions, then add a narrow translation-specific mock utility that can be imported only by the translation spec. The utility should install browser init scripts for `navigator.mediaDevices.getDisplayMedia`, controlled `getUserMedia` behavior if needed, fake `RTCPeerConnection`, fake `RTCDataChannel`, cleanup counters, and helpers to emit remote track and transcript events.

Use Playwright route interception for the backend translation client-secret route and direct OpenAI SDP call endpoint. The mocked responses should contain stable fake secrets and SDP bodies only. They must not include API keys, bearer tokens, raw OpenAI payloads, authorization headers, or real audio data.

The first spec should live in `tests/e2e/providers/openai-translation.spec.ts` to match the existing provider test layout. Prefer role and accessible-name selectors for visible user workflows, and use `data-testid` only for existing provider-tab conventions or runtime mock inspection where roles are not appropriate.

### Design Patterns

- Page object extension: Add stable translation actions to `VoicePage` instead of scattering selectors across tests.
- Test-only browser mocks: Install deterministic media/WebRTC scripts with `page.addInitScript` before navigation.
- Route-level provider isolation: Intercept token and SDP endpoints in Playwright so browser tests never call OpenAI.
- Scenario helpers: Express source modes, permission failures, no-audio-track streams, connected state, remote audio, and data-channel transcript events as explicit helper calls.
- Accessible assertions: Prefer `getByRole`, status panel text, and diagnostics content over brittle class selectors.

### Technology Stack

- TypeScript 6.0.3
- Playwright 1.59.1
- Vite 8.0.11 development server
- React 19.2.6
- Existing npm scripts: `npm run test:e2e`, `npm run type-check`, `npm run lint`

---

## 6. Deliverables

### Files to Create

| File                                             | Purpose                                                                                                                          | Est. Lines |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `tests/e2e/utils/openai-translation-mock.ts`     | Test-only media, WebRTC, route, cleanup, and data-channel helpers for translation smoke coverage.                                | ~260       |
| `tests/e2e/providers/openai-translation.spec.ts` | Browser smoke tests for translation tab visibility, source errors, fallback, mocked runtime events, and provider-switch cleanup. | ~300       |

### Files to Modify

| File                                                                                       | Changes                                                                                                                                                                   | Est. Lines |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `tests/e2e/page-objects/VoicePage.ts`                                                      | Add OpenAI Translation tab locator, selection support, translation control locators, source/language helpers, diagnostics/status helpers, and cleanup inspection helpers. | ~120       |
| `tests/e2e/utils/audio-mock.ts`                                                            | Adjust shared media mocks only if the translation utility needs reusable stream/track behavior that should be shared with existing tests.                                 | ~60        |
| `tests/e2e/utils/mock-server.ts`                                                           | Add translation route constants or helper exports only if shared route interception is cleaner than keeping them in the translation mock utility.                         | ~40        |
| `.spec_system/specs/phase04-session04-e2e-and-browser-smoke-tests/implementation-notes.md` | Record commands, browser limitations, mock design, and residual gaps discovered during implementation.                                                                    | ~120       |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Translation tab renders when `VITE_OPENAI_TRANSLATION_ENABLED=true` and remains reachable through the provider tab controls.
- [ ] Initial translation controls, source selector, target language selector, status panel, diagnostics panel, transcript panel, export controls, and audio player surfaces are visible or discoverable through accessible selectors.
- [ ] Start controls become disabled or busy while source capture, client-secret, SDP, or WebRTC startup is pending.
- [ ] Unsupported browser-tab capture, permission denial, and no-audio-track cases produce distinct actionable diagnostics.
- [ ] Microphone source can start with mocked media when browser-tab audio is unavailable.
- [ ] Mocked WebRTC startup reaches a connected state without live OpenAI calls and can attach a translated audio stream.
- [ ] Mocked data-channel transcript events surface source or translated transcript output in the browser.
- [ ] Provider switching during a mocked active or pending translation session invokes provider-switch cleanup and avoids duplicate cleanup effects.

### Testing Requirements

- [ ] Focused translation Playwright command passes locally in Chromium with `VITE_OPENAI_TRANSLATION_ENABLED=true`.
- [ ] Tests do not require `OPENAI_API_KEY`, real microphone access, browser-tab screen sharing, or live OpenAI network calls.
- [ ] Route interception proves no browser-visible output includes API keys, bearer tokens, raw provider payloads, authorization headers, request bodies, or SDP bodies.
- [ ] Existing E2E smoke tests remain compatible with the translation helper changes.

### Non-Functional Requirements

- [ ] Tests are deterministic in CI-style headless Chromium and avoid arbitrary sleeps except where existing animation waits already require them.
- [ ] Translation protocol remains separate from normal OpenAI voice-agent WebSocket tests, prompts, tools, voices, assistant turns, and `response.create`.
- [ ] Browser media mocks release tracks, peer connections, data channels, timers, listeners, and route state between tests.
- [ ] Browser-specific limitations found during implementation are captured for Session 05 documentation.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Focused Playwright smoke command passes or a residual blocker is documented with exact reproduction.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.

---

## 8. Implementation Notes

### Key Considerations

- Use `VITE_OPENAI_TRANSLATION_ENABLED=true` for the focused smoke command because Vite reads this flag at dev-server startup.
- Keep translation mocks scoped to the translation spec unless a helper is broadly useful to existing voice-provider tests.
- Prefer accessible-name assertions for user-visible states and only add test IDs if the app lacks a stable accessible selector.
- If provider switching lacks an explicit confirmation flow at browser level, still assert the implemented cleanup contract and record the UX gap for Session 05 or a follow-up product decision.

### Potential Challenges

- Vite feature flags are startup-time values: Use a focused command or documented env invocation rather than trying to flip the flag per test.
- Browser media APIs vary by engine: Keep the required passing command Chromium-focused unless the existing project matrix already supports the new mocks everywhere.
- `RTCPeerConnection` behavior is complex in real browsers: Prefer a test-owned fake that exposes the lifecycle events this app consumes.
- Existing E2E helpers may assume voice-agent WebSocket flows: Keep translation helper names explicit so OpenAI voice-agent tests remain unaffected.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Do not call live OpenAI endpoints in browser smoke tests; route-intercept the documented endpoints and keep protocol assumptions local to test helpers.
- [P02] **Translation protocol separation**: Do not reuse normal OpenAI voice-agent WebSocket mocks, prompts, tools, voices, assistant turns, or `response.create` assumptions.
- [P03] **Single-stop cleanup path**: Provider-switch smoke tests should assert the same guarded stop path used by manual stop, source-ended, auto-stop, and unmount.
- [P03] **Stable provider-switch stop handler**: Verify the app shell invokes the current translation stop callback with the provider-switch reason before or during navigation.
- [P01] **Raw provider bodies in logs or responses**: E2E assertions and mock responses must avoid exposing raw provider payloads, secrets, bearer tokens, request bodies, and SDP bodies in UI output.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Do not tighten CSP in this session; only document CSP-related browser failures if the current app exposes them during smoke testing.

---

## 9. Testing Strategy

### Unit Tests

- No broad new unit-test expansion is planned. Add narrow unit coverage only if a shared E2E helper exposes pure behavior that cannot be safely validated through Playwright.

### Integration Tests

- Run focused Playwright coverage for `tests/e2e/providers/openai-translation.spec.ts` with `VITE_OPENAI_TRANSLATION_ENABLED=true` and `--project=chromium`.
- Run existing smoke/provider E2E subsets if shared fixtures, page objects, or mock server helpers are modified.

### Manual Testing

- Open the app with `VITE_OPENAI_TRANSLATION_ENABLED=true`, select OpenAI Translation, verify tab source diagnostics, verify microphone fallback, start with mocks or local browser permissions disabled, and switch providers during a pending or active translation state.

### Edge Cases

- `getDisplayMedia` undefined or unavailable.
- `getDisplayMedia` permission denial or cancellation.
- Browser-tab capture returns no audio tracks.
- Token route returns validation, auth, rate-limit, service, timeout, or malformed response errors.
- SDP exchange fails or returns malformed SDP.
- Peer connection fails after startup.
- Data-channel transcript event arrives before remote audio.
- Provider switch occurs while startup or stop is already pending.

---

## 10. Dependencies

### External Libraries

- `@playwright/test`: 1.59.1
- `typescript`: 6.0.3
- `vite`: 8.0.11

### Other Sessions

- **Depends on**: `phase04-session01-lifecycle-reliability`, `phase04-session02-error-states-and-diagnostics`, `phase04-session03-unit-and-integration-coverage`
- **Depended by**: `phase04-session05-documentation-and-demo-configuration`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
