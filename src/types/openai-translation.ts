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

export type OpenAITranslationRouteErrorCategory =
  | 'validation'
  | 'server-configuration'
  | 'openai-auth'
  | 'openai-rate-limit'
  | 'openai-service'
  | 'openai-timeout'
  | 'openai-response'
  | 'network'
  | 'unknown';

export interface OpenAITranslationErrorResponse {
  readonly error: string;
  readonly message: string;
  readonly category?: OpenAITranslationRouteErrorCategory;
  readonly code?: string;
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

export type OpenAITranslationAutoStopReason = 'max-session-duration';

export type OpenAITranslationSessionEndReason =
  | 'manual'
  | 'source-ended'
  | 'runtime-error'
  | 'provider-switch'
  | OpenAITranslationAutoStopReason;

export type OpenAITranslationRuntimeStopReason =
  | OpenAITranslationSessionEndReason
  | 'failed-start'
  | 'reset'
  | 'unmount';

export interface OpenAITranslationCleanupResult {
  readonly ok: boolean;
  readonly error: OpenAITranslationRuntimeError | null;
}

export interface OpenAITranslationMaxSessionConfig {
  readonly maxMinutes: number;
  readonly maxSeconds: number;
  readonly defaultMinutes: number;
  readonly hardMaxMinutes: number;
  readonly source: 'default' | 'configured' | 'capped';
}

export type OpenAITranslationSourceMode = 'microphone' | 'browser-tab';

export type OpenAITranslationSourceStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'ended'
  | 'stopped'
  | 'error';

export type OpenAITranslationSourceCapabilityStatus =
  | 'available'
  | 'restricted'
  | 'unavailable'
  | 'unsupported';

export type OpenAITranslationSourceErrorKind =
  | 'unsupported'
  | 'permission-denied'
  | 'capture-cancelled'
  | 'device-unavailable'
  | 'missing-audio-track'
  | 'track-ended'
  | 'capture-failed'
  | 'cleanup'
  | 'unknown';

export interface OpenAITranslationSourceModeMetadata {
  readonly mode: OpenAITranslationSourceMode;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly unavailableDescription: string;
  readonly actionLabel: string;
}

export interface OpenAITranslationSourceCapability {
  readonly mode: OpenAITranslationSourceMode;
  readonly supported: boolean;
  readonly canRequest: boolean;
  readonly status: OpenAITranslationSourceCapabilityStatus;
  readonly message: string | null;
}

export interface OpenAITranslationSourceCapabilities {
  readonly microphone: OpenAITranslationSourceCapability;
  readonly browserTab: OpenAITranslationSourceCapability;
}

export interface OpenAITranslationSourceError {
  readonly kind: OpenAITranslationSourceErrorKind;
  readonly mode: OpenAITranslationSourceMode | null;
  readonly message: string;
  readonly recoverable: boolean;
  readonly code?: string;
  readonly rawName?: string;
}

export interface OpenAITranslationSourceResult {
  readonly mode: OpenAITranslationSourceMode;
  readonly sourceStream: MediaStream;
  readonly audioTracks: readonly MediaStreamTrack[];
  readonly ownsSourceStream: true;
}

export interface OpenAITranslationDisplayMediaOptionInput {
  readonly preferCurrentTab?: unknown;
  readonly includeSystemAudio?: unknown;
  readonly surfaceSwitching?: unknown;
}

export interface UseOpenAITranslationSourceResult {
  readonly status: OpenAITranslationSourceStatus;
  readonly mode: OpenAITranslationSourceMode | null;
  readonly stream: MediaStream | null;
  readonly audioTracks: readonly MediaStreamTrack[];
  readonly source: OpenAITranslationSourceResult | null;
  readonly error: OpenAITranslationSourceError | null;
  readonly capabilities: OpenAITranslationSourceCapabilities;
  readonly isRequesting: boolean;
  readonly isReady: boolean;
  readonly canCaptureMicrophone: boolean;
  readonly canCaptureBrowserTab: boolean;
  readonly captureMicrophone: () => Promise<boolean>;
  readonly captureBrowserTab: () => Promise<boolean>;
  readonly stop: () => void;
  readonly reset: () => void;
  readonly refreshCapabilities: () => void;
}

export type OpenAITranslationHookStatus =
  | 'idle'
  | 'requesting-client-secret'
  | 'connecting'
  | 'connected'
  | 'stopping'
  | 'stopped'
  | 'error';

export type OpenAITranslationErrorKind =
  | 'validation'
  | 'client-secret'
  | 'sdp-exchange'
  | 'webrtc'
  | 'data-channel'
  | 'parser'
  | 'cleanup'
  | 'offline'
  | 'aborted'
  | 'unknown';

export interface OpenAITranslationRuntimeError {
  readonly kind: OpenAITranslationErrorKind;
  readonly message: string;
  readonly recoverable: boolean;
  readonly status?: number;
  readonly code?: string;
  readonly routeCategory?: OpenAITranslationRouteErrorCategory;
}

export type OpenAITranslationAudioStreamKind = 'translated' | 'original';

export interface OpenAITranslationPlaybackError {
  readonly streamKind: OpenAITranslationAudioStreamKind;
  readonly message: string;
  readonly recoverable: boolean;
  readonly code: string;
}

export type OpenAITranslationDiagnosticSeverity = 'info' | 'warning' | 'error';

export type OpenAITranslationDiagnosticCategory =
  | 'ready'
  | 'loading'
  | 'active'
  | 'stopped'
  | 'source-ready'
  | 'source-unsupported'
  | 'source-restricted'
  | 'source-unavailable'
  | 'source-permission'
  | 'source-cancelled'
  | 'source-missing-audio'
  | 'source-ended'
  | 'source-cleanup'
  | 'backend-validation'
  | 'backend-token'
  | 'backend-configuration'
  | 'backend-auth'
  | 'backend-rate-limit'
  | 'backend-service'
  | 'backend-timeout'
  | 'backend-response'
  | 'sdp-exchange'
  | 'webrtc-peer'
  | 'ice-connection'
  | 'data-channel'
  | 'parser'
  | 'remote-audio'
  | 'playback'
  | 'offline'
  | 'aborted'
  | 'cleanup'
  | 'validation'
  | 'unknown';

export type OpenAITranslationDiagnosticOwner =
  | 'source'
  | 'runtime'
  | 'backend'
  | 'browser'
  | 'provider'
  | 'audio';

export interface OpenAITranslationDiagnosticDetail {
  readonly label: string;
  readonly value: string;
}

export interface OpenAITranslationDiagnosticRecovery {
  readonly label: string;
  readonly description: string;
}

export interface OpenAITranslationDiagnostic {
  readonly category: OpenAITranslationDiagnosticCategory;
  readonly severity: OpenAITranslationDiagnosticSeverity;
  readonly owner: OpenAITranslationDiagnosticOwner;
  readonly title: string;
  readonly message: string;
  readonly recovery: OpenAITranslationDiagnosticRecovery;
  readonly details: readonly OpenAITranslationDiagnosticDetail[];
  readonly retryable: boolean;
  readonly code?: string;
  readonly status?: number;
}

export type OpenAITranslationTranscriptStream = 'source' | 'translated';
export type OpenAITranslationTranscriptEventPhase = 'delta' | 'final';
export type OpenAITranslationTranscriptDisplayStatus = 'partial' | 'final';

export interface OpenAITranslationTranscriptEntry {
  readonly id: string;
  readonly stream: OpenAITranslationTranscriptStream;
  readonly text: string;
  readonly isFinal: boolean;
  readonly updatedAt: number;
}

export interface OpenAITranslationTranscriptDisplayEntry extends OpenAITranslationTranscriptEntry {
  readonly sequence: number;
  readonly status: OpenAITranslationTranscriptDisplayStatus;
  readonly streamLabel: string;
  readonly statusLabel: string;
  readonly ariaLabel: string;
}

export interface OpenAITranslationTranscriptSummary {
  readonly totalCount: number;
  readonly sourceCount: number;
  readonly translatedCount: number;
  readonly finalCount: number;
  readonly partialCount: number;
  readonly hasEntries: boolean;
  readonly hasTranslatedCaption: boolean;
}

export interface OpenAITranslationSessionMetadata {
  readonly startedAt: number | null;
  readonly endedAt: number | null;
  readonly durationSeconds: number;
  readonly sourceMode: OpenAITranslationSourceMode | null;
  readonly targetLanguage: OpenAITranslationTargetLanguageCode;
  readonly endReason: OpenAITranslationSessionEndReason | null;
}

export interface OpenAITranslationTranscriptExportPayload {
  readonly metadata: OpenAITranslationSessionMetadata;
  readonly entries: readonly OpenAITranslationTranscriptEntry[];
  readonly generatedAt?: number;
}

export interface OpenAITranslationTranscriptEvent {
  readonly id: string;
  readonly stream: OpenAITranslationTranscriptStream;
  readonly phase: OpenAITranslationTranscriptEventPhase;
  readonly text: string;
  readonly rawType: string;
}

export interface OpenAITranslationKnownDataChannelEvent {
  readonly ok: true;
  readonly kind: 'transcript';
  readonly event: OpenAITranslationTranscriptEvent;
}

export interface OpenAITranslationUnknownDataChannelEvent {
  readonly ok: true;
  readonly kind: 'unknown';
  readonly eventType: string | null;
  readonly raw: Readonly<Record<string, unknown>>;
}

export interface OpenAITranslationInvalidDataChannelEvent {
  readonly ok: false;
  readonly kind: 'invalid';
  readonly error: OpenAITranslationRuntimeError;
}

export type OpenAITranslationDataChannelParseResult =
  | OpenAITranslationKnownDataChannelEvent
  | OpenAITranslationUnknownDataChannelEvent
  | OpenAITranslationInvalidDataChannelEvent;

export type OpenAITranslationFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export interface OpenAITranslationRuntimeRequestOptions {
  readonly targetLanguage: unknown;
  readonly signal?: AbortSignal;
  readonly fetcher?: OpenAITranslationFetch;
  readonly apiBaseUrl?: string;
  readonly timeoutMs?: number;
  readonly retryCount?: number;
  readonly retryDelayMs?: number;
}

export interface OpenAITranslationSdpExchangeOptions {
  readonly clientSecret: string;
  readonly offerSdp: string;
  readonly signal?: AbortSignal;
  readonly fetcher?: OpenAITranslationFetch;
  readonly endpoint?: string;
  readonly timeoutMs?: number;
  readonly retryCount?: number;
  readonly retryDelayMs?: number;
}

export interface OpenAITranslationStartOptions {
  readonly sourceStream: MediaStream;
  readonly targetLanguage: unknown;
  readonly ownsSourceStream?: boolean;
  readonly enableInputTranscription?: boolean;
  readonly enableNoiseReduction?: boolean;
  readonly noiseReductionType?: OpenAITranslationNoiseReductionType;
  readonly peerConnectionConfig?: RTCConfiguration;
}

export interface UseOpenAITranslationResult {
  readonly status: OpenAITranslationHookStatus;
  readonly error: OpenAITranslationRuntimeError | null;
  readonly translatedAudioStream: MediaStream | null;
  readonly transcripts: readonly OpenAITranslationTranscriptEntry[];
  readonly isStarting: boolean;
  readonly isConnected: boolean;
  readonly start: (options: OpenAITranslationStartOptions) => Promise<boolean>;
  readonly stop: (
    reason?: OpenAITranslationRuntimeStopReason
  ) => Promise<OpenAITranslationCleanupResult>;
  readonly clearTranscripts: () => void;
  readonly reset: () => void;
}
