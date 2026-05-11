# External Subtitle Overlay Assessment

## Status and Recommendation

Status: assessment document, no runtime implementation.

Initial recommendation: defer an external subtitle overlay companion. The
current browser translation MVP already ships in-app latest captions,
transcript rows, translated audio playback, original/translated audio mix, and
Markdown export. A cross-site overlay would add a separate browser-extension or
sidecar product surface with higher privacy, permission, CSP, accessibility,
compatibility, and support burden.

This session does not add a Chrome extension, content script, offscreen
document, service worker, sidecar process, browser injection path, arbitrary
website overlay, new route, provider SDK, persistent transcript store, or
runtime UI change.

## Sources and Revalidation

This assessment is based on local repository code, local documentation, and the
local `open-realtime-translate` reference copy. Before any implementation
session, a future maintainer must re-check current browser-extension platform
documentation, OpenAI Realtime Translation documentation, Chrome Manifest V3
limits, tab capture requirements, offscreen document behavior, and target
browser support.

No live OpenAI API call, Chrome extension build, content-script injection,
browser automation, or provider account setup was required for this session.

## Local References Reviewed

Current app references:

- `src/components/providers/OpenAITranslationLatestCaption.tsx`
- `src/components/conversation/TranslationTranscriptPanel.tsx`
- `src/components/providers/OpenAITranslationProvider.tsx`
- `src/components/providers/OpenAITranslationExportControls.tsx`
- `src/components/providers/OpenAITranslationAudioMixControls.tsx`
- `src/components/providers/OpenAITranslationAudioPlayer.tsx`
- `src/hooks/useOpenAITranslation.ts`
- `src/hooks/useOpenAITranslationSource.ts`
- `src/hooks/useOpenAITranslationSessionTimer.ts`
- `src/lib/openaiTranslation.ts`
- `src/types/openai-translation.ts`
- `docs/SECURITY.md`
- `.spec_system/SECURITY-COMPLIANCE.md`
- `docs/ongoing-projects/raw-audio-bridge-spike.md`
- `docs/ongoing-projects/room-telephony-translation-architecture.md`

Reference extension assets reviewed as patterns only:

- `EXAMPLE/open-realtime-translate/README.md`
- `EXAMPLE/open-realtime-translate/manifest.json`
- `EXAMPLE/open-realtime-translate/src/content/subtitle.ts`
- `EXAMPLE/open-realtime-translate/src/background/service-worker.ts`
- `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts`
- `EXAMPLE/open-realtime-translate/src/shared/messages.ts`
- `EXAMPLE/open-realtime-translate/src/shared/languages.ts`

Reference usage constraints:

- Treat `open-realtime-translate` as evidence for possible overlay structure,
  not as code to copy into this application.
- Do not copy its extension-local API-key storage model. This app keeps
  `OPENAI_API_KEY` only on the server and returns browser-safe client secrets
  through the existing backend route.
- Do not copy extension routing, content-script injection, popup UI, or
  offscreen WebRTC ownership into the shipped app path.

## Scope and Non-Goals

In scope:

- Compare the current in-app caption and transcript experience with future
  overlay options.
- Identify privacy, permission, storage, CSP, API-key custody, accessibility,
  compatibility, lifecycle, and cleanup constraints.
- Recommend build, defer, or reject for a future external overlay companion.
- Keep follow-up work small enough for a later 2-4 hour spec session if the
  product chooses to proceed.

Out of scope:

- No Chrome extension is shipped.
- No content script is shipped.
- No offscreen document is shipped.
- No service worker is shipped.
- No arbitrary website injection is shipped.
- No extension-local OpenAI API key storage is recommended.
- No persistent raw audio, transcript text, provider payload, cookie,
  authorization header, SDP body, client secret, or API key store is added.
- No runtime route, provider tab, hook, component, or browser automation is
  added.

## Current In-App Caption and Transcript Baseline

