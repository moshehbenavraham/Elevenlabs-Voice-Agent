/**
 * Retell Voice Hook
 *
 * React hook for managing Retell voice conversations.
 * This is a thin wrapper around useRetellVoiceContext for backwards compatibility.
 *
 * IMPORTANT: This hook must be used within a RetellVoiceProvider.
 * The actual state management happens in RetellVoiceContext to prevent
 * multiple event listener registrations when the hook is called from
 * multiple components.
 *
 * Key features:
 * - Single SDK instance (managed by context provider)
 * - Local transcript accumulation (SDK only provides last 5 sentences)
 * - useRef pattern to avoid stale closures in event handlers
 * - Unified state mapping (idle, connecting, connected, error)
 * - Proper cleanup on unmount (no memory leaks)
 *
 * @see https://docs.retellai.com/api-references/web-client-sdk
 */

import { useRetellVoiceContext } from '@/contexts/RetellVoiceContext';
import type { RetellVoiceHookReturn } from '@/types/retell';

/**
 * Hook for managing Retell voice conversations
 *
 * @returns RetellVoiceHookReturn - State and control functions for voice calls
 *
 * @example
 * ```tsx
 * // Wrap your component tree with RetellVoiceProvider first
 * <RetellVoiceProvider>
 *   <MyComponent />
 * </RetellVoiceProvider>
 *
 * // Then use the hook in any child component
 * const { callStatus, startCall, stopCall, messages, activeTranscript } = useRetellVoice();
 *
 * // Start a call
 * await startCall();
 *
 * // Stop the call
 * stopCall();
 * ```
 */
export function useRetellVoice(): RetellVoiceHookReturn {
  return useRetellVoiceContext();
}
