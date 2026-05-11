# Session 05: Documentation and Demo Configuration

**Session ID**: `phase04-session05-documentation-and-demo-configuration`
**Status**: Complete
**Estimated Tasks**: 12-18
**Estimated Duration**: 2-4 hours

---

## Objective

Document translation environment flags, run steps, known limitations, cost and usage notes, and demo-mode behavior.

---

## Scope

### In Scope (MVP)

- Document `VITE_OPENAI_TRANSLATION_ENABLED`, `OPENAI_API_KEY`, translation session duration controls, and related demo settings.
- Update run steps for local development, production/demo mode, and browser translation checks.
- Document browser support limitations for microphone capture, tab-audio capture, permissions, and no-audio-track cases.
- Document cost and usage guardrails, including the default 30-minute max-session behavior and hard maximum posture.
- Link translation docs from the main README or relevant docs index.
- Refresh `.env.example` comments if needed.

### Out of Scope

- New production safety controls or evaluation harness implementation, which belong to Phase 05.
- Full architecture rewrite of existing docs.
- Marketing copy or screenshots.

---

## Prerequisites

- [x] Sessions 01 through 04 are complete.
- [x] Current docs touched by out-of-band changes are reviewed before editing.
- [x] Environment variable names and defaults are verified against code.

---

## Deliverables

1. Updated user-facing docs for enabling and running OpenAI live translation.
2. Demo-mode notes for microphone and browser-tab audio translation.
3. Known limitations and troubleshooting guidance.
4. Cost and usage notes for session duration guardrails.
5. Updated environment examples where needed.

---

## Success Criteria

- [x] A maintainer can enable and run the translation tab from the docs without reading code.
- [x] Browser support and permission limitations are documented.
- [x] Demo-mode behavior is documented for local and ngrok-style runs.
- [x] Cost and session-duration guardrails are documented.
- [x] Documentation changes avoid exposing secrets or encouraging browser-side API keys.
