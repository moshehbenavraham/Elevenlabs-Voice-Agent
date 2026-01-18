/**
 * Vapi Voice Context
 *
 * React context for managing Vapi voice conversations.
 * State and event listeners are managed once at the provider level,
 * preventing multiple hook instantiation issues.
 *
 * Key features:
 * - Single event listener registration (no duplicates)
 * - Partial transcript support (activeTranscript for typing indicators)
 * - Dual config mode: assistantId string OR inline CreateAssistantDTO
 * - Proper cleanup on unmount (no memory leaks)
 */

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { vapi } from '@/lib/vapi';
import {
  VapiCallStatus,
  VapiMessage,
  VapiMessageType,
  VapiTranscriptMessage,
  VapiTranscriptType,
  VapiVoiceHookReturn,
  VapiStartConfig,
} from '@/types/vapi';

// Initial error state if SDK not initialized
const initialError = !vapi ? 'Vapi SDK not initialized. Check VITE_VAPI_WEB_TOKEN.' : null;

/**
 * Context value type - same as VapiVoiceHookReturn for compatibility
 */
type VapiVoiceContextValue = VapiVoiceHookReturn;

/**
 * Create context with null default
 */
const VapiVoiceContext = createContext<VapiVoiceContextValue | null>(null);

interface VapiVoiceProviderProps {
  children: ReactNode;
}

/**
 * Vapi Voice Provider
 *
 * Manages all Vapi SDK state and event listeners in a single location.
 * This prevents the multiple-instantiation bug that occurs when
 * useVapiVoice is called from multiple components.
 */
