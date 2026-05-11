# Voice-Agent-PuPuPlatter - UX Requirements Document

**Companion to**: [PRD.md](PRD.md)
**Created**: 2026-05-11
**Folded source**: 2026-05-11 frontend UI/UX design audit and resolved PRD decisions, incorporated into Sections 1-16

---

## 1. Design Brief

### Emotional Targets

Calm authority + cinematic focus + operational confidence.

The interface should feel premium and demo-ready, but the user should never have to guess whether a provider is configured, whether audio is working, or what state the current session is in.

### Aesthetic Identity

- **Reference domain**: Recording studio control room and scientific audio instrument.
- **Era / movement**: Contemporary cinematic dashboard with restrained Swiss-style information hierarchy.
- **Material metaphor**: Smoked glass over warm metal, with amber signal light and subtle acoustic motion.

The existing "Acoustic Noir" direction is the design baseline. Future frontend work should preserve the dark cinematic cockpit while adding denser operational surfaces where the product has outgrown a single-provider demo. The product is intentionally dark-only until a future PRD designs and validates a complete light theme.

### Signature Moment

The main shareable moment should be an active live session view where the voice orb, transcript, audio meter, elapsed timer, provider/model/voice metadata, and diagnostics all communicate "this session is alive" at a glance. The screenshot-worthy element is not another decorative background; it is a coherent live voice control surface.

### Micro-Narrative

Arrival -> Orientation -> Readiness -> Live Session -> Artifact.

On arrival, the user sees the selected provider and whether it is ready. During orientation, they can switch providers, inspect setup, and confirm audio. During readiness, the interface makes permission, device, provider, and transport state explicit. During the live session, provider navigation recedes and call controls become primary; switching providers requires ending or explicitly confirming cleanup of the active session. After the session, the current transcript and metadata become copyable/exportable artifacts rather than persistent local history.

---

## 2. User Flows

### Flow 1: Start A Voice Provider Demo

**Trigger**: User opens the app for a quick demo or mobile test.
**Goal**: Start a configured voice conversation with the selected provider.

```text
Open app --> Review active provider --> Readiness check --> Start session
     |                 |                       |
     |                 |                       v
     |                 |                Setup required
     |                 v                       |
     |          Switch provider <--------------+
     v
Active session --> End session --> Transcript/artifact actions
```

**Happy path**: The active provider is configured, microphone access is granted, session creation succeeds, and the app enters the active conversation layout.
**Error states**: Missing provider config, denied microphone permission, token/session route failure, WebSocket/WebRTC failure, reconnect failure, and provider-specific SDK errors.

### Flow 2: Resolve Provider Setup

**Trigger**: User selects an unconfigured or unhealthy provider, or starts a provider that is blocked.
**Goal**: Understand exactly what is missing and fix or bypass the issue.

```text
Select provider --> Readiness state --> Setup panel
                                |          |
                                |          v
                                |    Editable setting or read-only env status
                                |          |
                                v          v
                           Re-check --> Ready or still blocked
```

**Happy path**: The user sees required variables/settings, understands what is configured server-side, copies safe `.env` guidance when needed, saves editable values where supported, and the provider moves to ready.
**Error states**: Save failure, invalid API key shape, unavailable backend route, disabled feature flag, and provider configured externally with no browser-editable fields.

### Flow 3: Active Conversation Control

**Trigger**: A voice provider session is connected.
**Goal**: Monitor and control the session without losing context.

```text
Connected --> Listening/thinking/speaking loop --> End session
     |                  |                         |
     v                  v                         v
Diagnostics      Transcript grows          Export/copy/clear
```

**Happy path**: User can see provider, model/voice, connection state, elapsed time, audio activity, transcript count, and end-session controls in one stable live-session surface.
**Error states**: Reconnecting, no remote audio, no mic input, stale transcript, failed stop cleanup, cancelled provider-switch confirmation, and provider-switch cleanup failure.

### Flow 4: OpenAI Live Translation Session

**Trigger**: User opens the dedicated OpenAI Translation tab described in the functional PRD.
**Goal**: Translate browser-tab or microphone audio with live translated audio and transcripts.

```text
Open Translation tab --> Choose source --> Choose target language --> Start
          |                  |                    |                 |
          v                  v                    v                 v
Unsupported API       Permission prompt      Language validation   WebRTC connect
                                                                  |
                                                                  v
Translated audio + transcript --> Stop --> Export Markdown
```

**Happy path**: User selects browser-tab capture for listen-along translation or microphone capture for quick tests/fallback, chooses a supported output language, receives translated audio, sees transcript deltas, stops cleanly, and exports the current session.
**Error states**: Unsupported `getDisplayMedia`, missing audio track, permission denial, token route failure, invalid target language, SDP exchange failure, WebRTC connection failure, data-channel failure, and source track ending.

### Flow 5: Review And Export Session Artifacts

**Trigger**: User ends a voice or translation session, or wants to preserve demo notes.
**Goal**: Turn transient interaction into a usable artifact.

```text
Session ended --> Review transcript --> Choose action
                                      |-- Copy transcript
                                      |-- Download Markdown
                                      |-- Download JSON metadata
                                      \-- Clear transcript
```

**Happy path**: Export includes provider, model or voice where available, start time, end time, duration, end reason, target language where relevant, and transcript content.
**Error states**: Empty transcript, export failure, clear confirmation cancelled, and transcript unavailable because the current in-memory session was cleared or the page reloaded.

### Flow 6: Diagnose A Failed Demo

**Trigger**: A session does not start, audio is silent, or the transcript does not update.
**Goal**: Debug from the UI without opening browser devtools first.

```text
Failure observed --> Open diagnostics --> Inspect status
                                      |-- Mic permission/input level
                                      |-- Provider endpoint/token route
                                      |-- WebSocket/WebRTC/data channel
                                      |-- Last event/error
                                      \-- Reconnect attempts
```

