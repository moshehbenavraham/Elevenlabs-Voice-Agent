# PRD Phase 05: Vapi Voice Agent

**Status**: Complete
**Sessions**: 4
**Estimated Duration**: 1-2 days

**Progress**: 4/4 sessions (100%)

---

## Overview

Integrate Vapi as the fifth voice provider in the multi-provider voice AI application. Vapi is a voice AI platform that uses a web token (public API key) for frontend-only authentication, built on Daily.co WebRTC infrastructure. This phase adds a Vapi tab with support for assistant configuration, partial transcript typing indicators, and function calling.

**Reference Implementation:** `VAPI_EXAMPLE/` contains a working React + Vapi integration.

---

## Progress Tracker

| Session | Name               | Status   | Est. Tasks | Validated  |
| ------- | ------------------ | -------- | ---------- | ---------- |
| 01      | Dependencies & CSP | Complete | 18         | 2025-12-31 |
| 02      | Voice Hook & SDK   | Complete | 18         | 2025-12-31 |
| 03      | Provider Component | Complete | 20         | 2025-12-31 |
| 04      | Testing & Polish   | Complete | 20         | 2025-12-31 |

---

## Completed Sessions

### Session 01: Dependencies & CSP (2025-12-31)

- Installed `@vapi-ai/web@1.0.255` SDK with pinned version
- Updated CSP connect-src with Vapi, Daily.co, and pipecdn domains
- Created type verification file at `src/lib/vapi/types.ts`
- Updated `.env.example` with comprehensive Vapi configuration

### Session 02: Voice Hook & SDK (2025-12-31)

- Created comprehensive type definitions (`src/types/vapi.ts`) with 4 enums, 8 interfaces
- Implemented SDK singleton (`src/lib/vapi.ts`) with web token initialization
- Built `useVapiVoice` hook (`src/hooks/useVapiVoice.ts`) with all 7 Vapi events
- Added partial transcript handling with `activeTranscript` state
- Dual config support: assistantId string OR inline CreateAssistantDTO

### Session 03: Provider Component (2025-12-31)

- Created `VapiProvider.tsx` with VapiButton, VapiVoiceStatus, VapiEmptyState components
- Added `vapi` to ProviderType union and PROVIDERS configuration
- Integrated Vapi tab with purple/violet branding and PhoneCall icon
- Added activeTranscript typing indicator to ConversationPanel
- Created VapiConversationPanel wrapper for message format conversion
- Full Index.tsx integration with connect/disconnect handlers

### Session 04: Testing & Polish (2025-12-31)

- Created comprehensive test suite with 82 new tests (41 hook + 41 component)
- Added Vapi SDK mock to test setup with event emitter pattern
- Implemented VapiTool interface and getVapiTools() transformer function
- Tests cover: initial state, connection, events, transcripts, errors, cleanup
- Updated CLAUDE.md with complete Vapi integration documentation
- All 263 tests passing, build succeeds in 3.33s

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

- [x] All 4 sessions completed
- [x] Vapi tab appears and functions correctly
- [x] Connect/disconnect with visual feedback works
- [x] Audio level visualization (glow effect) works
- [x] Partial transcripts show typing indicator
- [x] Final transcripts append to conversation history
- [x] Function calling works (if configured in assistant)
- [x] Tests pass for hook and provider components
- [x] Documentation updated (CLAUDE.md, README)

---

## Dependencies

### Depends On

- Phase 04: Deployment & New Providers (completed)
- VAPI_EXAMPLE reference implementation

### Enables

- Phase 06: Retell Voice Agent Integration
- Future: Configuration modal for Vapi settings
