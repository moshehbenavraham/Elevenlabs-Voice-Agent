import { getApiBaseUrl } from '@/lib/apiConfig';
import type {
  OpenAITranslationAudioConfig,
  OpenAITranslationAudioMixState,
  OpenAITranslationDataChannelParseResult,
  OpenAITranslationDisplayMediaOptionInput,
  OpenAITranslationErrorResponse,
  OpenAITranslationFetch,
  OpenAITranslationErrorKind,
  OpenAITranslationHookStatus,
  OpenAITranslationInputAudioConfig,
  OpenAITranslationNoiseReductionType,
  OpenAITranslationRuntimeRequestOptions,
  OpenAITranslationRuntimeError,
  OpenAITranslationSdpExchangeOptions,
  OpenAITranslationSessionConfig,
  OpenAITranslationSessionConfigOptions,
  OpenAITranslationSessionRequest,
  OpenAITranslationSessionRequestDescriptor,
  OpenAITranslationSessionResponse,
  OpenAITranslationSessionUpdatePayload,
  OpenAITranslationSourceCapabilities,
  OpenAITranslationSourceCapability,
  OpenAITranslationSourceError,
  OpenAITranslationSourceErrorKind,
  OpenAITranslationSourceMode,
  OpenAITranslationSourceModeMetadata,
  OpenAITranslationTargetLanguage,
  OpenAITranslationTargetLanguageCode,
  OpenAITranslationTargetLanguageValidationResult,
  OpenAITranslationTranscriptEntry,
  OpenAITranslationTranscriptEvent,
  OpenAITranslationTranscriptEventPhase,
  OpenAITranslationTranscriptStream,
} from '@/types/openai-translation';

export const OPENAI_TRANSLATION_MODEL = 'gpt-realtime-translate';
export const OPENAI_TRANSLATION_INPUT_TRANSCRIPTION_MODEL = 'gpt-realtime-whisper';
export const OPENAI_TRANSLATION_BACKEND_SESSION_ROUTE = '/api/openai/translation-session';
export const OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE = 'en';
export const OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT = 85;
export const OPENAI_TRANSLATION_DEFAULT_NOISE_REDUCTION_TYPE = 'near_field';
export const OPENAI_TRANSLATION_RUNTIME_REQUEST_TIMEOUT_MS = 30000;
export const OPENAI_TRANSLATION_RUNTIME_RETRY_COUNT = 1;
export const OPENAI_TRANSLATION_RUNTIME_RETRY_DELAY_MS = 25;

export const OPENAI_TRANSLATION_SOURCE_MODES = [
  'microphone',
  'browser-tab',
] as const satisfies readonly OpenAITranslationSourceMode[];

export const OPENAI_TRANSLATION_SOURCE_MODE_METADATA = [
  {
    mode: 'microphone',
    label: 'Microphone',
    shortLabel: 'Mic',
    description: 'Capture live microphone audio for quick translation tests.',
    unavailableDescription: 'Microphone capture is unavailable in this browser context.',
    actionLabel: 'Use microphone',
  },
  {
    mode: 'browser-tab',
    label: 'Tab audio',
    shortLabel: 'Tab',
    description: 'Capture browser-tab audio for listen-along translation.',
    unavailableDescription: 'Tab audio capture is unavailable in this browser context.',
    actionLabel: 'Use tab audio',
  },
] as const satisfies readonly OpenAITranslationSourceModeMetadata[];

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
const OPENAI_TRANSLATION_SOURCE_MODE_SET = new Set<OpenAITranslationSourceMode>(
  OPENAI_TRANSLATION_SOURCE_MODES
);
const OPENAI_TRANSLATION_STARTING_STATUSES = new Set<OpenAITranslationHookStatus>([
  'requesting-client-secret',
  'connecting',
]);
const OPENAI_TRANSLATION_BUSY_STATUSES = new Set<OpenAITranslationHookStatus>([
  'requesting-client-secret',
  'connecting',
  'stopping',
]);
const OPENAI_TRANSLATION_TERMINAL_STATUSES = new Set<OpenAITranslationHookStatus>([
  'idle',
  'stopped',
  'error',
]);

interface OpenAITranslationDisplayMediaOptions extends DisplayMediaStreamOptions {
  readonly preferCurrentTab?: boolean;
  readonly selfBrowserSurface?: 'include' | 'exclude';
  readonly surfaceSwitching?: 'include' | 'exclude';
  readonly systemAudio?: 'include' | 'exclude';
}

