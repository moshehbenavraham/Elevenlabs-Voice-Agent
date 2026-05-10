import { useContext } from 'react';
import { UltravoxVoiceContext } from '@/contexts/UltravoxVoiceContext';
import type { UltravoxVoiceContextValue } from '@/types';

/**
 * Hook to access Ultravox Voice context.
 * Provides connection state and control functions for Ultravox voice conversations.
 *
 * Must be used within an UltravoxVoiceProvider.
 *
 * @returns UltravoxVoiceContextValue with state and controls
 * @throws Error if used outside of UltravoxVoiceProvider
 *
 * @example
 * ```tsx
 * function VoiceControls() {
 *   const { status, connect, disconnect, isConnected } = useUltravoxVoice();
 *
 *   return (
 *     <button onClick={isConnected ? disconnect : connect}>
 *       {isConnected ? 'End' : 'Start'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useUltravoxVoice(): UltravoxVoiceContextValue {
  const context = useContext(UltravoxVoiceContext);

  if (!context) {
    throw new Error('useUltravoxVoice must be used within an UltravoxVoiceProvider');
  }

  return context;
}

export default useUltravoxVoice;
