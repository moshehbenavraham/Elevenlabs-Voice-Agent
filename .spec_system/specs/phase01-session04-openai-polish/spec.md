# Session Specification

**Session ID**: `phase01-session04-openai-polish`
**Phase**: 01 - OpenAI Voice Agent
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session represents the final validation and polish phase for the OpenAI voice agent integration. With the research, backend ephemeral token endpoint, and frontend integration all complete from sessions 01-03, this session focuses on ensuring production-ready quality through comprehensive testing, bug fixes, and documentation updates.

The objective mirrors the Phase 00 conclusion (`phase00-session04-polish`) which established the pattern of dedicated polish sessions before moving to new phases. This ensures the OpenAI integration achieves parity with the existing xAI and ElevenLabs providers in terms of cross-browser compatibility, accessibility, error handling, and user experience.

Upon completion, Phase 01 will be marked complete and the project will be ready for Phase 02 features such as function calling, voice selection UI, and conversation history.

---

## 2. Objectives

1. Validate OpenAI voice conversations work correctly across Chrome, Firefox, and Safari browsers
2. Ensure mobile responsiveness and touch interactions function properly on the OpenAI tab
3. Fix any bugs or edge cases discovered during testing
4. Update documentation with OpenAI-specific setup instructions and complete Phase 01

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session01-openai-research` - OpenAI Realtime API research and compatibility analysis
- [x] `phase01-session02-openai-backend` - Ephemeral token endpoint at `/api/openai/session`
- [x] `phase01-session03-openai-frontend` - Full OpenAI voice integration with OpenAIVoiceContext

### Required Tools/Knowledge

- Node.js 18+ and npm/bun
- Valid OpenAI API key with Realtime API access
- Access to Chrome, Firefox, and Safari browsers for testing
- Mobile device or emulator for responsive testing

### Environment Requirements

- `.env` file with `OPENAI_API_KEY` configured
- HTTPS environment for production microphone access testing
- Development server running (`npm run dev`)

---

## 4. Scope

### In Scope (MVP)

- Cross-browser testing and compatibility fixes (Chrome, Firefox, Safari)
- Mobile responsiveness validation for OpenAI provider tab
- Keyboard accessibility verification (tab navigation, focus management)
- Error scenario testing (network failures, token expiration, API errors)
- Safari-specific AudioContext user gesture handling verification
- WebSocket reconnection behavior validation
- Documentation updates (README, .env.example)
- Run and fix test suite (`npm run test:run`)
- Lint check and fix (`npm run lint`)
- Production build verification (`npm run build`)
- CONSIDERATIONS.md update via /carryforward for Phase 01 lessons

### Out of Scope (Deferred)

- E2E test automation with Playwright - _Reason: Deferred to future phase per CONSIDERATIONS.md_
- Voice selection UI in frontend - _Reason: Phase 02 feature_
- Conversation history/transcript display - _Reason: Phase 02 feature_
- Function calling integration - _Reason: Phase 02 feature_
- Performance optimization beyond MVP - _Reason: Current performance acceptable_

---

## 5. Technical Approach

### Architecture

No new architecture changes. This session validates the existing three-provider architecture (ElevenLabs, xAI, OpenAI) with tabbed interface and per-provider contexts.

### Testing Strategy

1. **Manual cross-browser testing**: Verify voice flow in each browser
2. **Mobile testing**: Touch interactions, responsive layout, viewport handling
3. **Error injection**: Test network failures, token expiration scenarios
4. **Accessibility audit**: Keyboard navigation, screen reader compatibility

### Validation Areas

- AudioContext initialization (especially Safari user gesture requirements)
- WebSocket connection lifecycle
- Audio playback queue behavior
- Tab switching without resource leaks
- Error boundary graceful degradation

### Technology Stack

- React 18.3.1 with TypeScript
- Vitest + React Testing Library for unit tests
- Vite production build for deployment validation
- ESLint for code quality

---

## 6. Deliverables

### Files to Create

| File                                                                          | Purpose                           | Est. Lines |
| ----------------------------------------------------------------------------- | --------------------------------- | ---------- |
| `.spec_system/specs/phase01-session04-openai-polish/NEXT_SESSION_archived.md` | Archive of session recommendation | ~90        |

### Files to Modify

| File                                        | Changes                                              | Est. Lines |
| ------------------------------------------- | ---------------------------------------------------- | ---------- |
| `README.md`                                 | Add OpenAI setup instructions, environment variables | ~30        |
| `.env.example`                              | Add OPENAI_API_KEY template                          | ~5         |
| `src/contexts/OpenAIVoiceContext.tsx`       | Bug fixes from testing (if needed)                   | ~20        |
| `src/components/voice/OpenAIVoicePanel.tsx` | Bug fixes from testing (if needed)                   | ~15        |
| `.spec_system/CONSIDERATIONS.md`            | Phase 01 lessons learned via /carryforward           | ~40        |
| `.spec_system/state.json`                   | Mark phase01-session04 complete, Phase 01 complete   | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] OpenAI voice conversation works end-to-end in Chrome
- [ ] OpenAI voice conversation works end-to-end in Firefox
- [ ] OpenAI voice conversation works end-to-end in Safari
- [ ] Mobile layout displays correctly and touch targets are accessible
- [ ] Tab switching between providers works without errors or resource leaks
- [ ] Error states display correctly with actionable messages
- [ ] Keyboard navigation works (Tab, Arrow keys, Enter/Space)

### Testing Requirements

- [ ] `npm run test:run` - All tests pass
- [ ] `npm run lint` - No new errors (warnings acceptable per MVP config)
- [ ] `npm run build` - Production build succeeds without errors
- [ ] Manual browser testing completed and documented

### Quality Gates

- [ ] All files ASCII-encoded (no unicode issues)
- [ ] Unix LF line endings
- [ ] Code follows CONVENTIONS.md patterns
- [ ] No API keys exposed in client code
- [ ] CONSIDERATIONS.md updated with Phase 01 lessons

---

## 8. Implementation Notes

### Key Considerations

- Safari requires AudioContext resume on user gesture - verify this works
- Token expiration is 1 minute for OpenAI ephemeral tokens - test reconnection
- Base64 audio has ~33% overhead but is acceptable for real-time voice
- Single active connection policy - verify disconnect on tab switch

### Potential Challenges

- **Safari AudioContext**: May require additional testing with real devices
- **Mobile browser audio**: Some browsers have audio playback restrictions
- **WebSocket edge cases**: Network flakiness during conversation
- **Cross-browser differences**: Subtle API behavior variations

### Relevant Considerations

- [P00] **Safari audio without user gesture**: AudioContext must be resumed on user click - explicitly test this in Safari
- [P00] **HTTPS Required**: Document that microphone access requires HTTPS in production
- [P00] **Single Connection at a Time**: Verify disconnect when switching tabs to prevent resource conflicts
- [P01] **OpenAI Realtime API**: Verify all voice options work if time permits (alloy, ash, ballad, coral, echo, sage, shimmer, verse)
- [P01] **~80% Code Reuse**: Validate that xAI patterns translated correctly to OpenAI

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Verify existing tests still pass after any bug fixes
- Add tests for any new utility functions created during bug fixing

### Integration Tests

- OpenAI context initialization
- WebSocket connection state transitions
- Audio playback queue behavior

### Manual Testing

- Complete voice conversation flow in each browser
- Test connection/disconnection cycle multiple times
- Verify error messages display correctly
- Test on mobile viewport sizes
- Test with slow network simulation

### Edge Cases

- Network disconnection mid-conversation
- Token expiration during active session
- Rapid tab switching between providers
- Browser tab backgrounding during conversation
- AudioContext suspension/resume cycles

---

## 10. Dependencies

### External Libraries

- `@elevenlabs/react`: v0.12.1 (existing)
- `vitest`: ^3.2.1 (existing)
- `@testing-library/react`: ^16.3.0 (existing)

### Other Sessions

- **Depends on**: phase01-session01-openai-research, phase01-session02-openai-backend, phase01-session03-openai-frontend
- **Depended by**: Phase 02 sessions (function calling, voice selection, conversation history)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
