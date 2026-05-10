import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  ConversationProvider as ElevenLabsConversationProvider,
  useConversation,
} from '@elevenlabs/react';
import type { HookOptions, UseConversationOptions } from '@elevenlabs/react';
import { trackError, trackWarning } from '@/lib/errorTracking';
import { useReconnection, type ReconnectionState } from '@/hooks/useReconnection';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { isPlaceholderConfigValue } from '@/lib/configPlaceholders';

const DEBUG = import.meta.env.DEV;
const EMPTY_FREQUENCY_DATA = new Uint8Array(0);

type ElevenLabsConversation = ReturnType<typeof useConversation>;

function debugLog(context: string, message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[VoiceContext:${context}]`, message, data ?? '');
  }
}

/**
 * Fetch a signed URL from the backend server for authorized agent access
 */
async function getSignedUrl(): Promise<string> {
  debugLog('getSignedUrl', 'Requesting signed URL from server...');

  const response = await fetch(`${getApiBaseUrl()}/api/elevenlabs/signed-url`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get signed URL' }));
    throw new Error(error.message || `Server error: ${response.status}`);
  }

  const data = await response.json();
  debugLog('getSignedUrl', 'Signed URL received successfully');
  return data.signedUrl;
}

interface VoiceState {
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  error: string | null;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  volume: number;
  audioStream: MediaStream | null;
}

interface VoiceContextType extends VoiceState {
  connect: (agentId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setVolume: (volume: number) => void;
  clearError: () => void;
  getInputByteFrequencyData: () => Uint8Array;
  getOutputByteFrequencyData: () => Uint8Array;
  reconnection: ReconnectionState;
  manualReconnect: () => void;
}

const initialState: VoiceState = {
  isConnected: false,
  isLoading: false,
  isSpeaking: false,
  error: null,
  messages: [],
  volume: 0.7,
  audioStream: null,
};

type VoiceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_SPEAKING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { role: 'user' | 'assistant'; content: string } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'RESET' };

function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'RESET':
      return { ...initialState, volume: state.volume };
    default:
      return state;
  }
}

/**
 * Parse microphone permission errors into user-friendly messages
 */
function parseMicrophoneError(error: unknown): string {
  if (error instanceof Error) {
    const name = error.name;
    const message = error.message.toLowerCase();

    if (name === 'NotAllowedError' || message.includes('permission denied')) {
      return 'Microphone access denied. Please allow microphone permission in your browser settings.';
    }
    if (name === 'NotFoundError' || message.includes('not found')) {
      return 'No microphone found. Please connect a microphone and try again.';
    }
    if (name === 'NotReadableError' || message.includes('not readable')) {
      return 'Microphone is in use by another application. Please close other apps using the microphone.';
    }
    if (name === 'OverconstrainedError') {
      return 'Microphone does not meet requirements. Please try a different microphone.';
    }
    if (name === 'SecurityError' || message.includes('secure context')) {
      return 'Microphone requires HTTPS. Please use a secure connection.';
    }
    return `Microphone error: ${error.message}`;
  }
  return 'Failed to access microphone. Please check your browser settings.';
}

/**
 * Parse ElevenLabs API errors into user-friendly messages
 */
function parseElevenLabsError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }

    // WebSocket errors
    if (message.includes('websocket') || message.includes('socket')) {
      return 'Connection lost. Please check your network and try again.';
    }

    // Authentication errors
    if (message.includes('401') || message.includes('unauthorized') || message.includes('auth')) {
      return 'Authentication failed. Please check your ElevenLabs Agent ID.';
    }

    // Rate limiting
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many')) {
      return 'Rate limited. Please wait a moment and try again.';
    }

    // Not found (invalid agent ID)
    if (message.includes('404') || message.includes('not found')) {
      return 'Agent not found. Please verify your ElevenLabs Agent ID is correct.';
    }

    // Server errors
    if (message.includes('500') || message.includes('server error')) {
      return 'ElevenLabs server error. Please try again later.';
    }

    // Quota/billing errors
    if (message.includes('quota') || message.includes('billing') || message.includes('credits')) {
      return 'ElevenLabs quota exceeded. Please check your account credits.';
    }

    // Return original message if we can't parse it
    return error.message;
  }

  // Handle non-Error objects
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return 'An unexpected error occurred. Please try again.';
}

function getElevenLabsSessionOptions(signedUrl: string): HookOptions {
  return {
    signedUrl,
    connectionType: 'websocket',
    dynamicVariables: {
      agent_name: 'Atlas',
      greeting: 'Hey',
      user_name: 'there',
    },
    overrides: {
      agent: {
        prompt: {
          prompt: `You are Atlas, a friendly and helpful AI voice assistant. You help users with general questions, tasks, and conversation. Be concise, natural, and conversational in your responses since this is a voice interaction. Keep responses brief unless the user asks for more detail.`,
        },
        firstMessage: "Hey there! It's Atlas. What can I do for you?",
      },
    },
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export const VoiceContext = createContext<VoiceContextType | null>(null);

interface VoiceProviderProps {
  children: ReactNode;
  onDisconnect?: () => void;
}

export function VoiceProvider(props: VoiceProviderProps) {
  return (
    <ElevenLabsConversationProvider>
      <VoiceProviderCore {...props} />
    </ElevenLabsConversationProvider>
  );
}

function VoiceProviderCore({ children, onDisconnect: onDisconnectCallback }: VoiceProviderProps) {
  const [state, dispatch] = useReducer(voiceReducer, initialState);

  // Track if disconnect was intentional to prevent auto-reconnect
  const intentionalDisconnectRef = useRef(false);
  // Store the last agent ID used for reconnection
  const lastAgentIdRef = useRef<string | null>(null);

  // Ref to track previous connection state for detecting disconnect
  const wasConnectedRef = useRef(false);
  // Ref to store conversation object for use in callbacks
  const conversationRef = useRef<ElevenLabsConversation | null>(null);
  // Ref to store reconnection hook methods for use in callbacks
  const reconnectionHookRef = useRef<ReturnType<typeof useReconnection> | null>(null);

  // Initialize conversation with event handlers for better error tracking
  const conversation = useConversation({
    volume: state.volume,
    onConnect: () => {
      debugLog('onConnect', 'Successfully connected to ElevenLabs');
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
      wasConnectedRef.current = true;
      // Notify reconnection hook of successful connection (use ref for latest)
      reconnectionHookRef.current?.onConnected();
    },
    onDisconnect: (details) => {
      debugLog('onDisconnect', 'Disconnected from ElevenLabs', details);
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_SPEAKING', payload: false });

      // Determine if this was an abnormal disconnect
      const wasConnected = wasConnectedRef.current;
      wasConnectedRef.current = false;

      if (wasConnected && !intentionalDisconnectRef.current) {
        // Abnormal disconnect - trigger reconnection
        debugLog('onDisconnect', 'Abnormal disconnect detected, triggering reconnection');
        const closeCode = 'closeCode' in details ? (details.closeCode ?? 1006) : 1006;
        reconnectionHookRef.current?.onDisconnected(closeCode);
      } else if (intentionalDisconnectRef.current) {
        // Intentional disconnect - reset reconnection state
        debugLog('onDisconnect', 'Intentional disconnect, resetting state');
        reconnectionHookRef.current?.resetReconnection();
        onDisconnectCallback?.();
      }
    },
    onError: (message, context) => {
      const errorMessage = parseElevenLabsError(context ?? message);
      trackError('VoiceContext', 'ElevenLabs conversation error', context ?? message, {
        status: conversationRef.current?.status,
      });
      // Enhanced error logging for debugging
      debugLog('onError', 'Conversation error', {
        error: context ?? message,
        parsed: errorMessage,
        errorType: context instanceof Error ? context.name : typeof (context ?? message),
        errorDetails:
          context instanceof Error ? context.message : JSON.stringify(context ?? message),
      });
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
    },
    onMessage: (message) => {
      debugLog('onMessage', 'Received message', message);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          role: message.role === 'user' || message.source === 'user' ? 'user' : 'assistant',
          content: message.message,
        },
      });
    },
    onModeChange: ({ mode }) => {
      debugLog('onModeChange', 'Mode changed', { mode });
      dispatch({ type: 'SET_SPEAKING', payload: mode === 'speaking' });
    },
    onStatusChange: (status) => {
      debugLog('onStatusChange', 'Status changed', { status });
    },
  } satisfies UseConversationOptions);

  // Keep conversation ref in sync
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Monitor connection state
  useEffect(() => {
    debugLog('status', `Status changed: ${conversation.status}`, {
      isSpeaking: conversation.isSpeaking,
      message: conversation.message,
    });
    dispatch({ type: 'SET_CONNECTED', payload: conversation.status === 'connected' });
    dispatch({ type: 'SET_LOADING', payload: conversation.status === 'connecting' });
    dispatch({ type: 'SET_SPEAKING', payload: conversation.isSpeaking || false });
    if (conversation.status === 'error' && conversation.message) {
      dispatch({ type: 'SET_ERROR', payload: conversation.message });
    }
  }, [conversation.status, conversation.isSpeaking, conversation.message]);

  const startSessionWithLifecycle = useCallback((options: HookOptions): Promise<void> => {
    const activeConversation = conversationRef.current;
    if (!activeConversation) {
      return Promise.reject(
        new Error('Voice conversation not initialized. Please refresh the page.')
      );
    }

    if (activeConversation.status === 'connected') {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const timeoutId = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Timed out while connecting to ElevenLabs'));
        }
      }, 30000);

      const resolveOnce = () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timeoutId);
          resolve();
        }
      };

      const rejectOnce = (message: string, context?: unknown) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timeoutId);
          reject(context instanceof Error ? context : new Error(message));
        }
      };

      try {
        activeConversation.startSession({
          ...options,
          onConnect: resolveOnce,
          onError: rejectOnce,
        });
      } catch (error) {
        rejectOnce(parseElevenLabsError(error), error);
      }
    });
  }, []);

  /**
   * Reconnect function - fetches fresh signed URL and re-establishes connection
   * Used by useReconnection hook on auto-reconnect attempts
   */
  const performReconnect = useCallback(async () => {
    debugLog('reconnect', 'Attempting to reconnect with fresh signed URL...');

    // Skip if intentional disconnect
    if (intentionalDisconnectRef.current) {
      debugLog('reconnect', 'Skipping - intentional disconnect');
      return;
    }

    // Need a stored agent ID to reconnect
    if (!lastAgentIdRef.current) {
      throw new Error('No agent ID available for reconnection');
    }

    const signedUrl = await getSignedUrl();
    await startSessionWithLifecycle(getElevenLabsSessionOptions(signedUrl));

    debugLog('reconnect', 'Reconnection successful');
  }, [startSessionWithLifecycle]);

  // Reconnection hook
  const reconnectionHook = useReconnection(performReconnect, {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    jitterFactor: 0.3,
  });

  // Keep reconnection hook ref in sync
  useEffect(() => {
    reconnectionHookRef.current = reconnectionHook;
  }, [reconnectionHook]);

  const connect = useCallback(
    async (agentId: string) => {
      debugLog('connect', 'Starting connection', { agentId: agentId.substring(0, 8) + '...' });

      // Validate agent ID
      if (!agentId || agentId.trim() === '') {
        const error = 'Agent ID is required';
        trackWarning('VoiceContext', error);
        dispatch({ type: 'SET_ERROR', payload: error });
        return;
      }

      if (isPlaceholderConfigValue(agentId)) {
        const error = 'Please configure a valid ElevenLabs Agent ID';
        trackWarning('VoiceContext', error);
        dispatch({ type: 'SET_ERROR', payload: error });
        return;
      }

      // Reset intentional disconnect flag for new connection
      intentionalDisconnectRef.current = false;
      // Store agent ID for reconnection
      lastAgentIdRef.current = agentId;

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'CLEAR_MESSAGES' });

        debugLog('connect', 'Requesting microphone permission...');

        // Request microphone permission first for better error messages
        // Important: We must stop the stream after checking to avoid conflicts with the SDK
        try {
          const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop all tracks immediately - we only needed to verify permission
          permissionStream.getTracks().forEach((track) => track.stop());
          debugLog('connect', 'Microphone permission granted');
        } catch (micError) {
          const errorMessage = parseMicrophoneError(micError);
          trackError('VoiceContext', 'Microphone permission error', micError);
          dispatch({ type: 'SET_ERROR', payload: errorMessage });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        // Get signed URL from backend for authorized access
        debugLog('connect', 'Fetching signed URL from server...');
        let signedUrl: string;
        try {
          signedUrl = await getSignedUrl();
        } catch (urlError) {
          const errorMessage =
            urlError instanceof Error ? urlError.message : 'Failed to get authorization';
          trackError('VoiceContext', 'Failed to get signed URL', urlError);
          dispatch({ type: 'SET_ERROR', payload: `Authorization failed: ${errorMessage}` });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        debugLog('connect', 'Starting ElevenLabs session with signed URL...');
        await startSessionWithLifecycle(getElevenLabsSessionOptions(signedUrl));
        debugLog('connect', 'Session started successfully');
      } catch (error) {
        const errorMessage = parseElevenLabsError(error);
        trackError('VoiceContext', 'Connection failed', error, {
          agentId: agentId.substring(0, 8) + '...',
        });
        debugLog('connect', 'Connection failed', { error, parsed: errorMessage });
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [startSessionWithLifecycle]
  );

  const disconnect = useCallback(async () => {
    debugLog('disconnect', 'Ending session...');

    // Mark as intentional disconnect to prevent auto-reconnect
    intentionalDisconnectRef.current = true;

    // Cancel any pending reconnection attempts
    reconnectionHook.cancelReconnect();
    reconnectionHook.resetReconnection();

    try {
      conversation.endSession();
      debugLog('disconnect', 'Session ended successfully');
      dispatch({ type: 'RESET' });
      wasConnectedRef.current = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect';
      trackError('VoiceContext', 'Disconnect failed', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [conversation, reconnectionHook]);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
    const activeConversation = conversationRef.current;
    if (activeConversation?.status === 'connected') {
      try {
        activeConversation.setVolume({ volume });
      } catch (error) {
        trackError('VoiceContext', 'Failed to set ElevenLabs volume', error);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const getInputByteFrequencyData = useCallback(() => {
    try {
      return conversationRef.current?.getInputByteFrequencyData() ?? EMPTY_FREQUENCY_DATA;
    } catch (error) {
      trackError('VoiceContext', 'Failed to read ElevenLabs input frequency data', error);
      return EMPTY_FREQUENCY_DATA;
    }
  }, []);

  const getOutputByteFrequencyData = useCallback(() => {
    try {
      return conversationRef.current?.getOutputByteFrequencyData() ?? EMPTY_FREQUENCY_DATA;
    } catch (error) {
      trackError('VoiceContext', 'Failed to read ElevenLabs output frequency data', error);
      return EMPTY_FREQUENCY_DATA;
    }
  }, []);

  const value: VoiceContextType = {
    ...state,
    connect,
    disconnect,
    setVolume,
    clearError,
    getInputByteFrequencyData,
    getOutputByteFrequencyData,
    reconnection: {
      status: reconnectionHook.status,
      attempt: reconnectionHook.attempt,
      countdown: reconnectionHook.countdown,
      isOnline: reconnectionHook.isOnline,
    },
    manualReconnect: reconnectionHook.manualReconnect,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
