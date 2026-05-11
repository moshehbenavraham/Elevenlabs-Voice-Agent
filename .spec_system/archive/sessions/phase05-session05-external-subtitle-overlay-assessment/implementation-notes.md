# Implementation Notes

**Session ID**: `phase05-session05-external-subtitle-overlay-assessment`
**Started**: 2026-05-12 02:38
**Last Updated**: 2026-05-12 03:22

---

## Session Progress

| Metric              | Value   |
| ------------------- | ------- |
| Tasks Completed     | 16 / 16 |
| Estimated Remaining | 0 hours |
| Blockers            | 0       |

---

### Task T001 - Review current in-app translation baseline

**Started**: 2026-05-12 02:38
**Completed**: 2026-05-12 02:39
**Duration**: 1 minute

**Notes**:

- Reviewed `OpenAITranslationLatestCaption.tsx` for latest-caption live region behavior, status labels, and empty/listening states.
- Reviewed `TranslationTranscriptPanel.tsx` for source/translated row rendering, clear confirmation, in-flight clear guard, focus restoration, and failure path.
- Reviewed `src/types/openai-translation.ts`, `src/lib/openaiTranslation.ts`, and `src/hooks/useOpenAITranslation.ts` for transcript shapes, export payload contracts, duplicate-start prevention, abort handling, cleanup, remote audio, and provider re-entry behavior.
- Reviewed `docs/SECURITY.md`, `.spec_system/SECURITY-COMPLIANCE.md`, `docs/ongoing-projects/raw-audio-bridge-spike.md`, and `docs/ongoing-projects/room-telephony-translation-architecture.md` for current privacy, CSP, process-local rate limit, no-persistence, and future-only architecture posture.

**Files Changed**:

- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T001 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded reference review.

### Task T002 - Review open-realtime-translate patterns

**Started**: 2026-05-12 02:39
**Completed**: 2026-05-12 02:40
**Duration**: 1 minute

**Notes**:

- Reviewed `EXAMPLE/open-realtime-translate/README.md` for MV3 architecture, tab capture, offscreen WebRTC ownership, service-worker routing, and content-script subtitle overlay claims.
- Reviewed `EXAMPLE/open-realtime-translate/src/content/subtitle.ts` for shadow DOM isolation, fixed overlay host, segment trimming, fade timers, and state labels.
- Reviewed `EXAMPLE/open-realtime-translate/src/background/service-worker.ts` for active-tab capture, offscreen document lifecycle, message routing, and extension-local API-key custody that this app must not copy.
- Reviewed `EXAMPLE/open-realtime-translate/src/offscreen/offscreen.ts` for hidden WebRTC ownership, translated audio playback, subtitle delta routing, and stop cleanup.
- Reviewed `EXAMPLE/open-realtime-translate/src/shared/messages.ts` and `src/shared/languages.ts` for tagged message contracts and output language constraints.

**Files Changed**:

- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T002 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded example review.

### Task T003 - Create assessment structure with no-runtime scope

**Started**: 2026-05-12 02:40
**Completed**: 2026-05-12 02:42
**Duration**: 2 minutes

**Notes**:

- Created `docs/ongoing-projects/external-subtitle-overlay-assessment.md`.
- Added explicit assessment-only language: no Chrome extension, no content script, no offscreen document, no service worker, no browser injection path, no arbitrary website overlay, and no runtime UI change.
- Added local reference lists and section structure for the remaining comparison, security, accessibility, compatibility, lifecycle, recommendation, and test strategy work.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - created assessment skeleton.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T003 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded setup completion.

### Task T004 - Document current in-app caption and transcript baseline

**Started**: 2026-05-12 02:42
**Completed**: 2026-05-12 02:45
**Duration**: 3 minutes

**Notes**:

- Documented the existing OpenAI Translation tab runtime shape, latest-caption live region, transcript source/translated rows, Markdown export, original/translated audio mix, playback surface, max-session behavior, provider-switch teardown, and cleanup/re-entry model.
- Emphasized that a future overlay must improve on the shipped baseline without weakening cleanup, accessibility, or privacy behavior.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added current baseline section.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T004 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded baseline work.

### Task T005 - Compare overlay architecture options

**Started**: 2026-05-12 02:45
**Completed**: 2026-05-12 02:48
**Duration**: 3 minutes

**Notes**:

- Added option comparison for no-build, in-app floating captions, extension content scripts, offscreen documents, shadow DOM isolation, and companion sidecars.
- Recommended no-build as default, in-app floating captions as the smallest future prototype, and extension/sidecar paths only after explicit product and privacy approval.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added option comparison.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T005 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded comparison work.

### Task T006 - Define server boundary, permission, and storage constraints

**Started**: 2026-05-12 02:48
**Completed**: 2026-05-12 02:51
**Duration**: 3 minutes

**Notes**:

- Added server-only `OPENAI_API_KEY` guardrails, backend client-secret broker requirements, sanitized message routing, permission minimization, no-secret/no-transcript storage defaults, shared rate-limit prerequisite, and stable error/logging constraints.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added server boundary and storage constraints.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T006 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded boundary work.

