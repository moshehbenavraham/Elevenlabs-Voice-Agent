/**
 * Unit Tests for Gemini Voice Configuration
 *
 * Tests voice definitions, model configuration, and helper functions.
 */

import { describe, it, expect } from 'vitest';
import {
  GEMINI_VOICES,
  DEFAULT_GEMINI_VOICE,
  getVoiceById,
  isValidVoiceId,
  getVoiceIds,
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  getModelById,
  isValidModelId,
  GEMINI_LIVE_WS_URL,
  buildWebSocketUrl,
  GEMINI_AUDIO_CONFIG,
  DEFAULT_SYSTEM_INSTRUCTION,
  getDefaultConfig,
} from '../config';

describe('Gemini Voice Configuration', () => {
  describe('GEMINI_VOICES', () => {
    it('contains exactly 30 voices', () => {
      expect(GEMINI_VOICES).toHaveLength(30);
    });

    it('all voices have required properties', () => {
      for (const voice of GEMINI_VOICES) {
        expect(voice.id).toBeDefined();
        expect(voice.name).toBeDefined();
        expect(voice.style).toBeDefined();
        expect(typeof voice.id).toBe('string');
        expect(typeof voice.name).toBe('string');
        expect(['neutral', 'warm', 'bright', 'calm', 'energetic']).toContain(voice.style);
      }
    });

    it('has unique voice IDs', () => {
      const ids = GEMINI_VOICES.map((v) => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('voices are sorted alphabetically by name', () => {
      const names = GEMINI_VOICES.map((v) => v.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('includes all documented Gemini HD voices', () => {
      const expectedVoices = [
        'Achernar',
        'Achird',
        'Algenib',
        'Algieba',
        'Alnilam',
        'Aoede',
        'Autonoe',
        'Callirrhoe',
        'Charon',
        'Despina',
        'Enceladus',
        'Erinome',
        'Fenrir',
        'Gacrux',
        'Iapetus',
        'Kore',
        'Laomedeia',
        'Leda',
        'Orus',
        'Puck',
        'Pulcherrima',
        'Rasalgethi',
        'Sadachbia',
        'Sadaltager',
        'Schedar',
        'Sulafat',
        'Umbriel',
        'Vindemiatrix',
        'Zephyr',
        'Zubenelgenubi',
      ];

      const voiceIds = GEMINI_VOICES.map((v) => v.id);
      for (const expected of expectedVoices) {
        expect(voiceIds).toContain(expected);
      }
    });
  });

  describe('DEFAULT_GEMINI_VOICE', () => {
    it('is a valid voice ID', () => {
      expect(isValidVoiceId(DEFAULT_GEMINI_VOICE)).toBe(true);
    });

    it('is Zephyr by default', () => {
      expect(DEFAULT_GEMINI_VOICE).toBe('Zephyr');
    });
  });

  describe('getVoiceById', () => {
    it('returns voice for valid ID', () => {
      const voice = getVoiceById('Zephyr');
      expect(voice).toBeDefined();
      expect(voice?.id).toBe('Zephyr');
      expect(voice?.name).toBe('Zephyr');
    });

    it('returns undefined for invalid ID', () => {
      const voice = getVoiceById('NonExistentVoice');
      expect(voice).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const voice = getVoiceById('zephyr'); // lowercase
      expect(voice).toBeUndefined();
    });

    it('returns correct style for each voice', () => {
      const zephyr = getVoiceById('Zephyr');
      expect(zephyr?.style).toBe('neutral');

      const puck = getVoiceById('Puck');
      expect(puck?.style).toBe('warm');

      const alnilam = getVoiceById('Alnilam');
      expect(alnilam?.style).toBe('energetic');
    });
  });

  describe('isValidVoiceId', () => {
    it('returns true for valid voice IDs', () => {
      expect(isValidVoiceId('Zephyr')).toBe(true);
      expect(isValidVoiceId('Puck')).toBe(true);
      expect(isValidVoiceId('Charon')).toBe(true);
      expect(isValidVoiceId('Zubenelgenubi')).toBe(true);
    });

    it('returns false for invalid voice IDs', () => {
      expect(isValidVoiceId('')).toBe(false);
      expect(isValidVoiceId('invalid')).toBe(false);
      expect(isValidVoiceId('Zephyr123')).toBe(false);
      expect(isValidVoiceId('zephyr')).toBe(false); // case-sensitive
    });
  });

  describe('getVoiceIds', () => {
    it('returns array of all voice IDs', () => {
      const ids = getVoiceIds();
      expect(ids).toHaveLength(30);
      expect(Array.isArray(ids)).toBe(true);
    });

    it('returns string array', () => {
      const ids = getVoiceIds();
      for (const id of ids) {
        expect(typeof id).toBe('string');
      }
    });

    it('includes default voice', () => {
      const ids = getVoiceIds();
      expect(ids).toContain(DEFAULT_GEMINI_VOICE);
    });
  });
});

describe('Gemini Model Configuration', () => {
  describe('GEMINI_MODELS', () => {
    it('has at least one model', () => {
      expect(GEMINI_MODELS.length).toBeGreaterThan(0);
    });

    it('all models have required properties', () => {
      for (const model of GEMINI_MODELS) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(typeof model.recommended).toBe('boolean');
      }
    });

    it('has exactly one recommended model', () => {
      const recommendedModels = GEMINI_MODELS.filter((m) => m.recommended);
      expect(recommendedModels).toHaveLength(1);
    });
  });

  describe('DEFAULT_GEMINI_MODEL', () => {
    it('is a valid model ID', () => {
      expect(isValidModelId(DEFAULT_GEMINI_MODEL)).toBe(true);
    });

    it('is the recommended model', () => {
      const model = getModelById(DEFAULT_GEMINI_MODEL);
      expect(model?.recommended).toBe(true);
    });
  });

  describe('getModelById', () => {
    it('returns model for valid ID', () => {
      const model = getModelById(DEFAULT_GEMINI_MODEL);
      expect(model).toBeDefined();
      expect(model?.id).toBe(DEFAULT_GEMINI_MODEL);
    });

    it('returns undefined for invalid ID', () => {
      const model = getModelById('invalid-model');
      expect(model).toBeUndefined();
    });
  });

  describe('isValidModelId', () => {
    it('returns true for valid model IDs', () => {
      expect(isValidModelId(DEFAULT_GEMINI_MODEL)).toBe(true);
    });

    it('returns false for invalid model IDs', () => {
      expect(isValidModelId('')).toBe(false);
      expect(isValidModelId('invalid')).toBe(false);
    });
  });
});

describe('WebSocket Configuration', () => {
  describe('GEMINI_LIVE_WS_URL', () => {
    it('is a valid WSS URL', () => {
      expect(GEMINI_LIVE_WS_URL).toMatch(/^wss:\/\//);
    });

    it('points to Google API endpoint', () => {
      expect(GEMINI_LIVE_WS_URL).toContain('generativelanguage.googleapis.com');
    });

    it('includes BidiGenerateContent path', () => {
      expect(GEMINI_LIVE_WS_URL).toContain('BidiGenerateContent');
    });
  });

  describe('buildWebSocketUrl', () => {
    it('appends local development tokens as key query parameter', () => {
      const url = buildWebSocketUrl('test-token-123');
      expect(url).toContain('key=test-token-123');
    });

    it('URL-encodes special characters in token', () => {
      const url = buildWebSocketUrl('token with spaces');
      expect(url).toContain('key=token%20with%20spaces');
    });

    it('starts with base WebSocket URL', () => {
      const url = buildWebSocketUrl('token');
      expect(url.startsWith(GEMINI_LIVE_WS_URL)).toBe(true);
    });

    it('uses ? for query parameter', () => {
      const url = buildWebSocketUrl('token');
      expect(url).toContain('?key=');
    });

    it('uses the constrained Live endpoint for Gemini ephemeral auth tokens', () => {
      const url = buildWebSocketUrl('auth_tokens/test-token');

      expect(url).toContain('v1alpha');
      expect(url).toContain('BidiGenerateContentConstrained');
      expect(url).toContain('?access_token=auth_tokens%2Ftest-token');
      expect(url).not.toContain('?key=');
    });
  });
});

describe('Audio Configuration', () => {
  describe('GEMINI_AUDIO_CONFIG', () => {
    it('has correct input sample rate (16kHz)', () => {
      expect(GEMINI_AUDIO_CONFIG.inputSampleRate).toBe(16000);
    });

    it('has correct output sample rate (24kHz)', () => {
      expect(GEMINI_AUDIO_CONFIG.outputSampleRate).toBe(24000);
    });

    it('has correct bit depth (16-bit)', () => {
      expect(GEMINI_AUDIO_CONFIG.bitDepth).toBe(16);
    });

    it('has correct channel count (mono)', () => {
      expect(GEMINI_AUDIO_CONFIG.channels).toBe(1);
    });

    it('has correct input MIME type', () => {
      expect(GEMINI_AUDIO_CONFIG.inputMimeType).toBe('audio/pcm;rate=16000');
    });

    it('has correct output MIME type', () => {
      expect(GEMINI_AUDIO_CONFIG.outputMimeType).toBe('audio/pcm;rate=24000');
    });
  });
});

describe('Default Configuration', () => {
  describe('DEFAULT_SYSTEM_INSTRUCTION', () => {
    it('is a non-empty string', () => {
      expect(typeof DEFAULT_SYSTEM_INSTRUCTION).toBe('string');
      expect(DEFAULT_SYSTEM_INSTRUCTION.length).toBeGreaterThan(0);
    });

    it('mentions voice assistant', () => {
      expect(DEFAULT_SYSTEM_INSTRUCTION.toLowerCase()).toContain('voice assistant');
    });
  });

  describe('getDefaultConfig', () => {
    it('returns object with model, voice, and systemInstruction', () => {
      const config = getDefaultConfig();
      expect(config.model).toBeDefined();
      expect(config.voice).toBeDefined();
      expect(config.systemInstruction).toBeDefined();
    });

    it('returns valid model and voice by default', () => {
      const config = getDefaultConfig();
      expect(isValidModelId(config.model)).toBe(true);
      expect(isValidVoiceId(config.voice)).toBe(true);
    });

    it('uses default values when env vars not set', () => {
      const config = getDefaultConfig();
      expect(config.model).toBe(DEFAULT_GEMINI_MODEL);
      expect(config.voice).toBe(DEFAULT_GEMINI_VOICE);
      // System instruction may come from env or default constant
      expect(config.systemInstruction.length).toBeGreaterThan(0);
      expect(config.systemInstruction.toLowerCase()).toContain('voice assistant');
    });
  });
});
