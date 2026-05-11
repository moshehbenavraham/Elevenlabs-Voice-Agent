import type {
  OpenAITranslationDiagnostic,
  OpenAITranslationDiagnosticCategory,
  OpenAITranslationDiagnosticDetail,
  OpenAITranslationDiagnosticOwner,
  OpenAITranslationDiagnosticRecovery,
  OpenAITranslationDiagnosticSeverity,
  OpenAITranslationHookStatus,
  OpenAITranslationPlaybackError,
  OpenAITranslationRouteErrorCategory,
  OpenAITranslationRuntimeError,
  OpenAITranslationSourceCapability,
  OpenAITranslationSourceError,
  OpenAITranslationSourceMode,
  OpenAITranslationSourceStatus,
  OpenAITranslationTranscriptSummary,
} from '@/types/openai-translation';

export interface OpenAITranslationDiagnosticInput {
  readonly isOffline: boolean;
  readonly providerErrorMessage: string | null;
  readonly sourceStatus: OpenAITranslationSourceStatus;
  readonly sourceMode: OpenAITranslationSourceMode;
  readonly sourceCapability: OpenAITranslationSourceCapability;
  readonly sourceError: OpenAITranslationSourceError | null;
  readonly runtimeStatus: OpenAITranslationHookStatus;
  readonly runtimeError: OpenAITranslationRuntimeError | null;
  readonly playbackError: OpenAITranslationPlaybackError | null;
  readonly isStartPending: boolean;
  readonly isStopPending: boolean;
  readonly targetLanguageLabel: string;
  readonly transcriptSummary: OpenAITranslationTranscriptSummary;
  readonly translatedAudioStream: MediaStream | null;
  readonly originalAudioStream: MediaStream | null;
}

interface DiagnosticBase {
  readonly category: OpenAITranslationDiagnosticCategory;
  readonly severity: OpenAITranslationDiagnosticSeverity;
  readonly owner: OpenAITranslationDiagnosticOwner;
  readonly title: string;
  readonly message: string;
  readonly recovery: OpenAITranslationDiagnosticRecovery;
  readonly retryable: boolean;
  readonly code?: string;
  readonly status?: number;
  readonly extraDetails?: readonly OpenAITranslationDiagnosticDetail[];
}

const SENSITIVE_DIAGNOSTIC_PATTERNS = [
  /sk-[a-z0-9_-]+/i,
  /bearer\s+[a-z0-9._-]+/i,
  /authorization/i,
  /openai_api_key/i,
  /client_secret/i,
  /api[_-]?key/i,
  /\bv=0\b/i,
  /offer-sdp/i,
  /answer-sdp/i,
] as const;

