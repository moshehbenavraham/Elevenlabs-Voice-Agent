import { useMemo } from 'react';
import { useVapiVoice } from '@/hooks/useVapiVoice';
import { ConversationPanel } from './ConversationPanel';
import { VapiMessageType, VapiMessageRole, VapiTranscriptMessage } from '@/types/vapi';
import type { VoiceMessage } from '@/types';

interface VapiConversationPanelProps {
  className?: string;
}

/**
 * Conversation panel wrapper for Vapi provider
 * Converts Vapi message format to VoiceMessage format and passes activeTranscript
 */
export function VapiConversationPanel({ className }: VapiConversationPanelProps) {
  const { messages, activeTranscript } = useVapiVoice();

  // Convert Vapi messages to VoiceMessage format
  const voiceMessages: VoiceMessage[] = useMemo(() => {
    return messages
      .filter((msg) => msg.type === VapiMessageType.TRANSCRIPT)
      .map((msg, index) => {
        const transcriptMsg = msg as VapiTranscriptMessage;
        return {
          id: `vapi-${index}`,
          role: transcriptMsg.role === VapiMessageRole.USER ? 'user' : 'assistant',
          content: transcriptMsg.transcript,
          timestamp: index * 1000,
        };
      });
  }, [messages]);

  // Get active transcript text and role
  const activeTranscriptText = activeTranscript?.transcript || null;
  const activeTranscriptRole =
    activeTranscript?.role === VapiMessageRole.USER ? 'user' : 'assistant';

  return (
    <ConversationPanel
      messages={voiceMessages}
      className={className}
      activeTranscript={activeTranscriptText}
      activeTranscriptRole={activeTranscriptRole}
    />
  );
}
