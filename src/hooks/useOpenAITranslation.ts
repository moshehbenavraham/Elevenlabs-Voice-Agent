import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyOpenAITranslationTranscriptEvent,
  createOpenAITranslationCleanupResult,
  createOpenAITranslationRuntimeError,
  exchangeOpenAITranslationSdp,
  isOpenAITranslationBusyStatus,
  isOpenAITranslationRuntimeError,
  parseOpenAITranslationDataChannelMessage,
  requestOpenAITranslationClientSecret,
  validateTranslationTargetLanguage,
} from '@/lib/openaiTranslation';
import type {
  OpenAITranslationHookStatus,
  OpenAITranslationCleanupResult,
  OpenAITranslationRuntimeError,
  OpenAITranslationRuntimeStopReason,
  OpenAITranslationStartOptions,
  OpenAITranslationTargetLanguageCode,
  OpenAITranslationTranscriptEntry,
  UseOpenAITranslationResult,
} from '@/types/openai-translation';

const INITIAL_STATUS: OpenAITranslationHookStatus = 'idle';
const OPENAI_TRANSLATION_ICE_GATHERING_TIMEOUT_MS = 5000;

interface OpenAITranslationRuntimeResources {
  readonly peerConnection: RTCPeerConnection | null;
  readonly dataChannel: RTCDataChannel | null;
  readonly remoteStream: MediaStream | null;
  readonly abortController: AbortController | null;
  readonly sourceStream: MediaStream | null;
  readonly ownsSourceStream: boolean;
  readonly sourceSenders: readonly RTCRtpSender[];
}

interface CleanupOptions {
  readonly updateState?: boolean;
  readonly abortRequests?: boolean;
}

interface ValidatedOpenAITranslationStartOptions {
  readonly sourceStream: MediaStream;
  readonly audioTracks: readonly MediaStreamTrack[];
  readonly targetLanguage: OpenAITranslationTargetLanguageCode;
  readonly ownsSourceStream: boolean;
  readonly peerConnectionConfig?: RTCConfiguration;
}

