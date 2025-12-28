import { useContext, useMemo } from 'react';
import { useProvider } from '@/contexts/ProviderContext';
import { VoiceContext } from '@/contexts/VoiceContext';
import { XAIVoiceContext } from '@/contexts/XAIVoiceContext';
import { OpenAIVoiceContext } from '@/contexts/OpenAIVoiceContext';
import type { VoiceMessage } from '@/types';

/**
 * Hook to get messages from the currently active voice provider
 * Abstracts provider selection and returns unified message format
 */
export function useActiveProviderMessages(): VoiceMessage[] {
  const { activeProvider } = useProvider();

  // Get context values (may be null if not wrapped in provider)
  const elevenLabsContext = useContext(VoiceContext);
  const xaiContext = useContext(XAIVoiceContext);
  const openaiContext = useContext(OpenAIVoiceContext);

  const messages = useMemo(() => {
    switch (activeProvider) {
      case 'elevenlabs':
        if (!elevenLabsContext) return [];
        // ElevenLabs context uses simpler message format, convert to VoiceMessage
        // Use index-based timestamps (pure, deterministic - timestamp not displayed in UI)
        return elevenLabsContext.messages.map((msg, index) => ({
          id: `elevenlabs-${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: index * 1000,
        }));

      case 'xai':
        if (!xaiContext) return [];
        return xaiContext.messages || [];

      case 'openai':
        if (!openaiContext) return [];
        return openaiContext.messages || [];

      default:
        return [];
    }
  }, [activeProvider, elevenLabsContext, xaiContext, openaiContext]);

  return messages;
}