interface OpenAITranslationMediaDeviceAccess {
  readonly getUserMedia?: unknown;
  readonly getDisplayMedia?: unknown;
}

export function getTranslationTargetLanguageCodes(): readonly OpenAITranslationTargetLanguageCode[] {
  return OPENAI_TRANSLATION_TARGET_LANGUAGE_CODES;
}

export function getTranslationTargetLanguages(): readonly OpenAITranslationTargetLanguage[] {
  return OPENAI_TRANSLATION_TARGET_LANGUAGES;
}

export function getOpenAITranslationSourceModes(): readonly OpenAITranslationSourceModeMetadata[] {
  return OPENAI_TRANSLATION_SOURCE_MODE_METADATA;
}

export function isOpenAITranslationSourceMode(
  value: unknown
): value is OpenAITranslationSourceMode {
  return (
    typeof value === 'string' &&
    OPENAI_TRANSLATION_SOURCE_MODE_SET.has(value as OpenAITranslationSourceMode)
  );
}

export function getOpenAITranslationSourceModeMetadata(
  mode: OpenAITranslationSourceMode
): OpenAITranslationSourceModeMetadata {
  switch (mode) {
    case 'microphone':
      return OPENAI_TRANSLATION_SOURCE_MODE_METADATA[0];
    case 'browser-tab':
      return OPENAI_TRANSLATION_SOURCE_MODE_METADATA[1];
    default:
      return assertNeverOpenAITranslationSourceMode(mode);
  }
}

export function getOpenAITranslationSourceCapability(
  capabilities: OpenAITranslationSourceCapabilities,
  mode: OpenAITranslationSourceMode
): OpenAITranslationSourceCapability {
  switch (mode) {
    case 'microphone':
      return capabilities.microphone;
    case 'browser-tab':
      return capabilities.browserTab;
    default:
      return assertNeverOpenAITranslationSourceMode(mode);
  }
}

export function detectOpenAITranslationSourceCapabilities(
  mediaDevices: OpenAITranslationMediaDeviceAccess | null | undefined = resolveMediaDevices(),
  isSecureContext = resolveSecureContext()
): OpenAITranslationSourceCapabilities {
  return {
    microphone: buildOpenAITranslationSourceCapability({
      mode: 'microphone',
      mediaDevices,
      apiName: 'getUserMedia',
      isSecureContext,
    }),
    browserTab: buildOpenAITranslationSourceCapability({
      mode: 'browser-tab',
      mediaDevices,
      apiName: 'getDisplayMedia',
      isSecureContext,
    }),
  };
}

export function buildOpenAITranslationDisplayMediaOptions(
  input: OpenAITranslationDisplayMediaOptionInput = {}
): DisplayMediaStreamOptions {
  const preferCurrentTab = readOptionalBoolean(input.preferCurrentTab, 'preferCurrentTab') ?? true;
  const includeSystemAudio =
    readOptionalBoolean(input.includeSystemAudio, 'includeSystemAudio') ?? true;
  const surfaceSwitching = readOptionalBoolean(input.surfaceSwitching, 'surfaceSwitching') ?? true;

  const options: OpenAITranslationDisplayMediaOptions = {
    audio: true,
    video: true,
    preferCurrentTab,
    selfBrowserSurface: 'include',
    surfaceSwitching: surfaceSwitching ? 'include' : 'exclude',
    systemAudio: includeSystemAudio ? 'include' : 'exclude',
  };

  return options;
}

export function createOpenAITranslationSourceError(
  kind: OpenAITranslationSourceErrorKind,
  mode: OpenAITranslationSourceMode | null,
  message: string,
  options: {
    readonly recoverable?: boolean;
    readonly code?: string;
    readonly rawName?: string;
  } = {}
): OpenAITranslationSourceError {
  return {
    kind,
    mode,
    message,
    recoverable: options.recoverable ?? kind !== 'unsupported',
    ...(typeof options.code === 'string' && options.code.length > 0 ? { code: options.code } : {}),
    ...(typeof options.rawName === 'string' && options.rawName.length > 0
      ? { rawName: options.rawName }
      : {}),
  };
}