export function VapiVoiceProvider({ children }: VapiVoiceProviderProps) {
  // State variables - same as original useVapiVoice hook
  const [callStatus, setCallStatus] = useState<VapiCallStatus>(VapiCallStatus.INACTIVE);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<VapiTranscriptMessage | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(initialError);

  // Ref to track current callStatus for use in callbacks without re-creating them
  const callStatusRef = useRef<VapiCallStatus>(callStatus);

  // Keep ref in sync with state (must be in effect for React Compiler)
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // Set up all event handlers ONCE at the provider level
  useEffect(() => {
    if (!vapi) return;

    // Call lifecycle events
    const onCallStart = () => {
      setCallStatus(VapiCallStatus.ACTIVE);
      setError(null);
      setMessages([]); // Clear previous messages on new call
      setActiveTranscript(null);

      // Disable Krisp noise cancellation to prevent AudioWorklet errors
      // The Vapi SDK 2.x auto-enables Krisp which causes failures in some browsers
      const dailyCall = vapi.getDailyCallObject();
      if (dailyCall) {
        try {
          dailyCall.updateInputSettings({
            audio: { processor: { type: 'none' } },
          });
          console.log('[Vapi] Disabled Krisp noise cancellation');
        } catch (e) {
          console.warn('[Vapi] Could not disable noise cancellation:', e);
        }
      }
    };

    const onCallEnd = () => {
      setCallStatus(VapiCallStatus.INACTIVE);
      setActiveTranscript(null);
    };

    // Speech activity events
    const onSpeechStart = () => {
      setIsSpeechActive(true);
    };

    const onSpeechEnd = () => {
      setIsSpeechActive(false);
    };

    // Audio level event
    const onVolumeLevel = (volume: number) => {
      setAudioLevel(volume);
    };

    // Message event with partial/final transcript logic
    const onMessage = (message: VapiMessage) => {
      // Handle partial vs final transcripts
      if (
        message.type === VapiMessageType.TRANSCRIPT &&
        (message as VapiTranscriptMessage).transcriptType === VapiTranscriptType.PARTIAL
      ) {
        // Partial transcript: store in activeTranscript for typing indicator
        setActiveTranscript(message as VapiTranscriptMessage);
      } else {
        // Final transcript or other message types: add to messages array
        setMessages((prev) => [...prev, message]);
        // Clear active transcript since we have the final version
        if (message.type === VapiMessageType.TRANSCRIPT) {
          setActiveTranscript(null);
        }
      }
    };

    // Error event handler
    const onError = (e: Error | { message?: string } | unknown) => {
      const errorMessage =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Unknown error occurred';
      setError(errorMessage);
      setCallStatus(VapiCallStatus.INACTIVE);
      console.error('[Vapi] Error:', e);
    };

    // Attach all event listeners ONCE
    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('volume-level', onVolumeLevel);
    vapi.on('message', onMessage);
    vapi.on('error', onError);

    // Cleanup: remove all event listeners on unmount
    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('volume-level', onVolumeLevel);
      vapi.off('message', onMessage);
      vapi.off('error', onError);
    };
  }, []);

  /**
   * Start a voice call
   * @param config - Optional assistant ID string or inline configuration
   */
  const start = async (config?: VapiStartConfig | string): Promise<void> => {
    if (!vapi) {
      setError('Vapi SDK not initialized. Check VITE_VAPI_WEB_TOKEN.');
      return;
    }

    // Don't start if already active or loading (use ref to avoid recreating callback)
    if (callStatusRef.current === VapiCallStatus.ACTIVE) {
      console.warn('[Vapi] Call already active');
      return;
    }

    setCallStatus(VapiCallStatus.LOADING);
    setError(null);

    try {
      // Handle different config types
      if (typeof config === 'string') {
        // Assistant ID string
        await vapi.start(config);
      } else if (config && 'assistantId' in config && config.assistantId) {
        // Config object with assistantId
        await vapi.start(config.assistantId);
      } else if (config) {
        // Inline assistant configuration (CreateAssistantDTO-like)
        // Build the assistant config for Vapi
        const assistantConfig = {
          name: config.name,
          firstMessage: config.firstMessage,
          transcriber: {
            provider: 'deepgram' as const,
            model: 'nova-2',
            language: 'en',
          },
          voice: config.voice || {
            provider: '11labs' as const,
            voiceId: import.meta.env.VITE_VAPI_VOICE || 'paula',
          },
          model: config.model || {
            provider: 'openai' as const,
            model: import.meta.env.VITE_VAPI_MODEL || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system' as const,
                content:
                  config.systemPrompt ||
                  import.meta.env.VITE_VAPI_SYSTEM_PROMPT ||
                  'You are a helpful voice assistant.',
              },
            ],
          },
        };
        // Use type assertion since Vapi SDK types may be looser
        await vapi.start(assistantConfig as Parameters<typeof vapi.start>[0]);
      } else {
        // No config provided - try to use environment variable assistant ID
        const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
        if (assistantId) {
          await vapi.start(assistantId);
        } else {
          // Create default inline config from environment
          const defaultConfig = {
            name: 'Voice Assistant',
            firstMessage:
              import.meta.env.VITE_VAPI_FIRST_MESSAGE || 'Hello! How can I help you today?',
            transcriber: {
              provider: 'deepgram' as const,
              model: 'nova-2',
              language: 'en',
            },
            voice: {
              provider: '11labs' as const,
              voiceId: import.meta.env.VITE_VAPI_VOICE || 'paula',
            },
            model: {
              provider: 'openai' as const,
              model: import.meta.env.VITE_VAPI_MODEL || 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system' as const,
                  content:
                    import.meta.env.VITE_VAPI_SYSTEM_PROMPT || 'You are a helpful voice assistant.',
                },
              ],
            },
          };
          await vapi.start(defaultConfig as Parameters<typeof vapi.start>[0]);
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to start call';
      setError(errorMessage);
      setCallStatus(VapiCallStatus.INACTIVE);
      console.error('[Vapi] Start error:', e);
    }
  };

  /**
   * Stop the current voice call
   */
  const stop = () => {
    if (!vapi) {
      return;
    }

    // Only stop if there's an active or loading call (use ref to avoid recreating callback)
    if (callStatusRef.current === VapiCallStatus.INACTIVE) {
      return; // No-op when not connected
    }

    setCallStatus(VapiCallStatus.LOADING);
    vapi.stop();
  };

  /**
   * Toggle the call on or off
   * @param config - Optional config for starting the call
   */
  const toggleCall = (config?: VapiStartConfig | string) => {
    if (callStatusRef.current === VapiCallStatus.ACTIVE) {
      stop();
    } else if (callStatusRef.current === VapiCallStatus.INACTIVE) {
      start(config);
    }
    // If loading, do nothing (wait for state to settle)
  };

  const value: VapiVoiceContextValue = {
    callStatus,
    isSpeechActive,
    messages,
    activeTranscript,
    audioLevel,
    error,
    start,
    stop,
    toggleCall,
  };

  return <VapiVoiceContext.Provider value={value}>{children}</VapiVoiceContext.Provider>;
}

/**
 * Hook to consume Vapi voice context
 *
 * Must be used within a VapiVoiceProvider.
 * Throws error if used outside provider for clear debugging.
 *
 * @returns VapiVoiceHookReturn - State and control functions for voice calls
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useVapiVoiceContext(): VapiVoiceHookReturn {
  const context = useContext(VapiVoiceContext);

  if (!context) {
    throw new Error('useVapiVoiceContext must be used within a VapiVoiceProvider');
  }

  return context;
}

export default VapiVoiceContext;
