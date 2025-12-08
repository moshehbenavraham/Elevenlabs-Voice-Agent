import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useConversation } from '@elevenlabs/react';
import { trackError, trackWarning } from '@/lib/errorTracking';

const DEBUG = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

  const response = await fetch(`${API_BASE_URL}/api/elevenlabs/signed-url`, {
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
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_AUDIO_STREAM'; payload: MediaStream | null }
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
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_AUDIO_STREAM':
      return { ...state, audioStream: action.payload };
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

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const lastMessageCount = useRef(0);

  // Initialize conversation with event handlers for better error tracking
  const conversation = useConversation({
    onConnect: () => {
      debugLog('onConnect', 'Successfully connected to ElevenLabs');
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
    },
    onDisconnect: () => {
      debugLog('onDisconnect', 'Disconnected from ElevenLabs');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    },
    onError: (error) => {
      const errorMessage = parseElevenLabsError(error);
      trackError('VoiceContext', 'ElevenLabs conversation error', error, {
        status: conversation?.status,
      });
      debugLog('onError', 'Conversation error', { error, parsed: errorMessage });
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
    },
    onMessage: (message) => {
      debugLog('onMessage', 'Received message', message);
    },
  });

  // Real audio stream handling
  useEffect(() => {
    if (conversation?.audioStream) {
      debugLog('audioStream', 'Audio stream available');
      dispatch({ type: 'SET_AUDIO_STREAM', payload: conversation.audioStream });
    }
  }, [conversation?.audioStream]);

  // Monitor connection state
  useEffect(() => {
    if (conversation) {
      debugLog('status', `Status changed: ${conversation.status}`, {
        isSpeaking: conversation.isSpeaking,
      });
      dispatch({ type: 'SET_CONNECTED', payload: conversation.status === 'connected' });
      dispatch({ type: 'SET_LOADING', payload: conversation.status === 'connecting' });
      dispatch({ type: 'SET_SPEAKING', payload: conversation.isSpeaking || false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.status, conversation?.isSpeaking]);

  // Handle messages - improved to avoid duplicates
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > lastMessageCount.current) {
      const newMessages = conversation.messages.slice(lastMessageCount.current);
      newMessages.forEach((msg) => {
        debugLog('messages', 'New message', msg);
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            role: msg.source === 'user' ? 'user' : 'assistant',
            content: msg.message,
          },
        });
      });
      lastMessageCount.current = conversation.messages.length;
    }
  }, [conversation?.messages]);

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

      if (agentId === 'your_agent_id_here') {
        const error = 'Please configure a valid ElevenLabs Agent ID';
        trackWarning('VoiceContext', error);
        dispatch({ type: 'SET_ERROR', payload: error });
        return;
      }

      // Check if conversation hook is available
      if (!conversation) {
        const error = 'Voice conversation not initialized. Please refresh the page.';
        trackError('VoiceContext', error);
        dispatch({ type: 'SET_ERROR', payload: error });
        return;
      }

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        lastMessageCount.current = 0;

        debugLog('connect', 'Requesting microphone permission...');

        // Request microphone permission first for better error messages
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
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
        await conversation.startSession({
          signedUrl,
          connectionType: 'websocket',
        });
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
    [conversation]
  );

  const disconnect = useCallback(async () => {
    debugLog('disconnect', 'Ending session...');
    try {
      await conversation?.endSession();
      debugLog('disconnect', 'Session ended successfully');
      dispatch({ type: 'RESET' });
      lastMessageCount.current = 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect';
      trackError('VoiceContext', 'Disconnect failed', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [conversation]);

  const setVolume = useCallback(
    (volume: number) => {
      dispatch({ type: 'SET_VOLUME', payload: volume });
      // Apply volume to audio stream if available
      if (state.audioStream) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(state.audioStream);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
      }
    },
    [state.audioStream]
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value: VoiceContextType = {
    ...state,
    connect,
    disconnect,
    setVolume,
    clearError,
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