export function buildOpenAITranslationDiagnostic(
  input: OpenAITranslationDiagnosticInput
): OpenAITranslationDiagnostic {
  if (input.providerErrorMessage) {
    return buildDiagnostic(input, {
      category: 'backend-service',
      severity: 'error',
      owner: 'provider',
      title: 'Translation unavailable',
      message: sanitizeDiagnosticText(
        input.providerErrorMessage,
        'Translation is unavailable from the host application.'
      ),
      recovery: {
        label: 'Check provider setup',
        description: 'Review the OpenAI translation configuration, then retry from this tab.',
      },
      retryable: true,
      code: 'provider-unavailable',
    });
  }

  if (input.isOffline) {
    return buildDiagnostic(input, {
      category: 'offline',
      severity: 'warning',
      owner: 'browser',
      title: 'Offline diagnostic',
      message: 'The browser is offline, so translation cannot start or reconnect.',
      recovery: {
        label: 'Reconnect',
        description: 'Restore network access, then start translation again.',
      },
      retryable: true,
      code: 'browser-offline',
    });
  }

  if (input.playbackError) {
    return mapPlaybackErrorDiagnostic(input, input.playbackError);
  }

  if (input.runtimeError) {
    return mapRuntimeErrorDiagnostic(input, input.runtimeError);
  }

  if (input.sourceError) {
    return mapSourceErrorDiagnostic(input, input.sourceError);
  }

  if (!input.sourceCapability.canRequest) {
    return mapSourceCapabilityDiagnostic(input, input.sourceCapability);
  }

  if (input.isStopPending || input.runtimeStatus === 'stopping') {
    return buildDiagnostic(input, {
      category: 'loading',
      severity: 'info',
      owner: 'runtime',
      title: 'Cleanup diagnostic',
      message: 'Runtime and source resources are being released.',
      recovery: {
        label: 'Wait',
        description: 'Wait for cleanup to finish before starting a new session.',
      },
      retryable: false,
      code: 'stop-pending',
    });
  }

  if (input.runtimeStatus === 'requesting-client-secret') {
    return buildDiagnostic(input, {
      category: 'loading',
      severity: 'info',
      owner: 'backend',
      title: 'Backend request diagnostic',
      message: 'The backend translation route is preparing an ephemeral session.',
      recovery: {
        label: 'Wait',
        description: 'Keep the tab open while the backend request completes.',
      },
      retryable: false,
      code: 'client-secret-pending',
    });
  }

  if (input.runtimeStatus === 'connecting') {
    return buildDiagnostic(input, {
      category: 'loading',
      severity: 'info',
      owner: 'runtime',
      title: 'WebRTC startup diagnostic',
      message: 'WebRTC negotiation is in progress.',
      recovery: {
        label: 'Wait',
        description: 'Keep the source active while SDP negotiation completes.',
      },
      retryable: false,
      code: 'webrtc-connecting',
    });
  }

  if (input.sourceStatus === 'requesting' || input.isStartPending) {
    return buildDiagnostic(input, {
      category: 'loading',
      severity: 'info',
      owner: 'source',
      title: 'Source request diagnostic',
      message: 'The browser is waiting for the selected audio source.',
      recovery: {
        label: 'Approve source',
        description: 'Approve the browser prompt, or cancel and choose another source.',
      },
      retryable: false,
      code: 'source-requesting',
    });
  }

  if (input.runtimeStatus === 'connected' && !input.translatedAudioStream) {
    return buildDiagnostic(input, {
      category: 'remote-audio',
      severity: 'warning',
      owner: 'audio',
      title: 'Remote audio diagnostic',
      message: 'The runtime is connected but no translated audio track has arrived yet.',
      recovery: {
        label: 'Keep speaking',
        description: 'Continue sending source audio, or stop and retry if audio never arrives.',
      },
      retryable: true,
      code: 'remote-audio-pending',
    });
  }

  if (input.runtimeStatus === 'connected') {
    return buildDiagnostic(input, {
      category: 'active',
      severity: 'info',
      owner: 'runtime',
      title: 'Runtime diagnostic active',
      message: 'Translated audio is attached and ready for playback.',
      recovery: {
        label: 'Monitor session',
        description: 'Use Stop when the demo is complete.',
      },
      retryable: false,
      code: 'translation-connected',
    });
  }

  if (input.sourceStatus === 'ready') {
    return buildDiagnostic(input, {
      category: 'source-ready',
      severity: 'info',
      owner: 'source',
      title: 'Source diagnostic ready',
      message: 'The selected source is captured and ready for translation startup.',
      recovery: {
        label: 'Start translation',
        description: 'Start the runtime when the target language is correct.',
      },
      retryable: true,
      code: 'source-ready',
    });
  }

  if (input.sourceStatus === 'ended') {
    return buildDiagnostic(input, {
      category: 'source-ended',
      severity: 'warning',
      owner: 'source',
      title: 'Audio source ended',
      message: 'The selected audio source ended before translation restarted.',
      recovery: {
        label: 'Choose source again',
        description: 'Select an active source, then start translation again.',
      },
      retryable: true,
      code: 'source-ended',
    });
  }

  if (input.runtimeStatus === 'stopped' || input.sourceStatus === 'stopped') {
    return buildDiagnostic(input, {
      category: 'stopped',
      severity: 'info',
      owner: 'provider',
      title: 'Stopped diagnostic',
      message: 'Resources were released and the controls are ready for another session.',
      recovery: {
        label: 'Start when ready',
        description: 'Choose a source and target language, then start translation.',
      },
      retryable: true,
      code: 'translation-stopped',
    });
  }

  return buildDiagnostic(input, {
    category: 'ready',
    severity: 'info',
    owner: 'provider',
    title: 'Ready diagnostic',
    message: 'Choose a source and target language, then start translation.',
    recovery: {
      label: 'Start translation',
      description: 'Use a supported source and keep the backend route configured.',
    },
    retryable: true,
    code: 'translation-ready',
  });
}

