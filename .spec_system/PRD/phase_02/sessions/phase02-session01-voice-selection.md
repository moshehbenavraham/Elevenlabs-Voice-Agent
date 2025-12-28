# Session 01: Voice Selection UI

**Session ID**: `phase02-session01-voice-selection`
**Status**: Not Started
**Estimated Tasks**: ~20
**Estimated Duration**: 2-4 hours

---

## Objective

Implement a voice selection UI that allows users to choose from available voices for OpenAI and xAI providers, with the selection persisting across sessions.

---

## Scope

### In Scope (MVP)

- Voice selector dropdown component with provider-specific voice options
- OpenAI voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse
- xAI voices: query available voices from API or use documented options
- Persist selected voice to localStorage per provider
- Pass selected voice to session.update WebSocket message
- Visual feedback showing current voice selection

### Out of Scope

- ElevenLabs voice selection (uses Agent configuration)
- Custom voice cloning or uploads
- Voice preview/sample playback
- Voice settings in configuration modal (Phase 02 stretch)

---

## Prerequisites

- [ ] Phase 01 completed with working OpenAI integration
- [ ] Understanding of session.update message format for both providers
- [ ] Review current voice parameter handling in contexts

---

## Deliverables

1. `VoiceSelector.tsx` component with dropdown UI
2. Updated `OpenAIVoiceContext.tsx` with voice state management
3. Updated `XAIVoiceContext.tsx` with voice state management
4. Voice persistence utility in localStorage
5. Integration with provider tabs

---

## Technical Notes

### OpenAI Voice Options

From documentation: alloy, ash, ballad, coral, echo, sage, shimmer, verse

### xAI Voice Options

Query from API or use documented defaults. Voice set via session.update message.

### Implementation Pattern

```typescript
// Voice selection stored in context
const [selectedVoice, setSelectedVoice] = useState<string>(() => {
  return localStorage.getItem('openai-voice') || 'alloy';
});

// Applied during session.update
ws.send(JSON.stringify({
  type: 'session.update',
  session: {
    voice: selectedVoice,
    // ... other session params
  }
}));
```

---

## Success Criteria

- [ ] Voice selector visible in OpenAI and xAI provider tabs
- [ ] Voice selection changes actual voice in conversation
- [ ] Selected voice persists across page reloads
- [ ] Default voice works when no selection made
- [ ] No breaking changes to existing functionality
