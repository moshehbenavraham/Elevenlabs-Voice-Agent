# Session 04: Polish & Testing

| Field | Value |
|-------|-------|
| **Session ID** | phase00-session04-polish |
| **Phase** | 00 - Multi-Provider Voice |
| **Status** | Not Started |
| **Estimated Duration** | 2-3 hours |
| **Estimated Tasks** | 20-25 |

---

## Objective

Polish the multi-provider voice agent implementation with smooth animations, improved error states, mobile responsiveness, and comprehensive testing to ensure production readiness.

---

## Prerequisites

- [x] Session 01 completed (foundation)
- [x] Session 02 completed (xAI backend)
- [x] Session 03 completed (xAI frontend)

---

## Key Deliverables

### 1. UI/UX Refinements
- Tab transition animations (Framer Motion)
- "Not configured" state for missing API keys
- Connection status indicators on tabs
- Loading states during connection

### 2. Mobile Responsiveness
- Horizontally scrollable tabs on mobile
- Touch-friendly tab targets (min 44px)
- Active tab indicator animation
- Responsive breakpoints (375px, 768px, 1024px)

### 3. Accessibility
- Full keyboard navigation (Tab, Arrow keys, Enter)
- ARIA labels and roles
- Focus management on tab switch
- Reduced motion support

### 4. Testing
- Unit tests for all new contexts
- Component tests for tabs
- Integration tests for provider switching
- E2E tests for full conversation flow

### 5. Documentation
- Update README with multi-provider setup
- Document environment variables
- Add troubleshooting guide

---

## Scope

### In Scope (MVP)
- Framer Motion tab animations
- "Setup Required" empty states
- Mobile tab scrolling
- Keyboard accessibility
- Core test coverage
- README updates

### Out of Scope
- Provider-specific configuration modals
- Swipe gestures for tab switching
- E2E test automation (manual is sufficient)
- Performance profiling

---

## Technical Approach

### Tab Animations
```typescript
// Framer Motion variants
const tabVariants = {
  inactive: { opacity: 0.7, scale: 1 },
  active: { opacity: 1, scale: 1.02 },
};

const contentVariants = {
  enter: { opacity: 0, x: 10 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};
```

### Not Configured State
```tsx
{!isConfigured && (
  <div className="text-center p-8">
    <AlertCircle className="w-12 h-12 mx-auto text-yellow-500" />
    <h3>Setup Required</h3>
    <p>Add XAI_API_KEY to your environment</p>
  </div>
)}
```

### Accessibility
```tsx
<div
  role="tablist"
  aria-label="Voice Agent Providers"
  onKeyDown={handleKeyNavigation}
>
  <button
    role="tab"
    aria-selected={isActive}
    aria-controls={`panel-${provider}`}
    tabIndex={isActive ? 0 : -1}
  />
</div>
```

---

## Dependencies

### Internal
- Sessions 01-03 completed
- Framer Motion (already installed)
- shadcn/ui components

### External
- None

---

## Success Criteria

1. Tab animations smooth and performant
2. Mobile layout works at 375px width
3. Keyboard navigation fully functional
4. All tests pass
5. Lint passes with zero warnings
6. README accurately documents setup

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/tabs/ProviderTabs.tsx` | MODIFY | Add animations |
| `src/components/tabs/ProviderTab.tsx` | MODIFY | Add a11y attributes |
| `src/components/providers/XAIProvider.tsx` | MODIFY | Add empty state |
| `src/components/providers/ElevenLabsProvider.tsx` | MODIFY | Add empty state |
| `src/test/tabs.test.tsx` | CREATE | Tab component tests |
| `src/test/providers.test.tsx` | CREATE | Provider context tests |
| `README.md` | MODIFY | Update documentation |

---

## Testing Strategy

- Jest/Vitest for unit tests
- React Testing Library for components
- Manual accessibility testing with screen reader
- Mobile testing with browser DevTools
- Cross-browser verification
