# Session 05: Testing & Polish

**Session ID**: `phase00-session05-testing-polish`
**Status**: Not Started
**Estimated Tasks**: ~12
**Estimated Duration**: 2-4 hours

---

## Objective

Add comprehensive tests for all Gemini components, update CLAUDE.md documentation, and ensure the implementation passes all quality gates.

---

## Scope

### In Scope (MVP)

- E2E tests for Gemini voice flow (Playwright)
- Unit tests for GeminiProvider component
- Unit tests for GeminiEmptyState component
- Integration tests for full connection flow
- Mock setup for Gemini WebSocket in tests
- Update CLAUDE.md with Gemini integration documentation
- Update .env.example with complete variable descriptions
- Verify TypeScript compilation with no errors
- Verify ESLint passes with no warnings
- Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Test AudioWorklet behavior in Safari
- Final code review and cleanup

### Out of Scope

- Performance optimization beyond baseline
- Advanced features (session resumption improvements, thinking mode visualization)

---

## Prerequisites

- [ ] Session 04 completed (GeminiProvider, UI integration)
- [ ] All components implemented and functional

---

## Deliverables

1. `tests/e2e/gemini-voice-flow.spec.ts` - E2E test suite
2. `src/test/GeminiProvider.test.tsx` - Component tests
3. `src/test/useGeminiVoice.test.ts` - Hook tests
4. Updated CLAUDE.md with Gemini section
5. Updated .env.example with Gemini variables
6. Cross-browser compatibility verification report

---

## Success Criteria

- [ ] E2E tests pass for Gemini voice flow
- [ ] Unit tests pass for GeminiProvider
- [ ] Unit tests pass for GeminiEmptyState
- [ ] Unit tests pass for useGeminiVoice hook
- [ ] Unit tests pass for GenAILiveClient
- [ ] Unit tests pass for audio utilities
- [ ] Integration tests pass for token endpoint
- [ ] CLAUDE.md documents Gemini integration points
- [ ] CLAUDE.md documents environment variables
- [ ] CLAUDE.md documents architecture decisions
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] Chrome browser works correctly
- [ ] Firefox browser works correctly
- [ ] Safari browser works correctly (verify AudioWorklet)
- [ ] Edge browser works correctly
- [ ] All phase success criteria from PRD_phase_00.md verified
