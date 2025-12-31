# Session 04: Testing, Polish & Documentation

**Session ID**: `phase06-session04-testing-polish`
**Status**: Not Started
**Estimated Tasks**: ~15-20
**Estimated Duration**: 3-4 hours

---

## Objective

Add comprehensive tests for hook and components, handle optional metadata/audio events for enhanced functionality, and complete documentation for Phase 06.

---

## Scope

### In Scope (MVP)

- Create `src/test/useRetellVoice.test.ts` with unit tests
- Create `src/test/RetellProvider.test.tsx` with component tests
- Add integration tests for tab switching with Retell
- Handle `metadata` event for agent-to-frontend communication (optional enhancement)
- Handle `audio` event for raw audio visualization (optional enhancement)
- Mobile responsive testing
- Error handling polish (user-friendly messages)
- Update CLAUDE.md with Retell documentation
- Update README with Retell setup instructions
- Update .env.example with complete Retell configuration

### Out of Scope

- E2E Playwright tests (existing infrastructure covers basic flows)
- Performance optimization (not needed for MVP)

---

## Prerequisites

- [ ] Sessions 01-03 completed
- [ ] Retell provider tab functional
- [ ] Backend endpoint working

---

## Deliverables

1. `src/test/useRetellVoice.test.ts` - Hook unit tests
2. `src/test/RetellProvider.test.tsx` - Component tests
3. Updated CLAUDE.md with Retell section
4. Updated README with Retell setup instructions
5. Enhanced error messages (user-friendly)
6. Optional: `metadata` event handling
7. Optional: `audio` event handling for visualization

---

## Success Criteria

- [ ] All new tests pass (unit + integration)
- [ ] Existing tests still pass (no regressions)
- [ ] Build succeeds with no errors
- [ ] Lint passes with no new warnings
- [ ] Metadata events handled (if used by agent)
- [ ] Audio events handled for visualization (optional)
- [ ] Mobile UI works correctly
- [ ] Error messages are user-friendly
- [ ] CLAUDE.md updated with Retell documentation
- [ ] README updated with Retell setup instructions
- [ ] Phase 06 marked complete in state.json