**Happy path**: User can identify whether the problem is permission, configuration, transport, provider API, or UI state.
**Error states**: Diagnostics cannot reach backend health, provider does not expose enough metadata, or active session cleanup leaves stale diagnostics.

---

## 3. Screen Inventory

| Screen                        | Route/Path                  | Purpose                                    | Key Components                                                                                 |
| ----------------------------- | --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Provider Cockpit              | `/`                         | Main multi-provider voice demo surface     | Header, provider selector, provider landing, settings action, background effects               |
| Provider Landing              | `/` state                   | Pre-call view for selected provider        | Provider headline, readiness state, voice/model selector, start CTA, setup prompt              |
| Active Voice Session          | `/` state                   | Live conversation workspace                | Voice orb, live session dock, transcript panel, diagnostics entry, end action                  |
| OpenAI Translation Landing    | `/` provider state          | Dedicated translation entry point          | Browser-tab and microphone source selector, target language selector, readiness row, start CTA |
| Active Translation Session    | `/` provider state          | Live translation workspace                 | Translated audio, source/translated transcript, audio mix, elapsed time, stop action           |
| Settings / Provider Readiness | Dialog                      | Configure and inspect providers            | Provider tabs/details, editable settings, read-only env status, diagnostics, save/cancel       |
| Diagnostics Panel             | Dialog or collapsible panel | Troubleshoot live media and provider state | Mic permission, input meter, endpoint health, transport status, last event/error               |
| Transcript Artifacts          | Panel actions               | Preserve current session output            | Copy, Markdown export, JSON export, clear confirmation                                         |
| Mobile Provider Menu          | Mobile shell                | Replace wrapping provider tabs             | Active provider summary, provider picker, setup indicators                                     |
| Error / Setup Required State  | Inline state                | Explain blocked actions                    | Missing config details, recovery CTA, docs/settings link                                       |

---

## 4. Navigation Structure

```text
App Shell (/)
|-- Header
|   |-- Brand
|   |-- Active provider summary
|   |-- Provider picker
|   \-- Settings
|-- Provider surface
|   |-- Provider landing
|   |-- Active voice session
|   \-- Active translation session
|-- Settings dialog
|   |-- Provider readiness
|   |-- Provider-specific configuration
|   \-- Diagnostics
\-- Current transcript/session artifacts
```

**Navigation pattern**: Single-page cockpit with provider selection as the primary pre-call navigation. Do not add a persistent dashboard home in the current PRD. Add dashboard-grade surfaces inside the cockpit: readiness matrix, diagnostics, active-session metadata, and current-session artifacts.

**Deep linking**: Not required by the current PRD. If added later, provider tabs and the translation provider should be linkable without persisting secret or session data in the URL.

**Provider selection requirements**:

- Desktop must show all providers clearly or expose a first-class provider menu with the active provider visible.
- Mobile must not wrap provider tabs over content. Use a compact menu, sheet, or single-row non-wrapping control.
- Provider entries must expose readiness status: ready, setup required, disabled, error, or checking.
- During an active session, provider entries are secondary controls. Selecting a different provider must open an explicit "end current session and switch" confirmation before cleanup and navigation.

---

## 5. Interaction Patterns

### Forms

- Validation: Use inline validation for editable provider settings and on-submit validation before save.
- Error display: Place field-level errors near the field, and provider-level errors in the readiness panel.
- Success feedback: Use a quiet success state inside the dialog plus a toast only when the action affects the wider app.
- Save behavior: Settings must distinguish Save, Cancel, Reset, and Close. A button labeled "Save" must persist changes.

### Provider Readiness

- Every provider must resolve to one shared readiness model.
- Blocked providers must render setup/readiness UI before a call CTA.
- Providers configured only by server environment variables should show read-only readiness, required variable names, docs links, and copyable `.env` example snippets with placeholder values rather than fake editable fields.
- Disabled providers should remain discoverable only if useful for demos; otherwise they should be hidden from the primary picker.

### Live Session Controls

- Active sessions require a persistent dock or control bar with provider, model/voice, connection state, elapsed time, transport state, selected audio input/output, and end-call action.
- Start, stop, and end controls must be disabled based on a shared session state machine.
- Provider switching during an active session must never happen silently. The provider picker should be visually de-emphasized or disabled; if the user selects another provider, show a confirmation that ends the current session, runs cleanup, and then switches.

### Session State Machine

Use one provider-agnostic UI state model across all providers:

- `setup_required`
- `checking`
- `ready`
- `requesting_audio`
- `creating_session`
- `connecting_transport`
- `listening`
- `thinking`
- `speaking`
- `reconnecting`
- `ended`
- `error`

Each state controls CTA labels, disabled controls, status color, toast behavior, screen-reader status, and end reason.

### Modals/Dialogs

- Settings and diagnostics can be dialogs on desktop.
- On mobile, settings must fit inside the viewport without horizontal clipping and should use full-width sheet behavior if needed.
- Destructive actions such as clearing transcripts or resetting provider settings require confirmation.
- Toasts must not compete with modal focus.

### Loading States

- Use explicit status copy for provider readiness, token/session creation, audio permission, transport connection, and reconnecting.
- Avoid generic spinners as the only feedback for real-time session startup.
- Translation startup should expose each major step: capture request, client secret creation, SDP exchange, WebRTC connect, audio ready.

### Notifications

- Use toasts for transient global events such as provider switched, settings saved, session ended, and export complete.
- Use inline banners for persistent blocked states such as setup required, disabled provider, permission denied, or unsupported browser API.
- Diagnostics should record the latest event/error even after the toast disappears.

### Transcript Actions

