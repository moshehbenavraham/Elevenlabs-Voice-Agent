# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-31
**Project State**: Phase 05 - Vapi Voice Agent
**Completed Sessions**: 22

---

## Recommended Next Session

**Session ID**: `phase05-session01-dependencies-csp`
**Session Name**: Dependencies & CSP Configuration
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: ~15

---

## Why This Session Next?

### Prerequisites Met

- [x] Phase 04 completed (Ultravox integration provides pattern reference)
- [x] VAPI_EXAMPLE reference implementation available

### Dependencies

- **Builds on**: Phase 04 Ultravox patterns (newest provider integration)
- **Enables**: Session 02 (Voice Hook & SDK), Session 03 (Provider Component), Session 04 (Testing & Polish)

### Project Progression

This is the logical first session for Phase 05. It establishes the foundation for Vapi integration by:

1. Installing the Vapi SDK package
2. Configuring CSP for Vapi and Daily.co WebRTC domains
3. Setting up environment variables following established patterns

Foundation work must complete before implementing the voice hook and provider components.

---

## Session Overview

### Objective

Install Vapi SDK, configure Content Security Policy for Vapi and Daily.co domains, and set up environment variables for the integration.

### Key Deliverables

1. `@vapi-ai/web` package installed (v1.0.255+)
2. CSP updated in `index.html` for Vapi/Daily.co/pipecdn domains
3. Environment variables added (`VITE_VAPI_ENABLED`, `VITE_VAPI_WEB_TOKEN`, etc.)
4. Updated `.env.example` with new Vapi variables

### Scope Summary

- **In Scope (MVP)**: Package installation, CSP configuration, environment variables, documentation
- **Out of Scope**: Backend routes (not needed for Vapi), provider component implementation, testing infrastructure

---

## Technical Considerations

### Technologies/Patterns

- `@vapi-ai/web` SDK for frontend voice integration
- Daily.co WebRTC (transparent, handled by SDK)
- CSP headers for domain whitelisting
- Environment-based feature flags (`VITE_*` pattern)

### Potential Challenges

- **CSP Complexity**: Multiple domains required (Vapi API, Daily.co, pipecdn) - mitigated by explicit documentation
- **SDK Version Pinning**: Vapi SDK actively developed - pin specific version

### Relevant Considerations

- [P01] **~80% Code Reuse**: Follow established provider patterns from Ultravox/OpenAI integration
- [P00] **Environment-based feature flags**: `VITE_VAPI_ENABLED` follows existing pattern
- [P00] **No backend required**: Vapi uses web token safe for frontend (unlike xAI/OpenAI ephemeral tokens)

---

## Alternative Sessions

If this session is blocked:

1. **phase05-session02-voice-hook** - Not recommended (requires SDK from Session 01)
2. **Documentation/Refactoring** - Could update CONSIDERATIONS.md for Phase 04 learnings while waiting

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
