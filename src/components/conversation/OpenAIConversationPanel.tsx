import { useContext } from 'react';
import { OpenAIVoiceContext } from '@/contexts/OpenAIVoiceContext';
import { ConversationPanel } from './ConversationPanel';

interface OpenAIConversationPanelProps {
  className?: string;
}

/**
 * Conversation panel wrapper for OpenAI provider
 * Reads messages from OpenAIVoiceContext
 */
export function OpenAIConversationPanel({ className }: OpenAIConversationPanelProps) {
  const context = useContext(OpenAIVoiceContext);

  if (!context) {
    return null;
  }

  return <ConversationPanel messages={context.messages} className={className} />;
}
