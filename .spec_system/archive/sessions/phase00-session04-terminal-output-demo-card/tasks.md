# Task Checklist

**Session ID**: `phase00-session04-terminal-output-demo-card`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2026-01-18

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
| Setup          | 2      | 2      | 0         |
| Foundation     | 6      | 6      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (2 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0004] Verify prerequisites met (ngrok scripts from sessions 01-03 exist and are executable)
- [x] T002 [S0004] Create output-formatter.sh skeleton with header comments and set -euo pipefail

---

## Foundation (6 tasks)

Core structures and base implementations for the output formatting library.

- [x] T003 [S0004] Implement color variable initialization with TTY detection (`scripts/ngrok/output-formatter.sh`)
- [x] T004 [S0004] Implement NO_COLOR environment variable support for accessibility (`scripts/ngrok/output-formatter.sh`)
- [x] T005 [S0004] [P] Implement print_success, print_error, print_warning, print_info functions (`scripts/ngrok/output-formatter.sh`)
- [x] T006 [S0004] [P] Implement print_header and print_divider functions for section formatting (`scripts/ngrok/output-formatter.sh`)
- [x] T007 [S0004] Implement print_box_top, print_box_bottom, print_box_line functions for bordered output (`scripts/ngrok/output-formatter.sh`)
- [x] T008 [S0004] Create demo-card.sh skeleton with header comments and source output-formatter.sh (`scripts/ngrok/demo-card.sh`)

---

## Implementation (8 tasks)

Main feature implementation for demo card and integration.

- [x] T009 [S0004] Implement URL parsing and validation in demo-card.sh (`scripts/ngrok/demo-card.sh`)
- [x] T010 [S0004] Implement demo card header section with project name and status (`scripts/ngrok/demo-card.sh`)
- [x] T011 [S0004] Implement URLs section displaying frontend and backend URLs (`scripts/ngrok/demo-card.sh`)
- [x] T012 [S0004] Implement local URLs section for localhost access (`scripts/ngrok/demo-card.sh`)
- [x] T013 [S0004] Implement basic auth credentials section (conditional display) (`scripts/ngrok/demo-card.sh`)
- [x] T014 [S0004] Implement quick start instructions section (`scripts/ngrok/demo-card.sh`)
- [x] T015 [S0004] Update demo.sh to source output-formatter.sh and replace inline colors (`scripts/demo.sh`)
- [x] T016 [S0004] Update demo.sh display_urls() to call demo-card.sh (`scripts/demo.sh`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0004] Run shellcheck on all new/modified shell scripts and fix any warnings
- [x] T018 [S0004] [P] Manual testing in color-capable terminal (verify color output)
- [x] T019 [S0004] [P] Manual testing with NO_COLOR=1 (verify plain text output)
- [x] T020 [S0004] Validate ASCII encoding on all files (no Unicode characters)

---

## Documentation (Bonus - integrated into testing)

Documentation updates are part of MVP scope but lightweight.

Note: README.md demo mode section and docs/DEMO_MODE.md creation are deferred to after core implementation validation to ensure documentation reflects actual implementation. These will be added as follow-up tasks if time permits within session scope.

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] shellcheck passes on all shell scripts with zero warnings
- [x] All files ASCII-encoded (0-127 characters only)
- [x] Demo card displays correctly with color and without (NO_COLOR=1)
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks marked `[P]` can be worked on simultaneously:

- T005 and T006 are independent print function implementations
- T018 and T019 are independent manual testing scenarios

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T003-T007 must complete before T008 (demo-card sources output-formatter)
- T009-T014 must complete before T015-T016 (demo.sh integration)
- T017 should run after all implementation tasks

### Key Files

| File                                | Purpose                              |
| ----------------------------------- | ------------------------------------ |
| `scripts/ngrok/output-formatter.sh` | Reusable terminal formatting library |
| `scripts/ngrok/demo-card.sh`        | Demo card generator                  |
| `scripts/demo.sh`                   | Main orchestrator (modify)           |

### ASCII Compliance

All output must use ASCII-only characters (0-127):

- Use `+`, `-`, `|`, `=` for borders (not Unicode box-drawing)
- No curly quotes or em dashes
- Test with `file -i <filename>` to verify encoding

---

## Completion Summary

**Completed**: 2026-01-18
**All 20 tasks completed successfully.**

Run `/validate` to verify session completeness.
