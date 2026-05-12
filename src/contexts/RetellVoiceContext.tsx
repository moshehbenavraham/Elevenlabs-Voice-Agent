/**
 * Retell Voice Context
 *
 * React context for managing Retell voice conversations.
 * State and event listeners are managed once at the provider level,
 * preventing multiple hook instantiation issues.
 *
 * Key features:
 * - Single RetellWebClient instance (no duplicates)
 * - Local transcript accumulation (SDK only provides last 5 sentences)
 * - Proper cleanup on unmount (no memory leaks)
 *
 * @see https://docs.retellai.com/api-references/web-client-sdk
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import {
  RetellCallStatus,
  RetellMessage,
  RetellMessageRole,
  RetellTranscriptType,
  RetellUpdatePayload,
  RetellVoiceHookReturn,
} from '@/types/retell';
import { getApiBaseUrl } from '@/lib/apiConfig';

// API configuration from environment
const RETELL_AGENT_ID = import.meta.env.VITE_RETELL_AGENT_ID;

/**
 * Generate unique ID for message deduplication
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Context value type - same as RetellVoiceHookReturn for compatibility
 */
type RetellVoiceContextValue = RetellVoiceHookReturn;

/**
 * Create context with null default
 */
const RetellVoiceContext = createContext<RetellVoiceContextValue | null>(null);

interface RetellVoiceProviderProps {
  children: ReactNode;
}

/**
 * Retell Voice Provider
 *
 * Manages all Retell SDK state and event listeners in a single location.
 * This prevents the multiple-instantiation bug that occurs when
 * useRetellVoice is called from multiple components.
 */
