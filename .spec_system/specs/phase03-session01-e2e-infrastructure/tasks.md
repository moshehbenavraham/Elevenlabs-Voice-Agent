# Task Checklist

**Session ID**: `phase03-session01-e2e-infrastructure`
**Total Tasks**: 22
**Estimated Duration**: 7-9 hours
**Created**: 2025-12-28

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0301]` = Session reference (Phase 03, Session 01)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 4      | 4      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 9      | 9      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **22** | **22** | **0**     |

---

## Setup (4 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0301] Install Playwright and configure dev dependencies (`package.json`)
- [x] T002 [S0301] Create E2E test directory structure (`tests/e2e/`)
- [x] T003 [S0301] Add Playwright artifacts to gitignore (`.gitignore`)
- [x] T004 [S0301] Create Playwright configuration file (`playwright.config.ts`)

---

## Foundation (5 tasks)

Core mocking utilities and fixtures.

- [x] T005 [S0301] Create audio mock utilities - MediaDevices API (`tests/e2e/utils/audio-mock.ts`)
- [x] T006 [S0301] Add AudioContext and MediaStream mocks to audio utilities (`tests/e2e/utils/audio-mock.ts`)
- [x] T007 [S0301] [P] Create WebSocket mock utilities (`tests/e2e/utils/websocket-mock.ts`)
- [x] T008 [S0301] [P] Create mock server for API endpoint simulation (`tests/e2e/utils/mock-server.ts`)
- [x] T009 [S0301] Create Playwright fixtures with audio mocking (`tests/e2e/fixtures/`)

---

## Implementation (9 tasks)

Smoke tests and CI/CD integration.

- [x] T010 [S0301] Implement app load smoke test - page renders (`tests/e2e/smoke/app-load.spec.ts`)
- [x] T011 [S0301] Add console error detection to app load test (`tests/e2e/smoke/app-load.spec.ts`)
- [x] T012 [S0301] Implement tab navigation smoke test - click navigation (`tests/e2e/smoke/tab-navigation.spec.ts`)
- [x] T013 [S0301] Add keyboard navigation tests - Tab, Arrow keys (`tests/e2e/smoke/tab-navigation.spec.ts`)
- [x] T014 [S0301] Add Enter/Space activation tests (`tests/e2e/smoke/tab-navigation.spec.ts`)
- [x] T015 [S0301] [P] Implement provider render test - ElevenLabs tab (`tests/e2e/smoke/provider-render.spec.ts`)
- [x] T016 [S0301] [P] Add OpenAI provider render assertions (`tests/e2e/smoke/provider-render.spec.ts`)
- [x] T017 [S0301] [P] Add xAI provider render assertions (`tests/e2e/smoke/provider-render.spec.ts`)
- [x] T018 [S0301] Create GitHub Actions E2E workflow (`.github/workflows/e2e.yml`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T019 [S0301] Run Playwright tests locally and verify all passing
- [x] T020 [S0301] Test cross-browser execution (Chromium, Firefox, WebKit)
- [x] T021 [S0301] Validate ASCII encoding and LF line endings on all files
- [x] T022 [S0301] Create E2E testing documentation (`tests/e2e/README.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All Playwright tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks marked `[P]` can be worked on simultaneously:

- T007 + T008: WebSocket and mock server utilities are independent
- T015 + T016 + T017: Provider render tests are independent

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T001-T004 must complete before T005+
- T005-T009 must complete before T010+
- T010-T018 must complete before T019+

### Key Files Created

| Priority | File                                | Purpose                |
| -------- | ----------------------------------- | ---------------------- |
| 1        | `playwright.config.ts`              | Core configuration     |
| 2        | `tests/e2e/utils/audio-mock.ts`     | Audio API mocking      |
| 3        | `tests/e2e/utils/websocket-mock.ts` | WebSocket simulation   |
| 4        | `tests/e2e/utils/mock-server.ts`    | API endpoint mocks     |
| 5        | `tests/e2e/fixtures/`               | Reusable test fixtures |
| 6        | `tests/e2e/smoke/*.spec.ts`         | Three smoke test files |
| 7        | `.github/workflows/e2e.yml`         | CI/CD integration      |

### Critical Considerations

- Audio mocks inject via `page.addInitScript()` before page load
- Mock server simulates ~100ms latency for realism
- Safari AudioContext requires user gesture bypass in mocks
- WebSocket mock supports close codes 1000 and 1006

---

## Next Steps

Run `/implement` to begin AI-led implementation.
