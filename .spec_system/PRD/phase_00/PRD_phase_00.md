# Phase 00: Multi-Provider Voice

**Status**: In Progress
**Progress**: 1/4 sessions (25%)

## Overview

Implement a tabbed interface system that allows users to demo and interact with AI voice agents from multiple providers. The initial implementation adds xAI (Grok) voice agent alongside the existing ElevenLabs agent, with architecture designed for easy addition of future providers.

## Progress Tracker

| Session | Name | Status | Validated |
|---------|------|--------|-----------|
| 01 | Foundation - Provider Types & Tab System | Complete | 2025-12-28 |
| 02 | xAI Backend Integration | Not Started | - |
| 03 | xAI Frontend Integration | Not Started | - |
| 04 | Polish & Testing | Not Started | - |

## Objectives

1. Create provider abstraction layer with unified TypeScript interfaces
2. Implement tab-based navigation with glassmorphism styling
3. Create ProviderContext for active provider state management
4. Integrate xAI voice agent via backend ephemeral token pattern
5. Ensure graceful disconnect when switching between providers
6. Maintain mobile responsiveness and keyboard accessibility

## Key Deliverables

### Foundation
- [x] `src/types/voice-provider.ts` - Unified provider interfaces
- [x] `src/contexts/ProviderContext.tsx` - Active provider state
- [x] `src/components/tabs/ProviderTabs.tsx` - Tab container
- [x] `src/components/tabs/ProviderTab.tsx` - Individual tab component

### xAI Integration
- [ ] `server/routes/xai.ts` - Backend ephemeral token endpoint
- [ ] `src/contexts/XAIVoiceContext.tsx` - xAI voice connection logic
- [ ] `src/components/providers/XAIProvider.tsx` - xAI provider wrapper
- [ ] Audio encoding/decoding for xAI (PCM 16-bit, 24kHz)

### Polish
- [ ] Tab transition animations
- [ ] "Not configured" state for missing API keys
- [ ] Mobile-responsive tab design
- [ ] Keyboard navigation (arrow keys, Enter)

## Technical Constraints

- Backend required for xAI (API key cannot be exposed to browser)
- Use existing `server/index.js` Express setup
- xAI uses WebSocket with ephemeral token pattern
- Audio format: PCM 16-bit, 24kHz sample rate for xAI

## Sessions

- [Session 01: Foundation](sessions/phase00-session01-foundation.md)
- [Session 02: xAI Backend](sessions/phase00-session02-xai-backend.md)
- [Session 03: xAI Frontend](sessions/phase00-session03-xai-frontend.md)
- [Session 04: Polish & Testing](sessions/phase00-session04-polish.md)

## Next Steps

Run `/sessionspec` to generate the formal specification for the recommended session.