export function useOpenAITranslation(): UseOpenAITranslationResult {
  const mountedRef = useRef(true);
  const operationIdRef = useRef(0);
  const startPromiseRef = useRef<Promise<boolean> | null>(null);
  const stopPromiseRef = useRef<Promise<OpenAITranslationCleanupResult> | null>(null);
  const statusRef = useRef<OpenAITranslationHookStatus>(INITIAL_STATUS);
  const resourcesRef = useRef<OpenAITranslationRuntimeResources>(
    createEmptyOpenAITranslationResources()
  );
  const transcriptsRef = useRef<readonly OpenAITranslationTranscriptEntry[]>([]);
  const [status, setStatus] = useState<OpenAITranslationHookStatus>(INITIAL_STATUS);
  const [error, setError] = useState<OpenAITranslationRuntimeError | null>(null);
  const [translatedAudioStream, setTranslatedAudioStream] = useState<MediaStream | null>(null);
  const [transcripts, setTranscripts] = useState<readonly OpenAITranslationTranscriptEntry[]>([]);

  const setHookTranscripts = useCallback(
    (nextTranscripts: readonly OpenAITranslationTranscriptEntry[]): void => {
      transcriptsRef.current = nextTranscripts;
      if (mountedRef.current) {
        setTranscripts(nextTranscripts);
      }
    },
    []
  );

  const setHookStatus = useCallback((nextStatus: OpenAITranslationHookStatus): void => {
    statusRef.current = nextStatus;
    if (mountedRef.current) {
      setStatus(nextStatus);
    }
  }, []);

  const cleanupRuntimeResources = useCallback(
    ({
      updateState = true,
      abortRequests = true,
    }: CleanupOptions = {}): OpenAITranslationRuntimeError | null => {
      const resources = resourcesRef.current;
      const cleanupErrors: string[] = [];

      if (abortRequests) {
        collectCleanupError(cleanupErrors, 'abort controller', () => {
          resources.abortController?.abort();
        });
      }

      collectCleanupError(cleanupErrors, 'data channel', () => {
        if (resources.dataChannel) {
          resources.dataChannel.onmessage = null;
          resources.dataChannel.onerror = null;
          resources.dataChannel.onopen = null;
          resources.dataChannel.onclose = null;
          if (resources.dataChannel.readyState !== 'closed') {
            resources.dataChannel.close();
          }
        }
      });

      collectCleanupError(cleanupErrors, 'source senders', () => {
        if (resources.peerConnection) {
          resources.sourceSenders.forEach((sender) => {
            resources.peerConnection?.removeTrack(sender);
          });
        }
      });

      collectCleanupError(cleanupErrors, 'peer connection', () => {
        if (resources.peerConnection) {
          resources.peerConnection.ontrack = null;
          resources.peerConnection.onconnectionstatechange = null;
          resources.peerConnection.oniceconnectionstatechange = null;
          resources.peerConnection.close();
        }
      });

      collectCleanupError(cleanupErrors, 'remote stream tracks', () => {
        stopMediaStreamTracks(resources.remoteStream);
      });

      if (resources.ownsSourceStream) {
        collectCleanupError(cleanupErrors, 'source stream tracks', () => {
          stopMediaStreamTracks(resources.sourceStream);
        });
      }

      resourcesRef.current = createEmptyOpenAITranslationResources();

      if (updateState && mountedRef.current) {
        setTranslatedAudioStream(null);
      }

      if (cleanupErrors.length > 0) {
        return createOpenAITranslationRuntimeError(
          'cleanup',
          `OpenAI translation cleanup failed: ${cleanupErrors.join(', ')}`,
          { code: 'cleanup-failed' }
        );
      }

      return null;
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;
      cleanupRuntimeResources({ updateState: false, abortRequests: true });
    };
  }, [cleanupRuntimeResources]);

  const start = useCallback(
    async (_options: OpenAITranslationStartOptions): Promise<boolean> => {
      if (
        !mountedRef.current ||
        startPromiseRef.current ||
        isOpenAITranslationBusyStatus(statusRef.current) ||
        statusRef.current === 'connected'
      ) {
        return false;
      }

      const operationId = operationIdRef.current + 1;
      operationIdRef.current = operationId;

      const startPromise = (async (): Promise<boolean> => {
        const validation = validateOpenAITranslationStartOptions(_options);
        if (!validation.ok) {
          setError(validation.error);
          setHookStatus('error');
          return false;
        }

        const startOptions = validation.value;
        if (operationIdRef.current !== operationId) {
          cleanupRuntimeResources({ updateState: false, abortRequests: false });
          return false;
        }

        if (isBrowserOffline()) {
          setError(
            createOpenAITranslationRuntimeError(
              'offline',
              'OpenAI translation cannot start while the browser is offline',
              { code: 'browser-offline' }
            )
          );
          setHookStatus('error');
          return false;
        }

        const cleanupError = cleanupRuntimeResources();
        if (cleanupError) {
          setError(cleanupError);
          setHookStatus('error');
          return false;
        }

        const abortController = new AbortController();
        resourcesRef.current = {
          ...createEmptyOpenAITranslationResources(),
          abortController,
          sourceStream: startOptions.sourceStream,
          ownsSourceStream: startOptions.ownsSourceStream,
        };

        setError(null);
        setHookTranscripts([]);
        setTranslatedAudioStream(null);
        setHookStatus('requesting-client-secret');
        let clientSecret: string;
        try {
          const session = await requestOpenAITranslationClientSecret({
            targetLanguage: startOptions.targetLanguage,
            signal: abortController.signal,
          });
          clientSecret = session.clientSecret;
        } catch (caughtError) {
          if (operationIdRef.current !== operationId) {
            return false;
          }

          cleanupRuntimeResources({ abortRequests: false });
          setError(mapOpenAITranslationHookError(caughtError, 'client-secret'));
          setHookStatus('error');
          return false;
        }

        if (clientSecret.length === 0 || operationIdRef.current !== operationId) {
          cleanupRuntimeResources({ updateState: false, abortRequests: false });
          return false;
        }

        setHookStatus('connecting');
        try {
          const peerConnection = createOpenAITranslationPeerConnection(
            startOptions.peerConnectionConfig
          );
          const remoteStream = createOpenAITranslationRemoteStream();
          const sourceSenders = startOptions.audioTracks.map((track) =>
            peerConnection.addTrack(track, startOptions.sourceStream)
          );
          const dataChannel = peerConnection.createDataChannel('oai-events');
          const failActiveRuntime = (runtimeError: OpenAITranslationRuntimeError): void => {
            if (operationIdRef.current !== operationId || !mountedRef.current) {
              return;
            }

            operationIdRef.current += 1;
            const cleanupError = cleanupRuntimeResources();
            setError(cleanupError ?? runtimeError);
            setHookStatus('error');
          };

          peerConnection.ontrack = (event: RTCTrackEvent): void => {
            if (operationIdRef.current !== operationId || !mountedRef.current) {
              return;
            }

            const nextRemoteStream = resolveOpenAITranslationRemoteStream(event, remoteStream);
            resourcesRef.current = {
              ...resourcesRef.current,
              remoteStream: nextRemoteStream,
            };
            setTranslatedAudioStream(nextRemoteStream);
          };
          peerConnection.onconnectionstatechange = (): void => {
            if (operationIdRef.current !== operationId || !mountedRef.current) {
              return;
            }

            if (peerConnection.connectionState === 'failed') {
              failActiveRuntime(
                createOpenAITranslationRuntimeError(
                  'webrtc',
                  'OpenAI translation peer connection failed',
                  { code: 'peer-connection-failed' }
                )
              );
            }

            if (peerConnection.connectionState === 'closed' && statusRef.current === 'connected') {
              setHookStatus('stopped');
            }
          };
          peerConnection.oniceconnectionstatechange = (): void => {
            if (operationIdRef.current !== operationId || !mountedRef.current) {
              return;
            }

            if (peerConnection.iceConnectionState === 'failed') {
              failActiveRuntime(
                createOpenAITranslationRuntimeError(
                  'webrtc',
                  'OpenAI translation ICE connection failed',
                  { code: 'ice-connection-failed' }
                )
              );
            }
          };
          dataChannel.onmessage = (event: MessageEvent): void => {
            if (operationIdRef.current !== operationId || !mountedRef.current) {
              return;
            }

            const parsed = parseOpenAITranslationDataChannelMessage(event.data);
            if (!parsed.ok) {
              failActiveRuntime(parsed.error);
              return;
            }

            if (parsed.kind === 'unknown') {
              return;
            }

            try {
              const nextTranscripts = applyOpenAITranslationTranscriptEvent(
                transcriptsRef.current,
                parsed.event
              );
              setHookTranscripts(nextTranscripts);
            } catch (caughtError) {
              failActiveRuntime(mapOpenAITranslationHookError(caughtError, 'parser'));
            }
          };
          dataChannel.onerror = (): void => {
            if (operationIdRef.current !== operationId || !mountedRef.current) {
              return;
            }

            failActiveRuntime(
              createOpenAITranslationRuntimeError(
                'data-channel',
                'OpenAI translation data channel reported an error',
                { code: 'data-channel-error' }
              )
            );
          };
          dataChannel.onclose = (): void => {
            if (operationIdRef.current !== operationId || !mountedRef.current) {
              return;
            }

            if (statusRef.current === 'connected') {
              setHookStatus('stopped');
            }
          };

          resourcesRef.current = {
            ...resourcesRef.current,
            dataChannel,
            peerConnection,
            remoteStream,
            sourceSenders,
          };

          const offer = await peerConnection.createOffer();
          if (operationIdRef.current !== operationId) {
            cleanupRuntimeResources({ updateState: false, abortRequests: false });
            return false;
          }

          if (!offer.sdp) {
            throw createOpenAITranslationRuntimeError(
              'sdp-exchange',
              'OpenAI translation SDP offer was empty',
              { code: 'empty-offer-sdp' }
            );
          }

          await peerConnection.setLocalDescription(offer);
          if (operationIdRef.current !== operationId) {
            cleanupRuntimeResources({ updateState: false, abortRequests: false });
            return false;
          }

          await waitForOpenAITranslationIceGatheringComplete(
            peerConnection,
            abortController.signal
          );
          if (operationIdRef.current !== operationId) {
            cleanupRuntimeResources({ updateState: false, abortRequests: false });
            return false;
          }

          const localOfferSdp = peerConnection.localDescription?.sdp ?? offer.sdp;
          if (!localOfferSdp) {
            throw createOpenAITranslationRuntimeError(
              'sdp-exchange',
              'OpenAI translation local SDP offer was empty',
              { code: 'empty-local-offer-sdp' }
            );
          }

          const answerSdp = await exchangeOpenAITranslationSdp({
            clientSecret,
            offerSdp: localOfferSdp,
            signal: abortController.signal,
          });

          if (operationIdRef.current !== operationId) {
            return false;
          }

          await peerConnection.setRemoteDescription({
            type: 'answer',
            sdp: answerSdp,
          });
          if (operationIdRef.current !== operationId) {
            cleanupRuntimeResources({ updateState: false, abortRequests: false });
            return false;
          }
        } catch (caughtError) {
          if (operationIdRef.current !== operationId) {
            return false;
          }

          cleanupRuntimeResources({ abortRequests: false });
          setError(mapOpenAITranslationHookError(caughtError, 'webrtc'));
          setHookStatus('error');
          return false;
        }

        setHookStatus('connected');
        return true;
      })();

      startPromiseRef.current = startPromise;

      try {
        return await startPromise;
      } finally {
        if (startPromiseRef.current === startPromise) {
          startPromiseRef.current = null;
        }
      }
    },
    [cleanupRuntimeResources, setHookStatus, setHookTranscripts]
  );

  const stop = useCallback(
    async (
      _reason: OpenAITranslationRuntimeStopReason = 'manual'
    ): Promise<OpenAITranslationCleanupResult> => {
      if (!mountedRef.current) {
        return createOpenAITranslationCleanupResult(null);
      }

      if (stopPromiseRef.current) {
        return stopPromiseRef.current;
      }

      operationIdRef.current += 1;

      const stopPromise = (async (): Promise<OpenAITranslationCleanupResult> => {
        setHookStatus('stopping');
        const cleanupError = cleanupRuntimeResources();
        if (cleanupError) {
          setError(cleanupError);
          setHookStatus('error');
          return createOpenAITranslationCleanupResult(cleanupError);
        }

        setHookStatus('stopped');
        return createOpenAITranslationCleanupResult(null);
      })();

      stopPromiseRef.current = stopPromise;

      try {
        return await stopPromise;
      } finally {
        if (stopPromiseRef.current === stopPromise) {
          stopPromiseRef.current = null;
        }
      }
    },
    [cleanupRuntimeResources, setHookStatus]
  );

  const clearTranscripts = useCallback((): void => {
    if (!mountedRef.current) {
      return;
    }

    setHookTranscripts([]);
  }, [setHookTranscripts]);

  const reset = useCallback((): void => {
    if (!mountedRef.current) {
      return;
    }

    operationIdRef.current += 1;
    const cleanupError = cleanupRuntimeResources();
    setHookTranscripts([]);
    setError(cleanupError);
    setHookStatus(cleanupError ? 'error' : INITIAL_STATUS);
  }, [cleanupRuntimeResources, setHookStatus, setHookTranscripts]);

  const isStarting = status === 'requesting-client-secret' || status === 'connecting';
  const isConnected = status === 'connected';

  return useMemo(
    () => ({
      status,
      error,
      translatedAudioStream,
      transcripts,
      isStarting,
      isConnected,
      start,
      stop,
      clearTranscripts,
      reset,
    }),
    [
      clearTranscripts,
      error,
      isConnected,
      isStarting,
      reset,
      start,
      status,
      stop,
      transcripts,
      translatedAudioStream,
    ]
  );
}