export function createOpenAITranslationMissingAudioTrackError(
  mode: OpenAITranslationSourceMode
): OpenAITranslationSourceError {
  return createOpenAITranslationSourceError(
    'missing-audio-track',
    mode,
    mode === 'browser-tab'
      ? 'The selected browser share did not include audio. Choose a tab and enable audio sharing.'
      : 'The selected source did not include an audio track.',
    { code: 'missing-audio-track' }
  );
}

export function mapOpenAITranslationSourceError(
  error: unknown,
  mode: OpenAITranslationSourceMode
): OpenAITranslationSourceError {
  if (isOpenAITranslationSourceError(error)) {
    return error;
  }

  const name = readErrorName(error);
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return createOpenAITranslationSourceError(
        'permission-denied',
        mode,
        'Browser permission was denied for the selected audio source.',
        { code: 'permission-denied', rawName: name }
      );

    case 'AbortError':
      return createOpenAITranslationSourceError(
        'capture-cancelled',
        mode,
        'Audio source selection was cancelled before capture started.',
        { code: 'capture-cancelled', rawName: name }
      );

    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
    case 'NotReadableError':
    case 'TrackStartError':
      return createOpenAITranslationSourceError(
        'device-unavailable',
        mode,
        'The selected audio source is unavailable or could not be started.',
        { code: 'device-unavailable', rawName: name }
      );

    case 'TypeError':
    case 'InvalidStateError':
      return createOpenAITranslationSourceError(
        'capture-failed',
        mode,
        'Audio source capture could not be started in this browser state.',
        { code: 'capture-failed', rawName: name }
      );

    default:
      return createOpenAITranslationSourceError(
        'unknown',
        mode,
        'Audio source capture failed unexpectedly.',
        { code: 'unknown-capture-error', rawName: name ?? undefined }
      );
  }
}

export function isOpenAITranslationSourceError(
  value: unknown
): value is OpenAITranslationSourceError {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.kind === 'string' &&
    (value.mode === null || isOpenAITranslationSourceMode(value.mode)) &&
    typeof value.message === 'string' &&
    typeof value.recoverable === 'boolean'
  );
}

export function createOpenAITranslationRuntimeError(
  kind: OpenAITranslationErrorKind,
  message: string,
  options: {
    readonly recoverable?: boolean;
    readonly status?: number;
    readonly code?: string;
  } = {}
): OpenAITranslationRuntimeError {
  return {
    kind,
    message,
    recoverable: options.recoverable ?? kind !== 'validation',
    ...(typeof options.status === 'number' ? { status: options.status } : {}),
    ...(typeof options.code === 'string' && options.code.length > 0 ? { code: options.code } : {}),
  };
}

export function isOpenAITranslationRuntimeError(
  value: unknown
): value is OpenAITranslationRuntimeError {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.kind === 'string' &&
    typeof value.message === 'string' &&
    typeof value.recoverable === 'boolean'
  );
}

export function isOpenAITranslationStartingStatus(status: OpenAITranslationHookStatus): boolean {
  return OPENAI_TRANSLATION_STARTING_STATUSES.has(status);
}

export function isOpenAITranslationBusyStatus(status: OpenAITranslationHookStatus): boolean {
  return OPENAI_TRANSLATION_BUSY_STATUSES.has(status);
}

export function isOpenAITranslationTerminalStatus(status: OpenAITranslationHookStatus): boolean {
  return OPENAI_TRANSLATION_TERMINAL_STATUSES.has(status);
}

export function shouldRetryOpenAITranslationStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function requestOpenAITranslationClientSecret(
  options: OpenAITranslationRuntimeRequestOptions
): Promise<OpenAITranslationSessionResponse> {
  const targetLanguage = assertTranslationTargetLanguage(options.targetLanguage);
  const descriptor = buildTranslationSessionRequestDescriptor(targetLanguage);
  const url = buildOpenAITranslationApiUrl(options.apiBaseUrl ?? getApiBaseUrl(), descriptor.url);
  const response = await fetchOpenAITranslationWithRetry(
    {
      url,
      init: descriptor.init,
      signal: options.signal,
      fetcher: options.fetcher,
      timeoutMs: options.timeoutMs,
      retryCount: options.retryCount,
      retryDelayMs: options.retryDelayMs,
    },
    'client-secret',
    'Failed to request OpenAI translation client secret'
  );
  const data = await parseOpenAITranslationJson(response, 'client-secret');

  return normalizeOpenAITranslationSessionResponse(data, targetLanguage);
}

