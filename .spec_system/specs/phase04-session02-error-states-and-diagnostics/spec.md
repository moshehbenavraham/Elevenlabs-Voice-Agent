# Session Specification

**Session ID**: `phase04-session02-error-states-and-diagnostics`
**Phase**: 04 - Hardening, Quality, and Demo Readiness
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session continues Phase 04 by turning the stabilized translation lifecycle from Session 01 into actionable diagnostics for repeated local demos. The current OpenAI Translation tab already has typed source and runtime errors, a status panel, retryable cleanup paths, sanitized backend responses, and tests around startup and cleanup. What is still missing is a consistent diagnostic taxonomy that tells maintainers whether a failed demo is blocked by browser support, permissions, missing tab audio, the backend token route, SDP exchange, WebRTC, the data channel, translated audio playback, or offline state.

The work should preserve the current provider layout and protocol boundaries. Diagnostics should be concise, accessible, and visible in the existing translation provider UI without exposing raw OpenAI payloads, API keys, bearer tokens, SDP bodies, authorization headers, or browser-private media details. The frontend should present stable categories and recovery hints while keeping detailed raw provider bodies out of browser-visible state.

This session enables the next two Phase 04 sessions. Session 03 can add broader unit and integration coverage once diagnostic contracts are stable, and Session 04 can add E2E smoke tests against predictable user-facing error states.

---

## 2. Objectives

