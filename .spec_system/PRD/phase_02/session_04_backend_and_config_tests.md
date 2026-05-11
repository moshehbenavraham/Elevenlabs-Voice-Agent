# Session 04: Backend and Config Tests

**Session ID**: `phase02-session04-backend-and-config-tests`
**Status**: Not Started
**Estimated Tasks**: 14-20
**Estimated Duration**: 2-4 hours

---

## Objective

Cover translation route validation, OpenAI response sanitization, missing key handling, language list correctness, and audio-mix clamping with focused tests.

---

## Scope

### In Scope (MVP)

- Add or extend server route tests for the translation client-secret route.
- Mock OpenAI upstream responses and error cases.
- Verify unsupported target languages fail before upstream calls.
- Verify missing `OPENAI_API_KEY` handling.
- Verify browser responses are sanitized and normalized.
- Add config tests for supported languages and audio mix helper behavior.
- Keep tests aligned with existing Vitest conventions.

### Out of Scope

- Full WebRTC integration tests.
- Playwright browser media permission tests.
- Translation hook cleanup tests, which belong to later WebRTC implementation phases.

---

## Prerequisites

- [ ] Session 01 route implementation is complete.
- [ ] Session 02 shared config helpers are complete.
- [ ] Existing server/frontend test commands are understood.

---

## Deliverables

1. Backend route tests for success and failure paths.
2. OpenAI upstream mock coverage.
3. Shared config tests for language list and validators.
4. Audio mix clamping tests.
5. Updated test command notes if the route tests require new setup.

---

## Success Criteria

- [ ] Missing API key behavior is covered.
- [ ] Unsupported language behavior is covered.
- [ ] Sanitized successful response shape is covered.
- [ ] OpenAI error mapping is covered.
- [ ] The supported language list contains exactly the documented 13 output languages.
- [ ] Audio mix helpers clamp and compute expected values.
