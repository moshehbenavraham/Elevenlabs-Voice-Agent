/**
 * Gemini Live API Type Definitions
 *
 * TypeScript interfaces for WebSocket messages, events, and configuration
 * for the Gemini Live bidirectional audio streaming API.
 */

// =============================================================================
// Connection and Session Types
// =============================================================================

/**
 * Configuration for establishing a Gemini Live session.
 */
export interface GeminiSessionConfig {
  /** Gemini model to use (e.g., 'gemini-2.5-flash-native-audio-preview-12-2025') */
  model: string;
  /** Selected voice for audio responses */
  voice: string;
  /** System instructions for the model */
  systemInstruction?: string;
  /** Tools available for function calling */
  tools?: GeminiFunctionDeclaration[];
  /** Whether to enable input audio transcription */
  inputAudioTranscription?: boolean;
  /** Whether to enable output audio transcription */
  outputAudioTranscription?: boolean;
}

/**
 * Constraints for session resumption after disconnect.
 */
export interface LiveConnectConstraints {
  /** Enable session resumption */
  sessionResumption?: {
    /** Session handle for resumption */
    handle?: string;
  };
}

/**
 * Token response from the backend endpoint.
 */
export interface GeminiTokenResponse {
  /** Ephemeral token for WebSocket authentication */
  token: string;
  /** ISO 8601 timestamp when token expires */
  expiresAt: string;
  /** Session resumption constraints */
  constraints?: LiveConnectConstraints;
}

// =============================================================================
// Setup Message Types
// =============================================================================

/**
 * Setup message sent after WebSocket connection established.
 * Configures the session with voice, tools, and transcription settings.
 */
export interface SetupMessage {
  setup: {
    /** Model configuration */
    model: string;
    /** Generation configuration */
    generationConfig?: {
      /** Response modality - always audio for voice */
      responseModalities?: ('AUDIO' | 'TEXT')[];
      /** Voice configuration for audio responses */
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            /** Voice name from the 30 HD voices */
            voiceName: string;
          };
        };
      };
    };
    /** System instruction for the model */
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
    /** Tool configuration */
    tools?: Array<{
      functionDeclarations?: GeminiFunctionDeclaration[];
    }>;
    /** Input transcription settings - empty object enables it */
    inputAudioTranscription?: Record<string, never>;
    /** Output transcription settings - empty object enables it */
    outputAudioTranscription?: Record<string, never>;
  };
}

// =============================================================================
// Client Message Types (Sent to Gemini)
// =============================================================================

/**
 * Real-time audio input message for streaming microphone audio.
 */
export interface RealtimeInputMessage {
  realtimeInput: {
    mediaChunks: Array<{
      /** MIME type for the audio */
      mimeType: 'audio/pcm;rate=16000';
      /** Base64-encoded PCM audio data */
      data: string;
    }>;
  };
}

/**
 * Tool response message for function calling results.
 */
export interface ToolResponseMessage {
  toolResponse: {
    functionResponses: Array<{
      /** Response ID matching the function call */
      response: {
        /** Result of the function execution */
        output: Record<string, unknown>;
      };
      /** ID of the function call being responded to */
      id: string;
    }>;
  };
}

/**
 * Client content message for sending text input.
 */
export interface ClientContentMessage {
  clientContent: {
    turns: Array<{
      role: 'user';
      parts: Array<{ text: string }>;
    }>;
    turnComplete: boolean;
  };
}

/**
 * Union of all client-to-server message types.
 */
export type GeminiClientMessage =
  | SetupMessage
  | RealtimeInputMessage
  | ToolResponseMessage
  | ClientContentMessage;

// =============================================================================
// Server Message Types (Received from Gemini)
// =============================================================================

/**
 * Server content message containing audio or text responses.
 */
export interface ServerContentMessage {
  serverContent: {
    /** Whether the turn is complete */
    turnComplete?: boolean;
    /** Whether generation was interrupted */
    interrupted?: boolean;
    /** Model turn content */
    modelTurn?: {
      parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
    };
    /** Input transcription */
    inputTranscription?: {
      text: string;
    };
    /** Output transcription */
    outputTranscription?: {
      text: string;
    };
  };
}

/**
 * Tool call message when the model wants to call a function.
 */
export interface ToolCallMessage {
  toolCall: {
    functionCalls: Array<{
      /** Function name to call */
      name: string;
      /** Function arguments as JSON */
      args: Record<string, unknown>;
      /** Unique ID for this function call */
      id: string;
    }>;
  };
}

/**
 * Setup complete message indicating session is ready.
 */
