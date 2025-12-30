# Session: Validation & Polish

**Phase**: 04 - Deployment & New Providers
**Session**: 04
**Session ID**: `phase04-session04-validation-polish`
**Status**: Not Started
**Estimated Tasks**: 12-15
**Estimated Duration**: 2-3 hours

---

## Objective

Validate all Phase 04 deliverables, ensure Docker deployment works end-to-end, confirm Ultravox feature parity with other providers, and polish documentation for production use.

---

## Scope

### In Scope (MVP)

- Docker build and runtime testing
- docker-compose local deployment verification
- Coolify deployment guide finalization
- Ultravox unit tests
- Ultravox integration tests (tab switching)
- Cross-provider parity verification
- Mobile responsiveness testing for Ultravox tab
- Error handling polish
- Documentation updates (README, CLAUDE.md)

### Out of Scope

- Performance optimization beyond baseline
- Additional Ultravox features
- Google Gemini integration (future phase)

---

## Prerequisites

- [ ] Session 01 (Coolify Deployment Bundle) completed
- [ ] Session 03 (Ultravox Integration) completed
- [ ] All existing tests passing

---

## Deliverables

### Docker Validation

1. **Build verification**: `docker build` succeeds, image < 200MB
2. **Runtime verification**: `docker-compose up` starts application
3. **Health check validation**: `/api/health` returns 200
4. **WebSocket verification**: All providers connect through Docker

### Ultravox Testing

5. **Unit tests**: `UltravoxVoiceContext.test.tsx`
6. **Integration tests**: Tab switching with Ultravox
7. **E2E test stubs**: Playwright tests for Ultravox flow

### Documentation

8. **Coolify deployment guide**: `docs/DEPLOYMENT.md`
9. **README updates**: Add Ultravox to provider list
10. **CLAUDE.md updates**: Add Ultravox architecture notes
11. **Environment variables**: Update `.env.example`

---

## Testing Checklist

### Docker Testing

- [ ] `docker build -t voice-agent .` succeeds
- [ ] Image size < 200MB
- [ ] `docker-compose up` starts without errors
- [ ] Frontend loads at http://localhost:3001
- [ ] Health endpoint responds at /api/health
- [ ] ElevenLabs provider connects successfully
- [ ] xAI provider connects successfully
- [ ] OpenAI provider connects successfully
- [ ] Ultravox provider connects successfully
- [ ] WebSocket connections work through container

### Ultravox Unit Tests

- [ ] Context starts in idle state
- [ ] connect() transitions to connecting
- [ ] Successful connection updates status
- [ ] Transcript events update messages
- [ ] Mic mute toggle works
- [ ] disconnect() cleans up session
- [ ] Error states handled correctly
- [ ] Tool registration works

### Provider Parity Testing

| Feature            | ElevenLabs | xAI | OpenAI | Ultravox |
| ------------------ | ---------- | --- | ------ | -------- |
| Connect/Disconnect | ✓          | ✓   | ✓      | Verify   |
| Status Display     | ✓          | ✓   | ✓      | Verify   |
| Transcript         | ✓          | ✓   | ✓      | Verify   |
| Function Calling   | -          | ✓   | ✓      | Verify   |
| Voice Selection    | -          | ✓   | ✓      | Verify   |
| Reconnection       | ✓          | ✓   | ✓      | Verify   |
| Error Handling     | ✓          | ✓   | ✓      | Verify   |

### Mobile Testing

- [ ] Ultravox tab renders correctly on mobile
- [ ] Touch targets ≥ 44px
- [ ] Transcript scrolls correctly
- [ ] Connect button accessible
- [ ] Status indicators visible

---

## Documentation Updates

### README.md

Add Ultravox to supported providers:

```markdown
## Supported Providers

- **ElevenLabs**: Widget and SDK modes
- **xAI (Grok)**: Realtime voice with function calling
- **OpenAI**: Realtime API with 8 voices
- **Ultravox**: Fixie.ai 70B model with client-side tools
```

### CLAUDE.md

Add Ultravox to architecture section:

```markdown
### Ultravox Integration

- Uses `ultravox-client` SDK (not raw WebSocket)
- Session-based: backend creates call, frontend joins via joinUrl
- Audio handled internally by SDK
- Client-side tool registration
- Status events: disconnected, connecting, idle, listening, thinking, speaking
```

### docs/DEPLOYMENT.md

Complete Coolify deployment guide:

1. Repository connection
2. Environment variables setup
3. Domain configuration
4. SSL provisioning
5. Health check configuration
6. Deployment verification

---

## Success Criteria

- [ ] Docker image builds successfully (< 200MB)
- [ ] docker-compose starts all services
- [ ] All 4 providers connect through Docker
- [ ] Ultravox unit tests pass
- [ ] Provider parity verified (feature matrix)
- [ ] Mobile UI works correctly
- [ ] Documentation complete and accurate
- [ ] No new lint warnings introduced
- [ ] All existing tests pass (215+)

---

## Run Commands

```bash
# Docker build test
docker build -t voice-agent .

# Local docker-compose test
docker-compose up

# Run all tests
npm run test:run

# Lint check
npm run lint

# Build verification
npm run build
```

---

## Risks & Mitigations

| Risk                    | Mitigation                            |
| ----------------------- | ------------------------------------- |
| Docker WebSocket issues | Test with actual provider connections |
| Ultravox SDK quirks     | Document workarounds if found         |
| Image size bloat        | Review multi-stage build optimization |
| Documentation gaps      | Follow existing format patterns       |