function validateOpenAITranslationStartOptions(options: OpenAITranslationStartOptions):
  | {
      readonly ok: true;
      readonly value: ValidatedOpenAITranslationStartOptions;
    }
  | {
      readonly ok: false;
      readonly error: OpenAITranslationRuntimeError;
    } {
  const targetLanguage = validateTranslationTargetLanguage(options?.targetLanguage);
  if (!targetLanguage.valid) {
    return {
      ok: false,
      error: createOpenAITranslationRuntimeError('validation', targetLanguage.message, {
        recoverable: false,
        code: 'invalid-target-language',
      }),
    };
  }

  const sourceStream = options?.sourceStream;
  if (!isMediaStreamWithAudioAccess(sourceStream)) {
    return {
      ok: false,
      error: createOpenAITranslationRuntimeError(
        'validation',
        'sourceStream: must be a MediaStream with audio track accessors',
        { recoverable: false, code: 'invalid-source-stream' }
      ),
    };
  }

  const audioTracks = sourceStream.getAudioTracks();
  if (audioTracks.length === 0) {
    return {
      ok: false,
      error: createOpenAITranslationRuntimeError(
        'validation',
        'sourceStream: must include at least one audio track',
        { recoverable: false, code: 'missing-audio-track' }
      ),
    };
  }

  return {
    ok: true,
    value: {
      sourceStream,
      audioTracks,
      targetLanguage: targetLanguage.value,
      ownsSourceStream: options.ownsSourceStream === true,
      peerConnectionConfig: options.peerConnectionConfig,
    },
  };
}