- Conversation and translation panels must support copy transcript, download Markdown, download JSON metadata, and clear with confirmation for the current in-memory session.
- Translation transcript should distinguish source and translated text where both are available.
- Transcript panels should retain `role="log"` and polite live-region behavior.
- Do not persist transcript/session history beyond the current page session by default. A future opt-in history feature needs a functional PRD update, privacy copy, retention rules, and explicit user control.

---

## 6. Motion and Animation Strategy

### Philosophy

Motion should communicate voice activity, state transitions, and spatial focus; it must not obscure status or run continuously for users who prefer reduced motion.

### Entrance Choreography

- Page load: Keep the existing cinematic fade/slide language, but avoid delaying access to provider readiness and start controls.
- Provider switch: Animate provider content with short cross-fade/position shifts while preserving focus and active provider status.
- Dialog entry: Settings and diagnostics should open quickly with predictable focus placement.

### Interaction Feedback

- Hover states: Use restrained amber/violet glow, border lift, and surface contrast changes.
- Click/tap responses: Use press states on voice controls and icon buttons; do not rely on scale changes alone.
- Focus rings: Keep focus visible and on-brand with high-contrast amber or warm-white outlines.
- Voice activity: Orb, waveform, and meter animation should reflect actual session/audio state where possible.

### Scroll-Driven Moments

The main app is a cockpit, not a landing page. Avoid scroll-driven storytelling as a primary interaction. Use scroll only inside bounded panels such as transcripts, diagnostics, and settings.

### Animation Constraints

- Target locked 60fps.
- Test performance-sensitive views under CPU throttling.
- Maximum 3 simultaneous decorative animations per viewport region.
- All Framer Motion and CSS animations must respect one shared reduced-motion policy.
- Reduced motion should use subtle opacity, color, or static state changes rather than removing all feedback.
- Avoid continuous background and orb motion when reduced motion is requested.

---

## 7. Layout Philosophy

### Composition Approach

Use a spacious cinematic composition before a call and a denser instrument-panel composition during a call. The product should move from immersive demo mode into operational control mode as soon as a live session begins.

### Visual Hierarchy

- Scale contrast: Large provider identity and voice controls before a call; compact metadata and controls during a call.
- Negative space: Generous on desktop landing states, tighter in active sessions and mobile states.
- Section rhythm: Stable header, stable live-session dock, bounded transcript/diagnostics panels.

### Section Transitions

Use soft cross-fades and surface transitions between provider landing, setup-required, and active-session states. Do not let fixed navigation overlap the current provider surface.

---

## 8. Responsive Strategy

| Breakpoint   | Target       | Layout Approach                                                                                                                             |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `< 640px`    | Mobile       | Single-column cockpit with compact provider menu, full-width settings sheet, non-overlapping controls, and thumb-friendly start/end actions |
| `640-1024px` | Tablet       | Two-zone layout with provider/session controls above transcript or diagnostics; avoid desktop tab assumptions                               |
| `> 1024px`   | Desktop      | Cinematic landing layout before calls; denser side-by-side session workspace during calls                                                   |
| `> 1440px`   | Wide desktop | Use width for provider visibility, diagnostics, transcript, and session metadata rather than empty padding                                  |

**Approach**: Adaptive. Preserve the cinematic identity, but redesign navigation and active-session density per context.

**Touch targets**: Minimum 44x44px for all provider tabs/menu items, settings buttons, session controls, transcript actions, and dialog controls.

**Viewport requirements**:

- `390x844`: Provider navigation must not cover the ElevenLabs widget or any provider landing controls.
- `768x1024`: Settings and diagnostics must fit without horizontal clipping.
- `1440x1000`: Provider discovery must not depend on tiny scroll arrows for most providers.
- Wide desktop: Active session should use additional width for useful diagnostics, not only centered content.

---

## 9. Accessibility

**Target**: WCAG 2.1 AA.

- Keyboard navigation: Provider picker, settings, voice controls, transcript actions, and diagnostics must be fully keyboard reachable.
- Screen reader: Use semantic buttons, named icon buttons, `role="log"` for transcripts, polite live regions for new transcript/status updates, and assertive announcements only for blocking errors.
- Color contrast: Meet WCAG AA for text on dark/glass surfaces, including secondary labels, disabled text, status pills, and diagnostics.
- Focus management: Dialogs must trap focus, return focus to the invoking control, and avoid background toasts competing with modal content.
- Reduced motion: Use a shared reduced-motion strategy for Framer Motion and CSS animation, including background effects, hero elements, voice orb effects, provider transitions, and loading states.
- Touch accessibility: Mobile controls must remain reachable without overlap from fixed headers or provider navigation.
- ARIA correctness: Do not use `aria-pressed` on non-toggle CTAs. Use pressed/selected/busy states only when they match actual behavior.

---

## 10. Design System

### Color Architecture

- **Dominant surface** (60%): Near-black noir canvas for focus and cinematic depth.
- **Secondary surfaces** (25%): Translucent glass panels, muted charcoal, and warm dark gradients.
- **Accent** (10%): Amber as the primary system accent, used sparingly for active state, focus, and primary calls to action.
- **Signal colors** (5%): Provider status and health colors for ready, warning, error, reconnecting, and disabled states.

Palette character: Warm, synthetic, quiet, premium.

Provider-specific colors may appear in metadata, icons, and subtle status accents, but they should not fragment the shared product identity.

### Theme Policy

The current product is dark-only. Do not expose light/dark/system theme controls or claim theme support until light mode is designed, implemented, and tested across provider surfaces, dialogs, transcripts, diagnostics, and embedded-provider edge cases.

### Typography

- **Display font**: Cormorant Garamond for brand and large cinematic provider moments.
- **Body font**: Outfit for readable UI, labels, dialog content, and dashboard panels.
- **Monospace**: JetBrains Mono for status labels, diagnostics, session IDs, timers, and technical metadata.
- **Scale ratio**: Use restrained modular steps for dashboard surfaces; reserve hero-scale type for landing states.
- **Minimum body size**: 16px mobile, 18px desktop where space allows.

