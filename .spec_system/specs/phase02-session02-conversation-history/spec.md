# Session Specification

**Session ID**: `phase02-session02-conversation-history`
**Phase**: 02 - Advanced Features
**Status**: Not Started
**Created**: 2025-12-28

---

## 1. Session Overview

This session implements real-time conversation transcript display alongside voice interactions for all three providers (ElevenLabs, xAI, OpenAI). The feature provides critical accessibility by offering text representation of audio conversations, making the application usable for deaf/hard-of-hearing users and allowing all users to review conversation content.

The implementation leverages the existing `messages: VoiceMessage[]` state already defined in `VoiceProviderState` interface. Each provider context (VoiceContext, XAIVoiceContext, OpenAIVoiceContext) will populate this array from WebSocket transcript events. A unified ConversationPanel component will consume messages from whichever provider is active.

This session builds directly on voice selection (phase02-session01) and enables future function calling integration (phase02-session04) where function call results will appear in the transcript. The conversation history enhances user experience by making conversations reviewable and provides the foundation for future features like export and search.

---

## 2. Objectives

1. Create ConversationPanel component that displays real-time message history with auto-scroll
2. Implement message capture from WebSocket events for xAI and OpenAI providers
3. Integrate ElevenLabs SDK transcript events into unified message format
4. Ensure full accessibility with ARIA labels, screen reader announcements, and keyboard navigation

---

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session01-voice-selection` - Voice selection UI and provider state patterns
- [x] `phase01-session03-openai-frontend` - OpenAI WebSocket message handling
- [x] `phase00-session03-xai-frontend` - xAI WebSocket message handling

### Required Tools/Knowledge

- Understanding of WebSocket `conversation.item.created` event structure
- ElevenLabs React SDK transcript callback patterns
- Radix UI ScrollArea component

### Environment Requirements

- All three providers configured with valid API keys
- Development server running on port 8082

---

## 4. Scope

### In Scope (MVP)

- ConversationPanel component with scrollable message list
- Real-time transcript updates from WebSocket events
- Role differentiation styling (user vs assistant messages)
- Auto-scroll to latest message with useRef + scrollIntoView
- Clear history when starting new conversation session
- Responsive layout (collapsible on mobile, side panel on desktop)
- Copy message to clipboard functionality
- Screen reader announcements via aria-live regions

### Out of Scope (Deferred)

- Export conversation (save as text/PDF) - _Reason: Phase 03 feature_
- Conversation persistence across sessions - _Reason: Requires backend storage_
- Search within conversation - _Reason: Stretch goal for phase 02_
- Timestamps on messages - _Reason: Stretch goal, can add later_
- Function call result rendering - _Reason: phase02-session04_
- Message editing - _Reason: Not applicable for voice transcripts_

---

## 5. Technical Approach

### Architecture

The ConversationPanel will be a presentational component that receives messages from the active provider context. A `useActiveProviderMessages` hook will abstract provider selection, reading from the appropriate context based on active tab. Messages flow: WebSocket event -> Provider context state -> Hook -> ConversationPanel.

```
WebSocket Events
      |
      v
Provider Context (XAI/OpenAI/ElevenLabs)
      |
      v
useActiveProviderMessages hook
      |
      v
ConversationPanel component
      |
      v
