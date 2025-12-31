# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-31
**Project State**: Phase 05 - Vapi Voice Agent
**Completed Sessions**: 25 (3 in current phase)

---

## Recommended Next Session

**Session ID**: `phase05-session04-validation-polish`
**Session Name**: Testing, Polish & Documentation
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 15-20

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 5.1: Dependencies & CSP Configuration - Vapi SDK installed, CSP configured
- [x] Session 5.2: Voice Hook & SDK Singleton - `useVapiVoice` hook and `vapi.ts` singleton created
- [x] Session 5.3: Provider Tab Integration - VapiProvider component with tab system integration

### Dependencies

- **Builds on**: phase05-session03-provider-tab (Vapi UI components)
- **Enables**: Phase 05 completion, Phase 06 (Retell Voice Agent)

### Project Progression

This is the final session of Phase 05, following the established pattern of previous phases where session04 focuses on validation, testing, and polish. With the core Vapi integration complete (dependencies, hook, provider), this session ensures production readiness through comprehensive testing, error handling improvements, and documentation updates.

---

## Session Overview

### Objective

Complete Vapi Voice Agent integration with comprehensive tests, function calling support, UI polish, and documentation updates.

### Key Deliverables

1. Unit tests for `useVapiVoice` hook and VapiProvider component
2. Integration tests for Vapi tab switching behavior
3. Function calling support via CreateAssistantDTO configuration
4. Vapi section in ConfigurationModal
5. Documentation updates (CLAUDE.md, README, CONSIDERATIONS.md)

### Scope Summary

- **In Scope (MVP)**:
  - Unit tests (hook, components)
  - Integration tests (tab switching)
  - Function definitions in assistant config
  - VapiFunctionCallResult display component
  - ConfigurationModal Vapi section
  - CLAUDE.md and README updates
  - Mobile responsive verification
  - Error message polish

- **Out of Scope**:
  - E2E tests with real Vapi API (mocked tests only)
  - Advanced Vapi features (custom voices, webhooks)
  - Voice selection UI (Vapi handles voice via assistant config)

---

## Technical Considerations

### Technologies/Patterns

- Vitest + React Testing Library for testing
- Mock `@vapi-ai/web` SDK for unit tests
- `CreateAssistantDTO` type for function definitions
- Existing `FunctionCallIndicator` pattern for result display

### Potential Challenges

- Mocking Vapi SDK event system for tests
- TypeScript types for Vapi function definitions
- Ensuring CSP doesn't block test environment

### Relevant Considerations

- [P02] **act() warnings in keyboard tests**: May need waitFor wrappers for Vapi provider tests
- [P00] **react-refresh/only-export-components warnings**: VapiProvider may trigger this pattern
- [P02] **Function timeout protection**: Apply same 5-second timeout pattern if adding client-side function execution

---

## Alternative Sessions

If this session is blocked:

1. **phase06-session01-retell-research** - Begin Retell Voice Agent research if Phase 06 PRD is ready
2. **Return to Phase 04 polish** - Address any Ultravox integration issues discovered during Vapi work

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
