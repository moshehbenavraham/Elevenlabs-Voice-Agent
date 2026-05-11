# Task Checklist

**Session ID**: `phase02-session02-shared-translation-config-library`
**Total Tasks**: 16
**Estimated Duration**: 3-4 hours
**Created**: 2026-05-11

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[SNNMM]` = Session reference (NN=phase number, MM=session number)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 4      | 4      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **16** | **16** | **0**     |

---

## Setup (3 tasks)

Initial contract verification and planning notes.

- [x] T001 [S0202] Verify Session 01 backend route contract, Phase 02 session stub scope, and official OpenAI translation docs checked date (`.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md`)
- [x] T002 [S0202] Audit existing frontend config, type export, and Vitest patterns before editing (`.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md`)
- [x] T003 [S0202] Create initial implementation notes with language-list source, ASCII-label decision, and deferred Session 04 test matrix (`.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md`)

---

## Foundation (5 tasks)

Core type contracts, constants, and pure helpers.

- [x] T004 [S0202] [P] Create OpenAI translation type contracts for target languages, route request/response, session config, session update, and audio mix state (`src/types/openai-translation.ts`)
- [x] T005 [S0202] Export OpenAI translation types from the shared type barrel for later hook and UI sessions (`src/types/index.ts`)
- [x] T006 [S0202] Create translation config constants, ordered ASCII language metadata, model constants, and local backend route metadata (`src/lib/openaiTranslation.ts`)
- [x] T007 [S0202] Implement target-language lookup, type guard, normalization, and assertion helpers with schema-validated input and explicit error messages (`src/lib/openaiTranslation.ts`)
- [x] T008 [S0202] Implement audio mix clamping and volume-state helpers with safe handling for non-numeric, low, high, decimal, and infinite inputs (`src/lib/openaiTranslation.ts`)

---

## Implementation (4 tasks)

Reusable payload builders and documentation.

- [x] T009 [S0202] Implement translation session config builder with `audio.output.language`, optional source transcription, optional noise reduction, and no prompt/tool/voice assumptions (`src/lib/openaiTranslation.ts`)
- [x] T010 [S0202] Implement `session.update` and local translation-session request builders with normalized target languages and future-hook-friendly return types (`src/lib/openaiTranslation.ts`)
- [x] T011 [S0202] [P] Document shared config exports, route contract consumption, and WebRTC/runtime deferrals in OpenAI realtime docs (`docs/OPENAI_REALTIME.md`)
- [x] T012 [S0202] Update implementation notes with final export names, behavior decisions, and Session 03/04 handoff details (`.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md`)

---

## Testing (4 tasks)

Focused smoke coverage, quality commands, and encoding checks.

- [x] T013 [S0202] [P] Add narrow smoke tests for language constants, normalization, audio mix clamping, and translation payload shape (`src/test/openaiTranslation.test.ts`)
- [x] T014 [S0202] Run focused OpenAI translation config tests and record pass/fail output or exact blockers (`.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md`)
- [x] T015 [S0202] Run `npm run type-check`, `npm run lint`, and `npm run build`, then record results or exact blockers (`.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md`)
- [x] T016 [S0202] Validate ASCII encoding, Unix LF line endings, no new dependencies, docs consistency, and deferred test handoff before validation workflow (`.spec_system/specs/phase02-session02-shared-translation-config-library/implementation-notes.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for the validate workflow step

---

## Next Steps

Run the validate workflow step to verify session completeness.
