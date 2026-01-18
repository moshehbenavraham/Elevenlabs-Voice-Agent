# Task Checklist

**Session ID**: `phase00-session02-demo-startup-orchestration`
**Total Tasks**: 18
**Estimated Duration**: 6-8 hours
**Created**: 2026-01-18

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0002]` = Session reference (Phase 00, Session 02)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 4      | 4      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0002] Verify Session 01 prerequisites met (detect-ngrok.sh, ngrok.yml exist)
- [x] T002 [S0002] Verify required ports 8082, 3001, 4041 are available for testing
- [x] T003 [S0002] Review existing script patterns in detect-ngrok.sh for consistency

---

## Foundation (4 tasks)

Core structures and base implementations.

- [x] T004 [S0002] Create `scripts/ngrok/wait-for-tunnels.sh` skeleton with shebang, strict mode, color functions (`scripts/ngrok/wait-for-tunnels.sh`)
- [x] T005 [S0002] Create `scripts/ngrok/start-tunnels.sh` skeleton with shebang, strict mode, color functions (`scripts/ngrok/start-tunnels.sh`)
- [x] T006 [S0002] Create `scripts/demo.sh` skeleton with shebang, strict mode, color functions (`scripts/demo.sh`)
- [x] T007 [S0002] Define helper functions for script-relative path resolution in all three scripts

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T008 [S0002] Implement wait-for-tunnels.sh polling logic with exponential backoff (`scripts/ngrok/wait-for-tunnels.sh`)
- [x] T009 [S0002] Implement wait-for-tunnels.sh ngrok API JSON parsing with jq fallback (`scripts/ngrok/wait-for-tunnels.sh`)
- [x] T010 [S0002] Implement start-tunnels.sh ngrok startup with PID capture (`scripts/ngrok/start-tunnels.sh`)
- [x] T011 [S0002] Implement start-tunnels.sh URL extraction calling wait-for-tunnels.sh (`scripts/ngrok/start-tunnels.sh`)
- [x] T012 [S0002] Implement demo.sh port conflict detection using lsof/nc (`scripts/demo.sh`)
- [x] T013 [S0002] Implement demo.sh process startup sequence (ngrok -> frontend -> backend) (`scripts/demo.sh`)
- [x] T014 [S0002] Implement demo.sh PID tracking array and trap-based signal handling (`scripts/demo.sh`)
- [x] T015 [S0002] Implement demo.sh graceful LIFO shutdown sequence (`scripts/demo.sh`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T016 [S0002] [P] Run shellcheck on all three scripts and fix any warnings
- [x] T017 [S0002] [P] Add npm script entry `demo` to package.json (`package.json`)
- [x] T018 [S0002] Manual testing: full startup, Ctrl+C shutdown, port conflict, ngrok not installed

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All scripts pass shellcheck (no warnings)
- [x] All files ASCII-encoded (no unicode characters)
- [x] All scripts executable (chmod +x)
- [x] All scripts have Unix LF line endings
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

- T016 and T017 can be worked on simultaneously
- Foundation tasks T004-T006 create independent file skeletons but share patterns, so sequential is cleaner

### Task Timing

Target ~20-25 minutes per task. Implementation tasks may vary based on complexity of process management.

### Dependencies

- T004-T006 must complete before T007 (path resolution added to existing files)
- T008-T009 must complete before T011 (start-tunnels calls wait-for-tunnels)
- T010-T011 must complete before T013 (demo.sh calls start-tunnels.sh)
- T012-T015 are sequential (demo.sh implementation order)

### Key Patterns from Session 01

- Use `#!/usr/bin/env bash` for portability
- Use `set -euo pipefail` for strict mode
- Color output disabled when not a terminal (`[ -t 1 ]`)
- Prefix messages with `[OK]`, `[ERROR]`, `[WARN]`
- Use `printf` with color codes, not echo

### ngrok API Details

- Endpoint: `http://localhost:4041/api/tunnels`
- Returns JSON with `tunnels[]` array containing `public_url` and `config.addr` fields
- Port 4041 defined in existing ngrok.yml configuration

---

## Completed

Session implementation complete. Run `/validate` to verify session completeness.