1. Define stable OpenAI translation diagnostic categories for source capture, backend token, SDP, WebRTC, data-channel, playback, offline, cleanup, and validation failures.
2. Map source-hook, runtime-hook, and backend-route failures into sanitized user-facing diagnostics with retry guidance and no upstream payload leakage.
3. Surface diagnostics inside the existing OpenAI Translation provider UI with accessible status, details, and clear retry/stop behavior.
4. Add focused tests that lock the diagnostic mapping, sanitization, and provider error rendering contracts.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session01-lifecycle-reliability` - Provides guarded start/stop cleanup, source ownership, retryable terminal states, provider-switch cleanup, and lifecycle tests.
- [x] `phase03-session01-reusable-webrtc-translation-hook` - Provides the WebRTC runtime, client-secret request, SDP exchange, data-channel event handling, translated audio stream, and runtime errors.
- [x] `phase03-session02-source-capture-modes` - Provides microphone and browser-tab capture, capability detection, permission errors, no-audio-track errors, and track-ended handling.
- [x] `phase03-session03-translation-tab-ui-mvp` - Provides the OpenAI Translation provider screen, source selector, language selector, and start/stop controls.
- [x] `phase03-session04-transcript-and-caption-experience` - Provides transcript state, caption rendering, clear controls, and `role="log"` behavior.
- [x] `phase03-session05-audio-mix-and-export-controls` - Provides translated/original audio elements, export controls, elapsed timer, and max-session auto-stop.

### Required Tools/Knowledge

- React 19 hooks, memoization, and accessible live-region patterns.
- TypeScript 6 discriminated unions and explicit exported return types.
- Existing Vitest and React Testing Library patterns for provider mocks, fake media streams, fake peer connections, and route tests.
- Browser media API failure names for `getUserMedia()` and `getDisplayMedia()`.
- Existing Express route validation and sanitized response patterns in `server/routes/openai.js`.
- Official OpenAI realtime translation docs must be re-checked before changing endpoint, SDP, or event contracts. This session should avoid protocol changes unless implementation proves one is required.

### Environment Requirements

- Node.js and npm dependencies installed.
- Tests must use local mocks and never request real microphone, tab-audio permissions, OpenAI credentials, or OpenAI network calls.
- `OPENAI_API_KEY` must remain server-side only.
- All diagnostic output must remain ASCII-only and must avoid raw provider responses, tokens, authorization headers, request bodies, and SDP bodies.

---

## 4. Scope

### In Scope (MVP)

- Demo maintainer can distinguish unsupported browser APIs from insecure context, unavailable media devices, permission denial, user cancellation, and missing tab audio - Add stable categories and recovery copy for source capture diagnostics.
- Demo maintainer can distinguish token-route failures from invalid target language, missing server API key, OpenAI auth/rate-limit/service failures, timeout, and malformed sanitized backend response - Map client-secret failures without exposing raw upstream payloads.
- Demo maintainer can distinguish SDP exchange failures from empty offer/answer, HTTP failure, timeout, and aborted startup - Preserve sanitized details and retry behavior.
- Demo maintainer can identify WebRTC peer, ICE, data-channel, remote-audio, parser, and playback failures - Surface state, category, code, and recovery guidance in the existing UI.
- Translation user can recover after diagnostics - Keep retry and stop controls clear, disabled while pending, and keyboard/screen-reader accessible.
- Maintainer can validate sanitization - Add focused tests for diagnostic categories, UI copy, server route mapping, and no secret/upstream leakage.

### Out of Scope (Deferred)

- External observability, analytics, telemetry exports, or persistent event logs - _Reason: This session is UI-visible diagnostics only; production observability belongs to later production work._
- Production safety identifiers or new usage controls - _Reason: Phase 05 owns production safety and usage controls._
- Large layout redesign of the translation tab - _Reason: Keep diagnostics inside the existing translation provider surface._
- Broad unit, integration, and route coverage beyond diagnostic contracts - _Reason: Session 03 owns wider coverage after this session stabilizes public diagnostics._
- Browser-level Playwright flows - _Reason: Session 04 owns E2E and browser smoke coverage._
- CSP hardening or shared-store rate limiting - _Reason: Existing P01 residual findings remain open but are not part of this diagnostics session._

---

## 5. Technical Approach

### Architecture

Keep the current split between source capture, translation runtime, provider orchestration, and backend token creation. Add a small diagnostic layer that consumes existing typed source errors, runtime errors, capability state, route errors, runtime status, source status, transcript summary, and audio stream availability. The layer should output a stable display contract with category, severity, title, message, recovery action, optional sanitized code, and metadata rows.

`src/lib/openaiTranslation.ts` can host pure diagnostic mapping helpers if the result stays cohesive with existing translation helpers. If the implementation becomes noisy, create `src/lib/openaiTranslationDiagnostics.ts` and re-export or import it from the provider. `src/types/openai-translation.ts` should define the diagnostic category and display interfaces so hook, provider, and tests share one contract.

The provider UI should keep `OpenAITranslationStatusPanel` as the primary status summary and add a focused diagnostics surface near it, or extend the existing status panel if that keeps the code simpler. The UI must not require a modal or a new navigation pattern. It should use live-region semantics for blocking errors, expose technical details as short label/value rows, and keep retry/stop behavior obvious without adding a second start/stop state machine.

Backend changes should preserve the sanitized route boundary. `server/routes/openai.js` can add stable error codes or route-safe categories to JSON responses, but it must not include OpenAI response bodies, API keys, bearer tokens, raw request bodies, authorization headers, or SDP. The frontend should map these route-safe fields into diagnostics while tolerating older `{ error, message }` responses.

### Design Patterns

- Pure diagnostic mapper: Convert source/runtime/backend errors into deterministic display objects that are easy to test.
- Sanitized boundary: Backend and frontend diagnostic details expose codes and high-level categories only, never raw upstream payloads or secrets.
- Exhaustive category handling: Use TypeScript unions and `assertNever` helpers for diagnostic category and severity switches.
- Existing UI composition: Reuse the translation status panel pattern and provider layout instead of adding a redesigned diagnostics workflow.
- In-flight guards: Keep start, retry, stop, and clear actions disabled or ignored while relevant async work is pending.
- Accessible error states: Use semantic headings, named controls, `role="status"` or `role="alert"` where appropriate, and stable text that screen readers can announce.

### Technology Stack

- React 19.2.6
- TypeScript 6.0.3
- Vite 8.0.11
- Tailwind CSS 4
- lucide-react 1.14.0
- Express 5
- Vitest 4.1.5 and React Testing Library 16.3.2

---

## 6. Deliverables

### Files to Create

| File                                                             | Purpose                                                                                                         | Est. Lines |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/components/providers/OpenAITranslationDiagnosticsPanel.tsx` | Accessible diagnostics panel for category, message, recovery hint, route/runtime/source codes, and media state. | ~140       |

### Files to Modify

