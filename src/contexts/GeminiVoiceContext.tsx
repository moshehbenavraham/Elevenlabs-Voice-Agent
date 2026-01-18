/**
 * GeminiVoiceContext - React Context for Gemini Live Voice Conversations
 *
 * This context provides state management for Gemini Live voice conversations.
 * It bridges the GenAILiveClient WebSocket infrastructure with React UI components.
 *
 * Features:
 * - Connection lifecycle management (connect, disconnect, reconnect)
 * - Transcript accumulation with partial/final handling
 * - Session timer with warnings (12min, 14min, 15min auto-disconnect)
 * - Thinking state detection (300ms after user speech ends)
 * - Barge-in handling with immediate audio queue clearing
 * - Mute toggle for microphone control
 *
 * @see src/lib/gemini/genai-live-client.ts - WebSocket client
 * @see src/types/gemini.ts - Type definitions
 */

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
import { GenAILiveClient } from '@/lib/gemini/genai-live-client';
import { GeminiAudioRecorder } from '@/lib/gemini/audio-recorder';
import { GeminiAudioStreamer } from '@/lib/gemini/audio-streamer';
import { DEFAULT_GEMINI_VOICE, DEFAULT_SYSTEM_INSTRUCTION } from '@/lib/gemini/config';
import { useReconnection } from '@/hooks/useReconnection';
import type {
  GeminiConnectionStatus,
  GeminiVoiceState,
  GeminiVoiceContextValue,
  GeminiVoiceAction,
} from '@/types/gemini';
import { GEMINI_SESSION_TIMERS, GEMINI_INITIAL_STATE } from '@/types/gemini';
import { getApiBaseUrl } from '@/lib/apiConfig';
import type { VoiceMessage } from '@/types';

const DEBUG = import.meta.env.DEV;

// localStorage keys for voice persistence
const GEMINI_VOICE_KEY = 'gemini-voice';
const GEMINI_PROMPT_KEY = 'gemini-system-prompt';

