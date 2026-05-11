/**
 * Type exports barrel file
 */

export type {
  ProviderType,
  ConnectionStatus,
  VoiceProviderState,
  VoiceProvider,
  ProviderConfig,
  MessageRole,
  VoiceMessage,
  FunctionCall,
  FunctionCallStatus,
} from './voice-provider';

export { PROVIDERS, DEFAULT_PROVIDER } from './voice-provider';

export type {
  UltravoxSessionStatus,
  UltravoxRole,
  UltravoxMedium,
  UltravoxTranscript,
  UltravoxCallRequest,
  UltravoxCallResponse,
  UltravoxErrorResponse,
  UltravoxHealthResponse,
  UltravoxVoice,
  UltravoxConnectionStatus,
  UltravoxVoiceState,
  UltravoxVoiceContextValue,
} from './ultravox';

export { mapUltravoxStatus } from './ultravox';

export { VapiMessageType, VapiMessageRole, VapiTranscriptType, VapiCallStatus } from './vapi';

export type {
  VapiBaseMessage,
  VapiTranscriptMessage,
  VapiFunctionCallMessage,
  VapiFunctionCallResultMessage,
  VapiMessage,
  VapiVoiceState,
  VapiStartConfig,
  VapiVoiceHookReturn,
} from './vapi';

export type {
  GeminiConnectionStatus,
  GeminiVoiceState,
  GeminiVoiceContextValue,
  GeminiVoiceAction,
  GeminiVoiceHookReturn,
} from './gemini';

export { GEMINI_SESSION_TIMERS, GEMINI_INITIAL_STATE } from './gemini';

export type {
  OpenAITranslationTargetLanguageCode,
  OpenAITranslationTargetLanguage,
  OpenAITranslationTargetLanguageValidationSuccess,
  OpenAITranslationTargetLanguageValidationFailure,
  OpenAITranslationTargetLanguageValidationResult,
  OpenAITranslationSessionRequest,
  OpenAITranslationSessionResponse,
  OpenAITranslationErrorResponse,
  OpenAITranslationSessionRequestDescriptor,
  OpenAITranslationNoiseReductionType,
  OpenAITranslationInputTranscriptionConfig,
  OpenAITranslationNoiseReductionConfig,
  OpenAITranslationInputAudioConfig,
  OpenAITranslationOutputAudioConfig,
  OpenAITranslationAudioConfig,
  OpenAITranslationSessionConfig,
  OpenAITranslationSessionUpdateConfig,
  OpenAITranslationSessionUpdatePayload,
  OpenAITranslationSessionConfigOptions,
  OpenAITranslationAudioMixState,
  OpenAITranslationAutoStopReason,
  OpenAITranslationSessionEndReason,
  OpenAITranslationMaxSessionConfig,
  OpenAITranslationSourceMode,
  OpenAITranslationSourceStatus,
  OpenAITranslationSourceCapabilityStatus,
  OpenAITranslationSourceErrorKind,
  OpenAITranslationSourceModeMetadata,
  OpenAITranslationSourceCapability,
  OpenAITranslationSourceCapabilities,
  OpenAITranslationSourceError,
  OpenAITranslationSourceResult,
  OpenAITranslationDisplayMediaOptionInput,
  UseOpenAITranslationSourceResult,
  OpenAITranslationHookStatus,
  OpenAITranslationErrorKind,
  OpenAITranslationRuntimeError,
  OpenAITranslationTranscriptStream,
  OpenAITranslationTranscriptEventPhase,
  OpenAITranslationTranscriptEntry,
  OpenAITranslationSessionMetadata,
  OpenAITranslationTranscriptExportPayload,
  OpenAITranslationTranscriptEvent,
  OpenAITranslationKnownDataChannelEvent,
  OpenAITranslationUnknownDataChannelEvent,
  OpenAITranslationInvalidDataChannelEvent,
  OpenAITranslationDataChannelParseResult,
  OpenAITranslationFetch,
  OpenAITranslationRuntimeRequestOptions,
  OpenAITranslationSdpExchangeOptions,
  OpenAITranslationStartOptions,
  UseOpenAITranslationResult,
} from './openai-translation';
