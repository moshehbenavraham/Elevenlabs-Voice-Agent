# Session 04: Room/Telephony Translation Architecture

**Session ID**: `phase05-session04-room-telephony-translation-architecture`
**Status**: Not Started
**Estimated Tasks**: 12-18
**Estimated Duration**: 2-4 hours

---

## Objective

Document and optionally scaffold future room and telephony translation architecture, including one-session-per-direction and one-session-per-listener-language patterns, without shipping it as a default product path.

---

## Scope

### In Scope (MVP)

- Review official Twilio and room translation reference assets as architecture inputs.
- Document call, room, listener, speaker, and target-language session topology options.
- Identify where request signature validation, caller allow-lists, and webhook verification would belong.
- Describe how per-listener-language fanout affects cost, latency, rate limits, and cleanup.
- Note how process-local rate limiting and CSP posture affect any future deployment.
- Optionally add placeholder docs or scaffolding only when it does not create runtime dependencies.

### Out of Scope

- Shipping SIP, Twilio, LiveKit, or room translation integrations.
- Adding production webhook endpoints that accept live carrier traffic.
- Multi-user accounts, room membership, billing, or tenant policy.
- Reworking the existing browser translation UI around room concepts.

---

## Prerequisites

- [ ] Session 03 raw-audio bridge findings are available or explicitly deferred.
- [ ] Current security findings are reviewed.
- [ ] Official OpenAI and relevant telephony reference docs are re-checked before endpoint-specific recommendations.

---

## Deliverables

1. Room and telephony architecture decision document.
2. Session topology comparison for one-session-per-direction and one-session-per-listener-language approaches.
3. Security checklist for webhook, caller, room, and provider boundary concerns.
4. Recommendation for whether a later implementation phase should pursue this path.

---

## Success Criteria

- [ ] Architecture options are concrete enough to estimate future implementation work.
- [ ] Security and cost implications are stated for each recommended topology.
- [ ] No runtime dependency or default UI path is introduced by documentation-only work.
- [ ] Deferred implementation work is clearly separated from current browser translation behavior.
