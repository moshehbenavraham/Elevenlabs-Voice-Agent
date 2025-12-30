# Session 03: Provider Component & Tab Integration

**Session ID**: `phase05-session03-provider-component`
**Status**: Not Started
**Estimated Tasks**: ~18
**Estimated Duration**: 3-4 hours

---

## Objective

Create `VapiProvider` component using `useVapiVoice` hook, integrate with existing tab system, and wire up shared voice UI components with activeTranscript support.

---

## Scope

### In Scope (MVP)

- Create `src/components/providers/VapiProvider.tsx`
- Create `VapiButton.tsx` with audio level visualization (glow effect)
- Create `VapiEmptyState` for unconfigured state (no token)
- Add `vapi` to `ProviderType` enum in `voice-provider.ts`
- Add `isVapiEnabled()` function
- Register Vapi in `PROVIDERS` configuration
- Update `ProviderContext.tsx` with Vapi provider
- Pass `activeTranscript` to `ConversationPanel` for typing indicator
- Add Vapi branding/icon

### Out of Scope

- Function calling UI
- Configuration modal integration
- Comprehensive testing

---

## Prerequisites

- [ ] Session 02 completed (hook functional)
- [ ] Existing tab system working

---

## Deliverables

1. `src/components/providers/VapiProvider.tsx` - Main provider component
2. `src/components/providers/VapiButton.tsx` - Button with audio level glow
3. `VapiEmptyState` component (inline or separate file)
4. Updated `voice-provider.ts` with:
   - `vapi` in `ProviderType`
   - `isVapiEnabled()` function
   - Vapi in `PROVIDERS` configuration
5. Updated `ProviderContext.tsx`
6. Vapi icon/branding added

---

## Success Criteria

- [ ] Vapi tab appears when `VITE_VAPI_ENABLED=true`
- [ ] Tab shows proper branding and icon
- [ ] Connect/disconnect works via button
- [ ] Button color changes: green (idle) -> orange (loading) -> red (active)
- [ ] Audio level visualization (glow effect) works during call
- [ ] `activeTranscript` displayed as typing indicator in conversation
- [ ] Empty state shown when `VITE_VAPI_WEB_TOKEN` not configured
- [ ] Tab switching disconnects active Vapi call