The shipped OpenAI Translation tab is the baseline for any future overlay. It
keeps capture, playback, transcripts, export, and errors inside the app instead
of injecting UI into third-party pages.

Current runtime shape:

- `POST /api/openai/translation-session` validates the target language and
  creates a browser-safe client secret with the server-held `OPENAI_API_KEY`.
- `useOpenAITranslationSource` captures microphone or browser-tab audio after
  the user chooses a source and starts translation.
- `useOpenAITranslation` owns the `RTCPeerConnection`, source audio senders,
  `oai-events` data channel, SDP exchange, translated remote stream,
  transcript parsing, abort controller, and cleanup.
- `OpenAITranslationProvider` coordinates start/stop, provider-switch teardown,
  max-session auto-stop, diagnostics, source mode, target language, audio mix,
  translated audio playback, original browser-tab playback, latest caption,
  transcript panel, and Markdown export.

Caption baseline:

- `OpenAITranslationLatestCaption.tsx` renders the newest translated display
  entry when one exists.
- The caption region uses `role="status"`, `aria-live="polite"`, and
  `aria-atomic="true"` so updates are announced without requiring focus.
- Empty states distinguish active listening from idle waiting.
- The displayed text uses wrapping and scrolling inside a bounded caption
  surface rather than floating over arbitrary website content.

Transcript baseline:

- `TranslationTranscriptPanel.tsx` renders source and translated entries from
  `getOpenAITranslationTranscriptDisplayEntries`.
- Rows include stream labels, partial/final status labels, wrapped transcript
  text, and per-row accessibility labels.
- The transcript list uses `role="log"`, `aria-live="polite"`, and
  `aria-relevant="additions text"`.
- Auto-scroll follows new entries unless the user has scrolled away from the
  bottom.
- Clear requires a confirmation state, blocks duplicate clear actions while
  in-flight, restores focus after completion, and surfaces a visible failure
  message if clearing fails.

Export and playback baseline:

- `OpenAITranslationExportControls.tsx` exports only when transcript entries
  exist, blocks duplicate export while in-flight, reports success, and exposes a
  visible failure path.
- `buildOpenAITranslationTranscriptMarkdown` exports metadata and transcript
  rows to a local Markdown download through browser `Blob` and object URL APIs.
- `OpenAITranslationAudioPlayer.tsx` attaches the translated remote stream to a
  browser audio element, clears `srcObject` on cleanup, and reports playback
  errors.
- For browser-tab capture, `OpenAITranslationAudioMixControls.tsx` lets the
  user balance original and translated streams in the app. Microphone capture
  does not expose original-tab mixing because there is no tab audio source.

Cleanup and re-entry baseline:

- Duplicate starts are rejected while a start is active, while runtime status is
  busy, or while a connected session already exists.
- Stop is serialized through `stopPromiseRef`.
- Runtime cleanup aborts pending client-secret or SDP requests, closes the data
  channel, removes source senders, closes the peer connection, stops owned media
  tracks, clears remote audio, and resets resource refs.
- Provider switch uses the `stopRef` handoff to stop translation with the
  `provider-switch` reason.
- Session re-entry resets transcripts, playback errors, pending starts, audio
  mix, source state, and session metadata before starting again.

Any overlay companion has to improve on this baseline without weakening it. A
future overlay that only duplicates the latest-caption card outside the app is
not enough to justify extension permissions, cross-site support load, or
privacy review.

## Overlay Architecture Options

The options below are future architecture choices only. None are shipped by
this session.

