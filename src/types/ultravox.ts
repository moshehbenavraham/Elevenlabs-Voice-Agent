/**
 * Ultravox API Type Definitions
 *
 * Types for the Ultravox voice provider API integration.
 * Ultravox uses a call-based model where the backend creates a call
 * and returns a joinUrl for the frontend SDK to connect.
 */

/**
 * Request body for creating an Ultravox call
 * Sent to POST /api/ultravox/call
 */
export interface UltravoxCallRequest {
  /** System prompt for the voice agent */
  systemPrompt?: string;
  /** Voice selection (optional - uses Ultravox default if not specified) */
  voice?: string;
  /** Model selection (optional - uses default model if not specified) */
  model?: string;
}

/**
 * Successful response from Ultravox call creation
 * Returned by POST /api/ultravox/call on success
 */
export interface UltravoxCallResponse {
  /** WebSocket URL for the frontend SDK to connect to */
  joinUrl: string;
  /** Unique identifier for this call (optional, for tracking) */
  callId?: string;
}

/**
 * Error response from Ultravox API
 * Matches the error format used by other providers (OpenAI, xAI)
 */
export interface UltravoxErrorResponse {
  /** Error type/category */
  error: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Health check response from GET /api/ultravox/health
 */
export interface UltravoxHealthResponse {
  /** Whether the Ultravox API key is configured */
  configured: boolean;
  /** Provider identifier */
  provider: 'ultravox';
}

/**
 * Available Ultravox voices (based on documentation)
 * This may be expanded as more voices become available
 */
export type UltravoxVoice = 'Mark' | string;

/**
 * Ultravox connection status for frontend state management
 */
export type UltravoxConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

/**
 * Frontend state for Ultravox voice provider
 */
export interface UltravoxVoiceState {
  /** Current connection status */
  status: UltravoxConnectionStatus;
  /** Whether currently connected to Ultravox */
  isConnected: boolean;
  /** Whether connection is in progress */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether the agent is currently speaking */
  isSpeaking: boolean;
  /** Whether the agent is currently listening */
  isListening: boolean;
  /** Current joinUrl (if connected) */
  joinUrl: string | null;
  /** Current callId (if connected) */
  callId: string | null;
}
