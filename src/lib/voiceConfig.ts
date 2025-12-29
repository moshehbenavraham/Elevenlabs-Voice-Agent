/**
 * Voice configuration for OpenAI and xAI providers
 */

// Voice option type
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

// Provider type for voice selection
export type VoiceProvider = 'openai' | 'xai';

// OpenAI voice options (from OpenAI Realtime API documentation)
export const OPENAI_VOICES: VoiceOption[] = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'ash', name: 'Ash', description: 'Warm and engaging' },
  { id: 'ballad', name: 'Ballad', description: 'Expressive and melodic' },
  { id: 'coral', name: 'Coral', description: 'Clear and professional' },
  { id: 'echo', name: 'Echo', description: 'Soft and reflective' },
  { id: 'sage', name: 'Sage', description: 'Calm and thoughtful' },
  { id: 'shimmer', name: 'Shimmer', description: 'Bright and energetic' },
  { id: 'verse', name: 'Verse', description: 'Articulate and precise' },
];

// xAI voice options (official xAI Grok voices)
// See: https://docs.x.ai/docs/guides/voice/agent
export const XAI_VOICES: VoiceOption[] = [
  { id: 'Ara', name: 'Ara', description: 'Expressive and natural' },
  { id: 'Eve', name: 'Eve', description: 'Professional and clear' },
  { id: 'Leo', name: 'Leo', description: 'Conversational' },
  { id: 'Rex', name: 'Rex', description: 'Dynamic character voice' },
  { id: 'Sal', name: 'Sal', description: 'Friendly character voice' },
];

// Default voices per provider
export const DEFAULT_OPENAI_VOICE = 'alloy';
export const DEFAULT_XAI_VOICE = 'Ara';

// localStorage keys
const OPENAI_VOICE_KEY = 'openai-voice';
const XAI_VOICE_KEY = 'xai-voice';

/**
 * Get the localStorage key for a provider
 */
function getStorageKey(provider: VoiceProvider): string {
  return provider === 'openai' ? OPENAI_VOICE_KEY : XAI_VOICE_KEY;
}

/**
 * Get the default voice for a provider
 */
export function getDefaultVoice(provider: VoiceProvider): string {
  return provider === 'openai' ? DEFAULT_OPENAI_VOICE : DEFAULT_XAI_VOICE;
}

/**
 * Get the voice options for a provider
 */
export function getVoiceOptions(provider: VoiceProvider): VoiceOption[] {
  return provider === 'openai' ? OPENAI_VOICES : XAI_VOICES;
}

/**
 * Get saved voice from localStorage, with fallback to default
 */
export function getSavedVoice(provider: VoiceProvider): string {
  if (typeof window === 'undefined') {
    return getDefaultVoice(provider);
  }

  try {
    const key = getStorageKey(provider);
    const saved = localStorage.getItem(key);

    if (saved) {
      // Validate that the saved voice is a valid option
      const validVoices = getVoiceOptions(provider);
      if (validVoices.some((v) => v.id === saved)) {
        return saved;
      }
    }
  } catch {
    // localStorage not available or error reading
  }

  return getDefaultVoice(provider);
}

/**
 * Save voice selection to localStorage
 */
export function saveVoice(provider: VoiceProvider, voice: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getStorageKey(provider);
    localStorage.setItem(key, voice);
  } catch {
    // localStorage not available or error writing
  }
}

/**
 * Check if a voice ID is valid for a provider
 */
export function isValidVoice(provider: VoiceProvider, voiceId: string): boolean {
  const validVoices = getVoiceOptions(provider);
  return validVoices.some((v) => v.id === voiceId);
}
