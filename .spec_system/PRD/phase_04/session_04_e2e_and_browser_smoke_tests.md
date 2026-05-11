# Session 04: E2E and Browser Smoke Tests

**Session ID**: `phase04-session04-e2e-and-browser-smoke-tests`
**Status**: Not Started
**Estimated Tasks**: 16-22
**Estimated Duration**: 2-4 hours

---

## Objective

Add Playwright coverage for translation tab visibility, disabled states, permission failure UX, provider switching cleanup, and mocked WebRTC events.

---

## Scope

### In Scope (MVP)

- Extend existing E2E page objects or helpers for the OpenAI Translation tab.
- Verify feature-flagged tab visibility and disabled states.
- Mock browser permissions and media APIs enough to test permission failure and no-audio-track UX.
- Add provider-switch cleanup smoke coverage.
- Add mocked WebRTC or data-channel event smoke coverage where it can remain stable in CI.
- Keep tests deterministic without real microphone, tab audio, or OpenAI network calls.

### Out of Scope

- Full live translation quality evaluation against OpenAI.
- Cross-browser matrix expansion beyond the existing E2E baseline.
- Production deployment smoke tests, which belong to a later deployment-focused workflow.

---

## Prerequisites

- [ ] Sessions 01 through 03 are complete.
- [ ] Existing Playwright commands and page-object patterns are understood.
- [ ] Browser media mocks do not require host microphone access.

---

## Deliverables

1. Translation tab E2E helpers or page-object methods.
2. Playwright tests for tab visibility, controls, disabled states, and diagnostics.
3. Provider-switch cleanup smoke coverage.
4. Mocked media/WebRTC event coverage where stable.
5. Notes on any browser-specific limitations that should be documented in Session 05.

---

## Success Criteria

- [ ] E2E tests can run without real OpenAI credentials.
- [ ] Translation tab feature flag behavior is covered.
- [ ] Permission denial and missing tab-audio states are covered.
- [ ] Provider switching during an active or mocked-active translation session triggers cleanup.
- [ ] The relevant Playwright command passes locally or the residual blocker is documented.