export function RetellVoiceProvider({ children }: RetellVoiceProviderProps) {
  // State variables
  const [callStatus, setCallStatus] = useState<RetellCallStatus>(RetellCallStatus.IDLE);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [messages, setMessages] = useState<RetellMessage[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<RetellMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  // Refs for values accessed in event handlers (prevent stale closures)
  const clientRef = useRef<RetellWebClient | null>(null);
  const lastTranscriptIndexRef = useRef<number>(0);
  const callStatusRef = useRef<RetellCallStatus>(callStatus);

  // Keep callStatusRef in sync with state
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // Set up SDK and event handlers ONCE at the provider level
  useEffect(() => {
    // Create single RetellWebClient instance
    const client = new RetellWebClient();
    clientRef.current = client;
    console.log('[Retell] SDK initialized (single instance)');

    // Call lifecycle event handlers
    const onCallStarted = () => {
      console.log('[Retell] Call started');
      setCallStatus(RetellCallStatus.CONNECTED);
      setError(null);
    };

    const onCallEnded = () => {
      console.log('[Retell] Call ended');
      setCallStatus(RetellCallStatus.IDLE);
      setActiveTranscript(null);
      // Reset transcript tracking for next call
      lastTranscriptIndexRef.current = 0;
    };

    // Agent speaking event handlers
    const onAgentStartTalking = () => {
      setIsAgentSpeaking(true);
    };

    const onAgentStopTalking = () => {
      setIsAgentSpeaking(false);
    };

    // Update event handler with local transcript accumulation
    const onUpdate = (update: RetellUpdatePayload) => {
      if (!update?.transcript || !Array.isArray(update.transcript)) {
        return;
      }

      const transcripts = update.transcript;
      const lastIndex = lastTranscriptIndexRef.current;

      // Process only new transcripts beyond our last seen index
      if (transcripts.length > lastIndex) {
        const newTranscripts = transcripts.slice(lastIndex);

        // Create message objects for new transcripts
        const newMessages: RetellMessage[] = newTranscripts.map((t) => ({
          id: generateMessageId(),
          role: t.role === 'agent' ? RetellMessageRole.AGENT : RetellMessageRole.USER,
          content: t.content,
          timestamp: Date.now(),
          transcriptType: RetellTranscriptType.FINAL,
        }));

        // Append to accumulated messages
        setMessages((prev) => [...prev, ...newMessages]);

        // Update last seen index
        lastTranscriptIndexRef.current = transcripts.length;
      }

      // Handle partial/active transcript from the last entry
      if (transcripts.length > 0) {
        const lastTranscript = transcripts[transcripts.length - 1];
        if (lastTranscript.role === 'agent') {
          setActiveTranscript({
            id: 'active',
            role: RetellMessageRole.AGENT,
            content: lastTranscript.content,
            timestamp: Date.now(),
            transcriptType: RetellTranscriptType.PARTIAL,
          });
        } else {
          setActiveTranscript(null);
        }
      }
    };

    // Error event handler
    const onError = (errorMessage: string) => {
      console.error('[Retell] Error:', errorMessage);
      setError(errorMessage || 'Unknown error occurred');
      setCallStatus(RetellCallStatus.ERROR);
    };

    // Attach all event listeners ONCE
    client.on('call_started', onCallStarted);
    client.on('call_ended', onCallEnded);
    client.on('agent_start_talking', onAgentStartTalking);
    client.on('agent_stop_talking', onAgentStopTalking);
    client.on('update', onUpdate);
    client.on('error', onError);

    // Cleanup: remove all event listeners on unmount
    return () => {
      console.log('[Retell] Cleaning up SDK');
      client.off('call_started', onCallStarted);
      client.off('call_ended', onCallEnded);
      client.off('agent_start_talking', onAgentStartTalking);
      client.off('agent_stop_talking', onAgentStopTalking);
      client.off('update', onUpdate);
      client.off('error', onError);

      // Stop any active call on unmount
      try {
        client.stopCall();
      } catch {
        // Ignore errors on cleanup
      }

      clientRef.current = null;
    };
  }, []);

  /**
   * Start a voice call
   * Fetches access token from backend and connects via SDK
   */
  const startCall = useCallback(async (): Promise<void> => {
    const client = clientRef.current;

    if (!client) {
      setError('Retell SDK not initialized');
      return;
    }

    // Validate agent ID is configured
    if (!RETELL_AGENT_ID) {
      setError('VITE_RETELL_AGENT_ID is not configured');
      return;
    }

    // Don't start if already active or connecting (use ref to avoid stale state)
    if (
      callStatusRef.current === RetellCallStatus.CONNECTED ||
      callStatusRef.current === RetellCallStatus.CONNECTING
    ) {
      console.warn('[Retell] Call already active or connecting');
      return;
    }

    setCallStatus(RetellCallStatus.CONNECTING);
    setError(null);
    setMessages([]); // Clear previous messages on new call
    setActiveTranscript(null);
    lastTranscriptIndexRef.current = 0;

    try {
      // Fetch access token from backend
      console.log('[Retell] Fetching access token from backend...');
      const response = await fetch(`${getApiBaseUrl()}/api/retell/create-web-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: RETELL_AGENT_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusMessages: Record<number, string> = {
          400: 'Invalid request - check agent configuration',
          401: 'Authentication failed - check Retell API key',
          402: 'Retell billing or quota is blocking web call creation',
          403: 'Access denied - verify Retell permissions',
          404: 'Agent not found - check VITE_RETELL_AGENT_ID',
          422: 'Retell rejected the agent configuration',
          429: 'Rate limited - please wait and try again',
          500: 'Retell server error - try again later',
          502: 'Retell service unavailable - try again later',
          503: 'Retell service temporarily unavailable',
        };
        const serverMessage =
          typeof errorData.message === 'string' && errorData.message.trim().length > 0
            ? errorData.message
            : undefined;
        throw new Error(
          serverMessage ||
            statusMessages[response.status] ||
            `Connection failed (${response.status})`
        );
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error('Backend did not return access token - check server logs');
      }

      // Store call ID if returned
      if (data.call_id) {
        setCallId(data.call_id);
      }

      // Connect to Retell via SDK
      console.log('[Retell] Connecting with access token...');
      await client.startCall({
        accessToken: data.access_token,
        sampleRate: 24000, // Retell default
      });

      // call_started event will update status to CONNECTED
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to start call';
      console.error('[Retell] Start call error:', e);
      setError(errorMessage);
      setCallStatus(RetellCallStatus.ERROR);
    }
  }, []);

  /**
   * Stop the current voice call
   */
  const stopCall = useCallback(() => {
    const client = clientRef.current;

    if (!client) {
      return;
    }

    // Only stop if there's an active or connecting call (use ref)
    if (
      callStatusRef.current === RetellCallStatus.IDLE ||
      callStatusRef.current === RetellCallStatus.ERROR
    ) {
      return; // No-op when not connected
    }

    console.log('[Retell] Stopping call...');

    try {
      client.stopCall();
      // call_ended event will update status to IDLE
    } catch (e) {
      console.error('[Retell] Stop call error:', e);
      // Force state to idle even if SDK throws
      setCallStatus(RetellCallStatus.IDLE);
      setActiveTranscript(null);
    }
  }, []);

  /**
   * Toggle the call on or off
   */
  const toggleCall = useCallback(() => {
    if (callStatusRef.current === RetellCallStatus.CONNECTED) {
      stopCall();
    } else if (
      callStatusRef.current === RetellCallStatus.IDLE ||
      callStatusRef.current === RetellCallStatus.ERROR
    ) {
      startCall();
    }
    // If connecting, do nothing (wait for state to settle)
  }, [startCall, stopCall]);

  const value: RetellVoiceContextValue = {
    callStatus,
    isAgentSpeaking,
    messages,
    activeTranscript,
    error,
    callId,
    startCall,
    stopCall,
    toggleCall,
  };

  return <RetellVoiceContext.Provider value={value}>{children}</RetellVoiceContext.Provider>;
}

/**
 * Hook to consume Retell voice context
 *
 * Must be used within a RetellVoiceProvider.
 * Throws error if used outside provider for clear debugging.
 *
 * @returns RetellVoiceHookReturn - State and control functions for voice calls
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRetellVoiceContext(): RetellVoiceHookReturn {
  const context = useContext(RetellVoiceContext);

  if (!context) {
    throw new Error('useRetellVoiceContext must be used within a RetellVoiceProvider');
  }

  return context;
}

export default RetellVoiceContext;
