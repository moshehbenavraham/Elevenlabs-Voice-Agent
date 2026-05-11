# Task Checklist

**Session ID**: `phase05-session02-evaluation-harness-and-sample-workflow`
**Total Tasks**: 20
**Estimated Duration**: 3-4 hours
**Created**: 2026-05-12

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
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0502] Verify Phase 04 documentation, current translation demo runbook, and Session 01 validation prerequisites (`docs/OPENAI_TRANSLATION_DEMO.md`)
- [x] T002 [S0502] Create evaluation documentation and fixture directory structure (`docs/ongoing-projects/translation-evaluation.md`)
- [x] T003 [S0502] Review existing ignore behavior and add the private local media path convention (`tests/fixtures/translation/.gitignore`)

---

## Foundation (5 tasks)

Core evaluation assets and validation structures.

- [x] T004 [S0502] [P] Create non-sensitive golden scripts for general speech, technical terms, names/numbers/dates, and mixed-language behavior (`tests/fixtures/translation/golden-scripts.md`)
- [x] T005 [S0502] [P] Create fixture policy guidance with generated/self-recorded baseline rules and private-media warnings (`tests/fixtures/translation/README.md`)
- [x] T006 [S0502] Define baseline fixture manifest metadata with stable IDs, optional audio states, target languages, checkpoints, and deterministic ordering (`tests/fixtures/translation/manifest.json`)
- [x] T007 [S0502] Add local override placeholder while keeping private media ignored (`tests/fixtures/translation/local/.gitkeep`)
- [x] T008 [S0502] Create fixture validation test scaffold for manifest parsing and required evaluation asset checks (`src/test/translationEvaluationFixtures.test.ts`)

---

## Implementation (8 tasks)

Main workflow, rubric, and validation implementation.

- [x] T009 [S0502] Write evaluation guide overview, prerequisites, safety budget gates, and no-private-media baseline (`docs/ongoing-projects/translation-evaluation.md`)
- [x] T010 [S0502] Add golden-script run workflow and target-language matrix for baseline evaluation (`docs/ongoing-projects/translation-evaluation.md`)
- [x] T011 [S0502] Add latency checkpoint procedure covering capture start, translated audio, transcript delta, and session stop timings (`docs/ongoing-projects/translation-evaluation.md`)
- [x] T012 [S0502] Add manual bilingual review rubric for meaning, names, numbers, dates, domain terms, mixed-language segments, and transcript export (`docs/ongoing-projects/translation-evaluation.md`)
- [x] T013 [S0502] Document fixture generation or self-recording guidance without requiring committed audio (`tests/fixtures/translation/README.md`)
- [x] T014 [S0502] Document optional private local media override workflow and non-commit privacy guardrails (`docs/ongoing-projects/translation-evaluation.md`)
- [x] T015 [S0502] Link the main OpenAI Translation demo guide to the evaluation workflow (`docs/OPENAI_TRANSLATION_DEMO.md`)
- [x] T016 [S0502] Complete validation test assertions for manifest shape, golden-script references, optional private media, and local ignore rules (`src/test/translationEvaluationFixtures.test.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0502] Run targeted Vitest validation for evaluation fixtures (`src/test/translationEvaluationFixtures.test.ts`)
- [x] T018 [S0502] Run targeted lint or type checks for touched TypeScript validation code (`src/test/translationEvaluationFixtures.test.ts`)
- [x] T019 [S0502] Validate ASCII encoding and confirm no private local media files are committed (`tests/fixtures/translation/manifest.json`)
- [x] T020 [S0502] Update implementation notes and security compliance with commands run, privacy review, and manual dry-run result (`.spec_system/specs/phase05-session02-evaluation-harness-and-sample-workflow/implementation-notes.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] security-compliance.md updated
- [x] Ready for the validate workflow step

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
