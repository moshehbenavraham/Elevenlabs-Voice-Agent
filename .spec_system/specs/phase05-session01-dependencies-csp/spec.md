# Session Specification

**Session ID**: `phase05-session01-dependencies-csp`
**Phase**: 05 - Vapi Voice Agent
**Status**: Not Started
**Created**: 2025-12-31

---

## 1. Session Overview

This session establishes the foundation for Vapi voice provider integration by installing the Vapi SDK, configuring Content Security Policy headers, and setting up environment variables. Vapi is a voice AI platform that differentiates from other providers (xAI, OpenAI, Ultravox) by using a public web token for frontend-only authentication, eliminating the need for backend ephemeral token generation.

The session focuses on infrastructure setup rather than implementation. By completing CSP configuration upfront, we prevent debugging WebSocket/WebRTC connection issues during SDK integration. The Vapi SDK uses Daily.co for WebRTC transport, requiring multiple domains to be whitelisted in CSP connect-src directive.

This is a foundational session that enables Sessions 02-04 to focus purely on implementation without infrastructure blockers.

---

## 2. Objectives

1. Install `@vapi-ai/web` SDK package with pinned version for stability
2. Configure CSP in `index.html` to allow Vapi API, Daily.co WebRTC, and pipecdn domains
3. Verify environment variables are properly documented in `.env.example`
4. Validate package installation by confirming TypeScript imports compile successfully

---

## 3. Prerequisites

### Required Sessions

- [x] `phase04-session04-validation-polish` - Phase 04 complete, Ultravox pattern reference available

### Required Tools/Knowledge

- npm/pnpm package management
- CSP header syntax and security implications
- Vite environment variable patterns (`VITE_*` prefix)

### Environment Requirements

- Node.js 18+ installed
- Access to VAPI_EXAMPLE reference implementation in repository
- Vapi dashboard account for web token (for testing)

---

## 4. Scope

### In Scope (MVP)

- Install `@vapi-ai/web` package (v1.0.255 or latest stable)
- Update CSP meta tag in `index.html` with Vapi/Daily.co domains
- Verify existing `.env.example` has complete Vapi documentation
- Create TypeScript type verification file to confirm SDK imports work
- Update `package.json` with new dependency

### Out of Scope (Deferred)

- Backend routes - _Reason: Vapi uses public web token, no server-side auth needed_
- VapiVoiceContext implementation - _Reason: Session 02 scope_
- VapiProvider component - _Reason: Session 03 scope_
- Unit/integration tests - _Reason: Session 04 scope_
- Provider tab UI registration - _Reason: Session 03 scope_

---

## 5. Technical Approach

### Architecture

Vapi SDK integration follows a simpler pattern than xAI/OpenAI providers:

```
Frontend Only (No Backend Required)
+----------------------------------+
|  Browser                         |
|  +----------------------------+  |
|  | Vapi SDK (@vapi-ai/web)    |  |
|  | - Web Token Auth           |  |
|  | - Daily.co WebRTC          |  |
|  +----------------------------+  |
|         |                        |
|         v                        |
|  +----------------------------+  |
|  | CSP: connect-src           |  |
|  | - api.vapi.ai              |  |
|  | - *.daily.co               |  |
|  | - *.pipecdn.app            |  |
|  +----------------------------+  |
+----------------------------------+
         |
         v
   Vapi Cloud / Daily.co
```

### Design Patterns

- **Environment-based feature flags**: `VITE_VAPI_ENABLED` follows established pattern from xAI/OpenAI/Ultravox
- **Pinned dependency version**: Lock to specific version (1.0.255) to prevent breaking changes
- **CSP allowlist approach**: Explicitly whitelist required domains rather than relaxing CSP

### Technology Stack

- `@vapi-ai/web` v1.0.255 - Vapi browser SDK
- Daily.co WebRTC (transparent, handled by SDK)
- Vite environment variables (`VITE_*` prefix)