function isMediaStreamWithAudioAccess(value: unknown): value is MediaStream {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { readonly getAudioTracks?: unknown }).getAudioTracks === 'function' &&
    typeof (value as { readonly getTracks?: unknown }).getTracks === 'function'
  );
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function mapOpenAITranslationHookError(
  error: unknown,
  fallbackKind: OpenAITranslationRuntimeError['kind']
): OpenAITranslationRuntimeError {
  if (isOpenAITranslationRuntimeError(error)) {
    return error;
  }

  if (isAbortError(error)) {
    return createOpenAITranslationRuntimeError(
      'aborted',
      'OpenAI translation startup was aborted',
      { code: 'startup-aborted' }
    );
  }

  return createOpenAITranslationRuntimeError(
    fallbackKind,
    resolveFallbackRuntimeErrorMessage(fallbackKind),
    {
      code: resolveFallbackRuntimeErrorCode(fallbackKind),
    }
  );
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { readonly name?: unknown }).name === 'AbortError'
  );
}

function resolveFallbackRuntimeErrorMessage(
  fallbackKind: OpenAITranslationRuntimeError['kind']
): string {
  switch (fallbackKind) {
    case 'client-secret':
      return 'OpenAI translation client-secret request failed';
    case 'sdp-exchange':
      return 'OpenAI translation SDP exchange failed';
    case 'webrtc':
      return 'OpenAI translation WebRTC startup failed';
    case 'data-channel':
      return 'OpenAI translation data channel failed';
    case 'parser':
      return 'OpenAI translation event parsing failed';
    case 'cleanup':
      return 'OpenAI translation cleanup failed';
    case 'offline':
      return 'OpenAI translation cannot start while the browser is offline';
    case 'aborted':
      return 'OpenAI translation startup was aborted';
    case 'validation':
      return 'OpenAI translation input validation failed';
    case 'unknown':
      return 'OpenAI translation startup failed';
    default:
      return assertNeverRuntimeErrorKind(fallbackKind);
  }
}

