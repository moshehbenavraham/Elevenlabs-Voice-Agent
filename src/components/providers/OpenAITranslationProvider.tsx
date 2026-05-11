import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { Languages, Play, Square } from 'lucide-react';
import { OpenAITranslationAudioPlayer } from '@/components/providers/OpenAITranslationAudioPlayer';
import { OpenAITranslationLanguageSelect } from '@/components/providers/OpenAITranslationLanguageSelect';
import { OpenAITranslationSourceSelector } from '@/components/providers/OpenAITranslationSourceSelector';
import {
  OpenAITranslationStatusPanel,
  type OpenAITranslationUiStatus,
} from '@/components/providers/OpenAITranslationStatusPanel';
import { useOpenAITranslation } from '@/hooks/useOpenAITranslation';
import { useOpenAITranslationSource } from '@/hooks/useOpenAITranslationSource';
import {
  OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE,
  getOpenAITranslationSourceCapability,
  getOpenAITranslationSourceModes,
  getOpenAITranslationSourceModeMetadata,
  getTranslationTargetLanguage,
  isOpenAITranslationBusyStatus,
} from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type {
  OpenAITranslationHookStatus,
  OpenAITranslationRuntimeError,
  OpenAITranslationSourceError,
  OpenAITranslationSourceCapabilities,
  OpenAITranslationSourceMode,
  OpenAITranslationSourceStatus,
  OpenAITranslationTargetLanguageCode,
} from '@/types/openai-translation';

interface OpenAITranslationProviderProps {
  readonly className?: string;
  readonly isLoading?: boolean;
  readonly isEmpty?: boolean;
  readonly isOffline?: boolean;
  readonly errorMessage?: string | null;
  readonly stopRef?: MutableRefObject<(() => Promise<void>) | null>;
}

interface PendingStart {
  readonly operationId: number;
  readonly mode: OpenAITranslationSourceMode;
  readonly targetLanguage: OpenAITranslationTargetLanguageCode;
}

type TranslationAction = 'start' | 'stop';

const HEADER_STATUS_ITEMS = [
  'Capture starts only after Start is pressed.',
  'Client secrets stay behind the backend route.',
  'Translated audio plays through the browser audio element.',
] as const;

