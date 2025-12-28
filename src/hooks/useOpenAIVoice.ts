import { useContext } from 'react';
import { OpenAIVoiceContext, type OpenAIVoiceContextValue } from '@/contexts/OpenAIVoiceContext';

/**
 * Hook to access OpenAI Voice context.
 * Provides connection state and control functions for OpenAI voice conversations.
 *
 * Must be used within an OpenAIVoiceProvider.
 *
 * @returns OpenAIVoiceContextValue with state and controls
 * @throws Error if used outside of OpenAIVoiceProvider
 *
 * @example
 * ```tsx
 * function VoiceControls() {
 *   const { status, connect, disconnect, isConnected } = useOpenAIVoice();
 *
 *   return (
 *     <button onClick={isConnected ? disconnect : connect}>
 *       {isConnected ? 'End' : 'Start'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useOpenAIVoice(): OpenAIVoiceContextValue {
  const context = useContext(OpenAIVoiceContext);

  if (!context) {
    throw new Error('useOpenAIVoice must be used within an OpenAIVoiceProvider');
  }

  return context;
}

export default useOpenAIVoice;
