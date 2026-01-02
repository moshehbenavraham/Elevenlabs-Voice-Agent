import { useMemo } from 'react';
import { useRetellVoice } from '@/hooks/useRetellVoice';
import { ConversationPanel } from './ConversationPanel';
import { RetellMessageRole } from '@/types/retell';
import type { VoiceMessage } from '@/types';

interface RetellConversationPanelProps {
  className?: string;
}

/**
 * Conversation panel wrapper for Retell provider
 * Converts Retell message format to VoiceMessage format and passes activeTranscript
 */
export function RetellConversationPanel({ className }: RetellConversationPanelProps) {
  const { messages, activeTranscript } = useRetellVoice();

  // Convert Retell messages to VoiceMessage format
  const voiceMessages: VoiceMessage[] = useMemo(() => {
    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role === RetellMessageRole.USER ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp,
    }));
  }, [messages]);

  // Get active transcript text and role
  const activeTranscriptText = activeTranscript?.content || null;
  const activeTranscriptRole =
    activeTranscript?.role === RetellMessageRole.USER ? 'user' : 'assistant';

  return (
    <ConversationPanel
      messages={voiceMessages}
      className={className}
      activeTranscript={activeTranscriptText}
      activeTranscriptRole={activeTranscriptRole}
    />
  );
}