export async function exchangeOpenAITranslationSdp(
  options: OpenAITranslationSdpExchangeOptions
): Promise<string> {
  const clientSecret = readNonEmptyString(options.clientSecret);
  const offerSdp = readNonEmptyString(options.offerSdp);

  if (!clientSecret) {
    throw createOpenAITranslationRuntimeError(
      'sdp-exchange',
      'OpenAI translation client secret is required for SDP exchange',
      { recoverable: false, code: 'missing-client-secret' }
    );
  }

  if (!offerSdp) {
    throw createOpenAITranslationRuntimeError(
      'sdp-exchange',
      'OpenAI translation SDP offer is required',
      { recoverable: false, code: 'missing-offer-sdp' }
    );
  }

  const response = await fetchOpenAITranslationWithRetry(
    {
      url: options.endpoint ?? OPENAI_TRANSLATION_ENDPOINTS.calls,
      init: {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
        },
        body: offerSdp,
      },
      signal: options.signal,
      fetcher: options.fetcher,
      timeoutMs: options.timeoutMs,
      retryCount: options.retryCount,
      retryDelayMs: options.retryDelayMs,
    },
    'sdp-exchange',
    'Failed to exchange OpenAI translation SDP'
  );
  const answerSdp = await parseOpenAITranslationText(response, 'sdp-exchange');

  if (answerSdp.trim().length === 0) {
    throw createOpenAITranslationRuntimeError(
      'sdp-exchange',
      'OpenAI translation SDP answer was empty',
      { status: response.status, code: 'empty-answer-sdp' }
    );
  }

  return answerSdp;
}

export function parseOpenAITranslationDataChannelMessage(
  data: unknown
): OpenAITranslationDataChannelParseResult {
  const recordResult = parseDataChannelRecord(data);
  if (!recordResult.ok) {
    return recordResult;
  }

  const record = recordResult.record;
  const eventType = typeof record.type === 'string' ? record.type : null;
  if (!eventType) {
    return {
      ok: true,
      kind: 'unknown',
      eventType: null,
      raw: record,
    };
  }

  switch (eventType) {
    case 'translation.source_transcript.delta':
    case 'input_audio_transcription.delta':
    case 'conversation.item.input_audio_transcription.delta':
      return parseTranscriptDataChannelEvent(record, eventType, 'source', 'delta', [
        'delta',
        'text',
      ]);

    case 'translation.source_transcript.done':
    case 'translation.source_transcript.final':
    case 'input_audio_transcription.completed':
    case 'conversation.item.input_audio_transcription.completed':
      return parseTranscriptDataChannelEvent(record, eventType, 'source', 'final', [
        'transcript',
        'text',
      ]);

    case 'translation.translated_transcript.delta':
    case 'translation.translation_transcript.delta':
    case 'response.audio_transcript.delta':
      return parseTranscriptDataChannelEvent(record, eventType, 'translated', 'delta', [
        'delta',
        'text',
      ]);

    case 'translation.translated_transcript.done':
    case 'translation.translated_transcript.final':
    case 'translation.translation_transcript.done':
    case 'translation.translation_transcript.final':
    case 'response.audio_transcript.done':
      return parseTranscriptDataChannelEvent(record, eventType, 'translated', 'final', [
        'transcript',
        'text',
      ]);

    default:
      return {
        ok: true,
        kind: 'unknown',
        eventType,
        raw: record,
      };
  }
}