| Option                           | Shape                                                                                                                        | Advantages                                                                                                                                                       | Costs and Risks                                                                                                                                                                    | Recommendation                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| No build                         | Keep the current in-app latest-caption and transcript surfaces as the only caption UX.                                       | Zero new permissions, no cross-site injection, keeps current cleanup and privacy model.                                                                          | Does not help users who want captions directly over third-party video or meeting tabs.                                                                                             | Keep as default shipped posture.                                           |
| In-app floating captions         | Add a movable or docked caption layer inside the existing React app only.                                                    | Lowest implementation risk, no extension permissions, reuses existing hook, transcript state, server route, and accessibility model.                             | Still requires users to keep this app visible or side-by-side with source media.                                                                                                   | Best first follow-up if overlay value is validated.                        |
| Browser extension content script | Inject a subtitle overlay into the active tab and receive caption events through extension messaging.                        | Captions can appear directly over the source page. The `open-realtime-translate` content script shows useful segment trimming and shadow DOM isolation patterns. | Requires extension distribution, permissions, consent text, page compatibility testing, iframe/fullscreen handling, navigation handling, and failure states for unsupported pages. | Defer until product need is stronger than the in-app path.                 |
| Offscreen document               | Use a hidden extension document to own WebRTC, audio playback, and media APIs that MV3 service workers cannot host.          | Matches the extension reference pattern when the extension captures tab audio through `chrome.tabCapture`. Separates WebRTC from the service worker.             | Moves media lifecycle outside the current React app, needs MV3 lifecycle handling, reconnect behavior, tab permission checks, and a new cleanup controller.                        | Required only if building a real extension that captures tab audio itself. |
| Shadow DOM isolation             | Render the overlay inside a shadow root so host-page CSS and overlay CSS have limited bleed.                                 | Useful for cross-site CSS isolation; `open-realtime-translate` uses a closed shadow root for subtitle rendering.                                                 | Does not solve CSP, iframe, fullscreen, z-index, focus, accessibility, or user-consent problems. Closed shadow DOM can make debugging and accessibility review harder.             | Treat as one tool, not a complete architecture.                            |
| Companion sidecar                | Run an optional local, desktop, or backend sidecar that receives caption events and renders an always-on-top caption window. | Avoids arbitrary webpage DOM injection and can support non-browser media in the future.                                                                          | Adds installation, OS-level windowing, update, auth, local network, and privacy review burden. Could blur the raw-audio sidecar boundary documented in prior sessions.             | Reject for current MVP; revisit only for a separate desktop product.       |

Recommended evolution path:

1. Keep no-build as the default.
2. If users need more caption prominence, prototype only an in-app floating
   caption surface inside the existing translation tab.
3. Consider a browser extension only after the product accepts extension
   distribution, permission, consent, and compatibility obligations.
4. Do not start with arbitrary website injection or a sidecar. Those options
   have higher support and privacy cost than the problem currently justifies.

Pattern reuse from `open-realtime-translate`:

- Reuse conceptually: tagged message contracts, segment trimming, idle/listening
  states, offscreen ownership for extension WebRTC, and CSS isolation through a
  shadow root.
- Do not reuse directly: extension-local OpenAI API key storage, broad content
  script injection, automatic source-page audio mutation, popup settings as the
  primary consent surface, or extension lifecycle assumptions inside this React
  app.

## Server Boundary, Permissions, and Storage Constraints

API-key custody:

- Keep `OPENAI_API_KEY` only on the server.
- Do not store a raw OpenAI API key in extension local storage, browser local
  storage, IndexedDB, cookies, page globals, content scripts, sidecar config
  files, logs, screenshots, support bundles, or exported transcripts.
- A future extension companion must call this app's backend or a dedicated
  backend broker to mint short-lived translation client secrets.
- The broker must validate target language, source type, session duration,
  caller authorization if accounts exist later, and rate-limit state before it
  mints a client secret.
- Browser-facing code may receive only browser-safe session fields. It must not
  receive the provider API key, raw upstream response body, authorization
  header, SDP body in logs, or internal server error details.

Client-secret and message routing:

- Current app path: React app calls `POST /api/openai/translation-session`,
  receives a short-lived client secret, exchanges SDP from the browser, and
  keeps transcript events in app memory.
