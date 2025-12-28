import { useMemo } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { ConversationPanel } from './ConversationPanel';
import type { VoiceMessage } from '@/types';

interface ElevenLabsConversationPanelProps {
  className?: string;
}

/**
 * Conversation panel wrapper for ElevenLabs provider
 * Converts ElevenLabs message format to VoiceMessage format
 */
export function ElevenLabsConversationPanel({ className }: ElevenLabsConversationPanelProps) {
  const { messages } = useVoice();

  // Convert ElevenLabs messages to VoiceMessage format
  // Use index-based timestamps (pure, deterministic - timestamp not displayed in UI)
  const voiceMessages: VoiceMessage[] = useMemo(() => {
    return messages.map((msg, index) => ({
      id: `elevenlabs-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: index * 1000,
    }));
  }, [messages]);

  return <ConversationPanel messages={voiceMessages} className={className} />;
}