MessageBubble components
```

### Design Patterns

- **Compound Component**: ConversationPanel + MessageBubble for flexible styling
- **Custom Hook**: useActiveProviderMessages for provider abstraction
- **Controlled Scroll**: useRef with scrollIntoView for auto-scroll behavior
- **Interface Segregation**: Extend existing VoiceMessage type rather than creating new

### Technology Stack

- React 18.3.1 with TypeScript
- Radix UI ScrollArea for accessible scrolling
- Framer Motion for message entry animations
- Tailwind CSS with glassmorphism patterns

---

## 6. Deliverables

### Files to Create

| File                                                | Purpose                                      | Est. Lines |
| --------------------------------------------------- | -------------------------------------------- | ---------- |
| `src/components/conversation/ConversationPanel.tsx` | Main transcript container with scroll area   | ~120       |
| `src/components/conversation/MessageBubble.tsx`     | Individual message display with role styling | ~80        |
| `src/components/conversation/index.ts`              | Barrel export for conversation components    | ~5         |
| `src/hooks/useActiveProviderMessages.ts`            | Hook to get messages from active provider    | ~40        |

### Files to Modify

| File                                      | Changes                                              | Est. Lines |
| ----------------------------------------- | ---------------------------------------------------- | ---------- |
| `src/contexts/XAIVoiceContext.tsx`        | Add message capture from WebSocket transcript events | ~30        |
| `src/contexts/OpenAIVoiceContext.tsx`     | Add message capture from WebSocket transcript events | ~30        |
| `src/contexts/VoiceContext.tsx`           | Add ElevenLabs SDK transcript callback handling      | ~20        |
| `src/components/voice/XAIProvider.tsx`    | Integrate ConversationPanel alongside visualizer     | ~15        |
| `src/components/voice/OpenAIProvider.tsx` | Integrate ConversationPanel alongside visualizer     | ~15        |
| `src/components/voice/VoiceButton.tsx`    | Integrate ConversationPanel for ElevenLabs           | ~15        |
| `src/types/voice.ts`                      | Ensure VoiceMessage type has all required fields     | ~10        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Transcript panel visible during active conversation for all three providers
- [ ] Messages appear in real-time as conversation progresses
- [ ] User messages display with distinct styling (right-aligned, different color)
- [ ] Assistant messages display with distinct styling (left-aligned, different color)
- [ ] Panel auto-scrolls to show latest message
- [ ] New conversation clears previous messages
- [ ] Copy button on messages copies text to clipboard

### Testing Requirements

- [ ] Unit tests for ConversationPanel rendering
- [ ] Unit tests for MessageBubble with different roles
- [ ] Unit tests for useActiveProviderMessages hook
- [ ] Manual testing with all three providers
- [ ] Mobile viewport testing (375px, 768px)

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] Code follows project conventions (CONVENTIONS.md)
- [ ] No new ESLint errors
- [ ] Respects prefers-reduced-motion for animations
- [ ] Touch targets minimum 44px on mobile

---

## 8. Implementation Notes

### Key Considerations

- ElevenLabs SDK may have different transcript event structure than xAI/OpenAI - normalize to VoiceMessage format
- xAI and OpenAI send streaming text updates (deltas) - accumulate into final message
- Consider debouncing rapid message updates to prevent UI thrashing
- Mobile layout must balance transcript visibility with voice button prominence

### Potential Challenges

- **ElevenLabs transcript format**: May require SDK documentation review to find transcript callback
- **Streaming text accumulation**: Need to handle `response.text.delta` events and accumulate
- **Scroll behavior conflicts**: Auto-scroll should pause if user manually scrolls up
- **Mobile layout balance**: Transcript panel competes with visualizer for space

### Relevant Considerations

- [P00] **Provider-Specific Contexts**: Each provider has dedicated context - transcript component reads from active one
- [P00] **Interface segregation**: VoiceProviderState already defines `messages: VoiceMessage[]` - extend rather than replace
- [P00] **Glassmorphism design system**: Use backdrop-blur + bg-white/10 for panel styling
- [P00] **Switch statement for WebSocket messages**: Use switch for routing transcript event types

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- ConversationPanel renders empty state correctly
- ConversationPanel renders list of messages
- MessageBubble displays user role with correct styling
- MessageBubble displays assistant role with correct styling
- Copy button triggers clipboard API
- useActiveProviderMessages returns correct provider's messages

### Integration Tests

- Messages appear when provider sends transcript events
- Auto-scroll activates on new message arrival
- Panel clears when new session starts

### Manual Testing

- Start conversation with ElevenLabs, verify transcript appears
- Start conversation with xAI, verify transcript appears
- Start conversation with OpenAI, verify transcript appears
- Test on mobile viewport (375px width)
- Test with screen reader (VoiceOver/NVDA)
- Test copy to clipboard functionality

### Edge Cases

- Very long messages (500+ characters) - should wrap properly
- Rapid message sequence - should not cause performance issues
- Empty messages - should be filtered out
- User scrolls up during conversation - auto-scroll should pause

---

## 10. Dependencies

### External Libraries

- `@radix-ui/react-scroll-area`: Already installed, used for scrollable container
- `framer-motion`: Already installed, used for message animations
- `lucide-react`: Already installed, used for copy icon

### Other Sessions

- **Depends on**: phase02-session01-voice-selection (provider state patterns)
- **Depended by**: phase02-session04-function-calling (will add function call rendering)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
