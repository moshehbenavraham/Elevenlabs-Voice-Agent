import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadSettings,
  saveSettings,
  resetProviderSettings,
  resetAllSettings,
  updateProviderSettings,
  getProviderSettings,
  clearSettings,
  getDefaultSettings,
  DEFAULT_OPENAI_PROMPT,
  DEFAULT_XAI_PROMPT,
  type VoiceAgentSettings,
} from '@/lib/settingsStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
    getStore: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('settingsStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('getDefaultSettings', () => {
    it('returns settings with correct schema version', () => {
      const defaults = getDefaultSettings();
      expect(defaults.version).toBe(1);
    });

    it('returns default OpenAI settings', () => {
      const defaults = getDefaultSettings();
      expect(defaults.openai.voice).toBe('alloy');
      expect(defaults.openai.systemPrompt).toBe(DEFAULT_OPENAI_PROMPT);
    });

    it('returns default xAI settings', () => {
      const defaults = getDefaultSettings();
      expect(defaults.xai.voice).toBe('Ara');
      expect(defaults.xai.systemPrompt).toBe(DEFAULT_XAI_PROMPT);
    });

    it('returns ElevenLabs settings with configured false', () => {
      const defaults = getDefaultSettings();
      expect(defaults.elevenlabs.configured).toBe(false);
    });
  });

  describe('loadSettings', () => {
    it('returns defaults when localStorage is empty', () => {
      const settings = loadSettings();
      expect(settings).toEqual(getDefaultSettings());
    });

    it('loads saved settings from localStorage', () => {
      const customSettings: VoiceAgentSettings = {
        version: 1,
        openai: { voice: 'echo', systemPrompt: 'Custom OpenAI prompt' },
        xai: { voice: 'Leo', systemPrompt: 'Custom xAI prompt' },
        elevenlabs: { configured: true },
      };
      localStorageMock.setItem('voice-agent-settings', JSON.stringify(customSettings));

      const settings = loadSettings();
      expect(settings.openai.voice).toBe('echo');
      expect(settings.openai.systemPrompt).toBe('Custom OpenAI prompt');
      expect(settings.xai.voice).toBe('Leo');
      expect(settings.elevenlabs.configured).toBe(true);
    });

    it('returns defaults for invalid JSON', () => {
      localStorageMock.setItem('voice-agent-settings', 'invalid-json');

      const settings = loadSettings();
      expect(settings).toEqual(getDefaultSettings());
    });

    it('returns defaults for wrong schema version', () => {
      const oldSettings = {
        version: 999,
        openai: { voice: 'echo', systemPrompt: 'Old prompt' },
      };
      localStorageMock.setItem('voice-agent-settings', JSON.stringify(oldSettings));

      const settings = loadSettings();
      expect(settings).toEqual(getDefaultSettings());
    });

    it('merges partial settings with defaults', () => {
      const partialSettings = {
        version: 1,
        openai: { voice: 'shimmer' },
      };
      localStorageMock.setItem('voice-agent-settings', JSON.stringify(partialSettings));

      const settings = loadSettings();
      expect(settings.openai.voice).toBe('shimmer');
      expect(settings.openai.systemPrompt).toBe(DEFAULT_OPENAI_PROMPT);
      expect(settings.xai.voice).toBe('Ara');
    });
  });

  describe('saveSettings', () => {
    it('saves settings to localStorage', () => {
      const settings = getDefaultSettings();
      settings.openai.voice = 'ballad';

      const result = saveSettings(settings);
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'voice-agent-settings',
        expect.stringContaining('"voice":"ballad"')
      );
    });

    it('ensures version is set when saving', () => {
      const settings = getDefaultSettings();
      saveSettings(settings);

      const saved = JSON.parse(localStorageMock.getStore()['voice-agent-settings']);
      expect(saved.version).toBe(1);
    });
  });

  describe('resetProviderSettings', () => {
    it('resets OpenAI settings to defaults', () => {
      const custom: VoiceAgentSettings = {
        version: 1,
        openai: { voice: 'echo', systemPrompt: 'Custom' },
        xai: { voice: 'Leo', systemPrompt: 'Custom xAI' },
        elevenlabs: { configured: true },
      };
      localStorageMock.setItem('voice-agent-settings', JSON.stringify(custom));

      const result = resetProviderSettings('openai');
      expect(result.openai.voice).toBe('alloy');
      expect(result.openai.systemPrompt).toBe(DEFAULT_OPENAI_PROMPT);
      expect(result.xai.voice).toBe('Leo'); // xAI unchanged
    });

    it('resets xAI settings to defaults', () => {
      const custom: VoiceAgentSettings = {
        version: 1,
        openai: { voice: 'echo', systemPrompt: 'Custom' },
        xai: { voice: 'Leo', systemPrompt: 'Custom xAI' },
        elevenlabs: { configured: true },
      };
      localStorageMock.setItem('voice-agent-settings', JSON.stringify(custom));

      const result = resetProviderSettings('xai');
      expect(result.xai.voice).toBe('Ara');
      expect(result.xai.systemPrompt).toBe(DEFAULT_XAI_PROMPT);
      expect(result.openai.voice).toBe('echo'); // OpenAI unchanged
    });
  });

  describe('resetAllSettings', () => {
    it('resets all settings to defaults', () => {
      const custom: VoiceAgentSettings = {
        version: 1,
        openai: { voice: 'echo', systemPrompt: 'Custom' },
        xai: { voice: 'Leo', systemPrompt: 'Custom xAI' },
        elevenlabs: { configured: true },
      };
      localStorageMock.setItem('voice-agent-settings', JSON.stringify(custom));

      const result = resetAllSettings();
      expect(result).toEqual(getDefaultSettings());
    });
  });

  describe('updateProviderSettings', () => {
    it('updates OpenAI voice', () => {
      const result = updateProviderSettings('openai', { voice: 'coral' });
      expect(result.openai.voice).toBe('coral');
      expect(result.openai.systemPrompt).toBe(DEFAULT_OPENAI_PROMPT);
    });

    it('updates OpenAI system prompt', () => {
      const result = updateProviderSettings('openai', { systemPrompt: 'Be helpful' });
      expect(result.openai.systemPrompt).toBe('Be helpful');
      expect(result.openai.voice).toBe('alloy');
    });

    it('updates xAI settings', () => {
      const result = updateProviderSettings('xai', { voice: 'Eve', systemPrompt: 'Be concise' });
      expect(result.xai.voice).toBe('Eve');
      expect(result.xai.systemPrompt).toBe('Be concise');
    });
  });

  describe('getProviderSettings', () => {
    it('returns OpenAI settings', () => {
      const settings = getProviderSettings('openai');
      expect(settings.voice).toBe('alloy');
      expect(settings.systemPrompt).toBe(DEFAULT_OPENAI_PROMPT);
    });

    it('returns xAI settings', () => {
      const settings = getProviderSettings('xai');
      expect(settings.voice).toBe('Ara');
      expect(settings.systemPrompt).toBe(DEFAULT_XAI_PROMPT);
    });

    it('returns saved settings', () => {
      updateProviderSettings('openai', { voice: 'sage' });
      const settings = getProviderSettings('openai');
      expect(settings.voice).toBe('sage');
    });
  });

  describe('clearSettings', () => {
    it('removes settings from localStorage', () => {
      saveSettings(getDefaultSettings());
      clearSettings();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('voice-agent-settings');
    });
  });
});
