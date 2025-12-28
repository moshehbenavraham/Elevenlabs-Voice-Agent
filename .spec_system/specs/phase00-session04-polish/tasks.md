# Task Checklist

**Session ID**: `phase00-session04-polish`
**Total Tasks**: 23
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-28
**Completed**: 2025-12-28

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0004]` = Session reference (Phase 00, Session 04)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 9      | 9      | 0         |
| Testing        | 5      | 5      | 0         |
| Documentation  | 1      | 1      | 0         |
| **Total**      | **23** | **23** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0004] Verify prerequisites - confirm Framer Motion, Vitest, and RTL are installed
- [x] T002 [S0004] Run existing tests to confirm baseline passes (`npm run test:run`)
- [x] T003 [S0004] Audit current tab components for structure and identify injection points

---

## Foundation (5 tasks)

Core animation variants and accessibility utilities.

- [x] T004 [S0004] Define Framer Motion tab variants (inactive/active states) in ProviderTab.tsx
- [x] T005 [S0004] Define Framer Motion content transition variants (enter/center/exit) in ProviderTabs.tsx
- [x] T006 [S0004] Create EmptyState component for "Setup Required" UI (`src/components/ui/EmptyState.tsx`)
- [x] T007 [S0004] [P] Add keyboard navigation handler utility for roving tabindex pattern (Radix built-in)
- [x] T008 [S0004] [P] Create reduced motion detection hook using useAccessibility or new hook

---

## Implementation (9 tasks)

Main feature implementation.

- [x] T009 [S0004] Implement tab animation with motion wrapper in ProviderTab.tsx (`src/components/tabs/ProviderTab.tsx`)
- [x] T010 [S0004] Add ARIA tablist/tab roles and aria-selected to ProviderTabs.tsx (Radix built-in)
- [x] T011 [S0004] Implement keyboard navigation (Arrow keys, Enter, Space) in ProviderTabs.tsx (Radix built-in)
- [x] T012 [S0004] Add AnimatePresence and content transitions in ProviderTabs.tsx
- [x] T013 [S0004] Implement mobile responsive scrollable tabs with Tailwind utilities (`src/components/tabs/ProviderTabs.tsx`)
- [x] T014 [S0004] Ensure touch targets meet 44px minimum dimension in ProviderTab.tsx
- [x] T015 [S0004] [P] Add "Setup Required" empty state to XAIProvider.tsx (`src/components/providers/XAIProvider.tsx`)
- [x] T016 [S0004] [P] Add "Setup Required" empty state to ElevenLabsProvider.tsx (`src/components/providers/ElevenLabsProvider.tsx`)
- [x] T017 [S0004] Add reduced motion support to all animations (prefers-reduced-motion)

---

## Testing (5 tasks)

Verification and quality assurance.

- [x] T018 [S0004] [P] Create unit tests for XAIVoiceContext (`src/test/providers.test.tsx`)
- [x] T019 [S0004] [P] Create unit tests for VoiceContext (`src/test/providers.test.tsx`)
- [x] T020 [S0004] Create component tests for ProviderTabs and ProviderTab (`src/test/ProviderTabs.test.tsx`)
- [x] T021 [S0004] Add keyboard navigation tests to ProviderTabs.test.tsx
- [x] T022 [S0004] Run full test suite, lint, and build - fix any issues

---

## Documentation (1 task)

- [x] T023 [S0004] Update README.md with multi-provider setup instructions

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing (`npm run test:run`) - 75 tests passing
- [x] All files ASCII-encoded (0-127)
- [x] `npm run lint` passes (0 errors in src/)
- [x] `npm run build` completes successfully
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks marked `[P]` can be worked on simultaneously:

- T007 & T008: Keyboard handler and reduced motion hook are independent
- T015 & T016: Provider empty states are independent components
- T018 & T019: Context unit tests are independent

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T004-T005 must complete before T009-T012 (variants needed for animations)
- T006 must complete before T015-T016 (EmptyState component used by providers)
- T009-T017 should complete before T18-T21 (implementation before testing)

### Key Technical Notes

- Use `motion.div` wrapper for tab animations
- Keep animation durations between 150-250ms for snappy feel
- Use Tailwind's `focus-visible:` for keyboard focus rings
- Check `prefers-reduced-motion` media query for accessibility

---

## Next Steps

Run `/implement` to begin AI-led implementation.
