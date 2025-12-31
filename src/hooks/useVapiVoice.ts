/**
 * Vapi Voice Hook
 *
 * React hook for managing Vapi voice conversations.
 * This is a thin wrapper around useVapiVoiceContext for backwards compatibility.
 *
 * IMPORTANT: This hook must be used within a VapiVoiceProvider.
 * The actual state management happens in VapiVoiceContext to prevent
 * multiple event listener registrations when the hook is called from
 * multiple components.
 *
 * Key features:
 * - Partial transcript support (activeTranscript for typing indicators)
 * - Dual config mode: assistantId string OR inline CreateAssistantDTO
 * - Event-driven state updates for all 7 Vapi events
 * - Proper cleanup on unmount (no memory leaks)
 */

import { useVapiVoiceContext } from '@/contexts/VapiVoiceContext';
import type { VapiVoiceHookReturn } from '@/types/vapi';

/**
 * Hook for managing Vapi voice conversations
 *
 * @returns VapiVoiceHookReturn - State and control functions for voice calls
 *
 * @example
 * ```tsx
 * // Wrap your component tree with VapiVoiceProvider first
 * <VapiVoiceProvider>
 *   <MyComponent />
 * </VapiVoiceProvider>
 *
 * // Then use the hook in any child component
 * const { callStatus, start, stop, messages, activeTranscript } = useVapiVoice();
 *
 * // Start with assistant ID
 * start('asst_123');
 *
 * // Or start with inline config
 * start({ name: 'My Assistant', firstMessage: 'Hello!' });
 * ```
 */
export function useVapiVoice(): VapiVoiceHookReturn {
  return useVapiVoiceContext();
}
