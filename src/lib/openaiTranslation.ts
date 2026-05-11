import type {
  OpenAITranslationAudioConfig,
  OpenAITranslationAudioMixState,
  OpenAITranslationInputAudioConfig,
  OpenAITranslationNoiseReductionType,
  OpenAITranslationSessionConfig,
  OpenAITranslationSessionConfigOptions,
  OpenAITranslationSessionRequest,
  OpenAITranslationSessionRequestDescriptor,
  OpenAITranslationSessionUpdatePayload,
  OpenAITranslationTargetLanguage,
  OpenAITranslationTargetLanguageCode,
  OpenAITranslationTargetLanguageValidationResult,
} from '@/types/openai-translation';

export const OPENAI_TRANSLATION_MODEL = 'gpt-realtime-translate';
export const OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL = 'gpt-realtime-whisper';
export const OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE = '/api/openai/translation-session';
export const OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE = 'en';
export const OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT = 85;
export const OPENAI_TRANSLATION_DEFAULT_NOISE_REDUCTION_TYPE = 'near_field';

export const OPENAI_TRANSLATION_ENDPOINTS = {
  realtime: 'https://api.openai.com/v1/realtime/translations',
  calls: 'https://api.openai.com/v1/realtime/translations/calls',
  clientSecrets: 'https://api.openai.com/v1/realtime/translations/client_secrets',
} as const;

export const OPENAI_TRANSLATION_TARGET_LANGUAGE_CODES = [
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
] as const satisfies readonly OpenAITranslationTargetLanguageCode[];

export const OPENAI_TRANSLATION_TARGET_LANGUAGES = [
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

export const OPENAI_TRANSLATION_LANGUAGE_COUNT = OPENAI_TRANSLATION_TARGET_LANGUAGE_CODES.length;

export const OPENAI_TRANSLATION_NOISE_REDUCTION_TYPES = [
  'near_field',
  'far_field',
] as const satisfies readonly OpenAITranslationNoiseReductionType[];

const TARGET_LANGUAGE_PATTERN = /^[a-z]{2}$/;
const OPENAI_TRANSLATION_TARGET_LANGUAGE_SET = new Set<OpenAITranslationTargetLanguageCode>(
  OPENAI_TRANSLATION_TARGET_LANGUAGE_CODES
);

export function getTranslationTargetLanguageCodes(): readonly OpenAITranslationTargetLanguageCode[] {
  return OPENAI_TRANSLATION_TARGET_LANGUAGE_CODES;
}

export function getTranslationTargetLanguages(): readonly OpenAITranslationTargetLanguage[] {
  return OPENAI_TRANSLATION_TARGET_LANGUAGES;
}

export function isTranslationTargetLanguage(
  value: unknown
): value is OpenAITranslationTargetLanguageCode {
  return (
    typeof value === 'string' &&
    OPENAI_TRANSLATION_TARGET_LANGUAGE_SET.has(value as OpenAITranslationTargetLanguageCode)
  );
}

export function validateTranslationTargetLanguage(
  value: unknown,
  fieldName = 'targetLanguage'
): OpenAITranslationTargetLanguageValidationResult {
  if (typeof value !== 'string') {
    return {
      valid: false,
      message: `${fieldName}: must be a string`,
    };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      message: `${fieldName}: is required`,
    };
  }

  const normalized = trimmed.toLowerCase();
  if (!TARGET_LANGUAGE_PATTERN.test(normalized)) {
    return {
      valid: false,
      message: `${fieldName}: must be a two-letter language code`,
    };
  }

  if (
    !OPENAI_TRANSLATION_TARGET_LANGUAGE_SET.has(normalized as OpenAITranslationTargetLanguageCode)
  ) {
    return {
      valid: false,
      message: `${fieldName}: must be one of ${OPENAI_TRANSLATION_TARGET_LANGUAGE_CODES.join(', ')}`,
    };
  }

  return {
    valid: true,
    value: normalized as OpenAITranslationTargetLanguageCode,
  };
}

export function normalizeTranslationTargetLanguage(
  value: unknown
): OpenAITranslationTargetLanguageCode | null {
  const result = validateTranslationTargetLanguage(value);
  return result.valid ? result.value : null;
}

export function assertTranslationTargetLanguage(
  value: unknown,
  fieldName = 'targetLanguage'
): OpenAITranslationTargetLanguageCode {
  const result = validateTranslationTargetLanguage(value, fieldName);
  if (!result.valid) {
    throw new Error(result.message);
  }

  return result.value;
}

