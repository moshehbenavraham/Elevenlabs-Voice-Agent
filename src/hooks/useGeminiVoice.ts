/**
 * useGeminiVoice Hook
 *
 * Thin wrapper hook for accessing GeminiVoiceContext.
 * Provides type-safe access to Gemini Live voice conversation state and controls.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const {
 *     status,
 *     isConnected,
 *     messages,
 *     connect,
 *     disconnect,
 *     toggleMute,
 *   } = useGeminiVoice();
 *
 *   return (
 *     <button onClick={connect} disabled={isConnected}>
 *       {isConnected ? 'Connected' : 'Connect'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @see src/contexts/GeminiVoiceContext.tsx - Context provider
 * @see src/types/gemini.ts - Type definitions
 */

import { useContext } from 'react';
import { GeminiVoiceContext } from '@/contexts/GeminiVoiceContext';
import type { GeminiVoiceHookReturn } from '@/types/gemini';

/**
 * Hook for accessing Gemini Live voice conversation state and controls.
 *
 * Must be used within a GeminiVoiceProvider.
 *
 * @returns Gemini voice state and control functions
 * @throws Error if used outside of GeminiVoiceProvider
 */
export function useGeminiVoice(): GeminiVoiceHookReturn {
  const context = useContext(GeminiVoiceContext);

  if (!context) {
    throw new Error('useGeminiVoice must be used within a GeminiVoiceProvider');
  }

  return context;
}

export default useGeminiVoice;