### Spacing Scale

Use the existing Tailwind/shadcn spacing rhythm with explicit stable dimensions for fixed-format controls:

`4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px`

Provider nav, voice controls, icon buttons, transcript headers, meters, and diagnostics rows must have stable dimensions so labels, status, and hover states do not shift layout.

### Elevation and Depth

Depth should come from layered glass, subtle borders, shadow softness, and signal glow. Avoid nested cards. Use framed surfaces only for repeated items, dialogs, transcript panels, and diagnostics panels.

### Texture and Atmosphere

Keep subtle film grain, warm glows, and acoustic motion as background atmosphere. Decorative effects must remain secondary to readiness, live session state, and transcript readability.

---

## 11. Component Patterns

| Component                    | Used In                   | Behavior                                                                                             |
| ---------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Provider Picker              | Header/mobile shell       | Shows active provider, readiness state, and provider list without overlap                            |
| Provider Landing             | Provider surface          | Shows provider identity, setup state, voice/model options, and start CTA                             |
| Readiness Panel              | Provider landing/settings | Shows configured state, required settings/env vars, safe `.env` guidance, health, and blocked action |
| Voice Orb Button             | Landing/active session    | Reflects ready/listening/thinking/speaking/error states with accessible labels                       |
| Live Session Dock            | Active voice/translation  | Shows provider, model/voice, elapsed time, transport state, controls, and audio status               |
| Conversation Panel           | Active voice session      | Displays transcript log, message count, empty state, and transcript actions                          |
| Translation Transcript Panel | Active translation        | Displays source/translated lines, latest caption, clear/export actions                               |
| Diagnostics Panel            | Settings/active session   | Shows mic permission, input level, route health, transport state, last event/error                   |
| Settings Dialog              | App shell                 | Provides save/cancel/reset and provider-specific editable or read-only settings                      |
| Audio Meter                  | Readiness/active session  | Shows real input level from browser audio where available                                            |
| Status Pill                  | Header/panels             | Encodes ready/checking/blocked/error/reconnecting/active states                                      |
| Export Menu                  | Transcript panels         | Offers copy, Markdown download, JSON download, and clear with confirmation for the current session   |

---

## 12. Anti-Patterns to Avoid

- Do not add more visual polish before fixing navigation, readiness, settings persistence, and diagnostics.
- Do not let provider tabs wrap over content on mobile or hide most providers behind unclear scroll affordances on desktop.
- Do not present "READY" unless configuration, feature flag, backend health, and required browser capability checks support it.
- Do not duplicate provider UI layouts per provider when shared primitives can keep status, spacing, and controls consistent.
- Do not use decorative motion as a substitute for real audio/session state.
- Do not create a generic admin dashboard that erases the existing Acoustic Noir identity.
- Do not add a visible theme toggle until the app has a complete, tested light theme.
- Do not persist transcripts or session history in localStorage by default.
- Do not expose editable controls for settings that are actually server-only environment configuration.

---

## 13. Folded Audit Evidence

This section preserves the durable findings from the 2026-05-11 frontend UI/UX audit so the original audit file can be removed without losing useful product or implementation context.

### Audit Scope

The audit covered frontend design, UI, UX, dashboard behavior, responsive layout, accessibility posture, maintainability, source code, existing docs, and rendered app behavior at desktop `1440x1000` and mobile `390x844`.

### Executive Summary

The project already has a strong visual direction: a cinematic dark "Acoustic Noir" voice cockpit with amber accents, glass panels, animated voice orbs, provider tabs, and transcript/status surfaces. The look is distinctive and appropriate for a voice AI demo platform.

The main gap is product structure. The UI grew from a focused ElevenLabs experience into an 8-provider platform without a matching information architecture. It still behaves like a single-screen demo, not a scalable dashboard. The most urgent issues are responsive provider navigation, settings/configuration parity, actual settings persistence, and provider-surface duplication.

Highest-priority audit findings:

1. Mobile layout is broken for the default ElevenLabs widget: the 8-provider tab block wraps into three rows and overlaps the widget language selector and top content.
2. Desktop provider navigation is too narrow: only about two of eight providers are visible at `1440px`, so provider discovery depends on small scroll arrows.
3. The settings dialog does not persist OpenAI/xAI edits from the modal path; the footer says "Save & Close" but only closes.
4. Settings and diagnostics cover only ElevenLabs, OpenAI, and xAI, while the main app exposes eight providers.
5. Provider setup/empty states exist in code but are not wired into the main landing flow for most providers, so unconfigured providers can still look "READY".
6. The frontend has major duplicated provider UI logic, making visual consistency and UX fixes unnecessarily expensive.

### Current Product Shape

The app is not yet a traditional analytics or admin dashboard. It is currently a single-page multi-provider voice demo cockpit:

- Fixed top brand header.
- Fixed provider tab selector.
- One provider-specific landing state.
- One active-conversation state per provider.
- Settings modal for a subset of provider configuration.
- Toast notifications for provider switching and connection status.

That focus is useful for demos, but the product now claims support for eight providers. The next frontend step should stay a single-page cockpit while adding dashboard-grade readiness, diagnostics, configuration coverage, and current-session transcript affordances inside that cockpit. A separate persistent dashboard home and recent-session history are out of scope for the current functional PRD.

### Visual Design System Baseline

The design system is concentrated in [src/index.css](../../src/index.css:1). It defines the "Acoustic Noir" palette, typography, glass effects, glow utilities, film grain, gradients, motion utilities, scrollbars, focus states, and reduced-motion CSS fallback.

Strengths:

