import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { Languages, Play, Square } from 'lucide-react';
import { TranslationTranscriptPanel } from '@/components/conversation/TranslationTranscriptPanel';
import { OpenAITranslationAudioMixControls } from '@/components/providers/OpenAITranslationAudioMixControls';
import { OpenAITranslationAudioPlayer } from '@/components/providers/OpenAITranslationAudioPlayer';
import { OpenAITranslationDiagnosticsPanel } from '@/components/providers/OpenAITranslationDiagnosticsPanel';
import { OpenAITranslationExportControls } from '@/components/providers/OpenAITranslationExportControls';
import { OpenAITranslationLanguageSelect } from '@/components/providers/OpenAITranslationLanguageSelect';
import { OpenAITranslationLatestCaption } from '@/components/providers/OpenAITranslationLatestCaption';
import { OpenAITranslationSourceSelector } from '@/components/providers/OpenAITranslationSourceSelector';
import {
  OpenAITranslationStatusPanel,
  type OpenAITranslationUiStatus,
} from '@/components/providers/OpenAITranslationStatusPanel';
import { useOpenAITranslation } from '@/hooks/useOpenAITranslation';
import { useOpenAITranslationSessionTimer } from '@/hooks/useOpenAITranslationSessionTimer';
import { useOpenAITranslationSource } from '@/hooks/useOpenAITranslationSource';
import {
  OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT,
  OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE,
  buildOpenAITranslationDiagnostic,
  buildOpenAITranslationTranscriptMarkdown,
  buildTranslationAudioMixState,
  formatOpenAITranslationDuration,
  formatOpenAITranslationSessionEndReason,
  getOpenAITranslationSourceCapability,
  getOpenAITranslationSourceModes,
  getOpenAITranslationSourceModeMetadata,
  getLatestOpenAITranslationCaption,
  getTranslationTargetLanguage,
  isOpenAITranslationBusyStatus,
  normalizeOpenAITranslationMaxSessionConfig,
  summarizeOpenAITranslationTranscripts,
} from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type {
  OpenAITranslationHookStatus,
  OpenAITranslationPlaybackError,
  OpenAITranslationRuntimeError,
  OpenAITranslationRuntimeStopReason,
  OpenAITranslationAutoStopReason,
  OpenAITranslationSessionEndReason,
  OpenAITranslationSessionMetadata,
  OpenAITranslationSourceError,
  OpenAITranslationSourceCapabilities,
  OpenAITranslationSourceMode,
  OpenAITranslationSourceStatus,
  OpenAITranslationTargetLanguageCode,
  OpenAITranslationTranscriptSummary,
} from '@/types/openai-translation';

interface OpenAITranslationProviderProps {
  readonly className?: string;
  readonly isLoading?: boolean;
  readonly isEmpty?: boolean;
  readonly isOffline?: boolean;
  readonly errorMessage?: string | null;
  readonly stopRef?: MutableRefObject<
    ((reason?: OpenAITranslationSessionEndReason) => Promise<void>) | null
  >;
}

interface PendingStart {
  readonly operationId: number;
  readonly mode: OpenAITranslationSourceMode;
  readonly targetLanguage: OpenAITranslationTargetLanguageCode;
}

interface TranslationSessionState {
  readonly startedAt: number | null;
  readonly endedAt: number | null;
  readonly sourceMode: OpenAITranslationSourceMode | null;
  readonly targetLanguage: OpenAITranslationTargetLanguageCode;
  readonly endReason: OpenAITranslationSessionEndReason | null;
}

