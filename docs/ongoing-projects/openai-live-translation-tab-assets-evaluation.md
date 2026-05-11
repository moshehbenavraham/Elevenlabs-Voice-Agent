# OpenAI Live Translation Tab Asset Evaluation

Date: 2026-05-11

This evaluates the downloaded `EXAMPLE/` assets against this repo's current
React/Vite/Express architecture for adding a new in-app tab that runs a live
language translation tool using OpenAI `gpt-realtime-translate`.

## Project Build Plan

This plan starts at Phase 02 because Phases 00 and 01 are already reserved for
other base work in this repo. Each session below is intended to become one
implementation spec: one clear objective, about 2-4 hours of work, and roughly
12-25 concrete tasks that a top coding agent can complete in one context window.

### Phase 02 - Translation Foundation

Goal: establish the OpenAI Translation API contract, backend token route, shared
frontend config, and tab scaffolding without building the full user-facing tool
yet.

| Session                                         | Clear objective                                                                                                                | Target size | Primary repo touchpoints                                                                                                        | EXAMPLE/ references                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 02.01 Translation API contract and server route | Add a dedicated Express route that creates sanitized `gpt-realtime-translate` browser client secrets.                          | 14-18 tasks | `server/routes/openai.js`, `server/index.js`, server route tests if added                                                       | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/session.js`, `EXAMPLE/LinguaForge/yt-translate-poc/server.js`, `EXAMPLE/LinguaForge/yt-translate-poc/test/server.test.js`                                                                                                                       |
| 02.02 Shared translation config library         | Add typed frontend constants, supported output languages, validation helpers, audio-mix helpers, and session-update builders.  | 12-16 tasks | `src/lib/openaiTranslation.ts`, `src/types/`, `src/test/`                                                                       | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation-config.js`, `EXAMPLE/open-realtime-translate/src/shared/languages.ts`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/audio-mix.js` |
| 02.03 Provider-tab scaffold                     | Add the new translation provider identity, feature flag, icon, empty state, and provider-switch cleanup placeholders.          | 12-18 tasks | `src/types/voice-provider.ts`, `src/contexts/ProviderContext.tsx`, `src/components/tabs/ProviderTab.tsx`, `src/pages/Index.tsx` | Existing repo OpenAI/Gemini provider patterns; reference translation labels from `EXAMPLE/open-realtime-translate/src/shared/languages.ts`                                                                                                                                                                                                                                     |
| 02.04 Backend and config tests                  | Cover route validation, OpenAI response sanitization, missing key handling, language list correctness, and audio-mix clamping. | 14-20 tasks | `src/test/`, route tests under existing test conventions, `vitest.config.ts` as needed                                          | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/session.test.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/audio-mix.test.js`, `EXAMPLE/LinguaForge/yt-translate-poc/test/server.test.js`               |

### Phase 03 - Browser Translation MVP

Goal: deliver the first usable in-app translation tab for microphone and/or
browser-tab audio using browser WebRTC and translated audio playback.