- Near-black base, amber primary accent, soft violet secondary accent, and warm white text create a coherent premium voice-product mood.
- Typography pairing is deliberate: Cormorant Garamond for display, Outfit for UI/body, JetBrains Mono for status labels.
- Voice-specific visual language is clear: orb, rings, waveform, pulsing dots, and status colors.
- Radix primitives, lucide icons, and shadcn-style components give a solid accessibility and interaction foundation.
- Active conversation surfaces include important operational cues: connection status, visualizer, transcript panel, and end-call affordance.

Risks:

- The ElevenLabs embedded widget introduces a bright white card that clashes with the dark design system.
- Several secondary labels are low contrast on the dark/noir background, especially after overlays, blur, and animated backgrounds stack.
- Provider accent colors are inconsistent: provider hero text uses provider-specific colors, but the active provider tab remains amber for every provider.
- The current design is more immersive demo than dashboard. It lacks dense provider health, readiness, active-session logs, cost, latency, or current-session transcript management.

### UI Architecture Observations

The main page is doing too much. [src/pages/Index.tsx](../../src/pages/Index.tsx:367) owns the fixed shell, provider switching, connection toasts, every provider's pre-call layout, every active-call layout, settings dialog mounting, and error toast. At audit time it was 1,347 lines.

Provider components also repeat large blocks of voice-button, status, selector, empty-state, and reconnection UI. At audit time, the provider files plus the shared `VoiceButton` were almost 6,000 lines:

```text
1347 src/pages/Index.tsx
 809 src/components/providers/OpenAIProvider.tsx
 806 src/components/providers/XAIProvider.tsx
 655 src/components/providers/VapiProvider.tsx
 599 src/components/providers/RetellProvider.tsx
 876 src/components/providers/GeminiProvider.tsx
 555 src/components/providers/UltravoxProvider.tsx
 297 src/components/voice/VoiceButton.tsx
```

This duplication is already visible in the UX: provider pages are mostly similar, but each has slightly different wording, colors, status behavior, and disconnect handling. Shared primitives such as `ProviderLanding`, `VoiceOrbButton`, `ProviderStatusBar`, and `ActiveConversationLayout` should reduce drift.

### First Load Findings

The first load lands on the ElevenLabs widget by default. The dark app shell and background feel premium, but the external widget creates a visually separate product inside the product. On desktop this is acceptable for a demo. On mobile it becomes a layout conflict because fixed provider tabs sit on top of the widget.

The default provider always falls back to `elevenlabs` in [ProviderContext](../../src/contexts/ProviderContext.tsx:37), without choosing the first available provider if `elevenlabs` is disabled. That can produce a confusing empty/default state in env configurations where another provider is enabled first.

### Provider Selection Findings

Provider tabs are implemented with Radix Tabs in [ProviderTabs](../../src/components/tabs/ProviderTabs.tsx:127). The component has good keyboard semantics and 44px touch targets via [ProviderTab](../../src/components/tabs/ProviderTab.tsx:141).

The problem is layout capacity. The tab wrapper is fixed at `max-w-md` in [Index.tsx](../../src/pages/Index.tsx:430). In the rendered desktop audit pass:

- The tablist width was 368px.
- Its scroll width was 993px.
- Only `ElevenLabs Widget` and `ElevenLabs SDK` were fully visible.
- `xAI` was only partially visible.
- OpenAI, Ultravox, Vapi, Retell, and Gemini were fully hidden until scrolling.

On mobile, the list wraps into three rows. That makes all providers visible, but the tab block becomes a large fixed overlay at the top of the page and covers underlying provider content.

### Provider Landing Findings

The non-widget provider landing pages are clear and consistent:

- Large provider-specific headline.
- Short explanatory line.
- Optional voice selector.
- Large orb button.
- "READY" status label.
- Start instruction text.

This is strong for a demo. The issue is that these pages do not consistently verify backend/provider configuration before presenting "READY". Empty-state components and configuration hooks exist, for example [OpenAIEmptyState](../../src/components/providers/OpenAIProvider.tsx:748), but the main `Index.tsx` provider branches render the normal start UI directly.

### Active Conversation Findings

The active conversation state is conceptually solid. It includes:

- Listening/speaking heading.
- Main voice control.
- Status panel.
- Visualizer when available.
- Transcript panel.
- End conversation action.

The transcript panel has a good accessible foundation: `role="log"`, `aria-live="polite"`, and a screen-reader announcement for new messages in [ConversationPanel](../../src/components/conversation/ConversationPanel.tsx:48). The empty transcript copy is understandable.

The main improvement is density and persistence. Once a conversation is active, the UI still feels like a centered demo rather than a dashboard workspace. There is no side panel for provider details, call/session metadata, latency, current model, selected voice, or transcript export.

### Settings Findings

The settings modal has a good visual structure on desktop: header, provider tabs, provider panel, connection diagnostics, and footer. It uses Radix Dialog in [ConfigurationDialog](../../src/components/settings/ConfigurationDialog.tsx:100).

Critical settings issues:

- The modal only exposes ElevenLabs, OpenAI, and xAI tabs, despite eight providers in the main selector. See [ConfigurationDialog tabs](../../src/components/settings/ConfigurationDialog.tsx:86).
- Diagnostics only list ElevenLabs, OpenAI, and xAI. See [providerStatuses](../../src/components/settings/ConfigurationDialog.tsx:93).
- `saveSettings` is not imported or called by `ConfigurationDialog`; `handleClose` only invokes `onClose`. See [imports](../../src/components/settings/ConfigurationDialog.tsx:11) and [handleClose](../../src/components/settings/ConfigurationDialog.tsx:81).
- The footer label changes to "Save & Close" when `hasChanges` is true, but [SettingsFooter](../../src/components/settings/SettingsFooter.tsx:30) only calls `onClose`.
- On mobile, the dialog uses `w-full max-w-lg mx-4` while fixed and centered, which creates horizontal overflow/clipping at a 390px viewport. See [ConfigurationDialog content classes](../../src/components/settings/ConfigurationDialog.tsx:107).

