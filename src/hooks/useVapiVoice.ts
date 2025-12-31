/**
 * Vapi Voice Hook
 *
 * React hook for managing Vapi voice conversations.
 * Handles all SDK events, state management, and call lifecycle.
 *
 * Key features:
 * - Partial transcript support (activeTranscript for typing indicators)
 * - Dual config mode: assistantId string OR inline CreateAssistantDTO
 * - Event-driven state updates for all 7 Vapi events
 * - Proper cleanup on unmount (no memory leaks)
 */

import { useEffect, useState } from 'react';
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
 * Hook for managing Vapi voice conversations
 *
 * @returns VapiVoiceHookReturn - State and control functions for voice calls
 *
 * @example
 * ```tsx
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
  // T010: Initialize hook state variables
  const [callStatus, setCallStatus] = useState<VapiCallStatus>(VapiCallStatus.INACTIVE);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<VapiTranscriptMessage | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(initialError);

  // T011-T014: Set up all event handlers
  useEffect(() => {
    if (!vapi) return;

    // T011: Call lifecycle events
    const onCallStart = () => {
      setCallStatus(VapiCallStatus.ACTIVE);
      setError(null);
      setMessages([]); // Clear previous messages on new call
      setActiveTranscript(null);
    };

    const onCallEnd = () => {
      setCallStatus(VapiCallStatus.INACTIVE);
      setActiveTranscript(null);
    };

    // T012: Speech activity events
    const onSpeechStart = () => {
      setIsSpeechActive(true);
    };

    const onSpeechEnd = () => {
      setIsSpeechActive(false);
    };

    // T013: Audio level event
    const onVolumeLevel = (volume: number) => {
      setAudioLevel(volume);
    };

    // T014: Message event with partial/final transcript logic
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

    // Attach all event listeners
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

  // T015: Implement start(), stop(), toggleCall() functions

  /**
   * Start a voice call
   * @param config - Optional assistant ID string or inline configuration
   */
  const start = async (config?: VapiStartConfig | string): Promise<void> => {
    if (!vapi) {
      setError('Vapi SDK not initialized. Check VITE_VAPI_WEB_TOKEN.');
      return;
    }

    // Don't start if already active or loading
    if (callStatus === VapiCallStatus.ACTIVE) {
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

    // Only stop if there's an active or loading call
    if (callStatus === VapiCallStatus.INACTIVE) {
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
    if (callStatus === VapiCallStatus.ACTIVE) {
      stop();
    } else if (callStatus === VapiCallStatus.INACTIVE) {
      start(config);
    }
    // If loading, do nothing (wait for state to settle)
  };

  return {
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
}
