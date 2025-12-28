import { useContext } from 'react';
import { XAIVoiceContext, type XAIVoiceContextValue } from '@/contexts/XAIVoiceContext';

/**
 * Hook to access xAI Voice context.
 * Provides connection state and control functions for xAI voice conversations.
 *
 * Must be used within an XAIVoiceProvider.
 *
 * @returns XAIVoiceContextValue with state and controls
 * @throws Error if used outside of XAIVoiceProvider
 *
 * @example
 * ```tsx
 * function VoiceControls() {
 *   const { status, connect, disconnect, isConnected } = useXAIVoice();
 *
 *   return (
 *     <button onClick={isConnected ? disconnect : connect}>
 *       {isConnected ? 'End' : 'Start'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useXAIVoice(): XAIVoiceContextValue {
  const context = useContext(XAIVoiceContext);

  if (!context) {
    throw new Error('useXAIVoice must be used within an XAIVoiceProvider');
  }

  return context;
}

export default useXAIVoice;