function resolveFallbackRuntimeErrorCode(
  fallbackKind: OpenAITranslationRuntimeError['kind']
): string {
  switch (fallbackKind) {
    case 'client-secret':
      return 'client-secret-failed';
    case 'sdp-exchange':
      return 'sdp-exchange-failed';
    case 'webrtc':
      return 'webrtc-startup-failed';
    case 'data-channel':
      return 'data-channel-failed';
    case 'parser':
      return 'parser-failed';
    case 'cleanup':
      return 'cleanup-failed';
    case 'offline':
      return 'browser-offline';
    case 'aborted':
      return 'startup-aborted';
    case 'validation':
      return 'validation-failed';
    case 'unknown':
      return 'startup-failed';
    default:
      return assertNeverRuntimeErrorKind(fallbackKind);
  }
}

function createOpenAITranslationPeerConnection(
  config: RTCConfiguration | undefined
): RTCPeerConnection {
  if (typeof RTCPeerConnection !== 'function') {
    throw createOpenAITranslationRuntimeError(
      'webrtc',
      'RTCPeerConnection is unavailable in this browser',
      { recoverable: false, code: 'peer-connection-unavailable' }
    );
  }

  try {
    return new RTCPeerConnection(config);
  } catch {
    throw createOpenAITranslationRuntimeError(
      'webrtc',
      'Failed to create OpenAI translation peer connection',
      { code: 'peer-connection-create-failed' }
    );
  }
}