---

## 6. Deliverables

### Files to Create

| File                    | Purpose                           | Est. Lines |
| ----------------------- | --------------------------------- | ---------- |
| `src/lib/vapi/types.ts` | Type verification for SDK imports | ~15        |

### Files to Modify

| File           | Changes                                           | Est. Lines Changed |
| -------------- | ------------------------------------------------- | ------------------ |
| `package.json` | Add @vapi-ai/web dependency                       | ~2                 |
| `index.html`   | Update CSP connect-src with Vapi/Daily.co domains | ~5                 |
| `.env.example` | Verify/update Vapi variable documentation         | ~5 (if needed)     |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `@vapi-ai/web` package installed and in package.json
- [ ] `import Vapi from '@vapi-ai/web'` compiles without TypeScript errors
- [ ] `import { CreateAssistantDTO } from '@vapi-ai/web/dist/api'` compiles without errors
- [ ] CSP includes all required Vapi domains (api.vapi.ai, _.vapi.ai, wss://_.vapi.ai)
- [ ] CSP includes all required Daily.co domains (_.daily.co, wss://_.daily.co)
- [ ] CSP includes pipecdn domain (\*.pipecdn.app)

### Testing Requirements

- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes (warnings acceptable per MVP config)
- [ ] Manual verification: import statements resolve in IDE

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] No console errors in dev server
- [ ] Package version pinned (not using `^` or `~`)

---

## 8. Implementation Notes

### Key Considerations

- CSP domains must include both HTTPS and WSS protocols for WebRTC
- Daily.co uses wildcard subdomains for call routing
- pipecdn.app hosts CDN assets used by Daily.co SDK
- Web token is public key safe for frontend exposure (unlike xAI/OpenAI API keys)

### Potential Challenges

- **CSP Syntax**: Multiple domains in connect-src require space separation, not commas
- **Wildcard Domains**: Use `*.daily.co` pattern, not explicit subdomain list
- **SDK Version Lock**: Vapi SDK is actively developed; pin version to prevent surprises

### Relevant Considerations

- [P01] **~80% Code Reuse**: Environment variable pattern matches existing providers
- [P00] **Environment-based feature flags**: `VITE_VAPI_ENABLED` follows established pattern
- [P00] **Radix UI Tabs**: Existing tab infrastructure ready for new provider (Session 03)

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Not applicable for this session (infrastructure only)

### Integration Tests

- Not applicable for this session (deferred to Session 04)

### Manual Testing

1. Run `npm install` and verify no errors
2. Run `npm run build` and verify successful compilation
3. Create temporary test file with Vapi imports, verify TypeScript resolves types
4. Inspect `index.html` CSP meta tag in browser DevTools
5. Run dev server and verify no CSP violations in console

### Edge Cases

- CSP must handle both HTTP (localhost) and HTTPS (production) scenarios
- Daily.co domains use different subdomains per call; wildcard required

---

## 10. Dependencies

### External Libraries

- `@vapi-ai/web`: 1.0.255 (pinned version)

### Other Sessions

- **Depends on**: `phase04-session04-validation-polish` (Phase 04 complete)
- **Depended by**: `phase05-session02-voice-hook`, `phase05-session03-provider-component`, `phase05-session04-testing-polish`

---

## Reference Implementation

The `VAPI_EXAMPLE/` directory contains a working React + Vapi integration:

```
VAPI_EXAMPLE/
  src/
    features/Assistant/
      vapi.sdk.ts      # SDK singleton initialization
      useVapi.ts       # Hook with event handling
    config/env.config.ts
  package.json         # @vapi-ai/web@^1.0.255
```

Key patterns to follow:

- SDK singleton pattern: `export const vapi = new Vapi(token)`
- Event-driven state: `vapi.on('call-start', handler)`
- Partial transcript handling: `activeTranscript` state for typing indicators

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
