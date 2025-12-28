# Session 02: Conversation History & Transcript

**Session ID**: `phase02-session02-conversation-history`
**Status**: Not Started
**Estimated Tasks**: ~22
**Estimated Duration**: 2-4 hours

---

## Objective

Display a real-time conversation transcript alongside audio for accessibility and user reference, capturing both user and AI messages.

---

## Scope

### In Scope (MVP)

- ConversationPanel component displaying message history
- Real-time transcript updates from WebSocket events
- Role differentiation (user vs assistant messages)
- Auto-scroll to latest message
- Clear history on new session
- Responsive design (works on mobile)

### Out of Scope

- Conversation export (save as text/PDF)
- Conversation persistence across sessions
- Search within conversation
- Timestamps on messages (stretch goal)
- Multi-language transcript support

---

## Prerequisites

- [ ] Understanding of WebSocket message events with transcript data
- [ ] Review `conversation.item.created` event structure
- [ ] Identify transcript availability per provider (OpenAI, xAI, ElevenLabs)

---

## Deliverables

1. `ConversationPanel.tsx` component with transcript UI
2. Message type definitions for conversation items
3. Updated provider contexts with message state
4. Integration into provider tabs alongside visualizer
5. Accessibility features (ARIA labels, keyboard navigation)

---

## Technical Notes

### Message Structure

```typescript
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// From WebSocket event
{
  type: 'conversation.item.created',
  item: {
    role: 'assistant',
    content: [{ type: 'text', text: '...' }]
  }
}
```

### Provider Transcript Availability

- **OpenAI**: Transcripts via `conversation.item.created` events
- **xAI**: Similar event structure for transcripts
- **ElevenLabs**: May require SDK-specific handling

---

## Success Criteria

- [ ] Transcript panel visible during active conversation
- [ ] Messages appear in real-time as conversation progresses
- [ ] User and assistant messages visually differentiated
- [ ] Panel scrolls to show latest message
- [ ] Works correctly on mobile viewport
- [ ] Accessible to screen readers
