# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 02 - Advanced Features
**Completed Sessions**: 8

---

## Recommended Next Session

**Session ID**: `phase02-session01-voice-selection`
**Session Name**: Voice Selection UI
**Estimated Duration**: 2-4 hours
**Estimated Tasks**: ~20

---

## Why This Session Next?

### Prerequisites Met
- [x] Phase 00 completed (Multi-Provider Voice foundation)
- [x] Phase 01 completed (OpenAI Voice Agent integration)
- [x] All three providers (ElevenLabs, xAI, OpenAI) working correctly
- [x] Understanding of session.update message format from Phase 01 research

### Dependencies
- **Builds on**: phase01-session04-openai-polish (three-provider architecture)
- **Enables**: phase02-session02-conversation-history (enhanced UI patterns)

### Project Progression
This is the first session of Phase 02 (Advanced Features) and represents the natural progression after completing the provider integration phases. Voice selection is a high-priority item explicitly listed in CONSIDERATIONS.md under "Phase 02 Roadmap > High Priority". It builds directly on the existing provider contexts (OpenAIVoiceContext, XAIVoiceContext) without requiring new infrastructure, making it an ideal starting point for Phase 02.

---

## Session Overview

### Objective
Implement a voice selection UI that allows users to choose from available voices for OpenAI and xAI providers, with the selection persisting across sessions.

### Key Deliverables
1. `VoiceSelector.tsx` component with dropdown UI
2. Updated `OpenAIVoiceContext.tsx` with voice state management
3. Updated `XAIVoiceContext.tsx` with voice state management
4. Voice persistence utility in localStorage
5. Integration with provider tabs

### Scope Summary
- **In Scope (MVP)**: Voice selector dropdown, OpenAI voices (alloy, ash, ballad, coral, echo, sage, shimmer, verse), xAI voices, localStorage persistence, session.update integration
- **Out of Scope**: ElevenLabs voice selection (uses Agent config), voice preview/playback, custom voice cloning

---

## Technical Considerations

### Technologies/Patterns
- Radix UI Select component for accessible dropdown
- localStorage persistence pattern (established in Phase 00)
- WebSocket session.update message for voice configuration
- Provider-specific context state management

### Potential Challenges
- **xAI Voice Documentation**: May need to query API or use documented defaults for available voices
- **Voice Availability**: Not all voices may be available for all accounts
- **UI Placement**: Need to integrate selector without cluttering provider tabs

### Relevant Considerations

From CONSIDERATIONS.md:

- [P01] **OpenAI voice options**: alloy, ash, ballad, coral, echo, sage, shimmer, verse - well documented
- [P00] **localStorage for persistence**: Provider selection pattern already established, extend for voice
- [P00] **Provider-Specific Contexts**: Extend OpenAIVoiceContext and XAIVoiceContext with voice state
- [P00] **Radix UI for accessibility**: Use Radix Select primitive for keyboard navigation

---

## Alternative Sessions

If this session is blocked:
1. **phase02-session02-conversation-history** - Independent feature, could be implemented first if voice API access is problematic
2. **phase02-session03-connection-resilience** - No dependencies on voice selection, addresses reliability

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
