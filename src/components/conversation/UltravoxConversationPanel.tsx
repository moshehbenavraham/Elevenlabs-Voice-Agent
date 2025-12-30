import { useMemo } from 'react';
import { useUltravoxVoice } from '@/hooks/useUltravoxVoice';
import { ConversationPanel } from './ConversationPanel';
import type { VoiceMessage } from '@/types';

interface UltravoxConversationPanelProps {
  className?: string;
}

/**
 * Conversation panel wrapper for Ultravox provider
 * Converts Ultravox transcripts to VoiceMessage format for display
 */
export function UltravoxConversationPanel({ className }: UltravoxConversationPanelProps) {
  const { transcripts } = useUltravoxVoice();

  // Convert Ultravox transcripts to VoiceMessage format
  // Use ordinal as timestamp proxy since SDK doesn't provide timestamps
  const messages = useMemo<VoiceMessage[]>(() => {
    return transcripts
      .filter((t) => t.isFinal) // Only show final transcripts
      .map((transcript) => ({
        id: `ultravox-${transcript.ordinal}`,
        role: transcript.speaker === 'user' ? 'user' : 'assistant',
        content: transcript.text,
        // Use ordinal as stable timestamp (ordinal is unique per message)
        timestamp: transcript.ordinal,
      }));
  }, [transcripts]);

  return <ConversationPanel messages={messages} className={className} />;
}
