# Task Checklist

**Session ID**: `phase00-session03-dynamic-url-configuration`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2026-01-18

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0003]` = Session reference (Phase 00, Session 03)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 8      | 8      | 0         |
| Integration    | 4      | 4      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **24** | **24** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0003] Verify prerequisites (ngrok, jq availability, Session 01-02 scripts) (`scripts/ngrok/`)
- [x] T002 [S0003] Update .gitignore for demo-generated files (`/.gitignore`)
- [x] T003 [S0003] Document DEMO_MODE variable in .env.example (`.env.example`)

---

## Foundation (5 tasks)

Core structures and templates for URL configuration.

- [x] T004 [S0003] Create config.template.js for runtime frontend config (`public/config.template.js`)
- [x] T005 [S0003] Create configure-urls.sh skeleton with URL extraction (`scripts/ngrok/configure-urls.sh`)
- [x] T006 [S0003] Add ngrok API URL parsing to configure-urls.sh (`scripts/ngrok/configure-urls.sh`)
- [x] T007 [S0003] Add server/.env.demo generation to configure-urls.sh (`scripts/ngrok/configure-urls.sh`)
- [x] T008 [S0003] Add public/config.js generation to configure-urls.sh (`scripts/ngrok/configure-urls.sh`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0003] Update server/index.js for dynamic CORS origin support (`server/index.js`)
- [x] T010 [S0003] Add .env.demo loading to server/index.js for demo mode (`server/index.js`)
- [x] T011 [S0003] Create getApiBaseUrl utility function (`src/lib/apiConfig.ts`)
- [x] T012 [S0003] [P] Update OpenAIVoiceContext to use getApiBaseUrl (`src/contexts/OpenAIVoiceContext.tsx`)
- [x] T013 [S0003] [P] Update XAIVoiceContext to use getApiBaseUrl (`src/contexts/XAIVoiceContext.tsx`)
- [x] T014 [S0003] [P] Update UltravoxVoiceContext to use getApiBaseUrl (`src/contexts/UltravoxVoiceContext.tsx`)
- [x] T015 [S0003] [P] Update RetellVoiceContext to use getApiBaseUrl (`src/contexts/RetellVoiceContext.tsx`)
- [x] T016 [S0003] [P] Update GeminiVoiceContext to use getApiBaseUrl (`src/contexts/GeminiVoiceContext.tsx`)

---

## Integration (4 tasks)

Wire up URL configuration into demo orchestration.

- [x] T017 [S0003] Add configure_urls() function to demo.sh (`scripts/demo.sh`)
- [x] T018 [S0003] Add cleanup for generated config files in demo.sh (`scripts/demo.sh`)
- [x] T019 [S0003] Update demo.sh startup sequence for config ordering (`scripts/demo.sh`)
- [x] T020 [S0003] Create validate-cors.sh script for CORS testing (`scripts/ngrok/validate-cors.sh`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T021 [S0003] Run shellcheck on all new/modified shell scripts
- [x] T022 [S0003] Validate ASCII encoding on all new files
- [x] T023 [S0003] Manual test: full demo mode startup with CORS validation
- [x] T024 [S0003] Verify cleanup removes generated files on shutdown

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All shell scripts pass shellcheck
- [x] All files ASCII-encoded (no unicode in scripts/configs)
- [x] Unix LF line endings on all files
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T012-T016 (context updates) can be worked on simultaneously as they are independent file modifications with identical patterns.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T004 must complete before T008 (template needed for generation)
- T005-T008 are sequential (building up configure-urls.sh)
- T009-T010 are sequential (server modifications)
- T011 must complete before T012-T016 (utility function needed)
- T017-T019 are sequential (demo.sh orchestration)
- T020-T024 can run after all implementation tasks

### Key Files

| File                              | Action | Purpose                                   |
| --------------------------------- | ------ | ----------------------------------------- |
| `scripts/ngrok/configure-urls.sh` | Create | Main URL extraction and config generation |
| `scripts/ngrok/validate-cors.sh`  | Create | CORS validation script                    |
| `public/config.template.js`       | Create | Template for runtime frontend config      |
| `src/lib/apiConfig.ts`            | Create | Shared API base URL utility               |
| `server/index.js`                 | Modify | Dynamic CORS origin support               |
| `scripts/demo.sh`                 | Modify | Integrate configure_urls()                |
| `src/contexts/*.tsx`              | Modify | Use getApiBaseUrl (6 files)               |
| `.gitignore`                      | Modify | Ignore generated demo files               |
| `.env.example`                    | Modify | Document DEMO_MODE                        |

### jq Fallback

configure-urls.sh should check for jq and provide a grep-based fallback or clear error message if not installed.

---

## Next Steps

Run `/implement` to begin AI-led implementation.
