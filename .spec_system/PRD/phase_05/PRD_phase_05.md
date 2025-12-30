# PRD Phase 05: Vapi Voice Agent

**Status**: In Progress
**Sessions**: 4
**Estimated Duration**: 1-2 days

**Progress**: 1/4 sessions (25%)

---

## Overview

Integrate Vapi as the fifth voice provider in the multi-provider voice AI application. Vapi is a voice AI platform that uses a web token (public API key) for frontend-only authentication, built on Daily.co WebRTC infrastructure. This phase adds a Vapi tab with support for assistant configuration, partial transcript typing indicators, and function calling.

**Reference Implementation:** `VAPI_EXAMPLE/` contains a working React + Vapi integration.

---

## Progress Tracker

| Session | Name               | Status      | Est. Tasks | Validated  |
| ------- | ------------------ | ----------- | ---------- | ---------- |
| 01      | Dependencies & CSP | Complete    | 18         | 2025-12-31 |
| 02      | Voice Hook & SDK   | Not Started | ~20        | -          |
| 03      | Provider Component | Not Started | ~18        | -          |
| 04      | Testing & Polish   | Not Started | ~22        | -          |

---

## Completed Sessions

### Session 01: Dependencies & CSP (2025-12-31)

- Installed `@vapi-ai/web@1.0.255` SDK with pinned version
- Updated CSP connect-src with Vapi, Daily.co, and pipecdn domains
- Created type verification file at `src/lib/vapi/types.ts`
- Updated `.env.example` with comprehensive Vapi configuration

---

## Upcoming Sessions

- Session 02: Voice Hook & SDK Implementation

---

## Objectives

1. **Primary**: Add Vapi as a fully functional voice provider tab
2. **Secondary**: Implement partial transcript typing indicators for real-time UX
3. **Tertiary**: Support both `assistantId` and inline `CreateAssistantDTO` configuration
4. **Stretch**: Add function calling support via assistant configuration

---

## Prerequisites

- Phase 04 completed (Ultravox integration provides pattern reference)
- Access to Vapi dashboard for web token creation
- Understanding of existing provider architecture (VoiceContext patterns)

---

## Technical Considerations

### Architecture

Vapi differs from other providers:

- **No backend required**: Web token is safe for frontend use
- **SDK singleton**: Single Vapi instance manages all calls
- **Event-driven**: Hook pattern with `useVapiVoice` similar to existing hooks
- **Partial transcripts**: Unique `activeTranscript` state for typing indicators
- **Dual config mode**: Support `assistantId` (pre-created) or inline config

### Technologies

- `@vapi-ai/web` SDK (v1.0.255+)
- Daily.co WebRTC (transparent, handled by SDK)
- React hooks for state management
- Environment variables for configuration

### Risks

- **CSP Complexity**: Multiple domains required (Vapi, Daily.co, pipecdn) - mitigated by explicit CSP configuration
- **SDK Updates**: Vapi SDK is actively developed - pin version and document

### Relevant Considerations

- [P00] **Radix UI Tabs for accessibility**: Reuse existing tab infrastructure
- [P01] **~80% Code Reuse**: Follow established provider patterns from Ultravox/OpenAI
- [P02] **Fresh token on each reconnect**: Not needed for Vapi (web token doesn't expire)
- [P02] **Streaming transcript with placeholder**: Use `activeTranscript` pattern

---

## Success Criteria

Phase complete when:

- [ ] All 4 sessions completed
- [ ] Vapi tab appears and functions correctly
- [ ] Connect/disconnect with visual feedback works
- [ ] Audio level visualization (glow effect) works
- [ ] Partial transcripts show typing indicator
- [ ] Final transcripts append to conversation history
- [ ] Function calling works (if configured in assistant)
- [ ] Tests pass for hook and provider components
- [ ] Documentation updated (CLAUDE.md, README)

---

## Dependencies

### Depends On

- Phase 04: Deployment & New Providers (completed)
- VAPI_EXAMPLE reference implementation

### Enables

- Phase 06: Retell Voice Agent Integration
- Future: Configuration modal for Vapi settings