export function OpenAITranslationProvider({
  className,
  isOffline = false,
  errorMessage = null,
  stopRef,
}: OpenAITranslationProviderProps) {
  const sourceController = useOpenAITranslationSource();
  const runtime = useOpenAITranslation();
  const {
    capabilities: sourceCapabilities,
    captureBrowserTab,
    captureMicrophone,
    error: sourceError,
    isReady: isSourceReady,
    isRequesting: isSourceRequesting,
    refreshCapabilities,
    source: capturedSource,
    status: sourceStatus,
    stop: stopSource,
  } = sourceController;
  const {
    error: runtimeError,
    isConnected: isRuntimeConnected,
    isStarting: isRuntimeStarting,
    reset: resetRuntime,
    start: runtimeStart,
    status: runtimeStatus,
    stop: stopRuntime,
    translatedAudioStream,
  } = runtime;
  const [selectedSourceMode, setSelectedSourceMode] = useState<OpenAITranslationSourceMode>(() =>
    resolveInitialSourceMode(sourceCapabilities)
  );
  const [targetLanguage, setTargetLanguage] = useState<OpenAITranslationTargetLanguageCode>(
    OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE
  );
  const [actionInFlight, setActionInFlight] = useState<TranslationAction | null>(null);
  const [pendingStart, setPendingStart] = useState<PendingStart | null>(null);
  const operationIdRef = useRef(0);
  const pendingStartRef = useRef<PendingStart | null>(null);
  const stopPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    refreshCapabilities();
  }, [refreshCapabilities]);

  const preferredSourceCapability = getOpenAITranslationSourceCapability(
    sourceCapabilities,
    selectedSourceMode
  );
  const fallbackSourceMode = resolveAvailableSourceMode(sourceCapabilities);
  const activeSourceMode =
    preferredSourceCapability.canRequest || !fallbackSourceMode
      ? selectedSourceMode
      : fallbackSourceMode;
  const selectedCapability = getOpenAITranslationSourceCapability(
    sourceCapabilities,
    activeSourceMode
  );
  const selectedSourceLabel = getOpenAITranslationSourceModeMetadata(activeSourceMode).shortLabel;
  const targetLanguageLabel =
    getTranslationTargetLanguage(targetLanguage)?.label ?? targetLanguage.toUpperCase();
  const isRuntimeBusy = isOpenAITranslationBusyStatus(runtimeStatus);
  const isStartPending = actionInFlight === 'start' || isSourceRequesting || isRuntimeStarting;
  const isStopPending = actionInFlight === 'stop' || runtimeStatus === 'stopping';
  const areConfigurationControlsDisabled =
    actionInFlight !== null || isSourceRequesting || isRuntimeBusy || isRuntimeConnected;
  const isStartDisabled =
    isOffline ||
    Boolean(errorMessage) ||
    !selectedCapability.canRequest ||
    actionInFlight !== null ||
    isSourceRequesting ||
    isRuntimeStarting ||
    isRuntimeConnected ||
    runtimeStatus === 'stopping';
  const canStop =
    actionInFlight === 'start' ||
    isSourceRequesting ||
    isSourceReady ||
    isRuntimeStarting ||
    isRuntimeConnected ||
    runtimeStatus === 'stopping';
  const isStopDisabled = !canStop || isStopPending;
  const uiStatus = useMemo(
    () =>
      deriveOpenAITranslationUiStatus({
        errorMessage,
        isOffline,
        isStartPending,
        isStopPending,
        runtimeError,
        runtimeStatus,
        translatedAudioStream,
        selectedSourceLabel,
        sourceError,
        sourceStatus,
        targetLanguageLabel,
      }),
    [
      errorMessage,
      isOffline,
      isStartPending,
      isStopPending,
      runtimeError,
      runtimeStatus,
      translatedAudioStream,
      selectedSourceLabel,
      sourceError,
      sourceStatus,
      targetLanguageLabel,
    ]
  );

  const handleStart = useCallback(async (): Promise<void> => {
    if (isStartDisabled) {
      return;
    }

    const operationId = operationIdRef.current + 1;
    operationIdRef.current = operationId;
    const nextPendingStart: PendingStart = {
      operationId,
      mode: activeSourceMode,
      targetLanguage,
    };

    pendingStartRef.current = nextPendingStart;
    setPendingStart(nextPendingStart);
    setActionInFlight('start');
    resetRuntime();

    const captured =
      activeSourceMode === 'microphone' ? await captureMicrophone() : await captureBrowserTab();

    if (!captured && pendingStartRef.current?.operationId === operationId) {
      pendingStartRef.current = null;
      setPendingStart(null);
      setActionInFlight(null);
    }
  }, [
    activeSourceMode,
    captureBrowserTab,
    captureMicrophone,
    isStartDisabled,
    resetRuntime,
    targetLanguage,
  ]);

  const stopTranslation = useCallback(async (): Promise<void> => {
    if (stopPromiseRef.current) {
      return stopPromiseRef.current;
    }

    operationIdRef.current += 1;
    pendingStartRef.current = null;
    setPendingStart(null);

    const stopPromise = (async (): Promise<void> => {
      setActionInFlight('stop');
      try {
        await stopRuntime();
      } finally {
        stopSource();
        setActionInFlight(null);
      }
    })();

    stopPromiseRef.current = stopPromise;
    try {
      await stopPromise;
    } finally {
      if (stopPromiseRef.current === stopPromise) {
        stopPromiseRef.current = null;
      }
    }
  }, [stopRuntime, stopSource]);

  useEffect(() => {
    if (!pendingStart || !capturedSource || sourceStatus !== 'ready') {
      return undefined;
    }

    if (
      pendingStartRef.current?.operationId !== pendingStart.operationId ||
      capturedSource.mode !== pendingStart.mode
    ) {
      return undefined;
    }

    const readySource = capturedSource;
    let cancelled = false;
    pendingStartRef.current = null;

    const startRuntimeOperation = async (): Promise<void> => {
      try {
        const started = await runtimeStart({
          sourceStream: readySource.sourceStream,
          targetLanguage: pendingStart.targetLanguage,
          ownsSourceStream: readySource.ownsSourceStream,
        });

        if (cancelled) {
          return;
        }

        if (!started) {
          stopSource();
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[OpenAITranslationProvider] Failed to start translation runtime', error);
          stopSource();
        }
      } finally {
        if (!cancelled) {
          setPendingStart((currentPendingStart) =>
            currentPendingStart?.operationId === pendingStart.operationId
              ? null
              : currentPendingStart
          );
          setActionInFlight((currentAction) => (currentAction === 'start' ? null : currentAction));
        }
      }
    };

    void startRuntimeOperation();

    return () => {
      cancelled = true;
    };
  }, [capturedSource, pendingStart, runtimeStart, sourceStatus, stopSource]);

  useEffect(() => {
    if (!stopRef) {
      return undefined;
    }

    stopRef.current = stopTranslation;

    return () => {
      if (stopRef.current === stopTranslation) {
        stopRef.current = null;
      }
    };
  }, [stopRef, stopTranslation]);

  return (
    <motion.section
      key="openai-translation-provider"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={cn('min-h-screen px-4 py-28 sm:px-6', className)}
      aria-labelledby="openai-translation-title"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex flex-col gap-5 rounded-xl border border-white/10 bg-zinc-950/60 p-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <Languages className="h-6 w-6 text-emerald-300" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
                OpenAI Realtime Translation
              </p>
              <h1
                id="openai-translation-title"
                className="mt-2 font-display text-4xl text-zinc-100"
              >
                Live Translation
              </h1>
              <ul className="mt-3 grid gap-1 text-sm leading-6 text-zinc-500 sm:grid-cols-3">
                {HEADER_STATUS_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[280px]">
            <button
              type="button"
              onClick={() => {
                void handleStart();
              }}
              disabled={isStartDisabled}
              aria-busy={isStartPending}
              className={cn(
                'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-3',
                'border border-emerald-500/30 bg-emerald-500/15 text-sm font-medium text-emerald-100',
                'transition-colors hover:bg-emerald-500/20',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-emerald-500/15'
              )}
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Start translation
            </button>
            <button
              type="button"
              onClick={() => {
                void stopTranslation();
              }}
              disabled={isStopDisabled}
              aria-busy={isStopPending}
              className={cn(
                'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-3',
                'border border-red-500/25 bg-red-500/10 text-sm font-medium text-red-100',
                'transition-colors hover:bg-red-500/15',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60',
                'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-red-500/10'
              )}
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              Stop translation
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <OpenAITranslationSourceSelector
            selectedMode={activeSourceMode}
            capabilities={sourceCapabilities}
            disabled={areConfigurationControlsDisabled}
            onModeChange={setSelectedSourceMode}
          />
          <OpenAITranslationLanguageSelect
            value={targetLanguage}
            disabled={areConfigurationControlsDisabled}
            onChange={setTargetLanguage}
          />
        </div>

        <OpenAITranslationStatusPanel
          status={uiStatus}
          sourceStatus={sourceStatus}
          runtimeStatus={runtimeStatus}
        />

        <OpenAITranslationAudioPlayer
          stream={translatedAudioStream}
          disabled={!translatedAudioStream}
        />
      </div>
    </motion.section>
  );
}

