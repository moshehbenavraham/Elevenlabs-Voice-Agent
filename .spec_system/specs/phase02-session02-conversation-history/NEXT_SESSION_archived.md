# NEXT_SESSION.md

## Session Recommendation

**Generated**: 2025-12-28
**Project State**: Phase 02 - Advanced Features
**Completed Sessions**: 9

---

## Recommended Next Session

**Session ID**: `phase02-session02-conversation-history`
**Session Name**: Conversation History & Transcript Display
**Estimated Duration**: 3-4 hours
**Estimated Tasks**: 20-25

---

## Why This Session Next?

### Prerequisites Met

- [x] Voice selection UI complete (phase02-session01-voice-selection)
- [x] All three providers operational (ElevenLabs, xAI, OpenAI)
- [x] Provider contexts established with state management patterns
- [x] WebSocket message handling in place for all providers

### Dependencies

- **Builds on**: phase02-session01-voice-selection (voice state management patterns)
- **Enables**: Function calling integration (messages will display function call results)

### Project Progression

This is the second high-priority item in the Phase 02 roadmap. Conversation history provides critical accessibility features (text alongside audio) and enhances user experience by making conversations reviewable. The existing `messages` array in `VoiceProviderState` provides the foundation - this session surfaces that data in the UI.

---

## Session Overview

### Objective

Display real-time conversation transcripts alongside voice interactions for all three providers, with scrolling history, speaker attribution, and accessibility support.

### Key Deliverables

1. ConversationHistory component with auto-scroll and message list
2. Message components with speaker attribution (user/assistant/system)
3. Integration with all three provider contexts (ElevenLabs, xAI, OpenAI)
4. Accessibility: screen reader support, reduced motion, keyboard navigation
5. Responsive design: collapsible/expandable on mobile

### Scope Summary

- **In Scope (MVP)**: Real-time transcript display, speaker labels, auto-scroll, copy message, basic styling
- **Out of Scope**: Search/filter, export to file, message editing, timestamps (stretch goal), function call rendering (future session)

---

## Technical Considerations

### Technologies/Patterns

- Existing `messages: VoiceMessage[]` state in provider contexts
- Radix UI ScrollArea for scrollable container
- Framer Motion for message entry animations
- useRef with scrollIntoView for auto-scroll
- aria-live regions for screen reader announcements

### Potential Challenges

- **ElevenLabs message format**: May differ from xAI/OpenAI - need format normalization
- **Streaming text**: xAI/OpenAI send partial text updates - need to handle text deltas
- **Performance**: Long conversations may need virtualization (stretch goal)
- **Mobile layout**: Balancing transcript visibility with voice button prominence

### Relevant Considerations

- [P00] **Provider-Specific Contexts**: Each provider has dedicated context - transcript component must work with all three
- [P00] **Interface segregation**: VoiceProviderState already defines `messages: VoiceMessage[]` - leverage existing type
- [P00] **Glassmorphism design system**: Match existing backdrop-blur + semi-transparent styling

---

## Alternative Sessions

If this session is blocked:

1. **phase02-session03-reconnection** - Implement exponential backoff for network resilience (independent of transcript)
2. **phase02-session04-function-calling** - Add function calling support (can be done without visible history)

---

## Next Steps

Run `/sessionspec` to generate the formal specification.
