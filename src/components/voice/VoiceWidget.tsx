import { useEffect, useRef } from 'react';

// Declare custom element for TypeScript
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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
