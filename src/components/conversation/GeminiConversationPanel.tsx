import { useGeminiVoice } from '@/hooks/useGeminiVoice';
import { ConversationPanel } from './ConversationPanel';

interface GeminiConversationPanelProps {
  className?: string;
}

/**
 * Conversation panel wrapper for Gemini provider
 * Passes messages and activeTranscript from GeminiVoiceContext
 */
export function GeminiConversationPanel({ className }: GeminiConversationPanelProps) {
  const { messages, activeTranscript } = useGeminiVoice();

  // Gemini messages are already in VoiceMessage format
  // activeTranscript is the partial response being typed

  return (
    <ConversationPanel
      messages={messages}
      className={className}
      activeTranscript={activeTranscript || null}
      activeTranscriptRole="assistant"
    />
  );
}