- Future extension path: popup or content script should not mint secrets
  directly. A background worker may request a client secret from the app backend
  only after explicit user action and source permission checks.
- Future offscreen document path: the offscreen document may own WebRTC and
  playback, but it should receive only the specific stream ID, client secret,
  target language, and correlation ID required for that session.
- Future content script path: content scripts should receive sanitized caption
  events and stable session state only. Do not route raw audio, client secrets,
  provider payloads, cookies, authorization headers, SDP, or full error bodies
  through content script messages.
- All message contracts should be tagged by `type`, reject unknown mutation
  requests, and include one idempotent stop/cleanup path.

Permission minimization:

- Request capture only after the user presses a start control.
- Prefer `activeTab` or a single explicit tab target over broad host
  permissions.
- Avoid all-sites content-script injection by default. If cross-site injection
  is approved later, document each match pattern and why it is necessary.
- Treat tab audio, microphone audio, transcript text, target language, page
  title, URL, and failure category as privacy-relevant.
- Provide a visible stop control wherever captions are visible, including popup
  and overlay surfaces.

Storage constraints:

- Store no raw audio, transcript text, provider payload, cookie, authorization
  header, SDP body, client secret, or API key by default.
- Keep transcript rows session-local unless a future PRD adds retention,
  consent, deletion, export, and operator controls.
- If user settings are stored later, limit them to non-secret preferences such
  as target language, caption size, caption position, reduced-motion setting,
  and enabled/disabled state.
- If a future extension stores preferences, include a migration and erasure
  story before release.

Backend boundary prerequisites for any future overlay:

- Shared-store or platform-level rate limiting must replace process-local-only
  limits before multi-instance overlay traffic is allowed.
- CORS, CSP, frame, and permissions-policy changes must be validated against the
  exact future browser surfaces.
- Server logs must stay sanitized: request ID, route, target language, status
  category, timing, and result are acceptable; raw content and secrets are not.
- Error responses must use stable categories and must not expose stack traces,
  internal paths, upstream bodies, API keys, client secrets, or provider
  account metadata.

## Accessibility and UX Constraints

Caption readability:

- Provide user-controlled caption size with a bounded minimum and maximum.
- Preserve readable line length, wrapping, and overflow behavior for long
  captions.
- Maintain high contrast against video, bright pages, and dark pages.
- Avoid text shadows or backdrops that make characters blurry at small sizes.
- Support left-to-right and right-to-left text. Mixed-language captions must
  avoid clipping or reversing label order.
- Include source and translated language labels when both lines are visible.

Keyboard and focus:

- Every interactive overlay control must be reachable by keyboard.
- Provide a visible focus indicator that remains visible over host content.
- The overlay must not trap focus unless it opens a modal settings surface.
- If a settings surface is opened, return focus to the invoking control when it
  closes.
- Provide keyboard-operable hide, show, pause, stop, and settings controls.
- Do not rely on hover-only controls for stop or privacy-sensitive actions.

Live-region and announcements:

- Use a polite live region for caption updates unless user testing proves
  assertive announcements are necessary.
- Avoid announcing every partial token if it causes screen-reader noise.
  Announce stable final segments or throttled summary updates instead.
- Surface connection, listening, stopped, and error states with accessible text,
  not color alone.
- Error text must tell the user what failed and what action is available without
  exposing internal provider details.

Reduced motion and visual stability:

- Respect `prefers-reduced-motion`.
- Avoid animated caption transitions that delay readability.
- If fade-out is used, allow users to keep captions pinned.
- Do not shift page layout. Cross-site overlays should use an isolated fixed
  layer or separate window rather than modifying host document flow.

Hide/show and consent:

- A visible hide/show control is required whenever captions are rendered outside
  the current app.
- A visible stop control is required whenever capture or translation is active.
- First use must explain what is captured, where captions render, what leaves
  the browser, what is not stored, and how to stop.
- If captions appear on a third-party page, the overlay should identify that it
  belongs to this app rather than the host website.

