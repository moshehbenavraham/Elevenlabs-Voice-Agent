# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-31
**Project State**: Phase 05 - Vapi Voice Agent
**Completed Sessions**: 24

---

## Recommended Next Session

**Session ID**: `phase05-session03-provider-tab`
**Session Name**: Provider Component & Tab Integration
**Estimated Duration**: 2-3 hours
**Estimated Tasks**: 15-20

---

## Why This Session Next?

### Prerequisites Met

- [x] Vapi SDK installed (`@vapi-ai/web@^1.0.255`)
- [x] CSP configured for Vapi + Daily.co domains
- [x] Environment variables documented
- [x] `useVapiVoice` hook implemented with event handling
- [x] Vapi type definitions created (`VapiCallStatus`, `VapiMessage`, etc.)
- [x] SDK singleton pattern established (`src/lib/vapi.ts`)

### Dependencies

- **Builds on**: phase05-session02-voice-hook (completed)
- **Enables**: phase05-session04-testing-polish (final session)

### Project Progression

Session 5.3 is the natural next step after establishing the voice hook infrastructure. The hook layer is now complete—this session wires it into the application's UI by creating the provider component and integrating with the existing tabbed interface. This follows the proven pattern from previous provider integrations (xAI, OpenAI, Ultravox).

---

## Session Overview

### Objective

Create the VapiProvider component and integrate Vapi as the fifth voice provider tab, connecting the useVapiVoice hook to the existing UI architecture.

### Key Deliverables

1. `VapiProvider.tsx` - Main provider wrapper component
2. `VapiButton.tsx` - Voice button with audio level visualization (glow effect)
3. `VapiEmptyState.tsx` - Unconfigured state when no web token
4. Tab system integration with proper branding
5. Conversation panel with `activeTranscript` typing indicator support

### Scope Summary

- **In Scope (MVP)**: Provider component, button, empty state, tab registration, conversation display
- **Out of Scope**: Function calling UI (deferred to session 5.4), configuration modal settings, comprehensive tests

---

## Technical Considerations

### Technologies/Patterns

- React functional components with TypeScript
- Existing UI component library (VoiceStatus, ConversationPanel, MessageBubble)
- Radix UI tabs (ProviderTabs/ProviderTab pattern)
- Framer Motion for button animations
- Audio level visualization via CSS box-shadow glow

### Potential Challenges

- **ActiveTranscript prop drilling**: May need to extend ConversationPanel to accept activeTranscript for typing indicator
- **Provider context coordination**: Ensure Vapi properly disconnects when switching tabs (single connection pattern)
- **Button styling consistency**: Match existing provider button aesthetics while incorporating audio level glow

### Relevant Considerations

- [P00] **Single Connection at a Time**: Disconnect active provider before switching tabs to prevent resource conflicts
- [P00] **Provider-Specific Contexts**: Each provider has dedicated context for isolation
- [P01] **Empty state component for unconfigured providers**: Clear setup instructions when API key missing
- [P02] **Provider-specific wrapper components**: VapiProvider pattern follows XAIVoiceSelector, OpenAIConversationPanel precedent

---

## Implementation Checklist

### Provider Component

- [ ] Create `src/components/providers/VapiProvider.tsx`
- [ ] Build assistant config from env vars (or use VITE_VAPI_ASSISTANT_ID)
- [ ] Integrate useVapiVoice hook
- [ ] Connect VoiceStatus component
- [ ] Connect ConversationPanel with messages + activeTranscript
- [ ] Add error display component

### Button Component

- [ ] Create `src/components/providers/VapiButton.tsx`
- [ ] Implement color states: green (idle) → orange (loading) → red (active)
- [ ] Add audio level glow effect via box-shadow
- [ ] Use Lucide icons: Mic (idle), Loader2 (loading), Square (active)

### Empty State

- [ ] Create `VapiEmptyState.tsx` for missing VITE_VAPI_WEB_TOKEN
- [ ] Display setup instructions with link to Vapi dashboard

### Tab Integration

- [ ] Add `vapi` to `ProviderType` enum in `voice-provider.ts`
- [ ] Create `isVapiEnabled()` function
- [ ] Register Vapi in `PROVIDERS` configuration
- [ ] Update `ProviderContext.tsx` with Vapi provider
- [ ] Add Vapi branding (use PhoneCall icon from Lucide)

### ConversationPanel Enhancement

- [ ] Add `activeTranscript` prop to ConversationPanel
- [ ] Display partial transcript as typing indicator
- [ ] Style typing indicator appropriately

---

## Alternative Sessions

If this session is blocked:

1. **phase05-session04-testing-polish** - Could start test scaffolding without full integration, but not recommended
2. **Skip to Phase 6** - Start Retell research if Vapi is deprioritized (not recommended without completing Vapi)

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
