# Session 02: Shared Translation Config Library

**Session ID**: `phase02-session02-shared-translation-config-library`
**Status**: Not Started
**Estimated Tasks**: 12-16
**Estimated Duration**: 2-4 hours

---

## Objective

Add typed frontend constants, supported output languages, validation helpers, audio-mix helpers, and session-update builders for OpenAI live translation.

---

## Scope

### In Scope (MVP)

- Create a shared translation config module under `src/lib/`.
- Define the supported `gpt-realtime-translate` target output languages: `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, `en`.
- Add typed language metadata suitable for UI selectors.
- Add target-language validation helpers.
- Add audio mix clamping and volume calculation helpers.
- Add builders for translation session update/config payloads.

### Out of Scope

- React hook ownership of `RTCPeerConnection`, data channels, or translated audio elements.
- Provider-tab UI rendering.
- Full test expansion, which belongs to Session 04.

---

## Prerequisites

- [ ] Session 01 route contract is known or stable enough for frontend config naming.
- [ ] Current OpenAI supported-language docs have been checked.
- [ ] Existing frontend library and type patterns are understood.

---

## Deliverables

1. Shared TypeScript translation config module.
2. Supported language constants and lookup helpers.
3. Session payload builder utilities.
4. Audio mix clamping and volume helper functions.
5. Clear exports for later hook/UI sessions.

---

## Success Criteria

- [ ] Language constants match the documented 13 target output languages.
- [ ] Invalid target languages can be rejected by shared helpers.
- [ ] Audio mix inputs are clamped to safe values.
- [ ] The module is independent of React UI and browser WebRTC runtime state.
