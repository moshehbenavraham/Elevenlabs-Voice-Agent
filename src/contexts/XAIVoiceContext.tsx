import { createContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { trackError } from '@/lib/errorTracking';
import {
  encodeBase64,
  decodeAudioFromXAI,
  createAudioBuffer,
  int16ToBytes,
  XAI_SAMPLE_RATE,
} from '@/lib/audio/audioUtils';

const DEBUG = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const XAI_REALTIME_URL = 'wss://api.x.ai/v1/realtime';

// xAI configuration from environment
const XAI_VOICE = import.meta.env.VITE_XAI_VOICE || 'verse';
const XAI_INSTRUCTIONS =
  import.meta.env.VITE_XAI_INSTRUCTIONS ||
  'You are a helpful voice assistant. Keep responses conversational and concise.';

function debugLog(context: string, message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[XAIVoiceContext:${context}]`, message, data ?? '');
  }
}

// Connection status types
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';

interface XAIVoiceState {
  status: ConnectionStatus;
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  volume: number;
}

export interface XAIVoiceContextValue extends XAIVoiceState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setVolume: (volume: number) => void;
  clearError: () => void;
  getAnalyserNode: () => AnalyserNode | null;
}

const initialState: XAIVoiceState = {
  status: 'idle',
  isConnected: false,
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  error: null,
  volume: 0.7,
};

type XAIVoiceAction =
  | { type: 'SET_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_SPEAKING'; payload: boolean }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'RESET' };

function xaiVoiceReducer(state: XAIVoiceState, action: XAIVoiceAction): XAIVoiceState {
  switch (action.type) {
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
        isConnected: action.payload === 'connected',
        isLoading: action.payload === 'connecting' || action.payload === 'disconnecting',
      };
    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.payload };
    case 'SET_LISTENING':
      return { ...state, isListening: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: action.payload ? 'error' : state.status };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'RESET':
      return { ...initialState, volume: state.volume };
    default:
      return state;
  }
}

/**
 * Fetch ephemeral token from backend
 */
async function getEphemeralToken(): Promise<string> {
  debugLog('getEphemeralToken', 'Requesting ephemeral token from server...');

  const response = await fetch(`${API_BASE_URL}/api/xai/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get session token' }));
    throw new Error(error.message || `Server error: ${response.status}`);
  }

  const data = await response.json();
  debugLog('getEphemeralToken', 'Ephemeral token received');
  return data.token;
}

/**
 * Parse microphone permission errors
 */
function parseMicrophoneError(error: unknown): string {
  if (error instanceof Error) {
    const name = error.name;
    const message = error.message.toLowerCase();

    if (name === 'NotAllowedError' || message.includes('permission denied')) {
      return 'Microphone access denied. Please allow microphone permission.';
    }
    if (name === 'NotFoundError' || message.includes('not found')) {
      return 'No microphone found. Please connect a microphone.';
    }
    if (name === 'NotReadableError' || message.includes('not readable')) {
      return 'Microphone is in use by another application.';
    }
    if (name === 'SecurityError' || message.includes('secure context')) {
      return 'Microphone requires HTTPS connection.';
    }
    return `Microphone error: ${error.message}`;
  }
  return 'Failed to access microphone.';
}

/**
 * Parse xAI/WebSocket errors
 */
