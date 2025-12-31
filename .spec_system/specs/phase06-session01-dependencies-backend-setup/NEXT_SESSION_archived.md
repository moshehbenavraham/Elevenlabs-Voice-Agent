# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-31
**Project State**: Phase 06 - Retell Voice Agent
**Completed Sessions**: 26

---

## Recommended Next Session

**Session ID**: `phase06-session01-dependencies-backend-setup`
**Session Name**: Dependencies & Backend Setup
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 12-15

---

## Why This Session Next?

### Prerequisites Met

- [x] Phase 05 completed (Vapi Voice Agent fully integrated)
- [x] Backend Express server infrastructure working
- [x] Existing tab system and provider abstraction in place
- [x] RETELL_EXAMPLE/ reference implementation available

### Dependencies

- **Builds on**: Phase 05 provider integration patterns (Vapi SDK, backend token endpoints)
- **Enables**: Session 02 (Voice Hook & SDK Integration)

### Project Progression

This is the first session of Phase 06, starting the Retell Voice Agent integration. Following the established 4-session pattern for new providers (dependencies → hook → tab → polish), this session lays the foundation by:

1. Installing the Retell client SDK
2. Creating the backend token endpoint (required for Retell's per-call auth model)
3. Configuring environment variables

This mirrors the successful patterns from Vapi (Phase 05) and Ultravox (Phase 04) integrations.

---

## Session Overview

### Objective

Install Retell client SDK, create backend endpoint for call registration, and configure all necessary environment variables.

### Key Deliverables

1. `retell-client-js-sdk` package installed (v2.0.3+)
2. `server/routes/retell.ts` - Backend route with `POST /api/retell/create-web-call` endpoint
3. Updated `server/index.js` with Retell route registration
4. Updated `.env.example` with Retell variables (VITE_RETELL_ENABLED, VITE_RETELL_AGENT_ID, RETELL_API_KEY)
5. CSP configuration updated if required

### Scope Summary

- **In Scope (MVP)**: SDK installation, backend endpoint, environment variables, route registration
- **Out of Scope**: Frontend hook (Session 02), UI components (Session 03), tests/docs (Session 04)

---

## Technical Considerations

### Technologies/Patterns

- `retell-client-js-sdk` v2.0.3+ for frontend SDK
- Express.js backend for token generation endpoint
- Existing backend patterns from Ultravox/OpenAI ephemeral token endpoints
- Environment-based feature flags (VITE\_\*\_ENABLED pattern)

### Potential Challenges

- **Backend Required**: Unlike Vapi, Retell requires backend token generation per-call
- **API Key Management**: Must use backend proxy; never expose RETELL_API_KEY in browser
- **SDK Verification**: Ensure SDK is importable and compatible with build system

### Relevant Considerations

- [P00] **API Keys**: Must use backend proxy for Retell API key; never expose in browser
- [P01] **Research-first 4-session structure**: Following established pattern for provider integration
- [P01] **~80% Code Reuse for New Providers**: Leverage existing patterns from Ultravox backend endpoints

---

## Alternative Sessions

If this session is blocked:

1. **phase06-session02-voice-hook** - Only if SDK is pre-installed and backend endpoint exists
2. **Wait for prerequisites** - Retell account, API key, and Agent ID must be configured first

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
