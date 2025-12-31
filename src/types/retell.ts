/**
 * Retell Voice Provider Type Definitions
 *
 * Type definitions for the Retell voice integration including
 * call status, message types, transcript handling, and voice state management.
 *
 * The Retell SDK uses LiveKit under the hood for WebRTC audio streaming.
 * Key limitation: SDK only provides last 5 sentences, so we accumulate locally.
 *
 * @see https://docs.retellai.com/api-references/web-client-sdk
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * Call status states for the Retell connection.
 * Maps to unified states used across all voice providers.
 */
export enum RetellCallStatus {
  /** No active call, ready to start */
  IDLE = 'idle',
  /** Token fetched, SDK connecting */
  CONNECTING = 'connecting',
  /** call_started event received, call active */
  CONNECTED = 'connected',
  /** Error event received or token fetch failed */
  ERROR = 'error',
}

/**
 * Roles for message participants in transcripts
 */
export enum RetellMessageRole {
  USER = 'user',
  AGENT = 'agent',
}

/**
 * Transcript types indicating completion status.
 * Retell provides incremental updates; we track both partial and final.
 */
export enum RetellTranscriptType {
  /** Transcript still being spoken/processed */
  PARTIAL = 'partial',
  /** Transcript complete and finalized */
  FINAL = 'final',
}

// ============================================================
// SDK EVENT PAYLOAD INTERFACES
// ============================================================

/**
 * Single transcript entry from Retell SDK update event.
 * SDK provides array of last 5 transcript objects.
 */
export interface RetellTranscript {
  /** Role of the speaker: user or agent */
  role: RetellMessageRole;
  /** Transcript text content */
  content: string;
}

/**
 * Payload received from Retell SDK 'update' event.
 * Contains array of last 5 transcripts - we accumulate locally to preserve history.
 */
export interface RetellUpdatePayload {
  /** Array of last 5 transcript entries (SDK limitation) */
  transcript: RetellTranscript[];
}

// ============================================================
// MESSAGE INTERFACES
// ============================================================

/**
 * Normalized message structure for UI rendering.
 * Accumulated locally since SDK only provides last 5 sentences.
 */
export interface RetellMessage {
  /** Unique identifier for React key and deduplication */
  id: string;
  /** Role of the speaker */
  role: RetellMessageRole;
  /** Message text content */
  content: string;
  /** Timestamp when message was captured */
  timestamp: number;
  /** Whether this is a partial (in-progress) or final transcript */
  transcriptType: RetellTranscriptType;
}

// ============================================================
// STATE INTERFACES
// ============================================================

/**
 * Voice state for the Retell provider.
 * Used by useRetellVoice hook and RetellProvider component.
 */
export interface RetellVoiceState {
  /** Current call connection status */
  callStatus: RetellCallStatus;
  /** Whether the agent is currently speaking */
  isAgentSpeaking: boolean;
  /** Array of accumulated messages (transcripts) */
  messages: RetellMessage[];
  /** Current partial transcript being spoken (typing indicator) */
  activeTranscript: RetellMessage | null;
  /** Error message if something went wrong */
  error: string | null;
  /** Call ID returned from backend (for reference/debugging) */
  callId: string | null;
}

/**
 * Return type for the useRetellVoice hook.
 * Extends state with control functions.
 */
export interface RetellVoiceHookReturn extends RetellVoiceState {
  /** Start a voice call - fetches token from backend and connects */
  startCall: () => Promise<void>;
  /** Stop the current call and clean up */
  stopCall: () => void;
  /** Toggle call on/off */
  toggleCall: () => void;
}

// ============================================================
// CONFIGURATION INTERFACES
// ============================================================

/**
 * Configuration options for Retell backend call creation.
 * Passed to /api/retell/create-web-call endpoint.
 */
export interface RetellCallConfig {
  /** Retell agent ID from dashboard (required) */
  agentId: string;
  /** Optional metadata for the call */
  metadata?: Record<string, unknown>;
  /** Optional dynamic variables for the Retell LLM */
  retellLlmDynamicVariables?: Record<string, unknown>;
}

/**
 * Response from backend /api/retell/create-web-call endpoint.
 */
export interface RetellCreateCallResponse {
  /** Access token for SDK connection */
  access_token: string;
  /** Optional call ID for reference */
  call_id?: string;
}

/**
 * Error response from backend endpoints.
 */
export interface RetellApiError {
  /** Error type/category */
  error: string;
  /** Human-readable error message */
  message: string;
}
