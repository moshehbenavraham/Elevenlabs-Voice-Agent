# Session 01: Production Safety and Usage Controls

**Session ID**: `phase05-session01-production-safety-and-usage-controls`
**Status**: Complete
**Estimated Tasks**: 14-20
**Estimated Duration**: 2-4 hours

---

## Objective

Add production-oriented safety, usage, and observability controls for the translation path without adding user accounts, billing, persistent transcript storage, or multi-instance infrastructure.

---

## Scope

### In Scope (MVP)

- Re-check current OpenAI realtime translation docs before touching endpoint, model, SDP, or event contracts.
- Validate translation session-duration configuration, including the 30-minute default and 120-minute hard maximum.
- Ensure frontend and Docker/Compose build paths explicitly handle translation build-time flags where production controls depend on them.
- Confirm translation token route limiter coverage and document that current rate limiting remains process-local.
- Add or refine a safe server-side safety identifier hook only if a stable non-PII identifier already exists.
- Add sanitized observability events for translation token/session lifecycle without raw provider bodies, raw transcripts, audio, cookies, authorization headers, or API keys.
- Update production and translation documentation with privacy, cost, duration, and operational guardrails.

### Out of Scope

- User authentication, accounts, tenant policy, billing, or quota management.
- Shared-store or platform-level global rate limiting implementation.
- Persistent transcript, audio, or evaluation result storage.
- New translation UI features unrelated to safety, duration, or usage controls.
- Raw-audio, telephony, room, or overlay variants; those belong to later Phase 05 sessions.

---

## Prerequisites

- [x] Phase 04 documentation and diagnostics are present.
- [x] Existing translation token route, max-session guard, and route limiter posture are understood.
- [x] Current security findings in `.spec_system/SECURITY-COMPLIANCE.md` are reviewed.
- [x] Official OpenAI realtime translation docs are re-checked if protocol-specific code changes are needed.

---

## Deliverables

1. Hardened translation session-duration configuration and validation.
2. Confirmed token route limiter coverage with clear documentation of process-local limits.
3. Sanitized translation usage and lifecycle observability, if supported by existing logger patterns.
4. Production documentation covering privacy, cost, usage, and operational guardrails.
5. Implementation notes identifying any deferred shared-rate-limit or CSP work.

---

## Success Criteria

- [x] Translation duration settings enforce the documented default and hard maximum.
- [x] Production build and Docker/Compose paths do not leave translation feature flags implicit.
- [x] Translation token/session logs avoid raw provider payloads, raw transcripts, raw audio, cookies, authorization headers, and secrets.
- [x] Documentation clearly states what is enforced locally and what still requires platform-level controls.
- [x] Existing voice-agent provider behavior is not regressed.