interface OpenAITranslationUiStatusInput {
  readonly errorMessage: string | null;
  readonly isOffline: boolean;
  readonly isStartPending: boolean;
  readonly isStopPending: boolean;
  readonly runtimeError: OpenAITranslationRuntimeError | null;
  readonly runtimeStatus: OpenAITranslationHookStatus;
  readonly selectedSourceLabel: string;
  readonly sourceError: OpenAITranslationSourceError | null;
  readonly sourceStatus: OpenAITranslationSourceStatus;
  readonly targetLanguageLabel: string;
  readonly translatedAudioStream: MediaStream | null;
}

function deriveOpenAITranslationUiStatus({
  errorMessage,
  isOffline,
  isStartPending,
  isStopPending,
  runtimeError,
  runtimeStatus,
  selectedSourceLabel,
  sourceError,
  sourceStatus,
  targetLanguageLabel,
  translatedAudioStream,
}: OpenAITranslationUiStatusInput): OpenAITranslationUiStatus {
  const details = [
    `Source: ${describeSourceStatus(sourceStatus)}`,
    `Runtime: ${describeRuntimeStatus(runtimeStatus)}`,
    `Selected: ${selectedSourceLabel} to ${targetLanguageLabel}`,
  ];

  if (errorMessage) {
    return {
      tone: 'error',
      title: 'Translation unavailable',
      message: errorMessage,
      details,
    };
  }

  if (isOffline) {
    return {
      tone: 'warning',
      title: 'Browser offline',
      message: 'Reconnect before starting a translation session.',
      details,
    };
  }

  if (runtimeError || sourceError) {
    const error = runtimeError ?? sourceError;
    return {
      tone: 'error',
      title: formatErrorTitle(error),
      message: error?.message ?? 'Translation failed unexpectedly.',
      details: appendErrorCode(details, error),
    };
  }

  if (isStopPending || runtimeStatus === 'stopping') {
    return {
      tone: 'busy',
      title: 'Stopping translation',
      message: 'Runtime and source resources are being released.',
      details,
    };
  }

  if (runtimeStatus === 'requesting-client-secret') {
    return {
      tone: 'busy',
      title: 'Requesting client secret',
      message: 'The backend translation route is preparing an ephemeral session.',
      details,
    };
  }

  if (runtimeStatus === 'connecting') {
    return {
      tone: 'busy',
      title: 'Connecting translation',
      message: 'WebRTC negotiation is in progress.',
      details,
    };
  }

  if (sourceStatus === 'requesting' || isStartPending) {
    return {
      tone: 'busy',
      title: 'Requesting audio source',
      message: 'Approve the selected browser audio source to continue.',
      details,
    };
  }

  if (runtimeStatus === 'connected') {
    return {
      tone: 'success',
      title: 'Translation connected',
      message: translatedAudioStream
        ? 'Translated audio is attached and ready for playback.'
        : 'Translation is connected and waiting for remote audio.',
      details,
    };
  }

  if (sourceStatus === 'ready') {
    return {
      tone: 'success',
      title: 'Audio source ready',
      message: 'The selected source is captured and ready for translation startup.',
      details,
    };
  }

  if (sourceStatus === 'ended') {
    return {
      tone: 'warning',
      title: 'Audio source ended',
      message: 'Choose a source and start again when audio is available.',
      details,
    };
  }

  if (runtimeStatus === 'stopped' || sourceStatus === 'stopped') {
    return {
      tone: 'idle',
      title: 'Translation stopped',
      message: 'Resources were released and the controls are ready for another session.',
      details,
    };
  }

  return {
    tone: 'idle',
    title: 'Ready to translate',
    message: 'Choose a source and target language, then start translation.',
    details,
  };
}

