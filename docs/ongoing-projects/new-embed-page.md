# New Embed Page Implementation Plan

## Overview

This document outlines the implementation of an alternate voice agent connection mode using the ElevenLabs embed widget instead of the React SDK. The toggle is controlled via environment variable, allowing easy switching between modes.

## Connection Modes

| Mode                   | Env Value   | Description                                                                                        |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| **SDK Mode** (current) | `agent-sdk` | Uses `@elevenlabs/react` SDK with `useConversation` hook. Full programmatic control, custom UI.    |
| **Widget Mode** (new)  | `widget`    | Uses `@elevenlabs/convai-widget-embed` web component. ElevenLabs-hosted orb UI with customization. |

## Embed Code Reference

```html
<elevenlabs-convai agent-id="agent_01jygnej4rf2093vcsst18ksay"></elevenlabs-convai>
<script
  src="https://unpkg.com/@elevenlabs/convai-widget-embed@beta"
  async
  type="text/javascript"
></script>
```

## Environment Variables

Toggle controlled by `VITE_VOICE_CONNECTION_MODE` in `.env`:

```bash
# Connection mode: "agent-sdk" or "widget"
VITE_VOICE_CONNECTION_MODE=agent-sdk

# Widget customization (only used when mode=widget)
VITE_WIDGET_ORB_COLOR_1=#fbbf24          # Amber gold (primary)
VITE_WIDGET_ORB_COLOR_2=#a78bfa          # Violet soft (secondary)
VITE_WIDGET_VARIANT=compact              # compact | expanded
VITE_WIDGET_ACTION_TEXT=Talk to AI
VITE_WIDGET_START_CALL_TEXT=Start Conversation
VITE_WIDGET_END_CALL_TEXT=End Conversation
VITE_WIDGET_LISTENING_TEXT=Listening...
VITE_WIDGET_SPEAKING_TEXT=Speaking...
VITE_WIDGET_AVATAR_URL=                  # Optional custom avatar image
VITE_WIDGET_OVERRIDE_VOICE_ID=           # Optional voice override
VITE_WIDGET_OVERRIDE_LANGUAGE=           # Optional language override
VITE_WIDGET_OVERRIDE_FIRST_MESSAGE=      # Optional first message override
```

---

## Implementation Plan

### Phase 1: Create Widget Component

**File:** `src/components/voice/VoiceWidget.tsx`

```tsx
import { useEffect, useRef } from 'react';

// Declare custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          'avatar-image-url'?: string;
          'avatar-orb-color-1'?: string;
          'avatar-orb-color-2'?: string;
          variant?: string;
          'action-text'?: string;
          'start-call-text'?: string;
          'end-call-text'?: string;
          'listening-text'?: string;
          'speaking-text'?: string;
          'override-voice-id'?: string;
          'override-language'?: string;
          'override-first-message'?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface VoiceWidgetProps {
  className?: string;
}

export function VoiceWidget({ className }: VoiceWidgetProps) {
  const scriptLoaded = useRef(false);

  // Load the widget script dynamically
  useEffect(() => {
    if (scriptLoaded.current) return;

    const existingScript = document.querySelector('script[src*="convai-widget-embed"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed@beta';
      script.async = true;
      document.body.appendChild(script);
    }

    scriptLoaded.current = true;
  }, []);

  // Read configuration from environment
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const orbColor1 = import.meta.env.VITE_WIDGET_ORB_COLOR_1;
  const orbColor2 = import.meta.env.VITE_WIDGET_ORB_COLOR_2;
  const variant = import.meta.env.VITE_WIDGET_VARIANT;
  const actionText = import.meta.env.VITE_WIDGET_ACTION_TEXT;
  const startCallText = import.meta.env.VITE_WIDGET_START_CALL_TEXT;
  const endCallText = import.meta.env.VITE_WIDGET_END_CALL_TEXT;
  const listeningText = import.meta.env.VITE_WIDGET_LISTENING_TEXT;
  const speakingText = import.meta.env.VITE_WIDGET_SPEAKING_TEXT;
  const avatarUrl = import.meta.env.VITE_WIDGET_AVATAR_URL;
  const overrideVoiceId = import.meta.env.VITE_WIDGET_OVERRIDE_VOICE_ID;
  const overrideLanguage = import.meta.env.VITE_WIDGET_OVERRIDE_LANGUAGE;
  const overrideFirstMessage = import.meta.env.VITE_WIDGET_OVERRIDE_FIRST_MESSAGE;

  return (
    <div className={className}>
      <elevenlabs-convai
        agent-id={agentId}
        avatar-orb-color-1={orbColor1 || undefined}
        avatar-orb-color-2={orbColor2 || undefined}
        variant={variant || undefined}
        action-text={actionText || undefined}
        start-call-text={startCallText || undefined}
        end-call-text={endCallText || undefined}
        listening-text={listeningText || undefined}
        speaking-text={speakingText || undefined}
        avatar-image-url={avatarUrl || undefined}
        override-voice-id={overrideVoiceId || undefined}
        override-language={overrideLanguage || undefined}
        override-first-message={overrideFirstMessage || undefined}
      />
    </div>
  );
}
```