export function getOpenAITranslationDiagnosticCategoryLabel(
  category: OpenAITranslationDiagnosticCategory
): string {
  switch (category) {
    case 'ready':
      return 'Ready';
    case 'loading':
      return 'Loading';
    case 'active':
      return 'Active';
    case 'stopped':
      return 'Stopped';
    case 'source-ready':
      return 'Source ready';
    case 'source-unsupported':
      return 'Source unsupported';
    case 'source-restricted':
      return 'Source restricted';
    case 'source-unavailable':
      return 'Source unavailable';
    case 'source-permission':
      return 'Source permission';
    case 'source-cancelled':
      return 'Source cancelled';
    case 'source-missing-audio':
      return 'Missing audio';
    case 'source-ended':
      return 'Source ended';
    case 'source-cleanup':
      return 'Source cleanup';
    case 'backend-validation':
      return 'Backend validation';
    case 'backend-token':
      return 'Backend token';
    case 'backend-configuration':
      return 'Backend configuration';
    case 'backend-auth':
      return 'Backend authentication';
    case 'backend-rate-limit':
      return 'Backend rate limit';
    case 'backend-service':
      return 'Backend service';
    case 'backend-timeout':
      return 'Backend timeout';
    case 'backend-response':
      return 'Backend response';
    case 'sdp-exchange':
      return 'SDP exchange';
    case 'webrtc-peer':
      return 'WebRTC peer';
    case 'ice-connection':
      return 'ICE connection';
    case 'data-channel':
      return 'Data channel';
    case 'parser':
      return 'Event parser';
    case 'remote-audio':
      return 'Remote audio';
    case 'playback':
      return 'Playback';
    case 'offline':
      return 'Offline';
    case 'aborted':
      return 'Aborted';
    case 'cleanup':
      return 'Cleanup';
    case 'validation':
      return 'Validation';
    case 'unknown':
      return 'Unknown';
    default:
      return assertNeverDiagnosticCategory(category);
  }
}

function mapPlaybackErrorDiagnostic(
  input: OpenAITranslationDiagnosticInput,
  error: OpenAITranslationPlaybackError
): OpenAITranslationDiagnostic {
  const streamLabel = error.streamKind === 'translated' ? 'translated' : 'original';

  return buildDiagnostic(input, {
    category: 'playback',
    severity: 'warning',
    owner: 'audio',
    title: 'Audio playback failed',
    message: sanitizeDiagnosticText(
      error.message,
      `The ${streamLabel} audio element could not play the attached stream.`
    ),
    recovery: {
      label: 'Retry playback',
      description: 'Check browser autoplay permissions, then stop and start translation again.',
    },
    retryable: error.recoverable,
    code: error.code,
    extraDetails: [
      { label: 'Code', value: error.code },
      { label: 'Stream', value: streamLabel },
    ],
  });
}