Compatibility with existing app controls:

- The current in-app caption uses `role="status"` and `aria-live="polite"`.
  Future in-app floating captions should preserve that behavior.
- The current transcript uses `role="log"` and source/translated labels.
  Future overlay events should keep the same source/translated vocabulary so
  export, evaluation, and docs stay aligned.
- Any caption settings should reuse app target language names and source mode
  labels instead of introducing a second language model.

## Privacy, Consent, and Retention Guardrails

Privacy posture:

- Treat audio, transcript text, translated text, target language, page title,
  source URL, tab identity, room identity, and failure details as potentially
  personal data.
- Keep current behavior session-local by default. Transcripts may be displayed
  in memory and exported only by explicit user action.
- Do not persist raw audio, transcript text, translated text, provider payloads,
  cookies, authorization headers, SDP bodies, client secrets, API keys, or
  browser capture identifiers by default.
- Do not log raw request bodies, raw upstream bodies, audio chunks, transcript
  rows, caption text, SDP, client secrets, API keys, cookies, authorization
  headers, or provider response bodies.
- Keep observability to sanitized metadata such as request ID, route, source
  mode, target language, state, duration, status category, and error category.

Consent requirements for future overlay work:

- Capture must start only after explicit user action.
- The user must be told whether the source is microphone audio, browser-tab
  audio, or another media source.
- The user must be told where captions will render: inside the app, on a
  third-party page, in an extension popup, or in a sidecar window.
- The user must be told what data leaves the browser and what is not stored.
- The user must have a visible stop control before and during capture.
- If captions render on a third-party page, the overlay must make its app
  origin clear so users do not confuse it with host-page content.

Retention and erasure:

- Default retention is none. Runtime transcript state is in memory and cleared
  by session reset, provider switch, explicit clear, page unload, or app close.
- Markdown export is user-initiated local download. The app does not retain a
  server copy of exported transcripts.
- Persistent history, synced settings, team sharing, evaluation archives, or
  room/call recordings require a new PRD, retention schedule, deletion story,
  and compliance review.
- Any future extension preference storage must separate non-secret preferences
  from session content and must support user-initiated reset.

Local-only review:

- Future evaluation of overlay readability should prefer local fixtures,
  synthetic examples, or user-provided private review sessions.
- Evaluation artifacts must not include raw personal audio, full transcripts,
  page cookies, authorization headers, API keys, client secrets, SDP, or
  provider payloads.
- If user-provided recordings or transcripts are ever used, collect explicit
  consent and define deletion timing before collection starts.

GDPR and compliance posture:

- The current project has no accounts, tenant isolation, billing identity,
  persistent transcript store, or formal data processing agreement.
- Overlay features that capture third-party-page content or meeting audio may
  change the data-protection posture even if this app stores nothing.
- A future implementation must revisit data collection purpose, lawful basis,
  notices, retention, deletion, processor/subprocessor posture, and regional
  transfer requirements before shipping.

## Cross-Site Compatibility Risks

Content security policy and extension limits:

- Host-page CSP can affect injected script behavior, resource loading, style
  injection, font loading, and inline styles depending on extension platform
  behavior and browser version.
- The app's current CSP still has provider compatibility allowances. Overlay or
  companion UI must be validated before tightening CSP further.
- Extension pages, offscreen documents, content scripts, and host pages each
  have different execution contexts. A future implementation must document what
  can communicate with what, which origin owns each message, and which CSP
  applies.

Iframe and embedded media:

- Captions injected into the top document may not appear over cross-origin
  iframes, nested players, or fullscreen iframe content.
- Injecting into every frame increases permission, performance, and privacy
  exposure and should not be assumed safe.
- Meeting platforms may render audio/video in nested iframes, canvas surfaces,
  shadow roots, or rapidly replaced DOM nodes.
- Some pages prevent or obscure overlays through fullscreen APIs, player
  controls, pointer-lock behavior, or custom z-index stacks.

