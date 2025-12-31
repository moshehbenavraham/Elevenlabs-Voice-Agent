/**
 * Voice Provider Type Definitions
 *
 * These types abstract voice provider functionality for type-safe
 * multi-provider support. Each provider implements these interfaces
 * to enable consistent switching between voice services.
 */

/**
 * Union type of all supported voice providers
 */
export type ProviderType = 'elevenlabs' | 'elevenlabs-sdk' | 'xai' | 'openai' | 'ultravox' | 'vapi';

/**
 * Message role type for conversation messages
 */
export type MessageRole = 'user' | 'assistant' | 'function';

/**
 * Function call status
 */
export type FunctionCallStatus = 'pending' | 'executing' | 'completed' | 'error';

/**
 * Represents a function call made by the voice agent
 */
export interface FunctionCall {
  /** Unique call ID from the provider */
  callId: string;
  /** Name of the function being called */
  name: string;
  /** Arguments passed to the function (JSON object) */
  arguments: Record<string, unknown>;
  /** Result returned from function execution */
  result?: unknown;
  /** Error message if function failed */
  error?: string;
  /** Current execution status */
  status: FunctionCallStatus;
}

/**
 * Individual message in a voice conversation
 */
export interface VoiceMessage {
  /** Unique identifier for the message */
  id: string;
  /** Who sent the message */
  role: MessageRole;
  /** Message text content */
  content: string;
  /** Timestamp when message was created */
  timestamp: number;
  /** Function call data (when role is 'function') */
  functionCall?: FunctionCall;
}

/**
 * Connection lifecycle states for voice providers
 */
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';

/**
 * Voice provider state interface
 * Tracks the current state of a voice provider connection
 */
export interface VoiceProviderState {
  status: ConnectionStatus;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isSpeaking: boolean;
  isListening: boolean;
}

/**
 * Provider metadata and configuration
 */
export interface VoiceProvider {
  /** Unique provider identifier */
  id: ProviderType;

  /** Display name for UI */
  name: string;

  /** Short description of the provider */
  description: string;

  /** Whether this provider is currently available/enabled */
  isAvailable: boolean;

  /** Whether this provider requires API key configuration */
  requiresApiKey: boolean;

  /** Icon name (matches lucide-react icon names) */
  icon?: string;
}

/**
 * Provider configuration for the tab system
 */
export interface ProviderConfig {
  provider: VoiceProvider;
  isDisabled: boolean;
  disabledReason?: string;
}

/**
 * Check if ElevenLabs Widget is enabled via environment variable
 */
const isElevenLabsWidgetEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_ELEVENLABS_ENABLED;
  return envValue === 'true' || envValue === true;
};

/**
 * Check if ElevenLabs SDK is enabled via environment variable
 */
const isElevenLabsSDKEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_ELEVENLABS_SDK_ENABLED;
  return envValue === 'true' || envValue === true;
};

/**
 * Check if xAI provider is enabled via environment variable
 */
const isXAIEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_XAI_ENABLED;
  return envValue === 'true' || envValue === true;
};

/**
 * Check if OpenAI provider is enabled via environment variable
 */
const isOpenAIEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_OPENAI_ENABLED;
  return envValue === 'true' || envValue === true;
};

/**
 * Check if Ultravox provider is enabled via environment variable
 */
const isUltravoxEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_ULTRAVOX_ENABLED;
  return envValue === 'true' || envValue === true;
};

/**
 * Check if Vapi provider is enabled via environment variable
 */
const isVapiEnabled = (): boolean => {
  const envValue = import.meta.env.VITE_VAPI_ENABLED;
  return envValue === 'true' || envValue === true;
};

/**
 * Default provider configurations
 */
export const PROVIDERS: Record<ProviderType, VoiceProvider> = {
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs Widget',
    description: 'Pre-built voice widget from ElevenLabs',
    isAvailable: isElevenLabsWidgetEnabled(),
    requiresApiKey: true,
    icon: 'AudioLines',
  },
  'elevenlabs-sdk': {
    id: 'elevenlabs-sdk',
    name: 'ElevenLabs SDK',
    description: 'Custom voice UI with ElevenLabs React SDK',
    isAvailable: isElevenLabsSDKEnabled(),
    requiresApiKey: true,
    icon: 'Mic',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    description: 'Grok-powered voice conversations',
    isAvailable: isXAIEnabled(),
    requiresApiKey: true,
    icon: 'Bot',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o realtime voice conversations',
    isAvailable: isOpenAIEnabled(),
    requiresApiKey: true,
    icon: 'Sparkles',
  },
  ultravox: {
    id: 'ultravox',
    name: 'Ultravox',
    description: 'Ultravox AI voice conversations',
    isAvailable: isUltravoxEnabled(),
    requiresApiKey: true,
    icon: 'AudioWaveform',
  },
  vapi: {
    id: 'vapi',
    name: 'Vapi',
    description: 'Vapi voice agent conversations',
    isAvailable: isVapiEnabled(),
    requiresApiKey: false,
    icon: 'PhoneCall',
  },
};

/**
 * Default provider type
 */
export const DEFAULT_PROVIDER: ProviderType = 'elevenlabs';
