# Dependency Update Handoff

Date: 2026-05-10

## Summary

The npm dependency set has been updated to the latest available versions that were targeted in this pass. `@elevenlabs/react` is now fully migrated to `^1.6.0`, which installs `@elevenlabs/client@1.7.0`.

`npm outdated --json` now returns `{}`. The normal project gates pass, `type-check` is now an official passing gate, and the focused Playwright conversation-panel spec passes after updating the affected e2e mocks.

Follow-up work on the previously remaining items is partially complete:

- The `node-domexception` npm deprecation warning has a local npm override in place.
- `public/config.js` is intentionally staying generated/ignored, with npm lifecycle hooks now creating the local stub for direct `npm run dev`, `npm run build`, and `npm run preview` usage.
- Broader Chromium E2E cleanup is in progress but not complete. Work was paused by request with no test runner left running.

## Pause Checkpoint: 2026-05-10 Follow-up Pass

Status: paused by request.

No Playwright/Vite test process from this pass is still running. The last active command was terminated after user interruption.

### Completed In This Follow-up

- Added `overrides.node-domexception = "npm:@profoundlogic/node-domexception@1.0.2"` in `package.json`.
  - `npm install` completed without the previous `node-domexception@1.0.0` deprecation warning.
  - `npm ls node-domexception @profoundlogic/node-domexception @google/genai --all` shows `@google/genai -> google-auth-library -> gaxios -> node-fetch -> fetch-blob -> node-domexception@npm:@profoundlogic/node-domexception@1.0.2 overridden`.
  - `npm ci` has not yet been rerun after this override.
- Chose generated/ignored `public/config.js` as the ongoing approach.
  - Added `scripts/ensure-config-stub.mjs`.
  - Added npm lifecycle hooks: `predev`, `prebuild`, `prebuild:dev`, and `prepreview`.
  - `public/config.js` remains ignored by `.gitignore`; direct dev/build/preview commands now create the local no-op stub when missing.
- Added stable provider E2E hooks:
  - `data-testid="voice-button"` and `data-state` to xAI, Ultravox, Vapi, and Retell buttons.
  - `data-testid="voice-button-status"` to provider-specific status labels.
  - `data-testid="voice-button"` / `data-state` and `voice-status` / `voice-status-text` to the ElevenLabs SDK hero.
- Fixed OpenAI/xAI stale WebSocket close-handler state:
  - OpenAI now tracks status in a ref like xAI already did.
  - OpenAI/xAI close handlers now use the current status ref and clear `wsRef.current` on close.
  - This fixed retry/disconnect behavior after abnormal WebSocket closes.
- Made optional unconfigured Vapi logging quiet by default.
  - Vapi module-level missing-token warnings are now debug-only behind `VITE_VAPI_DEBUG=true`.
- Updated current E2E tests for current app behavior:
  - ElevenLabs reconnection spec now handles the unconfigured placeholder agent state.
  - ElevenLabs provider spec no longer calls `import.meta.env` inside `page.evaluate`.
  - Gemini provider spec skips when `VITE_GEMINI_ENABLED=false` and the tab is disabled.
  - OpenAI/Gemini provider specs check `toBeDisabled()` instead of expecting Radix's empty `data-disabled` attribute to equal `"true"`.
  - Provider-render smoke tests use stable provider tab test IDs.
  - Tab-navigation smoke tests only keyboard-navigate enabled tabs.
- Restored OpenAI/xAI user-facing provider controls:
  - Rendered `OpenAIVoiceSelector` and `XAIVoiceSelector` in idle and active provider views.
  - Exported those selector components from `src/components/providers/index.ts`.
  - Rewired OpenAI/xAI "End conversation" buttons to call the provider context `disconnect()` functions instead of only hiding the active UI.

### Verification Completed In This Follow-up

Passing after the follow-up edits:

- `npm run type-check`
- `env -u NO_COLOR npx playwright test tests/e2e/error-handling/api-errors.spec.ts --project=chromium --workers=1 --max-failures=1` - 15 passed
- `env -u NO_COLOR npx playwright test tests/e2e/error-handling/elevenlabs-reconnection.spec.ts --project=chromium --workers=1 --max-failures=1` - 15 passed
- `env -u NO_COLOR npx playwright test tests/e2e/providers/elevenlabs.spec.ts --project=chromium --workers=1 --max-failures=1` - 12 passed
- `env -u NO_COLOR npx playwright test tests/e2e/providers/gemini.spec.ts --project=chromium --workers=1 --max-failures=1` - 22 skipped because Gemini is disabled by current env
- `env -u NO_COLOR npx playwright test tests/e2e/providers/openai.spec.ts tests/e2e/providers/xai.spec.ts --project=chromium --workers=1 --max-failures=1` - 40 passed, 1 intentionally skipped
- `env -u NO_COLOR npx playwright test tests/e2e/smoke/provider-render.spec.ts --project=chromium --workers=1 --max-failures=1` - 7 passed
- `env -u NO_COLOR npx playwright test tests/e2e/smoke/tab-navigation.spec.ts --project=chromium --workers=1 --max-failures=1` - 7 passed

### Interrupted/Not Complete

- A full Chromium run was started with:
  - `env -u NO_COLOR npx playwright test --project=chromium --workers=1 --max-failures=1`
- Last captured output before the user interruption showed the run at the disabled Gemini provider block, around tests 63-80 of 221.
- No failure had been captured in that latest run up to the last visible output.
- The command continued running after interruption; it was explicitly terminated to pause.
- Full Chromium completion is still pending.
- Full cross-browser completion across Firefox, WebKit, Mobile Chrome, and Mobile Safari is still pending.

### Next Resume Point

1. Run the fast non-E2E gates again:
   - `npm ci`
   - `npm run lint`
   - `npm run format:check`
   - `npm run type-check`
   - `npm run test:run`
   - `npm run build`
   - `npm audit --audit-level=high`
   - `npm outdated --json`
2. Verify the deprecation override specifically:
   - `npm ls node-domexception @profoundlogic/node-domexception @google/genai --all`
   - Confirm `npm ci` no longer prints the old `node-domexception@1.0.0` warning.
3. Resume E2E with Chromium first:
   - `env -u NO_COLOR npx playwright test --project=chromium --workers=1 --max-failures=1`
4. Only after Chromium is clean, run broader browser coverage:
   - `env -u NO_COLOR npx playwright test --workers=1 --max-failures=1`

## Active Follow-up: ElevenLabs React 1.6.0 Migration

Status: completed on 2026-05-10.

Goal: fully migrate the app to `@elevenlabs/react@1.6.0`, remove it from the `npm outdated` list, and re-run the documented verification gates.

Progress log:

