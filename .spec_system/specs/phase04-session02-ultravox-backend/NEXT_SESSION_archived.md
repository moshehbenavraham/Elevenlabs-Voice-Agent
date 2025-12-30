# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-30
**Project State**: Phase 04 - Deployment & New Providers
**Completed Sessions**: 19 (across all phases)

---

## Recommended Next Session

**Session ID**: `phase04-session02-ultravox-backend`
**Session Name**: Ultravox Backend Setup & Dependencies
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 12-15

---

## Why This Session Next?

### Prerequisites Met

- [x] Phase 03 complete (Testing & Configuration)
- [x] Phase 04 Session 01 complete (Coolify Docker deployment)
- [x] Multi-provider architecture established (ElevenLabs, xAI, OpenAI)
- [x] Backend infrastructure exists with ephemeral token pattern
- [x] Ultravox API key already configured in project .env file

### Dependencies

- **Builds on**: phase04-session01-coolify-deployment (Docker foundation)
- **Enables**: phase04-session03-ultravox-frontend (Context & Provider)

### Project Progression

Ultravox is the next logical provider to integrate. The PRD explicitly plans Ultravox as the fourth voice provider in Phase 04. The API key is already configured, and the existing architecture (3 providers using ephemeral tokens) provides a proven pattern. Backend setup must come first because the frontend SDK (`ultravox-client`) requires a `joinUrl` from the backend API.

---

## Session Overview

### Objective

Set up Ultravox backend infrastructure including API route, dependencies, and environment configuration to enable call creation and `joinUrl` generation.

### Key Deliverables

1. Install `ultravox-client` NPM package
2. Create `POST /api/ultravox/call` backend endpoint
3. Configure environment variables (ULTRAVOX_API_KEY, VITE_ULTRAVOX_ENABLED)
4. Add Ultravox type definitions
5. Update `.env.example` with Ultravox variables
6. Test backend endpoint functionality

### Scope Summary

- **In Scope (MVP)**: Backend route for call creation, basic type definitions, environment setup
- **Out of Scope**: Frontend context/UI (Session 03), function calling/tools (Session 04)

---

## Technical Considerations

### Technologies/Patterns

- Express.js route handler (existing pattern from xAI/OpenAI)
- `ultravox-client` SDK (unlike xAI/OpenAI, uses higher-level SDK)
- Ultravox REST API for call creation (returns joinUrl for SDK)
- TypeScript interfaces for Ultravox types

### Potential Challenges

- Ultravox uses different architecture than xAI/OpenAI (SDK-based vs raw WebSocket)
- Call creation returns `joinUrl` not ephemeral token (slight pattern difference)
- May need to handle different error formats from Ultravox API

### Relevant Considerations

- [P00] **API Keys**: Must use backend proxy; never expose in browser
- [P00] **Environment-based feature flags**: VITE_ULTRAVOX_ENABLED pattern matches existing providers
- [P01] **Research-first structure**: Backend before frontend follows proven 4-session pattern

---

## Alternative Sessions

If this session is blocked:

1. **ElevenLabs Function Calling Research** - Different architecture, requires separate investigation
2. **Token Caching with TTL** - Performance optimization, lower priority

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
