import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildOpenAITranslationDisplayMediaOptions,
  createOpenAITranslationMissingAudioTrackError,
  createOpenAITranslationSourceError,
  detectOpenAITranslationSourceCapabilities,
  getOpenAITranslationSourceCapability,
  mapOpenAITranslationSourceError,
} from '@/lib/openaiTranslation';
import type {
  OpenAITranslationSourceCapabilities,
  OpenAITranslationSourceError,
  OpenAITranslationSourceMode,
  OpenAITranslationSourceResult,
  OpenAITranslationSourceStatus,
  UseOpenAITranslationSourceResult,
} from '@/types/openai-translation';

const INITIAL_STATUS: OpenAITranslationSourceStatus = 'idle';

interface SourceTrackListener {
  readonly track: MediaStreamTrack;
  readonly onEnded: () => void;
}

interface SourceResources {
  readonly stream: MediaStream | null;
  readonly listeners: readonly SourceTrackListener[];
}

function createEmptySourceResources(): SourceResources {
  return {
    stream: null,
    listeners: [],
  };
}

export function useOpenAITranslationSource(): UseOpenAITranslationSourceResult {
  const mountedRef = useRef(true);
  const operationIdRef = useRef(0);
  const capturePromiseRef = useRef<Promise<boolean> | null>(null);
  const statusRef = useRef<OpenAITranslationSourceStatus>(INITIAL_STATUS);
  const resourcesRef = useRef<SourceResources>(createEmptySourceResources());
  const [status, setStatus] = useState<OpenAITranslationSourceStatus>(INITIAL_STATUS);
  const [mode, setMode] = useState<OpenAITranslationSourceMode | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioTracks, setAudioTracks] = useState<readonly MediaStreamTrack[]>([]);
  const [error, setError] = useState<OpenAITranslationSourceError | null>(null);
  const [capabilities, setCapabilities] = useState<OpenAITranslationSourceCapabilities>(() =>
    detectOpenAITranslationSourceCapabilities()
  );

  const setHookStatus = useCallback((nextStatus: OpenAITranslationSourceStatus): void => {
    statusRef.current = nextStatus;
    if (mountedRef.current) {
      setStatus(nextStatus);
    }
  }, []);

  const refreshCapabilities = useCallback((): void => {
    if (mountedRef.current) {
      setCapabilities(detectOpenAITranslationSourceCapabilities());
    }
  }, []);

  const releaseSourceResources = useCallback((): OpenAITranslationSourceError | null => {
    const resources = resourcesRef.current;
    const cleanupErrors: string[] = [];

    for (const listener of resources.listeners) {
      collectSourceCleanupError(cleanupErrors, 'track ended listener', () => {
        listener.track.removeEventListener('ended', listener.onEnded);
      });
    }

    collectSourceCleanupError(cleanupErrors, 'source stream tracks', () => {
      stopMediaStreamTracks(resources.stream);
    });

    resourcesRef.current = createEmptySourceResources();

    if (cleanupErrors.length > 0) {
      return createOpenAITranslationSourceError(
        'cleanup',
        null,
        `OpenAI translation source cleanup failed: ${cleanupErrors.join(', ')}`,
        { code: 'source-cleanup-failed' }
      );
    }

    return null;
  }, []);

  const clearSourceState = useCallback(
    (
      nextStatus: OpenAITranslationSourceStatus,
      nextMode: OpenAITranslationSourceMode | null,
      nextError: OpenAITranslationSourceError | null
    ): void => {
      if (!mountedRef.current) {
        return;
      }

      setStream(null);
      setAudioTracks([]);
      setMode(nextMode);
      setError(nextError);
      setHookStatus(nextStatus);
    },
    [setHookStatus]
  );

  const handleTrackEnded = useCallback(
    (endedOperationId: number, endedMode: OpenAITranslationSourceMode): void => {
      if (!mountedRef.current || operationIdRef.current !== endedOperationId) {
        return;
      }

      operationIdRef.current += 1;
      const cleanupError = releaseSourceResources();
      clearSourceState(
        cleanupError ? 'error' : 'ended',
        endedMode,
        cleanupError ??
          createOpenAITranslationSourceError(
            'track-ended',
            endedMode,
            'The selected audio source ended before translation was stopped.',
            { code: 'source-track-ended' }
          )
      );
    },
    [clearSourceState, releaseSourceResources]
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;
      releaseSourceResources();
    };
  }, [releaseSourceResources]);

  const captureSource = useCallback(
    async (requestedMode: OpenAITranslationSourceMode): Promise<boolean> => {
      if (!mountedRef.current || capturePromiseRef.current) {
        return false;
      }

      const nextCapabilities = detectOpenAITranslationSourceCapabilities();
      setCapabilities(nextCapabilities);
      const capability = getOpenAITranslationSourceCapability(nextCapabilities, requestedMode);
      if (!capability.canRequest) {
        clearSourceState(
          'error',
          requestedMode,
          createOpenAITranslationSourceError(
            'unsupported',
            requestedMode,
            capability.message ?? 'This audio source is unavailable in the current browser.',
            {
              recoverable: capability.status !== 'unsupported',
              code: `source-${capability.status}`,
            }
          )
        );
        return false;
      }

      const operationId = operationIdRef.current + 1;
      operationIdRef.current = operationId;
      const cleanupError = releaseSourceResources();
      if (cleanupError) {
        clearSourceState('error', requestedMode, cleanupError);
        return false;
      }

      if (mountedRef.current) {
        setMode(requestedMode);
        setStream(null);
        setAudioTracks([]);
        setError(null);
        setHookStatus('requesting');
      }

      const capturePromise = (async (): Promise<boolean> => {
        let nextStream: MediaStream;
        try {
          nextStream = await requestOpenAITranslationSourceStream(requestedMode);
        } catch (caughtError) {
          if (operationIdRef.current === operationId && mountedRef.current) {
            setError(mapOpenAITranslationSourceError(caughtError, requestedMode));
            setHookStatus('error');
          }
          return false;
        }

        if (operationIdRef.current !== operationId || !mountedRef.current) {
          stopMediaStream(nextStream);
          return false;
        }

        const nextAudioTracks = nextStream.getAudioTracks();
        if (nextAudioTracks.length === 0) {
          const stopError = stopMediaStream(nextStream);
          setError(stopError ?? createOpenAITranslationMissingAudioTrackError(requestedMode));
          setHookStatus('error');
          return false;
        }

        let listeners: readonly SourceTrackListener[];
        try {
          listeners = registerSourceTrackEndedListeners(
            nextStream,
            operationId,
            requestedMode,
            handleTrackEnded
          );
        } catch {
          const stopError = stopMediaStream(nextStream);
          setError(
            stopError ??
              createOpenAITranslationSourceError(
                'cleanup',
                requestedMode,
                'OpenAI translation source listener setup failed.',
                { code: 'source-listener-failed' }
              )
          );
          setHookStatus('error');
          return false;
        }
        resourcesRef.current = {
          stream: nextStream,
          listeners,
        };

        setMode(requestedMode);
        setStream(nextStream);
        setAudioTracks(nextAudioTracks);
        setError(null);
        setHookStatus('ready');
        return true;
      })();

      capturePromiseRef.current = capturePromise;

      try {
        return await capturePromise;
      } finally {
        if (capturePromiseRef.current === capturePromise) {
          capturePromiseRef.current = null;
        }
      }
    },
    [clearSourceState, handleTrackEnded, releaseSourceResources, setHookStatus]
  );

  const captureMicrophone = useCallback(async (): Promise<boolean> => {
    return captureSource('microphone');
  }, [captureSource]);

  const captureBrowserTab = useCallback(async (): Promise<boolean> => {
    return captureSource('browser-tab');
  }, [captureSource]);

  const stop = useCallback((): void => {
    if (!mountedRef.current) {
      return;
    }

    operationIdRef.current += 1;
    const cleanupError = releaseSourceResources();
    clearSourceState(cleanupError ? 'error' : 'stopped', null, cleanupError);
  }, [clearSourceState, releaseSourceResources]);

  const reset = useCallback((): void => {
    if (!mountedRef.current) {
      return;
    }

    operationIdRef.current += 1;
    const cleanupError = releaseSourceResources();
    setCapabilities(detectOpenAITranslationSourceCapabilities());
    clearSourceState(cleanupError ? 'error' : INITIAL_STATUS, null, cleanupError);
  }, [clearSourceState, releaseSourceResources]);

  const source = useMemo<OpenAITranslationSourceResult | null>(() => {
    if (status !== 'ready' || !mode || !stream || audioTracks.length === 0) {
      return null;
    }

    return {
      mode,
      sourceStream: stream,
      audioTracks,
      ownsSourceStream: true,
    };
  }, [audioTracks, mode, status, stream]);
  const isRequesting = status === 'requesting';
  const isReady = source !== null;
  const canCaptureMicrophone = capabilities.microphone.canRequest;
  const canCaptureBrowserTab = capabilities.browserTab.canRequest;

  return useMemo(
    () => ({
      status,
      mode,
      stream,
      audioTracks,
      source,
      error,
      capabilities,
      isRequesting,
      isReady,
      canCaptureMicrophone,
      canCaptureBrowserTab,
      captureMicrophone,
      captureBrowserTab,
      stop,
      reset,
      refreshCapabilities,
    }),
    [
      audioTracks,
      canCaptureBrowserTab,
      canCaptureMicrophone,
      capabilities,
      captureBrowserTab,
      captureMicrophone,
      error,
      isReady,
      isRequesting,
      mode,
      refreshCapabilities,
      reset,
      source,
      status,
      stop,
      stream,
    ]
  );
}