| Session                                 | Clear objective                                                                                                                                      | Target size | Primary repo touchpoints                                                                                       | EXAMPLE/ references                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 03.01 Reusable WebRTC translation hook  | Implement `useOpenAITranslation` around `RTCPeerConnection`, `oai-events`, translated audio playback, transcript deltas, and cleanup.                | 18-24 tasks | `src/hooks/useOpenAITranslation.ts`, `src/lib/openaiTranslation.ts`, `src/test/`                               | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation.ts`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js` |
| 03.02 Source capture modes              | Add source acquisition for microphone and browser-tab audio, including permission errors, track-ended handling, and `getDisplayMedia()` options.     | 16-22 tasks | `src/hooks/useOpenAITranslationSource.ts`, `src/components/providers/OpenAITranslationProvider.tsx`            | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/capture-options.js`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`, `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`                      |
| 03.03 Translation tab UI MVP            | Build the initial provider screen with source selector, language selector, start/stop control, status, translated audio, and core responsive layout. | 18-24 tasks | `src/components/providers/OpenAITranslationProvider.tsx`, `src/pages/Index.tsx`, `src/components/ui/`          | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/index.html`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`                                                                                            |
| 03.04 Transcript and caption experience | Add source/translated transcript state, latest-subtitle rendering, clear controls, and stable transcript panel behavior.                             | 14-20 tasks | `src/components/conversation/TranslationTranscriptPanel.tsx`, `src/hooks/useOpenAITranslation.ts`, `src/test/` | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation.ts`, `EXAMPLE/open-realtime-translate/src/content/subtitle.ts`                                                                                     |
| 03.05 Audio mix and export controls     | Add original/translated mix controls for tab audio, transcript Markdown export, elapsed time, and basic max-session guard.                           | 14-20 tasks | `src/components/providers/OpenAITranslationProvider.tsx`, `src/lib/openaiTranslation.ts`                       | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/audio-mix.js`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`                                                                                          |

### Phase 04 - Hardening, Quality, and Demo Readiness

Goal: make the MVP reliable enough for repeated local demos and safe enough to
merge into the broader multi-provider app.

| Session                                    | Clear objective                                                                                                                           | Target size | Primary repo touchpoints                                                                                                 | EXAMPLE/ references                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 04.01 Lifecycle reliability                | Harden start/stop, tab switching, abort handling, track cleanup, peer-connection cleanup, and duplicate-start protection.                 | 16-22 tasks | `src/hooks/useOpenAITranslation.ts`, `src/pages/Index.tsx`, provider cleanup code                                        | `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`, `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`                                                                                                                                                                                   |
| 04.02 Error states and diagnostics         | Add user-facing errors for unsupported browser APIs, token failures, SDP failures, WebRTC connection failures, and missing audio tracks.  | 14-20 tasks | `src/components/providers/OpenAITranslationProvider.tsx`, `src/hooks/useOpenAITranslation.ts`, `server/routes/openai.js` | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js`, `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`                                                                                                  |
| 04.03 Unit and integration coverage        | Add focused tests for config, event parsing, hook cleanup, capture option construction, route validation, and transcript export.          | 18-24 tasks | `src/test/`, `server/` route tests, `tests/e2e/utils/` as needed                                                         | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/test/realtime-translation-config.test.mjs` |
| 04.04 E2E and browser smoke tests          | Add Playwright coverage for tab visibility, disabled states, permission failure UX, provider switching cleanup, and mocked WebRTC events. | 16-22 tasks | `tests/e2e/`, `tests/e2e/page-objects/VoicePage.ts`, `tests/e2e/utils/`                                                  | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/scripts/smoke-realtime.mjs`, `EXAMPLE/LinguaForge/yt-translate-poc/test/index-html.test.js`                                                                                   |
| 04.05 Documentation and demo configuration | Document environment flags, run steps, known limitations, cost/usage notes, and demo-mode behavior.                                       | 12-18 tasks | `README.md`, `docs/DEMO_MODE.md`, `docs/API_INTEGRATION.md`, `.env.example`                                              | `EXAMPLE/README.md`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/README.md`, `EXAMPLE/LinguaForge/README.md`, `EXAMPLE/open-realtime-translate/README.md`                                                                 |

### Phase 05 - Production Extensions and Media Variants

Goal: complete the broader feature goals from this evaluation: production
readiness, future media paths, eval posture, and optional external overlays.

| Session                                       | Clear objective                                                                                                                                               | Target size | Primary repo touchpoints                                                | EXAMPLE/ references                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 05.01 Production safety and usage controls    | Add stronger server controls: safety identifier hook, token rate-limit coverage, session duration limits, transcript privacy notes, and observability events. | 14-20 tasks | `server/index.js`, `server/routes/openai.js`, `src/lib/logger.ts`, docs | `EXAMPLE/LinguaForge/yt-translate-poc/server.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/security.js`                                                                                                                                                                                                                                                                    |
| 05.02 Evaluation harness and sample workflow  | Define a repeatable manual and automated evaluation flow for latency, translated transcript quality, names/numbers, and mixed-language behavior.              | 12-18 tasks | `docs/ongoing-projects/`, optional `tests/fixtures/translation/`        | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide.mdx`, `EXAMPLE/LinguaForge/test-output/realtime-translation-vs-obsidian-clipper-comparison.md`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/scripts/smoke-realtime.mjs`                                                                                                        |
| 05.03 Backend/raw-audio bridge spike          | Create a contained proof or design spec for server-side WebSocket translation if the app later ingests raw audio, SIP, telephony, or media-worker audio.      | 12-18 tasks | New docs/spec or isolated server prototype, no default UI dependency    | `EXAMPLE/mtg-realtime-translator/app.py`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/realtime-translation.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/audio.js`                                                                                                                       |
| 05.04 Room/telephony translation architecture | Document and optionally scaffold future one-session-per-direction and one-session-per-listener-language patterns for calls or rooms.                          | 12-18 tasks | `docs/ongoing-projects/`, optional future server routes                 | `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/room.js`, `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/languages.js`, `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/StreamSocket.ts`, `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/AudioInterceptor.ts` |
| 05.05 External subtitle overlay assessment    | Decide whether a later browser-extension or overlay companion is worth building, and document the reusable overlay patterns.                                  | 12-16 tasks | `docs/ongoing-projects/`, optional future overlay component             | `EXAMPLE/open-realtime-translate/src/content/subtitle.ts`, `EXAMPLE/open-realtime-translate/src/background/service-worker.ts`, `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`                                                                                                                                                                                                                                                                     |

