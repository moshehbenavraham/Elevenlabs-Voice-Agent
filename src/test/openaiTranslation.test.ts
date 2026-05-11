import { describe, expect, it } from 'vitest';
import {
  OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE,
  OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT,
  OPENAI_TRANSLATION_ENDPOINTS,
  OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL,
  OPENAI_TRANSLATION_LANGUAGE_COUNT,
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
  getTranslationTargetLanguages,
  getTranslatedAudioVolume,
  getTranslationTargetLanguage,
  getTranslationTargetLanguageCodes,
  isTranslationTargetLanguage,
  normalizeTranslationTargetLanguage,
  validateTranslationTargetLanguage,
} from '@/lib/openaiTranslation';
import type {
  OpenAITranslationSessionRequestDescriptor,
  OpenAITranslationTargetLanguage,
} from '@/types/openai-translation';

const EXPECTED_PRD_TARGET_LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'de', label: 'German' },
  { code: 'ko', label: 'Korean' },
  { code: 'hi', label: 'Hindi' },
  { code: 'id', label: 'Indonesian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'it', label: 'Italian' },
  { code: 'en', label: 'English' },
] as const satisfies readonly OpenAITranslationTargetLanguage[];

const EXPECTED_PRD_TARGET_LANGUAGE_CODES = EXPECTED_PRD_TARGET_LANGUAGES.map(
  (language) => language.code
);

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
      const languageCodes = getTranslationTargetLanguageCodes();
      const labels = OPENAI_TRANSLATION_TARGET_LANGUAGES.map((language) => language.label);

      expect(languageCodes).toEqual(EXPECTED_PRD_TARGET_LANGUAGE_CODES);
      expect(getTranslationTargetLanguages()).toEqual(EXPECTED_PRD_TARGET_LANGUAGES);
      expect(OPENAI_TRANSLATION_TARGET_LANGUAGES).toEqual(EXPECTED_PRD_TARGET_LANGUAGES);
      expect(OPENAI_TRANSLATION_LANGUAGE_COUNT).toBe(13);
      expect(new Set(languageCodes).size).toBe(languageCodes.length);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('uses ASCII-only English labels', () => {
      for (const language of OPENAI_TRANSLATION_TARGET_LANGUAGES) {
        expect(language.code).toMatch(/^[a-z]{2}$/);
        expect(language.label).toMatch(/^[\x20-\x7E]+$/);
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
      expect(clampTranslationAudioMixPercent(33.335)).toBe(33.34);
      expect(clampTranslationAudioMixPercent('', 25)).toBe(25);
      expect(clampTranslationAudioMixPercent(null, 15.5)).toBe(15.5);
      expect(clampTranslationAudioMixPercent('not-number')).toBe(85);
      expect(clampTranslationAudioMixPercent(Number.NaN)).toBe(85);
      expect(clampTranslationAudioMixPercent(Number.POSITIVE_INFINITY)).toBe(85);
      expect(clampTranslationAudioMixPercent(undefined, Number.POSITIVE_INFINITY)).toBe(
        OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT
      );
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
      expect(buildTranslationAudioMixState(33.335)).toEqual({
        translatedPercent: 33.34,
        originalPercent: 66.66,
        translatedVolume: 0.3334,
        originalVolume: 0.6666,
        valueLabel: '33.34% translated',
        translatedLabel: 'Translated 33.34%',
        originalLabel: 'Original 66.66%',
      });
      expect(buildTranslationAudioMixState('')).toEqual({
        translatedPercent: 85,
        originalPercent: 15,
        translatedVolume: 0.85,
        originalVolume: 0.15,
        valueLabel: '85% translated',
        translatedLabel: 'Translated 85%',
        originalLabel: 'Original 15%',
      });
      expect(getTranslatedAudioVolume(25)).toBe(0.25);
      expect(getOriginalAudioVolume(25)).toBe(0.75);
      expect(getTranslatedAudioVolume(150)).toBe(1);
      expect(getOriginalAudioVolume(-10)).toBe(1);
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

      const descriptor: OpenAITranslationSessionRequestDescriptor =
        buildTranslationSessionRequestDescriptor(' VI ');
      expect(descriptor.url).toBe('/api/openai/translation-session');
      expect(descriptor.init.method).toBe('POST');
      expect(descriptor.init.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(descriptor.init.body).toBe('{"targetLanguage":"vi"}');
      expect(JSON.parse(descriptor.init.body)).toEqual({
        targetLanguage: 'vi',
      });
      expect(Object.keys(JSON.parse(descriptor.init.body))).toEqual(['targetLanguage']);
    });
  });
});
