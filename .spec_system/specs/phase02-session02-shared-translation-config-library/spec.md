# Session Specification

**Session ID**: `phase02-session02-shared-translation-config-library`
**Phase**: 02 - Translation Foundation
**Status**: Completed
**Completed**: 2026-05-11
**Created**: 2026-05-11

---

## 1. Session Overview

This session adds the shared frontend translation configuration library needed by the dedicated OpenAI Translation provider path. Session 01 established the backend route contract at `POST /api/openai/translation-session`, including the server-only client-secret boundary and the supported target language list. Session 02 turns that route contract and the Phase 02 PRD language/audio requirements into typed frontend utilities that later UI and WebRTC sessions can consume without duplicating protocol constants.

The main deliverable is a React-independent TypeScript module under `src/lib/` plus supporting type exports under `src/types/`. It will define the `gpt-realtime-translate` constants, the 13 target output languages fixed by the PRD, language normalization and validation helpers, audio mix clamping/volume helpers, and builders for translation session config and `session.update` payloads. The module should avoid browser media ownership, peer-connection state, data channels, UI rendering, or transcript persistence.

Official OpenAI documentation was re-checked during planning on 2026-05-11. The current model page describes `gpt-realtime-translate` as a dedicated realtime translation model that uses the `v1/realtime/translations` endpoint family and returns translated audio plus transcript deltas. The live translation guide shows target language configuration through `session.audio.output.language`, and the OpenAI release note states the model supports 13 output languages. The project PRD fixes the exact output language codes for this MVP.

---

## 2. Objectives

1. Create a typed shared translation config module with no React or WebRTC runtime ownership.
2. Define stable supported target language constants and lookup helpers for the documented 13 output languages.
3. Add validation, normalization, audio mix, and session payload builders that later hook and UI sessions can reuse.
4. Add narrow smoke coverage and documentation notes without taking over the broader Session 04 route/config test matrix.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session01-translation-api-contract-and-server-route` - Provides backend route contract, supported target language list, response shape, and secret-boundary behavior.

### Required Tools/Knowledge

- Existing frontend config patterns in `src/lib/voiceConfig.ts` and `src/lib/gemini/config.ts`.
- Type export pattern in `src/types/index.ts`.
- Existing Vitest style in `src/test/voiceConfig.test.ts` and `src/lib/gemini/__tests__/config.test.ts`.
- Official OpenAI live translation docs checked on 2026-05-11.
- Local reference examples under `EXAMPLE/openai-cookbook-realtime-translation/.../realtime-translation-config.js`, `EXAMPLE/open-realtime-translate/src/shared/languages.ts`, and `EXAMPLE/.../browser-translation-demo/src/public/audio-mix.js`.

### Environment Requirements

- Node.js and npm available locally.
- No live OpenAI request is required; all utilities are pure config/build helpers.
- All output must remain ASCII-only with Unix LF line endings, so language metadata should use English labels rather than native-language labels that require non-ASCII characters.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can import shared translation constants from `src/lib/openaiTranslation.ts` - Add model, local backend route, optional OpenAI endpoint metadata, and target language defaults.
- User-facing provider UI can list supported target languages - Define typed language metadata for `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, and `en` with stable English labels.
- Future hooks can reject invalid target languages before API calls - Add type guards, normalizers, and validators that handle empty, non-string, whitespace-padded, uppercase, malformed, and unsupported inputs.
- Future tab-audio controls can compute safe mix values - Add clamping and volume helpers for original and translated audio percentages.
- Future WebRTC translation hook can build protocol payloads - Add builders for translation session config and `session.update` payloads using `audio.output.language`, optional input transcription, and optional noise reduction.
- Later UI/API code can share typed contracts - Add request and response types for the local `/api/openai/translation-session` route and payload types for OpenAI translation session updates.

### Out of Scope (Deferred)

- React hook ownership of `RTCPeerConnection`, data channels, translated audio elements, source tracks, abort controllers, or timers - _Reason: Phase 03 owns WebRTC runtime implementation._
- Provider-tab UI rendering, icons, feature flag wiring, or empty state - _Reason: Phase 02 Session 03 owns provider-tab scaffold._
- Full route/config test matrix for route validation, language list correctness, and audio mix edge cases - _Reason: Phase 02 Session 04 owns broad backend and config coverage._
- Browser media capture, permission handling, SDP exchange, translated audio playback, transcript panel, or export controls - _Reason: Phase 03 and later sessions own runtime UX._
- Native-language labels with non-ASCII glyphs - _Reason: the spec workflow requires ASCII-only files._

