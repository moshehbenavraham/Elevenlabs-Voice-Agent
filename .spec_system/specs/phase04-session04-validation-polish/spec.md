# Session Specification

**Session ID**: `phase04-session04-validation-polish`
**Phase**: 04 - Deployment & New Providers
**Status**: Not Started
**Created**: 2025-12-30

---

## 1. Session Overview

This is the final session of Phase 04, focused on comprehensive validation and polish of all deliverables from the deployment and Ultravox integration work. The session ensures Docker deployment works end-to-end, confirms Ultravox has feature parity with other providers (ElevenLabs, xAI, OpenAI), and produces production-ready documentation.

Completing this session marks the project as deployment-ready with four voice providers. All Docker artifacts (Dockerfile, docker-compose.yml, Nginx configuration) will be validated for production use. The Ultravox integration will be tested to ensure it matches the feature set of existing providers including connect/disconnect, status display, transcript, function calling, voice selection, reconnection, and error handling.

This validation session is critical because it catches integration issues that individual sessions may miss. Docker networking with WebSocket connections, cross-provider consistency, and deployment documentation completeness all require holistic testing that spans multiple system components.

---

## 2. Objectives

1. Validate Docker production deployment builds successfully and runs with all services functional
2. Write comprehensive unit tests for UltravoxVoiceContext achieving parity with other provider tests
3. Verify Ultravox feature parity across all provider capabilities (7 feature categories)
4. Update CLAUDE.md and README with Ultravox documentation and deployment instructions

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session01-coolify-deployment` - Docker deployment infrastructure
- [x] `phase04-session02-ultravox-backend` - Ultravox backend integration
- [x] `phase04-session03-ultravox-frontend` - Ultravox frontend components

### Required Tools/Knowledge

- Docker and docker-compose for container testing
- Vitest + React Testing Library for unit tests
- Understanding of WebSocket protocols for voice providers
- Coolify deployment platform familiarity

### Environment Requirements

- Docker Engine installed and running
- Node.js 18+ for local test execution
- All provider API keys configured in `.env`
- 215+ existing tests passing as baseline

---

## 4. Scope

### In Scope (MVP)

- Docker build verification (image builds, size < 200MB target)
- Docker runtime testing (all services start, health endpoints respond)
- WebSocket connectivity through Docker containers
- Ultravox unit tests (UltravoxVoiceContext, hooks)
- Provider parity verification (7 feature categories)
- CLAUDE.md documentation updates for Ultravox
- README deployment section updates
- Mobile responsiveness check for Ultravox tab
- Error handling verification across providers

### Out of Scope (Deferred)

- Performance optimization beyond baseline - _Reason: Separate optimization session if needed_
- Additional Ultravox features beyond existing provider parity - _Reason: Feature expansion is future phase_
- Google Gemini integration - _Reason: Phase 05 roadmap item_
- E2E Playwright tests for Ultravox - _Reason: Manual testing sufficient for validation_
- CI/CD pipeline updates for Ultravox - _Reason: Existing pipelines work with new provider_

---

## 5. Technical Approach

### Architecture

The validation approach uses a layered testing strategy: Docker infrastructure testing, unit test coverage, integration verification via manual testing, and documentation review. Tests are designed to verify behavior rather than implementation details, following project conventions.

### Design Patterns

- **Test behavior, not implementation**: React Testing Library patterns focusing on user interactions
- **Mock external APIs**: Ultravox SDK mocked similar to other provider tests
- **Provider context isolation**: Each provider tested in isolation with dedicated test files

### Technology Stack

- Docker multi-stage builds (existing from Session 01)
- Vitest 1.6.x with React Testing Library
- jsdom test environment with Web Audio API mocks
- @ultravox-ai/client SDK mocked for unit tests

---

## 6. Deliverables

### Files to Create

| File                                     | Purpose                              | Est. Lines |
| ---------------------------------------- | ------------------------------------ | ---------- |
| `src/test/UltravoxVoiceContext.test.tsx` | Unit tests for Ultravox context      | ~150       |
| `src/test/UltravoxProvider.test.tsx`     | Unit tests for Ultravox UI component | ~100       |

### Files to Modify

| File           | Changes                                                      | Est. Lines Changed |
| -------------- | ------------------------------------------------------------ | ------------------ |
| `CLAUDE.md`    | Add Ultravox to Architecture section, update provider list   | ~30                |
| `README.md`    | Add Ultravox provider documentation, deployment instructions | ~40                |
| `.env.example` | Add Ultravox environment variables                           | ~5                 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Docker image builds successfully with `docker build -t voice-agent .`
- [ ] Docker image size is under 200MB
- [ ] `docker-compose up` starts all services without errors
- [ ] Health endpoint `/api/health` returns 200 in container
- [ ] All 4 providers connect successfully through Docker
- [ ] Ultravox feature parity verified (7/7 categories)

### Testing Requirements

- [ ] UltravoxVoiceContext unit tests written and passing
- [ ] UltravoxProvider component tests written and passing
- [ ] All existing 215+ tests still passing
- [ ] Manual testing of Ultravox tab completed

### Quality Gates

- [ ] All files ASCII-encoded (0-127 characters only)
- [ ] Unix LF line endings throughout
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No new ESLint warnings introduced
- [ ] Documentation accurate and complete

---

## 8. Implementation Notes

### Key Considerations

- Docker networking may require special handling for WebSocket connections
- Ultravox SDK mocking should follow patterns established for xAI/OpenAI contexts
- Test file naming: `ComponentName.test.tsx` alongside component (per CONVENTIONS.md)
- Provider feature parity matrix is the validation checklist

### Potential Challenges

- **WebSocket through Docker proxy**: Coolify/Nginx configuration may need WebSocket upgrade headers - mitigation: verify docker-compose includes proper proxy settings
- **Ultravox SDK mock setup**: SDK may have different patterns than xAI/OpenAI - mitigation: study SDK documentation, follow existing mock patterns
- **Docker image size**: Multi-stage build optimization may be needed - mitigation: check for dev dependencies leaking into production

### Relevant Considerations

- [P00] **HTTPS Required**: Microphone access requires HTTPS - verify Coolify SSL works end-to-end
- [P01] **~80% Code Reuse for New Providers**: Ultravox test patterns should follow xAI/OpenAI test structure
- [P02] **Fresh token on each reconnect**: Verify Ultravox token handling follows ephemeral pattern in tests

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- UltravoxVoiceContext: connection states, error handling, reconnection behavior
- UltravoxProvider: UI rendering, button states, status display
- Voice selection integration (if Ultravox supports multiple voices)

### Integration Tests

- Tab switching between all 4 providers
- Provider context cleanup on tab switch
- Settings modal with Ultravox configuration

### Manual Testing

- Docker build and startup verification
- Connect/disconnect cycle for each provider through Docker
- Transcript display with real voice interaction
- Function calling execution and result display
- Error recovery scenarios (network disconnect, token expiry)

### Edge Cases

- Rapid provider switching during active connection
- Network loss during Ultravox session
- Invalid API key handling for Ultravox
- Container restart with active WebSocket connections

---

## 10. Dependencies

### External Libraries

- `@ultravox-ai/client`: Ultravox SDK (existing from Session 03)
- `vitest`: 1.6.x test runner
- `@testing-library/react`: Component testing utilities
- `docker`: Container runtime

### Other Sessions

- **Depends on**: phase04-session01 (Docker), phase04-session02 (Ultravox backend), phase04-session03 (Ultravox frontend)
- **Depended by**: Phase 05 sessions (enables production deployment baseline)

---

## Provider Feature Parity Matrix

Reference checklist for validation:

| Feature            | ElevenLabs | xAI  | OpenAI | Ultravox |
| ------------------ | ---------- | ---- | ------ | -------- |
| Connect/Disconnect | Pass       | Pass | Pass   | Verify   |
| Status Display     | Pass       | Pass | Pass   | Verify   |
| Transcript         | Pass       | Pass | Pass   | Verify   |
| Function Calling   | N/A        | Pass | Pass   | Verify   |
| Voice Selection    | N/A        | Pass | Pass   | Verify   |
| Reconnection       | Pass       | Pass | Pass   | Verify   |
| Error Handling     | Pass       | Pass | Pass   | Verify   |

---

## Docker Testing Matrix

| Test      | Command                          | Expected Result         |
| --------- | -------------------------------- | ----------------------- |
| Build     | `docker build -t voice-agent .`  | Success, < 200MB        |
| Start     | `docker-compose up`              | All services healthy    |
| Health    | `curl localhost:3001/api/health` | 200 OK with status JSON |
| Frontend  | `curl localhost:80`              | Serves React app        |
| WebSocket | Connect to provider              | Successful connection   |

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
