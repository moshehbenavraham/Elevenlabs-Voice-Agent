# Session 02: Evaluation Harness and Sample Workflow

**Session ID**: `phase05-session02-evaluation-harness-and-sample-workflow`
**Status**: Not Started
**Estimated Tasks**: 12-18
**Estimated Duration**: 2-4 hours

---

## Objective

Define a repeatable local translation evaluation workflow for latency, translated transcript quality, names, numbers, dates, domain terms, and mixed-language behavior using non-sensitive baseline assets.

---

## Scope

### In Scope (MVP)

- Create or update a maintained evaluation guide under `docs/ongoing-projects/`.
- Define golden scripts for general speech, technical terms, names/numbers/dates, and mixed-language segments.
- Add guidance for generated or self-recorded non-sensitive baseline audio fixtures when practical.
- Define an ignored local override path for user-supplied private media that must not be committed.
- Document manual bilingual review steps and measurable latency checkpoints.
- Add lightweight scripts, fixture metadata, or test helpers only when they fit existing project conventions.
- Keep evaluation outputs local and non-blocking unless a later phase makes them CI requirements.

### Out of Scope

- Automated speech-quality scoring as a required CI gate.
- Committing private meeting recordings, customer media, or personally sensitive transcripts.
- Building a production evaluation dashboard.
- Changing the translation protocol or provider UI.

---

## Prerequisites

- [ ] Phase 04 translation documentation and browser smoke coverage are complete.
- [ ] Current test fixture conventions are understood.
- [ ] `.gitignore` behavior is reviewed before adding local media override paths.

---

## Deliverables

1. Translation evaluation guide with golden scripts and review checklist.
2. Non-sensitive fixture plan or baseline fixture metadata.
3. Ignored local media override path for private user-supplied evaluation files.
4. Latency and quality checkpoints maintainers can repeat during demos or release checks.

---

## Success Criteria

- [ ] Maintainers can run the documented evaluation workflow without private media.
- [ ] Private local media has an ignored path and is not required for baseline validation.
- [ ] Evaluation criteria cover latency, names, numbers, dates, domain terms, and mixed-language behavior.
- [ ] The workflow states which checks are manual, optional, or future CI candidates.