| File                                                        | Changes                                                                                                                                                                     | Est. Lines |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/types/openai-translation.ts`                           | Add diagnostic category, severity, detail, and display interfaces; refine route-safe error shape if needed.                                                                 | ~80        |
| `src/lib/openaiTranslation.ts`                              | Add pure diagnostic mapping helpers, sanitized route error normalization, source/runtime status descriptors, and tests support.                                             | ~180       |
| `src/hooks/useOpenAITranslation.ts`                         | Preserve or enrich runtime errors for token, SDP, WebRTC, data-channel, parser, offline, abort, timeout, and remote-audio failures without leaking payloads.                | ~120       |
| `src/hooks/useOpenAITranslationSource.ts`                   | Preserve or enrich source errors for unsupported APIs, insecure context, permission denial, cancellation, device unavailable, missing audio track, and source-ended states. | ~80        |
| `src/components/providers/OpenAITranslationStatusPanel.tsx` | Adjust status rendering only if needed to share diagnostic display details and accessible labels.                                                                           | ~50        |
| `src/components/providers/OpenAITranslationProvider.tsx`    | Derive diagnostics from source/runtime/server state, render the diagnostics panel, and keep retry/stop behavior clear.                                                      | ~160       |
| `server/routes/openai.js`                                   | Add stable sanitized translation route error codes/categories where useful, preserving current response contract compatibility.                                             | ~100       |
| `src/test/openaiTranslation.test.ts`                        | Add pure diagnostic mapping tests and sanitization assertions.                                                                                                              | ~180       |
| `src/test/useOpenAITranslation.test.tsx`                    | Add runtime diagnostic regressions for token, SDP, WebRTC, data-channel, parser, timeout, abort, and remote-audio failures.                                                 | ~160       |
| `src/test/useOpenAITranslationSource.test.tsx`              | Add source diagnostic regressions for unsupported API, insecure context, permission denial, cancellation, missing audio tracks, and source-ended.                           | ~140       |
| `src/test/OpenAITranslationProvider.test.tsx`               | Add UI rendering tests for diagnostic titles, details, live regions, disabled controls, retryable states, and no secret leakage.                                            | ~180       |
| `src/test/openaiTranslationRoute.test.ts`                   | Add route tests for stable error codes/categories and sanitized upstream failure payloads.                                                                                  | ~140       |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Unsupported microphone and browser-tab APIs produce distinct actionable diagnostics.
- [ ] Insecure context, unavailable media devices, permission denial, cancellation, missing tab audio, and source-ended cases are distinguishable.
- [ ] Token-route failures map to stable frontend diagnostics for validation, missing API key, auth, rate limit, upstream service failure, timeout, and malformed sanitized response.
- [ ] SDP exchange failures map to stable diagnostics without exposing SDP bodies, bearer tokens, or raw OpenAI payloads.
- [ ] WebRTC peer failure, ICE failure, data-channel failure, parser failure, missing remote audio, playback failure, offline state, abort, and cleanup failure produce clear diagnostic categories.
- [ ] Runtime failures leave the session stopped or retryable and keep stop/retry controls disabled while pending.
- [ ] Diagnostic copy remains concise, accessible, and visually consistent with the existing OpenAI Translation provider UI.

### Testing Requirements

- [ ] Unit tests cover all diagnostic categories and exhaustive source/runtime route mapping.
- [ ] Provider tests cover diagnostic rendering for unsupported browser APIs, permission denial, missing audio track, token failure, SDP failure, WebRTC failure, and offline state.
- [ ] Route tests prove translation-session errors include only stable safe fields and never leak API keys, raw upstream response bodies, authorization headers, or raw exception messages.
- [ ] Tests use local mocks only and never make real media or OpenAI calls.

### Non-Functional Requirements

- [ ] `OPENAI_API_KEY`, bearer tokens, raw provider payloads, raw request bodies, authorization headers, and SDP bodies never appear in browser-visible diagnostics or tests snapshots.
- [ ] Diagnostics are deterministic enough for Session 03 unit/integration coverage and Session 04 Playwright smoke flows.
- [ ] Controls remain keyboard and screen-reader usable in idle, loading, error, stopped, retryable, offline, and active states.
- [ ] The OpenAI live translation protocol stays separate from normal OpenAI voice-agent turns, prompts, tools, voices, and `response.create`.
- [ ] No new persistent storage, telemetry provider, or analytics pipeline is introduced.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] `npm run test:run -- src/test/openaiTranslation.test.ts src/test/useOpenAITranslation.test.tsx src/test/useOpenAITranslationSource.test.tsx src/test/OpenAITranslationProvider.test.tsx src/test/openaiTranslationRoute.test.ts` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## 8. Implementation Notes

### Key Considerations

- Preserve the Session 01 single-stop cleanup model. Diagnostics must describe failures without adding another lifecycle path.
- Do not change OpenAI translation endpoints, SDP endpoint paths, or data-channel event names unless official docs have been re-checked and the implementation note explains the reason.
- Keep backend responses browser-safe. It is acceptable to add stable `code` or `category` fields, but not raw upstream bodies or sensitive context.
- Keep diagnostics compact enough for the existing provider UI. Prefer short titles, one-sentence guidance, and structured detail rows.
- Use existing source/runtime error `kind`, `code`, `status`, and `recoverable` fields before adding new fields.

### Potential Challenges

- Backend route and frontend runtime use different error shapes: normalize both into one diagnostic display contract.
- Fetch helper currently reads safe error messages from response JSON: ensure route-safe messages are used while raw upstream text from SDP failures is not exposed directly.
- Browser DOMExceptions vary by browser: map known names while preserving a safe fallback for unknown capture failures.
- Data-channel parser failures are useful for maintainers but can be too technical for users: present category and recovery hint without dumping raw event payloads.
- Audio playback failures can happen in the audio component rather than the runtime hook: decide whether to surface playback diagnostics in this session only if current component boundaries make it practical.

### Relevant Considerations

- [P03] **Single-stop cleanup path**: Diagnostics must not create parallel stop, retry, or reset paths.
- [P03] **Hook-owned resource boundaries**: Keep source capture errors in the source hook and runtime/WebRTC errors in the runtime hook, then normalize for display.
- [P03] **Explicit in-flight guards**: Keep duplicate start, stop, retry, and clear actions guarded while async work is pending.
- [P03] **Tolerant event parsing**: Unknown `oai-events` messages should remain non-fatal; malformed known payloads can become diagnostic parser failures.
- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before protocol-specific changes.
- [P02] **Translation protocol separation**: Do not reuse prompt, tool, assistant turn, voice, or `response.create` assumptions from the existing OpenAI provider.
- [P01-S01] **Rate limiting is process-local**: Diagnostics may mention rate-limit failures, but frontend diagnostics are not production rate limiting.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Do not tighten CSP in this session; document CSP-related browser failures only if current behavior exposes them.
- [P01] **Raw provider bodies in logs or responses**: Preserve stable error mapping and sanitized summaries instead of forwarding upstream payloads.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- Retry and stop are state-mutating actions and must keep duplicate-trigger prevention while in-flight.
- Diagnostics consume external API and browser event contracts and must use types matching declared contracts with exhaustive enum handling.
- Source capture and WebRTC setup are permission-gated and must distinguish denied, restricted, unavailable, unsupported, and revoked-like cases.
- Backend and OpenAI calls must use timeout, retry/backoff, and sanitized failure-path handling.
- Diagnostic panels are interactive/readable UI and must have platform-appropriate accessibility labels, focus behavior, live-region semantics, and input support.

---

## 9. Testing Strategy

### Unit Tests

- Verify diagnostic mapper output for each source error kind, runtime error kind, HTTP status family, route-safe error code, and offline state.
- Verify diagnostic mappers never include `OPENAI_API_KEY`, `sk-`, `Bearer`, raw authorization headers, raw upstream payload strings, request bodies, or SDP bodies.
- Verify target language validation and route error normalization tolerate existing `{ error, message }` responses and new optional safe `code` fields.
- Verify unknown data-channel events remain ignored while malformed known events map to parser diagnostics.

### Integration Tests

- Mock `useOpenAITranslation` and `useOpenAITranslationSource` in provider tests to render each diagnostic category without real browser media.
- Verify status and diagnostics remain keyboard and screen-reader accessible with `role="status"` or `role="alert"` as appropriate.
- Verify start, stop, language, source, export, and clear controls have correct disabled states during diagnostics and pending transitions.
- Mount the real Express route in node tests and assert route-safe JSON for validation, missing key, upstream auth/rate-limit/service errors, invalid upstream success bodies, aborts, and thrown fetch failures.

### Manual Testing

- Open the app with `VITE_OPENAI_TRANSLATION_ENABLED=true` and confirm the OpenAI Translation tab shows a ready diagnostic state.
- Test a browser or mocked context without `getDisplayMedia()` and confirm the tab-audio diagnostic is actionable.
- Deny microphone permission and confirm the permission diagnostic is distinguishable from unsupported API and missing audio.
- Share a browser surface without tab audio and confirm the no-audio-track diagnostic tells the user how to retry.
- Temporarily remove `OPENAI_API_KEY` server-side and confirm the token diagnostic is clear without exposing secrets.
- Simulate network/offline failure and confirm retry/stop behavior remains clear and accessible.

### Edge Cases

- Browser has `navigator.mediaDevices` but only one of `getUserMedia()` or `getDisplayMedia()`.
- Secure context is unavailable even though media APIs exist.
- User cancels the browser picker before a source stream is created.
- Display media returns video-only tracks.
- Client-secret route returns legacy `{ error, message }` without a diagnostic code.
- Client-secret route returns new safe error code/category fields.
- SDP exchange returns an HTTP error body that includes sensitive-looking text.
- Data channel emits malformed JSON after some transcripts have already rendered.
- Peer connection fails while stop is already in progress.
- Runtime enters `error` while translated audio stream is missing.

---

## 10. Dependencies

### External Libraries

- React: 19.2.6
- TypeScript: 6.0.3
- Vite: 8.0.11
- Vitest: 4.1.5
- React Testing Library: 16.3.2
- lucide-react: 1.14.0

### Other Sessions

- **Depends on**: `phase04-session01-lifecycle-reliability`
- **Depended by**: `phase04-session03-unit-and-integration-coverage`, `phase04-session04-e2e-and-browser-smoke-tests`, `phase04-session05-documentation-and-demo-configuration`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
