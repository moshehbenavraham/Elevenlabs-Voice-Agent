# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-30
**Project State**: Phase 04 - Deployment & New Providers
**Completed Sessions**: 20 (2 in current phase)

---

## Recommended Next Session

**Session ID**: `phase04-session03-ultravox-frontend`
**Session Name**: Ultravox Voice Context & Provider Integration
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 15-20

---

## Why This Session Next?

### Prerequisites Met

- [x] Backend `/api/ultravox/call` endpoint implemented (phase04-session02-ultravox-backend)
- [x] `ultravox-client` package installed
- [x] `ULTRAVOX_API_KEY` configured in environment
- [x] `VITE_ULTRAVOX_ENABLED` environment variable defined
- [x] Existing provider pattern established (VoiceContext, XAIVoiceContext, OpenAIVoiceContext)

### Dependencies

- **Builds on**: phase04-session02-ultravox-backend (API endpoint ready)
- **Enables**: phase04-session04-ultravox-polish (function calling + final polish)

### Project Progression

This is the natural next step after backend setup. The Ultravox frontend integration follows the proven 4-session pattern used for xAI (Phase 00) and OpenAI (Phase 01): research -> backend -> frontend -> polish. With the backend complete, the frontend context and provider component are the logical continuation.

---

## Session Overview

### Objective

Create the Ultravox voice context and provider component to enable the Ultravox tab in the application, allowing users to interact with the Ultravox voice AI.

### Key Deliverables

1. `UltravoxVoiceContext.tsx` - Session lifecycle management with `ultravox-client` SDK
2. `UltravoxProvider.tsx` - Provider wrapper connecting to shared voice UI components
3. Tab integration in `ProviderContext.tsx` - Register Ultravox as the fourth provider
4. Status mapping from Ultravox states (listening, thinking, speaking) to unified state
5. Real-time transcript capture and display

### Scope Summary

- **In Scope (MVP)**:
  - UltravoxSession lifecycle (connect, disconnect, event listeners)
  - Status event handling and state mapping
  - Transcript event handling with real-time updates
  - Mic mute/unmute via SDK
  - Integration with existing VoiceButton, VoiceStatus components
  - Tab registration with Ultravox branding

- **Out of Scope** (deferred to session 04):
  - Client-side tool registration (function calling)
  - Voice selection UI
  - Reconnection with backoff
  - Comprehensive unit tests

---

## Technical Considerations

### Technologies/Patterns

- `ultravox-client` SDK - Higher-level SDK than raw WebSocket (unlike xAI/OpenAI)
- `UltravoxSession` class - Handles audio streaming internally
- Event-driven architecture: `status`, `transcript`, `experimental_message`
- React Context pattern matching existing providers

### Key Implementation Details

**Status Mapping** (from PRD):
| Ultravox Status | Unified State |
|-----------------|---------------|
| disconnected, disconnecting | idle |
| connecting | connecting |
| idle, listening, thinking, speaking | connected |

**Event Listeners Required**:

```typescript
session.addEventListener('status', (event) => { ... });
session.addEventListener('transcript', (event) => { ... });
```

### Potential Challenges

- **SDK vs raw WebSocket**: Different pattern than xAI/OpenAI - need to adapt existing patterns
- **Audio handling**: SDK handles audio internally - no manual PCM encoding needed
- **Type definitions**: May need to create `src/types/ultravox.ts` for proper typing

### Relevant Considerations

- [P00] **Provider-Specific Contexts**: Each provider has dedicated context - maintain isolation pattern
- [P00] **Single Connection at a Time**: Disconnect active provider before switching tabs
- [P01] **~80% Code Reuse for New Providers**: Expect significant reuse from OpenAI/xAI patterns
- [P01] **Empty state component for unconfigured providers**: Show setup instructions when API key missing

---

## Alternative Sessions

If this session is blocked:

1. **phase04-session04-ultravox-polish** - Skip to polish if frontend context already partially implemented
2. **Google Gemini Research** - Begin research for fifth provider while Ultravox unblocked

---

## Files to Create/Modify

| File                                            | Action | Description                    |
| ----------------------------------------------- | ------ | ------------------------------ |
| `src/types/ultravox.ts`                         | CREATE | Ultravox type definitions      |
| `src/contexts/UltravoxVoiceContext.tsx`         | CREATE | Session management context     |
| `src/components/providers/UltravoxProvider.tsx` | CREATE | Provider wrapper component     |
| `src/contexts/ProviderContext.tsx`              | MODIFY | Add Ultravox provider config   |
| `src/types/voice-provider.ts`                   | MODIFY | Add 'ultravox' to ProviderType |

---

## Next Steps

Run `/sessionspec` to generate the formal specification with detailed task breakdown.
