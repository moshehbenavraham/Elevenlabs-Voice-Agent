import {
  createContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { trackError } from '@/lib/errorTracking';
import {
  encodeBase64,
  decodeAudioFromXAI,
  createAudioBuffer,
  int16ToBytes,
  XAI_SAMPLE_RATE,
  createPcmEncoderWorkletUrl,
} from '@/lib/audio/audioUtils';
import { getSavedVoice, saveVoice } from '@/lib/voiceConfig';
import { useReconnection, type ReconnectionState } from '@/hooks/useReconnection';
import { getOpenAITools } from '@/lib/tools/toolDefinitions';
import {
  getProviderSettings,
  updateProviderSettings,
  DEFAULT_OPENAI_PROMPT,
} from '@/lib/settingsStorage';
import { getApiBaseUrl } from '@/lib/apiConfig';
import type { VoiceMessage, FunctionCall } from '@/types';

const DEBUG = import.meta.env.DEV;

// OpenAI Realtime API configuration
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime';

// OpenAI uses same audio format as xAI: 24kHz PCM16 mono
const OPENAI_SAMPLE_RATE = XAI_SAMPLE_RATE;

// OpenAI configuration from environment
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-realtime';

function debugLog(context: string, message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[OpenAIVoiceContext:${context}]`, message, data ?? '');
  }
}

// Connection status types
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';

interface OpenAIVoiceState {
  status: ConnectionStatus;
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  volume: number;
  messages: VoiceMessage[];
  pendingFunctionCall: FunctionCall | null;
}

export interface OpenAIVoiceContextValue extends OpenAIVoiceState {
  selectedVoice: string;
  setVoice: (voice: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setVolume: (volume: number) => void;
  clearError: () => void;
  getAnalyserNode: () => AnalyserNode | null;
  reconnection: ReconnectionState;
  manualReconnect: () => void;
}

const initialState: OpenAIVoiceState = {
  status: 'idle',
  isConnected: false,
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  error: null,
  volume: 0.7,
  messages: [],
  pendingFunctionCall: null,
};

type OpenAIVoiceAction =
  | { type: 'SET_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_SPEAKING'; payload: boolean }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'ADD_MESSAGE'; payload: VoiceMessage }
  | { type: 'UPDATE_MESSAGE'; payload: VoiceMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: string }
  | { type: 'SET_PENDING_FUNCTION_CALL'; payload: FunctionCall | null }
  | { type: 'RESET' };

function openAIVoiceReducer(state: OpenAIVoiceState, action: OpenAIVoiceAction): OpenAIVoiceState {
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
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.id ? action.payload : message
        ),
      };
    case 'UPDATE_LAST_MESSAGE': {
      if (state.messages.length === 0) return state;
      const updatedMessages = [...state.messages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + action.payload,
      };
      return { ...state, messages: updatedMessages };
    }
    case 'SET_PENDING_FUNCTION_CALL':
      return { ...state, pendingFunctionCall: action.payload };
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

  const response = await fetch(`${getApiBaseUrl()}/api/openai/session`, {
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
 * Parse OpenAI/WebSocket errors
 */
function parseOpenAIError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    if (message.includes('websocket') || message.includes('socket')) {
      return 'Connection lost. Please try again.';
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication failed. Please check OpenAI configuration.';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'Rate limited. Please wait and try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

// eslint-disable-next-line react-refresh/only-export-components
export const OpenAIVoiceContext = createContext<OpenAIVoiceContextValue | null>(null);

interface OpenAIVoiceProviderProps {
  children: ReactNode;
  onDisconnect?: () => void;
}

export function OpenAIVoiceProvider({ children, onDisconnect }: OpenAIVoiceProviderProps) {
  const [state, dispatch] = useReducer(openAIVoiceReducer, initialState);

  // Track if disconnect was intentional to prevent auto-reconnect
  const intentionalDisconnectRef = useRef(false);

  // Track status for WebSocket callbacks so close handlers do not read stale render state.
  const statusRef = useRef(state.status);
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  // Voice selection state with localStorage persistence
  const [selectedVoice, setSelectedVoiceState] = useState(() => getSavedVoice('openai'));
  const selectedVoiceRef = useRef(selectedVoice);

  // System prompt state with localStorage persistence
  const [systemPrompt, setSystemPromptState] = useState(() => {
    const settings = getProviderSettings('openai');
    return settings.systemPrompt || DEFAULT_OPENAI_PROMPT;
  });
  const systemPromptRef = useRef(systemPrompt);

  // Keep refs in sync with state for use in callbacks
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  useEffect(() => {
    systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  // Set voice with localStorage persistence
  const setVoice = useCallback((voice: string) => {
    setSelectedVoiceState(voice);
    saveVoice('openai', voice);
  }, []);

  // Set system prompt with localStorage persistence
  const setSystemPrompt = useCallback((prompt: string) => {
    setSystemPromptState(prompt);
    updateProviderSettings('openai', { systemPrompt: prompt });
  }, []);

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
  const handleWSMessageRef = useRef<((event: MessageEvent) => void) | null>(null);

  /**
   * Reconnect function - fetches fresh ephemeral token and re-establishes connection
   * Used by useReconnection hook on auto-reconnect attempts
   */
  const performReconnect = useCallback(async () => {
    debugLog('reconnect', 'Attempting to reconnect with fresh token...');

    // Skip if intentional disconnect
    if (intentionalDisconnectRef.current) {
      debugLog('reconnect', 'Skipping - intentional disconnect');
      return;
    }

    // Get fresh ephemeral token
    const token = await getEphemeralToken();

    // Initialize AudioContext
    const audioContext = new AudioContext({ sampleRate: OPENAI_SAMPLE_RATE });
    audioContextRef.current = audioContext;

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

    // Initialize microphone capture with inline worklet (avoids auth/CORS issues)
    const workletUrl = createPcmEncoderWorkletUrl(OPENAI_SAMPLE_RATE);
    await audioContext.audioWorklet.addModule(workletUrl);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: { ideal: 48000 },
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    mediaStreamRef.current = stream;

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-encoder-processor');
    workletNodeRef.current = workletNode;

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

    source.connect(workletNode);

    // Connect to OpenAI WebSocket
    const wsUrl = `${OPENAI_REALTIME_URL}?model=${OPENAI_MODEL}`;
    debugLog('ws', `Reconnecting to ${wsUrl}`);

    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl, ['realtime', `openai-insecure-api-key.${token}`]);
      wsRef.current = ws;

      ws.onopen = () => {
        debugLog('ws', 'WebSocket reconnected');
      };

      ws.onmessage = (event) => {
        handleWSMessageRef.current?.(event);
        // Resolve on session.updated (connection fully established)
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'session.updated') {
            resolve();
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        reject(new Error('WebSocket reconnection failed'));
      };

      ws.onclose = (event) => {
        debugLog('ws', `WebSocket closed during reconnect: ${event.code}`);
        if (event.code !== 1000) {
          reject(new Error('WebSocket closed unexpectedly'));
        }
      };

      // Timeout after 30 seconds
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error('Reconnection timeout'));
        }
      }, 30000);
    });
  }, [state.volume]);

  // Reconnection hook
  const reconnectionHook = useReconnection(performReconnect, {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    jitterFactor: 0.3,
  });

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
   * Execute a function call and send results back to OpenAI
   */
  const handleFunctionCall = useCallback(
    async (callId: string, name: string, argumentsJson: string) => {
      debugLog('function', `Executing function: ${name}`, { callId, argumentsJson });

      // Parse arguments
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(argumentsJson);
      } catch {
        args = {};
      }

      // Set pending function call state
      const functionCall: FunctionCall = {
        callId,
        name,
        arguments: args,
        status: 'executing',
      };
      const messageId = `openai-function-${callId}`;
      dispatch({ type: 'SET_PENDING_FUNCTION_CALL', payload: functionCall });

      // Add function call message to transcript
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: messageId,
          role: 'function',
          content: `Calling ${name}...`,
          timestamp: Date.now(),
          functionCall,
        },
      });

      try {
        // Execute function via backend
        const response = await fetch(`${getApiBaseUrl()}/api/functions/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, arguments: args, callId }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Function execution failed');
        }

        debugLog('function', `Function ${name} completed`, result);

        // Update function call state to completed
        const completedCall: FunctionCall = {
          ...functionCall,
          status: 'completed',
          result: result.result,
        };
        dispatch({ type: 'SET_PENDING_FUNCTION_CALL', payload: null });

        // Update the function message with result
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: messageId,
            role: 'function',
            content: result.result?.formatted || JSON.stringify(result.result),
            timestamp: Date.now(),
            functionCall: completedCall,
          },
        });

        // Send function result back to OpenAI
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // First, create a conversation item with the function call output
          wsRef.current.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify(result.result),
              },
            })
          );

          // Then trigger a response to have the model speak the result
          wsRef.current.send(
            JSON.stringify({
              type: 'response.create',
            })
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Function execution failed';
        trackError('OpenAIVoiceContext', `Function ${name} failed`, error);

        // Update function call state to error
        const errorCall: FunctionCall = {
          ...functionCall,
          status: 'error',
          error: errorMessage,
        };
        dispatch({ type: 'SET_PENDING_FUNCTION_CALL', payload: null });

        // Update the function message with error
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: messageId,
            role: 'function',
            content: `Error: ${errorMessage}`,
            timestamp: Date.now(),
            functionCall: errorCall,
          },
        });

        // Send error back to OpenAI so it can inform the user
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify({ error: errorMessage }),
              },
            })
          );

          wsRef.current.send(
            JSON.stringify({
              type: 'response.create',
            })
          );
        }
      }
    },
    []
  );

  /**
   * Handle incoming WebSocket messages from OpenAI
   */
  const handleWSMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        debugLog('ws:message', `Type: ${data.type}`, data);

        switch (data.type) {
          case 'session.created':
            debugLog('session', 'Session created, sending config...');
            // Send session update with voice, instructions, and tools
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              // OpenAI GA Realtime API uses nested audio configuration structure
              wsRef.current.send(
                JSON.stringify({
                  type: 'session.update',
                  session: {
                    type: 'realtime',
                    output_modalities: ['audio'],
                    instructions: systemPromptRef.current,
                    audio: {
                      input: {
                        format: {
                          type: 'audio/pcm',
                          rate: 24000,
                        },
                        transcription: {
                          model: 'whisper-1',
                        },
                        turn_detection: {
                          type: 'server_vad',
                          threshold: 0.5,
                          prefix_padding_ms: 300,
                          silence_duration_ms: 500,
                        },
                      },
                      output: {
                        format: {
                          type: 'audio/pcm',
                          rate: 24000,
                        },
                        voice: selectedVoiceRef.current,
                      },
                    },
                    tools: getOpenAITools(),
                    tool_choice: 'auto',
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

          case 'conversation.item.input_audio_transcription.completed':
            // User's speech has been transcribed
            if (data.transcript) {
              debugLog('transcript', 'User transcript received', data.transcript);
              dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                  id: `openai-user-${data.item_id || Date.now()}`,
                  role: 'user',
                  content: data.transcript,
                  timestamp: Date.now(),
                },
              });
            }
            break;

          case 'response.output_audio_transcript.delta':
            // Streaming assistant transcript - append to current message
            if (data.delta) {
              debugLog('transcript', 'Assistant transcript delta', data.delta);
              dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: data.delta });
            }
            break;

          case 'response.created':
            // New response starting - create placeholder message for streaming
            debugLog('response', 'New response created', data.response?.id);
            dispatch({
              type: 'ADD_MESSAGE',
              payload: {
                id: `openai-assistant-${data.response?.id || Date.now()}`,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
              },
            });
            break;

          case 'response.output_audio.delta':
            // Handle incoming audio
            if (data.delta && audioContextRef.current) {
              const float32Data = decodeAudioFromXAI(data.delta);
              const audioBuffer = createAudioBuffer(
                audioContextRef.current,
                float32Data,
                OPENAI_SAMPLE_RATE
              );
              audioQueueRef.current.push(audioBuffer);

              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }
            break;

          case 'response.output_audio.done':
            debugLog('audio', 'Audio response complete');
            break;

          case 'response.done':
            debugLog('response', 'Response complete');
            break;

          case 'response.function_call_arguments.done':
            // Function call requested by the model
            debugLog('function', 'Function call received', data);
            handleFunctionCall(data.call_id, data.name, data.arguments);
            break;

          case 'error':
            const errorMsg = data.error?.message || 'OpenAI error occurred';
            trackError('OpenAIVoiceContext', 'OpenAI WebSocket error', data.error);
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            break;
        }
      } catch (err) {
        debugLog('ws:message', 'Failed to parse message', err);
      }
    },
    [playNextInQueue, handleFunctionCall]
  );

  // Keep handleWSMessage ref in sync
  useEffect(() => {
    handleWSMessageRef.current = handleWSMessage;
  }, [handleWSMessage]);

  /**
   * Initialize audio worklet for microphone capture
   */
  const initializeAudioCapture = useCallback(async (audioContext: AudioContext) => {
    try {
      // Load the PCM encoder worklet (inline blob avoids auth/CORS issues)
      const workletUrl = createPcmEncoderWorkletUrl(OPENAI_SAMPLE_RATE);
      await audioContext.audioWorklet.addModule(workletUrl);
      debugLog('audio', 'AudioWorklet loaded via Blob URL');

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
      trackError('OpenAIVoiceContext', 'Microphone initialization failed', error);
      throw new Error(errorMsg, { cause: error });
    }
  }, []);

  /**
   * Connect to OpenAI Realtime API
   */
  const connect = useCallback(async () => {
    debugLog('connect', 'Starting OpenAI connection...');

    if (state.status === 'connecting' || state.status === 'connected') {
      debugLog('connect', 'Already connecting or connected');
      return;
    }

    // Reset intentional disconnect flag for new connection
    intentionalDisconnectRef.current = false;

    try {
      dispatch({ type: 'SET_STATUS', payload: 'connecting' });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Get ephemeral token from backend
      let token: string;
      try {
        token = await getEphemeralToken();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to get session token';
        trackError('OpenAIVoiceContext', 'Token fetch failed', error);
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
        dispatch({ type: 'SET_STATUS', payload: 'error' });
        return;
      }

      // Initialize AudioContext (must be after user gesture)
      const audioContext = new AudioContext({ sampleRate: OPENAI_SAMPLE_RATE });
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

      // Connect to OpenAI WebSocket with Bearer token
      // OpenAI uses query param + protocol for auth since WebSocket API doesn't support headers
      const wsUrl = `${OPENAI_REALTIME_URL}?model=${OPENAI_MODEL}`;
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
        trackError('OpenAIVoiceContext', 'WebSocket error');
        dispatch({ type: 'SET_ERROR', payload: 'Connection error occurred' });
      };

      ws.onclose = (event) => {
        debugLog('ws', `WebSocket closed: ${event.code} ${event.reason}`);
        // Only trigger reconnection if we were connected and it's not intentional
        if (statusRef.current === 'connected' && !intentionalDisconnectRef.current) {
          wsRef.current = null;
          dispatch({ type: 'SET_STATUS', payload: 'idle' });
          // Trigger reconnection for abnormal closures
          reconnectionHook.onDisconnected(event.code);
        } else if (intentionalDisconnectRef.current) {
          wsRef.current = null;
          dispatch({ type: 'SET_STATUS', payload: 'idle' });
          onDisconnect?.();
        }
      };
    } catch (error) {
      const errorMsg = parseOpenAIError(error);
      trackError('OpenAIVoiceContext', 'Connection failed', error);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      dispatch({ type: 'SET_STATUS', payload: 'error' });
    }
  }, [
    state.status,
    state.volume,
    handleWSMessage,
    initializeAudioCapture,
    onDisconnect,
    reconnectionHook,
  ]);

  /**
   * Disconnect and cleanup all resources
   */
  const disconnect = useCallback(async () => {
    debugLog('disconnect', 'Disconnecting...');

    // Mark as intentional disconnect to prevent auto-reconnect
    intentionalDisconnectRef.current = true;

    // Cancel any pending reconnection attempts
    reconnectionHook.cancelReconnect();
    reconnectionHook.resetReconnection();

    dispatch({ type: 'SET_STATUS', payload: 'disconnecting' });

    // Close WebSocket with normal closure code
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
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
  }, [onDisconnect, reconnectionHook]);

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

  const value: OpenAIVoiceContextValue = {
    ...state,
    selectedVoice,
    setVoice,
    systemPrompt,
    setSystemPrompt,
    connect,
    disconnect,
    setVolume,
    clearError,
    getAnalyserNode,
    reconnection: {
      status: reconnectionHook.status,
      attempt: reconnectionHook.attempt,
      countdown: reconnectionHook.countdown,
      isOnline: reconnectionHook.isOnline,
    },
    manualReconnect: reconnectionHook.manualReconnect,
  };

  return <OpenAIVoiceContext.Provider value={value}>{children}</OpenAIVoiceContext.Provider>;
}

export default OpenAIVoiceContext;