### Task T007 - Define accessibility and UX constraints

**Started**: 2026-05-12 02:51
**Completed**: 2026-05-12 02:53
**Duration**: 2 minutes

**Notes**:

- Added caption sizing, contrast, wrapping, keyboard, focus, live-region, reduced-motion, hide/show, consent, and language-label requirements.
- Tied future overlay vocabulary back to the current source/translated transcript model.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added accessibility and UX constraints.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T007 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded accessibility work.

### Task T008 - Document privacy, consent, and retention guardrails

**Started**: 2026-05-12 02:53
**Completed**: 2026-05-12 02:56
**Duration**: 3 minutes

**Notes**:

- Added privacy guardrails for audio, transcript text, target language, page identity, sanitized observability, explicit consent, no default persistence, local-only review, user-initiated export, and GDPR/compliance review triggers.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added privacy and retention guardrails.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T008 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded privacy work.

### Task T009 - Document cross-site compatibility risks

**Started**: 2026-05-12 02:56
**Completed**: 2026-05-12 02:59
**Duration**: 3 minutes

**Notes**:

- Added CSP, iframe, fullscreen, z-index, CSS isolation, navigation, tab lifecycle, browser support, and unsupported-state constraints for future overlay work.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added compatibility risks.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T009 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded compatibility work.

### Task T010 - Document overlay lifecycle and cleanup states

**Started**: 2026-05-12 02:59
**Completed**: 2026-05-12 03:02
**Duration**: 3 minutes

**Notes**:

- Added lifecycle state table and cleanup expectations for in-app floating captions, extension/offscreen/content-script paths, segment/fade timers, and translated audio playback.
- Required one authoritative session owner and one idempotent cleanup path for future overlay work.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added lifecycle and cleanup states.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T010 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded lifecycle work.

### Task T011 - Compare overlay value against current experience

**Started**: 2026-05-12 03:02
**Completed**: 2026-05-12 03:05
**Duration**: 3 minutes

**Notes**:

- Compared current shipped value against external overlay benefits.
- Documented cases where an overlay is not worth building, especially when in-app floating captions can solve the need or when extension privacy/support obligations are not accepted.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added overlay value assessment.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T011 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded value assessment.

### Task T012 - Add recommendation, prerequisites, follow-up scope, and assumptions

**Started**: 2026-05-12 03:05
**Completed**: 2026-05-12 03:08
**Duration**: 3 minutes

**Notes**:

- Added explicit defer recommendation for external overlays.
- Documented build-later paths, current-product rejections, future prerequisites, a bounded 2-4 hour in-app floating caption prototype scope, a separate future extension assessment scope, and unproven assumptions.

**Files Changed**:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md` - added recommendation and future scope.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T012 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded recommendation work.

### Task T013 - Add architecture pointer

**Started**: 2026-05-12 03:08
**Completed**: 2026-05-12 03:10
**Duration**: 2 minutes

**Notes**:

- Added an architecture pointer beside the existing future raw-audio and room/telephony decision notes.
- The pointer labels external subtitle overlays as assessment-only future architecture and states that no extension, content script, offscreen document, service worker, cross-site overlay, arbitrary website injection, persistent transcript store, or runtime UI change is shipped.

**Files Changed**:

- `docs/ARCHITECTURE.md` - added future-only overlay assessment pointer.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T013 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded architecture pointer.

### Task T014 - Add external subtitle overlay docs validation test

**Started**: 2026-05-12 03:10
**Completed**: 2026-05-12 03:13
**Duration**: 3 minutes

**Notes**:

- Added offline Vitest coverage for required assessment headings, local reference paths, overlay architecture options, not-shipped language, architecture pointer, privacy guardrails, accessibility constraints, and recommendation terms.
- Test reads repository-owned Markdown files only and does not build an extension, launch a browser, or call provider APIs.

**Files Changed**:

- `src/test/externalSubtitleOverlayDocs.test.ts` - added docs validation test.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T014 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded test addition.

### Task T015 - Run targeted validation and ASCII checks

**Started**: 2026-05-12 03:13
**Completed**: 2026-05-12 03:17
**Duration**: 4 minutes

**Notes**:

- Ran targeted Vitest validation for the new docs test.
- Initial run exposed two assertion wording issues in the test: architecture text had a Markdown line break between `assessment-only` and `guidance`, and one disallowed positive-claim string matched the required explicit no-shipped sentence.
- Updated the test to normalize architecture whitespace and avoid matching required negative guardrail text.
- Final targeted Vitest result: 1 test file passed, 4 tests passed.
- ASCII check result: no non-ASCII characters found in checked artifacts.
- CRLF check result: no carriage returns found in checked artifacts.

**Commands run**:

- `npm run test:run -- src/test/externalSubtitleOverlayDocs.test.ts`
- `LC_ALL=C grep -nP '[^\x00-\x7F]' docs/ongoing-projects/external-subtitle-overlay-assessment.md docs/ARCHITECTURE.md src/test/externalSubtitleOverlayDocs.test.ts .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md`
- `grep -n $'\r' docs/ongoing-projects/external-subtitle-overlay-assessment.md docs/ARCHITECTURE.md src/test/externalSubtitleOverlayDocs.test.ts .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md`

**Files Changed**:

- `src/test/externalSubtitleOverlayDocs.test.ts` - adjusted docs assertions after validation.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T015 complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded validation results.

### Task T016 - Final implementation notes and security compliance

**Started**: 2026-05-12 03:17
**Completed**: 2026-05-12 03:22
**Duration**: 5 minutes

**Notes**:

- Created the session security/compliance review with scope, secrets, trust boundaries, logging/error boundaries, runtime change review, GDPR posture, residual risks, validation evidence, and security conclusion.
- Confirmed no Chrome extension, content script, offscreen document, service worker, sidecar process, cross-site overlay, arbitrary website injection path, Express route, provider SDK, persistent transcript store, database schema, migration, dependency, live provider call, browser automation, or runtime UI change was introduced.
- Final recommendation remains: defer external subtitle overlays; if product feedback requires larger captions, prototype an in-app floating caption surface first in a future bounded session.
- Existing residual risks remain relevant: process-local rate limiting and CSP compatibility allowances. Future overlay work also needs browser-extension platform, cross-site compatibility, privacy notice/consent, and accessibility acceptance review.

**Commands run**:

- `npm run test:run -- src/test/externalSubtitleOverlayDocs.test.ts`
- `LC_ALL=C grep -nP '[^\x00-\x7F]' docs/ongoing-projects/external-subtitle-overlay-assessment.md docs/ARCHITECTURE.md src/test/externalSubtitleOverlayDocs.test.ts .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/security-compliance.md`
- `grep -n $'\r' docs/ongoing-projects/external-subtitle-overlay-assessment.md docs/ARCHITECTURE.md src/test/externalSubtitleOverlayDocs.test.ts .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md .spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/security-compliance.md`

**Final Results**:

- Targeted Vitest: passed, 1 test file, 4 tests.
- ASCII check: passed, no non-ASCII matches.
- CRLF check: passed, no carriage-return matches.

**Files Changed**:

- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/security-compliance.md` - added final security/compliance review.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md` - marked T016 and completion checklist complete.
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md` - recorded final summary and validation results.