### Responsive Findings

Desktop has strong negative space and a polished dark ambiance. Provider content sits comfortably in the center or left hero area. The biggest desktop issue is discoverability: the provider nav is visually too small for eight providers.

The active tab also scrolls into view in a way that leaves adjacent tabs clipped. In the OpenAI desktop pass, "SDK" was partially visible at the left edge of the tab viewport. That makes the selector feel like a carousel fragment, not stable navigation.

Mobile needs focused work. In the rendered mobile pass:

- The provider tab panel occupies three rows.
- It overlays the default ElevenLabs widget.
- It obscures the widget language selector area.
- The default white widget nearly fills the viewport, leaving the app shell feeling cramped.
- The settings modal clips horizontally because its width plus margins exceed the viewport.

The README claims "Mobile-First" support, but the rendered layout does not meet that bar for the primary default provider.

### Accessibility And Motion Findings

Working baseline:

- Radix Tabs and Dialog provide strong baseline semantics.
- Icon-only settings button has `aria-label`.
- Voice buttons expose useful `aria-label`, `aria-pressed`, and `aria-busy` states.
- Transcript uses live-region patterns.
- Global CSS includes a `prefers-reduced-motion` media query.

Needs attention:

- Framer Motion animations in `BackgroundEffects`, `HeroSection`, and many provider components do not all consult `useReducedMotion`. CSS reduced-motion rules do not reliably stop JS-driven Framer animations. See [BackgroundEffects continuous motion](../../src/components/BackgroundEffects.tsx:27) and [HeroSection animated decorative elements](../../src/components/HeroSection.tsx:136).
- The hero CTA sets `aria-pressed="false"` statically in [HeroSection](../../src/components/HeroSection.tsx:70), even though it is not a toggle.
- Mobile fixed overlays create focus and reading-order risk because navigation visually covers provider content while DOM content continues underneath.
- Toasts remain visible while the settings dialog is open, adding competing status information behind/around the modal.

### Dashboard Readiness Gap

Without the following surfaces, the app is best described as a polished multi-provider voice demo, not yet a dashboard:

- Provider readiness matrix: enabled, configured, backend health, required env vars, last checked.
- Active session summary: provider, model, voice, connection status, elapsed time, reconnect state.
- Transcript management: export, copy, clear, and current-session metadata.
- Operational diagnostics: token/session endpoint health, WebSocket/WebRTC status, permissions, audio device status.
- Cost/latency indicators where provider APIs expose enough data.
- Settings coverage for all eight providers.

---

## 14. Objective Improvements From EXAMPLE Repos

The local example set summarized in [EXAMPLE/README.md](../../EXAMPLE/README.md:12) includes the official OpenAI browser and LiveKit translation demos, `open-realtime-translate`, `LinguaForge`, `mtg-realtime-translator`, and the Twilio live translation sample.

The examples do not provide a stronger visual direction than this app. Most are deliberately utilitarian prototypes. Their value is objective UX structure: visible session state, media diagnostics, device readiness, transcript artifacts, and transport-aware controls. Those are measurable improvements for this app's dashboard/frontend surface.

### Live Session Control Dock

The official browser demo separates the interface into a status card, control dock, audio meters, diagnostics, transcript, and event log. Evidence: session status and control dock in [browser demo HTML](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/index.html:20), audio meters in [browser demo HTML](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/index.html:78), and diagnostics list in [browser demo HTML](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/index.html:97).

Objective improvement: replace the active-call centered demo layout with a persistent live session dock. At minimum it should show provider, model/voice, connection state, elapsed time, transport state, selected audio input/output, and start/stop/end-call actions. This fills the dashboard gap without changing the Acoustic Noir visual system.

### Shared Session State Machine

`LinguaForge` has a concrete state model with `idle`, `requesting-capture`, `creating-session`, `connecting`, `translating`, `ended`, and `error`, plus disabled controls tied to state in [LinguaForge index.html](../../EXAMPLE/LinguaForge/yt-translate-poc/public/index.html:243) and [setState](../../EXAMPLE/LinguaForge/yt-translate-poc/public/index.html:271). Its start flow moves through user-visible steps in [startSession](../../EXAMPLE/LinguaForge/yt-translate-poc/public/index.html:611). The OpenAI browser demo also exposes step-by-step startup states in [app.js](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js:48).

Objective improvement: define one provider-agnostic UI state machine for all providers instead of each provider showing slightly different `READY`, loading, listening, speaking, and error language. The recommended states are documented in Section 5.

### Media Diagnostics And Audio Health

The official browser demo logs WebRTC connection state, ICE/data channel state, remote audio track count, transcript deltas, and last event in [app.js](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js:100). It also runs a real input meter from `AudioContext` in [app.js](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/browser-translation-demo/src/public/app.js:217). `LinguaForge` adds session timers, silence timeout, max session timeout, and cleanup paths in [index.html](../../EXAMPLE/LinguaForge/yt-translate-poc/public/index.html:488).

The MTG desktop example reinforces the same pattern with explicit `status_changed` and `mic_level` signals in [app.py](../../EXAMPLE/mtg-realtime-translator/app.py:267), then renders those into a status dot and mic-level progress bar in [app.py](../../EXAMPLE/mtg-realtime-translator/app.py:678) and [app.py](../../EXAMPLE/mtg-realtime-translator/app.py:746).

Objective improvement: add a diagnostics panel visible from settings and optionally collapsible during calls. It should show mic permission, input level, provider token/session endpoint status, WebRTC/WebSocket state, reconnect attempts, last event type, last error, transcript count, and remote audio availability.

