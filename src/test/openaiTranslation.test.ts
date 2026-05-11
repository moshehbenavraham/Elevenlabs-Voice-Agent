import { describe, expect, it } from 'vitest';
import {
  OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE,
  OPENAI_TRANSLATION_ENDPOINTS,
  OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL,
  OPENAI_TRANSLATION_MODEL,
  OPENAI_TRANSLATION_TARGET_LANGUAGES,
  assertTranslationTargetLanguage,
  buildTranslationAudioMixState,
  buildTranslationSessionConfig,
  buildTranslationSessionRequest,
  buildTranslationSessionRequestDescriptor,
  buildTranslationSessionUpdate,
  clampTranslationAudioMixPercent,
  getOriginalAudioVolume,
  getTranslatedAudioVolume,
  getTranslationTargetLanguage,
  getTranslationTargetLanguageCodes,
  isTranslationTargetLanguage,
  normalizeTranslationTargetLanguage,
  validateTranslationTargetLanguage,
} from '@/lib/openaiTranslation';

describe('openaiTranslation', () => {
  describe('translation constants', () => {
    it('exports model, endpoint, and local route metadata', () => {
      expect(OPENAI_TRANSLATION_MODEL).toBe('gpt-realtime-translate');
      expect(OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL).toBe('gpt-realtime-whisper');
      expect(OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE).toBe('/api/openai/translation-session');
      expect(OPENAI_TRANSLATION_ENDPOINTS).toEqual({
        realtime: 'https://api.openai.com/v1/realtime/translations',
        calls: 'https://api.openai.com/v1/realtime/translations/calls',
        clientSecrets: 'https://api.openai.com/v1/realtime/translations/client_secrets',
      });
    });

    it('contains exactly the PRD target output languages in order', () => {
      expect(getTranslationTargetLanguageCodes()).toEqual([
        'es',
        'pt',
        'fr',
        'ja',
        'ru',
        'zh',
        'de',
        'ko',
        'hi',
        'id',
        'vi',
        'it',
        'en',
      ]);
      expect(new Set(getTranslationTargetLanguageCodes()).size).toBe(13);
      expect(OPENAI_TRANSLATION_TARGET_LANGUAGES).toHaveLength(13);
    });

    it('uses ASCII-only English labels', () => {
      for (const language of OPENAI_TRANSLATION_TARGET_LANGUAGES) {
        for (const character of language.label) {
          expect(character.charCodeAt(0)).toBeLessThanOrEqual(127);
        }
        expect(language.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe('target language helpers', () => {
    it('normalizes supported language codes', () => {
      expect(normalizeTranslationTargetLanguage(' ES ')).toBe('es');
      expect(normalizeTranslationTargetLanguage('pt')).toBe('pt');
      expect(validateTranslationTargetLanguage(' JA ')).toEqual({
        valid: true,
        value: 'ja',
      });
      expect(assertTranslationTargetLanguage(' ko ')).toBe('ko');
    });

    it('uses a strict type guard for already-normalized codes', () => {
      expect(isTranslationTargetLanguage('es')).toBe(true);
      expect(isTranslationTargetLanguage(' ES ')).toBe(false);
      expect(isTranslationTargetLanguage('ar')).toBe(false);
    });

    it('looks up language metadata after normalization', () => {
      expect(getTranslationTargetLanguage(' FR ')).toEqual({
        code: 'fr',
        label: 'French',
      });
      expect(getTranslationTargetLanguage('nl')).toBeUndefined();
    });

    it('rejects malformed or unsupported language inputs', () => {
      const invalidValues = [undefined, null, 42, {}, '', '   ', 'english', 'e', 'e-', 'ar'];

      for (const value of invalidValues) {
        expect(normalizeTranslationTargetLanguage(value)).toBeNull();
        expect(validateTranslationTargetLanguage(value).valid).toBe(false);
      }

      expect(() => assertTranslationTargetLanguage('nl')).toThrow(
        'targetLanguage: must be one of es, pt, fr, ja, ru, zh, de, ko, hi, id, vi, it, en'
      );
    });
  });

  describe('audio mix helpers', () => {
    it('clamps unsafe mix percentages', () => {
      expect(clampTranslationAudioMixPercent(-5)).toBe(0);
      expect(clampTranslationAudioMixPercent(105)).toBe(100);
      expect(clampTranslationAudioMixPercent('40.5')).toBe(40.5);
      expect(clampTranslationAudioMixPercent('not-number')).toBe(85);
      expect(clampTranslationAudioMixPercent(Number.NaN)).toBe(85);
      expect(clampTranslationAudioMixPercent(Number.POSITIVE_INFINITY)).toBe(85);
    });

    it('builds deterministic original and translated volume state', () => {
      expect(buildTranslationAudioMixState('40.5')).toEqual({
        translatedPercent: 40.5,
        originalPercent: 59.5,
        translatedVolume: 0.405,
        originalVolume: 0.595,
        valueLabel: '40.5% translated',
        translatedLabel: 'Translated 40.5%',
        originalLabel: 'Original 59.5%',
      });
      expect(getTranslatedAudioVolume(25)).toBe(0.25);
      expect(getOriginalAudioVolume(25)).toBe(0.75);
    });
  });

  describe('payload builders', () => {
    it('builds translation session config without voice-agent fields', () => {
      const config = buildTranslationSessionConfig({
        targetLanguage: ' ES ',
      });

      expect(config).toEqual({
        model: 'gpt-realtime-translate',
        audio: {
          output: {
            language: 'es',
          },
        },
      });
      expect('instructions' in config).toBe(false);
      expect('tools' in config).toBe(false);
      expect('voice' in config.audio.output).toBe(false);
    });

    it('adds optional transcription and noise reduction only when enabled', () => {
      expect(
        buildTranslationSessionConfig({
          targetLanguage: 'fr',
          enableInputTranscription: true,
          enableNoiseReduction: true,
        })
      ).toEqual({
        model: 'gpt-realtime-translate',
        audio: {
          input: {
            transcription: {
              model: 'gpt-realtime-whisper',
            },
            noise_reduction: {
              type: 'near_field',
            },
          },
          output: {
            language: 'fr',
          },
        },
      });
    });

    it('builds a translation-specific session.update payload', () => {
      const update = buildTranslationSessionUpdate({
        targetLanguage: 'JA',
        enableInputTranscription: true,
      });

      expect(update).toEqual({
        type: 'session.update',
        session: {
          audio: {
            input: {
              transcription: {
                model: 'gpt-realtime-whisper',
              },
            },
            output: {
              language: 'ja',
            },
          },
        },
      });
      expect('model' in update.session).toBe(false);
    });

    it('builds local translation-session request shapes', () => {
      expect(buildTranslationSessionRequest(' ID ')).toEqual({
        targetLanguage: 'id',
      });

      const descriptor = buildTranslationSessionRequestDescriptor(' VI ');
      expect(descriptor.url).toBe('/api/openai/translation-session');
      expect(descriptor.init.method).toBe('POST');
      expect(descriptor.init.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(JSON.parse(descriptor.init.body)).toEqual({
        targetLanguage: 'vi',
      });
    });
  });
});