export function getTranslationTargetLanguage(
  value: unknown
): OpenAITranslationTargetLanguage | undefined {
  const normalized = normalizeTranslationTargetLanguage(value);
  if (!normalized) {
    return undefined;
  }

  return OPENAI_TRANSLATION_TARGET_LANGUAGES.find((language) => language.code === normalized);
}

export function clampTranslationAudioMixPercent(
  value: unknown,
  fallback = OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT
): number {
  const parsed = coerceFiniteNumber(value);
  if (parsed === null) {
    return clampPercent(
      coerceFiniteNumber(fallback) ?? OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT
    );
  }

  return clampPercent(parsed);
}

export function buildTranslationAudioMixState(value: unknown): OpenAITranslationAudioMixState {
  const translatedPercent = clampTranslationAudioMixPercent(value);
  const originalPercent = roundPercent(100 - translatedPercent);
  const translatedVolume = roundVolume(translatedPercent / 100);
  const originalVolume = roundVolume(originalPercent / 100);

  return {
    translatedPercent,
    originalPercent,
    translatedVolume,
    originalVolume,
    valueLabel: `${formatPercent(translatedPercent)}% translated`,
    translatedLabel: `Translated ${formatPercent(translatedPercent)}%`,
    originalLabel: `Original ${formatPercent(originalPercent)}%`,
  };
}

export function getTranslatedAudioVolume(value: unknown): number {
  return buildTranslationAudioMixState(value).translatedVolume;
}

export function getOriginalAudioVolume(value: unknown): number {
  return buildTranslationAudioMixState(value).originalVolume;
}

export function buildTranslationSessionConfig(
  options: OpenAITranslationSessionConfigOptions
): OpenAITranslationSessionConfig {
  const targetLanguage = assertTranslationTargetLanguage(options.targetLanguage);
  const input = buildTranslationInputAudioConfig(options);
  const audio: OpenAITranslationAudioConfig = input
    ? {
        input,
        output: {
          language: targetLanguage,
        },
      }
    : {
        output: {
          language: targetLanguage,
        },
      };

  return {
    model: resolveStringSetting(options.model, OPENAI_TRANSLATION_MODEL),
    audio,
  };
}

export function buildTranslationSessionUpdate(
  options: OpenAITranslationSessionConfigOptions
): OpenAITranslationSessionUpdatePayload {
  const sessionConfig = buildTranslationSessionConfig(options);

  return {
    type: 'session.update',
    session: {
      audio: sessionConfig.audio,
    },
  };
}

export function buildTranslationSessionRequest(
  targetLanguage: unknown
): OpenAITranslationSessionRequest {
  return {
    targetLanguage: assertTranslationTargetLanguage(targetLanguage),
  };
}

export function buildTranslationSessionRequestDescriptor(
  targetLanguage: unknown,
  url = OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE
): OpenAITranslationSessionRequestDescriptor {
  const body = buildTranslationSessionRequest(targetLanguage);

  return {
    url,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  };
}

function buildTranslationInputAudioConfig(
  options: OpenAITranslationSessionConfigOptions
): OpenAITranslationInputAudioConfig | undefined {
  const input: {
    transcription?: { readonly model: string };
    noise_reduction?: { readonly type: OpenAITranslationNoiseReductionType };
  } = {};

  if (options.enableInputTranscription) {
    input.transcription = {
      model: resolveStringSetting(
        options.inputTranscriptionModel,
        OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL
      ),
    };
  }

  if (options.enableNoiseReduction) {
    input.noise_reduction = {
      type: resolveNoiseReductionType(options.noiseReductionType),
    };
  }

  return Object.keys(input).length > 0 ? input : undefined;
}

function resolveNoiseReductionType(
  value: OpenAITranslationNoiseReductionType | undefined
): OpenAITranslationNoiseReductionType {
  return OPENAI_TRANSLATION_NOISE_REDUCTION_TYPES.includes(
    value as OpenAITranslationNoiseReductionType
  )
    ? (value as OpenAITranslationNoiseReductionType)
    : OPENAI_TRANSLATION_DEFAULT_NOISE_REDUCTION_TYPE;
}

function resolveStringSetting(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function clampPercent(value: number): number {
  return roundPercent(Math.min(100, Math.max(0, value)));
}

function roundPercent(value: number): number {
  return Number(value.toFixed(2));
}

function roundVolume(value: number): number {
  return Number(value.toFixed(4));
}

function formatPercent(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
