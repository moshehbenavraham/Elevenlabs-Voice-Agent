/**
 * Gemini Voice Provider Type Definitions
 *
 * Type definitions for the GeminiVoiceContext and useGeminiVoice hook.
 * These types manage the React state layer for Gemini Live voice conversations,
 * bridging the GenAILiveClient WebSocket infrastructure with UI components.
 *
 * The context follows the established provider pattern used by all existing
 * voice providers (OpenAI, xAI, Ultravox, Vapi, Retell).
 *
 * @see src/lib/gemini/genai-live-client.ts - WebSocket client
 * @see src/contexts/GeminiVoiceContext.tsx - Context provider
 */

import type { VoiceMessage, FunctionCall } from './voice-provider';
import type { ReconnectionState } from '@/hooks/useReconnection';

// =============================================================================
// CONNECTION STATUS TYPES
// =============================================================================

/**
 * Connection status states for the Gemini voice provider.
 *
 * States beyond the base ConnectionStatus include:
 * - `listening` - User is speaking (VAD active)
 * - `thinking` - 300ms after user speech ends, no audio response yet
 * - `speaking` - Receiving audio from Gemini
 */
export type GeminiConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'disconnecting'
  | 'error';

// =============================================================================
// STATE INTERFACES
// =============================================================================

/**
 * Voice state for the Gemini provider.
 * Used by GeminiVoiceContext and useGeminiVoice hook.
 */
export interface GeminiVoiceState {
  /** Current connection status */
  status: GeminiConnectionStatus;
  /** Whether WebSocket is connected and session is ready */
  isConnected: boolean;
  /** Whether connection is in progress */
  isLoading: boolean;
  /** Whether Gemini is currently speaking (audio playing) */
  isSpeaking: boolean;
  /** Whether the user is currently speaking (VAD active) */
  isListening: boolean;
  /** Whether Gemini is thinking (processing user input) */
  isThinking: boolean;
  /** Whether microphone is muted */
  isMuted: boolean;
  /** Array of conversation messages */
  messages: VoiceMessage[];
  /** Current partial transcript being spoken (typing indicator) */
  activeTranscript: string;
  /** Pending function call data */
  pendingFunctionCall: FunctionCall | null;
  /** Error message if something went wrong */
  error: string | null;
  /** Session duration in seconds since connection */
  sessionDuration: number;
  /** Session time warning level: null, 'warning' (12min), 'urgent' (14min) */
  sessionWarning: 'warning' | 'urgent' | null;
  /** Volume level (0-1) */
  volume: number;
}

/**
 * Context value interface extending state with control functions.
 * This is the full API exposed by useGeminiVoice hook.
 */
export interface GeminiVoiceContextValue extends GeminiVoiceState {
  /** Selected voice for Gemini responses */
  selectedVoice: string;
  /** Update the selected voice */
  setVoice: (voice: string) => void;
  /** System prompt for the conversation */
  systemPrompt: string;
  /** Update the system prompt */
  setSystemPrompt: (prompt: string) => void;
  /** Connect to Gemini Live API */
  connect: () => Promise<void>;
  /** Disconnect from Gemini Live API */
  disconnect: () => Promise<void>;
  /** Toggle microphone mute state */
  toggleMute: () => void;
  /** Send text message instead of voice */
  sendText: (text: string) => void;
  /** Set volume level (0-1) */
  setVolume: (volume: number) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Get AnalyserNode for audio visualization */
  getAnalyserNode: () => AnalyserNode | null;
  /** Reconnection state from useReconnection hook */
  reconnection: ReconnectionState;
  /** Manually trigger reconnection */
  manualReconnect: () => void;
}

// =============================================================================
// REDUCER ACTION TYPES
// =============================================================================

/**
 * Union type for all reducer actions in GeminiVoiceContext.
 * Following the pattern from XAIVoiceContext.
 */
export type GeminiVoiceAction =
  | { type: 'SET_STATUS'; payload: GeminiConnectionStatus }
  | { type: 'SET_SPEAKING'; payload: boolean }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_THINKING'; payload: boolean }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'ADD_MESSAGE'; payload: VoiceMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: string }
  | { type: 'SET_ACTIVE_TRANSCRIPT'; payload: string }
  | { type: 'SET_PENDING_FUNCTION_CALL'; payload: FunctionCall | null }
  | { type: 'SET_SESSION_DURATION'; payload: number }
  | { type: 'SET_SESSION_WARNING'; payload: 'warning' | 'urgent' | null }
  | { type: 'RESET' };

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

/**
 * Return type for the useGeminiVoice hook.
 * Alias for GeminiVoiceContextValue for pattern consistency with other providers.
 */
export type GeminiVoiceHookReturn = GeminiVoiceContextValue;

// =============================================================================
// SESSION TIMER CONSTANTS
// =============================================================================

/**
 * Session timer threshold constants (in seconds).
 * Gemini Live has a 15-minute session limit.
 */
export const GEMINI_SESSION_TIMERS = {
  /** Warning threshold at 12 minutes (720 seconds) */
  WARNING_SECONDS: 12 * 60,
  /** Urgent warning threshold at 14 minutes (840 seconds) */
  URGENT_SECONDS: 14 * 60,
  /** Auto-disconnect threshold at 15 minutes (900 seconds) */
  DISCONNECT_SECONDS: 15 * 60,
  /** Thinking state delay in milliseconds (300ms after VAD ends) */
  THINKING_DELAY_MS: 300,
} as const;

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Initial state for the Gemini voice reducer.
 * Exported for use in GeminiVoiceContext and tests.
 */
export const GEMINI_INITIAL_STATE: GeminiVoiceState = {
  status: 'idle',
  isConnected: false,
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  isThinking: false,
  isMuted: false,
  messages: [],
  activeTranscript: '',
  pendingFunctionCall: null,
  error: null,
  sessionDuration: 0,
  sessionWarning: null,
  volume: 0.7,
};
