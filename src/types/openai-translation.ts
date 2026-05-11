export type OpenAITranslationTargetLanguageCode =
  | 'es'
  | 'pt'
  | 'fr'
  | 'ja'
  | 'ru'
  | 'zh'
  | 'de'
  | 'ko'
  | 'hi'
  | 'id'
  | 'vi'
  | 'it'
  | 'en';

export interface OpenAITranslationTargetLanguage {
  readonly code: OpenAITranslationTargetLanguageCode;
  readonly label: string;
}

export interface OpenAITranslationTargetLanguageValidationSuccess {
  readonly valid: true;
  readonly value: OpenAITranslationTargetLanguageCode;
}

export interface OpenAITranslationTargetLanguageValidationFailure {
  readonly valid: false;
  readonly message: string;
}

export type OpenAITranslationTargetLanguageValidationResult =
  | OpenAITranslationTargetLanguageValidationSuccess
  | OpenAITranslationTargetLanguageValidationFailure;

export interface OpenAITranslationSessionRequest {
  readonly targetLanguage: OpenAITranslationTargetLanguageCode;
}

export interface OpenAITranslationSessionResponse {
  readonly clientSecret: string;
  readonly expiresAt: string;
  readonly targetLanguage: OpenAITranslationTargetLanguageCode;
  readonly model: string;
}

export interface OpenAITranslationErrorResponse {
  readonly error: string;
  readonly message: string;
}

export interface OpenAITranslationSessionRequestDescriptor {
  readonly url: string;
  readonly init: {
    readonly method: 'POST';
    readonly headers: {
      readonly 'Content-Type': 'application/json';
    };
    readonly body: string;
  };
}

export type OpenAITranslationNoiseReductionType = 'near_field' | 'far_field';

export interface OpenAITranslationInputTranscriptionConfig {
  readonly model: string;
}

export interface OpenAITranslationNoiseReductionConfig {
  readonly type: OpenAITranslationNoiseReductionType;
}

export interface OpenAITranslationInputAudioConfig {
  readonly transcription?: OpenAITranslationInputTranscriptionConfig;
  readonly noise_reduction?: OpenAITranslationNoiseReductionConfig;
}

export interface OpenAITranslationOutputAudioConfig {
  readonly language: OpenAITranslationTargetLanguageCode;
}

export interface OpenAITranslationAudioConfig {
  readonly input?: OpenAITranslationInputAudioConfig;
  readonly output: OpenAITranslationOutputAudioConfig;
}

export interface OpenAITranslationSessionConfig {
  readonly model: string;
  readonly audio: OpenAITranslationAudioConfig;
}

export interface OpenAITranslationSessionUpdateConfig {
  readonly audio: OpenAITranslationAudioConfig;
}

export interface OpenAITranslationSessionUpdatePayload {
  readonly type: 'session.update';
  readonly session: OpenAITranslationSessionUpdateConfig;
}

export interface OpenAITranslationSessionConfigOptions {
  readonly targetLanguage: unknown;
  readonly model?: string;
  readonly enableInputTranscription?: boolean;
  readonly inputTranscriptionModel?: string;
  readonly enableNoiseReduction?: boolean;
  readonly noiseReductionType?: OpenAITranslationNoiseReductionType;
}

export interface OpenAITranslationAudioMixState {
  readonly translatedPercent: number;
  readonly originalPercent: number;
  readonly translatedVolume: number;
  readonly originalVolume: number;
  readonly valueLabel: string;
  readonly translatedLabel: string;
  readonly originalLabel: string;
}