function debugLog(context: string, message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[GeminiVoiceContext:${context}]`, message, data ?? '');
  }
}

// =============================================================================
// REDUCER
// =============================================================================

function geminiVoiceReducer(state: GeminiVoiceState, action: GeminiVoiceAction): GeminiVoiceState {
  switch (action.type) {
    case 'SET_STATUS': {
      const status = action.payload;
      return {
        ...state,
        status,
        isConnected:
          status === 'connected' ||
          status === 'listening' ||
          status === 'thinking' ||
          status === 'speaking',
        isLoading: status === 'connecting' || status === 'disconnecting',
      };
    }
    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.payload };
    case 'SET_LISTENING':
      return { ...state, isListening: action.payload };
    case 'SET_THINKING':
      return { ...state, isThinking: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        status: action.payload ? 'error' : state.status,
      };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
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
    case 'SET_ACTIVE_TRANSCRIPT':
      return { ...state, activeTranscript: action.payload };
    case 'SET_PENDING_FUNCTION_CALL':
      return { ...state, pendingFunctionCall: action.payload };
    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.payload };
    case 'SET_SESSION_WARNING':
      return { ...state, sessionWarning: action.payload };
    case 'RESET':
      return { ...GEMINI_INITIAL_STATE, volume: state.volume };
    default:
      return state;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Fetch ephemeral token from backend
 */
async function getEphemeralToken(): Promise<string> {
  debugLog('getEphemeralToken', 'Requesting ephemeral token from server...');

  const response = await fetch(`${getApiBaseUrl()}/api/gemini/session`, {
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
 * Parse Gemini/WebSocket errors
 */
function parseGeminiError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    if (message.includes('websocket') || message.includes('socket')) {
      return 'Connection lost. Please try again.';
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication failed. Please check Gemini configuration.';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'Rate limited. Please wait and try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

/**
 * Get saved voice from localStorage
 */
function getSavedGeminiVoice(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_GEMINI_VOICE;
  }
  try {
    return localStorage.getItem(GEMINI_VOICE_KEY) || DEFAULT_GEMINI_VOICE;
  } catch {
    return DEFAULT_GEMINI_VOICE;
  }
}

/**
 * Save voice to localStorage
 */
function saveGeminiVoice(voice: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GEMINI_VOICE_KEY, voice);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get saved system prompt from localStorage
 */
function getSavedGeminiPrompt(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_SYSTEM_INSTRUCTION;
  }
  try {
    return localStorage.getItem(GEMINI_PROMPT_KEY) || DEFAULT_SYSTEM_INSTRUCTION;
  } catch {
    return DEFAULT_SYSTEM_INSTRUCTION;
  }
}

/**
 * Save system prompt to localStorage
 */
function saveGeminiPrompt(prompt: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GEMINI_PROMPT_KEY, prompt);
  } catch {
    // Ignore localStorage errors
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const GeminiVoiceContext = createContext<GeminiVoiceContextValue | null>(null);

interface GeminiVoiceProviderProps {
  children: ReactNode;
  onDisconnect?: () => void;
}

export function GeminiVoiceProvider({ children, onDisconnect }: GeminiVoiceProviderProps) {
  const [state, dispatch] = useReducer(geminiVoiceReducer, GEMINI_INITIAL_STATE);

  // Track if disconnect was intentional to prevent auto-reconnect
  const intentionalDisconnectRef = useRef(false);

  // Track status for use in callbacks (avoids stale closure issues)
  const statusRef = useRef<GeminiConnectionStatus>(state.status);
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  // Voice selection state with localStorage persistence
  const [selectedVoice, setSelectedVoiceState] = useState(() => getSavedGeminiVoice());
  const selectedVoiceRef = useRef(selectedVoice);

  // System prompt state with localStorage persistence
  const [systemPrompt, setSystemPromptState] = useState(() => getSavedGeminiPrompt());
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
    saveGeminiVoice(voice);
  }, []);

  // Set system prompt with localStorage persistence
  const setSystemPrompt = useCallback((prompt: string) => {
    setSystemPromptState(prompt);
    saveGeminiPrompt(prompt);
  }, []);

  // Refs for cleanup
  const clientRef = useRef<GenAILiveClient | null>(null);
  const recorderRef = useRef<GeminiAudioRecorder | null>(null);
  const streamerRef = useRef<GeminiAudioStreamer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partialTranscriptRef = useRef<string>('');
  const lastCommittedTranscriptRef = useRef<string>('');

  /**
   * Clear thinking state timeout
   */
  const clearThinkingTimeout = useCallback(() => {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Clear session timer
   */
  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    dispatch({ type: 'SET_SESSION_DURATION', payload: 0 });
    dispatch({ type: 'SET_SESSION_WARNING', payload: null });
    sessionStartTimeRef.current = 0;
  }, []);

  /**
   * Start session timer
   */
  const startSessionTimer = useCallback(() => {
    clearSessionTimer();
    sessionStartTimeRef.current = Date.now();

    sessionTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      dispatch({ type: 'SET_SESSION_DURATION', payload: elapsed });

      // Check for warning thresholds
      if (elapsed >= GEMINI_SESSION_TIMERS.DISCONNECT_SECONDS) {
        debugLog('sessionTimer', 'Session limit reached (15min), auto-disconnecting');
        // Will be handled by caller
      } else if (elapsed >= GEMINI_SESSION_TIMERS.URGENT_SECONDS) {
        dispatch({ type: 'SET_SESSION_WARNING', payload: 'urgent' });
      } else if (elapsed >= GEMINI_SESSION_TIMERS.WARNING_SECONDS) {
        dispatch({ type: 'SET_SESSION_WARNING', payload: 'warning' });
      }
    }, 1000);
  }, [clearSessionTimer]);

  // Ref to hold reconnection hook for use in setupClientEventListeners
  const reconnectionHookRef = useRef<{
    onDisconnected: (code: number) => void;
  } | null>(null);

  /**
   * Set up event listeners for GenAILiveClient
   * Defined early to avoid hoisting issues
   */
  const setupClientEventListeners = useCallback(
    (client: GenAILiveClient, streamer: GeminiAudioStreamer) => {
      // Connection opened
      client.on('open', () => {
        debugLog('client', 'WebSocket connected');
      });

      // Setup complete - session is ready
      client.on('setupComplete', () => {
        debugLog('client', 'Session setup complete');
        dispatch({ type: 'SET_STATUS', payload: 'connected' });
        dispatch({ type: 'SET_LISTENING', payload: true });
      });

      // Audio received from Gemini
      client.on('audio', (data) => {
        // Clear thinking timeout since we have audio
        clearThinkingTimeout();
        dispatch({ type: 'SET_THINKING', payload: false });
        dispatch({ type: 'SET_SPEAKING', payload: true });
        dispatch({ type: 'SET_STATUS', payload: 'speaking' });

        // Add audio to streamer
        streamer.addPCM(data.audio);
      });

      // Handle streamer events
      streamer.on('ended', () => {
        dispatch({ type: 'SET_SPEAKING', payload: false });
        dispatch({ type: 'SET_STATUS', payload: 'connected' });
        dispatch({ type: 'SET_LISTENING', payload: true });
      });

      // Transcription received
      client.on('transcription', (data) => {
        const text = data.text.trim();
        if (!text) return;

        if (data.type === 'input') {
          // User transcription
          debugLog('transcript', 'User said:', text);

          // Clear thinking state when user starts speaking
          clearThinkingTimeout();
          dispatch({ type: 'SET_THINKING', payload: false });
          dispatch({ type: 'SET_LISTENING', payload: true });
          dispatch({ type: 'SET_STATUS', payload: 'listening' });

          // Add user message
          const userMessage: VoiceMessage = {
            id: `gemini-user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: Date.now(),
          };
          dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

          // Set thinking state after 300ms delay
          thinkingTimeoutRef.current = setTimeout(() => {
            // Only set thinking if not already speaking
            if (statusRef.current !== 'speaking') {
              dispatch({ type: 'SET_THINKING', payload: true });
              dispatch({ type: 'SET_LISTENING', payload: false });
              dispatch({ type: 'SET_STATUS', payload: 'thinking' });
            }
          }, GEMINI_SESSION_TIMERS.THINKING_DELAY_MS);
        } else {
          // Output transcription (assistant)
          debugLog('transcript', 'Assistant said:', text);

          // Track partial transcript for typing indicator
          partialTranscriptRef.current = text;
          dispatch({ type: 'SET_ACTIVE_TRANSCRIPT', payload: text });
        }
      });

      // Turn complete - AI finished speaking
      client.on('turnComplete', () => {
        debugLog('client', 'Turn complete');

        // Commit the partial transcript as final message
        const transcript = partialTranscriptRef.current.trim();
        if (transcript && transcript !== lastCommittedTranscriptRef.current) {
          const assistantMessage: VoiceMessage = {
            id: `gemini-assistant-${Date.now()}`,
            role: 'assistant',
            content: transcript,
            timestamp: Date.now(),
          };
          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
          lastCommittedTranscriptRef.current = transcript;
        }

        // Clear partial transcript
        partialTranscriptRef.current = '';
        dispatch({ type: 'SET_ACTIVE_TRANSCRIPT', payload: '' });
        dispatch({ type: 'SET_SPEAKING', payload: false });
        dispatch({ type: 'SET_THINKING', payload: false });
        dispatch({ type: 'SET_LISTENING', payload: true });
        dispatch({ type: 'SET_STATUS', payload: 'connected' });
      });

      // Interrupted (barge-in)
      client.on('interrupted', () => {
        debugLog('client', 'Interrupted by user (barge-in)');

        // Clear audio queue immediately
        streamer.stop();

        // Reset speaking state
        dispatch({ type: 'SET_SPEAKING', payload: false });
        dispatch({ type: 'SET_LISTENING', payload: true });
        dispatch({ type: 'SET_STATUS', payload: 'listening' });

        // Clear partial transcript
        partialTranscriptRef.current = '';
        dispatch({ type: 'SET_ACTIVE_TRANSCRIPT', payload: '' });
      });

      // Tool call
      client.on('toolcall', (data) => {
        debugLog('toolcall', `Function call: ${data.name}`, data.args);
        dispatch({
          type: 'SET_PENDING_FUNCTION_CALL',
          payload: {
            callId: data.id,
            name: data.name,
            arguments: data.args,
            status: 'pending',
          },
        });
        // TODO: Execute function and send response via client.sendToolResponse
      });

      // GoAway - server requested disconnect
      client.on('goAway', (data) => {
        debugLog('client', 'GoAway received', data);
        // Client automatically disconnects on goAway
      });

      // Error
      client.on('error', (data) => {
        debugLog('client', 'Error:', data.message);
        trackError('GeminiVoiceContext', data.message, data.error);
        dispatch({
          type: 'SET_ERROR',
          payload: parseGeminiError(data.error || new Error(data.message)),
        });
      });

      // Close
      client.on('close', (data) => {
        debugLog('client', `WebSocket closed: ${data.code} ${data.reason}`);

        // Only trigger reconnection if we were connected and it's not intentional
        if (statusRef.current !== 'idle' && !intentionalDisconnectRef.current) {
          dispatch({ type: 'SET_STATUS', payload: 'idle' });
          reconnectionHookRef.current?.onDisconnected(data.code);
        } else if (intentionalDisconnectRef.current) {
          dispatch({ type: 'SET_STATUS', payload: 'idle' });
          onDisconnect?.();
        }
      });
    },
    [clearThinkingTimeout, onDisconnect]
  );

  /**
   * Reconnect function - fetches fresh token and re-establishes connection
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

    // Create new client with current voice and prompt
    const client = new GenAILiveClient({
      voice: selectedVoiceRef.current,
      systemInstruction: systemPromptRef.current,
    });
    clientRef.current = client;

    // Start audio streamer
    const streamer = new GeminiAudioStreamer();
    streamerRef.current = streamer;
    streamer.start();

    // Set up event listeners
    setupClientEventListeners(client, streamer);

    // Connect to Gemini
    await client.connect(token);

    // Start recorder
    const recorder = new GeminiAudioRecorder();
    recorderRef.current = recorder;
    recorder.on('audio', (base64Audio) => {
      if (client.isConnected && !state.isMuted) {
        client.sendRealtimeInput(base64Audio);
      }
    });
    await recorder.start();

    // Start session timer
    startSessionTimer();
  }, [state.isMuted, startSessionTimer, setupClientEventListeners]);

  // Reconnection hook
  const reconnectionHook = useReconnection(performReconnect, {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    jitterFactor: 0.3,
  });

  // Keep ref updated for use in setupClientEventListeners
  useEffect(() => {
    reconnectionHookRef.current = {
      onDisconnected: reconnectionHook.onDisconnected,
    };
  }, [reconnectionHook.onDisconnected]);

  /**
   * Connect to Gemini Live API
   */
  const connect = useCallback(async () => {
    debugLog('connect', 'Starting Gemini connection...');

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
        trackError('GeminiVoiceContext', 'Token fetch failed', error);
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
        dispatch({ type: 'SET_STATUS', payload: 'error' });
        return;
      }

      // Create GenAILiveClient
      const client = new GenAILiveClient({
        voice: selectedVoiceRef.current,
        systemInstruction: systemPromptRef.current,
      });
      clientRef.current = client;

      // Create and start audio streamer
      const streamer = new GeminiAudioStreamer({ initialVolume: state.volume });
      streamerRef.current = streamer;
      streamer.start();

      // Set up event listeners
      setupClientEventListeners(client, streamer);

      // Connect to Gemini
      await client.connect(token);

      // Create and start audio recorder
      let recorder: GeminiAudioRecorder;
      try {
        recorder = new GeminiAudioRecorder();
        recorderRef.current = recorder;
        recorder.on('audio', (base64Audio) => {
          if (client.isConnected && !state.isMuted) {
            client.sendRealtimeInput(base64Audio);
          }
        });
        recorder.on('error', (error) => {
          const errorMsg = parseMicrophoneError(error);
          trackError('GeminiVoiceContext', 'Recorder error', error);
          dispatch({ type: 'SET_ERROR', payload: errorMsg });
        });
        await recorder.start();
      } catch (error) {
        const errorMsg = parseMicrophoneError(error);
        trackError('GeminiVoiceContext', 'Microphone initialization failed', error);
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
        dispatch({ type: 'SET_STATUS', payload: 'error' });
        client.disconnect();
        streamer.cleanup();
        return;
      }

      // Start session timer
      startSessionTimer();

      debugLog('connect', 'Connection established');
    } catch (error) {
      const errorMsg = parseGeminiError(error);
      trackError('GeminiVoiceContext', 'Connection failed', error);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      dispatch({ type: 'SET_STATUS', payload: 'error' });
    }
  }, [state.status, state.volume, state.isMuted, setupClientEventListeners, startSessionTimer]);

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

    // Clear timers
    clearThinkingTimeout();
    clearSessionTimer();

    // Disconnect client
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    // Stop recorder
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    // Stop streamer
    if (streamerRef.current) {
      streamerRef.current.cleanup();
      streamerRef.current = null;
    }

    // Clear refs
    analyserRef.current = null;
    partialTranscriptRef.current = '';
    lastCommittedTranscriptRef.current = '';

    dispatch({ type: 'RESET' });
    onDisconnect?.();
    debugLog('disconnect', 'Disconnected');
  }, [onDisconnect, reconnectionHook, clearThinkingTimeout, clearSessionTimer]);

  // Ref for stable disconnect reference in effects
  const disconnectRef = useRef(disconnect);
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    const newMuted = !state.isMuted;
    dispatch({ type: 'SET_MUTED', payload: newMuted });
    debugLog('mute', newMuted ? 'Muted' : 'Unmuted');
  }, [state.isMuted]);

  /**
   * Send text message (instead of voice)
   */
  const sendText = useCallback((text: string) => {
    if (!clientRef.current?.isConnected) {
      debugLog('sendText', 'Cannot send text: not connected');
      return;
    }

    debugLog('sendText', 'Sending text:', text);

    // Add user message
    const userMessage: VoiceMessage = {
      id: `gemini-text-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

    // TODO: Implement client.sendText method in GenAILiveClient
    // For now, this is a placeholder for future implementation
    debugLog('sendText', 'Text sending not yet implemented in GenAILiveClient');
  }, []);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    dispatch({ type: 'SET_VOLUME', payload: clampedVolume });
    if (streamerRef.current) {
      streamerRef.current.setVolume(clampedVolume);
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

  // Auto-disconnect at session limit - use ref to avoid dependency on disconnect
  useEffect(() => {
    if (state.sessionDuration >= GEMINI_SESSION_TIMERS.DISCONNECT_SECONDS && state.isConnected) {
      debugLog('sessionTimer', 'Session limit reached, auto-disconnecting');
      disconnectRef.current();
    }
  }, [state.sessionDuration, state.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearThinkingTimeout();
      clearSessionTimer();
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (streamerRef.current) {
        streamerRef.current.cleanup();
      }
    };
  }, [clearThinkingTimeout, clearSessionTimer]);

  const value: GeminiVoiceContextValue = {
    ...state,
    selectedVoice,
    setVoice,
    systemPrompt,
    setSystemPrompt,
    connect,
    disconnect,
    toggleMute,
    sendText,
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

  return <GeminiVoiceContext.Provider value={value}>{children}</GeminiVoiceContext.Provider>;
}

export default GeminiVoiceContext;
