# Session 01: Foundation - Provider Types & Tab System

| Field                  | Value                        |
| ---------------------- | ---------------------------- |
| **Session ID**         | phase00-session01-foundation |
| **Phase**              | 00 - Multi-Provider Voice    |
| **Status**             | Not Started                  |
| **Estimated Duration** | 2-3 hours                    |
| **Estimated Tasks**    | 20-25                        |

---

## Objective

Establish the foundational architecture for multi-provider voice agents by creating TypeScript interfaces for provider abstraction, implementing a tab-based navigation system with glassmorphism styling, and setting up the ProviderContext for active provider state management.

---

## Prerequisites

- [x] Existing ElevenLabs integration working
- [x] shadcn/ui components available
- [x] Tailwind CSS configured with glassmorphism design system
- [x] React Context pattern established (ThemeContext reference)

---

## Key Deliverables

### 1. Provider Type Definitions

- `src/types/voice-provider.ts` with unified interfaces
- `ProviderType` enum: 'elevenlabs' | 'xai' | 'openai'
- `VoiceProviderState` interface
- `VoiceProviderActions` interface
- `VoiceProvider` combined interface

### 2. Tab Components

- `src/components/tabs/ProviderTabs.tsx` - Container with styling
- `src/components/tabs/ProviderTab.tsx` - Individual tab component
- Tab states: default, active, hover, disabled
- Keyboard navigation: arrow keys + Enter

### 3. Provider Context

- `src/contexts/ProviderContext.tsx` - Active provider state
- localStorage persistence for selected tab
- Hook: `useProviderContext()`

### 4. Index.tsx Integration

- Wrap voice content with ProviderTabs
- Tab switching logic
- Disconnect handling on tab switch

---

## Scope

### In Scope (MVP)

- TypeScript interfaces for provider abstraction
- Basic tab component with glassmorphism styling
- ElevenLabs tab as default (and only active provider initially)
- Provider context with tab selection state
- localStorage persistence
- Keyboard accessibility

### Out of Scope

- xAI integration (Session 02-03)
- Backend changes (Session 02)
- Provider-specific configuration modals
- Tab transition animations (defer to polish)
- Mobile swipe gestures

---

## Technical Approach

### Provider Type Interface

```typescript
export type ProviderType = 'elevenlabs' | 'xai' | 'openai';

export interface VoiceProviderState {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  isSpeaking: boolean;
  error: string | null;
}

export interface VoiceProvider {
  provider: ProviderType;
  displayName: string;
  isConfigured: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
```

### Tab Component Pattern

- Use Radix UI Tabs primitive or custom implementation
- Style with Tailwind utilities + custom glassmorphism
- Active tab: solid background with glow effect
- Hover: slight scale + brightness increase

### Context Pattern

Follow existing ThemeContext pattern:

```typescript
const ProviderContext = createContext<ProviderContextType | undefined>(undefined);
export const useProvider = () => useContext(ProviderContext);
```

---

## Dependencies

### Internal

- `src/contexts/ThemeContext.tsx` - Pattern reference
- `src/components/ui/tabs.tsx` - Radix tabs (if using)
- Existing glassmorphism styles in Tailwind config

### External

- None - all frontend work

---

## Success Criteria

1. Provider types compile without errors
2. Tab components render with correct styling
3. Tab selection persists across page refreshes
4. Keyboard navigation works (Tab, Arrow keys, Enter)
5. ElevenLabs voice functionality unchanged
6. Lint passes: `npm run lint`
7. Tests pass: `npm run test:run`

---

## Files to Create/Modify

| File                                   | Action | Description                    |
| -------------------------------------- | ------ | ------------------------------ |
| `src/types/voice-provider.ts`          | CREATE | Provider interface definitions |
| `src/contexts/ProviderContext.tsx`     | CREATE | Active provider state context  |
| `src/components/tabs/ProviderTabs.tsx` | CREATE | Tab container component        |
| `src/components/tabs/ProviderTab.tsx`  | CREATE | Individual tab component       |
| `src/components/tabs/index.ts`         | CREATE | Barrel export                  |
| `src/pages/Index.tsx`                  | MODIFY | Add tab integration            |
| `src/types/index.ts`                   | MODIFY | Export voice-provider types    |

---

## Testing Strategy

- Unit tests for ProviderContext
- Component tests for tab rendering and selection
- Integration test for tab switching + persistence
- Manual verification of keyboard navigation