- Started migration pass from the remaining work item in this document.
- Found the active integration point: `src/contexts/VoiceContext.tsx` called `useConversation` directly, while `src/App.tsx` wraps the app in the custom `VoiceProvider`.
- Installed `@elevenlabs/react@1.6.0`; it pulls `@elevenlabs/client@1.7.0`.
- Confirmed v1 requires the package `ConversationProvider`; `useConversation` must run inside that provider.
- Confirmed v1 no longer exposes `messages` or `audioStream` on the conversation hook. Transcripts now come from `onMessage`, and visualization now uses `getInputByteFrequencyData` / `getOutputByteFrequencyData`.
- Updated `src/contexts/VoiceContext.tsx` so the app's custom `VoiceProvider` wraps ElevenLabs' `ConversationProvider` internally.
- Reworked ElevenLabs transcript handling to accumulate messages from v1 `onMessage` callbacks.
- Reworked ElevenLabs visualization support to expose v1 frequency helper functions instead of relying on the removed `audioStream` field.
- Updated the unit-test ElevenLabs SDK mock for the v1 provider and hook shape.
- Added stable `data-testid="voice-button"` / `data-state` attributes to the OpenAI voice button, which is the provider selected by the focused conversation-panel e2e spec.
- Extended `tests/e2e/utils/audio-mock.ts` with `audioWorklet.addModule`, `AudioWorkletNode`, `createMediaStreamDestination()`, and a native `MediaStream` for SDK audio-element output routing.
- Extended `tests/e2e/utils/websocket-mock.ts` so OpenAI `session.update` receives `session.updated`, legacy OpenAI mock events are normalized, Vite HMR sockets are filtered out, and ElevenLabs v1 receives `conversation_initiation_metadata`.
- Corrected the e2e ElevenLabs signed-url mock response to use `signedUrl`, matching the real server route and `VoiceContext`.
- Manual ElevenLabs SDK v1 browser smoke now passes: selecting the ElevenLabs SDK tab, clicking "Begin Conversation", and waiting for `[data-testid="voice-button"][data-state="connected"]` succeeds with one mocked ElevenLabs WebSocket connection and the conversation panel visible.
- Re-ran the documented validation gates after `npm ci`; all required gates pass.
- Follow-up pass resolved the remaining actionable handoff items: app typecheck, Vite/plugin/config warnings, local runtime `/config.js` stub handling, stale `bun.lockb`, and placeholder env hardening.

## What Was Done

- Updated `package.json` and regenerated `package-lock.json` with npm.
- Updated runtime packages including React, React DOM, React Router, TanStack Query, Google GenAI, ElevenLabs React, Lucide, Framer Motion, Tailwind packages, Pino, and related utilities.
- Updated dev tooling including ESLint 10, TypeScript 6, Vite 8, Vitest, Playwright, Prettier, jsdom, lint-staged, globals, and related plugins.
- Removed `@types/pino` because it is now a deprecated stub and `pino` ships its own types.
- Updated Vite manual chunking from object form to a `manualChunks(id)` function, because Vite 8/Rolldown rejected the previous object shape.
- Updated `src/lib/vapi.ts` so the Vapi SDK singleton handles both direct default exports and CommonJS-style `{ default }` module objects under Vite 8 dev bundling.
- Fixed new ESLint 10 / React hooks rule findings in settings tabs, mobile detection, caught-error handling, and a stale Playwright assertion.
- Removed deprecated `baseUrl` from TS config and moved app libs to ES2022 so `Error.cause` is available.
- Migrated the ElevenLabs SDK integration to the v1 React provider, message callback, session lifecycle, volume, and frequency-data APIs.
- Updated e2e mocks to support the current OpenAI and ElevenLabs runtime paths.
- Replaced `@vitejs/plugin-react-swc` with `@vitejs/plugin-react` in Vite and Vitest configs.
- Added an official `npm run type-check` gate and fixed the app-level TypeScript errors.
- Created a local `public/config.js` no-op stub and changed the runtime config script to `type="module"`. Note: `public/config.js` is still ignored by `.gitignore`; the local stub exists in this workspace, dev/reset scripts can recreate it, and npm lifecycle hooks now create it for direct dev/build/preview commands.
- Hardened ElevenLabs and Vapi placeholder env detection so placeholder values do not initialize external widgets/SDKs.
- Regenerated `bun.lockb` with Bun 1.3.13 via `npx bun install`.
- Added a local npm override for the transitive `node-domexception` warning path through `@google/genai`.
- Added current stable E2E hooks and controls for provider-specific buttons/status labels, ElevenLabs SDK hero state, OpenAI/xAI selectors, and OpenAI/xAI actual disconnect behavior.
- Updated stale E2E assumptions around disabled Gemini, Radix disabled attributes, ElevenLabs tab selection, current SDK hero layout, and enabled-tab keyboard navigation.

## Verification Completed

Passing:

- Earlier pass: `npm ci` passed before the local `node-domexception` override was added, but printed the now-addressed transitive deprecation warning. `npm ci` still needs to be rerun after the override.
- `npm run lint`
- `npm run format:check`
- `npm run type-check`
- `npm run test:run` - 28 files, 623 tests passing
- `npm run build`
- `npm audit --audit-level=high` - 0 vulnerabilities
- `npm outdated --json` - `{}`
- `npm ls @vitejs/plugin-react @vitejs/plugin-react-swc @elevenlabs/react @elevenlabs/client` - `@vitejs/plugin-react@6.0.1`, `@elevenlabs/react@1.6.0`, and `@elevenlabs/client@1.7.0`; SWC plugin is absent.
- `env -u NO_COLOR npx playwright test tests/e2e/voice-ui/conversation-panel.spec.ts --project=chromium --workers=1 --max-failures=1` - 16 passed, 1 intentionally skipped
- Manual ElevenLabs SDK browser smoke against `http://127.0.0.1:8082/` - connected state reached, conversation panel visible, one mocked ElevenLabs WebSocket using `source=react_sdk&version=1.6.0`
- Follow-up focused Chromium E2E checks are listed in the pause checkpoint above.

## Issues And Warnings Encountered

### Fixed During This Update

- `@elevenlabs/react@1.6.0` initially blanked the app with `useRegisterCallbacks must be used within a ConversationProvider`.
- ElevenLabs v1 removed the previous `messages` and `audioStream` hook fields used by the app.
- Vite 8 build failed with `TypeError: manualChunks is not a function`.
- Vite 8 dev blanked the app with `TypeError: Vapi is not a constructor`.
- ESLint 10 surfaced stricter React hook and caught-error rules.
- TypeScript 6 warned that `baseUrl` is deprecated.
- Manual `tsc --noEmit -p tsconfig.app.json` previously failed on outdated SDK assumptions, missing worklet globals, typed-array buffer types, mock DOM/audio shapes, and unused/implicit-any findings.
- Focused Playwright conversation-panel tests were blocked by a missing stable OpenAI voice-button selector.
- E2E mocks were missing current OpenAI session events and ElevenLabs v1 WebSocket/audio setup support.
- Vite/Vitest warned about the SWC React plugin and Vite 8's deprecated plugin `esbuild` option.
- Build warned that `/config.js` could not be bundled without `type="module"`.
- Runtime dev smoke tests logged a 404 for `/config.js` when the file was not present.
- Runtime dev smoke tests logged an ElevenLabs widget config error for placeholder-style agent config.
- `bun.lockb` was stale relative to `package-lock.json`.
- The Playwright audio mock always exposed a 48 kHz `AudioContext` even when SDK code requested another sample rate.
- Transitive `node-domexception@1.0.0` deprecation warning from `@google/genai -> google-auth-library -> gaxios -> node-fetch -> fetch-blob` was addressed locally with an npm alias override to `@profoundlogic/node-domexception@1.0.2`. Final `npm ci` verification is still pending.
- Broad E2E surfaced and the follow-up fixed stale selectors, stale provider assumptions, missing OpenAI/xAI voice selectors, actual OpenAI/xAI disconnect behavior, and stale WebSocket close-handler state.

## Remaining Work To Fully Resolve Issues And Warnings

1. Finish verification after the follow-up edits.
   - Rerun the non-E2E gates listed in the pause checkpoint.
   - Specifically confirm `npm ci` no longer prints the old `node-domexception@1.0.0` warning after the override.

2. Complete Chromium E2E.
   - The latest full Chromium run was interrupted and then terminated by request.
   - Resume with `env -u NO_COLOR npx playwright test --project=chromium --workers=1 --max-failures=1`.

3. Complete broader cross-browser E2E after Chromium is clean.
   - Run `env -u NO_COLOR npx playwright test --workers=1 --max-failures=1`.
   - Firefox, WebKit, Mobile Chrome, and Mobile Safari were not reached before the pause.

4. Track upstream deprecation cleanup.
   - The local override removes the warning path for this repo, but upstream packages may eventually remove the dependency without an override.
