import { createContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { UltravoxSession } from 'ultravox-client';
import { trackError } from '@/lib/errorTracking';
import { getApiBaseUrl } from '@/lib/apiConfig';
import {
  mapUltravoxStatus,
  type UltravoxSessionStatus,
  type UltravoxVoiceState,
  type UltravoxVoiceContextValue,
  type UltravoxTranscript,
} from '@/types';

const DEBUG = import.meta.env.DEV;

function debugLog(context: string, message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[UltravoxVoiceContext:${context}]`, message, data ?? '');
  }
}

const initialState: UltravoxVoiceState = {
  sdkStatus: 'disconnected',
  status: 'idle',
  isConnected: false,
  isLoading: false,
  error: null,
  isSpeaking: false,
  isListening: false,
  isThinking: false,
  isMicMuted: false,
  transcripts: [],
};

type UltravoxVoiceAction =
  | { type: 'SET_SDK_STATUS'; payload: UltravoxSessionStatus }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MIC_MUTED'; payload: boolean }
  | { type: 'SET_TRANSCRIPTS'; payload: UltravoxTranscript[] }
  | { type: 'RESET' };

function ultravoxVoiceReducer(
  state: UltravoxVoiceState,
  action: UltravoxVoiceAction
): UltravoxVoiceState {
  switch (action.type) {
    case 'SET_SDK_STATUS': {
      const sdkStatus = action.payload;
      const status = mapUltravoxStatus(sdkStatus);
      return {
        ...state,
        sdkStatus,
        status,
        isConnected: status === 'connected',
        isLoading: status === 'connecting' || sdkStatus === 'disconnecting',
        isSpeaking: sdkStatus === 'speaking',
        isListening: sdkStatus === 'listening',
        isThinking: sdkStatus === 'thinking',
        error: null,
      };
    }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        status: action.payload ? 'error' : state.status,
      };
    case 'SET_MIC_MUTED':
      return { ...state, isMicMuted: action.payload };
    case 'SET_TRANSCRIPTS':
      return { ...state, transcripts: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * Fetch joinUrl from backend
 */
async function createUltravoxCall(): Promise<{ joinUrl: string; callId?: string }> {
  debugLog('createCall', 'Requesting call from backend...');

  const systemPrompt =
    import.meta.env.VITE_ULTRAVOX_INSTRUCTIONS ||
    'You are a helpful voice assistant. Keep responses conversational and concise.';

  const voice = import.meta.env.VITE_ULTRAVOX_VOICE || 'Mark';

  const response = await fetch(`${getApiBaseUrl()}/api/ultravox/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      systemPrompt,
      voice,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create call' }));
    throw new Error(error.message || `Server error: ${response.status}`);
  }

  const data = await response.json();
  debugLog('createCall', 'Call created', { callId: data.callId });
  return data;
}

// eslint-disable-next-line react-refresh/only-export-components
export const UltravoxVoiceContext = createContext<UltravoxVoiceContextValue | null>(null);

interface UltravoxVoiceProviderProps {
  children: ReactNode;
  onDisconnect?: () => void;
}

export function UltravoxVoiceProvider({ children, onDisconnect }: UltravoxVoiceProviderProps) {
  const [state, dispatch] = useReducer(ultravoxVoiceReducer, initialState);
  const sessionRef = useRef<UltravoxSession | null>(null);
  const intentionalDisconnectRef = useRef(false);

  /**
   * Handle status changes from SDK
   */
  const handleStatusChange = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    const sdkStatus = session.status.toLowerCase() as UltravoxSessionStatus;
    debugLog('status', 'Status changed', sdkStatus);
    dispatch({ type: 'SET_SDK_STATUS', payload: sdkStatus });

    // Handle disconnection
    if (sdkStatus === 'disconnected' && !intentionalDisconnectRef.current) {
      debugLog('status', 'Unexpected disconnection');
    }
  }, []);

  /**
   * Handle transcript changes from SDK
   */
  const handleTranscriptsChange = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    const transcripts = session.transcripts.map((t) => ({
      text: t.text,
      isFinal: t.isFinal,
      speaker: t.speaker.toLowerCase() as 'user' | 'agent',
      medium: t.medium.toLowerCase() as 'voice' | 'text',
      ordinal: t.ordinal,
    }));

    debugLog('transcripts', 'Transcripts updated', { count: transcripts.length });
    dispatch({ type: 'SET_TRANSCRIPTS', payload: transcripts });
  }, []);

  /**
   * Connect to Ultravox session
   */
  const connect = useCallback(async () => {
    debugLog('connect', 'Starting connection...');

    if (state.status === 'connecting' || state.status === 'connected') {
      debugLog('connect', 'Already connecting or connected');
      return;
    }

    intentionalDisconnectRef.current = false;
    dispatch({ type: 'SET_SDK_STATUS', payload: 'connecting' });

    try {
      // Get joinUrl from backend
      const { joinUrl } = await createUltravoxCall();

      // Create Ultravox session
      const session = new UltravoxSession();
      sessionRef.current = session;

      // Set up event listeners
      session.addEventListener('status', handleStatusChange);
      session.addEventListener('transcripts', handleTranscriptsChange);

      // Join the call
      debugLog('connect', 'Joining call...');
      session.joinCall(joinUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      trackError('UltravoxVoiceContext', 'Connection failed', error);
      // Dispatch SDK_STATUS first (which clears error), then SET_ERROR to set the error
      dispatch({ type: 'SET_SDK_STATUS', payload: 'disconnected' });
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
    }
  }, [state.status, handleStatusChange, handleTranscriptsChange]);

  /**
   * Disconnect from Ultravox session
   */
  const disconnect = useCallback(async () => {
    debugLog('disconnect', 'Disconnecting...');

    intentionalDisconnectRef.current = true;
    dispatch({ type: 'SET_SDK_STATUS', payload: 'disconnecting' });

    const session = sessionRef.current;
    if (session) {
      session.removeEventListener('status', handleStatusChange);
      session.removeEventListener('transcripts', handleTranscriptsChange);

      try {
        await session.leaveCall();
      } catch (error) {
        debugLog('disconnect', 'Error leaving call', error);
      }

      sessionRef.current = null;
    }

    dispatch({ type: 'RESET' });
    onDisconnect?.();
    debugLog('disconnect', 'Disconnected');
  }, [handleStatusChange, handleTranscriptsChange, onDisconnect]);

  /**
   * Toggle microphone mute
   */
  const toggleMic = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    if (state.isMicMuted) {
      session.unmuteMic();
      dispatch({ type: 'SET_MIC_MUTED', payload: false });
    } else {
      session.muteMic();
      dispatch({ type: 'SET_MIC_MUTED', payload: true });
    }
  }, [state.isMicMuted]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session) {
        session.leaveCall().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, []);

  const value: UltravoxVoiceContextValue = {
    ...state,
    connect,
    disconnect,
    toggleMic,
    clearError,
  };

  return <UltravoxVoiceContext.Provider value={value}>{children}</UltravoxVoiceContext.Provider>;
}

export default UltravoxVoiceContext;