export function applyOpenAITranslationTranscriptEvent(
  entries: readonly OpenAITranslationTranscriptEntry[],
  event: OpenAITranslationTranscriptEvent,
  updatedAt = Date.now()
): readonly OpenAITranslationTranscriptEntry[] {
  const existingIndex = entries.findIndex(
    (entry) => entry.id === event.id && entry.stream === event.stream
  );
  const existing = existingIndex >= 0 ? entries[existingIndex] : null;
  const nextEntry = buildOpenAITranslationTranscriptEntry(existing, event, updatedAt);

  if (existingIndex < 0) {
    return [...entries, nextEntry];
  }

  return entries.map((entry, index) => (index === existingIndex ? nextEntry : entry));
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

function parseDataChannelRecord(data: unknown):
  | { readonly ok: true; readonly record: Readonly<Record<string, unknown>> }
  | {
      readonly ok: false;
      readonly kind: 'invalid';
      readonly error: OpenAITranslationRuntimeError;
    } {
  if (typeof data === 'string') {
    try {
      const parsed: unknown = JSON.parse(data);
      if (isRecord(parsed)) {
        return { ok: true, record: parsed };
      }

      return {
        ok: false,
        kind: 'invalid',
        error: createOpenAITranslationRuntimeError(
          'parser',
          'OpenAI translation event was not an object',
          { code: 'invalid-event-shape' }
        ),
      };
    } catch {
      return {
        ok: false,
        kind: 'invalid',
        error: createOpenAITranslationRuntimeError(
          'parser',
          'OpenAI translation event was not valid JSON',
          { code: 'malformed-json' }
        ),
      };
    }
  }

  if (isRecord(data)) {
    return { ok: true, record: data };
  }

  return {
    ok: false,
    kind: 'invalid',
    error: createOpenAITranslationRuntimeError(
      'parser',
      'OpenAI translation event payload was not readable',
      { code: 'unreadable-event' }
    ),
  };
}

function parseTranscriptDataChannelEvent(
  record: Readonly<Record<string, unknown>>,
  rawType: string,
  stream: OpenAITranslationTranscriptStream,
  phase: OpenAITranslationTranscriptEventPhase,
  textFields: readonly string[]
): OpenAITranslationDataChannelParseResult {
  const text = readFirstStringField(record, textFields);
  if (text === null) {
    return {
      ok: false,
      kind: 'invalid',
      error: createOpenAITranslationRuntimeError(
        'parser',
        `OpenAI translation transcript event ${rawType} was missing text`,
        { code: 'missing-transcript-text' }
      ),
    };
  }

  const event: OpenAITranslationTranscriptEvent = {
    id:
      readFirstStringField(record, [
        'item_id',
        'itemId',
        'response_id',
        'responseId',
        'event_id',
        'eventId',
        'id',
      ]) ?? `${stream}:${rawType}`,
    stream,
    phase,
    text,
    rawType,
  };

  return {
    ok: true,
    kind: 'transcript',
    event,
  };
}

function readFirstStringField(
  record: Readonly<Record<string, unknown>>,
  fieldNames: readonly string[]
): string | null {
  for (const fieldName of fieldNames) {
    const value = record[fieldName];
    if (typeof value === 'string') {
      return value;
    }
  }

  return null;
}

async function fetchOpenAITranslationWithRetry(
  request: {
    readonly url: string;
    readonly init: RequestInit;
    readonly signal?: AbortSignal;
    readonly fetcher?: OpenAITranslationFetch;
    readonly timeoutMs?: number;
    readonly retryCount?: number;
    readonly retryDelayMs?: number;
  },
  errorKind: OpenAITranslationErrorKind,
  failureMessage: string
): Promise<Response> {
  const fetcher = resolveOpenAITranslationFetch(request.fetcher);
  const retryCount = Math.max(0, request.retryCount ?? OPENAI_TRANSLATION_RUNTIME_RETRY_COUNT);
  const retryDelayMs = Math.max(
    0,
    request.retryDelayMs ?? OPENAI_TRANSLATION_RUNTIME_RETRY_DELAY_MS
  );
  let lastError: OpenAITranslationRuntimeError | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const abortScope = createOpenAITranslationAbortScope(
      request.signal,
      request.timeoutMs ?? OPENAI_TRANSLATION_RUNTIME_REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetcher(request.url, {
        ...request.init,
        signal: abortScope.signal,
      });

      if (
        response.ok ||
        !shouldRetryOpenAITranslationStatus(response.status) ||
        attempt >= retryCount
      ) {
        abortScope.cleanup();
        return response;
      }

      lastError = createOpenAITranslationRuntimeError(
        errorKind,
        `${failureMessage}: HTTP ${response.status}`,
        { status: response.status, code: 'retryable-http-status' }
      );
    } catch (error) {
      lastError = mapOpenAITranslationFetchError(error, errorKind, failureMessage, abortScope);
      if (lastError.kind === 'aborted' || attempt >= retryCount) {
        abortScope.cleanup();
        throw lastError;
      }
    } finally {
      abortScope.cleanup();
    }

    await waitForOpenAITranslationRetryDelay(retryDelayMs, request.signal);
  }

  throw (
    lastError ??
    createOpenAITranslationRuntimeError(errorKind, failureMessage, {
      code: 'request-failed',
    })
  );
}