### Pre-Call Device Readiness Lobby

The LiveKit example does not start directly into a call. It presents preview/readiness UI, media toggles, device selectors, and a join form before connection. Evidence: preview shell and error state in [LiveKit conference](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/components/conference/livekit-video-conference.tsx:690), mic/camera controls in [LiveKit conference](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/components/conference/livekit-video-conference.tsx:724), and device selectors in [LiveKit conference](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/components/conference/livekit-video-conference.tsx:780).

Objective improvement: before any provider call CTA becomes primary, show a compact readiness row or setup panel with microphone permission, selected input device, selected speaker/output if supported, provider configuration status, and a quick input-level pulse.

### Active-Call Control Priority

The LiveKit in-call surface uses a bottom control bar with translation picker, mic/speaker device popovers, camera controls, leave action, and copy link action in [ConnectedMeeting](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/components/conference/livekit-video-conference.tsx:1170). Its detailed translation panel uses bounded viewport sizing in [TranslationPanel](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/components/conference/livekit-video-conference.tsx:1736).

Objective improvement: during active calls, provider switching should become secondary and session controls should be primary. A bottom or side control bar would avoid the current fixed provider-tabs overlay problem and scale better on mobile.

### Transcript Actions And Session Artifacts

`LinguaForge` exports a Markdown transcript with start time, end time, duration, target language, end reason, and transcript in [buildMarkdown](../../EXAMPLE/LinguaForge/yt-translate-poc/public/index.html:706). Its main UI exposes a Markdown download button alongside start/stop/language/status/elapsed controls in [index.html](../../EXAMPLE/LinguaForge/yt-translate-poc/public/index.html:189). The current [ConversationPanel](../../src/components/conversation/ConversationPanel.tsx:61) only shows a title and message count.

Objective improvement: add transcript actions to copy transcript, download Markdown, download JSON with provider/model/session metadata, and clear with confirmation. Preserve only the current in-memory session by default; rely on explicit export for anything durable.

### Provider Setup And Secret Readiness UX

`open-realtime-translate` gates start behind a configured API key, validates the key shape, shows configured/not-configured pills, and switches into key editing when start is attempted without configuration in [Popup.tsx](../../EXAMPLE/open-realtime-translate/src/popup/Popup.tsx:54) and [Popup.tsx](../../EXAMPLE/open-realtime-translate/src/popup/Popup.tsx:110). The Twilio sample documents required and optional environment variables in a setup table in [Twilio README](../../EXAMPLE/twilio-live-translation-openai-realtime-api/README.md:61).

Objective improvement: turn settings into a provider readiness wizard. For each provider, show required variables/settings, current configured state, transport health, safe copyable `.env` snippets with placeholder values, and the exact blocked action. If a provider is externally configured, expose read-only setup status and docs links rather than pretending it has the same editable fields as OpenAI/xAI.

### Caption/Subtitles Mode

`open-realtime-translate` renders live captions in a Shadow DOM overlay so host page CSS cannot affect it, with separate source/target text, segment timeout, fade timeout, and max text length in [subtitle.ts](../../EXAMPLE/open-realtime-translate/src/content/subtitle.ts:1). LiveKit passes source and translated subtitle text into meeting tiles in [TranslatedMeetingTile](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/components/conference/livekit-video-conference.tsx:1579).

Objective improvement: if this app keeps pursuing translation/captioning, add a demo-friendly caption mode that floats the current utterance above the main UI or inside the active conversation surface. This is lower priority for a pure voice-agent cockpit, but valuable if the product direction includes live translation.

### Theme Capability Exposure

The LiveKit example includes a visible light/dark/system theme group in its header in [app-header.tsx](../../EXAMPLE/openai-cookbook-realtime-translation/examples/voice_solutions/realtime_translation_guide/livekit-translation-demo/components/app-header.tsx:76). This app already has theme infrastructure but no mounted control in the main shell.

Objective improvement: keep the app dark-only for now and remove theme support from product claims until a complete light/dark/system implementation is designed and tested.

### Example-Derived Priority Impact

The examples strengthen the case that the next frontend phase should prioritize operational UX over additional visual polish:

1. Shared session state machine.
2. Live session dock with elapsed time, provider/model/voice, and start/stop controls.
3. Media diagnostics and input-level meter.
4. Pre-call provider/audio readiness.
5. Transcript copy/export/current-session artifact actions.
6. Provider setup wizard covering all eight providers.

---

## 15. Prioritized UX Findings

### P0: Mobile Provider Navigation Breaks The Default Experience

Evidence: fixed provider tabs in [Index.tsx](../../src/pages/Index.tsx:430), wrapping behavior in [ProviderTabs](../../src/components/tabs/ProviderTabs.tsx:159), and rendered mobile inspection at `390x844`.

Impact: the first viewport is visually incoherent on mobile, and the default provider widget is partially covered.

Recommendation: replace the mobile tab block with a compact provider select/menu or horizontally scrollable single-row segmented control. Reserve vertical space for the fixed control or make the provider switcher part of the normal document flow.

### P0: Settings Modal Does Not Save Modal Edits

Evidence: `ConfigurationDialog` imports `loadSettings`, `resetAllSettings`, and `getDefaultSettings`, but not `saveSettings` in [ConfigurationDialog](../../src/components/settings/ConfigurationDialog.tsx:11). `handleClose` only calls `onClose` in [ConfigurationDialog](../../src/components/settings/ConfigurationDialog.tsx:81). `SettingsFooter` only receives `onClose` and `onReset` in [SettingsFooter](../../src/components/settings/SettingsFooter.tsx:4).

Impact: users can change OpenAI/xAI voice or prompt in the modal path, see "Save & Close", and still lose those changes.

