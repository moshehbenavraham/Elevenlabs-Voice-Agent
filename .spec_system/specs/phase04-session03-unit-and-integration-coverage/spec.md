# Session Specification

**Session ID**: `phase04-session03-unit-and-integration-coverage`
**Phase**: 04 - Hardening, Quality, and Demo Readiness
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session adds focused unit and integration coverage around the OpenAI live translation tab after Phase 04 Session 01 stabilized lifecycle cleanup and Session 02 added user-facing diagnostics. The goal is to turn the current translation behavior into a durable regression surface for config helpers, data-channel event parsing, hook cleanup, source capture, route validation, and transcript export.

The work should primarily expand local Vitest and React Testing Library coverage. Tests must use deterministic mocks for media streams, WebRTC peer connections, data channels, fetch, route responses, and provider state. They must not request real microphone access, tab-audio capture, OpenAI credentials, or live OpenAI API calls.

This session deliberately avoids browser-level Playwright flows and documentation work. Session 04 will use these unit and integration contracts as the basis for E2E smoke coverage, and Session 05 will document run steps, demo configuration, browser limitations, and cost notes.

---

## 2. Objectives

1. Expand pure helper coverage for translation config, source options, audio mix, max-session limits, request building, event parsing, transcript display, and Markdown export.
2. Add cleanup-sensitive hook tests for runtime and source capture behavior using stable fake media, peer connection, data channel, and fetch fixtures.
3. Add server route integration tests for validation, sanitized responses, missing API key, upstream failures, timeout/abort behavior, and malformed upstream success handling.
4. Cover provider-level transcript export, clear behavior, diagnostic/status cooperation, and disabled states without invoking real browser media or OpenAI services.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session01-lifecycle-reliability` - Provides guarded start/stop cleanup, retryable states, provider-switch cleanup, and lifecycle regression patterns.
- [x] `phase04-session02-error-states-and-diagnostics` - Provides stable diagnostic categories, sanitized frontend display contracts, and route-safe error mapping.
- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides the WebRTC runtime hook, data-channel event handling, translated audio stream, and transcript state.
- [x] `phase03-session02-source-capture-modes` - Provides microphone and browser-tab capture, capability detection, permission errors, and missing-track handling.
- [x] `phase03-session04-transcript-and-caption-experience` - Provides normalized transcript rows, display entries, clear behavior, and live-region transcript panels.
- [x] `phase03-session05-audio-mix-and-export-controls` - Provides audio mix controls, Markdown export, elapsed time, and max-session guard behavior.

### Required Tools/Knowledge

- Vitest 4.1.5, React Testing Library 16.3.2, fake timers, and jsdom/node test environments.
- Existing route test server pattern in `src/test/openaiTranslationRoute.test.ts`.
- Existing fake media and WebRTC patterns in `src/test/useOpenAITranslation.test.tsx` and `src/test/useOpenAITranslationSource.test.tsx`.
- Existing diagnostic and transcript helper contracts in `src/lib/openaiTranslation.ts` and `src/types/openai-translation.ts`.
- Security posture for sanitized route responses and browser-visible diagnostics.

### Environment Requirements

- Node.js and npm dependencies installed.
- Tests must use mocks or fixtures only and must not call real providers.
- `OPENAI_API_KEY` must remain server-side only and must not be required for local test success.
- All generated and modified files must remain ASCII-only with Unix LF line endings.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can verify translation config helpers - Cover supported language lists, language normalization, session request/update payloads, max-session config, and audio mix clamping.
- Maintainer can verify event parsing behavior - Cover recognized source and translated transcript events, final/partial states, malformed known payloads, and unknown `oai-events` messages.
- Maintainer can verify hook cleanup behavior - Cover duplicate start/stop, failed startup cleanup, abort, unmount, peer/data-channel closure, remote stream state, and source ownership.
- Maintainer can verify source capture behavior - Cover microphone and browser-tab capability checks, display-media options, permission/cancel mapping, missing audio tracks, track-ended behavior, and listener cleanup ordering.
- Maintainer can verify server route behavior - Cover validation, missing key, sanitized success, upstream auth/rate-limit/service failures, timeout/abort, malformed upstream success, and no sensitive leakage.
- Translation user behavior remains covered at component level - Cover transcript export formatting, clear transcript behavior, disabled pending controls, diagnostic/status rendering, and retryable state expectations.

### Out of Scope (Deferred)

- Browser-level Playwright flows - _Reason: Session 04 owns E2E and browser smoke tests._
- Live OpenAI API calls or real microphone/tab-audio prompts - _Reason: This session must be deterministic and CI-safe._
- Large application architecture rewrites for testability - _Reason: Only narrow helper or boundary changes should be made if new tests expose real gaps._
- External observability, telemetry, production safety identifiers, or shared-store rate limiting - _Reason: Phase 05 and later production work own those controls._
- Documentation updates beyond implementation notes - _Reason: Session 05 owns docs and demo configuration._

---

## 5. Technical Approach

### Architecture

Keep coverage close to the existing contracts. Pure helpers stay under `src/lib/openaiTranslation.ts` and should be tested with ordinary data fixtures. Diagnostic and transcript behavior should be asserted through exported helper contracts where possible, not by reaching into component internals.

Hook tests should reuse or consolidate local fake implementations for `MediaStream`, `MediaStreamTrack`, `RTCPeerConnection`, `RTCDataChannel`, fetch responses, and DOMException-like errors. If duplicated fakes are getting in the way, create a narrow `src/test/openaiTranslationTestUtils.ts` module for shared test-only helpers. The utility should not become a second implementation of the app logic.

Route tests should mount the real Express router and mock only the upstream fetch boundary. They should assert HTTP behavior, stable route-safe error categories/codes, sanitized success shape, timeout/abort handling, and that API keys, bearer tokens, raw upstream bodies, authorization headers, request bodies, and SDP bodies never appear in browser-visible responses.

### Design Patterns

- Contract-first tests: Assert exported helper, hook, component, and route behavior rather than private implementation details.
- Local deterministic fakes: Use fake media, peer connection, data channel, timers, and route responses instead of browser or provider APIs.
- Sanitized boundary assertions: Include explicit no-secret and no-raw-payload checks around routes, diagnostics, and error displays.
- Cleanup-order assertions: Verify listeners, timers, data channels, peers, abort controllers, and tracks are released once and in the expected order.
- Gap-driven fixes: Patch application code only when new tests expose a missing or incorrect contract required by the PRD.

### Technology Stack

- React 19.2.6
- TypeScript 6.0.3
- Vite 8.0.11
- Express 5.2.1
- Vitest 4.1.5
- React Testing Library 16.3.2
- jsdom 29.1.1

---

## 6. Deliverables

### Files to Create

| File                                     | Purpose                                                                                                        | Est. Lines |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/test/openaiTranslationTestUtils.ts` | Shared test-only fake media, WebRTC, fetch response, and sanitization helpers if needed to reduce duplication. | ~180       |

