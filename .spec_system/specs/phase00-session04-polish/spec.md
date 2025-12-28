# Session Specification

**Session ID**: `phase00-session04-polish`
**Phase**: 00 - Multi-Provider Voice
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This is the final session in Phase 00, transforming a functional multi-provider voice agent MVP into a polished, production-ready application. All core functionality has been implemented across the previous three sessions: the tab-based provider switching system (Session 01), xAI ephemeral token backend (Session 02), and xAI voice agent frontend integration (Session 03).

This session focuses on the production polish layer that distinguishes a working prototype from a professional product. We will add smooth Framer Motion animations for tab transitions, implement "Setup Required" empty states for unconfigured providers, ensure full mobile responsiveness with horizontally scrollable tabs, and achieve WCAG-compliant keyboard accessibility throughout.

The session also establishes a test foundation with unit tests for contexts and component tests for the tab system, ensuring confidence in the codebase as it grows. Documentation updates will make the multi-provider setup clear for developers onboarding to the project.

---

## 2. Objectives

1. Implement smooth, performant tab transition animations using Framer Motion with reduced motion support
2. Create user-friendly "Setup Required" empty states for unconfigured providers (missing API keys)
3. Achieve full mobile responsiveness with horizontally scrollable tabs and touch-friendly targets (min 44px)
4. Implement complete keyboard navigation following ARIA tablist patterns (Tab, Arrow keys, Enter)
5. Establish core test coverage for tab components and provider contexts
6. Update README with comprehensive multi-provider setup documentation

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-foundation` - Tab system, provider abstraction, project structure
- [x] `phase00-session02-xai-backend` - xAI ephemeral token endpoint in server/index.js
- [x] `phase00-session03-xai-frontend` - xAI voice agent UI with WebSocket integration

### Required Tools/Knowledge

- Framer Motion animation patterns (variants, AnimatePresence)
- ARIA tablist/tab accessibility patterns
- React Testing Library best practices
- Tailwind responsive utilities

### Environment Requirements

- Node.js 18+ with npm
- Vitest test runner configured
- Framer Motion already installed

---

## 4. Scope

### In Scope (MVP)

- Framer Motion tab transition animations (opacity, scale, slide)
- Active tab indicator animation
- "Setup Required" empty state for XAI provider (missing XAI_API_KEY)
- "Setup Required" empty state for ElevenLabs provider (missing AGENT_ID)
- Horizontally scrollable tabs on mobile (<768px)
- Touch-friendly tab targets (minimum 44px)
- Responsive breakpoints (375px, 768px, 1024px)
- Full keyboard navigation (Tab, Arrow Left/Right, Enter, Space)
- ARIA labels, roles, and aria-selected attributes
- Focus management on tab switch
- Reduced motion support (prefers-reduced-motion)
- Unit tests for XAIVoiceContext and VoiceContext
- Component tests for ProviderTabs and ProviderTab
- README update with multi-provider setup instructions

### Out of Scope (Deferred)

- Provider-specific configuration modals - _Reason: Adds complexity; env vars sufficient for MVP_
- Swipe gestures for tab switching - _Reason: Nice-to-have; click/tap sufficient_
- E2E test automation with Playwright - _Reason: Manual testing sufficient for Phase 00_
- Performance profiling and optimization - _Reason: No performance issues identified yet_
- Connection status indicators on tabs - _Reason: Deferred to future polish iteration_

---

## 5. Technical Approach

### Architecture

The polish layer enhances existing components without architectural changes. Tab animations wrap existing components with Framer Motion's `motion` primitives. Accessibility attributes are added directly to existing tab elements. Empty states are conditional renders within provider components. Tests use the existing Vitest + React Testing Library setup.

### Design Patterns

- **Framer Motion Variants**: Define reusable animation states for tabs (inactive/active) and content (enter/center/exit)
- **Roving tabindex**: Standard ARIA pattern where only the active tab receives tabIndex={0}
- **Render Props for Empty States**: Consistent pattern for displaying setup requirements across providers
- **Test Isolation**: Mock external APIs (WebSocket, ElevenLabs SDK) to test UI behavior in isolation

### Technology Stack

- React 18.3.1 with TypeScript
- Framer Motion (already installed) for animations
- Tailwind CSS for responsive utilities
- Vitest + React Testing Library for testing
- ARIA tablist pattern for accessibility

---

## 6. Deliverables

### Files to Create

| File                          | Purpose                                          | Est. Lines |
| ----------------------------- | ------------------------------------------------ | ---------- |
| `src/test/tabs.test.tsx`      | Component tests for ProviderTabs and ProviderTab | ~120       |
| `src/test/providers.test.tsx` | Unit tests for voice provider contexts           | ~100       |

### Files to Modify

| File                                              | Changes                                                               | Est. Lines Changed |
| ------------------------------------------------- | --------------------------------------------------------------------- | ------------------ |
| `src/components/tabs/ProviderTabs.tsx`            | Add Framer Motion AnimatePresence, content variants, keyboard handler | ~40                |
| `src/components/tabs/ProviderTab.tsx`             | Add motion wrapper, ARIA attributes, tab variants                     | ~30                |
| `src/components/providers/XAIProvider.tsx`        | Add "Setup Required" empty state conditional                          | ~25                |
| `src/components/providers/ElevenLabsProvider.tsx` | Add "Setup Required" empty state conditional                          | ~25                |
| `README.md`                                       | Multi-provider setup section, env vars documentation                  | ~60                |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Tab animations are smooth with no visible jank or lag
- [ ] Content transitions smoothly when switching tabs
- [ ] "Setup Required" state displays when XAI_API_KEY is missing
- [ ] "Setup Required" state displays when ELEVENLABS_AGENT_ID is missing
- [ ] Tabs are horizontally scrollable on mobile (375px width)
- [ ] Tab touch targets meet 44px minimum dimension
- [ ] Arrow Left/Right keys navigate between tabs
- [ ] Enter/Space activates focused tab
- [ ] Tab key moves focus in/out of tablist correctly
- [ ] Animations respect prefers-reduced-motion setting

### Testing Requirements

- [ ] Unit tests for XAIVoiceContext state management
- [ ] Unit tests for VoiceContext state management
- [ ] Component tests for ProviderTabs rendering
- [ ] Component tests for keyboard navigation
- [ ] All tests pass with `npm run test:run`

### Quality Gates

- [ ] All files ASCII-encoded (0-127)
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run build` completes successfully
- [ ] README accurately describes multi-provider setup

