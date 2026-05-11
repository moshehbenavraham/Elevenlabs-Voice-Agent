# Session 03: Unit and Integration Coverage

**Session ID**: `phase04-session03-unit-and-integration-coverage`
**Status**: Not Started
**Estimated Tasks**: 18-24
**Estimated Duration**: 2-4 hours

---

## Objective

Add focused tests for translation config, event parsing, hook cleanup, capture option construction, route validation, and transcript export.

---

## Scope

### In Scope (MVP)

- Expand unit coverage for side-effect-free translation config helpers.
- Cover recognized and unknown `oai-events` parsing behavior.
- Add cleanup-sensitive tests for hook helpers or mocked hook behavior.
- Cover capture option construction and permission/no-track error mapping.
- Add server route integration tests for validation, sanitized responses, upstream failures, and missing API key behavior if gaps remain.
- Cover transcript Markdown export formatting and clearing behavior.

### Out of Scope

- Browser-level Playwright flows, which belong to Session 04.
- Live OpenAI API calls.
- Test-only rewrites of application architecture.

---

## Prerequisites

- [ ] Sessions 01 and 02 are complete or their public contracts are stable.
- [ ] Existing Vitest, React Testing Library, and server route test patterns are understood.
- [ ] Tests use mocks or fixtures and do not require real OpenAI credentials.

---

## Deliverables

1. Focused unit tests for translation config and event parsing.
2. Cleanup and capture option tests using stable local mocks.
3. Server route tests for translation token validation and sanitized error handling where needed.
4. Transcript export tests covering source and translated rows.
5. Updated implementation notes with commands run and any residual gaps.

---

## Success Criteria

- [ ] Tests cover supported-language validation and audio mix clamping.
- [ ] Tests cover known transcript event parsing and tolerate unknown event messages.
- [ ] Tests prove cleanup-sensitive state does not leak between starts.
- [ ] Tests cover route validation and sanitized frontend-visible responses.
- [ ] The relevant local test command passes.
