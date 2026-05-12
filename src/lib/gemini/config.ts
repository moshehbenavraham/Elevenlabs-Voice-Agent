/**
 * Gemini Live Voice Configuration
 *
 * Defines all 30 HD voices available in the Gemini Live API
 * and model configuration options.
 *
 * Voice list: https://ai.google.dev/gemini-api/docs/speech-generation
 */

// =============================================================================
// Voice Definitions
// =============================================================================

/**
 * Voice metadata for UI display and selection.
 */
export interface GeminiVoice {
  /** Voice identifier used in API calls */
  id: string;
  /** Display name for UI */
  name: string;
  /** Voice gender/style */
  style: 'neutral' | 'warm' | 'bright' | 'calm' | 'energetic';
}

/**
 * All 30 Gemini HD voices available for Live API.
 * Sorted alphabetically by name for consistent UI display.
 */
export const GEMINI_VOICES: GeminiVoice[] = [
  { id: 'Achernar', name: 'Achernar', style: 'calm' },
  { id: 'Achird', name: 'Achird', style: 'warm' },
  { id: 'Algenib', name: 'Algenib', style: 'neutral' },
  { id: 'Algieba', name: 'Algieba', style: 'bright' },
  { id: 'Alnilam', name: 'Alnilam', style: 'energetic' },
  { id: 'Aoede', name: 'Aoede', style: 'warm' },
  { id: 'Autonoe', name: 'Autonoe', style: 'calm' },
  { id: 'Callirrhoe', name: 'Callirrhoe', style: 'bright' },
  { id: 'Charon', name: 'Charon', style: 'neutral' },
  { id: 'Despina', name: 'Despina', style: 'warm' },
  { id: 'Enceladus', name: 'Enceladus', style: 'energetic' },
  { id: 'Erinome', name: 'Erinome', style: 'calm' },
  { id: 'Fenrir', name: 'Fenrir', style: 'neutral' },
  { id: 'Gacrux', name: 'Gacrux', style: 'bright' },
  { id: 'Iapetus', name: 'Iapetus', style: 'warm' },
  { id: 'Kore', name: 'Kore', style: 'energetic' },
  { id: 'Laomedeia', name: 'Laomedeia', style: 'calm' },
  { id: 'Leda', name: 'Leda', style: 'bright' },
  { id: 'Orus', name: 'Orus', style: 'neutral' },
  { id: 'Puck', name: 'Puck', style: 'warm' },
  { id: 'Pulcherrima', name: 'Pulcherrima', style: 'bright' },
  { id: 'Rasalgethi', name: 'Rasalgethi', style: 'energetic' },
  { id: 'Sadachbia', name: 'Sadachbia', style: 'calm' },
  { id: 'Sadaltager', name: 'Sadaltager', style: 'neutral' },
  { id: 'Schedar', name: 'Schedar', style: 'warm' },
  { id: 'Sulafat', name: 'Sulafat', style: 'bright' },
  { id: 'Umbriel', name: 'Umbriel', style: 'calm' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', style: 'energetic' },
  { id: 'Zephyr', name: 'Zephyr', style: 'neutral' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', style: 'warm' },
];

/**
 * Default voice when none is specified.
 */
export const DEFAULT_GEMINI_VOICE = 'Zephyr';

/**
 * Get a voice by its ID.
 * @param id - Voice identifier
 * @returns Voice metadata or undefined if not found
 */
export function getVoiceById(id: string): GeminiVoice | undefined {
  return GEMINI_VOICES.find((voice) => voice.id === id);
}

/**
 * Validate that a voice ID is valid.
 * @param id - Voice identifier to validate
 * @returns True if the voice ID is valid
 */
export function isValidVoiceId(id: string): boolean {
  return GEMINI_VOICES.some((voice) => voice.id === id);
}

/**
 * Get all voice IDs as an array.
 * @returns Array of voice ID strings
 */
export function getVoiceIds(): string[] {
  return GEMINI_VOICES.map((voice) => voice.id);
}

// =============================================================================
// Model Configuration
// =============================================================================

/**
 * Available Gemini models for Live API.
 */
export interface GeminiModel {
  /** Model identifier for API calls */
  id: string;
  /** Display name for UI */
  name: string;
  /** Whether this is the recommended model */
  recommended: boolean;
}

/**
 * Supported Gemini Live API models.
 */
export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'gemini-2.5-flash-native-audio-preview-12-2025',
    name: 'Gemini 2.5 Flash (Native Audio Preview)',
    recommended: true,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    recommended: false,
  },
];

/**
 * Default model when none is specified.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

/**
 * Get a model by its ID.
 * @param id - Model identifier
 * @returns Model metadata or undefined if not found
 */
export function getModelById(id: string): GeminiModel | undefined {
  return GEMINI_MODELS.find((model) => model.id === id);
}

/**
 * Validate that a model ID is valid.
 * @param id - Model identifier to validate
 * @returns True if the model ID is valid
 */
export function isValidModelId(id: string): boolean {
  return GEMINI_MODELS.some((model) => model.id === id);
}

// =============================================================================
// WebSocket Configuration
// =============================================================================

/**
 * Gemini Live API WebSocket endpoint base URL.
 * Token is appended as query parameter.
 */
export const GEMINI_LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
export const GEMINI_LIVE_EPHEMERAL_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

function isEphemeralAuthToken(token: string): boolean {
  return token.startsWith('auth_tokens/');
}

/**
 * Build the full WebSocket URL with token authentication.
 * @param token - Ephemeral authentication token
 * @returns Full WebSocket URL with query parameters
 */
export function buildWebSocketUrl(token: string): string {
  const usesEphemeralAuth = isEphemeralAuthToken(token);
  const baseUrl = usesEphemeralAuth ? GEMINI_LIVE_EPHEMERAL_WS_URL : GEMINI_LIVE_WS_URL;
  const queryParam = usesEphemeralAuth ? 'access_token' : 'key';

  return `${baseUrl}?${queryParam}=${encodeURIComponent(token)}`;
}

// =============================================================================
// Audio Configuration
// =============================================================================

/**
 * Audio format constants for Gemini Live API.
 * Input: 16kHz mono PCM16
 * Output: 24kHz mono PCM16
 */
export const GEMINI_AUDIO_CONFIG = {
  /** Input sample rate in Hz */
  inputSampleRate: 16000,
  /** Output sample rate in Hz */
  outputSampleRate: 24000,
  /** Bit depth */
  bitDepth: 16,
  /** Number of channels */
  channels: 1,
  /** Input MIME type for WebSocket messages */
  inputMimeType: 'audio/pcm;rate=16000' as const,
  /** Output MIME type received from server */
  outputMimeType: 'audio/pcm;rate=24000' as const,
} as const;

// =============================================================================
// Default Configuration
// =============================================================================

/**
 * Default system instruction for voice conversations.
 */
export const DEFAULT_SYSTEM_INSTRUCTION =
  'You are a helpful voice assistant. Keep responses conversational and concise since they will be spoken aloud.';

/**
 * Get the default session configuration from environment variables.
 * Falls back to constants if env vars are not set.
 */
export function getDefaultConfig(): {
  model: string;
  voice: string;
  systemInstruction: string;
} {
  // Check for Vite environment variables (browser context)
  const envModel = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_MODEL;
  const envVoice = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_VOICE;
  const envInstructions =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_INSTRUCTIONS;

  return {
    model: (envModel as string) || DEFAULT_GEMINI_MODEL,
    voice: (envVoice as string) || DEFAULT_GEMINI_VOICE,
    systemInstruction: (envInstructions as string) || DEFAULT_SYSTEM_INSTRUCTION,
  };
}
