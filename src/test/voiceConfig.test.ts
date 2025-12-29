import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OPENAI_VOICES,
  XAI_VOICES,
  DEFAULT_OPENAI_VOICE,
  DEFAULT_XAI_VOICE,
  getDefaultVoice,
  getVoiceOptions,
  getSavedVoice,
  saveVoice,
  isValidVoice,
} from '@/lib/voiceConfig';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('voiceConfig', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('OPENAI_VOICES', () => {
    it('contains 8 voice options', () => {
      expect(OPENAI_VOICES).toHaveLength(8);
    });

    it('includes alloy as the default voice', () => {
      expect(OPENAI_VOICES.find((v) => v.id === 'alloy')).toBeDefined();
    });

    it('has valid structure for all voices', () => {
      OPENAI_VOICES.forEach((voice) => {
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('description');
        expect(typeof voice.id).toBe('string');
        expect(typeof voice.name).toBe('string');
        expect(typeof voice.description).toBe('string');
      });
    });
  });

  describe('XAI_VOICES', () => {
    it('contains 5 voice options', () => {
      expect(XAI_VOICES).toHaveLength(5);
    });

    it('includes Ara as the default voice', () => {
      expect(XAI_VOICES.find((v) => v.id === 'Ara')).toBeDefined();
    });

    it('has all official xAI voices', () => {
      const voiceIds = XAI_VOICES.map((v) => v.id);
      expect(voiceIds).toContain('Ara');
      expect(voiceIds).toContain('Eve');
      expect(voiceIds).toContain('Leo');
      expect(voiceIds).toContain('Rex');
      expect(voiceIds).toContain('Sal');
    });
  });

  describe('getDefaultVoice', () => {
    it('returns alloy for openai provider', () => {
      expect(getDefaultVoice('openai')).toBe(DEFAULT_OPENAI_VOICE);
      expect(getDefaultVoice('openai')).toBe('alloy');
    });

    it('returns Ara for xai provider', () => {
      expect(getDefaultVoice('xai')).toBe(DEFAULT_XAI_VOICE);
      expect(getDefaultVoice('xai')).toBe('Ara');
    });
  });

  describe('getVoiceOptions', () => {
    it('returns OPENAI_VOICES for openai provider', () => {
      expect(getVoiceOptions('openai')).toBe(OPENAI_VOICES);
    });

    it('returns XAI_VOICES for xai provider', () => {
      expect(getVoiceOptions('xai')).toBe(XAI_VOICES);
    });
  });

  describe('getSavedVoice', () => {
    it('returns default voice when localStorage is empty', () => {
      expect(getSavedVoice('openai')).toBe('alloy');
      expect(getSavedVoice('xai')).toBe('Ara');
    });

    it('returns saved voice from localStorage', () => {
      localStorageMock.setItem('openai-voice', 'echo');
      expect(getSavedVoice('openai')).toBe('echo');
    });

    it('returns default if saved voice is invalid', () => {
      localStorageMock.setItem('openai-voice', 'invalid-voice');
      expect(getSavedVoice('openai')).toBe('alloy');
    });
  });

  describe('saveVoice', () => {
    it('saves voice to localStorage for openai', () => {
      saveVoice('openai', 'shimmer');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('openai-voice', 'shimmer');
    });

    it('saves voice to localStorage for xai', () => {
      saveVoice('xai', 'Leo');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('xai-voice', 'Leo');
    });
  });

  describe('isValidVoice', () => {
    it('returns true for valid openai voices', () => {
      expect(isValidVoice('openai', 'alloy')).toBe(true);
      expect(isValidVoice('openai', 'echo')).toBe(true);
      expect(isValidVoice('openai', 'shimmer')).toBe(true);
    });

    it('returns true for valid xai voices', () => {
      expect(isValidVoice('xai', 'Ara')).toBe(true);
      expect(isValidVoice('xai', 'Leo')).toBe(true);
      expect(isValidVoice('xai', 'Eve')).toBe(true);
    });

    it('returns false for invalid voices', () => {
      expect(isValidVoice('openai', 'invalid')).toBe(false);
      expect(isValidVoice('xai', 'not-a-voice')).toBe(false);
    });
  });
});
