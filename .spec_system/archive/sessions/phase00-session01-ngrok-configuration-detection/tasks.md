# Task Checklist

**Session ID**: `phase00-session01-ngrok-configuration-detection`
**Total Tasks**: 16
**Estimated Duration**: 4-5 hours
**Created**: 2026-01-18

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0001]` = Phase 00, Session 01 reference
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 2      | 2      | 0         |
| Foundation     | 4      | 4      | 0         |
| Implementation | 7      | 7      | 0         |
| Testing        | 3      | 3      | 0         |
| **Total**      | **16** | **16** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0001] Create ngrok scripts directory structure (`scripts/ngrok/`)
- [x] T002 [S0001] Verify existing environment and dependencies

---

## Foundation (4 tasks)

Core structures and base implementations.

- [x] T003 [S0001] Create ngrok.yml base structure with version header (`scripts/ngrok/ngrok.yml`)
- [x] T004 [S0001] Add frontend tunnel definition to ngrok.yml (`scripts/ngrok/ngrok.yml`)
- [x] T005 [S0001] Add backend tunnel definition to ngrok.yml (`scripts/ngrok/ngrok.yml`)
- [x] T006 [S0001] Add optional features (basic auth, custom domain, inspector port) to ngrok.yml (`scripts/ngrok/ngrok.yml`)

---

## Implementation (7 tasks)

Main feature implementation.

- [x] T007 [S0001] Create detect-ngrok.sh with shebang and header comments (`scripts/ngrok/detect-ngrok.sh`)
- [x] T008 [S0001] Implement ngrok detection logic using command -v (`scripts/ngrok/detect-ngrok.sh`)
- [x] T009 [S0001] Add version extraction and output formatting (`scripts/ngrok/detect-ngrok.sh`)
- [x] T010 [S0001] Create install-instructions.sh with platform detection logic (`scripts/ngrok/install-instructions.sh`)
- [x] T011 [S0001] Add Linux installation instructions (apt, snap, curl) (`scripts/ngrok/install-instructions.sh`)
- [x] T012 [S0001] Add macOS installation instructions (brew, curl) (`scripts/ngrok/install-instructions.sh`)
- [x] T013 [S0001] Add Windows/WSL instructions and generic fallback (`scripts/ngrok/install-instructions.sh`)

---

## Testing (3 tasks)

Verification and quality assurance.

- [x] T014 [S0001] [P] Update .env.example with ngrok environment variables (`.env.example`)
- [x] T015 [S0001] [P] Set executable permissions and validate with shellcheck (`scripts/ngrok/*.sh`)
- [x] T016 [S0001] Run manual tests and validate ngrok.yml syntax

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All shell scripts pass shellcheck with no errors
- [x] All files ASCII-encoded (0-127 characters only)
- [x] All files use Unix LF line endings
- [x] ngrok.yml validated with `ngrok config check`
- [x] detect-ngrok.sh tested on system with/without ngrok
- [x] install-instructions.sh detects current platform correctly
- [x] implementation-notes.md created/updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T014 and T015 are marked `[P]` as they are independent cleanup/documentation tasks that can be worked on simultaneously.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T001 must complete before T003-T006
- T003 must complete before T004-T006 (sequential ngrok.yml building)
- T007 must complete before T008-T009
- T010 must complete before T011-T013

### Shell Script Standards

All shell scripts must:

- Use `#!/usr/bin/env bash` shebang
- Include set -euo pipefail for strict error handling
- Pass shellcheck validation
- Use ASCII-only characters
- Have executable permission (chmod +x)

### ngrok.yml Format

Using ngrok v3 CLI with config file version 2 format:

- Environment variable substitution: `${VAR_NAME}`
- Optional fields left empty when env var not set
- Inspector port configured via web_addr

---

## Next Steps

Run `/validate` to verify session completeness.
