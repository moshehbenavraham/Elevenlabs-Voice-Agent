# Session Specification

**Session ID**: `phase00-session01-foundation`
**Phase**: 00 - Multi-Provider Voice
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session establishes the foundational architecture for transforming the single-provider ElevenLabs voice agent into a multi-provider system capable of supporting ElevenLabs, xAI, and future voice providers. The core deliverables are TypeScript interfaces for provider abstraction, a tab-based navigation system with glassmorphism styling, and the ProviderContext for active provider state management.

This foundation is critical because all subsequent sessions depend on these TypeScript interfaces and components. The tab system provides the user-facing mechanism for switching between providers, while the type definitions ensure type-safe integration of any future providers. The architecture follows established patterns from the existing codebase (ThemeContext, existing component structure) to maintain consistency.

By the end of this session, users will see a tabbed interface above the voice controls, with ElevenLabs as the default (and initially only active) provider. The existing ElevenLabs voice functionality will remain unchanged, wrapped within the new tab structure ready for additional providers.

---

## 2. Objectives

1. Define TypeScript interfaces (`VoiceProvider`, `VoiceProviderState`, `ProviderType`) that abstract voice provider functionality for type-safe multi-provider support
2. Implement `ProviderTabs` and `ProviderTab` components with glassmorphism styling, keyboard accessibility, and proper tab states (default, active, hover, disabled)
3. Create `ProviderContext` following the established ThemeContext pattern with localStorage persistence for selected tab
4. Integrate the tab system into `Index.tsx` while preserving all existing ElevenLabs voice functionality

---

## 3. Prerequisites

### Required Sessions
- [x] Initial project setup - ElevenLabs integration, shadcn/ui, Tailwind configured

### Required Tools/Knowledge
- TypeScript interface design patterns
- React Context API
- Radix UI Tabs primitive (available in shadcn/ui)
- Tailwind CSS glassmorphism utilities

### Environment Requirements
- Node.js with npm
- Existing `.env` with `VITE_ELEVENLABS_AGENT_ID` configured
- Development server running on port 8082

---

## 4. Scope

### In Scope (MVP)
- TypeScript interfaces for provider abstraction (`ProviderType`, `VoiceProviderState`, `VoiceProvider`)
- Tab container component with glassmorphism styling
- Individual tab component with all states (default, active, hover, disabled)
- Provider context with active tab selection state
- localStorage persistence for selected tab
- Keyboard accessibility (Tab, Arrow keys, Enter)
- ElevenLabs as default and only active provider
- Barrel exports for new modules

### Out of Scope (Deferred)
- xAI provider integration - *Reason: Requires backend setup (Session 02-03)*
- Backend API changes - *Reason: Session 02 scope*
- Provider-specific configuration modals - *Reason: Future enhancement*
- Tab transition animations - *Reason: Session 04 (polish)*
- Mobile swipe gestures - *Reason: Future enhancement*

---

## 5. Technical Approach

### Architecture

The provider abstraction layer uses TypeScript interfaces to define a contract that all voice providers must implement. This enables type-safe switching between providers while keeping provider-specific logic isolated.

```
ProviderContext (manages active tab)
    |
    v
ProviderTabs (container with styling)
    |
    +-- ProviderTab (ElevenLabs) --> VoiceContext (existing)
    +-- ProviderTab (xAI) --> XAIVoiceContext (future)
    +-- ProviderTab (OpenAI) --> OpenAIVoiceContext (future)
```

### Design Patterns
- **Context Provider Pattern**: Following ThemeContext for ProviderContext implementation
- **Compound Components**: ProviderTabs contains ProviderTab children for flexible composition
- **Interface Segregation**: Separate `VoiceProviderState` and `VoiceProviderActions` interfaces

### Technology Stack
- React 18.3.1 with TypeScript
- Radix UI Tabs primitive (via shadcn/ui)
- Tailwind CSS with glassmorphism utilities
- localStorage for state persistence

---

## 6. Deliverables

