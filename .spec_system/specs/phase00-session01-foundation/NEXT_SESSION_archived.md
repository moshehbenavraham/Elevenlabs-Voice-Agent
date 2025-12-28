# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 00 - Multi-Provider Voice
**Completed Sessions**: 0

---

## Recommended Next Session

**Session ID**: `phase00-session01-foundation`
**Session Name**: Foundation - Provider Types & Tab System
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 20-25

---

## Why This Session Next?

### Prerequisites Met
- [x] Existing ElevenLabs integration working
- [x] shadcn/ui components available
- [x] Tailwind CSS configured with glassmorphism design system
- [x] React Context pattern established (ThemeContext reference)

### Dependencies
- **Builds on**: Existing ElevenLabs voice implementation
- **Enables**: Sessions 02-04 (xAI integration, polish)

### Project Progression

This is the logical first session because:

1. **Foundation first** - The provider abstraction layer and tab system must exist before any additional providers can be integrated. All subsequent sessions depend on these TypeScript interfaces and components.

2. **Zero external dependencies** - This session is purely frontend work with no backend changes or API key requirements. It can proceed immediately.

3. **Low risk** - No changes to existing ElevenLabs functionality; the tab system wraps the existing implementation.

4. **MVP-focused** - Creates the minimum architecture needed to support multiple providers without over-engineering.

---

## Session Overview

### Objective

Establish the foundational architecture for multi-provider voice agents by creating TypeScript interfaces for provider abstraction, implementing a tab-based navigation system with glassmorphism styling, and setting up the ProviderContext for active provider state management.

### Key Deliverables

1. **Provider Types** - `src/types/voice-provider.ts` with unified `VoiceProvider` interface
2. **Tab Components** - `ProviderTabs.tsx` and `ProviderTab.tsx` with glassmorphism styling
3. **Provider Context** - `ProviderContext.tsx` for active provider state management
4. **Index Integration** - Update `Index.tsx` to use tab-based navigation

### Scope Summary

- **In Scope (MVP)**: TypeScript interfaces, tab components, ProviderContext, localStorage persistence, keyboard accessibility
- **Out of Scope**: xAI integration, backend changes, animations (deferred to Session 04)

---

## Technical Considerations

### Technologies/Patterns
- TypeScript interfaces for type-safe provider abstraction
- React Context pattern (following existing ThemeContext)
- Radix UI Tabs or custom implementation
- Tailwind CSS with glassmorphism styling

### Potential Challenges
- Ensuring tab switching disconnects active voice connections cleanly
- Maintaining keyboard accessibility with custom tab styling
- Balancing flexibility in provider interface without over-abstraction

### Relevant Considerations

From `CONSIDERATIONS.md`:

- **Separate Contexts per Provider**: Architecture decision to keep VoiceContext ElevenLabs-specific and add XAIVoiceContext separately
- **Single Connection at a Time**: Disconnect active provider before switching tabs to manage resources cleanly
- **Glassmorphism Design**: Use backdrop-blur + semi-transparent backgrounds for consistent UI

---

## Alternative Sessions

If this session is blocked:

1. **Session 02: xAI Backend** - Could proceed independently if you only want to set up the backend first, but frontend integration would be incomplete
2. **Session 04: Polish** - Not recommended as it depends on all other sessions

**Note**: Session 01 has no blockers and should proceed immediately.

---

## Next Steps

Run `/sessionspec` to generate the formal specification with task checklist.
