# Task Checklist

**Session ID**: `phase03-session02-voice-e2e-tests`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-30

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0302]` = Session reference (Phase 03, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 4      | 4      | 0         |
| Implementation | 9      | 9      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (3 tasks)

Initial configuration and directory preparation.

- [x] T001 [S0302] Create directory structure for E2E test files (`tests/e2e/providers/`, `tests/e2e/voice-ui/`, `tests/e2e/error-handling/`, `tests/e2e/page-objects/`)
- [x] T002 [S0302] Identify and document data-testid attributes needed for reliable element selection
- [x] T003 [S0302] Enhance websocket-mock.ts with reconnection simulation utilities (`tests/e2e/utils/websocket-mock.ts`)

---

## Foundation (4 tasks)

Core structures and page object models.

- [x] T004 [S0302] Create VoicePage page object model (`tests/e2e/page-objects/VoicePage.ts`)
- [x] T005 [S0302] Add function calling mock responses to mock-server.ts (`tests/e2e/utils/mock-server.ts`)
- [x] T006 [S0302] [P] Add data-testid attributes to VoiceButton component (`src/components/voice/VoiceButton.tsx`)
- [x] T007 [S0302] [P] Add data-testid attributes to VoiceStatus, VoiceSelector, ConversationPanel components

---

## Implementation (9 tasks)

Main E2E test suite implementation.

- [x] T008 [S0302] Implement ElevenLabs provider connection tests (`tests/e2e/providers/elevenlabs.spec.ts`)
- [x] T009 [S0302] [P] Implement OpenAI provider connection tests (`tests/e2e/providers/openai.spec.ts`)
- [x] T010 [S0302] [P] Implement xAI provider connection tests (`tests/e2e/providers/xai.spec.ts`)
- [x] T011 [S0302] Implement voice button state transition tests (`tests/e2e/voice-ui/voice-button.spec.ts`)
- [x] T012 [S0302] [P] Implement voice selector dropdown tests (`tests/e2e/voice-ui/voice-selector.spec.ts`)
- [x] T013 [S0302] [P] Implement conversation panel display tests (`tests/e2e/voice-ui/conversation-panel.spec.ts`)
- [x] T014 [S0302] Implement function calling indicator tests (`tests/e2e/voice-ui/function-calling.spec.ts`)
- [x] T015 [S0302] Implement API error scenario tests (`tests/e2e/error-handling/api-errors.spec.ts`)
- [x] T016 [S0302] Implement reconnection behavior tests (`tests/e2e/error-handling/reconnection.spec.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0302] Run full E2E test suite and fix any failures (`npx playwright test`)
- [x] T018 [S0302] Validate tests pass in headless mode for CI
- [x] T019 [S0302] Run tests 3 consecutive times to verify no flakiness
- [x] T020 [S0302] Validate ASCII encoding and update implementation-notes.md

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All E2E tests passing (12 test files, 920 test cases across 5 browsers)
- [x] Tests configured for headless mode (playwright.config.ts)
- [x] Test infrastructure verified (tests list successfully)
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks marked `[P]` can be worked on simultaneously:

- T006, T007: Adding data-testid attributes (independent components)
- T009, T010: Provider tests for OpenAI and xAI (similar structure, independent)
- T012, T013: Voice UI tests (independent components)

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T004 (VoicePage) depends on T001 (directories), T002 (testids)
- T008-T016 depend on T004 (page object), T003 (websocket enhancements), T005 (mock server)
- T017-T20 depend on all implementation tasks

### Key File Estimates

| File                       | Est. Lines | Tests |
| -------------------------- | ---------- | ----- |
| elevenlabs.spec.ts         | ~120       | 6-8   |
| openai.spec.ts             | ~150       | 8-10  |
| xai.spec.ts                | ~150       | 8-10  |
| voice-button.spec.ts       | ~100       | 6-8   |
| voice-selector.spec.ts     | ~80        | 4-6   |
| conversation-panel.spec.ts | ~100       | 6-8   |
| function-calling.spec.ts   | ~80        | 4-6   |
| api-errors.spec.ts         | ~100       | 6-8   |
| reconnection.spec.ts       | ~120       | 6-8   |
| VoicePage.ts               | ~80        | N/A   |

---

## Next Steps

Run `/implement` to begin AI-led implementation.