### Phase 2: Create Mode Switcher Hook

**File:** `src/hooks/useConnectionMode.ts`

```tsx
export type ConnectionMode = 'agent-sdk' | 'widget';

export function useConnectionMode(): ConnectionMode {
  const mode = import.meta.env.VITE_VOICE_CONNECTION_MODE;

  if (mode === 'widget') {
    return 'widget';
  }

  return 'agent-sdk'; // default
}
```

### Phase 3: Update Index.tsx with Conditional Rendering

**File:** `src/pages/Index.tsx`

Add mode detection and conditional rendering:

```tsx
import { useConnectionMode } from '@/hooks/useConnectionMode';
import { VoiceWidget } from '@/components/voice/VoiceWidget';

export const Index = () => {
  const connectionMode = useConnectionMode();

  // ... existing state and hooks ...

  // Widget mode - simplified UI with ElevenLabs widget
  if (connectionMode === 'widget') {
    return (
      <div className="min-h-screen bg-[#09090b] relative overflow-hidden film-grain">
        <BackgroundEffects />

        {/* Header - same as SDK mode */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          {/* ... header content ... */}
        </header>

        {/* Main Content - Widget Mode */}
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl sm:text-6xl text-zinc-100 mb-4">
              Voice<span className="text-gradient">AI</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md mx-auto">
              Click the orb below to start a conversation
            </p>
          </div>

          {/* ElevenLabs Widget - positioned center */}
          <VoiceWidget className="relative z-20" />
        </main>

        {/* Footer accent */}
        <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
      </div>
    );
  }

  // SDK mode - existing implementation
  return (
    // ... existing JSX ...
  );
};
```

### Phase 4: Widget Event Integration (Optional Enhancement)

Listen to widget events for deeper integration:

```tsx
// In VoiceWidget.tsx or a separate hook
useEffect(() => {
  const handleWidgetCall = (event: CustomEvent) => {
    console.log('Widget event:', event.detail);
    // Handle client tools, redirects, etc.
  };

  window.addEventListener('elevenlabs-convai:call', handleWidgetCall as EventListener);

  return () => {
    window.removeEventListener('elevenlabs-convai:call', handleWidgetCall as EventListener);
  };
}, []);
```

---

## File Changes Summary

| File                                   | Action   | Description                                            |
| -------------------------------------- | -------- | ------------------------------------------------------ |
| `src/components/voice/VoiceWidget.tsx` | **DONE** | New widget component with all customization attributes |
| `src/hooks/useConnectionMode.ts`       | **DONE** | Hook to read connection mode from env                  |
| `src/pages/Index.tsx`                  | **DONE** | Add conditional rendering based on connection mode     |
| `.env`                                 | **DONE** | Widget configuration variables added                   |
| `.env.example`                         | **DONE** | Widget configuration variables added                   |

---

## Testing Checklist

- [ ] SDK mode works as before (`VITE_VOICE_CONNECTION_MODE=agent-sdk`)
- [ ] Widget mode renders ElevenLabs orb (`VITE_VOICE_CONNECTION_MODE=widget`)
- [ ] Widget colors match Acoustic Noir theme (amber/violet gradient)
- [ ] Widget text labels display correctly
- [ ] Widget variant (compact/expanded) works
- [ ] Background effects render behind widget
- [ ] Mobile responsive layout works
- [ ] Widget events fire correctly (if implemented)

---

## Visual Comparison

### SDK Mode (Current)

- Custom `VoiceButton` component
- Custom `VoiceVisualizer` with canvas
- Custom `VoiceStatus` component
- Full control over UI/UX
- Uses `@elevenlabs/react` useConversation hook

### Widget Mode (New)

- ElevenLabs orb component
- Built-in audio visualization
- Built-in status indicators
- Customizable via attributes
- Uses `<elevenlabs-convai>` web component

---

## Future Enhancements

1. **Hybrid Mode**: Use widget for connection but custom visualizer
2. **Widget Positioning**: Add env var for position (center, bottom-right, etc.)
3. **Custom CSS Injection**: Override widget styles with CSS custom properties
4. **Analytics Bridge**: Pipe widget events to your analytics
5. **A/B Testing**: Runtime mode switching for user preference testing
