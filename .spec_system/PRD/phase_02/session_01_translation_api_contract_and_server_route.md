# Session 01: Translation API Contract and Server Route

**Session ID**: `phase02-session01-translation-api-contract-and-server-route`
**Status**: Not Started
**Estimated Tasks**: 14-18
**Estimated Duration**: 2-4 hours

---

## Objective

Add a dedicated Express route that creates sanitized `gpt-realtime-translate` browser client secrets for OpenAI live translation sessions.

---

## Scope

### In Scope (MVP)

- Add a translation-session route under the existing OpenAI server route surface.
- Validate target output language against the documented 13-language list before calling OpenAI.
- Call `/v1/realtime/translations/client_secrets` server-side using `OPENAI_API_KEY`.
- Return only normalized browser-safe client-secret data.
- Reuse the existing API/token rate-limiting posture where applicable.
- Map missing key, validation, and upstream failures to stable client responses.

### Out of Scope

- Browser WebRTC call setup and translated audio playback.
- Provider-tab UI wiring.
- Full route/config test expansion, which belongs to Session 04.
- Production safety identifier implementation beyond documenting the hook point.

---

## Prerequisites

- [ ] Phase 01 production/security hardening is complete.
- [ ] Existing OpenAI Express route conventions are understood.
- [ ] Current OpenAI realtime translation docs have been checked for endpoint and request-shape drift.

---

## Deliverables

1. Translation client-secret route and request validation.
2. Sanitized response mapping for browser clients.
3. Rate-limit integration for the new route.
4. Stable error handling for missing key, unsupported language, and upstream failure paths.
5. Notes for Session 04 test coverage.

---

## Success Criteria

- [ ] Browser clients cannot receive `OPENAI_API_KEY` or raw OpenAI response bodies.
- [ ] Unsupported languages fail before any upstream OpenAI request.
- [ ] The route creates `gpt-realtime-translate` client secrets through the dedicated translations endpoint.
- [ ] New behavior follows existing server route and security conventions.
