# Session 03: Provider Component & Tab Integration

**Session ID**: `phase06-session03-provider-tab`
**Status**: Not Started
**Estimated Tasks**: ~12-18
**Estimated Duration**: 2-3 hours

---

## Objective

Create `RetellProvider` component using `useRetellVoice` hook, integrate with existing tab system, and wire up shared voice UI components.

---

## Scope

### In Scope (MVP)

- Create `src/components/providers/RetellProvider.tsx`
- Add `retell` to `ProviderType` enum in `voice-provider.ts`
- Add `isRetellEnabled()` function in `voice-provider.ts`
- Register Retell in `PROVIDERS` configuration
- Update `ProviderContext.tsx` with Retell provider
- Create `RetellButton.tsx` with talking state visualization (or reuse VoiceButton)
- Add Retell branding/icon
- Create `RetellEmptyState` for unconfigured state (no agent ID)
- Display transcript in `ConversationPanel`
- Display `isAgentTalking` state in UI
- Handle `latestTranscript` display during active call

### Out of Scope

- Unit tests (Session 04)
- Integration tests (Session 04)
- `metadata` event UI (Session 04)
- Audio visualization from `audio` event (Session 04)

---

## Prerequisites

- [ ] Session 02 completed (`useRetellVoice` hook working)
- [ ] Existing tab system functional
- [ ] VoiceButton, VoiceStatus, ConversationPanel components available

---

## Deliverables

1. `src/components/providers/RetellProvider.tsx` - Main provider component
2. Updated `src/types/voice-provider.ts` with Retell type and `isRetellEnabled()`
3. Updated `ProviderContext.tsx` with Retell provider registration
4. Retell icon/branding asset (if custom icon needed)

---

## Success Criteria

- [ ] Retell tab appears when `VITE_RETELL_ENABLED=true`
- [ ] Tab shows proper branding and icon
- [ ] Connect/disconnect works via button
- [ ] Button shows `isAgentTalking` state visually
- [ ] Transcript displayed in conversation panel
- [ ] Empty state shown when `VITE_RETELL_AGENT_ID` not configured
- [ ] Smooth tab switching with other providers
- [ ] Provider context properly updated on Retell selection
