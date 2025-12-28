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
export type ProviderType = 'elevenlabs' | 'xai' | 'openai';

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
 * Default provider configurations
 */
export const PROVIDERS: Record<ProviderType, VoiceProvider> = {
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'High-quality conversational AI voice',
    isAvailable: true,
    requiresApiKey: true,
    icon: 'AudioLines',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    description: 'Grok-powered voice conversations',
    isAvailable: false,
    requiresApiKey: true,
    icon: 'Bot',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 voice interactions',
    isAvailable: false,
    requiresApiKey: true,
    icon: 'Sparkles',
  },
};

/**
 * Default provider type
 */
export const DEFAULT_PROVIDER: ProviderType = 'elevenlabs';