---

## 8. Implementation Notes

### Key Considerations

- Use Framer Motion's `layout` prop sparingly to avoid layout thrashing
- Test animations at 60fps using browser DevTools performance panel
- Ensure focus ring is visible for keyboard users (Tailwind's focus-visible)
- Keep animation durations short (150-250ms) for snappy feel

### Potential Challenges

- **Mobile Safari audio quirks**: May need to test audio initialization flow manually
- **Screen reader testing**: Requires manual verification with VoiceOver/NVDA
- **Tab animation performance**: Complex blur effects may impact mobile performance

### Relevant Considerations

- **[External Dependency]** ElevenLabs SDK v0.12.1: Monitor for breaking changes; empty state should handle SDK errors gracefully
- **[Architecture]** Separate Contexts per Provider: Empty states check provider-specific config, not global state
- **[Lesson Learned]** Glassmorphism design: Maintain backdrop-blur + semi-transparent patterns in empty state UI
- **[Lesson Learned]** Framer Motion already integrated: Leverage existing setup for tab animations

### ASCII Reminder

All output files must use ASCII-only characters (0-127). Avoid smart quotes, em dashes, and non-ASCII symbols.

---

## 9. Testing Strategy

### Unit Tests

- XAIVoiceContext: connection state transitions, error handling, cleanup on unmount
- VoiceContext (ElevenLabs): state management, conversation events
- Configuration detection: isConfigured logic for each provider

### Component Tests

- ProviderTabs: renders all tabs, correct initial selection, tab switching
- ProviderTab: ARIA attributes, active/inactive states, click handling
- Keyboard navigation: arrow keys, enter/space, tab order
- Empty states: render when config missing, don't render when config present

### Manual Testing

- Screen reader navigation (VoiceOver on Mac, NVDA on Windows)
- Mobile Safari audio initialization
- Touch scrolling on mobile devices
- Animation smoothness at various device performance levels
- Reduced motion preference honored

### Edge Cases

- Both providers unconfigured (should show empty states for both)
- Network error during connection (error state, not empty state)
- Rapid tab switching (animations should not stack or glitch)
- Tab switch while audio is playing (should disconnect cleanly)

---

## 10. Dependencies

### External Libraries

- `framer-motion`: ^10.x (already installed)
- `@testing-library/react`: ^14.x (already installed)
- `vitest`: ^1.x (already installed)
- `lucide-react`: ^0.x (already installed, for AlertCircle icon)

### Other Sessions

- **Depends on**: phase00-session01-foundation, phase00-session02-xai-backend, phase00-session03-xai-frontend
- **Depended by**: Phase 01 sessions (this completes Phase 00)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
