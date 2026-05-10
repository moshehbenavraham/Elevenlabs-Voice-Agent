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
import { vapi, getVapiDebugInfo } from '@/lib/vapi';
import {
  VapiCallStatus,
  VapiMessage,
  VapiMessageType,
  VapiTranscriptMessage,
  VapiTranscriptType,
  VapiVoiceHookReturn,
  VapiStartConfig,
} from '@/types/vapi';

// Logging prefix for easy console filtering
const LOG_PREFIX = '[Vapi:Context]';

// Helper to format timestamps for logging
const timestamp = () => new Date().toISOString().split('T')[1].slice(0, -1);

// Initial error state if SDK not initialized
const initialError = !vapi ? 'Vapi SDK not initialized. Check VITE_VAPI_WEB_TOKEN.' : null;

console.log(`${LOG_PREFIX} Module loaded, SDK available:`, !!vapi);

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
  console.log(`${LOG_PREFIX} [${timestamp()}] VapiVoiceProvider mounting...`);

  // State variables - same as original useVapiVoice hook
  const [callStatus, setCallStatus] = useState<VapiCallStatus>(VapiCallStatus.INACTIVE);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<VapiTranscriptMessage | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(initialError);

  // Ref to track current callStatus for use in callbacks without re-creating them
  const callStatusRef = useRef<VapiCallStatus>(callStatus);

  // Track call timing for performance analysis
  const callStartTimeRef = useRef<number | null>(null);

  // Keep ref in sync with state (must be in effect for React Compiler)
  useEffect(() => {
    callStatusRef.current = callStatus;
    console.log(`${LOG_PREFIX} [${timestamp()}] Call status changed to: ${callStatus}`);
  }, [callStatus]);

  // Set up all event handlers ONCE at the provider level
  useEffect(() => {
    console.log(`${LOG_PREFIX} [${timestamp()}] Setting up event listeners...`);

    const vapiClient = vapi;

    if (!vapiClient) {
      console.error(`${LOG_PREFIX} [${timestamp()}] Cannot set up event listeners - vapi is null!`);
      return;
    }

    console.log(`${LOG_PREFIX} [${timestamp()}] Vapi SDK instance available, attaching listeners`);

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL-START-PROGRESS: Monitor all initialization stages
    // ═══════════════════════════════════════════════════════════════════════════
    const onCallStartProgress = (event: {
      stage: string;
      status: string;
      duration?: number;
      metadata?: Record<string, unknown>;
    }) => {
      const elapsed = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;

      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
      console.log(`${LOG_PREFIX} [${timestamp()}] 📊 CALL-START-PROGRESS`);
      console.log(`${LOG_PREFIX} [${timestamp()}]   Stage: ${event.stage}`);
      console.log(`${LOG_PREFIX} [${timestamp()}]   Status: ${event.status}`);
      if (event.duration !== undefined) {
        console.log(`${LOG_PREFIX} [${timestamp()}]   Stage Duration: ${event.duration}ms`);
      }
      console.log(`${LOG_PREFIX} [${timestamp()}]   Total Elapsed: ${elapsed}ms`);
      if (event.metadata) {
        console.log(`${LOG_PREFIX} [${timestamp()}]   Metadata:`, event.metadata);
      }
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

      // Disable Krisp noise cancellation as early as possible
      if (event.stage === 'daily-call-object-creation' && event.status === 'completed') {
        console.log(
          `${LOG_PREFIX} [${timestamp()}] 🎤 Daily call object created, attempting to disable Krisp...`
        );

        const dailyCall = vapiClient.getDailyCallObject();
        console.log(
          `${LOG_PREFIX} [${timestamp()}]   Daily call object:`,
          dailyCall ? 'EXISTS' : 'NULL'
        );

        if (dailyCall) {
          try {
            console.log(
              `${LOG_PREFIX} [${timestamp()}]   Calling updateInputSettings to disable Krisp...`
            );
            dailyCall.updateInputSettings({
              audio: { processor: { type: 'none' } },
            });
            console.log(
              `${LOG_PREFIX} [${timestamp()}] ✅ Krisp noise cancellation disabled (early)`
            );
          } catch (e) {
            console.warn(`${LOG_PREFIX} [${timestamp()}] ⚠️ Could not disable Krisp:`, e);
          }
        }
      }

      // Log audio processing stage specifically
      if (event.stage === 'audio-processing-setup') {
        console.log(`${LOG_PREFIX} [${timestamp()}] 🔊 Audio processing setup ${event.status}`);
        if (event.status === 'failed') {
          console.warn(
            `${LOG_PREFIX} [${timestamp()}] ⚠️ Audio processing failed (this may be Krisp - usually nonfatal)`
          );
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL-START-SUCCESS: Call fully initialized
    // ═══════════════════════════════════════════════════════════════════════════
    const onCallStartSuccess = (event: { totalDuration: number; callId?: string }) => {
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
      console.log(`${LOG_PREFIX} [${timestamp()}] ✅ CALL-START-SUCCESS`);
      console.log(`${LOG_PREFIX} [${timestamp()}]   Total Duration: ${event.totalDuration}ms`);
      console.log(`${LOG_PREFIX} [${timestamp()}]   Call ID: ${event.callId || 'unknown'}`);
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL-START: Call is now active
    // ═══════════════════════════════════════════════════════════════════════════
    const onCallStart = () => {
      const elapsed = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;

      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
      console.log(`${LOG_PREFIX} [${timestamp()}] 🟢 CALL-START - Call is now ACTIVE!`);
      console.log(`${LOG_PREFIX} [${timestamp()}]   Time to connect: ${elapsed}ms`);
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

      // Log debug info
      console.log(`${LOG_PREFIX} [${timestamp()}] Debug info:`, getVapiDebugInfo());

      setCallStatus(VapiCallStatus.ACTIVE);
      setError(null);
      setMessages([]); // Clear previous messages on new call
      setActiveTranscript(null);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL-END: Call has ended
    // ═══════════════════════════════════════════════════════════════════════════
    const onCallEnd = () => {
      const elapsed = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;

      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
      console.log(`${LOG_PREFIX} [${timestamp()}] 🔴 CALL-END - Call has ended`);
      console.log(`${LOG_PREFIX} [${timestamp()}]   Total call duration: ${elapsed}ms`);
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

      callStartTimeRef.current = null;
      setCallStatus(VapiCallStatus.INACTIVE);
      setActiveTranscript(null);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SPEECH EVENTS: Track who is speaking
    // ═══════════════════════════════════════════════════════════════════════════
    const onSpeechStart = () => {
      console.log(`${LOG_PREFIX} [${timestamp()}] 🗣️ SPEECH-START - Assistant is speaking`);
      setIsSpeechActive(true);
    };

    const onSpeechEnd = () => {
      console.log(`${LOG_PREFIX} [${timestamp()}] 🤫 SPEECH-END - Assistant stopped speaking`);
      setIsSpeechActive(false);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // VOLUME-LEVEL: Audio levels (throttle logging to avoid spam)
    // ═══════════════════════════════════════════════════════════════════════════
    let lastVolumeLogTime = 0;
    const onVolumeLevel = (volume: number) => {
      setAudioLevel(volume);

      // Only log volume every 500ms to avoid spam
      const now = Date.now();
      if (now - lastVolumeLogTime > 500 && volume > 0.1) {
        console.log(
          `${LOG_PREFIX} [${timestamp()}] 🔊 Volume level: ${(volume * 100).toFixed(0)}%`
        );
        lastVolumeLogTime = now;
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MESSAGE: All messages including transcripts
    // ═══════════════════════════════════════════════════════════════════════════
    const onMessage = (message: VapiMessage) => {
      const msgType = message.type;

      if (msgType === VapiMessageType.TRANSCRIPT) {
        const transcript = message as VapiTranscriptMessage;
        const isPartial = transcript.transcriptType === VapiTranscriptType.PARTIAL;

        if (isPartial) {
          // Only log partial transcripts occasionally to avoid spam
          console.log(
            `${LOG_PREFIX} [${timestamp()}] 📝 Partial transcript (${transcript.role}): "${transcript.transcript?.substring(0, 50)}..."`
          );
          setActiveTranscript(transcript);
        } else {
          console.log(
            `${LOG_PREFIX} [${timestamp()}] 💬 Final transcript (${transcript.role}): "${transcript.transcript}"`
          );
          setMessages((prev) => [...prev, message]);
          setActiveTranscript(null);
        }
      } else {
        console.log(`${LOG_PREFIX} [${timestamp()}] 📨 Message received:`, {
          type: msgType,
          preview: JSON.stringify(message).substring(0, 200),
        });
        setMessages((prev) => [...prev, message]);
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ERROR: All error events
    // ═══════════════════════════════════════════════════════════════════════════
    const onError = (e: Error | { message?: string; type?: string } | unknown) => {
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
      console.error(`${LOG_PREFIX} [${timestamp()}] ❌ ERROR EVENT RECEIVED`);
      console.error(`${LOG_PREFIX} [${timestamp()}]   Raw error:`, e);

      // Try to extract error details
      if (e && typeof e === 'object') {
        const errObj = e as Record<string, unknown>;
        if (errObj.type)
          console.error(`${LOG_PREFIX} [${timestamp()}]   Error type: ${errObj.type}`);
        if (errObj.stage)
          console.error(`${LOG_PREFIX} [${timestamp()}]   Error stage: ${errObj.stage}`);
        if (errObj.error)
          console.error(`${LOG_PREFIX} [${timestamp()}]   Error details:`, errObj.error);
      }

      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

      const errorMessage =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Unknown error occurred';

      setError(errorMessage);
      setCallStatus(VapiCallStatus.INACTIVE);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL-START-FAILED: Early failure detection
    // ═══════════════════════════════════════════════════════════════════════════
    const onCallStartFailed = (
      e:
        | {
            message?: string;
            reason?: string;
            stage?: string;
            error?: string;
            totalDuration?: number;
          }
        | unknown
    ) => {
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
      console.error(`${LOG_PREFIX} [${timestamp()}] ❌ CALL-START-FAILED`);
      console.error(`${LOG_PREFIX} [${timestamp()}]   Raw event:`, e);

      if (e && typeof e === 'object') {
        const errObj = e as Record<string, unknown>;
        if (errObj.stage)
          console.error(`${LOG_PREFIX} [${timestamp()}]   Failed at stage: ${errObj.stage}`);
        if (errObj.totalDuration)
          console.error(
            `${LOG_PREFIX} [${timestamp()}]   Total duration: ${errObj.totalDuration}ms`
          );
        if (errObj.error)
          console.error(`${LOG_PREFIX} [${timestamp()}]   Error message: ${errObj.error}`);
        if (errObj.errorStack)
          console.error(`${LOG_PREFIX} [${timestamp()}]   Stack trace: ${errObj.errorStack}`);
        if (errObj.context)
          console.error(`${LOG_PREFIX} [${timestamp()}]   Context:`, errObj.context);
      }

      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

      const errorMessage =
        typeof e === 'object' && e !== null
          ? (e as { message?: string; reason?: string; error?: string }).message ||
            (e as { message?: string; reason?: string; error?: string }).error ||
            (e as { message?: string; reason?: string; error?: string }).reason ||
            'Call failed to start'
          : 'Call failed to start';

      setError(errorMessage);
      setCallStatus(VapiCallStatus.INACTIVE);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACH ALL LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`${LOG_PREFIX} [${timestamp()}] Attaching event listeners...`);

    vapiClient.on('call-start-progress', onCallStartProgress);
    vapiClient.on('call-start-success', onCallStartSuccess);
    vapiClient.on('call-start', onCallStart);
    vapiClient.on('call-end', onCallEnd);
    vapiClient.on('speech-start', onSpeechStart);
    vapiClient.on('speech-end', onSpeechEnd);
    vapiClient.on('volume-level', onVolumeLevel);
    vapiClient.on('message', onMessage);
    vapiClient.on('error', onError);
    vapiClient.on('call-start-failed', onCallStartFailed);

    console.log(`${LOG_PREFIX} [${timestamp()}] ✅ All event listeners attached`);

    // Cleanup: remove all event listeners on unmount
    return () => {
      console.log(`${LOG_PREFIX} [${timestamp()}] 🧹 Cleaning up event listeners...`);

      vapiClient.off('call-start-progress', onCallStartProgress);
      vapiClient.off('call-start-success', onCallStartSuccess);
      vapiClient.off('call-start', onCallStart);
      vapiClient.off('call-end', onCallEnd);
      vapiClient.off('speech-start', onSpeechStart);
      vapiClient.off('speech-end', onSpeechEnd);
      vapiClient.off('volume-level', onVolumeLevel);
      vapiClient.off('message', onMessage);
      vapiClient.off('error', onError);
      vapiClient.off('call-start-failed', onCallStartFailed);

      console.log(`${LOG_PREFIX} [${timestamp()}] ✅ Event listeners removed`);
    };
  }, []);

  /**
   * Start a voice call
   *
   * IMPORTANT: vapi.start() uses POSITIONAL parameters, not an options object:
   *   start(assistant?, assistantOverrides?, squad?, workflow?, workflowOverrides?, options?)
   *
   * - First param: assistant ID string OR CreateAssistantDTO for inline config
   * - Second param: AssistantOverrides (optional)
   *
   * NOTE: transportConfigurations is Twilio-only and does NOT work for web calls.
   * The Vapi SDK has built-in nonfatal-error handling that automatically catches
   * Krisp AudioWorklet failures and disables noise cancellation.
   *
   * @param config - Optional assistant ID string or inline configuration
   */
  const start = async (config?: VapiStartConfig | string): Promise<void> => {
    console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
    console.log(`${LOG_PREFIX} [${timestamp()}] 🚀 START() CALLED`);
    console.log(`${LOG_PREFIX} [${timestamp()}]   Config type: ${typeof config}`);
    console.log(`${LOG_PREFIX} [${timestamp()}]   Config value:`, config);
    console.log(`${LOG_PREFIX} [${timestamp()}]   Current status: ${callStatusRef.current}`);
    console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

    const vapiClient = vapi;

    if (!vapiClient) {
      console.error(`${LOG_PREFIX} [${timestamp()}] ❌ Cannot start - vapi SDK is null!`);
      setError('Vapi SDK not initialized. Check VITE_VAPI_WEB_TOKEN.');
      return;
    }

    // Don't start if already active or loading (use ref to avoid recreating callback)
    if (callStatusRef.current === VapiCallStatus.ACTIVE) {
      console.warn(`${LOG_PREFIX} [${timestamp()}] ⚠️ Call already active, ignoring start()`);
      return;
    }

    // Record start time for performance tracking
    callStartTimeRef.current = Date.now();
    console.log(
      `${LOG_PREFIX} [${timestamp()}] ⏱️ Call start time recorded: ${callStartTimeRef.current}`
    );

    setCallStatus(VapiCallStatus.LOADING);
    setError(null);

    try {
      // Handle different config types
      // CRITICAL: vapi.start() takes POSITIONAL parameters, not an options object!
      if (typeof config === 'string') {
        // Config is an assistant ID string - pass as first positional parameter
        console.log(
          `${LOG_PREFIX} [${timestamp()}] 📞 Starting call with assistant ID string: "${config}"`
        );
        console.log(`${LOG_PREFIX} [${timestamp()}]   Calling vapi.start("${config}")...`);
        const result = await vapiClient.start(config);
        console.log(`${LOG_PREFIX} [${timestamp()}] ✅ vapi.start() resolved:`, result);
      } else if (config && 'assistantId' in config && config.assistantId) {
        // Config object with assistantId - extract and pass as first param
        console.log(
          `${LOG_PREFIX} [${timestamp()}] 📞 Starting call with assistantId from config object`
        );
        console.log(`${LOG_PREFIX} [${timestamp()}]   Assistant ID: "${config.assistantId}"`);
        console.log(
          `${LOG_PREFIX} [${timestamp()}]   Calling vapi.start("${config.assistantId}")...`
        );
        const result = await vapiClient.start(config.assistantId);
        console.log(`${LOG_PREFIX} [${timestamp()}] ✅ vapi.start() resolved:`, result);
      } else if (config) {
        // Inline assistant configuration (CreateAssistantDTO-like)
        // Build the assistant config for Vapi
        const assistantConfig = {
          name: config.name || 'Voice Assistant',
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
        console.log(`${LOG_PREFIX} [${timestamp()}] 📞 Starting call with inline assistant config`);
        console.log(`${LOG_PREFIX} [${timestamp()}]   Assistant name: "${assistantConfig.name}"`);
        console.log(
          `${LOG_PREFIX} [${timestamp()}]   Voice provider: ${assistantConfig.voice.provider}`
        );
        console.log(`${LOG_PREFIX} [${timestamp()}]   Model: ${assistantConfig.model.model}`);
        console.log(`${LOG_PREFIX} [${timestamp()}]   Full config:`, assistantConfig);
        console.log(`${LOG_PREFIX} [${timestamp()}]   Calling vapi.start(inlineConfig)...`);
        // Pass CreateAssistantDTO as first positional parameter
        const result = await vapiClient.start(
          assistantConfig as Parameters<typeof vapiClient.start>[0]
        );
        console.log(`${LOG_PREFIX} [${timestamp()}] ✅ vapi.start() resolved:`, result);
      } else {
        // No config provided - try to use environment variable assistant ID
        const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
        console.log(`${LOG_PREFIX} [${timestamp()}] 📞 No config provided, checking env vars`);
        console.log(
          `${LOG_PREFIX} [${timestamp()}]   VITE_VAPI_ASSISTANT_ID: ${assistantId || 'NOT SET'}`
        );

        if (assistantId) {
          // Use assistant ID as first positional parameter
          console.log(`${LOG_PREFIX} [${timestamp()}]   Using env assistant ID: "${assistantId}"`);
          console.log(`${LOG_PREFIX} [${timestamp()}]   Calling vapi.start("${assistantId}")...`);
          const result = await vapiClient.start(assistantId);
          console.log(`${LOG_PREFIX} [${timestamp()}] ✅ vapi.start() resolved:`, result);
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
          console.log(`${LOG_PREFIX} [${timestamp()}]   Creating default inline config`);
          console.log(`${LOG_PREFIX} [${timestamp()}]   Voice ID: ${defaultConfig.voice.voiceId}`);
          console.log(`${LOG_PREFIX} [${timestamp()}]   Model: ${defaultConfig.model.model}`);
          console.log(`${LOG_PREFIX} [${timestamp()}]   Full default config:`, defaultConfig);
          console.log(`${LOG_PREFIX} [${timestamp()}]   Calling vapi.start(defaultConfig)...`);
          const result = await vapiClient.start(
            defaultConfig as Parameters<typeof vapiClient.start>[0]
          );
          console.log(`${LOG_PREFIX} [${timestamp()}] ✅ vapi.start() resolved:`, result);
        }
      }
    } catch (e) {
      const elapsed = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;

      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
      console.error(`${LOG_PREFIX} [${timestamp()}] ❌ START() THREW AN ERROR`);
      console.error(`${LOG_PREFIX} [${timestamp()}]   Error:`, e);
      console.error(`${LOG_PREFIX} [${timestamp()}]   Time to error: ${elapsed}ms`);
      if (e instanceof Error) {
        console.error(`${LOG_PREFIX} [${timestamp()}]   Message: ${e.message}`);
        console.error(`${LOG_PREFIX} [${timestamp()}]   Stack: ${e.stack}`);
      }
      console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

      const errorMessage = e instanceof Error ? e.message : 'Failed to start call';
      setError(errorMessage);
      setCallStatus(VapiCallStatus.INACTIVE);
      callStartTimeRef.current = null;
    }
  };

  /**
   * Stop the current voice call
   */
  const stop = () => {
    console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);
    console.log(`${LOG_PREFIX} [${timestamp()}] 🛑 STOP() CALLED`);
    console.log(`${LOG_PREFIX} [${timestamp()}]   Current status: ${callStatusRef.current}`);
    console.log(`${LOG_PREFIX} [${timestamp()}] ══════════════════════════════════════════`);

    const vapiClient = vapi;

    if (!vapiClient) {
      console.error(`${LOG_PREFIX} [${timestamp()}] ❌ Cannot stop - vapi SDK is null!`);
      return;
    }

    // Only stop if there's an active or loading call (use ref to avoid recreating callback)
    if (callStatusRef.current === VapiCallStatus.INACTIVE) {
      console.log(`${LOG_PREFIX} [${timestamp()}] ℹ️ Call already inactive, nothing to stop`);
      return; // No-op when not connected
    }

    console.log(`${LOG_PREFIX} [${timestamp()}] 📴 Calling vapi.stop()...`);
    setCallStatus(VapiCallStatus.LOADING);
    vapiClient.stop();
    console.log(
      `${LOG_PREFIX} [${timestamp()}] ✅ vapi.stop() called (waiting for call-end event)`
    );
  };

  /**
   * Toggle the call on or off
   * @param config - Optional config for starting the call
   */
  const toggleCall = (config?: VapiStartConfig | string) => {
    console.log(
      `${LOG_PREFIX} [${timestamp()}] 🔄 TOGGLE_CALL() - Current status: ${callStatusRef.current}`
    );

    if (callStatusRef.current === VapiCallStatus.ACTIVE) {
      console.log(`${LOG_PREFIX} [${timestamp()}]   Status is ACTIVE, will stop`);
      stop();
    } else if (callStatusRef.current === VapiCallStatus.INACTIVE) {
      console.log(`${LOG_PREFIX} [${timestamp()}]   Status is INACTIVE, will start`);
      start(config);
    } else {
      console.log(`${LOG_PREFIX} [${timestamp()}]   Status is LOADING, ignoring toggle`);
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
