# Task Checklist

**Session ID**: `phase04-session04-e2e-and-browser-smoke-tests`
**Total Tasks**: 20
**Estimated Duration**: 3-4 hours
**Created**: 2026-05-11

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[SNNMM]` = Session reference (NN=phase number, MM=session number)
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

Initial configuration and environment preparation.

- [x] T001 [S0404] Verify existing Playwright provider specs, fixture setup, route interception, and `VoicePage` conventions before adding translation helpers (`tests/e2e/page-objects/VoicePage.ts`)
- [x] T002 [S0404] Verify OpenAI Translation provider labels, roles, source controls, diagnostics, status text, transcript panel, and provider tab test IDs for stable browser selectors (`src/components/providers/OpenAITranslationProvider.tsx`)
- [x] T003 [S0404] Verify focused Playwright command shape and `VITE_OPENAI_TRANSLATION_ENABLED=true` dev-server behavior without relying on real OpenAI credentials or host media devices (`playwright.config.ts`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0404] Extend `VoicePage` with OpenAI Translation tab selection, control locators, source/language helpers, status/diagnostics helpers, and runtime cleanup inspection helpers (`tests/e2e/page-objects/VoicePage.ts`)
- [x] T005 [S0404] Create translation E2E route helpers for `/api/openai/translation-session` and `/v1/realtime/translations/calls` with sanitized fake responses and no live network calls (`tests/e2e/utils/openai-translation-mock.ts`)
- [x] T006 [S0404] [P] Add controllable media-source mocks for microphone success, browser-tab success, unsupported `getDisplayMedia`, permission denial, cancellation, and no-audio-track streams (`tests/e2e/utils/openai-translation-mock.ts`)
- [x] T007 [S0404] [P] Add fake `RTCPeerConnection` and `RTCDataChannel` helpers for startup, connected state, peer failure, transcript messages, remote translated audio, and deterministic cleanup counters (`tests/e2e/utils/openai-translation-mock.ts`)
- [x] T008 [S0404] [P] Add reset and assertion helpers that clear media, route, peer, data-channel, timer, and cleanup state between tests (`tests/e2e/utils/openai-translation-mock.ts`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0404] Create the OpenAI Translation Playwright spec with setup that enables translation mocks before navigation and selects the translation tab through the app shell (`tests/e2e/providers/openai-translation.spec.ts`)
- [x] T010 [S0404] Add tab visibility and initial UI smoke tests for the translation tab, source selector, target language selector, start/stop controls, status panel, diagnostics panel, transcript panel, export controls, and audio player (`tests/e2e/providers/openai-translation.spec.ts`)
- [x] T011 [S0404] Add disabled and pending-state tests for start/stop controls during source capture, client-secret route latency, SDP exchange latency, and WebRTC connection setup with duplicate-trigger prevention while in-flight (`tests/e2e/providers/openai-translation.spec.ts`)
- [x] T012 [S0404] Add browser-tab source tests for unsupported API, permission denial, cancellation, and no-audio-track diagnostics with denied/restricted/revoked handling and fallback behavior (`tests/e2e/providers/openai-translation.spec.ts`)
- [x] T013 [S0404] Add microphone fallback smoke coverage proving microphone source can start when browser-tab capture is unavailable, using local mocks only (`tests/e2e/providers/openai-translation.spec.ts`)
- [x] T014 [S0404] Add mocked WebRTC connected-state coverage for client-secret route, SDP exchange, remote translated audio stream, status transition, and audio-player readiness with timeout and failure-path handling (`tests/e2e/providers/openai-translation.spec.ts`)
- [x] T015 [S0404] Add mocked data-channel coverage for source and translated transcript events, transcript panel output, latest caption behavior, and unknown-event tolerance (`tests/e2e/providers/openai-translation.spec.ts`)
- [x] T016 [S0404] Add provider-switch cleanup smoke coverage for pending and mocked-active translation sessions, asserting provider-switch cleanup runs once before or during navigation (`tests/e2e/providers/openai-translation.spec.ts`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0404] Run the focused Chromium translation Playwright command with `VITE_OPENAI_TRANSLATION_ENABLED=true` and fix failures within session scope (`package.json`)
- [x] T018 [S0404] Run existing E2E smoke/provider subsets affected by shared page-object or fixture changes and fix regressions within session scope (`tests/e2e/smoke/tab-navigation.spec.ts`)
- [x] T019 [S0404] Run `npm run type-check` and `npm run lint`, then fix TypeScript, lint, or selector-style issues introduced by the E2E helpers (`package.json`)
- [x] T020 [S0404] Validate ASCII/LF session files and record commands, mock limitations, browser limitations, and residual gaps in implementation notes (`.spec_system/specs/phase04-session04-e2e-and-browser-smoke-tests/implementation-notes.md`)

---

## Completion Checklist

Before marking session complete:

- [x] All tasks marked `[x]`
- [x] All tests passing
- [x] All files ASCII-encoded
- [x] implementation-notes.md updated
- [x] Ready for the validate workflow step

---

## Next Steps

Run the validate workflow step to verify session completeness.