function parseXAIError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    if (message.includes('websocket') || message.includes('socket')) {
      return 'Connection lost. Please try again.';
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication failed. Please check xAI configuration.';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'Rate limited. Please wait and try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export const XAIVoiceContext = createContext<XAIVoiceContextValue | null>(null);

interface XAIVoiceProviderProps {
  children: ReactNode;
  onDisconnect?: () => void;
}

export function XAIVoiceProvider({ children, onDisconnect }: XAIVoiceProviderProps) {
  const [state, dispatch] = useReducer(xaiVoiceReducer, initialState);

  // Refs for cleanup
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const playNextInQueueRef = useRef<(() => void) | null>(null);

  /**
   * Play queued audio buffers sequentially
   */
  const playNextInQueue = useCallback(() => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      dispatch({ type: 'SET_SPEAKING', payload: false });
      return;
    }

    isPlayingRef.current = true;
    dispatch({ type: 'SET_SPEAKING', payload: true });

    const buffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;

    // Connect through gain node for volume control and analyser for visualization
    if (gainNodeRef.current) {
      source.connect(gainNodeRef.current);
    }
    if (analyserRef.current && gainNodeRef.current) {
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } else if (gainNodeRef.current) {
      gainNodeRef.current.connect(audioContextRef.current.destination);
    } else {
      source.connect(audioContextRef.current.destination);
    }

    source.onended = () => {
      playNextInQueueRef.current?.();
    };

    source.start();
  }, []);

  // Keep ref updated with latest function
  useEffect(() => {
    playNextInQueueRef.current = playNextInQueue;
  }, [playNextInQueue]);

  /**
   * Handle incoming WebSocket messages from xAI
   */
  const handleWSMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        debugLog('ws:message', `Type: ${data.type}`, data);

        switch (data.type) {
          case 'session.created':
            debugLog('session', 'Session created, sending config...');
            // Send session update with voice and instructions
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'session.update',
                  session: {
                    modalities: ['audio', 'text'],
                    voice: XAI_VOICE,
                    instructions: XAI_INSTRUCTIONS,
                    input_audio_format: 'pcm16',
                    output_audio_format: 'pcm16',
                    turn_detection: {
                      type: 'server_vad',
                      threshold: 0.5,
                      prefix_padding_ms: 300,
                      silence_duration_ms: 500,
                    },
                  },
                })
              );
            }
            break;

          case 'session.updated':
            debugLog('session', 'Session updated, ready for conversation');
            dispatch({ type: 'SET_STATUS', payload: 'connected' });
            dispatch({ type: 'SET_LISTENING', payload: true });
            break;

          case 'input_audio_buffer.speech_started':
            debugLog('audio', 'User started speaking');
            dispatch({ type: 'SET_LISTENING', payload: true });
            break;

          case 'input_audio_buffer.speech_stopped':
            debugLog('audio', 'User stopped speaking');
            break;

          case 'response.audio.delta':
            // Handle incoming audio
            if (data.delta && audioContextRef.current) {
              const float32Data = decodeAudioFromXAI(data.delta);
              const audioBuffer = createAudioBuffer(
                audioContextRef.current,
                float32Data,
                XAI_SAMPLE_RATE
              );
              audioQueueRef.current.push(audioBuffer);

              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }
            break;

          case 'response.audio.done':
            debugLog('audio', 'Audio response complete');
            break;

          case 'response.done':
            debugLog('response', 'Response complete');
            break;

          case 'error':
            const errorMsg = data.error?.message || 'xAI error occurred';
            trackError('XAIVoiceContext', 'xAI WebSocket error', data.error);
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            break;
        }
      } catch (err) {
        debugLog('ws:message', 'Failed to parse message', err);
      }
    },
    [playNextInQueue]
  );

  /**
   * Initialize audio worklet for microphone capture
   */
  const initializeAudioCapture = useCallback(async (audioContext: AudioContext) => {
    try {
      // Load the PCM encoder worklet
      const workletUrl = new URL('../lib/audio/pcmEncoder.worklet.ts', import.meta.url).href;
      await audioContext.audioWorklet.addModule(workletUrl);
      debugLog('audio', 'AudioWorklet loaded');

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: 48000 },
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Create audio nodes
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-encoder-processor');
      workletNodeRef.current = workletNode;

      // Handle encoded audio from worklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && wsRef.current?.readyState === WebSocket.OPEN) {
          const pcm16Data = event.data.audio as Int16Array;
          const bytes = int16ToBytes(pcm16Data);
          const base64Audio = encodeBase64(bytes);

          wsRef.current.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            })
          );
        }
      };

      // Connect source to worklet (worklet doesn't need to connect to destination)
      source.connect(workletNode);

      debugLog('audio', 'Microphone capture initialized');
    } catch (error) {
      const errorMsg = parseMicrophoneError(error);
      trackError('XAIVoiceContext', 'Microphone initialization failed', error);
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Connect to xAI Realtime API
   */
  const connect = useCallback(async () => {
    debugLog('connect', 'Starting xAI connection...');

    if (state.status === 'connecting' || state.status === 'connected') {
      debugLog('connect', 'Already connecting or connected');
      return;
    }

    try {
      dispatch({ type: 'SET_STATUS', payload: 'connecting' });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Get ephemeral token from backend
      let token: string;
      try {
        token = await getEphemeralToken();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to get session token';
        trackError('XAIVoiceContext', 'Token fetch failed', error);
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
        dispatch({ type: 'SET_STATUS', payload: 'error' });
        return;
      }

      // Initialize AudioContext (must be after user gesture)
      const audioContext = new AudioContext({ sampleRate: XAI_SAMPLE_RATE });
      audioContextRef.current = audioContext;

      // Resume AudioContext (required for Safari)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = state.volume;
      gainNodeRef.current = gainNode;

      // Create analyser for visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Initialize microphone capture
      await initializeAudioCapture(audioContext);

      // Connect to xAI WebSocket
      const wsUrl = `${XAI_REALTIME_URL}?model=grok-2-public`;
      debugLog('ws', `Connecting to ${wsUrl}`);

      const ws = new WebSocket(wsUrl, ['realtime', `openai-insecure-api-key.${token}`]);
      wsRef.current = ws;

      ws.onopen = () => {
        debugLog('ws', 'WebSocket connected');
        // Session will be created by server, wait for session.created event
      };

      ws.onmessage = handleWSMessage;

      ws.onerror = (event) => {
        debugLog('ws', 'WebSocket error', event);
        trackError('XAIVoiceContext', 'WebSocket error');
        dispatch({ type: 'SET_ERROR', payload: 'Connection error occurred' });
      };

      ws.onclose = (event) => {
        debugLog('ws', `WebSocket closed: ${event.code} ${event.reason}`);
        if (state.status === 'connected') {
          dispatch({ type: 'SET_STATUS', payload: 'idle' });
          onDisconnect?.();
        }
      };
    } catch (error) {
      const errorMsg = parseXAIError(error);
      trackError('XAIVoiceContext', 'Connection failed', error);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      dispatch({ type: 'SET_STATUS', payload: 'error' });
    }
  }, [state.status, state.volume, handleWSMessage, initializeAudioCapture, onDisconnect]);

  /**
   * Disconnect and cleanup all resources
   */
  const disconnect = useCallback(async () => {
    debugLog('disconnect', 'Disconnecting...');
    dispatch({ type: 'SET_STATUS', payload: 'disconnecting' });

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect worklet
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    // Clear refs
    analyserRef.current = null;
    gainNodeRef.current = null;

    dispatch({ type: 'RESET' });
    onDisconnect?.();
    debugLog('disconnect', 'Disconnected');
  }, [onDisconnect]);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  /**
   * Get analyser node for visualization
   */
  const getAnalyserNode = useCallback((): AnalyserNode | null => {
    return analyserRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const value: XAIVoiceContextValue = {
    ...state,
    connect,
    disconnect,
    setVolume,
    clearError,
    getAnalyserNode,
  };

  return <XAIVoiceContext.Provider value={value}>{children}</XAIVoiceContext.Provider>;
}

export default XAIVoiceContext;