export interface SetupCompleteMessage {
  setupComplete: Record<string, never>;
}

/**
 * GoAway message indicating the server is closing the connection.
 */
export interface GoAwayMessage {
  goAway: {
    /** Reason code for disconnection */
    reason?: string;
    /** Human-readable message */
    message?: string;
  };
}

/**
 * Union of all server-to-client message types.
 */
export type GeminiServerMessage =
  | ServerContentMessage
  | ToolCallMessage
  | SetupCompleteMessage
  | GoAwayMessage;

// =============================================================================
// Tool/Function Types
// =============================================================================

/**
 * Gemini function declaration format for tool definitions.
 * Follows Google's FunctionDeclaration schema.
 */
export interface GeminiFunctionDeclaration {
  /** Function name (must match ALLOWED_FUNCTIONS) */
  name: string;
  /** Human-readable description of what the function does */
  description: string;
  /** Parameter schema using JSON Schema subset */
  parameters: {
    type: 'object';
    properties: Record<string, GeminiParameterSchema>;
    required?: string[];
  };
}

/**
 * Parameter schema for Gemini function parameters.
 */
export interface GeminiParameterSchema {
  /** Data type of the parameter */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Description of the parameter */
  description: string;
  /** Allowed values for enum parameters */
  enum?: string[];
  /** Items schema for array parameters */
  items?: GeminiParameterSchema;
}

// =============================================================================
// Event Types (Emitted by GenAILiveClient)
// =============================================================================

/**
 * Audio event data containing base64 PCM audio from the server.
 */
export interface AudioEventData {
  /** Base64-encoded PCM16 audio at 24kHz */
  audio: string;
  /** MIME type of the audio */
  mimeType: string;
}

/**
 * Content event data containing text from the server.
 */
export interface ContentEventData {
  /** Text content from the model */
  text: string;
}

/**
 * Tool call event data for function calling.
 */
export interface ToolCallEventData {
  /** Function name to call */
  name: string;
  /** Function arguments */
  args: Record<string, unknown>;
  /** Unique call ID for response matching */
  id: string;
}

/**
 * Transcription event data for speech-to-text.
 */
export interface TranscriptionEventData {
  /** Transcribed text */
  text: string;
  /** Whether this is user input or model output transcription */
  type: 'input' | 'output';
}

/**
 * GoAway event data for server-initiated disconnection.
 */
export interface GoAwayEventData {
  /** Reason code */
  reason?: string;
  /** Human-readable message */
  message?: string;
}

/**
 * Error event data for WebSocket or protocol errors.
 */
export interface ErrorEventData {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Original error if available */
  error?: Error;
}

/**
 * Close event data for WebSocket close.
 */
export interface CloseEventData {
  /** WebSocket close code */
  code: number;
  /** Close reason */
  reason: string;
  /** Whether close was clean */
  wasClean: boolean;
}

/**
 * Event map for GenAILiveClient typed event emitter.
 * Keys are event names, values are callback signatures.
 */
export interface GenAILiveClientEvents {
  /** Emitted when audio data is received from the server */
  audio: (data: AudioEventData) => void;
  /** Emitted when text content is received from the server */
  content: (data: ContentEventData) => void;
  /** Emitted when the model wants to call a function */
  toolcall: (data: ToolCallEventData) => void;
  /** Emitted when transcription is available */
  transcription: (data: TranscriptionEventData) => void;
  /** Emitted when the model is interrupted by user input */
  interrupted: () => void;
  /** Emitted when server requests graceful disconnection */
  goAway: (data: GoAwayEventData) => void;
  /** Emitted when setup is complete and session is ready */
  setupComplete: () => void;
  /** Emitted when the model's turn is complete */
  turnComplete: () => void;
  /** Emitted on WebSocket or protocol errors */
  error: (data: ErrorEventData) => void;
  /** Emitted when WebSocket connection closes */
  close: (data: CloseEventData) => void;
  /** Emitted when WebSocket connection opens */
  open: () => void;
}

// =============================================================================
// Connection State Types
// =============================================================================

/**
 * Connection states for the GenAILiveClient.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Options for GenAILiveClient constructor.
 */
export interface GenAILiveClientOptions {
  /** Gemini model to use */
  model?: string;
  /** Selected voice for responses */
  voice?: string;
  /** System instruction for the model */
  systemInstruction?: string;
  /** Whether to enable input audio transcription */
  inputAudioTranscription?: boolean;
  /** Whether to enable output audio transcription */
  outputAudioTranscription?: boolean;
  /** Tools for function calling */
  tools?: GeminiFunctionDeclaration[];
}