async function requestOpenAITranslationSourceStream(
  mode: OpenAITranslationSourceMode
): Promise<MediaStream> {
  const mediaDevices = navigator.mediaDevices;
  switch (mode) {
    case 'microphone':
      return mediaDevices.getUserMedia({ audio: true });
    case 'browser-tab':
      return mediaDevices.getDisplayMedia(buildOpenAITranslationDisplayMediaOptions());
    default:
      return assertNeverSourceMode(mode);
  }
}

function registerSourceTrackEndedListeners(
  stream: MediaStream,
  operationId: number,
  mode: OpenAITranslationSourceMode,
  handleTrackEnded: (operationId: number, mode: OpenAITranslationSourceMode) => void
): readonly SourceTrackListener[] {
  return stream.getTracks().map((track) => {
    const onEnded = (): void => {
      handleTrackEnded(operationId, mode);
    };
    track.addEventListener('ended', onEnded);
    return {
      track,
      onEnded,
    };
  });
}

function stopMediaStream(stream: MediaStream): OpenAITranslationSourceError | null {
  const cleanupErrors: string[] = [];
  collectSourceCleanupError(cleanupErrors, 'source stream tracks', () => {
    stopMediaStreamTracks(stream);
  });

  if (cleanupErrors.length > 0) {
    return createOpenAITranslationSourceError(
      'cleanup',
      null,
      `OpenAI translation source cleanup failed: ${cleanupErrors.join(', ')}`,
      { code: 'source-cleanup-failed' }
    );
  }

  return null;
}

function stopMediaStreamTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    if (track.readyState !== 'ended') {
      track.stop();
    }
  });
}

function collectSourceCleanupError(errors: string[], label: string, cleanup: () => void): void {
  try {
    cleanup();
  } catch {
    errors.push(label);
  }
}

function assertNeverSourceMode(mode: never): never {
  throw new Error(`Unhandled OpenAI translation source mode: ${String(mode)}`);
}