function createOpenAITranslationRemoteStream(): MediaStream {
  if (typeof MediaStream !== 'function') {
    throw createOpenAITranslationRuntimeError(
      'webrtc',
      'MediaStream is unavailable in this browser',
      { recoverable: false, code: 'media-stream-unavailable' }
    );
  }

  return new MediaStream();
}

function waitForOpenAITranslationIceGatheringComplete(
  peerConnection: RTCPeerConnection,
  signal: AbortSignal
): Promise<void> {
  if (peerConnection.iceGatheringState === 'complete') {
    return Promise.resolve();
  }

  if (typeof peerConnection.addEventListener !== 'function') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      peerConnection.removeEventListener('icegatheringstatechange', handleIceGatheringStateChange);
      signal.removeEventListener('abort', handleAbort);
    };

    const settle = (callback: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback();
    };

    const handleIceGatheringStateChange = (): void => {
      if (peerConnection.iceGatheringState === 'complete') {
        settle(resolve);
      }
    };

    const handleAbort = (): void => {
      settle(() => {
        reject(
          createOpenAITranslationRuntimeError(
            'aborted',
            'OpenAI translation ICE gathering was aborted',
            { code: 'ice-gathering-aborted' }
          )
        );
      });
    };

    timeoutId = setTimeout(() => {
      settle(resolve);
    }, OPENAI_TRANSLATION_ICE_GATHERING_TIMEOUT_MS);

    peerConnection.addEventListener('icegatheringstatechange', handleIceGatheringStateChange);
    signal.addEventListener('abort', handleAbort, { once: true });
    handleIceGatheringStateChange();
  });
}

function resolveOpenAITranslationRemoteStream(
  event: RTCTrackEvent,
  fallbackStream: MediaStream
): MediaStream {
  const remoteStream = event.streams[0] ?? fallbackStream;
  if (!event.streams[0] && typeof fallbackStream.addTrack === 'function') {
    fallbackStream.addTrack(event.track);
  }

  return remoteStream;
}

function createEmptyOpenAITranslationResources(): OpenAITranslationRuntimeResources {
  return {
    peerConnection: null,
    dataChannel: null,
    remoteStream: null,
    abortController: null,
    sourceStream: null,
    ownsSourceStream: false,
    sourceSenders: [],
  };
}

function stopMediaStreamTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    if (track.readyState !== 'ended') {
      track.stop();
    }
  });
}

function collectCleanupError(errors: string[], label: string, cleanup: () => void): void {
  try {
    cleanup();
  } catch {
    errors.push(label);
  }
}

function assertNeverRuntimeErrorKind(kind: never): never {
  throw new Error(`Unhandled OpenAI translation runtime error kind: ${String(kind)}`);
}