---

## Design Decisions

### Decision 1: Defer External Subtitle Overlay Companion

**Context**: The current app already ships in-app latest captions, transcript
rows, translated audio playback, audio mix, diagnostics, cleanup, and Markdown
export.

**Options Considered**:

1. Build a cross-site extension overlay now - high permission, privacy,
   compatibility, store-review, and support burden.
2. Build a sidecar now - high installation, OS integration, and privacy burden.
3. Defer external overlays and make in-app floating captions the smallest
   future prototype if needed - lowest risk and reuses existing runtime.

**Chosen**: Defer external overlays and recommend an in-app floating caption
prototype first if product feedback requires more prominent captions.

**Rationale**: The external overlay value is real but not yet stronger than the
added privacy and browser-platform burden.

### Decision 2: Validate Documentation Offline Only

**Context**: The session is assessment-only and explicitly forbids extension
builds, browser injection, live provider calls, and runtime UI changes.

**Options Considered**:

1. Add no test - allows future docs drift.
2. Add an offline docs validation test - catches missing sections, unsafe claims,
   and lost guardrails without runtime scope creep.

**Chosen**: Add `src/test/externalSubtitleOverlayDocs.test.ts`.

**Rationale**: Offline docs validation matches prior session patterns and keeps
the no-runtime-change boundary intact.

---

## Session Summary

Implemented all 16 tasks for
`phase05-session05-external-subtitle-overlay-assessment`.

Primary outputs:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md`
- `docs/ARCHITECTURE.md`
- `src/test/externalSubtitleOverlayDocs.test.ts`
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md`
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/security-compliance.md`

Recommendation: defer external subtitle overlays. Keep the current in-app
caption and transcript surfaces as the shipped product path. If user feedback
requires more prominent captions, start with a future in-app floating caption
prototype that reuses the current translation runtime. Do not ship a Chrome
extension, content script, offscreen document, service worker, arbitrary website
injection path, extension-local raw OpenAI API key storage, or persistent
transcript store from this session.

Validation:

- `npm run test:run -- src/test/externalSubtitleOverlayDocs.test.ts` passed.
- ASCII checks passed.
- CRLF checks passed.

## Task Log

### 2026-05-12 - Session Start

**Environment verified**:

- [x] Prerequisites confirmed
- [x] Tools available
- [x] Directory structure ready

**Commands run**:

- `bash .spec_system/scripts/analyze-project.sh --json`
- `bash .spec_system/scripts/check-prereqs.sh --json --env`
- `bash .spec_system/scripts/check-prereqs.sh --json --tools node,npm`

**Notes**:

- Active session resolved to `phase05-session05-external-subtitle-overlay-assessment`.
- Repository is not marked as a monorepo.
- Node.js v24.14.0 and npm 10.5.1 are available for targeted Vitest validation.
- BQC is N/A for this session because it is documentation-led and does not ship application runtime code.

---
