# Session Specification

**Session ID**: `phase05-session02-evaluation-harness-and-sample-workflow`
**Phase**: 05 - Production Extensions and Media Variants
**Status**: Not Started
**Created**: 2026-05-12

---

## 1. Session Overview

This session defines the repeatable local evaluation workflow for the OpenAI live translation tab now that the browser translation MVP and production safety controls are in place. The goal is to give maintainers a baseline they can run before demos or release checks without depending on private meeting recordings, customer media, or sensitive transcripts.

The work centers on documentation, non-sensitive golden scripts, fixture metadata, and a lightweight validation test. It should cover latency checkpoints, translated transcript quality, names, numbers, dates, domain terms, and mixed-language behavior while making clear which checks are manual, optional, or future CI candidates.

This session deliberately avoids translation protocol changes, provider UI changes, automated speech-quality scoring gates, and persistent evaluation result storage. Optional user-supplied media is allowed only through an ignored local path and must never be required for the committed baseline.

---

## 2. Objectives

1. Create a maintained translation evaluation guide under `docs/ongoing-projects/` with a repeatable local workflow.
2. Define golden scripts and fixture metadata for general speech, technical terms, names/numbers/dates, and mixed-language segments.
3. Add ignored local override rules for private media while keeping the committed baseline non-sensitive and self-contained.
4. Add lightweight validation so fixture metadata, documentation links, and privacy guardrails do not drift silently.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session05-audio-mix-and-export-controls` - Provides translated audio playback, transcript export, elapsed time, and max-session guard behavior used by evaluation steps.
- [x] `phase04-session04-e2e-and-browser-smoke-tests` - Provides current Chromium translation smoke coverage and mocked browser-media patterns to reference.
- [x] `phase04-session05-documentation-and-demo-configuration` - Provides the maintained translation runbook and demo configuration baseline.
- [x] `phase05-session01-production-safety-and-usage-controls` - Provides production duration, usage, observability, and privacy guardrails that evaluation guidance must respect.

### Required Tools/Knowledge

- Current translation demo workflow in `docs/OPENAI_TRANSLATION_DEMO.md`.
- Existing Vitest conventions and Node filesystem APIs for metadata validation.
- Existing `.gitignore` behavior and fixture directory conventions.
- Manual bilingual review process for checking translated meaning, names, numbers, dates, and domain terms.

### Environment Requirements

- Node.js and npm dependencies installed.
- No live OpenAI API call required for metadata validation.
- Live evaluation requires an approved `OPENAI_API_KEY`, browser media permissions, and an explicit usage budget.
- Private media, generated outputs, and local evaluation notes remain uncommitted unless explicitly sanitized.

---

## 4. Scope

### In Scope (MVP)

- Maintainer can run a documented local translation evaluation workflow without private media - create `docs/ongoing-projects/translation-evaluation.md` with setup, run modes, latency checkpoints, and review steps.
- Maintainer can use non-sensitive golden scripts for baseline coverage - create scripts for general speech, technical/domain terms, names/numbers/dates, and mixed-language behavior.
- Maintainer can understand fixture expectations before audio exists - create manifest metadata with expected targets, timing checkpoints, and optional fixture states.
- User can keep private local media out of version control - add ignored `tests/fixtures/translation/local/` override rules and document their limits.
- Maintainer can catch drift in the fixture harness - add a focused Vitest validation test for manifest structure, required docs, and local-media ignore posture.
- Maintainer can see how this workflow relates to the main translation runbook - link from `docs/OPENAI_TRANSLATION_DEMO.md`.

### Out of Scope (Deferred)

- Automated speech-quality scoring as a CI gate - _Reason: PRD keeps evaluation outputs local and non-blocking for this phase._
- Committing private meeting recordings, customer media, or personally sensitive transcripts - _Reason: privacy posture requires non-sensitive committed baselines only._
- Building a production evaluation dashboard - _Reason: session objective is local repeatability, not a product surface._
- Changing the translation protocol, provider UI, or OpenAI route behavior - _Reason: this workflow evaluates existing behavior rather than changing runtime behavior._
- Generating synthetic audio through a new dependency or cloud service - _Reason: fixture generation should remain optional and maintainable with local guidance first._

---

## 5. Technical Approach

### Architecture

Create a documentation-led evaluation harness that keeps durable baseline materials in the repository while leaving sensitive or user-specific media outside version control. The committed layer should include the guide, golden scripts, fixture policy, manifest metadata, and tests that validate the structure. The uncommitted layer should be a local directory for private audio or video samples that maintainers may use for domain-specific review.

The validation test should rely on Node filesystem reads and JSON parsing only. It should not call OpenAI, load media files, require browser automation, or depend on private local paths. Its job is to prevent obvious drift: missing golden-script IDs, missing documentation sections, invalid manifest shape, required private media, or local override files being committed accidentally.

### Design Patterns

- Documentation-as-contract: The guide states exact manual steps, measurable checkpoints, and future CI boundaries.
- Metadata manifest: Fixture entries are structured so future scripts or CI candidates can consume them without scraping prose.
- Local override isolation: Private media lives under one ignored path with a committed placeholder only.
- Testable policy: A small Vitest file validates repository-owned evaluation assets without provider calls.

### Technology Stack

- Markdown documentation under `docs/ongoing-projects/` and `tests/fixtures/translation/`.
- JSON fixture metadata under `tests/fixtures/translation/manifest.json`.
- Vitest and Node.js filesystem APIs for validation.
- Existing OpenAI Translation demo guide for run commands and safety constraints.

---

## 6. Deliverables

### Files to Create

| File                                                                                                  | Purpose                                                                                                     | Est. Lines |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| `docs/ongoing-projects/translation-evaluation.md`                                                     | Maintained evaluation workflow, latency checkpoints, manual review rubric, and future CI boundaries.        | ~220       |
| `tests/fixtures/translation/golden-scripts.md`                                                        | Non-sensitive golden scripts for general, technical, names/numbers/dates, and mixed-language coverage.      | ~160       |
| `tests/fixtures/translation/README.md`                                                                | Fixture policy, recording or generation guidance, local override rules, and privacy constraints.            | ~120       |
| `tests/fixtures/translation/manifest.json`                                                            | Structured baseline metadata for scripts, optional audio fixture states, expected targets, and checkpoints. | ~120       |
| `tests/fixtures/translation/.gitignore`                                                               | Ignore private local media and local evaluation outputs while keeping safe placeholders.                    | ~12        |
| `tests/fixtures/translation/local/.gitkeep`                                                           | Keeps the ignored local override directory discoverable.                                                    | ~1         |
| `src/test/translationEvaluationFixtures.test.ts`                                                      | Vitest validation for manifest shape, docs linkage, and local-media ignore posture.                         | ~150       |
| `.spec_system/specs/phase05-session02-evaluation-harness-and-sample-workflow/implementation-notes.md` | Records implementation decisions, commands run, and verification results.                                   | ~80        |
| `.spec_system/specs/phase05-session02-evaluation-harness-and-sample-workflow/security-compliance.md`  | Records privacy, security, and GDPR review for evaluation fixtures and local media.                         | ~80        |

### Files to Modify

| File                              | Changes                                                                    | Est. Lines |
| --------------------------------- | -------------------------------------------------------------------------- | ---------- |
| `docs/OPENAI_TRANSLATION_DEMO.md` | Link the demo guide to the evaluation workflow and clarify when to use it. | ~20        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Maintainers can follow the documented workflow without private media.
- [ ] Golden scripts cover general speech, technical/domain terms, names, numbers, dates, and mixed-language behavior.
- [ ] Fixture metadata identifies committed baselines, optional missing audio, target languages, and latency checkpoints.
- [ ] Private local media has an ignored path and is explicitly optional.
- [ ] The evaluation guide distinguishes manual checks, optional local checks, and future CI candidates.

### Testing Requirements

- [ ] Vitest validation confirms manifest JSON shape and golden-script references.
- [ ] Vitest validation confirms private media is not required for the committed baseline.
- [ ] Vitest validation confirms local override ignore rules exist.
- [ ] Manual dry-run confirms the guide can be followed from existing demo commands.

### Non-Functional Requirements

- [ ] No new persistent personal data store is introduced.
- [ ] No private audio, video, transcript, API key, cookie, authorization header, or raw provider payload is committed.
- [ ] No new dependency is added.
- [ ] Evaluation outputs remain local and non-blocking.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Tests avoid real provider calls.
- [ ] Documentation uses current project paths and commands.

---

## 8. Implementation Notes

### Key Considerations

- `docs/ongoing-projects/` does not currently exist, so create it as the durable home for ongoing translation evaluation work.
- `tests/fixtures/translation/` does not currently exist, so define the convention clearly instead of assuming prior fixture shape.
- The baseline should remain useful even before audio files are generated by using golden scripts and metadata as the first committed layer.
- `tests/fixtures/translation/local/` should support private user-supplied media for local review only; committed tests must not depend on its contents.
- No endpoint, model, SDP, or data-channel assumptions should change in this session. Re-check official OpenAI realtime translation docs only if implementation text starts asserting new protocol details.

### Potential Challenges

- Evaluation bias: Mitigate by covering multiple script categories and target languages rather than one happy-path sample.
- Privacy drift: Mitigate with explicit local-only paths, ignore rules, docs, and validation that private media is not required.
- Over-automation: Mitigate by labeling manual bilingual review separately from future CI candidates.
- Fixture churn: Mitigate by using manifest metadata that can represent missing, generated, or self-recorded non-sensitive assets without breaking tests.
- Live provider cost: Mitigate by keeping metadata tests offline and making live checks budget-gated in docs.

### Relevant Considerations

- [P04] **Dedicated translation runbook**: Link the evaluation workflow from the existing translation guide so maintainers have one operational entry point.
- [P02] **OpenAI translation endpoint volatility**: Do not change protocol assumptions in this session; re-check official docs before any future endpoint/model contract change.
- [P01] **Raw provider bodies in logs or responses**: Keep evaluation outputs, transcripts, and provider payloads local unless sanitized and intentionally committed.
- [P03] **Normalized transcript rows**: Base transcript quality review on the existing source/translated transcript export shape.
- [P04] **Chromium-only translation smoke coverage**: Keep cross-browser evaluation optional unless it becomes a release requirement.
- [P01-S01] **Rate limiting is process-local**: Do not present local evaluation runs as proof of global production quota enforcement.

---

## 9. Testing Strategy

### Unit Tests

- Add `src/test/translationEvaluationFixtures.test.ts` to parse `tests/fixtures/translation/manifest.json` and validate required fields, stable IDs, target languages, and script references.
- Assert no manifest entry requires private local media for baseline validation.
- Assert `tests/fixtures/translation/.gitignore` ignores `local/` contents and local evaluation outputs.

### Integration Tests

- No runtime integration tests are required because this session does not change application behavior or provider routes.

### Manual Testing

- Dry-run the evaluation guide from a maintainer perspective without a live API call.
- Confirm the guide points to the existing demo startup commands and marks live provider checks as budget-gated.
- Confirm private local media instructions are optional and clearly excluded from commits.

### Edge Cases

- Baseline audio fixture is not yet recorded.
- Maintainer has no bilingual reviewer available.
- Mixed-language or same-language segments intentionally produce silence or partial output.
- A local private media file exists under `tests/fixtures/translation/local/`.
- Manifest metadata references a missing golden script ID.

---

## 10. Dependencies

### External Libraries

- None.

### Other Sessions

- **Depends on**: `phase03-session05-audio-mix-and-export-controls`, `phase04-session04-e2e-and-browser-smoke-tests`, `phase04-session05-documentation-and-demo-configuration`, `phase05-session01-production-safety-and-usage-controls`
- **Depended by**: `phase05-session03-backend-raw-audio-bridge-spike`, future production release and demo evaluation workflows

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
