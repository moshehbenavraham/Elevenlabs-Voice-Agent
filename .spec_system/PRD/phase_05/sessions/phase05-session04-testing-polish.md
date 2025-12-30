# Session 04: Testing, Polish & Documentation

**Session ID**: `phase05-session04-testing-polish`
**Status**: Not Started
**Estimated Tasks**: ~22
**Estimated Duration**: 3-4 hours

---

## Objective

Add comprehensive tests for hook and components, implement function calling support via assistant configuration, final UI polish, and update documentation.

---

## Scope

### In Scope (MVP)

- Create `src/test/useVapiVoice.test.ts` with unit tests
- Create `src/test/VapiProvider.test.tsx` with component tests
- Add integration tests for tab switching with Vapi
- Implement function definitions in assistant config
- Create `VapiFunctionCallResult` component (optional, reuse existing)
- Add Vapi configuration to `ConfigurationModal` (basic)
- Mobile responsive testing
- Error handling polish (user-friendly messages)
- Update CLAUDE.md with Vapi documentation
- Update README with Vapi setup instructions

### Out of Scope

- Advanced configuration modal features
- E2E tests (covered in future phases)
- Voice selection (Vapi voice configured in dashboard)

---

## Prerequisites

- [ ] Session 03 completed (provider component working)
- [ ] Test infrastructure from Phase 03 available

---

## Deliverables

1. `src/test/useVapiVoice.test.ts` - Hook tests:
   - Initial state tests
   - Event handling tests
   - Partial transcript tests
   - Error handling tests
   - Cleanup tests
2. `src/test/VapiProvider.test.tsx` - Component tests
3. Function calling in assistant config (demo)
4. Updated `ConfigurationModal` with Vapi settings (optional)
5. Updated `CLAUDE.md` with Vapi section
6. Updated `README.md` with Vapi setup

---

## Success Criteria

- [ ] All tests pass (unit + integration)
- [ ] Function definitions work in assistant config
- [ ] Function call results display in conversation (if implemented)
- [ ] `activeTranscript` shows typing indicator correctly
- [ ] Configuration modal has Vapi settings (if implemented)
- [ ] Mobile UI works correctly
- [ ] Error messages are user-friendly
- [ ] Documentation is complete (CLAUDE.md, README)
- [ ] Build passes without warnings
- [ ] Lint passes
