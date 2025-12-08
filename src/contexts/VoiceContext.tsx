import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useConversation } from '@elevenlabs/react';

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

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const conversation = useConversation();

  // Real audio stream handling
  useEffect(() => {
    if (conversation?.audioStream) {
      dispatch({ type: 'SET_AUDIO_STREAM', payload: conversation.audioStream });
    }
  }, [conversation?.audioStream]);

  // Monitor connection state
  useEffect(() => {
    if (conversation) {
      dispatch({ type: 'SET_CONNECTED', payload: conversation.status === 'connected' });
      dispatch({ type: 'SET_LOADING', payload: conversation.status === 'connecting' });
      dispatch({ type: 'SET_SPEAKING', payload: conversation.isSpeaking || false });
    }
  }, [conversation?.status, conversation?.isSpeaking, conversation]);

  // Handle messages
  useEffect(() => {
    if (conversation?.messages) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            role: lastMessage.source === 'user' ? 'user' : 'assistant',
            content: lastMessage.message,
          },
        });
      }
    }
  }, [conversation?.messages]);

  const connect = useCallback(
    async (agentId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        await conversation?.startSession({ agentId });

        dispatch({ type: 'SET_CONNECTED', payload: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [conversation]
  );

  const disconnect = useCallback(async () => {
    try {
      await conversation?.endSession();
      dispatch({ type: 'RESET' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect';
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
