# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-30
**Project State**: Phase 04 - Deployment & New Providers
**Completed Sessions**: 21 (3/4 in current phase)

---

## Recommended Next Session

**Session ID**: `phase04-session04-validation-polish`
**Session Name**: Validation & Polish
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 12-15

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 (Coolify Deployment Bundle) completed
- [x] Session 02 (Ultravox Backend) completed
- [x] Session 03 (Ultravox Frontend) completed
- [x] All existing tests passing (215+)

### Dependencies

- **Builds on**: All Phase 04 sessions (Docker deployment + Ultravox integration)
- **Enables**: Production deployment readiness, Phase 04 completion

### Project Progression

This is the **final session of Phase 04**. It validates all deliverables from the phase, ensuring Docker deployment works end-to-end, Ultravox has feature parity with other providers, and documentation is production-ready. Completing this session marks the project as deployment-ready with four voice providers (ElevenLabs, xAI, OpenAI, Ultravox).

---

## Session Overview

### Objective

Validate all Phase 04 deliverables, ensure Docker deployment works end-to-end, confirm Ultravox feature parity with other providers, and polish documentation for production use.

### Key Deliverables

1. **Docker Validation**: Build verification, runtime testing, health checks, WebSocket connectivity
2. **Ultravox Testing**: Unit tests for UltravoxVoiceContext, integration tests for tab switching
3. **Provider Parity**: Verify Ultravox matches ElevenLabs/xAI/OpenAI feature set
4. **Documentation**: Coolify deployment guide, README updates, CLAUDE.md updates

### Scope Summary

- **In Scope (MVP)**: Docker testing, Ultravox tests, documentation updates, mobile responsiveness, error handling polish
- **Out of Scope**: Performance optimization beyond baseline, additional Ultravox features, Google Gemini integration

---

## Technical Considerations

### Technologies/Patterns

- Docker multi-stage builds
- Vitest + React Testing Library for Ultravox tests
- Playwright for E2E test stubs
- Coolify deployment configuration

### Potential Challenges

- WebSocket connectivity through Docker containers
- Ultravox SDK mock setup for unit tests
- Docker image size optimization

### Relevant Considerations

- [P00] **HTTPS Required**: Microphone access requires HTTPS - verify Coolify SSL works
- [P01] **~80% Code Reuse for New Providers**: Ultravox test patterns should follow xAI/OpenAI tests
- [P02] **Fresh token on each reconnect**: Verify Ultravox token handling in reconnection tests

---

## Testing Focus

### Docker Testing Matrix

| Test                            | Expected Result              |
| ------------------------------- | ---------------------------- |
| `docker build -t voice-agent .` | Builds successfully, < 200MB |
| `docker-compose up`             | All services start           |
| Health endpoint                 | `/api/health` returns 200    |
| All providers                   | Connect through container    |

### Provider Parity Matrix

| Feature            | ElevenLabs | xAI | OpenAI | Ultravox |
| ------------------ | ---------- | --- | ------ | -------- |
| Connect/Disconnect | ✓          | ✓   | ✓      | Verify   |
| Status Display     | ✓          | ✓   | ✓      | Verify   |
| Transcript         | ✓          | ✓   | ✓      | Verify   |
| Function Calling   | -          | ✓   | ✓      | Verify   |
| Voice Selection    | -          | ✓   | ✓      | Verify   |
| Reconnection       | ✓          | ✓   | ✓      | Verify   |
| Error Handling     | ✓          | ✓   | ✓      | Verify   |

---

## Alternative Sessions

If this session is blocked:

1. **None available** - This is the final session of Phase 04
2. **Start Phase 05 planning** - If Phase 04 must be paused, plan next phase (Google Gemini, ElevenLabs function calling)

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
