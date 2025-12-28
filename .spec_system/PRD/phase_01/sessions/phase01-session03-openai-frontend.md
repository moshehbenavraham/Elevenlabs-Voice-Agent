# Session 03: OpenAI Frontend Integration

**Session ID**: `phase01-session03-openai-frontend`
**Status**: Not Started
**Estimated Tasks**: ~25-30
**Estimated Duration**: 3-4 hours

---

## Objective

Create the OpenAI voice context and provider component, integrating OpenAI into the existing tab system with full audio conversation support.

---

## Scope

### In Scope (MVP)

- Create `src/contexts/OpenAIVoiceContext.tsx`
- Implement WebSocket connection to OpenAI Realtime API
- Handle OpenAI-specific message types
- Create `src/components/providers/OpenAIProvider.tsx`
- Integrate with existing audio visualization
- Add OpenAI to `ProviderType` enum
- Register OpenAI tab in provider tabs
- Handle audio encoding/decoding for OpenAI format
- Create `src/components/voice/OpenAIVoiceVisualizer.tsx` if needed
- Add `VITE_OPENAI_ENABLED` feature flag support

### Out of Scope

- Advanced voice customization UI
- Conversation history/transcript
- Function calling / tool use features

---

## Prerequisites

- [ ] Session 02 backend endpoint working
- [ ] OpenAI ephemeral token endpoint tested
- [ ] Audio format requirements from Session 01

---

## Deliverables

1. `src/contexts/OpenAIVoiceContext.tsx` - Voice connection logic
2. `src/components/providers/OpenAIProvider.tsx` - Provider wrapper
3. OpenAI tab appears in tab system (when configured)
4. Full voice conversation working with OpenAI
5. Audio visualization during OpenAI conversations
6. Graceful disconnect on tab switch

---

## Success Criteria

- [ ] OpenAI tab visible when `VITE_OPENAI_ENABLED=true`
- [ ] Can start/stop voice conversation with OpenAI
- [ ] Audio plays correctly (OpenAI responses audible)
- [ ] Microphone input sent to OpenAI correctly
- [ ] Audio visualization animates during conversation
- [ ] Switching tabs disconnects OpenAI cleanly
- [ ] Error states display appropriately
- [ ] "Not configured" state when API key missing