Fullscreen and video overlays:

- A fixed overlay in the document may disappear when the video element enters
  fullscreen.
- Browser extension overlays may need a separate fullscreen strategy, such as
  rendering in the active frame, using picture-in-picture style surfaces, or
  falling back to an extension popup or in-app caption.
- Caption controls must remain discoverable without covering critical player or
  meeting controls.

CSS and layout isolation:

- Shadow DOM isolation helps prevent host-page CSS from styling captions and
  helps keep overlay CSS out of the page.
- Shadow DOM does not eliminate all conflicts. Host transforms, stacking
  contexts, fullscreen behavior, iframes, zoom, forced-colors mode, and browser
  accessibility settings still need testing.
- Overlay CSS must not modify global page styles, body classes, scroll
  behavior, font loading, or layout flow.

Navigation and lifecycle:

- Single-page applications can replace documents, route content, or unmount
  media nodes while a translation session is active.
- Tab navigation, reload, prerender, back/forward cache, suspended tabs, and
  extension reloads must all trigger idempotent cleanup.
- If the active tab changes, future extension behavior must define whether the
  session follows the tab, stops, or stays bound to the original tab.

Browser support:

- Current in-app translation depends on standard browser WebRTC and media
  capture APIs in secure contexts.
- Future extension work would also depend on Manifest V3, `chrome.tabCapture`,
  `chrome.offscreen`, content scripts, extension messaging, and browser-specific
  permission behavior.
- Non-Chrome browsers, enterprise-managed browsers, mobile browsers, incognito
  windows, private browsing, restricted pages, and browser internal pages may be
  unsupported.
- Unsupported states must be visible and recoverable; they must not fail
  silently or leave capture running.

## Lifecycle and Cleanup States

Future overlay lifecycle must keep one authoritative session state and one
idempotent cleanup path. Overlay UI state must not outlive capture, client
secret validity, data channel state, media tracks, timers, or audio playback.

Minimum state model:

| State                      | Meaning                                                                  | Required behavior                                                                                  |
| -------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `idle`                     | No capture, translation, or overlay rendering is active.                 | No media tracks, client secrets, timers, audio streams, or injected captions remain active.        |
| `requesting-permission`    | User has started capture and the browser is asking for source access.    | Stop returns to idle. Duplicate start is ignored or disabled.                                      |
| `requesting-client-secret` | Backend broker is minting browser-safe session material.                 | Abort on stop, navigation, provider switch, or source failure.                                     |
| `connecting`               | WebRTC or future extension/offscreen media session is being established. | Stop closes peer connection attempts, data channels, timers, and capture tracks.                   |
| `listening`                | Source audio, translated audio, and caption events are active.           | Stop is always visible and cleanup is idempotent.                                                  |
| `stopping`                 | Cleanup is in progress.                                                  | Duplicate stop waits for the existing cleanup promise. Start remains disabled.                     |
| `stopped`                  | User or lifecycle ended the session cleanly.                             | Captions may show final stopped state inside app; injected overlays should hide or unmount.        |
| `error`                    | Recoverable or terminal failure happened.                                | Show stable error category, recovery action, and stop/cleanup option without raw provider details. |

In-app floating caption cleanup:

- Reuse the current `useOpenAITranslation` session owner.
- Do not create another capture stack, peer connection, client-secret flow, or
  transcript store.
- Clear timers, animation handles, and local caption segment buffers when the
  translation session stops, provider switches, source ends, or component
  unmounts.
- Reset caption position or settings only when the user chooses reset; do not
  preserve transcript content across sessions by default.

Extension/offscreen/content-script cleanup:

- Service worker or background code owns the high-level session record and must
  serialize start and stop.
- Offscreen document owns WebRTC, translated audio element, source media
  stream, data channel, and remote audio tracks if an extension capture path is
  built later.