function mapSourceErrorDiagnostic(
  input: OpenAITranslationDiagnosticInput,
  error: OpenAITranslationSourceError
): OpenAITranslationDiagnostic {
  const safeMessage = sanitizeDiagnosticText(error.message, 'Audio source capture failed.');
  const baseDetails = appendOptionalDetails(
    [],
    [
      ['Code', error.code],
      ['Browser error', error.rawName],
    ]
  );

  switch (error.kind) {
    case 'unsupported':
      if (error.code === 'source-restricted') {
        return buildDiagnostic(input, {
          category: 'source-restricted',
          severity: 'error',
          owner: 'browser',
          title: 'Secure context required',
          message: safeMessage,
          recovery: {
            label: 'Use HTTPS or localhost',
            description: 'Open the demo from a secure context, then retry capture.',
          },
          retryable: error.recoverable,
          code: error.code,
          extraDetails: baseDetails,
        });
      }

      if (error.code === 'source-unavailable') {
        return buildDiagnostic(input, {
          category: 'source-unavailable',
          severity: 'error',
          owner: 'source',
          title: 'Media devices unavailable',
          message: safeMessage,
          recovery: {
            label: 'Use a browser with media devices',
            description: 'Enable media device access or switch to a supported browser.',
          },
          retryable: error.recoverable,
          code: error.code,
          extraDetails: baseDetails,
        });
      }

      return buildDiagnostic(input, {
        category: 'source-unsupported',
        severity: 'error',
        owner: 'source',
        title: 'Audio source unsupported',
        message: safeMessage,
        recovery: {
          label: 'Switch source or browser',
          description:
            'Choose a supported source, or use a browser that supports this capture API.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    case 'permission-denied':
      return buildDiagnostic(input, {
        category: 'source-permission',
        severity: 'error',
        owner: 'browser',
        title: 'Source permission denied',
        message: safeMessage,
        recovery: {
          label: 'Grant permission',
          description: 'Allow the requested audio permission in the browser, then retry.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    case 'capture-cancelled':
      return buildDiagnostic(input, {
        category: 'source-cancelled',
        severity: 'warning',
        owner: 'browser',
        title: 'Source selection cancelled',
        message: safeMessage,
        recovery: {
          label: 'Choose source again',
          description: 'Start translation again and complete the browser picker.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    case 'device-unavailable':
    case 'capture-failed':
      return buildDiagnostic(input, {
        category: 'source-unavailable',
        severity: 'error',
        owner: 'source',
        title: 'Audio source unavailable',
        message: safeMessage,
        recovery: {
          label: 'Check source',
          description: 'Confirm the selected device or tab is active, then retry capture.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    case 'missing-audio-track':
      return buildDiagnostic(input, {
        category: 'source-missing-audio',
        severity: 'error',
        owner: 'source',
        title: 'No audio track found',
        message: safeMessage,
        recovery: {
          label: 'Share audio',
          description: 'Choose a browser tab and enable audio sharing before retrying.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    case 'track-ended':
      return buildDiagnostic(input, {
        category: 'source-ended',
        severity: 'warning',
        owner: 'source',
        title: 'Audio source ended',
        message: safeMessage,
        recovery: {
          label: 'Restart source',
          description: 'Select an active source again, then restart translation.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    case 'cleanup':
      return buildDiagnostic(input, {
        category: 'source-cleanup',
        severity: 'error',
        owner: 'source',
        title: 'Source cleanup failed',
        message: safeMessage,
        recovery: {
          label: 'Reset source',
          description: 'Stop the session and refresh the source state before retrying.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    case 'unknown':
      return buildDiagnostic(input, {
        category: 'unknown',
        severity: 'error',
        owner: 'source',
        title: 'Source capture failed',
        message: safeMessage,
        recovery: {
          label: 'Retry capture',
          description: 'Retry the source request or switch to another source.',
        },
        retryable: error.recoverable,
        code: error.code,
        extraDetails: baseDetails,
      });

    default:
      return assertNeverSourceErrorKind(error.kind);
  }
}

function mapSourceCapabilityDiagnostic(
  input: OpenAITranslationDiagnosticInput,
  capability: OpenAITranslationSourceCapability
): OpenAITranslationDiagnostic {
  const message =
    capability.message ?? `${formatSourceMode(capability.mode)} capture is unavailable.`;

  switch (capability.status) {
    case 'restricted':
      return buildDiagnostic(input, {
        category: 'source-restricted',
        severity: 'error',
        owner: 'browser',
        title: 'Secure context required',
        message,
        recovery: {
          label: 'Use HTTPS or localhost',
          description: 'Open the demo in a secure context, then retry.',
        },
        retryable: true,
        code: 'source-restricted',
      });
    case 'unavailable':
      return buildDiagnostic(input, {
        category: 'source-unavailable',
        severity: 'error',
        owner: 'browser',
        title: 'Media devices unavailable',
        message,
        recovery: {
          label: 'Enable media devices',
          description: 'Use a browser context with `navigator.mediaDevices` support.',
        },
        retryable: true,
        code: 'source-unavailable',
      });
    case 'unsupported':
      return buildDiagnostic(input, {
        category: 'source-unsupported',
        severity: 'error',
        owner: 'browser',
        title: 'Audio source unsupported',
        message,
        recovery: {
          label: 'Switch source or browser',
          description: 'Choose another source or use a browser with the required capture API.',
        },
        retryable: false,
        code: 'source-unsupported',
      });
    case 'available':
      return buildOpenAITranslationDiagnostic({ ...input, sourceCapability: capability });
    default:
      return assertNeverCapabilityStatus(capability.status);
  }
}

function mapRuntimeErrorDiagnostic(
  input: OpenAITranslationDiagnosticInput,
  error: OpenAITranslationRuntimeError
): OpenAITranslationDiagnostic {
  const safeMessage = sanitizeDiagnosticText(error.message, 'Translation runtime failed.');
  const extraDetails = appendOptionalDetails(
    [],
    [
      ['Code', error.code],
      ['HTTP', typeof error.status === 'number' ? String(error.status) : undefined],
      ['Route category', error.routeCategory],
    ]
  );

  switch (error.kind) {
    case 'validation':
      return buildDiagnostic(input, {
        category: 'validation',
        severity: 'error',
        owner: 'runtime',
        title: 'Translation input invalid',
        message: safeMessage,
        recovery: {
          label: 'Check configuration',
          description: 'Choose a supported source and target language, then retry.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'client-secret':
      return buildClientSecretDiagnostic(input, error, safeMessage, extraDetails);
    case 'sdp-exchange':
      return buildDiagnostic(input, {
        category: 'sdp-exchange',
        severity: 'error',
        owner: 'runtime',
        title: 'SDP exchange failed',
        message: safeMessage,
        recovery: {
          label: 'Retry connection',
          description: 'Stop the current attempt, then start translation again.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'webrtc':
      return buildWebRtcDiagnostic(input, error, safeMessage, extraDetails);
    case 'data-channel':
      return buildDiagnostic(input, {
        category: 'data-channel',
        severity: 'error',
        owner: 'runtime',
        title: 'Data channel failed',
        message: safeMessage,
        recovery: {
          label: 'Retry connection',
          description: 'Restart translation so the data channel can be recreated.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'parser':
      return buildDiagnostic(input, {
        category: 'parser',
        severity: 'error',
        owner: 'runtime',
        title: 'Translation event parse failed',
        message: safeMessage,
        recovery: {
          label: 'Restart runtime',
          description: 'Restart translation if malformed events continue.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'cleanup':
      return buildDiagnostic(input, {
        category: 'cleanup',
        severity: 'error',
        owner: 'runtime',
        title: 'Runtime cleanup failed',
        message: safeMessage,
        recovery: {
          label: 'Reset runtime',
          description: 'Stop translation, refresh the tab if needed, then retry.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'offline':
      return buildDiagnostic(input, {
        category: 'offline',
        severity: 'warning',
        owner: 'browser',
        title: 'Offline diagnostic',
        message: safeMessage,
        recovery: {
          label: 'Reconnect',
          description: 'Restore network access, then start translation again.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'aborted':
      return buildDiagnostic(input, {
        category: 'aborted',
        severity: 'warning',
        owner: 'runtime',
        title: 'Startup aborted',
        message: safeMessage,
        recovery: {
          label: 'Start again',
          description: 'Retry translation when no stop or provider-switch operation is pending.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'unknown':
      return buildDiagnostic(input, {
        category: 'unknown',
        severity: 'error',
        owner: 'runtime',
        title: 'Translation runtime failed',
        message: safeMessage,
        recovery: {
          label: 'Retry translation',
          description: 'Stop and start translation again, or refresh the page.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    default:
      return assertNeverRuntimeErrorKind(error.kind);
  }
}

function buildClientSecretDiagnostic(
  input: OpenAITranslationDiagnosticInput,
  error: OpenAITranslationRuntimeError,
  safeMessage: string,
  extraDetails: readonly OpenAITranslationDiagnosticDetail[]
): OpenAITranslationDiagnostic {
  const category = mapRouteCategoryToDiagnosticCategory(error.routeCategory, error.status);

  switch (category) {
    case 'backend-validation':
      return buildDiagnostic(input, {
        category,
        severity: 'error',
        owner: 'backend',
        title: 'Backend validation failed',
        message: safeMessage,
        recovery: {
          label: 'Check target language',
          description: 'Choose a supported target language and retry.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'backend-configuration':
      return buildDiagnostic(input, {
        category,
        severity: 'error',
        owner: 'backend',
        title: 'Backend API key missing',
        message: safeMessage,
        recovery: {
          label: 'Configure server',
          description: 'Set the server-side OpenAI key, then restart the backend.',
        },
        retryable: false,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'backend-auth':
      return buildDiagnostic(input, {
        category,
        severity: 'error',
        owner: 'backend',
        title: 'OpenAI authentication failed',
        message: safeMessage,
        recovery: {
          label: 'Check server key',
          description: 'Verify the server-side OpenAI key and retry after updating it.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'backend-rate-limit':
      return buildDiagnostic(input, {
        category,
        severity: 'warning',
        owner: 'backend',
        title: 'OpenAI rate limit hit',
        message: safeMessage,
        recovery: {
          label: 'Wait and retry',
          description: 'Wait for rate limits to recover, then start translation again.',
        },
        retryable: true,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'backend-timeout':
      return buildDiagnostic(input, {
        category,
        severity: 'warning',
        owner: 'backend',
        title: 'OpenAI request timed out',
        message: safeMessage,
        recovery: {
          label: 'Retry request',
          description: 'Retry translation after network conditions stabilize.',
        },
        retryable: true,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'backend-response':
      return buildDiagnostic(input, {
        category,
        severity: 'error',
        owner: 'backend',
        title: 'OpenAI response invalid',
        message: safeMessage,
        recovery: {
          label: 'Retry later',
          description: 'Retry after confirming the translation API is returning client secrets.',
        },
        retryable: true,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    case 'backend-token':
    case 'backend-service':
      return buildDiagnostic(input, {
        category,
        severity: 'error',
        owner: 'backend',
        title:
          category === 'backend-token' ? 'Client secret request failed' : 'OpenAI service failed',
        message: safeMessage,
        recovery: {
          label: 'Retry backend route',
          description: 'Retry translation, or check backend logs if the route keeps failing.',
        },
        retryable: error.recoverable,
        code: error.code,
        status: error.status,
        extraDetails,
      });
    default:
      return assertNeverClientSecretCategory(category);
  }
}

function buildWebRtcDiagnostic(
  input: OpenAITranslationDiagnosticInput,
  error: OpenAITranslationRuntimeError,
  safeMessage: string,
  extraDetails: readonly OpenAITranslationDiagnosticDetail[]
): OpenAITranslationDiagnostic {
  if (error.code === 'ice-connection-failed') {
    return buildDiagnostic(input, {
      category: 'ice-connection',
      severity: 'error',
      owner: 'runtime',
      title: 'ICE connection failed',
      message: safeMessage,
      recovery: {
        label: 'Retry network path',
        description: 'Check network connectivity and retry translation.',
      },
      retryable: error.recoverable,
      code: error.code,
      status: error.status,
      extraDetails,
    });
  }

  if (error.code === 'missing-remote-audio') {
    return buildDiagnostic(input, {
      category: 'remote-audio',
      severity: 'warning',
      owner: 'audio',
      title: 'Remote audio missing',
      message: safeMessage,
      recovery: {
        label: 'Retry runtime',
        description: 'Restart translation if remote audio never attaches.',
      },
      retryable: error.recoverable,
      code: error.code,
      status: error.status,
      extraDetails,
    });
  }

  return buildDiagnostic(input, {
    category: 'webrtc-peer',
    severity: 'error',
    owner: 'runtime',
    title: 'WebRTC connection failed',
    message: safeMessage,
    recovery: {
      label: 'Retry connection',
      description: 'Restart translation so the peer connection can be recreated.',
    },
    retryable: error.recoverable,
    code: error.code,
    status: error.status,
    extraDetails,
  });
}

function mapRouteCategoryToDiagnosticCategory(
  routeCategory: OpenAITranslationRouteErrorCategory | undefined,
  status: number | undefined
): Extract<
  OpenAITranslationDiagnosticCategory,
  | 'backend-validation'
  | 'backend-token'
  | 'backend-configuration'
  | 'backend-auth'
  | 'backend-rate-limit'
  | 'backend-service'
  | 'backend-timeout'
  | 'backend-response'
> {
  switch (routeCategory) {
    case 'validation':
      return 'backend-validation';
    case 'server-configuration':
      return 'backend-configuration';
    case 'openai-auth':
      return 'backend-auth';
    case 'openai-rate-limit':
      return 'backend-rate-limit';
    case 'openai-service':
    case 'network':
    case 'unknown':
      return 'backend-service';
    case 'openai-timeout':
      return 'backend-timeout';
    case 'openai-response':
      return 'backend-response';
    case undefined:
      return mapHttpStatusToBackendCategory(status);
    default:
      return assertNeverRouteCategory(routeCategory);
  }
}

function mapHttpStatusToBackendCategory(
  status: number | undefined
): Extract<
  OpenAITranslationDiagnosticCategory,
  | 'backend-validation'
  | 'backend-token'
  | 'backend-configuration'
  | 'backend-auth'
  | 'backend-rate-limit'
  | 'backend-service'
  | 'backend-timeout'
  | 'backend-response'
> {
  if (status === 400 || status === 422) {
    return 'backend-validation';
  }

  if (status === 401 || status === 403) {
    return 'backend-auth';
  }

  if (status === 429) {
    return 'backend-rate-limit';
  }

  if (status === 504 || status === 408) {
    return 'backend-timeout';
  }

  if (status === 500) {
    return 'backend-configuration';
  }

  if (status === 502) {
    return 'backend-response';
  }

  if (typeof status === 'number' && status >= 500) {
    return 'backend-service';
  }

  return 'backend-token';
}

function buildDiagnostic(
  input: OpenAITranslationDiagnosticInput,
  base: DiagnosticBase
): OpenAITranslationDiagnostic {
  return {
    category: base.category,
    severity: base.severity,
    owner: base.owner,
    title: sanitizeDiagnosticText(base.title, 'Translation diagnostic'),
    message: sanitizeDiagnosticText(base.message, 'Translation diagnostics are available.'),
    recovery: {
      label: sanitizeDiagnosticText(base.recovery.label, 'Review diagnostic'),
      description: sanitizeDiagnosticText(
        base.recovery.description,
        'Review the diagnostic details and retry when ready.'
      ),
    },
    details: sanitizeDetails([
      ...buildBaseDetails(input, base.category),
      ...(base.extraDetails ?? []),
    ]),
    retryable: base.retryable,
    ...(base.code ? { code: sanitizeDiagnosticText(base.code, 'diagnostic-code') } : {}),
    ...(typeof base.status === 'number' ? { status: base.status } : {}),
  };
}

function buildBaseDetails(
  input: OpenAITranslationDiagnosticInput,
  category: OpenAITranslationDiagnosticCategory
): readonly OpenAITranslationDiagnosticDetail[] {
  const audioState = input.translatedAudioStream
    ? 'translated audio attached'
    : input.runtimeStatus === 'connected'
      ? 'waiting for translated audio'
      : 'translated audio unavailable';
  const originalState = input.originalAudioStream ? ', original audio attached' : '';

  return [
    { label: 'Category', value: getOpenAITranslationDiagnosticCategoryLabel(category) },
    { label: 'Source', value: formatSourceStatus(input.sourceStatus) },
    { label: 'Runtime', value: formatRuntimeStatus(input.runtimeStatus) },
    {
      label: 'Selected',
      value: `${formatSourceMode(input.sourceMode)} to ${input.targetLanguageLabel}`,
    },
    { label: 'Transcript', value: formatTranscriptSummary(input.transcriptSummary) },
    { label: 'Audio', value: `${audioState}${originalState}` },
  ];
}

function sanitizeDetails(
  details: readonly OpenAITranslationDiagnosticDetail[]
): readonly OpenAITranslationDiagnosticDetail[] {
  return details.map((detail) => ({
    label: sanitizeDiagnosticText(detail.label, 'Detail'),
    value: sanitizeDiagnosticText(detail.value, 'Not available'),
  }));
}

function appendOptionalDetails(
  details: readonly OpenAITranslationDiagnosticDetail[],
  entries: readonly (readonly [string, string | undefined])[]
): readonly OpenAITranslationDiagnosticDetail[] {
  const nextDetails: OpenAITranslationDiagnosticDetail[] = [...details];

  for (const [label, value] of entries) {
    if (typeof value === 'string' && value.trim().length > 0) {
      nextDetails.push({ label, value });
    }
  }

  return nextDetails;
}

function sanitizeDiagnosticText(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  if (SENSITIVE_DIAGNOSTIC_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return fallback;
  }

  return trimmed.length > 240 ? `${trimmed.slice(0, 237)}...` : trimmed;
}

function formatSourceMode(mode: OpenAITranslationSourceMode): string {
  switch (mode) {
    case 'microphone':
      return 'Microphone';
    case 'browser-tab':
      return 'Tab audio';
    default:
      return assertNeverSourceMode(mode);
  }
}

function formatSourceStatus(status: OpenAITranslationSourceStatus): string {
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

function formatRuntimeStatus(status: OpenAITranslationHookStatus): string {
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

function formatTranscriptSummary(summary: OpenAITranslationTranscriptSummary): string {
  if (!summary.hasEntries) {
    return 'waiting for lines';
  }

  const lineLabel = summary.totalCount === 1 ? 'line' : 'lines';
  return `${summary.totalCount} ${lineLabel}, ${summary.sourceCount} source, ${summary.translatedCount} translated`;
}

function assertNeverDiagnosticCategory(category: never): never {
  throw new Error(`Unhandled OpenAI translation diagnostic category: ${String(category)}`);
}

function assertNeverSourceMode(mode: never): never {
  throw new Error(`Unhandled OpenAI translation source mode: ${String(mode)}`);
}

function assertNeverSourceStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation source status: ${String(status)}`);
}

function assertNeverRuntimeStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation runtime status: ${String(status)}`);
}

function assertNeverCapabilityStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation source capability status: ${String(status)}`);
}

function assertNeverSourceErrorKind(kind: never): never {
  throw new Error(`Unhandled OpenAI translation source error kind: ${String(kind)}`);
}

function assertNeverRuntimeErrorKind(kind: never): never {
  throw new Error(`Unhandled OpenAI translation runtime error kind: ${String(kind)}`);
}

function assertNeverRouteCategory(category: never): never {
  throw new Error(`Unhandled OpenAI translation route error category: ${String(category)}`);
}

function assertNeverClientSecretCategory(category: never): never {
  throw new Error(`Unhandled OpenAI translation client-secret category: ${String(category)}`);
}
