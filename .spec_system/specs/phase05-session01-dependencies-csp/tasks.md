# Task Checklist

**Session ID**: `phase05-session01-dependencies-csp`
**Total Tasks**: 18
**Estimated Duration**: 3-4 hours
**Created**: 2025-12-31

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0501]` = Session reference (Phase 05, Session 01)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 6      | 6      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **18** | **18** | **0**     |

---

## Setup (3 tasks)

Initial verification and environment preparation.

- [x] T001 [S0501] Verify Node.js 18+ and npm available
- [x] T002 [S0501] Review VAPI_EXAMPLE reference implementation patterns (`VAPI_EXAMPLE/src/features/Assistant/vapi.sdk.ts`)
- [x] T003 [S0501] Analyze current CSP configuration in `index.html` and identify required additions

---

## Foundation (5 tasks)

Package installation and directory structure.

- [x] T004 [S0501] Create `src/lib/vapi/` directory for Vapi utilities
- [x] T005 [S0501] Install `@vapi-ai/web` package with pinned version 1.0.255 (`package.json`)
- [x] T006 [S0501] Verify package-lock.json updated with exact version lock
- [x] T007 [S0501] [P] Confirm TypeScript can resolve `@vapi-ai/web` module
- [x] T008 [S0501] [P] Confirm TypeScript can resolve `@vapi-ai/web/dist/api` types

---

## Implementation (6 tasks)

CSP configuration and type verification file creation.

- [x] T009 [S0501] Create type verification file (`src/lib/vapi/types.ts`)
- [x] T010 [S0501] Update CSP connect-src with Vapi API domains (`index.html`)
- [x] T011 [S0501] Update CSP connect-src with Daily.co WebRTC domains (`index.html`)
- [x] T012 [S0501] Update CSP connect-src with pipecdn CDN domain (`index.html`)
- [x] T013 [S0501] Verify `.env.example` has complete Vapi documentation
- [x] T014 [S0501] Start dev server and verify no CSP violations in console

---

## Testing (4 tasks)

Build verification and quality validation.

- [x] T015 [S0501] Run `npm run build` and verify successful compilation
- [x] T016 [S0501] Run `npm run lint` and confirm no errors (warnings acceptable)
- [x] T017 [S0501] Validate all modified files are ASCII-encoded with Unix LF line endings
- [x] T018 [S0501] Manual verification - import statements resolve in IDE without errors

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for `/validate`

---

## Notes

### CSP Domains Added

Based on spec and Vapi SDK documentation:

```
# Vapi API
https://api.vapi.ai
wss://api.vapi.ai
https://*.vapi.ai
wss://*.vapi.ai

# Daily.co WebRTC (transport layer)
https://*.daily.co
wss://*.daily.co

# pipecdn CDN (Daily.co assets)
https://*.pipecdn.app
```

### Parallelization

Tasks T007 and T008 can run in parallel after package installation.

### Task Timing

Target ~15-20 minutes per task. This session is infrastructure-focused and should complete quickly.

### Dependencies

- Complete tasks in order unless marked `[P]`
- T005 must complete before T006, T007, T008
- T009-T012 can be done in any order
- T015-T018 depend on all implementation tasks

### Reference Files

- `VAPI_EXAMPLE/package.json` - SDK version reference (^1.0.255)
- `VAPI_EXAMPLE/src/features/Assistant/vapi.sdk.ts` - Import pattern
- `VAPI_EXAMPLE/src/features/Assistant/useVapi.ts` - Hook pattern (Session 02)

---

## Next Steps

Run `/validate` to verify session completeness.