async function parseOpenAITranslationJson(
  response: Response,
  errorKind: OpenAITranslationErrorKind
): Promise<unknown> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw createOpenAITranslationRuntimeError(
      errorKind,
      response.ok
        ? 'OpenAI translation response was not valid JSON'
        : 'OpenAI translation error response was not valid JSON',
      { status: response.status, code: 'invalid-json-response' }
    );
  }

  if (!response.ok) {
    throw createOpenAITranslationRuntimeError(
      errorKind,
      readOpenAITranslationErrorMessage(data) ??
        `OpenAI translation request failed with HTTP ${response.status}`,
      { status: response.status, code: 'http-error' }
    );
  }

  return data;
}

async function parseOpenAITranslationText(
  response: Response,
  errorKind: OpenAITranslationErrorKind
): Promise<string> {
  let text: string;

  try {
    text = await response.text();
  } catch {
    throw createOpenAITranslationRuntimeError(
      errorKind,
      response.ok
        ? 'OpenAI translation response text was not readable'
        : 'OpenAI translation error response text was not readable',
      { status: response.status, code: 'invalid-text-response' }
    );
  }

  if (!response.ok) {
    throw createOpenAITranslationRuntimeError(
      errorKind,
      text.trim().length > 0
        ? text.trim()
        : `OpenAI translation request failed with HTTP ${response.status}`,
      { status: response.status, code: 'http-error' }
    );
  }

  return text;
}

function normalizeOpenAITranslationSessionResponse(
  data: unknown,
  requestedTargetLanguage: OpenAITranslationTargetLanguageCode
): OpenAITranslationSessionResponse {
  if (!isRecord(data)) {
    throw createOpenAITranslationRuntimeError(
      'client-secret',
      'OpenAI translation client-secret response was not an object',
      { code: 'invalid-client-secret-response' }
    );
  }

  const clientSecret = readNonEmptyString(data.clientSecret);
  const expiresAt = readNonEmptyString(data.expiresAt);
  const model = readNonEmptyString(data.model);
  const targetLanguage = normalizeTranslationTargetLanguage(data.targetLanguage);

  if (!clientSecret || !expiresAt || !model || targetLanguage !== requestedTargetLanguage) {
    throw createOpenAITranslationRuntimeError(
      'client-secret',
      'OpenAI translation client-secret response did not match the expected contract',
      { code: 'invalid-client-secret-response' }
    );
  }

  return {
    clientSecret,
    expiresAt,
    targetLanguage,
    model,
  };
}

function readOpenAITranslationErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) {
    return null;
  }

  const errorResponse = data as Partial<OpenAITranslationErrorResponse>;
  const message = readNonEmptyString(errorResponse.message);
  if (message) {
    return message;
  }

  return readNonEmptyString(errorResponse.error);
}

function resolveOpenAITranslationFetch(fetcher?: OpenAITranslationFetch): OpenAITranslationFetch {
  if (fetcher) {
    return fetcher;
  }

  if (typeof globalThis.fetch !== 'function') {
    throw createOpenAITranslationRuntimeError(
      'client-secret',
      'Fetch is unavailable in this browser',
      { recoverable: false, code: 'fetch-unavailable' }
    );
  }

  return globalThis.fetch.bind(globalThis);
}

function buildOpenAITranslationApiUrl(apiBaseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedBaseUrl.length > 0 ? `${normalizedBaseUrl}${normalizedPath}` : normalizedPath;
}

function createOpenAITranslationAbortScope(
  parentSignal: AbortSignal | undefined,
  timeoutMs: number
): {
  readonly signal: AbortSignal;
  readonly didTimeout: () => boolean;
  readonly wasParentAborted: () => boolean;
  readonly cleanup: () => void;
} {
  const controller = new AbortController();
  let timedOut = false;
  let parentAborted = parentSignal?.aborted === true;
  const abortFromParent = (): void => {
    parentAborted = true;
    controller.abort();
  };
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener('abort', abortFromParent, { once: true });
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    wasParentAborted: () => parentAborted,
    cleanup: () => {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener('abort', abortFromParent);
    },
  };
}

