# Session Specification

**Session ID**: `phase00-session04-provider-component`
**Phase**: 00 - Gemini Live Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session creates the GeminiProvider UI component that brings the Gemini Live voice functionality to users. With the backend token endpoint (Session 02), audio pipeline (Session 01), and core hook/context (Session 03) already implemented, this session connects all that infrastructure to a user-facing interface integrated with the existing tab system.

The GeminiProvider follows the established provider pattern used by all existing voice providers (ElevenLabs, OpenAI, xAI, Ultravox, Vapi, Retell). It reuses existing shared components (VoiceButton, VoiceStatus, VoiceVisualizer, ConversationPanel) while adding Gemini-specific features: a voice selector with 30 HD voice options, session timer display with warnings at 12/14/15 minutes, and an empty state component for unconfigured scenarios.

This session is the penultimate step in Phase 00, enabling users to interact with Gemini Live through the same familiar UI patterns established across all other providers. Session 05 will add comprehensive testing and polish.

---

## 2. Objectives

1. Create GeminiProvider.tsx following the established provider component pattern (Context wrapper + Button + Status + EmptyState)
2. Integrate Gemini tab into ProviderTabs.tsx controlled by VITE_GEMINI_ENABLED environment variable
3. Implement voice selector dropdown with all 30 Gemini HD voices with localStorage persistence
4. Display session timer and warnings (12min, 14min, 15min) in the status UI

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-dependencies-audio-infra` - AudioWorklet pipeline, @anthropic/genai-sdk
- [x] `phase00-session02-genai-client-backend` - Backend /api/gemini/session endpoint, GenAILiveClient
- [x] `phase00-session03-voice-hook-context` - useGeminiVoice hook, GeminiVoiceContext, GeminiVoiceProvider

### Required Tools/Knowledge

- React Context + hooks pattern for provider state management
- Radix UI Select primitive for accessible voice dropdown
- Framer Motion for consistent animations
- Existing provider component patterns (RetellProvider.tsx as reference)

### Environment Requirements

- Node.js 18+
- VITE_GEMINI_ENABLED environment variable
- Backend running with GOOGLE_AI_API_KEY configured

---

## 4. Scope

### In Scope (MVP)

- GeminiProvider.tsx main component wrapping GeminiVoiceProvider
- GeminiButton component with connect/disconnect, speaking/listening states
- GeminiVoiceStatus component showing connection status and session timer
- GeminiEmptyState component for unconfigured state
- Voice selector dropdown with 30 HD voices (from GEMINI_VOICES config)
- Voice selection persistence to localStorage
- Session timer display when connected (shows elapsed time)
- Session warnings at 12+ minutes and 14+ minutes
- "Session ending" message at 15 minutes with graceful disconnect
- Integration with ProviderTabs.tsx and ProviderContext.tsx
- ARIA accessibility attributes for all interactive elements
- Responsive design matching existing providers

### Out of Scope (Deferred)

- E2E tests - _Reason: Session 05 scope_
- Additional tool implementations beyond existing get*weather/get_time - \_Reason: Not required for MVP*
- Custom voice preview/playback in selector - _Reason: Future enhancement_

---

## 5. Technical Approach

### Architecture

The GeminiProvider follows the established layered architecture:

1. **GeminiProvider** - Outer wrapper that renders GeminiVoiceProvider context
2. **GeminiProviderInner** - Inner component using useGeminiVoice hook for state/controls
3. **GeminiButton** - Voice button with connect/disconnect, animated states
4. **GeminiVoiceStatus** - Connection status bar with session timer
5. **GeminiEmptyState** - Shown when VITE_GEMINI_ENABLED=false or unconfigured

### Design Patterns

- **Provider Pattern**: Context wrapper ensures single client instance per provider
- **Composition**: Reuse VoiceVisualizer, ConversationPanel, FunctionCallIndicator
- **Controlled Components**: Voice selector state lifted to parent for persistence
- **Ref Forwarding**: Connection tracking via useRef for cleanup callbacks

### Technology Stack

- React 18.3.1 with TypeScript
- Framer Motion for animations
- Radix UI Select for accessible voice dropdown
- Lucide React for icons
- Existing shared components from src/components/voice/

---

## 6. Deliverables

### Files to Create

| File                                            | Purpose                                       | Est. Lines |
| ----------------------------------------------- | --------------------------------------------- | ---------- |
| `src/components/providers/GeminiProvider.tsx`   | Main provider with Button, Status, EmptyState | ~500       |
| `src/components/providers/GeminiEmptyState.tsx` | Empty/unconfigured state UI                   | ~80        |

### Files to Modify

| File                               | Changes                                              | Est. Lines |
| ---------------------------------- | ---------------------------------------------------- | ---------- |
| `src/types/voice-provider.ts`      | Add 'gemini' to ProviderType union, PROVIDERS config | ~25        |
| `src/contexts/ProviderContext.tsx` | Add 'gemini' to providers array, isValidProvider     | ~10        |
| `src/pages/Index.tsx`              | Add GeminiProvider case in provider render switch    | ~20        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] GeminiProvider renders when VITE_GEMINI_ENABLED=true
- [ ] Gemini tab appears in ProviderTabs when enabled
- [ ] Gemini tab hidden when VITE_GEMINI_ENABLED=false
- [ ] GeminiButton connects to Gemini Live on click
- [ ] GeminiButton disconnects on second click when connected
- [ ] Voice selector shows all 30 HD voices from GEMINI_VOICES
- [ ] Default voice is Zephyr (from DEFAULT_GEMINI_VOICE)
- [ ] Voice selection persists to localStorage (gemini-voice key)
- [ ] VoiceVisualizer shows audio levels during conversation
- [ ] ConversationPanel displays transcripts
- [ ] FunctionCallIndicator shows when tools execute
- [ ] Session timer displays elapsed time when connected
- [ ] Warning indicator appears at 12+ minutes
- [ ] Urgent warning appears at 14+ minutes
- [ ] Session ends gracefully at 15 minutes

### Testing Requirements

- [ ] Manual testing: connect/disconnect cycle
- [ ] Manual testing: voice selection and persistence
- [ ] Manual testing: session timer display
- [ ] Manual testing: responsive layout on mobile

### Quality Gates

- [ ] All files ASCII-encoded
- [ ] Unix LF line endings
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] Code follows project conventions (CONVENTIONS.md)

---

## 8. Implementation Notes

### Key Considerations

- Use emerald/green color scheme for Gemini (distinct from teal/Retell, purple/Vapi)
- Voice selector needs good UX for 30 options - consider grouping by style
- Session timer should be prominent but not distracting
- Graceful disconnect at 15 minutes should show user-friendly message

### Potential Challenges

- **Voice selector UX with 30 options**: Use Radix Select with search/filter capability or group by style (calm, warm, bright, neutral, energetic)
- **Session timer accuracy**: Use setInterval in useEffect, clear on disconnect
- **Color scheme distinction**: Emerald (HSL 160) is distinct from teal (HSL 180) and purple (HSL 270)

### Relevant Considerations

- [P00] **Provider Pattern**: Must follow Context + Hook + Provider component architecture established by all existing providers
- [P00] **Tab System**: Integration with ProviderTabs.tsx requires updating ProviderContext.tsx providers array and PROVIDERS config
- [P00] **Component composition**: Reuse VoiceButton, VoiceStatus, VoiceVisualizer, ConversationPanel across providers
- [P00] **Environment variable toggles**: VITE_GEMINI_ENABLED controls provider visibility in tab list

### ASCII Reminder

All output files must use ASCII-only characters (0-127).

---

## 9. Testing Strategy

### Unit Tests

- Voice selector renders all 30 voices
- Voice selection updates localStorage
- Session timer displays correct format (MM:SS)
- Warning states trigger at correct thresholds

### Integration Tests

- GeminiProvider renders within ProviderTabs
- Tab switching preserves Gemini connection state
- Voice change takes effect on next connection

### Manual Testing

- Connect and have a voice conversation
- Verify audio visualization responds to speech
- Test voice selector with different voices
- Verify session timer counts up correctly
- Test on mobile viewport for responsive layout

### Edge Cases

- Connection fails (show error in GeminiVoiceStatus)
- User switches tabs while connected (connection maintained)
- Session times out at 15 minutes (graceful disconnect message)
- Voice not found in list (fallback to default)

---

## 10. Dependencies

### External Libraries

- @radix-ui/react-select: (existing) - Voice selector dropdown
- framer-motion: (existing) - Animations
- lucide-react: (existing) - Icons

### Other Sessions

- **Depends on**: phase00-session01, phase00-session02, phase00-session03
- **Depended by**: phase00-session05 (Testing & Polish)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