- Content script owns only overlay DOM, caption segment buffers, visibility
  timers, and local presentation state.
- Stop must notify the offscreen document, close data channels, close peer
  connections, stop all owned tracks, clear audio element `srcObject`, clear
  object URLs if any, clear caption timers, remove overlay DOM, and broadcast
  idle state.
- Extension suspend, reload, tab close, tab navigation, permission revoke,
  source track ended, peer connection failed, data channel closed, offscreen
  start failed, content script unavailable, and provider errors must all converge
  on the same cleanup path.

Timer and segment cleanup:

- Caption segment timers must be cleared on every new segment, stop, hide,
  unmount, navigation, and error transition.
- Fade timers must respect reduced-motion preferences and must not hide a
  required error or stop control.
- Long captions must be bounded by a documented segment policy such as max
  length, final-segment replacement, or scrollable display.

Translated audio playback cleanup:

- Audio elements must pause, clear `srcObject`, remove fallback `src`, and call
  `load()` on teardown, matching the current in-app pattern.
- Future extension audio must not continue playing after the overlay disappears
  or the content script fails.
- If original tab audio is muted, ducked, or mixed in a future extension, stop
  must restore the user-visible audio state or explain why browser behavior
  prevents restoration.

## Overlay Value Assessment

Value the current app already provides:

- Live latest translated caption with polite announcement behavior.
- Source and translated transcript rows with partial/final status.
- Translated audio playback and browser-tab original/translated mix.
- Session timer and max-session guard.
- User-initiated Markdown export.
- Explicit clear action and no default transcript persistence.
- Diagnostics and visible failure paths for source, backend, SDP, WebRTC, data
  channel, playback, offline, and cleanup failures.
- Provider-switch cleanup and source-ended teardown.

Where an overlay could add value:

- A user can watch a source video or meeting in one tab and see captions over
  that source without arranging windows.
- A caption can stay visible while the user focuses another page.
- A speaker, demo operator, or accessibility reviewer can inspect caption
  placement against the source media itself.
- Future caption style controls could let users choose size, contrast,
  placement, and pinning for reading comfort.
- A future extension could pair tab capture and captions in a single browser
  control surface if extension distribution is accepted.

Where an overlay is not worth building:

- If the goal is only to make captions larger inside the current app, build an
  in-app floating or enlarged caption surface instead.
- If the user is already using split-screen or a second monitor with the current
  translation tab, external injection adds little value.
- If the product cannot support extension permissions, browser store review,
  enterprise browser restrictions, unsupported pages, and cross-site bugs,
  content-script overlays should not ship.
- If the product cannot define consent, retention, deletion, support, and
  incident-response behavior for third-party page content, the overlay should
  not ship.
- If the overlay requires storing raw OpenAI API keys in extension storage, it
  should be rejected for this app.
- If the overlay requires routing normal browser microphone or tab audio
  through a backend raw-audio bridge, it should be rejected for the current
  product path because browser WebRTC already handles that path with less
  server-side exposure.

Decision matrix:

| Question                                                                                            | If yes                                     | If no                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| Do users need captions outside the app window often enough to justify new distribution and support? | Consider a future prototype.               | Keep no-build.                                  |
| Can in-app floating captions solve the same need?                                                   | Build the in-app option first.             | Continue evaluating extension or sidecar value. |
| Can API keys remain server-side with short-lived client secrets only?                               | Continue.                                  | Reject.                                         |
| Can transcript persistence remain off by default?                                                   | Continue.                                  | Defer for privacy PRD.                          |
| Can the team support CSP, iframes, fullscreen, z-index, and unsupported pages?                      | Consider an extension implementation spec. | Defer.                                          |
| Can the overlay meet keyboard, live-region, contrast, reduced-motion, and hide/show requirements?   | Continue.                                  | Defer.                                          |

Net assessment:

