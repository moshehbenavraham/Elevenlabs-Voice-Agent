import { useContext } from 'react';
import { XAIVoiceContext } from '@/contexts/XAIVoiceContext';
import { ConversationPanel } from './ConversationPanel';

interface XAIConversationPanelProps {
  className?: string;
}

/**
 * Conversation panel wrapper for xAI provider
 * Reads messages from XAIVoiceContext
 */
export function XAIConversationPanel({ className }: XAIConversationPanelProps) {
  const context = useContext(XAIVoiceContext);

  if (!context) {
    return null;
  }

  return <ConversationPanel messages={context.messages} className={className} />;
}