---

## 5. Technical Approach

### Architecture

Create `src/types/openai-translation.ts` for shared type contracts and `src/lib/openaiTranslation.ts` for pure helper implementations. Keep the module deterministic and side-effect free: no `fetch`, no `window`, no React imports, no direct DOM access, and no localStorage. Later hooks can import the constants and payload builders, then own network and browser-media lifecycle separately.

The module should mirror the backend language list from `server/routes/openai.js` but remain frontend-safe. To reduce drift, expose both the ordered language metadata array and derived helpers such as `getTranslationTargetLanguageCodes`, `isTranslationTargetLanguage`, `normalizeTranslationTargetLanguage`, `getTranslationTargetLanguage`, and `buildTranslationSessionRequest`. Session 04 can add drift tests that compare the frontend list to backend behavior.

For payload builders, use the current OpenAI translation shape shown in official docs and the local examples: `session.audio.output.language` selects the target output language. Include optional `audio.input.transcription` with `gpt-realtime-whisper` only when requested, and optional `audio.input.noise_reduction` where the caller explicitly enables it. Do not include prompts, tools, function calls, voice selection, `response.create`, or normal OpenAI voice-agent assumptions.

### Design Patterns

- Pure config library: Keep helpers importable from tests, hooks, and UI without side effects.
- Boundary validation: Normalize and reject target language inputs before callers build route or protocol payloads.
- Typed contracts: Prefer `interface` for object shapes and `type` for unions, matching project conventions.
- Derived state helpers: Compute audio mix labels and volume values from clamped numeric state rather than repeating calculations in UI.
- Protocol separation: Translation constants and builders should stay separate from `src/lib/voiceConfig.ts` and `OpenAIVoiceContext`.

### Technology Stack

- React 19 and Vite 8 frontend project, though this module should not import React.
- TypeScript 6 strict mode.
- Vitest 4 for narrow pure-function smoke tests.
- Existing `@/*` path alias for tests.

---

## 6. Deliverables

### Files to Create

| File                                                                                             | Purpose                                                                      | Est. Lines |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ---------- |
| `src/types/openai-translation.ts`                                                                | Shared language, route, audio mix, and session payload type contracts        | ~130       |
| `src/lib/openaiTranslation.ts`                                                                   | Constants, language helpers, audio mix helpers, and session payload builders | ~260       |
| `src/test/openaiTranslation.test.ts`                                                             | Narrow smoke tests for helper exports and critical payload behavior          | ~180       |
| `.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md` | Implementation notes, docs checked, decisions, and Session 04 handoff        | ~120       |

### Files to Modify