### Files to Modify

| File                                                                                         | Changes                                                                                                                                                              | Est. Lines |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/test/openaiTranslation.test.ts`                                                         | Add focused pure helper tests for config, source options, audio mix, max-session config, transcript parsing, display entries, and Markdown export.                   | ~260       |
| `src/test/useOpenAITranslation.test.tsx`                                                     | Add runtime hook tests for cleanup, duplicate start/stop, partial startup failure, abort, data-channel events, and translated audio stream behavior.                 | ~220       |
| `src/test/useOpenAITranslationSource.test.tsx`                                               | Add source hook tests for capability detection, permission mapping, missing audio tracks, track-ended handling, reset, stop, and listener cleanup ordering.          | ~180       |
| `src/test/OpenAITranslationProvider.test.tsx`                                                | Add provider integration tests for export, clear, disabled controls, diagnostics/status cooperation, and retryable states.                                           | ~180       |
| `src/test/openaiTranslationRoute.test.ts`                                                    | Add server route tests for validation, sanitized success/failure responses, missing key, upstream failures, timeout/abort, malformed success, and no secret leakage. | ~200       |
| `src/lib/openaiTranslation.ts`                                                               | Patch helper, parser, export, or sanitization gaps only if the new tests expose missing PRD-required behavior.                                                       | ~80        |
| `src/hooks/useOpenAITranslation.ts`                                                          | Patch runtime cleanup, parser, abort, or translated audio state gaps only if the new tests expose missing PRD-required behavior.                                     | ~80        |
| `src/hooks/useOpenAITranslationSource.ts`                                                    | Patch source capture error mapping or cleanup-order gaps only if the new tests expose missing PRD-required behavior.                                                 | ~60        |
| `server/routes/openai.js`                                                                    | Patch route validation or sanitized response gaps only if the new tests expose missing PRD-required behavior.                                                        | ~80        |
| `.spec_system/specs/phase04-session03-unit-and-integration-coverage/implementation-notes.md` | Record commands run, decisions made, and residual gaps for validation.                                                                                               | ~120       |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Supported-language validation, target normalization, session config/request/update builders, audio mix clamping, and max-session limits are covered by unit tests.
- [ ] Known source and translated transcript events are parsed into normalized rows, malformed known events are mapped safely, and unknown event messages are tolerated.
- [ ] Runtime hook tests prove duplicate start/stop protection, partial startup cleanup, abort handling, unmount cleanup, data-channel closure, peer closure, and source-track ownership.
- [ ] Source hook tests prove browser capability detection, permission/cancel/no-track mapping, track-ended behavior, reset/stop behavior, and listener removal before track stop.
- [ ] Route tests prove validation, sanitized client-secret responses, missing API key handling, upstream auth/rate-limit/service failures, timeout/abort handling, malformed upstream success handling, and no sensitive leakage.
- [ ] Provider tests cover transcript Markdown export, clear transcript behavior, disabled pending controls, diagnostics/status cooperation, and retryable states.

### Testing Requirements

- [ ] Focused Vitest command passes for translation helper, route, runtime hook, source hook, and provider tests.
- [ ] Tests use local mocks only and do not require real OpenAI credentials, microphone permission, tab-audio permission, or live network access.
- [ ] Tests assert that API keys, bearer tokens, raw provider payloads, authorization headers, request bodies, and SDP bodies are not exposed in browser-visible outputs.
- [ ] Test utilities remain narrow and test-only.

### Non-Functional Requirements

- [ ] The OpenAI live translation protocol stays separate from normal OpenAI voice-agent prompts, tools, voices, assistant turns, and `response.create`.
- [ ] Cleanup-sensitive tests prove no unbounded timers, listeners, streams, peer connections, data channels, or abort controllers remain after stop/unmount.
- [ ] Route and diagnostic coverage preserves server-side API key boundaries and sanitized error contracts.
- [ ] Component-level coverage preserves keyboard and screen-reader accessible control states while pending, stopped, error, and retryable states are rendered.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] `npm run test:run -- src/test/openaiTranslation.test.ts src/test/openaiTranslationRoute.test.ts src/test/useOpenAITranslation.test.tsx src/test/useOpenAITranslationSource.test.tsx src/test/OpenAITranslationProvider.test.tsx` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## 8. Implementation Notes

### Key Considerations

- The analysis script reports Phase 04 Session 03 as the next unfinished candidate, with Sessions 01 and 02 complete. Use that state as authoritative even where older PRD prose has not been fully reconciled.
- Keep tests deterministic and local. Real browser-level media mocking belongs to Session 04, not this session.
- Prefer exported helper and public hook contracts over private implementation assertions.
- Preserve route sanitization. Do not add tests that snapshot raw OpenAI responses, raw exceptions, secrets, bearer tokens, authorization headers, request bodies, or SDP.
- Avoid broad rewrites. Patch source files only where the new tests reveal behavior that conflicts with the PRD or existing session contracts.

### Potential Challenges

- Existing tests already cover many helper paths: start with gap analysis so this session adds meaningful regressions instead of duplicating assertions.
- Fake WebRTC resources can drift from browser behavior: keep fakes minimal and assert app-owned cleanup contracts, not browser internals.
- Route timeout and abort behavior can be timing-sensitive: use fake timers or deterministic abort signals where the current test pattern supports them.
- Transcript export tests can become brittle if they overfit spacing: assert required metadata, stream labels, row ordering, and ASCII output without relying on incidental formatting.
- Provider tests can become too broad: keep them focused on user-visible behavior and disabled states, leaving browser mechanics to hook tests and Session 04.

### Relevant Considerations

- [P03] **Tolerant event parsing**: Unknown `oai-events` messages should stay non-fatal while malformed known payloads remain safely handled.
- [P03] **Normalized transcript rows**: Keep display, captions, and Markdown export aligned around the same transcript shape.
- [P03] **Hook-owned resource boundaries**: Runtime and source hook tests should prove peer/data-channel/source ownership without double cleanup.
- [P03] **Explicit in-flight guards**: Duplicate start, stop, clear, retry, and export controls must remain guarded while async work is pending.
- [P03] **Media listener cleanup before stop**: Source tests should assert listener removal before track stop.
- [P02] **Route tests as HTTP behavior**: Mount the real router and mock fetch so validation, sanitization, timeout, and upstream failure paths stay durable.
- [P02] **Early response normalization**: Route and frontend tests should assert only browser-safe client-secret shapes and diagnostic fields.
- [P02] **OpenAI translation endpoint volatility**: Do not change endpoint contracts unless docs have been re-checked and implementation notes explain the need.
- [P02] **Translation protocol separation**: Do not use prompts, tools, assistant turns, fixed voices, or `response.create` assumptions in translation tests.
- [P01-S01] **Rate limiting is process-local**: Route tests can cover current limiter-safe behavior, but this session does not solve global multi-instance rate limiting.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Do not tighten CSP in this coverage session.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- Runtime and source hooks acquire external resources and need cleanup on scope exit for all acquired resources.
- Provider controls mutate state and need duplicate-trigger prevention while in-flight.
- Routes and data-channel handlers consume external input and need schema-validated input with explicit error mapping.
- Route and OpenAI boundary failures need timeout, retry/backoff, and failure-path handling without leaking sensitive data.
- Export and clear controls need platform-appropriate accessibility labels, focus behavior, and input support.

---

## 9. Testing Strategy

### Unit Tests

- Verify translation constants, language helpers, validation errors, session config builders, session update builders, source metadata, display-media options, audio mix helpers, duration helpers, and max-session normalization.
- Verify data-channel transcript parsing for source deltas, translated deltas, final events, malformed known events, parser diagnostics, and unknown events.
- Verify transcript display grouping, latest caption selection, summary counts, and Markdown export metadata/rows/empty states.
- Verify source error and runtime error helpers preserve safe categories, codes, recoverability, and sanitized messages.

### Integration Tests

- Mount runtime and source hooks with fake media, peer connections, data channels, fetch responses, abort signals, and fake timers.
- Mount the provider with mocked hook states to assert export, clear, disabled controls, diagnostics, status, and retryable behavior.
- Mount the real Express router with mocked upstream fetch to assert HTTP status, body shape, route-safe categories/codes, timeout/abort handling, malformed upstream success, and no sensitive leakage.

### Manual Testing

- Run the focused Vitest command for translation helper, route, runtime hook, source hook, and provider tests.
- Run type check, lint, and build after any source-code fixes.
- Manually review changed tests and any updated app code for ASCII-only output, no live OpenAI calls, and no committed secrets.

### Edge Cases

- Duplicate start while permission, client-secret, or SDP work is pending.
- Stop, reset, unmount, source-ended, and provider-switch cleanup after partial startup failure.
- Browser-tab capture returns no audio tracks or the user cancels the share picker.
- Upstream OpenAI returns auth, rate-limit, service, timeout, malformed JSON, or malformed success responses.
- Transcript export is requested with empty transcript rows, mixed source/translated rows, partial rows, final rows, and diagnostic/error state present.

---

## 10. Dependencies

### External Libraries

- `vitest`: 4.1.5
- `@testing-library/react`: 16.3.2
- `@testing-library/user-event`: 14.6.1
- `jsdom`: 29.1.1
- `express`: 5.2.1

### Other Sessions

- **Depends on**: `phase04-session01-lifecycle-reliability`, `phase04-session02-error-states-and-diagnostics`, and the completed Phase 03 translation MVP sessions.
- **Depended by**: `phase04-session04-e2e-and-browser-smoke-tests`, `phase04-session05-documentation-and-demo-configuration`, and Phase 05 production extension sessions.

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
