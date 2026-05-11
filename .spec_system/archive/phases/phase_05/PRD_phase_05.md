# PRD Phase 05: Production Extensions and Media Variants

**Status**: Complete
**Sessions**: 5
**Estimated Duration**: 5-8 days

**Progress**: 5/5 sessions (100%)

---

## Overview

Phase 05 extends the completed browser translation MVP toward production readiness and future media paths. It focuses on stronger safety and usage controls, a repeatable translation evaluation workflow, and contained architecture work for raw-audio, room, telephony, and subtitle overlay variants without making those variants default UI dependencies.

---

## Progress Tracker

| Session | Name                                    | Status   | Est. Tasks | Validated  |
| ------- | --------------------------------------- | -------- | ---------- | ---------- |
| 01      | Production Safety and Usage Controls    | Complete | 14-20      | 2026-05-12 |
| 02      | Evaluation Harness and Sample Workflow  | Complete | 12-18      | 2026-05-12 |
| 03      | Backend/Raw-Audio Bridge Spike          | Complete | 12-18      | 2026-05-12 |
| 04      | Room/Telephony Translation Architecture | Complete | 12-18      | 2026-05-12 |
| 05      | External Subtitle Overlay Assessment    | Complete | 12-16      | 2026-05-12 |

Session details for Phase 05 are archived in `.spec_system/archive/phases/phase_05/`.

---

## Completed Sessions

1. Session 01: Production Safety and Usage Controls (validated 2026-05-12)
2. Session 02: Evaluation Harness and Sample Workflow (validated 2026-05-12)
3. Session 03: Backend/Raw-Audio Bridge Spike (validated 2026-05-12)
4. Session 04: Room/Telephony Translation Architecture (validated 2026-05-12)
5. Session 05: External Subtitle Overlay Assessment (validated 2026-05-12)

---

## Upcoming Sessions

None.

---

## Objectives

1. Complete the broader translation feature goals beyond the first browser translation MVP.
2. Add production controls, observability, safety posture, and evaluation workflow.
3. Decide which future media variants deserve implementation after the browser translation MVP proves out.
4. Document or prototype backend raw-audio, telephony, room translation, and subtitle overlay paths without making them default UI dependencies.

---

## Prerequisites

- Phase 04 completed.
- Translation route, browser source capture, WebRTC translation hook, provider UI, diagnostics, tests, and demo documentation are in place.
- `OPENAI_API_KEY` remains server-side only.
- Official OpenAI realtime translation docs are re-checked before any endpoint, SDP, event, or model contract change.
- Current security posture is reviewed before rate limiting, CSP, observability, or production control changes.

---

## Technical Considerations

### Architecture

Phase 05 should keep the dedicated OpenAI live translation tab separate from normal voice-agent providers. Production controls should harden the existing browser translation path first. Future media variants should remain isolated docs, spikes, or scaffolds until a later phase explicitly promotes one into the product surface.

### Technologies

- React 19, TypeScript, and existing provider-tab component patterns.
- Express translation client-secret route and existing route limiter posture.
- Browser media APIs: `RTCPeerConnection`, `RTCDataChannel`, `MediaStream`, `getUserMedia()`, and `getDisplayMedia()`.
- OpenAI `gpt-realtime-translate`, `gpt-realtime-whisper`, `/v1/realtime/translations/client_secrets`, and `/v1/realtime/translations/calls`.
- Vitest, Playwright, local fixtures, and documentation under `docs/ongoing-projects/`.

### Risks

- OpenAI translation endpoint volatility: re-check current docs before protocol-specific changes.
- Scope creep: raw-audio, room, telephony, and overlay work can become full product implementations; keep this phase to bounded decisions, docs, and contained prototypes.
- Production safety gaps: process-local rate limiting and broad CSP allowances remain open residual risks.
- Privacy drift: evaluation fixtures and observability must not commit private meeting audio, raw transcripts from users, cookies, authorization headers, or provider payloads.
- Browser capture variability: tab-audio support differs by browser and selected share target.

### Relevant Considerations

- [P04] **Docker frontend env propagation**: Ensure production build paths explicitly pass translation build-time flags before relying on them.
- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before any protocol change.
- [P01] **Process-local rate limiting**: Shared-store or platform-level enforcement is still needed before multi-instance production use.
- [P01] **Production CSP compatibility**: Tighten CSP only with provider-by-provider validation.
- [P02] **Translation protocol separation**: Do not reuse prompt, tool, or `response.create` assumptions from the existing OpenAI provider.
- [P01-S01] **Rate limiting is process-local**: Avoid presenting per-process controls as globally enforced in horizontally scaled deployments.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Treat CSP tightening as incremental and test-backed.

---

## Success Criteria

Phase complete when:

- [x] All 5 sessions completed.
- [ ] Translation production controls are documented and enforce configured session-duration bounds.
- [ ] Translation token and session usage observability remains sanitized and avoids raw provider bodies or user media.
- [ ] A repeatable local evaluation workflow exists with non-sensitive baseline fixtures or fixture-generation guidance.
- [ ] Raw-audio, room/telephony, and subtitle overlay paths have documented decisions and clear next-step recommendations.
- [ ] Deferred media variants do not become default UI dependencies during this phase.

---

## Dependencies

### Depends On

- Phase 04: Hardening, Quality, and Demo Readiness.

### Enables

- Future production deployment, media ingestion, telephony, room translation, or browser-extension overlay phases.