| File                      | Changes                                                                                     | Est. Lines |
| ------------------------- | ------------------------------------------------------------------------------------------- | ---------- |
| `src/types/index.ts`      | Export OpenAI translation types for later hook/UI sessions                                  | ~20        |
| `docs/OPENAI_REALTIME.md` | Document the frontend shared config module and its separation from runtime WebRTC ownership | ~35        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `src/lib/openaiTranslation.ts` exports the default translation model, input transcription model, backend route path, and translation endpoint metadata.
- [ ] The supported target language constants contain exactly `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, and `en`.
- [ ] Language metadata has stable English labels suitable for a future selector and contains no non-ASCII glyphs.
- [ ] Validation helpers reject empty, non-string, malformed, and unsupported target language inputs before callers build payloads.
- [ ] Normalization helpers trim and lowercase supported target language codes.
- [ ] Audio mix helpers clamp unsafe inputs and compute original/translated percentage and volume values.
- [ ] Session payload builders produce translation-specific payloads with `audio.output.language` and without prompts, tools, voice selection, or `response.create` assumptions.
- [ ] Local route request/response types match the Session 01 backend contract.

### Testing Requirements

- [ ] Narrow smoke tests are added for exported constants, language normalization, audio mix clamping, and session payload shape.
- [ ] Session 04 handoff notes identify the broader test matrix that remains deferred.
- [ ] `npm run test:run -- src/test/openaiTranslation.test.ts` passes.
- [ ] `npm run type-check`, `npm run lint`, and `npm run build` pass or exact blockers are recorded.

### Non-Functional Requirements

- [ ] The module has no React, DOM, browser media, WebRTC, or network side effects.
- [ ] The frontend config does not expose or reference `OPENAI_API_KEY`.
- [ ] Translation protocol helpers remain separate from the existing OpenAI voice-agent config.
- [ ] Future UI sessions can consume typed exports without reworking provider navigation.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] No new external dependencies are added.

---

## 8. Implementation Notes

### Key Considerations

- Session 01 already duplicated the target language list in `server/routes/openai.js`. This session should use the same ordered codes and leave a Session 04 note to test drift between backend and frontend lists.
- Official OpenAI docs checked on 2026-05-11 confirm the dedicated translation endpoint family and `session.audio.output.language` update shape. The OpenAI release note confirms 13 output languages; the PRD defines the exact MVP language code set.
- The local examples include native language labels, but those contain non-ASCII glyphs. Use English labels now and defer native labels unless the encoding rule changes.
- Keep payload builders configurable enough for Phase 03 but not broad enough to imply runtime ownership. Source capture, connection state, audio elements, and transcript events are not part of this session.

### Potential Challenges

- Backend/frontend language drift: Mitigate by matching Session 01 constants exactly and recording a Session 04 drift-test handoff.
- OpenAI protocol drift: Mitigate by isolating model, endpoint, and payload shape constants and recording docs checked date in implementation notes.
- Over-expanding into the WebRTC hook: Mitigate by keeping this module pure and limiting network behavior to local route request/response types.
- Audio mix ambiguity: Mitigate by naming values explicitly as original versus translated percentages and volumes.
- ASCII-only language metadata: Mitigate by using English labels and avoiding native labels in source files.

### Relevant Considerations

- [P02] **OpenAI translation endpoint volatility**: Endpoint family and language update shape were checked during planning; implementation should record final docs checked details.
- [P02] **Translation client secret boundary**: Frontend types can describe the local client-secret response, but code must never expose or reference the server API key.
- [P02] **Translation protocol separation**: Builders must not reuse normal OpenAI voice-agent prompt, tool, assistant-turn, or `response.create` assumptions.
- [P02] **Translation teardown coverage**: This pure config module does not own cleanup, but it should name lifecycle-adjacent contracts clearly for later hook tests.
- [P02-S01] **Translation token exchange remains to be implemented**: Session 01 implemented the route, but this session should consume that contract without widening browser-visible secret data.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Invalid or unsupported language codes could reach later token/WebRTC flows if normalization is loose.
- Audio mix state could produce unsafe `NaN`, negative, or over-1 volume values if clamping is incomplete.
- Future hooks could accidentally inherit voice-agent prompt/tool assumptions if payload builders are not explicitly translation-specific.

---

## 9. Testing Strategy

### Unit Tests

- Verify the language list contains exactly 13 unique target output language codes.
- Verify language normalization trims, lowercases, accepts supported codes, and rejects malformed or unsupported inputs.
- Verify audio mix helpers clamp invalid, low, and high values and produce deterministic percentages, labels, and volumes.
- Verify session config and `session.update` builders include `audio.output.language`, optional transcription/noise-reduction fields, and no prompt/tool/voice fields.

### Integration Tests

- None required in this session. Route integration and backend/frontend drift checks are deferred to Session 04.

### Manual Testing

- Inspect exports from `src/lib/openaiTranslation.ts` and `src/types/index.ts` to ensure later provider scaffold work can import them cleanly.
- Run focused Vitest, type-check, lint, and build commands.
- Validate docs and implementation notes reflect the deferred Session 04 test matrix.

### Edge Cases

- `undefined`, `null`, number, object, empty string, whitespace-only string.
- Uppercase or whitespace-padded supported codes such as `ES`.
- Unsupported but syntactically valid codes such as `ar` or `nl`.
- Malformed codes such as `english`, `e`, `e-`, or values with punctuation.
- Audio mix inputs below 0, above 100, decimal strings, non-numeric strings, `NaN`, and infinity.
- Builders called with omitted optional transcription and noise-reduction flags.

---

## 10. Dependencies

### External Libraries

- No new external dependency is expected.
- Existing Vitest setup is used for focused pure-function tests.

### Other Sessions

- **Depends on**: `phase02-session01-translation-api-contract-and-server-route`
- **Depended by**: `phase02-session03-provider-tab-scaffold`, `phase02-session04-backend-and-config-tests`, `phase03-session01-reusable-webrtc-translation-hook`, `phase03-session03-translation-tab-ui-mvp`, `phase03-session05-audio-mix-and-export-controls`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
