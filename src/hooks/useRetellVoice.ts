/**
 * Retell Voice Hook
 *
 * React hook for managing Retell voice conversations.
 * Handles SDK event lifecycle, state management, and call control.
 *
 * Key features:
 * - Local transcript accumulation (SDK only provides last 5 sentences)
 * - useRef pattern to avoid stale closures in event handlers
 * - Unified state mapping (idle, connecting, connected, error)
 * - Proper cleanup on unmount (no memory leaks)
 *
 * @see https://docs.retellai.com/api-references/web-client-sdk
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import {
  RetellCallStatus,
  RetellMessage,
  RetellMessageRole,
  RetellTranscriptType,
  RetellUpdatePayload,
  RetellVoiceHookReturn,
} from '@/types/retell';

// API configuration from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const RETELL_AGENT_ID = import.meta.env.VITE_RETELL_AGENT_ID;

/**
 * Generate unique ID for message deduplication
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for managing Retell voice conversations
 *
 * @returns RetellVoiceHookReturn - State and control functions for voice calls
 *
 * @example
 * ```tsx
 * const { callStatus, startCall, stopCall, messages, isAgentSpeaking } = useRetellVoice();
 *
 * // Start a call
 * await startCall();
 *
 * // Stop the call
 * stopCall();
 * ```
 */
export function useRetellVoice(): RetellVoiceHookReturn {
  // T009: Initialize hook state variables
  const [callStatus, setCallStatus] = useState<RetellCallStatus>(RetellCallStatus.IDLE);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [messages, setMessages] = useState<RetellMessage[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<RetellMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  // T010: useRef pattern for values accessed in event handlers
  // This prevents stale closures when event handlers reference state
  const messagesRef = useRef<RetellMessage[]>([]);
  const clientRef = useRef<RetellWebClient | null>(null);
  const lastTranscriptIndexRef = useRef<number>(0);

  // Keep messagesRef in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // T011-T014: Set up event handlers and SDK initialization
  useEffect(() => {
    // Create RetellWebClient instance
    const client = new RetellWebClient();
    clientRef.current = client;

    // T011: Call lifecycle event handlers
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

    // T012: Agent speaking event handlers
    const onAgentStartTalking = () => {
      setIsAgentSpeaking(true);
    };

    const onAgentStopTalking = () => {
      setIsAgentSpeaking(false);
    };

    // T013: Update event handler with local transcript accumulation
    // SDK only provides last 5 sentences, so we track locally
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
      // The last transcript in the array might still be partial
      if (transcripts.length > 0) {
        const lastTranscript = transcripts[transcripts.length - 1];
        // Only show as active if it's likely still being spoken
        // We use agent speaking state as a heuristic
        if (lastTranscript.role === 'agent') {
          setActiveTranscript({
            id: 'active',
            role: RetellMessageRole.AGENT,
            content: lastTranscript.content,
            timestamp: Date.now(),
            transcriptType: RetellTranscriptType.PARTIAL,
          });
        } else {
          // Clear active transcript if user is the last speaker
          setActiveTranscript(null);
        }
      }
    };

    // T014: Error event handler with state mapping
    const onError = (errorMessage: string) => {
      console.error('[Retell] Error:', errorMessage);
      setError(errorMessage || 'Unknown error occurred');
      setCallStatus(RetellCallStatus.ERROR);
    };

    // Attach all event listeners
    client.on('call_started', onCallStarted);
    client.on('call_ended', onCallEnded);
    client.on('agent_start_talking', onAgentStartTalking);
    client.on('agent_stop_talking', onAgentStopTalking);
    client.on('update', onUpdate);
    client.on('error', onError);

    // Cleanup: remove all event listeners on unmount
    return () => {
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

  // T015: Implement startCall(), stopCall(), toggleCall() functions

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

    // Don't start if already active or connecting
    if (callStatus === RetellCallStatus.CONNECTED || callStatus === RetellCallStatus.CONNECTING) {
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
      const response = await fetch(`${API_BASE_URL}/api/retell/create-web-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: RETELL_AGENT_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create call' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error('No access token received from backend');
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
  }, [callStatus]);

  /**
   * Stop the current voice call
   */
  const stopCall = useCallback(() => {
    const client = clientRef.current;

    if (!client) {
      return;
    }

    // Only stop if there's an active or connecting call
    if (callStatus === RetellCallStatus.IDLE || callStatus === RetellCallStatus.ERROR) {
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
  }, [callStatus]);

  /**
   * Toggle the call on or off
   */
  const toggleCall = useCallback(() => {
    if (callStatus === RetellCallStatus.CONNECTED) {
      stopCall();
    } else if (callStatus === RetellCallStatus.IDLE || callStatus === RetellCallStatus.ERROR) {
      startCall();
    }
    // If connecting, do nothing (wait for state to settle)
  }, [callStatus, startCall, stopCall]);

  return {
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
}