function mapOpenAITranslationFetchError(
  error: unknown,
  errorKind: OpenAITranslationErrorKind,
  failureMessage: string,
  abortScope: {
    readonly didTimeout: () => boolean;
    readonly wasParentAborted: () => boolean;
  }
): OpenAITranslationRuntimeError {
  if (abortScope.wasParentAborted()) {
    return createOpenAITranslationRuntimeError(
      'aborted',
      'OpenAI translation request was aborted',
      { code: 'request-aborted' }
    );
  }

  if (abortScope.didTimeout()) {
    return createOpenAITranslationRuntimeError(errorKind, `${failureMessage}: request timed out`, {
      code: 'request-timeout',
    });
  }

  if (isOpenAITranslationRuntimeError(error)) {
    return error;
  }

  return createOpenAITranslationRuntimeError(errorKind, failureMessage, {
    code: 'network-error',
  });
}

async function waitForOpenAITranslationRetryDelay(
  retryDelayMs: number,
  signal: AbortSignal | undefined
): Promise<void> {
  if (retryDelayMs === 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abort);
    };
    const finish = (): void => {
      cleanup();
      resolve();
    };
    const abort = (): void => {
      cleanup();
      reject(
        createOpenAITranslationRuntimeError(
          'aborted',
          'OpenAI translation retry wait was aborted',
          { code: 'retry-aborted' }
        )
      );
    };
    const timeoutId = setTimeout(finish, retryDelayMs);

    if (signal?.aborted) {
      abort();
      return;
    }

    signal?.addEventListener('abort', abort, { once: true });
  });
}

function buildOpenAITranslationSourceCapability({
  mode,
  mediaDevices,
  apiName,
  isSecureContext,
}: {
  readonly mode: OpenAITranslationSourceMode;
  readonly mediaDevices: OpenAITranslationMediaDeviceAccess | null | undefined;
  readonly apiName: 'getUserMedia' | 'getDisplayMedia';
  readonly isSecureContext: boolean;
}): OpenAITranslationSourceCapability {
  const metadata = getOpenAITranslationSourceModeMetadata(mode);

  if (!mediaDevices) {
    return {
      mode,
      supported: false,
      canRequest: false,
      status: 'unavailable',
      message: `${metadata.label} requires navigator.mediaDevices support.`,
    };
  }

  if (typeof mediaDevices[apiName] !== 'function') {
    return {
      mode,
      supported: false,
      canRequest: false,
      status: 'unsupported',
      message: `${metadata.label} is not supported by this browser.`,
    };
  }

  if (!isSecureContext) {
    return {
      mode,
      supported: true,
      canRequest: false,
      status: 'restricted',
      message: `${metadata.label} requires a secure browser context.`,
    };
  }

  return {
    mode,
    supported: true,
    canRequest: true,
    status: 'available',
    message: null,
  };
}

function resolveMediaDevices(): OpenAITranslationMediaDeviceAccess | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return navigator.mediaDevices ?? null;
}

function resolveSecureContext(): boolean {
  const secureContext = (globalThis as { readonly isSecureContext?: boolean }).isSecureContext;
  return typeof secureContext === 'boolean' ? secureContext : true;
}

function readOptionalBoolean(value: unknown, fieldName: string): boolean | null {
  if (typeof value === 'undefined') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  throw createOpenAITranslationSourceError(
    'capture-failed',
    'browser-tab',
    `displayMediaOptions.${fieldName}: must be a boolean`,
    { recoverable: false, code: 'invalid-display-media-options' }
  );
}

function readErrorName(error: unknown): string | null {
  if (!isRecord(error)) {
    return null;
  }

  const name = error.name;
  return typeof name === 'string' && name.length > 0 ? name : null;
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function buildOpenAITranslationTranscriptEntry(
  existing: OpenAITranslationTranscriptEntry | null,
  event: OpenAITranslationTranscriptEvent,
  updatedAt: number
): OpenAITranslationTranscriptEntry {
  switch (event.phase) {
    case 'delta':
      return {
        id: event.id,
        stream: event.stream,
        text: `${existing?.text ?? ''}${event.text}`,
        isFinal: false,
        updatedAt,
      };

    case 'final':
      return {
        id: event.id,
        stream: event.stream,
        text: event.text,
        isFinal: true,
        updatedAt,
      };

    default:
      return assertNeverTranscriptPhase(event.phase);
  }
}

function assertNeverTranscriptPhase(phase: never): OpenAITranslationTranscriptEntry {
  throw new Error(`Unhandled OpenAI translation transcript phase: ${String(phase)}`);
}

function assertNeverOpenAITranslationSourceMode(mode: never): never {
  throw new Error(`Unhandled OpenAI translation source mode: ${String(mode)}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
