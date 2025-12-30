# Task Checklist

**Session ID**: `phase04-session04-validation-polish`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-30

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0404]` = Session reference (Phase 04, Session 04)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment verification.

- [x] T001 [S0404] Verify all existing 215+ tests pass (`npm run test:run`)
- [x] T002 [S0404] Verify Docker Engine is running and accessible
- [x] T003 [S0404] Review existing Ultravox implementation files from Session 02/03

---

## Foundation (5 tasks)

Docker validation and test file scaffolding.

- [x] T004 [S0404] Build Docker image and verify success (`docker build -t voice-agent .`)
- [x] T005 [S0404] Verify Docker image size is under 200MB target
- [x] T006 [S0404] [P] Create test file scaffold for UltravoxVoiceContext (`src/test/UltravoxVoiceContext.test.tsx`)
- [x] T007 [S0404] [P] Create test file scaffold for UltravoxProvider component (`src/test/UltravoxProvider.test.tsx`)
- [x] T008 [S0404] Set up Ultravox SDK mocks following xAI/OpenAI mock patterns (`src/test/setup.ts`)

---

## Implementation (8 tasks)

Unit tests and documentation updates.

- [x] T009 [S0404] Implement UltravoxVoiceContext tests: connection states (`src/test/UltravoxVoiceContext.test.tsx`)
- [x] T010 [S0404] Implement UltravoxVoiceContext tests: error handling (`src/test/UltravoxVoiceContext.test.tsx`)
- [x] T011 [S0404] Implement UltravoxVoiceContext tests: reconnection behavior (`src/test/UltravoxVoiceContext.test.tsx`)
- [x] T012 [S0404] Implement UltravoxProvider tests: UI rendering and button states (`src/test/UltravoxProvider.test.tsx`)
- [x] T013 [S0404] Implement UltravoxProvider tests: status display and transcript (`src/test/UltravoxProvider.test.tsx`)
- [x] T014 [S0404] [P] Update CLAUDE.md with Ultravox architecture documentation (`CLAUDE.md`)
- [x] T015 [S0404] [P] Update README.md with Ultravox provider and deployment instructions (`README.md`)
- [x] T016 [S0404] [P] Update .env.example with Ultravox environment variables (`.env.example`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0404] Run full test suite and verify all tests passing including new Ultravox tests
- [x] T018 [S0404] Docker runtime testing - start containers and verify health endpoints
- [x] T019 [S0404] Validate ASCII encoding on all modified/created files
- [x] T020 [S0404] Complete provider feature parity matrix verification (7 categories)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing (215+ existing + new Ultravox tests)
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Docker builds and runs successfully
- [x] Provider parity matrix complete (6/7 verified, 1 gap noted)
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks marked `[P]` can be worked on simultaneously:

- T006 + T007: Test file scaffolds are independent
- T014 + T015 + T016: Documentation updates are independent

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T004 must complete before T005 (build before size check)
- T006-T008 must complete before T009-T013 (scaffolds before implementation)
- T009-T016 must complete before T017 (implementation before full test run)

### Provider Feature Parity Matrix

| Feature            | ElevenLabs | xAI  | OpenAI | Ultravox |
| ------------------ | ---------- | ---- | ------ | -------- |
| Connect/Disconnect | Pass       | Pass | Pass   | Verify   |
| Status Display     | Pass       | Pass | Pass   | Verify   |
| Transcript         | Pass       | Pass | Pass   | Verify   |
| Function Calling   | N/A        | Pass | Pass   | Verify   |
| Voice Selection    | N/A        | Pass | Pass   | Verify   |
| Reconnection       | Pass       | Pass | Pass   | Verify   |
| Error Handling     | Pass       | Pass | Pass   | Verify   |

### Docker Testing Commands

```bash
# Build
docker build -t voice-agent .

# Check size
docker images voice-agent --format "{{.Size}}"

# Start services
docker-compose up -d

# Health check
curl http://localhost:3001/api/health

# Stop services
docker-compose down
```

---

## Next Steps

Run `/implement` to begin AI-led implementation.