The overlay value is real for source-page viewing, but it is not yet stronger
than the added privacy, browser-platform, and support burden. The current app
should not jump directly to a Chrome extension or cross-site overlay. If product
feedback demands more visible captions, the smallest useful step is an in-app
floating caption prototype that reuses the current runtime state.

## Recommendation and Future Scope

Recommendation: defer an external subtitle overlay companion.

Build later:

- Build an in-app floating caption prototype if users need a larger, movable,
  or pinnable caption inside this app.
- Build a browser extension only if product requirements explicitly require
  captions over third-party pages and the team accepts extension distribution,
  browser-store review, permission prompts, cross-site compatibility testing,
  and user-support obligations.
- Build a sidecar only if a separate desktop or operator product is approved.

Defer:

- Defer Chrome extension content-script overlay work.
- Defer offscreen document ownership of WebRTC.
- Defer arbitrary website injection.
- Defer persistent overlay transcripts or shared caption history.
- Defer raw-audio or sidecar media paths unless a future server-owned media PRD
  requires them.

Reject for the current product:

- Reject extension-local raw OpenAI API key storage.
- Reject routing raw transcript text, audio, provider payloads, cookies,
  authorization headers, SDP bodies, client secrets, or API keys through content
  script messages.
- Reject broad host permissions without an explicit site and consent model.
- Reject any implementation that claims external overlays, content scripts,
  offscreen documents, service workers, or arbitrary website injection are
  already shipped.
- Reject moving normal browser microphone or browser-tab translation to a
  backend raw-audio bridge by default.

Prerequisites before any future implementation:

- Re-check current OpenAI Realtime Translation documentation, browser-extension
  platform documentation, Chrome MV3 limits, tab capture behavior, offscreen
  document behavior, and target browser support.
- Decide whether the first prototype is in-app only or a real extension.
- Define consent copy, privacy notice, retention behavior, support boundaries,
  and incident-response triggers.
- Replace or supplement process-local rate limiting if overlay traffic could
  reach multi-instance production.
- Decide whether the backend client-secret broker needs accounts, session
  ownership, room ownership, target-language authorization, or per-user quotas.
- Define exact permission list, match patterns, unsupported page behavior, and
  extension storage policy if extension work is approved.
- Define accessibility acceptance criteria for keyboard operation, focus return,
  live-region cadence, contrast, reduced motion, hide/show, and stop controls.

Small future 2-4 hour scope if approved:

- Session objective: add an in-app floating caption prototype only.
- Reuse `useOpenAITranslation` and existing transcript display entries.
- Add a floating caption component inside the current translation tab.
- Add size, pin/unpin, and hide/show controls inside the app.
- Preserve current latest-caption live-region behavior and transcript export.
- Add focused component tests for rendering, keyboard controls, hide/show,
  reduced motion class behavior if applicable, and cleanup on unmount.
- Do not add extension files, content scripts, offscreen documents, service
  workers, new routes, persistent stores, or browser automation.

Small future extension assessment scope if the product still wants cross-site
captions after the in-app prototype:

- Session objective: write a dedicated extension implementation PRD and threat
  model.
- Define MV3 components, permissions, match patterns, message contract, backend
  client-secret broker contract, unsupported page matrix, cleanup state machine,
  accessibility acceptance criteria, and store/release plan.
- Do not implement the extension in the assessment session.

Unproven assumptions:

- Users may not need captions over third-party pages once in-app floating
  captions are available.
- Browser-store review and enterprise browser policies may block or slow an
  extension companion.
- Shadow DOM may not be enough for fullscreen, iframe, and meeting-platform
  compatibility.
- Existing process-local limits may be insufficient for extension traffic.
- Caption readability requirements may require more user settings than the
  current app exposes.
- Privacy review may require accounts, consent records, or deletion workflows
  before any persistent overlay history can exist.

## Future Test Strategy

This assessment should remain covered by offline documentation validation only.
Future implementation tests would need a separate PRD and should not be inferred
from this assessment-only session.