type TranslationAction = 'start' | 'stop';
type ProviderStopReason = OpenAITranslationSessionEndReason | 'failed-start' | 'retry-reset';

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
    clearTranscripts,
    isConnected: isRuntimeConnected,
    isStarting: isRuntimeStarting,
    reset: resetRuntime,
    start: runtimeStart,
    status: runtimeStatus,
    stop: stopRuntime,
    translatedAudioStream,
    transcripts,
  } = runtime;
  const [selectedSourceMode, setSelectedSourceMode] = useState<OpenAITranslationSourceMode>(() =>
    resolveInitialSourceMode(sourceCapabilities)
  );
  const [targetLanguage, setTargetLanguage] = useState<OpenAITranslationTargetLanguageCode>(
    OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE
  );
  const [audioMixPercent, setAudioMixPercent] = useState(
    OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT
  );
  const [sessionState, setSessionState] = useState<TranslationSessionState>(() =>
    createIdleTranslationSessionState(OPENAI_TRANSLATION_DEFAULT_TARGET_LANGUAGE)
  );
  const [actionInFlight, setActionInFlight] = useState<TranslationAction | null>(null);
  const [pendingStart, setPendingStart] = useState<PendingStart | null>(null);
  const [playbackError, setPlaybackError] = useState<OpenAITranslationPlaybackError | null>(null);
  const operationIdRef = useRef(0);
  const pendingStartRef = useRef<PendingStart | null>(null);
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  const maxSessionConfig = useMemo(
    () =>
      normalizeOpenAITranslationMaxSessionConfig(
        import.meta.env.VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES
      ),
    []
  );

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
  const audioMixState = useMemo(
    () => buildTranslationAudioMixState(audioMixPercent),
    [audioMixPercent]
  );
  const sessionSourceMode = sessionState.sourceMode ?? activeSourceMode;
  const shouldUseBrowserTabAudio = sessionSourceMode === 'browser-tab';
  const originalAudioStream =
    capturedSource?.mode === 'browser-tab' && sourceStatus === 'ready'
      ? capturedSource.sourceStream
      : null;
  const translatedAudioVolume = shouldUseBrowserTabAudio ? audioMixState.translatedVolume : 1;
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
  const latestCaption = useMemo(
    () => getLatestOpenAITranslationCaption(transcripts),
    [transcripts]
  );
  const transcriptSummary = useMemo(
    () => summarizeOpenAITranslationTranscripts(transcripts),
    [transcripts]
  );
  const isTranscriptActive =
    isRuntimeConnected || isRuntimeStarting || isStartPending || sourceStatus === 'ready';

  const handlePlaybackError = useCallback((error: OpenAITranslationPlaybackError): void => {
    setPlaybackError(error);
  }, []);

  const stopTranslation = useCallback(
    async (reason: ProviderStopReason = 'manual'): Promise<void> => {
      if (stopPromiseRef.current) {
        return stopPromiseRef.current;
      }

      operationIdRef.current += 1;
      pendingStartRef.current = null;
      setPendingStart(null);

      const stopPromise = (async (): Promise<void> => {
        setActionInFlight('stop');
        setPlaybackError(null);
        try {
          await stopRuntime(resolveRuntimeStopReason(reason));
        } finally {
          stopSource();
          const sessionEndReason = resolveSessionEndReason(reason);
          setSessionState((currentSession) =>
            sessionEndReason !== null &&
            currentSession.startedAt !== null &&
            currentSession.endedAt === null
              ? {
                  ...currentSession,
                  endedAt: Date.now(),
                  endReason: sessionEndReason,
                }
              : currentSession
          );
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
    },
    [stopRuntime, stopSource]
  );

  const handleStart = useCallback(async (): Promise<void> => {
    if (isStartDisabled) {
      return;
    }

    if (sourceStatus !== 'idle' || runtimeStatus !== 'idle') {
      await stopTranslation('retry-reset');
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
    setPlaybackError(null);
    setAudioMixPercent(OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT);
    setSessionState(createIdleTranslationSessionState(targetLanguage));
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
    runtimeStatus,
    sourceStatus,
    stopTranslation,
    targetLanguage,
  ]);

  const handleAutoStop = useCallback(
    (reason: OpenAITranslationAutoStopReason): void => {
      void stopTranslation(reason);
    },
    [stopTranslation]
  );
  const sessionTimer = useOpenAITranslationSessionTimer({
    isActive: isRuntimeConnected,
    startedAt: sessionState.startedAt,
    endedAt: sessionState.endedAt,
    maxSeconds: maxSessionConfig.maxSeconds,
    onAutoStop: handleAutoStop,
  });
  const sessionEndReason: OpenAITranslationSessionEndReason | null =
    sessionState.endReason ??
    (runtimeStatus === 'error' && sessionState.startedAt !== null ? 'runtime-error' : null);
  const exportMetadata = useMemo<OpenAITranslationSessionMetadata>(
    () => ({
      startedAt: sessionState.startedAt,
      endedAt: sessionState.endedAt,
      durationSeconds: sessionTimer.elapsedSeconds,
      sourceMode: sessionState.sourceMode ?? activeSourceMode,
      targetLanguage: sessionState.targetLanguage,
      endReason: sessionEndReason,
    }),
    [
      activeSourceMode,
      sessionState.endedAt,
      sessionState.sourceMode,
      sessionState.startedAt,
      sessionState.targetLanguage,
      sessionEndReason,
      sessionTimer.elapsedSeconds,
    ]
  );
  const elapsedLabel = formatOpenAITranslationDuration(sessionTimer.elapsedSeconds);
  const maxSessionLabel = formatOpenAITranslationDuration(maxSessionConfig.maxSeconds);
  const uiStatus = useMemo(
    () =>
      deriveOpenAITranslationUiStatus({
        elapsedLabel,
        errorMessage,
        isOffline,
        isStartPending,
        isStopPending,
        maxSessionLabel,
        runtimeError,
        runtimeStatus,
        selectedSourceLabel,
        sessionEndReason,
        sourceError,
        sourceStatus,
        targetLanguageLabel,
        transcriptSummary,
        translatedAudioStream,
      }),
    [
      elapsedLabel,
      errorMessage,
      isOffline,
      isStartPending,
      isStopPending,
      maxSessionLabel,
      runtimeError,
      runtimeStatus,
      selectedSourceLabel,
      sessionEndReason,
      sourceError,
      sourceStatus,
      targetLanguageLabel,
      transcriptSummary,
      translatedAudioStream,
    ]
  );
  const diagnostic = useMemo(
    () =>
      buildOpenAITranslationDiagnostic({
        isOffline,
        providerErrorMessage: errorMessage,
        sourceStatus,
        sourceMode: activeSourceMode,
        sourceCapability: selectedCapability,
        sourceError,
        runtimeStatus,
        runtimeError,
        playbackError,
        isStartPending,
        isStopPending,
        targetLanguageLabel,
        transcriptSummary,
        translatedAudioStream,
        originalAudioStream,
      }),
    [
      activeSourceMode,
      errorMessage,
      isOffline,
      isStartPending,
      isStopPending,
      originalAudioStream,
      playbackError,
      runtimeError,
      runtimeStatus,
      selectedCapability,
      sourceError,
      sourceStatus,
      targetLanguageLabel,
      transcriptSummary,
      translatedAudioStream,
    ]
  );

  const handleDiagnosticRetry = useCallback((): void => {
    setPlaybackError(null);
    void handleStart();
  }, [handleStart]);

  const handleSourceModeChange = useCallback(
    (nextSourceMode: OpenAITranslationSourceMode): void => {
      setSelectedSourceMode(nextSourceMode);

      if (!isRuntimeConnected && !isRuntimeStarting && actionInFlight === null) {
        setAudioMixPercent(OPENAI_TRANSLATION_DEFAULT_AUDIO_MIX_PERCENT);
      }
    },
    [actionInFlight, isRuntimeConnected, isRuntimeStarting]
  );

  const handleExportMarkdown = useCallback((): void => {
    if (!transcriptSummary.hasEntries) {
      throw new Error('No transcript lines are available for export.');
    }

    const generatedAt = Date.now();
    const markdown = buildOpenAITranslationTranscriptMarkdown({
      metadata: exportMetadata,
      entries: transcripts,
      generatedAt,
    });

    downloadOpenAITranslationMarkdown(markdown, buildOpenAITranslationExportFilename(generatedAt));
  }, [exportMetadata, transcriptSummary.hasEntries, transcripts]);

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
          await stopTranslation('failed-start');
          setSessionState(createIdleTranslationSessionState(pendingStart.targetLanguage));
          return;
        }

        setSessionState({
          startedAt: Date.now(),
          endedAt: null,
          sourceMode: readySource.mode,
          targetLanguage: pendingStart.targetLanguage,
          endReason: null,
        });
      } catch (error) {
        if (!cancelled) {
          console.error('[OpenAITranslationProvider] Failed to start translation runtime', error);
          await stopTranslation('failed-start');
          setSessionState(createIdleTranslationSessionState(pendingStart.targetLanguage));
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
  }, [capturedSource, pendingStart, runtimeStart, sourceStatus, stopTranslation]);

  useEffect(() => {
    if (
      sourceStatus === 'ended' &&
      sessionState.endedAt === null &&
      (sessionState.startedAt !== null ||
        actionInFlight === 'start' ||
        isRuntimeStarting ||
        isRuntimeConnected)
    ) {
      void stopTranslation('source-ended');
    }
  }, [
    actionInFlight,
    isRuntimeConnected,
    isRuntimeStarting,
    sessionState.endedAt,
    sessionState.startedAt,
    sourceStatus,
    stopTranslation,
  ]);

  useEffect(() => {
    if (!stopRef) {
      return undefined;
    }

    stopRef.current = (reason = 'provider-switch') => stopTranslation(reason);

    return () => {
      stopRef.current = null;
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
                void stopTranslation('manual');
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

        <OpenAITranslationLatestCaption caption={latestCaption} isActive={isTranscriptActive} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <OpenAITranslationSourceSelector
                selectedMode={activeSourceMode}
                capabilities={sourceCapabilities}
                disabled={areConfigurationControlsDisabled}
                onModeChange={handleSourceModeChange}
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

            <OpenAITranslationDiagnosticsPanel
              diagnostic={diagnostic}
              canRetry={diagnostic.retryable && diagnostic.severity !== 'info' && !isStartDisabled}
              canStop={canStop}
              isRetryPending={isStartPending}
              isStopPending={isStopPending}
              onRetry={handleDiagnosticRetry}
              onStop={() => {
                void stopTranslation('manual');
              }}
            />

            <OpenAITranslationExportControls
              hasEntries={transcriptSummary.hasEntries}
              onExportMarkdown={handleExportMarkdown}
            />

            <OpenAITranslationAudioPlayer
              stream={translatedAudioStream}
              disabled={!translatedAudioStream}
              label="Translated Audio"
              activeDescription="Live translated output stream attached."
              inactiveDescription="Waiting for translated audio."
              playbackLabel="Translated audio playback"
              streamKind="translated"
              volume={translatedAudioVolume}
              onPlaybackError={handlePlaybackError}
            />

            {shouldUseBrowserTabAudio && (
              <>
                <OpenAITranslationAudioMixControls
                  mixState={audioMixState}
                  disabled={isStartPending || isStopPending}
                  onMixChange={setAudioMixPercent}
                />
                <OpenAITranslationAudioPlayer
                  stream={originalAudioStream}
                  disabled={!originalAudioStream}
                  label="Original Audio"
                  activeDescription="Browser-tab source audio stream attached."
                  inactiveDescription="Waiting for browser-tab source audio."
                  playbackLabel="Original browser-tab audio playback"
                  streamKind="original"
                  volume={audioMixState.originalVolume}
                  onPlaybackError={handlePlaybackError}
                />
              </>
            )}
          </div>

          <TranslationTranscriptPanel
            entries={transcripts}
            isActive={isTranscriptActive}
            onClearTranscripts={clearTranscripts}
          />
        </div>
      </div>
    </motion.section>
  );
}

interface OpenAITranslationUiStatusInput {
  readonly elapsedLabel: string;
  readonly errorMessage: string | null;
  readonly isOffline: boolean;
  readonly isStartPending: boolean;
  readonly isStopPending: boolean;
  readonly maxSessionLabel: string;
  readonly runtimeError: OpenAITranslationRuntimeError | null;
  readonly runtimeStatus: OpenAITranslationHookStatus;
  readonly selectedSourceLabel: string;
  readonly sessionEndReason: OpenAITranslationSessionEndReason | null;
  readonly sourceError: OpenAITranslationSourceError | null;
  readonly sourceStatus: OpenAITranslationSourceStatus;
  readonly targetLanguageLabel: string;
  readonly transcriptSummary: OpenAITranslationTranscriptSummary;
  readonly translatedAudioStream: MediaStream | null;
}

function deriveOpenAITranslationUiStatus({
  elapsedLabel,
  errorMessage,
  isOffline,
  isStartPending,
  isStopPending,
  maxSessionLabel,
  runtimeError,
  runtimeStatus,
  selectedSourceLabel,
  sessionEndReason,
  sourceError,
  sourceStatus,
  targetLanguageLabel,
  transcriptSummary,
  translatedAudioStream,
}: OpenAITranslationUiStatusInput): OpenAITranslationUiStatus {
  const details = [
    `Source: ${describeSourceStatus(sourceStatus)}`,
    `Runtime: ${describeRuntimeStatus(runtimeStatus)}`,
    `Selected: ${selectedSourceLabel} to ${targetLanguageLabel}`,
    `Transcript: ${describeTranscriptSummary(transcriptSummary)}`,
    `Elapsed: ${elapsedLabel} / ${maxSessionLabel}`,
  ];
  const detailsWithEndReason = sessionEndReason
    ? [...details, `End reason: ${formatOpenAITranslationSessionEndReason(sessionEndReason)}`]
    : details;

  if (errorMessage) {
    return {
      tone: 'error',
      title: 'Translation unavailable',
      message: errorMessage,
      details: detailsWithEndReason,
    };
  }

  if (isOffline) {
    return {
      tone: 'warning',
      title: 'Browser offline',
      message: 'Reconnect before starting a translation session.',
      details: detailsWithEndReason,
    };
  }

  if (runtimeError || sourceError) {
    return {
      tone: 'error',
      title: 'Translation needs attention',
      message: 'Review the diagnostics panel for category, recovery, and safe technical details.',
      details: detailsWithEndReason,
    };
  }

  if (isStopPending || runtimeStatus === 'stopping') {
    return {
      tone: 'busy',
      title: 'Stopping translation',
      message: 'Runtime and source resources are being released.',
      details: detailsWithEndReason,
    };
  }

  if (runtimeStatus === 'requesting-client-secret') {
    return {
      tone: 'busy',
      title: 'Requesting client secret',
      message: 'The backend translation route is preparing an ephemeral session.',
      details: detailsWithEndReason,
    };
  }

  if (runtimeStatus === 'connecting') {
    return {
      tone: 'busy',
      title: 'Connecting translation',
      message: 'WebRTC negotiation is in progress.',
      details: detailsWithEndReason,
    };
  }

  if (sourceStatus === 'requesting' || isStartPending) {
    return {
      tone: 'busy',
      title: 'Requesting audio source',
      message: 'Approve the selected browser audio source to continue.',
      details: detailsWithEndReason,
    };
  }

  if (runtimeStatus === 'connected') {
    return {
      tone: 'success',
      title: 'Translation connected',
      message: translatedAudioStream
        ? 'Translated audio is attached and ready for playback.'
        : 'Translation is connected and waiting for remote audio.',
      details: detailsWithEndReason,
    };
  }

  if (sourceStatus === 'ready') {
    return {
      tone: 'success',
      title: 'Audio source ready',
      message: 'The selected source is captured and ready for translation startup.',
      details: detailsWithEndReason,
    };
  }

  if (sourceStatus === 'ended') {
    return {
      tone: 'warning',
      title: 'Audio source ended',
      message: 'Choose a source and start again when audio is available.',
      details: detailsWithEndReason,
    };
  }

  if (runtimeStatus === 'stopped' || sourceStatus === 'stopped') {
    return {
      tone: 'idle',
      title: 'Translation stopped',
      message:
        sessionEndReason === 'max-session-duration'
          ? 'The max-session guard stopped the session and released resources.'
          : 'Resources were released and the controls are ready for another session.',
      details: detailsWithEndReason,
    };
  }

  return {
    tone: 'idle',
    title: 'Ready to translate',
    message: 'Choose a source and target language, then start translation.',
    details: detailsWithEndReason,
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

function createIdleTranslationSessionState(
  targetLanguage: OpenAITranslationTargetLanguageCode
): TranslationSessionState {
  return {
    startedAt: null,
    endedAt: null,
    sourceMode: null,
    targetLanguage,
    endReason: null,
  };
}

function resolveRuntimeStopReason(reason: ProviderStopReason): OpenAITranslationRuntimeStopReason {
  switch (reason) {
    case 'retry-reset':
      return 'reset';
    case 'failed-start':
      return 'failed-start';
    case 'manual':
    case 'source-ended':
    case 'runtime-error':
    case 'provider-switch':
    case 'max-session-duration':
      return reason;
    default:
      return assertNeverProviderStopReason(reason);
  }
}

function resolveSessionEndReason(
  reason: ProviderStopReason
): OpenAITranslationSessionEndReason | null {
  switch (reason) {
    case 'retry-reset':
      return null;
    case 'failed-start':
      return 'runtime-error';
    case 'manual':
    case 'source-ended':
    case 'runtime-error':
    case 'provider-switch':
    case 'max-session-duration':
      return reason;
    default:
      return assertNeverProviderStopReason(reason);
  }
}

function downloadOpenAITranslationMarkdown(markdown: string, filename: string): void {
  if (typeof Blob !== 'function') {
    throw new Error('Markdown export is unavailable because Blob is not supported.');
  }

  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Markdown export is unavailable outside a browser document.');
  }

  if (typeof URL.createObjectURL !== 'function' || typeof URL.revokeObjectURL !== 'function') {
    throw new Error('Markdown export is unavailable because object URLs are not supported.');
  }

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  let link: HTMLAnchorElement | null = null;

  try {
    link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
  } finally {
    link?.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

function buildOpenAITranslationExportFilename(generatedAt: number): string {
  const timestamp = new Date(generatedAt).toISOString().replace(/[:.]/g, '-');
  return `openai-translation-${timestamp}.md`;
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

function describeTranscriptSummary(summary: OpenAITranslationTranscriptSummary): string {
  if (!summary.hasEntries) {
    return 'waiting for lines';
  }

  const lineLabel = summary.totalCount === 1 ? 'line' : 'lines';
  return `${summary.totalCount} ${lineLabel}, ${summary.sourceCount} source, ${summary.translatedCount} translated`;
}

function assertNeverSourceStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation source status: ${String(status)}`);
}

function assertNeverRuntimeStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation runtime status: ${String(status)}`);
}

function assertNeverProviderStopReason(reason: never): never {
  throw new Error(`Unhandled OpenAI translation provider stop reason: ${String(reason)}`);
}
