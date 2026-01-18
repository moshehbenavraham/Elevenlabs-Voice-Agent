# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2026-01-18
**Project State**: Phase 00 - Gemini Live Integration
**Completed Sessions**: 3 of 5

---

## Recommended Next Session

**Session ID**: `phase00-session04-provider-component`
**Session Name**: Provider Component & UI
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: ~14

---

## Why This Session Next?

### Prerequisites Met

- [x] Session 01 completed - Dependencies & Audio Infrastructure
- [x] Session 02 completed - GenAI Client & Backend
- [x] Session 03 completed - Voice Hook & Context (useGeminiVoice, GeminiVoiceContext)
- [x] Existing UI components available (VoiceButton, VoiceStatus, VoiceVisualizer, ConversationPanel)

### Dependencies

- **Builds on**: Session 03 (useGeminiVoice hook, GeminiVoiceContext)
- **Enables**: Session 05 (Testing & Polish)

### Project Progression

Session 04 is the natural next step in the Gemini Live Integration phase. With the backend token endpoint (Session 02), audio pipeline (Session 01), and core hook/context (Session 03) complete, the integration now needs its UI layer. This session creates the user-facing GeminiProvider component that ties all the infrastructure together into a functional tab interface.

---

## Session Overview

### Objective

Create the GeminiProvider component with full UI integration, including voice selector, conversation panel, function call indicator, and integration with the tab system.

### Key Deliverables

1. `src/components/providers/GeminiProvider.tsx` - Main provider component
2. `src/components/providers/GeminiEmptyState.tsx` - Initial state UI
3. Updated `src/components/tabs/ProviderTabs.tsx` with Gemini tab
4. Updated `src/contexts/ProviderContext.tsx` with 'gemini' provider
5. Voice selector integration with 30 HD voice options

### Scope Summary

- **In Scope (MVP)**: GeminiProvider component, tab integration, voice selector with 30 HD voices, session timer display (12+/14+/15 min warnings), FunctionCallIndicator integration, ARIA accessibility, responsive design
- **Out of Scope**: E2E tests (Session 05), additional tool implementations

---

## Technical Considerations

### Technologies/Patterns

- React Context + custom hooks pattern (established in Sessions 02-03)
- Existing component composition (VoiceButton, VoiceStatus, VoiceVisualizer, ConversationPanel)
- localStorage for voice selection persistence
- VITE_GEMINI_ENABLED environment variable toggle

### Potential Challenges

- Voice selector dropdown with 30 options needs good UX (search/filter may help)
- Session timer display must integrate cleanly with VoiceStatus
- Ensuring consistent styling with existing provider components

### Relevant Considerations

- [P00] **Provider Pattern**: Must follow Context + Hook + Provider component architecture
- [P00] **Tab System**: Must integrate with ProviderTabs.tsx and ProviderContext.tsx
- [P00] **Component composition**: Reuse VoiceButton, VoiceStatus, VoiceVisualizer across providers
- [P00] **Environment variable toggles**: VITE_GEMINI_ENABLED controls provider visibility

---

## Alternative Sessions

If this session is blocked:

1. **phase00-session05-testing-polish** - Could start writing tests for Sessions 01-03 components, but would need to revisit after Session 04 for full coverage

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