Recommendation: add explicit save/cancel behavior. Call `saveSettings(settings)` on save, reset `hasChanges` after success, and distinguish "Close" from "Cancel" when there are unsaved edits.

### P1: Provider Navigation Is Not Scalable On Desktop

Evidence: `max-w-md` wrapper in [Index.tsx](../../src/pages/Index.tsx:430), plus rendered desktop metrics showing a 368px tablist for 993px of tab content.

Impact: users cannot see most supported providers without scrolling, despite the provider set being the core product promise.

Recommendation: use a wider desktop nav, group providers by type, or switch to a provider command menu/select with a visible active-provider summary. If tabs remain, make them a real full-width top bar or two-row non-overlapping control.

### P1: Settings And Diagnostics Cover Only Three Of Eight Providers

Evidence: settings tabs and diagnostics arrays in [ConfigurationDialog](../../src/components/settings/ConfigurationDialog.tsx:86).

Impact: the most important operational surface is incomplete. Vapi, Ultravox, Retell, and Gemini users have no consistent place to inspect or adjust setup from the UI.

Recommendation: drive settings tabs and diagnostics from the same provider metadata used by the main provider selector. Providers can expose read-only dashboard links when configuration is external.

### P1: Setup States Are Not Integrated Into The Main Provider Flow

Evidence: provider-specific empty states and `use*Configured` hooks exist, but `Index.tsx` renders provider landing UIs directly. Example unused empty state: [OpenAIEmptyState](../../src/components/providers/OpenAIProvider.tsx:748).

Impact: unconfigured or unhealthy providers can look ready until the user clicks, which increases failed starts and support burden.

Recommendation: each provider branch should use a unified readiness check and render a setup/diagnostic state before showing the call CTA.

### P1: Provider UI Duplication Creates Design Drift

Evidence: repeated voice button sizing, rings, status labels, "Talk to" landing blocks, and "End conversation" controls across `Index.tsx` and provider files.

Impact: every design fix needs to be repeated. It also creates inconsistent status language, colors, and connection handling.

Recommendation: extract provider-agnostic layout primitives:

- `ProviderLanding`
- `ActiveConversationLayout`
- `VoiceOrbButton`
- `ProviderVoiceSelector`
- `ProviderStatusPanel`
- `EndConversationButton`

Provider modules should supply metadata, hooks, and special capability slots rather than whole duplicated screens.

### P2: Theme Capability Should Stay Internal

Evidence: `ThemeProvider` wraps the app, and `ThemeToggle` exists, but the main shell only renders settings. Search found no mounted `ThemeToggle`.

Impact: docs claim dark/light support, but the product direction is an intentionally dark Acoustic Noir cockpit and the current light-mode surface is not validated.

Recommendation: keep the user-facing app dark-only, remove dark/light/system claims from product copy, and do not expose a theme toggle until a future PRD defines a complete light-mode pass.

### P2: Motion System Needs A Single Reduced-Motion Strategy

Evidence: `ProviderTabs` uses `useReducedMotion`, but `BackgroundEffects`, `HeroSection`, and provider components contain continuous Framer Motion animations without the same guard.

Impact: motion-sensitive users may still get rotating or pulsing effects even when they prefer reduced motion.

Recommendation: create a shared motion policy hook and apply it to background effects, decorative hero animations, voice orb effects, and provider transitions.

---

## 16. Recommended Frontend Implementation Sessions

These session concepts are candidates for future `plansession` runs. Each should be reconciled against the current phase and task budget before implementation.

### Session 1: Responsive Shell And Provider Navigation

Goal: make provider selection clear and non-overlapping on desktop and mobile.

Tasks:

- Replace `max-w-md` provider tab shell with responsive layout.
- Mobile: use a provider dropdown/sheet or a single-row horizontal control that does not wrap over content.
- Desktop: show all providers or provide a clear overflow menu with active provider summary.
- Add viewport-specific visual tests for `390x844`, `768x1024`, `1440x1000`, and wide desktop.

### Session 2: Settings And Provider Readiness

Goal: make setup, diagnostics, and save behavior trustworthy.

Tasks:

- Add real save/cancel behavior to `ConfigurationDialog`.
- Add all provider tabs or read-only provider detail panels.
- Wire `use*Configured` checks into provider landing states.
- Render provider empty states before call CTAs.
- Add tests for modal save persistence.

### Session 3: Provider UI Component Extraction

Goal: reduce duplicated provider screens and prevent UX drift.

Tasks:

- Extract shared landing and active-conversation layouts.
- Extract shared voice orb button styling with provider color tokens.
- Move provider metadata into a single typed configuration layer.
- Keep provider-specific audio and SDK logic isolated.

### Session 4: Accessibility, Contrast, And Motion Pass

Goal: align the polished visual system with accessibility requirements.

Tasks:

- Apply reduced-motion handling to Framer Motion animations.
- Remove static `aria-pressed` from non-toggle CTAs.
- Review contrast of secondary labels, disabled text, and glass panels.
- Ensure toasts do not compete with modal focus.
- Add keyboard/focus regression tests for provider switching and settings.

### Session 5: Cockpit Operational Surfaces

Goal: keep the single-page demo cockpit while adding dashboard-grade operational surfaces.

Tasks:

- Add provider readiness matrix.
- Add active-session metadata and current-session transcript actions.
- Add diagnostics for audio permission, API health, and backend routes.
- Add current provider detail panel with voice/model/config links.

### Bottom Line

The app has a strong visual identity and a credible voice-demo interaction model. The next frontend work should be structural: fix responsive navigation, make settings reliable, expose provider readiness with safe setup guidance, consolidate duplicated provider UI, and add cockpit-level operational surfaces without creating a separate persistent dashboard home. Those changes will make the existing dark-only Acoustic Noir design system feel intentional at eight-provider scale instead of stretched beyond its original single-provider shape.
