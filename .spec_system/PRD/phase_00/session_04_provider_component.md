# Session 04: Provider Component & UI

**Session ID**: `phase00-session04-provider-component`
**Status**: Not Started
**Estimated Tasks**: ~14
**Estimated Duration**: 2-4 hours

---

## Objective

Create the GeminiProvider component with full UI integration, including voice selector, conversation panel, function call indicator, and integration with the tab system.

---

## Scope

### In Scope (MVP)

- Create GeminiProvider.tsx following existing provider patterns
- Integrate with ProviderTabs.tsx via VITE_GEMINI_ENABLED toggle
- Update ProviderContext.tsx to include 'gemini' provider
- Reuse VoiceButton, VoiceStatus, VoiceVisualizer, ConversationPanel
- Create voice selector dropdown with 30 HD voice options
- Default voice selection to Puck
- Voice selection persistence to localStorage
- Integrate FunctionCallIndicator for tool execution feedback
- Display session timer in status area (12+ minutes)
- Show session ending warning (14+ minutes)
- Display "Session ended" message at 15 minutes
- Add GeminiEmptyState component for initial state
- Accessibility: ARIA attributes, focus management
- Responsive design following existing patterns

### Out of Scope

- E2E tests (Session 05)
- Additional tool implementations beyond get_weather/get_time

---

## Prerequisites

- [ ] Session 03 completed (useGeminiVoice hook, GeminiVoiceContext)
- [ ] Existing UI components available (VoiceButton, VoiceStatus, etc.)

---

## Deliverables

1. `src/components/providers/GeminiProvider.tsx` - Main provider component
2. `src/components/providers/GeminiEmptyState.tsx` - Initial state UI
3. Updated `src/components/tabs/ProviderTabs.tsx` with Gemini tab
4. Updated `src/contexts/ProviderContext.tsx` with 'gemini' provider
5. Voice selector integration with 30 HD voice options

---

## Success Criteria

- [ ] GeminiProvider renders with consistent UI patterns
- [ ] Tab appears when VITE_GEMINI_ENABLED=true
- [ ] Tab hidden when VITE_GEMINI_ENABLED=false
- [ ] Voice selector shows all 30 HD voices
- [ ] Puck is default voice selection
- [ ] Voice selection persists to localStorage
- [ ] VoiceButton connects/disconnects correctly
- [ ] VoiceStatus displays current state
- [ ] VoiceVisualizer shows audio levels
- [ ] ConversationPanel displays transcripts
- [ ] FunctionCallIndicator shows tool execution
- [ ] Session timer displays at 12+ minutes
- [ ] Warning displays at 14+ minutes
- [ ] Graceful disconnect message at 15 minutes
- [ ] ARIA attributes present for accessibility
- [ ] Responsive on mobile viewports
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