function resolveInitialSourceMode(
  capabilities: OpenAITranslationSourceCapabilities
): OpenAITranslationSourceMode {
  return resolveAvailableSourceMode(capabilities) ?? 'microphone';
}

function resolveAvailableSourceMode(
  capabilities: OpenAITranslationSourceCapabilities
): OpenAITranslationSourceMode | null {
  return (
    getOpenAITranslationSourceModes().find((sourceMode) => {
      return getOpenAITranslationSourceCapability(capabilities, sourceMode.mode).canRequest;
    })?.mode ?? null
  );
}

function describeSourceStatus(status: OpenAITranslationSourceStatus): string {
  switch (status) {
    case 'idle':
      return 'idle';
    case 'requesting':
      return 'requesting source';
    case 'ready':
      return 'source ready';
    case 'ended':
      return 'source ended';
    case 'stopped':
      return 'source stopped';
    case 'error':
      return 'source error';
    default:
      return assertNeverSourceStatus(status);
  }
}

function describeRuntimeStatus(status: OpenAITranslationHookStatus): string {
  switch (status) {
    case 'idle':
      return 'idle';
    case 'requesting-client-secret':
      return 'requesting client secret';
    case 'connecting':
      return 'connecting';
    case 'connected':
      return 'connected';
    case 'stopping':
      return 'stopping';
    case 'stopped':
      return 'stopped';
    case 'error':
      return 'runtime error';
    default:
      return assertNeverRuntimeStatus(status);
  }
}

function formatErrorTitle(
  error: OpenAITranslationRuntimeError | OpenAITranslationSourceError | null | undefined
): string {
  if (!error) {
    return 'Translation error';
  }

  switch (error.kind) {
    case 'permission-denied':
      return 'Source permission denied';
    case 'capture-cancelled':
      return 'Source selection cancelled';
    case 'missing-audio-track':
      return 'No audio track found';
    case 'offline':
      return 'Browser offline';
    case 'client-secret':
      return 'Client secret request failed';
    case 'sdp-exchange':
      return 'SDP exchange failed';
    case 'webrtc':
      return 'WebRTC connection failed';
    case 'cleanup':
      return 'Cleanup failed';
    default:
      return 'Translation error';
  }
}

function appendErrorCode(
  details: readonly string[],
  error: OpenAITranslationRuntimeError | OpenAITranslationSourceError | null | undefined
): readonly string[] {
  if (!error?.code) {
    return details;
  }

  return [...details, `Code: ${error.code}`];
}

function assertNeverSourceStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation source status: ${String(status)}`);
}

function assertNeverRuntimeStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation runtime status: ${String(status)}`);
}