## Executive Finding

The best path is not to extend the existing OpenAI voice-agent WebSocket
provider. That provider is built around normal Realtime voice-agent behavior:
prompts, tools, `response.create`, function calls, assistant turns, and
`/v1/realtime`. OpenAI's current live translation docs define a different
contract: dedicated `/v1/realtime/translations` sessions, target-language
configuration through `session.audio.output.language`, browser media over
WebRTC, translated audio as a remote media track, and transcript deltas over an
`oai-events` data channel.

For this app, the highest-quality implementation source is a combination:

1. Official cookbook `livekit-translation-demo/lib/realtime-translation.ts` for
   the reusable React/WebRTC sidecar hook pattern.
2. Official cookbook `browser-translation-demo` for tab-audio capture, SDP
   exchange, audio mix controls, and tests.
3. LinguaForge for Express route hardening, local session controls, timers, and
   transcript export.

`open-realtime-translate` is a strong browser-extension example, but it is
mainly useful if we later want a cross-site subtitle overlay or Chrome extension
flow. `mtg-realtime-translator` and Twilio assets are valuable for raw audio and
telephony, not for the first browser tab inside this web app.

## Current Repo Fit

The app already has the right shell for a new tab:

- Provider tabs are driven by `ProviderType`, `PROVIDERS`, `ProviderProvider`,
  and `ProviderTabs`.
- The main screen branches by `activeProvider` in `src/pages/Index.tsx`.
- OpenAI server auth already lives under `server/routes/openai.js`.
- Frontend API URL resolution already goes through `getApiBaseUrl()`.
- The settings and provider UI patterns are established enough to add a
  translation-specific tab without inventing a new navigation model.

The main mismatch is that the existing OpenAI provider uses a WebSocket voice
agent session. It should be treated as a nearby example for lifecycle UI,
status, toasts, and cleanup discipline, not as the protocol implementation for
translation.

## Docs Constraints Checked

Official references checked on 2026-05-11:

- Live translation guide:
  https://developers.openai.com/api/docs/guides/realtime-translation
- Model reference:
  https://developers.openai.com/api/docs/models/gpt-realtime-translate
- WebRTC guide:
  https://developers.openai.com/api/docs/guides/realtime-webrtc
- Release announcement:
  https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/

Implementation constraints that matter here:

- Use `gpt-realtime-translate` on `/v1/realtime/translations`.
- For browser/client media, use WebRTC and
  `/v1/realtime/translations/calls`.
- Create browser client secrets server-side via
  `/v1/realtime/translations/client_secrets`.
- Configure target output language with `session.audio.output.language`.
- Use `gpt-realtime-whisper` only when source-language transcript deltas are
  needed.
- Do not plan around custom prompts, tool calls, fixed output voice selection,
  `response.create`, or assistant turn state for translation.
- Keep an original-audio mix or ducking option because same-language or
  mixed-language segments may intentionally produce silence.

## Ranked Assets

| Rank | Asset                                                                                                   | Immediate value   | Use it for                                                                                                                                  | Do not copy                                                              |
| ---- | ------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | `EXAMPLE/openai-cookbook-realtime-translation/.../livekit-translation-demo/lib/realtime-translation.ts` | Highest           | React hook shape, `RTCPeerConnection`, data-channel event handling, translated audio playback, subtitle extraction, live `session.update`   | Next.js path assumptions and LiveKit-specific source-track lookup        |
| 2    | `EXAMPLE/openai-cookbook-realtime-translation/.../browser-translation-demo/`                            | Highest           | Browser tab capture, `/translations/calls` SDP flow, `getDisplayMedia()` constraints, audio mix, diagnostics, smoke/unit tests              | Vanilla DOM structure and demo-specific UI                               |
| 3    | `EXAMPLE/LinguaForge/yt-translate-poc/`                                                                 | High              | Express token route hardening, loopback-origin ideas, session timers, silence timeout, transcript Markdown export, local testing discipline | Limited target-language set, Korean-only UI, single HTML file structure  |
| 4    | `EXAMPLE/open-realtime-translate/`                                                                      | Medium-high       | Subtitle overlay segmentation, closed shadow DOM, Chrome tab capture/offscreen constraints, MV3 security separation                         | Extension-only architecture and API-key-in-extension storage             |
| 5    | `EXAMPLE/mtg-realtime-translator/app.py`                                                                | Medium            | Raw WebSocket mechanics, 24 kHz PCM chunks, local VAD lessons, silence-tail behavior, device-switch ideas                                   | Browser implementation path and unsupported output languages in its list |
| 6    | Official cookbook `twilio-translation-demo/`                                                            | Medium for future | Server-side WebSocket bridge, one translation session per direction, Twilio audio format conversion, supported language validation          | First in-app browser tab                                                 |
| 7    | `EXAMPLE/twilio-live-translation-openai-realtime-api/`                                                  | Low for this tab  | Older Twilio Media Streams plumbing and call-center operational shape                                                                       | Its generic Realtime prompt-based translation model                      |

## Best Source Details

### 1. Official React WebRTC Sidecar

Best files:

- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation.ts`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/lib/realtime-translation-config.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/app/api/realtime/translation-token/route.ts`

Why it is the best base:

- It is already React-shaped and isolates translation into a reusable hook.
- It accepts a `MediaStreamTrack`, which lets this repo support both microphone
  translation and browser-tab translation with the same hook.
- It uses the dedicated translation WebRTC call endpoint.
- It handles `session.input_transcript.delta`,
  `session.output_transcript.delta`, `session.output_audio.delta`, and
  `session.updated`.
- It has a clean supported-language list matching the 13 target output
  languages.

Adaptation needed:

- Replace Next.js API route assumptions with `getApiBaseUrl()` calls into
  Express.
- Convert config helpers to TypeScript under `src/lib/openaiTranslation.ts`.
- Decide whether the first version supports `mic`, `tab audio`, or both. The
  hook should support any source track either way.

### 2. Official Browser Tab Translation Demo

Best files:

- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/session.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/capture-options.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/audio-mix.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/test/`

Why it matters:

- It is the closest official example to "new tab in our app translates another
  browser tab."
- It shows `getDisplayMedia()` options that request tab audio and
  `suppressLocalAudioPlayback` where supported.
- It explicitly uses WebRTC rather than hand-sending PCM from browser code.
- It includes small tests for language validation, server behavior, capture
  options, audio mix clamping, and smoke coverage.

Adaptation needed:

- Keep its media and protocol flow, but rebuild the UI in this app's React
  style.
- Keep audio mix controls. They are important for mixed-language source audio.
- Use this as the main basis for browser-tab capture.

### 3. LinguaForge

Best files:

- `EXAMPLE/LinguaForge/yt-translate-poc/server.js`
- `EXAMPLE/LinguaForge/yt-translate-poc/public/index.html`
- `EXAMPLE/LinguaForge/yt-translate-poc/test/server.test.js`
- `EXAMPLE/LinguaForge/README.md`

Why it matters:

- It is the closest shape to this repo's Express plus browser runtime.
- The server code forwards only the short-lived client secret and strips extra
  response data.
- It adds concrete session safety controls: max session duration, silence
  timeout, tab-ended stop, abort controller, and transcript Markdown export.
- Its tests are a good model for route-level coverage in this project.

Adaptation needed:

- Expand the language list from its PoC subset to the full 13 OpenAI output
  languages.
- Translate the single-page DOM implementation into React state/components.
- Reuse the idea of not forwarding raw OpenAI response bodies back to the
  browser.

### 4. open-realtime-translate

Best files:

- `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`
- `EXAMPLE/open-realtime-translate/src/background/service-worker.ts`
- `EXAMPLE/open-realtime-translate/src/content/subtitle.ts`
- `EXAMPLE/open-realtime-translate/src/shared/languages.ts`

Why it matters:

- It is the cleanest non-official browser sidecar implementation.
- The subtitle overlay uses a shadow DOM and segment trimming, which is useful
  if translation should overlay external pages.
- It documents practical product limitations: tab-only capture, no prompts,
  no glossary, no fixed output voice, silence for already-target-language
  speech.

Why it is not the main base:

- Chrome extension offscreen documents, service workers, tabCapture stream IDs,
  and extension storage are not this app's architecture.
- This repo already has a backend, so API keys should stay server-side rather
  than in extension-local storage.

### 5. mtg-realtime-translator

Best file:

- `EXAMPLE/mtg-realtime-translator/app.py`

Why it matters:

- It exposes raw WebSocket translation mechanics very clearly.
- It captures the important operational lesson that the translation endpoint is
  continuous-audio based and does not accept a normal manual commit flow.
- Its local VAD plus silence-tail approach is useful if this product later
  builds a backend/raw-audio bridge.

Why it is not the first implementation:

- OpenAI docs recommend WebRTC for browser media.
- This project is a web app, not a PySide desktop sidecar.
- Its output language list includes languages outside the 13 target languages
  currently documented for `gpt-realtime-translate`; do not copy that list.

### 6. Twilio Assets

Best direct endpoint files:

- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/realtime-translation.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/room.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/languages.js`
- `EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/twilio-translation-demo/src/security.js`

Older adjacent sample:

- `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/StreamSocket.ts`
- `EXAMPLE/twilio-live-translation-openai-realtime-api/src/services/AudioInterceptor.ts`

Why it matters:

- The official Twilio demo is the best future reference for telephony or
  server-side media.
- It demonstrates one translation session per direction and target language
  based on the listener, not the speaker.
- It has Twilio request signature and caller allow-list patterns.

Why it is not the first implementation:

- The requested feature is an app tab, not a phone bridge.
- The older Twilio sample predates `gpt-realtime-translate` and uses generic
  Realtime prompts. Treat it as media-stream plumbing only.

## Recommended Implementation Shape

Add a separate provider/tab, for example `openai-translation`, instead of
folding translation into the existing `openai` voice-agent provider.

Suggested backend route:

- Add `POST /api/openai/translation-session` in `server/routes/openai.js`.
- Validate `targetLanguage` against the 13 supported output languages:
  `es`, `pt`, `fr`, `ja`, `ru`, `zh`, `de`, `ko`, `hi`, `id`, `vi`, `it`, `en`.
- Call `https://api.openai.com/v1/realtime/translations/client_secrets`.
- Request:

```json
{
  "session": {
    "model": "gpt-realtime-translate",
    "audio": {
      "input": {
        "transcription": { "model": "gpt-realtime-whisper" },
        "noise_reduction": { "type": "near_field" }
      },
      "output": { "language": "es" }
    }
  }
}
```

- Return only a normalized shape such as
  `{ "clientSecret": "...", "expiresAt": 1234567890, "targetLanguage": "es" }`.
- Add the route to the existing token rate limiter.
- Add `OpenAI-Safety-Identifier` on the server-side OpenAI request once this
  app has a stable hashed user/session identifier.

Suggested frontend modules:

- `src/lib/openaiTranslation.ts`
  - supported languages
  - constants for call endpoint and model
  - target-language validation
  - `buildSessionUpdate()`
- `src/hooks/useOpenAITranslation.ts`
  - adapted from the official LiveKit `useRemoteTranslation`
  - accepts `sourceTrack`, `targetLanguage`, `sourceTranscriptionEnabled`,
    `noiseReductionEnabled`, `translatedVolume`
  - owns `RTCPeerConnection`, `RTCDataChannel`, translated `<audio>` element,
    transcript state, cleanup
- `src/components/providers/OpenAITranslationProvider.tsx`
  - status, start/stop, source selector, language selector, audio mix,
    subtitles, export button
- `src/components/conversation/TranslationTranscriptPanel.tsx`
  - two-channel transcript display for source and translated text

Suggested tab wiring:

- Add a new `ProviderType` value.
- Add a `PROVIDERS` entry gated by `VITE_OPENAI_TRANSLATION_ENABLED`.
- Add a `Languages`-style lucide icon in `ProviderTab`.
- Add provider switching cleanup in `Index.tsx`.
- Reuse `OPENAI_API_KEY`; do not require a second OpenAI secret.

## Initial UX Scope

For the first version, build one of these scopes:

Preferred scope:

- Source mode: `Microphone` and `Browser tab`.
- Target language selector.
- Start/stop control.
- Translated audio playback.
- Original/translated mix slider for browser-tab source.
- Source transcript toggle.
- Translated transcript panel.
- Markdown export.
- Clear status and error states.

Smaller MVP:

- Browser-tab source only.
- Target language selector.
- Start/stop.
- Translated audio and translated captions.
- Original/translated mix.

Avoid for the first version:

- Prompt editor.
- Voice selector.
- Function calling.
- Assistant chat transcript.
- Tool execution.
- Backend raw-audio WebSocket bridge.
- Telephony/LiveKit room fanout.

## Test Plan To Copy

Backend tests:

- Missing `OPENAI_API_KEY` returns a clear 500.
- Unsupported language returns 400 before calling OpenAI.
- OpenAI error status/message maps cleanly.
- Successful OpenAI response is sanitized before returning to browser.
- Token route is rate-limited with existing token limiter.

Frontend/unit tests:

- Supported language list contains exactly the 13 documented output languages.
- Audio mix clamps to 0..100 and computes original/translated volumes.
- Hook cleanup closes data channel, peer connection, source track, and audio
  element.
- Realtime event parser appends source and translated deltas correctly.

E2E smoke:

- Translation tab renders when enabled.
- Start button is disabled while connecting.
- Browser without `getDisplayMedia` gets a useful error.
- Switching tabs stops any active translation session.

## Decision

Use the official cookbook React/WebRTC hook and browser-tab demo as the primary
source. Use LinguaForge as the secondary source for Express hardening and
product controls. Keep `open-realtime-translate`, `mtg-realtime-translator`, and
Twilio assets as pattern references for later variants.

The first implementation should be a dedicated translation tab, not a mode
inside the existing OpenAI voice-agent tab.
