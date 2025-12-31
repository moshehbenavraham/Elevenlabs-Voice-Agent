/**
 * Vapi Voice Provider Type Definitions
 *
 * Type definitions for the Vapi voice integration including
 * message types, call status, and voice state management.
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * Types of messages that can be received from Vapi
 */
export enum VapiMessageType {
  TRANSCRIPT = 'transcript',
  FUNCTION_CALL = 'function-call',
  FUNCTION_CALL_RESULT = 'function-call-result',
  ADD_MESSAGE = 'add-message',
}

/**
 * Roles for message participants
 */
export enum VapiMessageRole {
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
}

/**
 * Transcript types for partial vs final transcription
 */
export enum VapiTranscriptType {
  PARTIAL = 'partial',
  FINAL = 'final',
}

/**
 * Call status states for the Vapi connection
 */
export enum VapiCallStatus {
  INACTIVE = 'inactive',
  LOADING = 'loading',
  ACTIVE = 'active',
}

// ============================================================
// BASE INTERFACES
// ============================================================

/**
 * Base message interface - all Vapi messages extend this
 */
export interface VapiBaseMessage {
  type: VapiMessageType;
}

// ============================================================
// MESSAGE INTERFACES
// ============================================================

/**
 * Transcript message for user/assistant speech
 * Includes both partial (in-progress) and final transcripts
 */
export interface VapiTranscriptMessage extends VapiBaseMessage {
  type: VapiMessageType.TRANSCRIPT;
  role: VapiMessageRole;
  transcriptType: VapiTranscriptType;
  transcript: string;
}

/**
 * Function call message when the assistant invokes a tool
 */
export interface VapiFunctionCallMessage extends VapiBaseMessage {
  type: VapiMessageType.FUNCTION_CALL;
  functionCall: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Function call result message with tool execution results
 */
export interface VapiFunctionCallResultMessage extends VapiBaseMessage {
  type: VapiMessageType.FUNCTION_CALL_RESULT;
  functionCallResult: {
    forwardToClientEnabled?: boolean;
    result: unknown;
    [key: string]: unknown;
  };
}

/**
 * Union type for all possible Vapi messages
 */
export type VapiMessage =
  | VapiTranscriptMessage
  | VapiFunctionCallMessage
  | VapiFunctionCallResultMessage;

// ============================================================
// STATE INTERFACES
// ============================================================

/**
 * Voice state for the Vapi provider
 * Used by useVapiVoice hook and VapiProvider component
 */
export interface VapiVoiceState {
  /** Current call connection status */
  callStatus: VapiCallStatus;
  /** Whether the assistant is currently speaking */
  isSpeechActive: boolean;
  /** Array of finalized messages (transcripts, function calls) */
  messages: VapiMessage[];
  /** Current partial transcript being spoken (typing indicator) */
  activeTranscript: VapiTranscriptMessage | null;
  /** Audio level from 0-1 for visualization */
  audioLevel: number;
  /** Error message if something went wrong */
  error: string | null;
}

/**
 * Configuration options for starting a Vapi call
 * Supports either a pre-created assistant ID or inline configuration
 */
export interface VapiStartConfig {
  /** Pre-created assistant ID from Vapi dashboard */
  assistantId?: string;
  /** Assistant name for inline configuration */
  name?: string;
  /** First message the assistant speaks */
  firstMessage?: string;
  /** System prompt/instructions for the assistant */
  systemPrompt?: string;
  /** Voice ID to use */
  voice?: {
    provider: string;
    voiceId: string;
  };
  /** LLM model configuration */
  model?: {
    provider: string;
    model: string;
  };
}

/**
 * Return type for the useVapiVoice hook
 */
export interface VapiVoiceHookReturn extends VapiVoiceState {
  /** Start a voice call with optional config */
  start: (config?: VapiStartConfig | string) => Promise<void>;
  /** Stop the current call */
  stop: () => void;
  /** Toggle call on/off */
  toggleCall: (config?: VapiStartConfig | string) => void;
}
