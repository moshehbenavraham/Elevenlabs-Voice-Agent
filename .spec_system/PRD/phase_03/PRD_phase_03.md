# PRD Phase 03: Browser Translation MVP

**Status**: In Progress
**Sessions**: 5
**Estimated Duration**: 5-8 days

**Progress**: 3/5 sessions (60%)

---

## Overview

Phase 03 delivers the first usable OpenAI live translation tab inside the app. It adds browser WebRTC translation runtime, microphone and browser-tab source capture, translated audio playback, transcript display, caption controls, export controls, and lifecycle boundaries that keep translation separate from the existing OpenAI voice-agent provider.

---

## Progress Tracker

| Session | Name                              | Status      | Est. Tasks | Validated  |
| ------- | --------------------------------- | ----------- | ---------- | ---------- |
| 01      | Reusable WebRTC Translation Hook  | Complete    | 18-24      | 2026-05-11 |
| 02      | Source Capture Modes              | Complete    | 16-22      | 2026-05-11 |
| 03      | Translation Tab UI MVP            | Complete    | 18-24      | 2026-05-11 |
| 04      | Transcript and Caption Experience | Not Started | 14-20      | -          |
| 05      | Audio Mix and Export Controls     | Not Started | 14-20      | -          |

---

## Completed Sessions

1. Session 01: Reusable WebRTC Translation Hook (validated 2026-05-11)
2. Session 02: Source Capture Modes (validated 2026-05-11)
3. Session 03: Translation Tab UI MVP (validated 2026-05-11)

---

## Upcoming Sessions

- Session 04: Transcript and Caption Experience
- Session 05: Audio Mix and Export Controls

---

## Objectives

1. Deliver a browser-safe WebRTC runtime for `gpt-realtime-translate` calls.
2. Support microphone and browser-tab audio capture with clear permission and track handling.
3. Build the translation provider tab MVP with target language, source, status, playback, and start/stop controls.
4. Add transcript, caption, audio mix, export, elapsed-time, and max-session guard controls.
5. Preserve cleanup boundaries so translation sessions do not destabilize other providers.

---

## Prerequisites

- Phase 02 completed.
- Existing OpenAI translation client-secret route is implemented and validated.
- `OPENAI_API_KEY` remains server-side only.
- Official OpenAI realtime translation docs are re-checked before sessions that touch endpoint, SDP, or event contracts.
- `EXAMPLE/` reference assets remain available locally during implementation.

---

## Technical Considerations

### Architecture

OpenAI live translation remains a separate protocol path from the existing OpenAI voice-agent provider. Phase 03 should use browser WebRTC, `/v1/realtime/translations/calls`, translated audio as a remote media track, and `oai-events` data channel parsing instead of prompts, tools, assistant turns, or `response.create`.

### Technologies

- React 19, TypeScript, and existing provider-tab component patterns.
- `RTCPeerConnection`, `RTCDataChannel`, `MediaStream`, `getUserMedia()`, and `getDisplayMedia()`.
- Existing Express translation client-secret route from Phase 02.
- `gpt-realtime-translate`, `gpt-realtime-whisper`, `/v1/realtime/translations/client_secrets`, and `/v1/realtime/translations/calls`.
- Vitest and existing frontend hook/component test conventions.

### Risks

- OpenAI translation endpoint volatility: re-check current docs before protocol-specific implementation.
- Browser capture variability: tab-audio support differs by browser and share target, so missing audio tracks must produce actionable errors.
- Cleanup gaps: stop, provider switching, track-ended events, and failed starts must close peer connections, data channels, tracks, audio elements, abort controllers, and timers.
- Protocol confusion: do not reuse normal OpenAI voice-agent assumptions for translation lifecycle or events.
- Demo cost control: max-session guardrails must prevent unattended long-running sessions.

### Relevant Considerations

- [P02] **Translation teardown coverage**: Phase 03 must prove cleanup for peer connections, data channels, source tracks, translated audio elements, abort controllers, and timers on stop or provider switch.
- [P02] **OpenAI translation endpoint volatility**: Re-check official docs before any protocol changes.
- [P02] **Translation protocol separation**: OpenAI live translation is not a normal OpenAI voice-agent session.
- [P02] **Pure helper module**: Keep translation config and payload helpers side-effect-free where possible.
- [P02] **Provider-flag gating at the list level**: Keep hidden translation tabs from leaking into active provider state.
- [P01-S01] **Rate limiting is process-local**: Avoid weakening existing token-route protection; shared-store enforcement remains a later production concern.
- [P01-S02] **CSP still keeps provider compatibility allowances**: Validate provider behavior before tightening browser media or connection directives.

---

## Success Criteria

Phase complete when:

- [ ] All 5 sessions completed.
- [x] Translation tab can start and stop microphone translation through browser WebRTC.
- [x] Translation tab can request browser-tab audio and handle unsupported, denied, or no-audio-track cases.
- [x] Translated remote audio playback works through a browser-controlled element.
- [x] Target language selection uses the Phase 02 supported-language contract.
- [ ] Source and translated transcript state can render stable latest-caption and panel views.
- [ ] Clear and export controls work for the current session transcript.
- [ ] Original/translated audio mix controls work for browser-tab translation.
- [ ] Default 30-minute max-session guard is enforced without exceeding the configured hard maximum.
- [x] Stop and provider switching clean up peer connections, data channels, source tracks, audio elements, abort controllers, timers, and transcript streams.

---

## Dependencies

### Depends On

- Phase 02: Translation Foundation.

### Enables

- Phase 04: Hardening, Quality, and Demo Readiness.
