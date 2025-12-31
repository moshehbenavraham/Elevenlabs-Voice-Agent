# Task Checklist

**Session ID**: `phase05-session04-validation-polish`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-31

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0504]` = Session reference (Phase 05, Session 04)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 4      | 4      | 0         |
| Implementation | 10     | 10     | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0504] Verify prerequisites met - confirm Vapi SDK installed, env vars present, backend endpoint working
- [x] T002 [S0504] Review existing test patterns in `src/test/` to ensure consistency with UltravoxVoiceContext.test.tsx

---

## Foundation (4 tasks)

Core structures and test infrastructure.

- [x] T003 [S0504] Add Vapi SDK mock to `src/test/setup.ts` following Ultravox pattern (vapiMocks, MockVapi class)
- [x] T004 [S0504] [P] Create VapiTool interface in `src/lib/tools/toolDefinitions.ts` for Vapi function format
- [x] T005 [S0504] [P] Implement getVapiTools() transformer function in `src/lib/tools/toolDefinitions.ts`
- [x] T006 [S0504] Create Vapi types for test utilities (VapiTestUtils) matching existing patterns

---

## Implementation (10 tasks)

Main feature implementation - tests and documentation.

### Hook Tests (`src/test/useVapiVoice.test.ts`)

- [x] T007 [S0504] Create `useVapiVoice.test.ts` with test file structure and imports
- [x] T008 [S0504] Implement initial state tests (callStatus, isSpeechActive, messages, error, audioLevel)
- [x] T009 [S0504] Implement connection tests (start(), stop(), toggleCall())
- [x] T010 [S0504] Implement event handling tests (call-start, call-end, speech-start, speech-end, volume-level, message, error)
- [x] T011 [S0504] Implement transcript tests (partial vs final, activeTranscript typing indicator)
- [x] T012 [S0504] Implement cleanup and edge case tests (unmount cleanup, duplicate connect prevention)

### Component Tests (`src/test/VapiProvider.test.tsx`)

- [x] T013 [S0504] Create `VapiProvider.test.tsx` with component test structure and imports
- [x] T014 [S0504] Implement VapiButton component tests (rendering, state transitions, click handlers)
- [x] T015 [S0504] Implement VapiVoiceStatus and VapiEmptyState component tests

### Documentation

- [x] T016 [S0504] [P] Update `CLAUDE.md` with Vapi integration section (env vars, architecture, key points)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0504] Run full test suite and verify all tests passing (`npm run test:run`)
- [x] T018 [S0504] Run lint and build to verify no errors (`npm run lint && npm run build`)
- [x] T019 [S0504] Validate ASCII encoding on all modified/created files
- [x] T020 [S0504] Manual verification - test Vapi tab on desktop and mobile, verify responsive behavior

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All unit tests passing (263 tests total)
- [x] Build passes without warnings
- [x] Lint passes (warnings only, no errors)
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks marked `[P]` can be worked on simultaneously:

- T004, T005, T006 (Foundation: types and utilities)
- T016 (Documentation can proceed independently)

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003 must complete before T007-T015 (tests need mocks)
- T004-T005 complete before T010 (function calling tests)
- T007-T015 complete before T017 (test suite run)

### Test File Locations

- Hook tests: `src/test/useVapiVoice.test.ts`
- Component tests: `src/test/VapiProvider.test.tsx`

### Mock Pattern Reference

Follow `ultravoxMocks` pattern in `setup.ts`:

```typescript
export const vapiMocks = {
  start: vi.fn(),
  stop: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};
```

### Vapi Function Format

Vapi uses `CreateAssistantDTO.model.functions` array with OpenAI-compatible format:

```typescript
interface VapiFunction {
  name: string;
  description: string;
  parameters: { type: 'object'; properties: {}; required: [] };
}
```

---

## Next Steps

Run `/implement` to begin AI-led implementation.
