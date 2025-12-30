/**
 * Settings storage utilities for voice agent configuration
 * Handles localStorage persistence with schema versioning
 */

// Schema version for future migrations
const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'voice-agent-settings';

// Default system prompts
export const DEFAULT_OPENAI_PROMPT =
  'You are a helpful voice assistant. Keep responses conversational and concise.';
export const DEFAULT_XAI_PROMPT =
  'You are a helpful voice assistant. Keep responses conversational and concise.';

// Settings types
export interface ProviderSettings {
  voice: string;
  systemPrompt: string;
}

export interface VoiceAgentSettings {
  version: number;
  openai: ProviderSettings;
  xai: ProviderSettings;
  elevenlabs: {
    // ElevenLabs is managed via dashboard, only store info flags
    configured: boolean;
  };
}

// Default settings
export function getDefaultSettings(): VoiceAgentSettings {
  return {
    version: SCHEMA_VERSION,
    openai: {
      voice: 'alloy',
      systemPrompt: DEFAULT_OPENAI_PROMPT,
    },
    xai: {
      voice: 'Ara',
      systemPrompt: DEFAULT_XAI_PROMPT,
    },
    elevenlabs: {
      configured: false,
    },
  };
}

/**
 * Load settings from localStorage
 * Returns default settings if not found or invalid
 */
export function loadSettings(): VoiceAgentSettings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(stored) as VoiceAgentSettings;

    // Validate schema version
    if (!parsed.version || parsed.version !== SCHEMA_VERSION) {
      // Future: handle migrations here
      console.warn('[settingsStorage] Schema version mismatch, using defaults');
      return getDefaultSettings();
    }

    // Merge with defaults to ensure all fields exist
    const defaults = getDefaultSettings();
    return {
      ...defaults,
      ...parsed,
      openai: {
        ...defaults.openai,
        ...parsed.openai,
      },
      xai: {
        ...defaults.xai,
        ...parsed.xai,
      },
      elevenlabs: {
        ...defaults.elevenlabs,
        ...parsed.elevenlabs,
      },
    };
  } catch (error) {
    console.warn('[settingsStorage] Failed to load settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: VoiceAgentSettings): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Ensure version is set
    const toSave: VoiceAgentSettings = {
      ...settings,
      version: SCHEMA_VERSION,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (error) {
    console.error('[settingsStorage] Failed to save settings:', error);
    return false;
  }
}

/**
 * Reset settings for a specific provider
 */
export function resetProviderSettings(
  provider: 'openai' | 'xai' | 'elevenlabs'
): VoiceAgentSettings {
  const current = loadSettings();
  const defaults = getDefaultSettings();

  const updated: VoiceAgentSettings = {
    ...current,
    [provider]: defaults[provider],
  };

  saveSettings(updated);
  return updated;
}

/**
 * Reset all settings to defaults
 */
export function resetAllSettings(): VoiceAgentSettings {
  const defaults = getDefaultSettings();
  saveSettings(defaults);
  return defaults;
}

/**
 * Update settings for a specific provider
 */
export function updateProviderSettings(
  provider: 'openai' | 'xai',
  updates: Partial<ProviderSettings>
): VoiceAgentSettings {
  const current = loadSettings();

  const updated: VoiceAgentSettings = {
    ...current,
    [provider]: {
      ...current[provider],
      ...updates,
    },
  };

  saveSettings(updated);
  return updated;
}

/**
 * Get settings for a specific provider
 */
export function getProviderSettings(provider: 'openai' | 'xai'): ProviderSettings {
  const settings = loadSettings();
  return settings[provider];
}

/**
 * Clear all stored settings
 */
export function clearSettings(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[settingsStorage] Failed to clear settings:', error);
  }
}