### Files to Create
| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/types/voice-provider.ts` | Provider interface definitions (ProviderType, VoiceProviderState, VoiceProvider) | ~40 |
| `src/contexts/ProviderContext.tsx` | Active provider state context with localStorage persistence | ~80 |
| `src/components/tabs/ProviderTabs.tsx` | Tab container with glassmorphism styling | ~60 |
| `src/components/tabs/ProviderTab.tsx` | Individual tab component with states | ~50 |
| `src/components/tabs/index.ts` | Barrel export for tab components | ~5 |

### Files to Modify
| File | Changes | Est. Lines |
|------|---------|------------|
| `src/pages/Index.tsx` | Wrap voice content with ProviderTabs, add tab switching logic | ~30 |
| `src/types/index.ts` | Export voice-provider types (create if not exists) | ~5 |

---

## 7. Success Criteria

### Functional Requirements
- [ ] Provider types compile without TypeScript errors
- [ ] Tab components render with correct glassmorphism styling
- [ ] Tab selection state persists across page refreshes via localStorage
- [ ] Keyboard navigation works (Tab to focus, Arrow keys to switch, Enter to select)
- [ ] ElevenLabs voice functionality remains unchanged
- [ ] Disabled tabs (xAI, OpenAI) appear visually distinct and are not selectable

### Testing Requirements
- [ ] Unit tests for ProviderContext hook
- [ ] Component tests for tab rendering and selection
- [ ] Manual testing of keyboard navigation
- [ ] Visual verification of glassmorphism styling

### Quality Gates
- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] `npm run lint` passes with no errors
- [ ] `npm run test:run` passes
- [ ] Code follows project conventions (CONVENTIONS.md)

---

## 8. Implementation Notes

### Key Considerations
- Follow existing ThemeContext pattern exactly for consistency
- Use `function` components over arrow functions for top-level components (per CONVENTIONS.md)
- Keep nesting shallow - tabs/ProviderTabs.tsx is acceptable depth
- Respect `prefers-reduced-motion` even for hover states

### Potential Challenges
- **Tab switching with active connection**: Must disconnect active voice connection before switching. Mitigation: Check connection status in tab switch handler and call disconnect if needed.
- **Keyboard accessibility**: Custom styling may interfere with Radix's built-in keyboard handling. Mitigation: Use Radix Tabs primitive as base, layer styling on top.
- **Type flexibility**: Provider interface must be flexible enough for different SDKs. Mitigation: Use minimal interface focused on connection lifecycle, provider-specific details stay in their own contexts.

### Relevant Considerations
- **Separate Contexts per Provider** (Architecture): VoiceContext remains ElevenLabs-specific. This session only adds ProviderContext for tab selection, not provider-specific state.
- **Single Connection at a Time** (Architecture): Tab switching will need disconnect handling before allowing switch. Implement in Index.tsx integration.
- **Glassmorphism design** (What Worked): Use backdrop-blur-lg + bg-white/10 pattern for consistent UI matching existing components.

### ASCII Reminder
All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests
- `ProviderContext`: Test useProvider hook returns correct values
- `ProviderContext`: Test setActiveProvider updates state correctly
- `ProviderContext`: Test localStorage persistence on mount/update

### Integration Tests
- Tab selection updates context and re-renders correctly
- Tab selection persists after simulated page refresh

### Manual Testing
- Verify glassmorphism styling matches design (backdrop blur, transparency)
- Verify tab states: default, hover, active, disabled
- Verify keyboard navigation flow
- Verify ElevenLabs voice still works within tab structure
- Test on Chrome, Firefox, Safari

### Edge Cases
- No localStorage available (private browsing)
- Invalid localStorage value for selected tab
- Rapid tab switching during connection

---

## 10. Dependencies

### External Libraries
- `@radix-ui/react-tabs`: Already installed via shadcn/ui

### Other Sessions
- **Depends on**: None (first session in phase)
- **Depended by**: Session 02 (xAI Backend), Session 03 (xAI Frontend), Session 04 (Polish)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
