# Security and Compliance Review

**Session ID**: `phase05-session05-external-subtitle-overlay-assessment`
**Reviewed**: 2026-05-12
**Result**: PASS with residual risks

---

## Scope Reviewed

This session produced an assessment document, a main architecture pointer, an
offline docs validation test, implementation notes, and this security review for
future external subtitle overlay options.

Files reviewed:

- `docs/ongoing-projects/external-subtitle-overlay-assessment.md`
- `docs/ARCHITECTURE.md`
- `src/test/externalSubtitleOverlayDocs.test.ts`
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/tasks.md`
- `.spec_system/specs/phase05-session05-external-subtitle-overlay-assessment/implementation-notes.md`

No Chrome extension, content script, offscreen document, service worker,
sidecar process, cross-site overlay, arbitrary website injection path, Express
route, provider SDK, persistent transcript store, database schema, migration,
or runtime UI change was introduced.

## Security Posture

### Secrets

Status: PASS.

- `OPENAI_API_KEY` remains server-only.
- No raw OpenAI API key, client secret, cookie, authorization header, SDP body,
  provider payload, or browser capture identifier was added to committed code or
  docs examples.
- The assessment rejects extension-local raw OpenAI API key storage.
- Any future extension must call this app's backend or a dedicated broker for
  short-lived browser-safe translation client secrets.

### Trust Boundaries

Status: PASS.

- The current app boundary remains unchanged: browser WebRTC receives a
  short-lived client secret from `POST /api/openai/translation-session`.
- The document requires future overlay brokers to validate target language,
  source type, session duration, authorization if accounts exist later, and
  rate-limit state before minting client secrets.
- Future content scripts are limited to sanitized caption events and stable
  session state.
- The document rejects routing raw audio, transcripts, provider payloads,
  cookies, authorization headers, SDP, client secrets, or API keys through
  content-script messages.

### Logging and Error Boundaries

Status: PASS.

- The assessment forbids logging raw request bodies, upstream bodies, audio
  chunks, transcript rows, caption text, SDP, client secrets, API keys, cookies,
  authorization headers, and provider response bodies.
- Acceptable telemetry is limited to sanitized request ID, route, source mode,
  target language, state, duration, status category, result, and stable error
  category.
- Future user-visible errors must avoid stack traces, internal paths, upstream
  bodies, API keys, client secrets, provider account metadata, and raw provider
  details.

### Runtime Change Review

Status: PASS.

- No runtime application files were modified.
- No Express route registration changed.
- No provider tab behavior changed.
- No browser automation, extension build, content-script injection, or live
  provider call was run.
- No dependency was added.
- No persistent storage layer was added.

## GDPR and Privacy

### Data Collection

Status: PASS.

This session did not add data collection, accounts, tenant data, billing
identity, persistent transcript storage, local recording storage, or provider
traffic. The assessment treats audio, transcript text, translated text, target
language, page title, source URL, tab identity, room identity, and failure
details as potentially personal data for future work.

### Data Minimization

Status: PASS.

The assessment keeps default behavior session-local and requires no default
persistence of raw audio, transcript text, translated text, provider payloads,
cookies, authorization headers, SDP bodies, client secrets, API keys, or browser
capture identifiers.

### Consent and Retention

Status: N/A for this session.

No new consent or retention flow was introduced. Future overlays must define
explicit start consent, visible stop controls, capture explanation, rendering
location, data-flow notice, retention policy, deletion behavior, and privacy
review before shipping.

### Third-Party Transfers

Status: N/A for this session.

No live OpenAI or browser-extension platform call was performed. The current
app's existing OpenAI Translation data flow is unchanged. Future overlays that
capture third-party page or meeting content require a fresh provider,
processor/subprocessor, regional transfer, and consent review.

## Residual Risks

| Risk                         | Status | Required Future Action                                                                                                                    |
| ---------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Process-local rate limiting  | Open   | Add shared-store or platform-level limits before multi-instance overlay traffic or extension traffic is allowed.                          |
| CSP compatibility allowances | Open   | Re-test browser-facing provider surfaces before tightening CSP or adding overlay-specific surfaces.                                       |
| Extension platform drift     | Open   | Re-check Chrome MV3, tab capture, offscreen document, content-script, and target browser behavior before any implementation.              |
| Cross-site compatibility     | Open   | Define iframe, fullscreen, z-index, navigation, shadow DOM, unsupported page, and enterprise browser acceptance criteria before shipping. |
| Privacy notice and consent   | Open   | Define consent copy, data-flow notice, retention, deletion, and incident response before cross-site captions.                             |
| Accessibility acceptance     | Open   | Validate keyboard, focus, live-region, contrast, reduced-motion, hide/show, and stop controls before release.                             |

## Validation Evidence

- `npm run test:run -- src/test/externalSubtitleOverlayDocs.test.ts` passed with
  1 test file and 4 tests.
- ASCII checks passed for the assessment document, architecture pointer, docs
  test, task checklist, implementation notes, and this security review.
- CRLF checks found no carriage returns in the checked artifacts.

## Security Conclusion

This session is safe to hand to the validate workflow. It documents future
external subtitle overlay options without expanding runtime attack surface,
credential custody, persistent storage, provider traffic, browser permissions,
or cross-site injection. The recommendation is to defer external overlays and,
if product feedback requires larger captions, prototype only an in-app floating
caption surface in a future bounded session first.
