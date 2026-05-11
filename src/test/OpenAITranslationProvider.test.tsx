import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAITranslationProvider } from '@/components/providers/OpenAITranslationProvider';
import {
  OPENAI_TRANSLATION_LANGUAGE_COUNT,
  createOpenAITranslationRuntimeError,
  getOpenAITranslationSourceModes,
} from '@/lib/openaiTranslation';
import type {
  OpenAITranslationSourceCapabilities,
  OpenAITranslationSourceMode,
  OpenAITranslationSourceResult,
  UseOpenAITranslationResult,
  UseOpenAITranslationSourceResult,
} from '@/types/openai-translation';

const hookMocks = vi.hoisted(() => ({
  useOpenAITranslation: vi.fn(),
  useOpenAITranslationSource: vi.fn(),
}));

vi.mock('@/hooks/useOpenAITranslation', () => ({
  useOpenAITranslation: hookMocks.useOpenAITranslation,
}));

vi.mock('@/hooks/useOpenAITranslationSource', () => ({
  useOpenAITranslationSource: hookMocks.useOpenAITranslationSource,
}));

interface AudioElementWithSrcObject extends HTMLAudioElement {
  __srcObject?: MediaStream | null;
}

const availableCapabilities: OpenAITranslationSourceCapabilities = {
  microphone: {
    mode: 'microphone',
    supported: true,
    canRequest: true,
    status: 'available',
    message: null,
  },
  browserTab: {
    mode: 'browser-tab',
    supported: true,
    canRequest: true,
    status: 'available',
    message: null,
  },
};

describe('OpenAITranslationProvider', () => {
  const fetchMock = vi.fn();
  const getUserMediaMock = vi.fn();
  const getDisplayMediaMock = vi.fn();
  const captureMicrophoneMock = vi.fn<() => Promise<boolean>>();
  const captureBrowserTabMock = vi.fn<() => Promise<boolean>>();
  const sourceStopMock = vi.fn();
  const sourceResetMock = vi.fn();
  const runtimeStartMock = vi.fn<UseOpenAITranslationResult['start']>();
  const runtimeStopMock = vi.fn<UseOpenAITranslationResult['stop']>();
  const runtimeClearTranscriptsMock = vi.fn();
  const runtimeResetMock = vi.fn();
  const audioPauseMock = vi.fn();
  const audioLoadMock = vi.fn();
  let sourceResult: UseOpenAITranslationSourceResult;
  let runtimeResult: UseOpenAITranslationResult;

  beforeEach(() => {
    captureMicrophoneMock.mockResolvedValue(true);
    captureBrowserTabMock.mockResolvedValue(true);
    runtimeStartMock.mockResolvedValue(true);
    runtimeStopMock.mockResolvedValue({ ok: true, error: null });

    sourceResult = createSourceHookResult();
    runtimeResult = createRuntimeHookResult();
    hookMocks.useOpenAITranslationSource.mockImplementation(() => sourceResult);
    hookMocks.useOpenAITranslation.mockImplementation(() => runtimeResult);

    Object.assign(navigator.mediaDevices, {
      getUserMedia: getUserMediaMock,
      getDisplayMedia: getDisplayMediaMock,
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
      configurable: true,
      get(this: AudioElementWithSrcObject) {
        return this.__srcObject ?? null;
      },
      set(this: AudioElementWithSrcObject, value: MediaStream | null) {
        this.__srcObject = value;
      },
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: audioPauseMock,
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value: audioLoadMock,
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('isSecureContext', true);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders interactive source, language, status, and audio controls without media or network requests', () => {
    render(<OpenAITranslationProvider />);

    expect(
      screen.getByRole('heading', { name: /live translation/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /audio source/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /target language/i })).toHaveValue('en');
    expect(screen.getByText(/ready to translate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/translated audio playback/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export markdown/i })).toBeDisabled();
    expect(screen.getByRole('log', { name: /translation transcript/i })).toBeInTheDocument();
    expect(screen.getByText(/translated captions will appear here/i)).toBeInTheDocument();
    expect(screen.getByText(/no transcript lines in the current session/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUserMediaMock).not.toHaveBeenCalled();
    expect(getDisplayMediaMock).not.toHaveBeenCalled();
  });

  it('uses shared source metadata and supported target language metadata', () => {
    const sourceModes = getOpenAITranslationSourceModes();

    render(<OpenAITranslationProvider />);

    for (const sourceMode of sourceModes) {
      expect(
        screen.getByRole('radio', {
          name: new RegExp(`${sourceMode.label} source available`, 'i'),
        })
      ).toBeEnabled();
    }
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Spanish' })).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`${OPENAI_TRANSLATION_LANGUAGE_COUNT} supported target languages`, 'i')
      )
    ).toBeInTheDocument();
  });

  it('updates source and target language selection before start', async () => {
    const user = userEvent.setup();

    render(<OpenAITranslationProvider />);

    await user.click(screen.getByRole('radio', { name: /tab audio source available/i }));
    await user.selectOptions(screen.getByRole('combobox', { name: /target language/i }), 'es');

    expect(screen.getByRole('radio', { name: /tab audio source available/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('combobox', { name: /target language/i })).toHaveValue('es');
    expect(captureBrowserTabMock).not.toHaveBeenCalled();
  });

  it('captures the selected source and starts runtime with the selected target language', async () => {
    const user = userEvent.setup();
    const source = createSourceResult('browser-tab');
    sourceResult = createSourceHookResult({
      status: 'ready',
      mode: 'browser-tab',
      stream: source.sourceStream,
      audioTracks: source.audioTracks,
      source,
      isReady: true,
    });

    render(<OpenAITranslationProvider />);

    await user.click(screen.getByRole('radio', { name: /tab audio source available/i }));
    await user.selectOptions(screen.getByRole('combobox', { name: /target language/i }), 'ja');
    await user.click(screen.getByRole('button', { name: /start translation/i }));

    await waitFor(() => {
      expect(captureBrowserTabMock).toHaveBeenCalledTimes(1);
      expect(runtimeStartMock).toHaveBeenCalledWith({
        sourceStream: source.sourceStream,
        targetLanguage: 'ja',
        ownsSourceStream: true,
      });
    });
  });

  it('disables duplicate start triggers while source or runtime work is in flight', () => {
    sourceResult = createSourceHookResult({ status: 'requesting', isRequesting: true });
    runtimeResult = createRuntimeHookResult({
      status: 'requesting-client-secret',
      isStarting: true,
    });

    render(<OpenAITranslationProvider />);

    expect(screen.getByRole('button', { name: /start translation/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /microphone source available/i })).toBeDisabled();
    expect(
      screen.getByRole('heading', { name: /requesting client secret/i, level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /backend request diagnostic/i })
    ).toBeInTheDocument();
  });

  it('renders source diagnostics with safe details and retry behavior', async () => {
    const user = userEvent.setup();
    sourceResult = createSourceHookResult({
      status: 'error',
      mode: 'microphone',
      error: {
        kind: 'permission-denied',
        mode: 'microphone',
        message: 'Microphone permission was denied by the browser.',
        recoverable: true,
        code: 'permission-denied',
        rawName: 'NotAllowedError',
      },
    });

    render(<OpenAITranslationProvider />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/source permission/i);
    expect(alert).toHaveTextContent(/source permission denied/i);
    expect(alert).toHaveTextContent(/code/i);
    expect(alert).toHaveTextContent(/permission-denied/i);

    await user.click(screen.getByRole('button', { name: /^retry$/i }));

    await waitFor(() => {
      expect(runtimeStopMock).toHaveBeenCalledWith('reset');
      expect(sourceStopMock).toHaveBeenCalledTimes(1);
      expect(captureMicrophoneMock).toHaveBeenCalledTimes(1);
    });
  });

  it('renders backend diagnostics without leaking raw secret-looking payloads', () => {
    runtimeResult = createRuntimeHookResult({
      status: 'error',
      error: createOpenAITranslationRuntimeError(
        'client-secret',
        'Bearer sk-test OPENAI_API_KEY raw provider payload',
        {
          code: 'openai-rate-limited',
          status: 429,
          routeCategory: 'openai-rate-limit',
        }
      ),
    });

    render(<OpenAITranslationProvider />);

    const diagnostic = screen.getByRole('status', { name: /openai rate limit hit/i });
    expect(diagnostic).toHaveTextContent(/backend rate limit/i);
    expect(diagnostic).toHaveTextContent(/translation runtime failed/i);
    expect(diagnostic).toHaveTextContent(/openai-rate-limited/i);
    expect(diagnostic).not.toHaveTextContent(/sk-test/i);
    expect(diagnostic).not.toHaveTextContent(/bearer/i);
    expect(diagnostic).not.toHaveTextContent(/OPENAI_API_KEY/i);
  });

  it('renders offline provider status with disabled start and retry controls', () => {
    render(<OpenAITranslationProvider isOffline />);

    expect(screen.getByRole('button', { name: /start translation/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export markdown/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /clear transcript/i })).toBeDisabled();
    expect(screen.getByRole('heading', { name: /browser offline/i, level: 2 })).toBeInTheDocument();

    const diagnostic = screen.getByRole('status', { name: /offline diagnostic/i });
    expect(diagnostic).toHaveTextContent(/offline/i);
    expect(screen.getByText(/reconnect before starting/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^retry$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^stop$/i })).toBeDisabled();
    expect(captureMicrophoneMock).not.toHaveBeenCalled();
    expect(runtimeStartMock).not.toHaveBeenCalled();
  });

  it('surfaces translated audio playback diagnostics from the audio element', () => {
    runtimeResult = createRuntimeHookResult({
      status: 'connected',
      isConnected: true,
      translatedAudioStream: createMediaStream(),
    });

    render(<OpenAITranslationProvider />);
    fireEvent.error(screen.getByLabelText(/translated audio playback/i));

    const diagnostic = screen.getByRole('status', { name: /audio playback failed/i });
    expect(diagnostic).toHaveTextContent(/playback/i);
    expect(diagnostic).toHaveTextContent(/translated-audio-playback-failed/i);
  });

  it('stops runtime and source resources from the Stop control', async () => {
    const user = userEvent.setup();
    const source = createSourceResult('microphone');
    sourceResult = createSourceHookResult({
      status: 'ready',
      mode: 'microphone',
      stream: source.sourceStream,
      audioTracks: source.audioTracks,
      source,
      isReady: true,
    });
    runtimeResult = createRuntimeHookResult({ status: 'connected', isConnected: true });

    render(<OpenAITranslationProvider />);

    await user.click(screen.getByRole('button', { name: /stop translation/i }));

    await waitFor(() => {
      expect(runtimeStopMock).toHaveBeenCalledWith('manual');
      expect(sourceStopMock).toHaveBeenCalledTimes(1);
    });
  });

  it('attaches translated audio streams and clears stale playback state', () => {
    const audioStream = createMediaStream();
    runtimeResult = createRuntimeHookResult({
      status: 'connected',
      isConnected: true,
      translatedAudioStream: audioStream,
    });
    const { rerender } = render(<OpenAITranslationProvider />);
    const audio = screen.getByLabelText(/translated audio playback/i) as HTMLAudioElement;

    expect(audio.srcObject).toBe(audioStream);

    runtimeResult = createRuntimeHookResult({ status: 'stopped' });
    rerender(<OpenAITranslationProvider />);

    expect(audio.srcObject).toBeNull();
    expect(audioPauseMock).toHaveBeenCalled();
    expect(audioLoadMock).toHaveBeenCalled();
  });

  it('renders browser-tab mix controls and applies translated and original audio volumes', () => {
    const source = createSourceResult('browser-tab');
    const translatedStream = createMediaStream();
    sourceResult = createSourceHookResult({
      status: 'ready',
      mode: 'browser-tab',
      stream: source.sourceStream,
      audioTracks: source.audioTracks,
      source,
      isReady: true,
      capabilities: {
        ...availableCapabilities,
        microphone: {
          mode: 'microphone',
          supported: false,
          canRequest: false,
          status: 'unsupported',
          message: 'Microphone unavailable in this test.',
        },
      },
      canCaptureMicrophone: false,
    });
    runtimeResult = createRuntimeHookResult({
      status: 'connected',
      isConnected: true,
      translatedAudioStream: translatedStream,
    });

    render(<OpenAITranslationProvider />);

    expect(screen.getByRole('heading', { name: /audio mix/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /translated audio mix/i })).toHaveAttribute(
      'aria-valuetext',
      '85% translated'
    );

    const translatedAudio = screen.getByLabelText(/translated audio playback/i) as HTMLAudioElement;
    const originalAudio = screen.getByLabelText(
      /original browser-tab audio playback/i
    ) as HTMLAudioElement;
    expect(translatedAudio.srcObject).toBe(translatedStream);
    expect(originalAudio.srcObject).toBe(source.sourceStream);
    expect(translatedAudio.volume).toBe(0.85);
    expect(originalAudio.volume).toBe(0.15);
  });

  it('hides browser-tab original audio controls in microphone mode', () => {
    const source = createSourceResult('microphone');
    sourceResult = createSourceHookResult({
      status: 'ready',
      mode: 'microphone',
      stream: source.sourceStream,
      audioTracks: source.audioTracks,
      source,
      isReady: true,
    });
    runtimeResult = createRuntimeHookResult({
      status: 'connected',
      isConnected: true,
      translatedAudioStream: createMediaStream(),
    });

    render(<OpenAITranslationProvider />);

    expect(screen.queryByRole('heading', { name: /audio mix/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/original browser-tab audio playback/i)).not.toBeInTheDocument();
  });

  it('renders active no-transcript states while connected', () => {
    runtimeResult = createRuntimeHookResult({ status: 'connected', isConnected: true });

    render(<OpenAITranslationProvider />);

    expect(screen.getByText(/listening for translated speech/i)).toBeInTheDocument();
    expect(
      screen.getByText(/listening for source and translated transcript lines/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/transcript: waiting for lines/i)).toBeInTheDocument();
    expect(screen.getByText(/elapsed: 00:00 \/ 30:00/i)).toBeInTheDocument();
  });

  it('renders latest caption and mixed transcript rows without translated audio', () => {
    runtimeResult = createRuntimeHookResult({
      status: 'connected',
      isConnected: true,
      transcripts: [
        {
          id: 'source-1',
          stream: 'source',
          text: 'hello',
          isFinal: true,
          updatedAt: 10,
        },
        {
          id: 'translated-1',
          stream: 'translated',
          text: 'hola',
          isFinal: false,
          updatedAt: 20,
        },
        {
          id: 'translated-2',
          stream: 'translated',
          text: 'buenos dias',
          isFinal: true,
          updatedAt: 30,
        },
      ],
    });

    render(<OpenAITranslationProvider />);

    expect(screen.getByLabelText(/latest translated caption/i)).toHaveTextContent('buenos dias');
    expect(screen.getByLabelText(/source transcript final: hello/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/translated transcript partial: hola/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/translated transcript final: buenos dias/i)).toBeInTheDocument();
    expect(screen.getByText(/transcript: 3 lines, 1 source, 2 translated/i)).toBeInTheDocument();
    expect(
      screen.getByText(/translation is connected and waiting for remote audio/i)
    ).toBeInTheDocument();
  });

  it('confirms transcript clearing without stopping an active translation session', async () => {
    const user = userEvent.setup();
    runtimeResult = createRuntimeHookResult({
      status: 'connected',
      isConnected: true,
      transcripts: [
        {
          id: 'translated-1',
          stream: 'translated',
          text: 'hola',
          isFinal: true,
          updatedAt: 10,
        },
      ],
    });

    const view = render(<OpenAITranslationProvider />);
    runtimeClearTranscriptsMock.mockImplementation(() => {
      runtimeResult = createRuntimeHookResult({
        status: 'connected',
        isConnected: true,
        transcripts: [],
      });
      view.rerender(<OpenAITranslationProvider />);
    });

    await user.click(screen.getByRole('button', { name: /clear transcript/i }));
    expect(runtimeClearTranscriptsMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /confirm clear/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm clear/i }));

    await waitFor(() => {
      expect(runtimeClearTranscriptsMock).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(/listening for source and translated transcript lines/i)
      ).toBeInTheDocument();
    });
    expect(runtimeStopMock).not.toHaveBeenCalled();
    expect(sourceStopMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /start translation/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /stop translation/i })).toBeEnabled();
  });

  it('exports the current transcript as Markdown and revokes the object URL', async () => {
    const user = userEvent.setup();
    const createObjectURLMock = vi.fn<(blob: Blob) => string>(() => 'blob:openai-translation');
    const revokeObjectURLMock = vi.fn();
    const anchorClickMock = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURLMock,
    });
    Object.defineProperty(window.HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      value: anchorClickMock,
    });
    runtimeResult = createRuntimeHookResult({
      status: 'stopped',
      transcripts: [
        {
          id: 'source-1',
          stream: 'source',
          text: 'hello',
          isFinal: true,
          updatedAt: 10,
        },
        {
          id: 'translated-1',
          stream: 'translated',
          text: 'hola',
          isFinal: true,
          updatedAt: 20,
        },
      ],
    });

    render(<OpenAITranslationProvider />);

    await user.click(screen.getByRole('button', { name: /export markdown/i }));

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(anchorClickMock).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:openai-translation');
      expect(screen.getByText(/transcript exported/i)).toBeInTheDocument();
    });

    const blob = createObjectURLMock.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    if (!(blob instanceof Blob)) {
      throw new Error('Expected Markdown export to create a Blob.');
    }
    await expect(blob.text()).resolves.toContain('| 2 | Translated | Final | hola |');
  });

  it('reports Markdown export setup failures', async () => {
    const user = userEvent.setup();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('object url unavailable');
      }),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    runtimeResult = createRuntimeHookResult({
      status: 'stopped',
      transcripts: [
        {
          id: 'translated-1',
          stream: 'translated',
          text: 'hola',
          isFinal: true,
          updatedAt: 20,
        },
      ],
    });

    render(<OpenAITranslationProvider />);

    await user.click(screen.getByRole('button', { name: /export markdown/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/transcript export failed/i);
  });

  it('auto-stops at the configured max-session duration using the shared stop path', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 4, 11, 17, 0, 0));
    vi.stubEnv('VITE_OPENAI_TRANSLATION_MAX_SESSION_MINUTES', '0.05');
    const source = createSourceResult('microphone');
    sourceResult = createSourceHookResult({
      status: 'ready',
      mode: 'microphone',
      stream: source.sourceStream,
      audioTracks: source.audioTracks,
      source,
      isReady: true,
    });
    runtimeResult = createRuntimeHookResult();
    let view: ReturnType<typeof render> | null = null;
    runtimeStartMock.mockImplementation(async () => {
      runtimeResult = createRuntimeHookResult({
        status: 'connected',
        isConnected: true,
        translatedAudioStream: createMediaStream(),
      });
      view?.rerender(<OpenAITranslationProvider />);
      return true;
    });

    view = render(<OpenAITranslationProvider />);

    fireEvent.click(screen.getByRole('button', { name: /start translation/i }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(runtimeStartMock).toHaveBeenCalledTimes(1);
    runtimeStopMock.mockClear();
    sourceStopMock.mockClear();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(runtimeStopMock).toHaveBeenCalledTimes(1);
    expect(runtimeStopMock).toHaveBeenCalledWith('max-session-duration');
    expect(sourceStopMock).toHaveBeenCalledTimes(1);
  });

  it('stops with source-ended reason when the active source ends', async () => {
    const source = createSourceResult('microphone');
    sourceResult = createSourceHookResult({
      status: 'ready',
      mode: 'microphone',
      stream: source.sourceStream,
      audioTracks: source.audioTracks,
      source,
      isReady: true,
    });
    let view: ReturnType<typeof render> | null = null;
    runtimeStartMock.mockImplementation(async () => {
      runtimeResult = createRuntimeHookResult({ status: 'connected', isConnected: true });
      view?.rerender(<OpenAITranslationProvider />);
      return true;
    });

    view = render(<OpenAITranslationProvider />);
    fireEvent.click(screen.getByRole('button', { name: /start translation/i }));

    await waitFor(() => {
      expect(runtimeStartMock).toHaveBeenCalledTimes(1);
    });

    sourceResult = createSourceHookResult({
      status: 'ended',
      mode: 'microphone',
      error: {
        kind: 'track-ended',
        mode: 'microphone',
        message: 'The selected audio source ended before translation was stopped.',
        recoverable: true,
        code: 'source-track-ended',
      },
    });
    view.rerender(<OpenAITranslationProvider />);

    await waitFor(() => {
      expect(runtimeStopMock).toHaveBeenCalledWith('source-ended');
    });
  });

  it('uses the shared stop path after failed runtime startup and remains retryable', async () => {
    const source = createSourceResult('microphone');
    sourceResult = createSourceHookResult({
      status: 'ready',
      mode: 'microphone',
      stream: source.sourceStream,
      audioTracks: source.audioTracks,
      source,
      isReady: true,
    });
    runtimeStartMock.mockResolvedValue(false);

    render(<OpenAITranslationProvider />);
    fireEvent.click(screen.getByRole('button', { name: /start translation/i }));

    await waitFor(() => {
      expect(runtimeStartMock).toHaveBeenCalledTimes(1);
      expect(runtimeStopMock).toHaveBeenCalledWith('failed-start');
      expect(sourceStopMock).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: /start translation/i })).toBeEnabled();
  });

  it('registers a provider-switch stop handler and clears it on unmount', async () => {
    const stopRef = createRef<(() => Promise<void>) | null>();
    runtimeResult = createRuntimeHookResult({ status: 'connected', isConnected: true });

    const { unmount } = render(<OpenAITranslationProvider stopRef={stopRef} />);

    expect(stopRef.current).toBeTypeOf('function');
    await act(async () => {
      await stopRef.current?.();
    });

    expect(runtimeStopMock).toHaveBeenCalledWith('provider-switch');
    expect(sourceStopMock).toHaveBeenCalledTimes(1);

    unmount();

    expect(stopRef.current).toBeNull();
  });

  function createSourceHookResult(
    overrides: Partial<UseOpenAITranslationSourceResult> = {}
  ): UseOpenAITranslationSourceResult {
    return {
      status: 'idle',
      mode: null,
      stream: null,
      audioTracks: [],
      source: null,
      error: null,
      capabilities: availableCapabilities,
      isRequesting: false,
      isReady: false,
      canCaptureMicrophone: true,
      canCaptureBrowserTab: true,
      captureMicrophone: captureMicrophoneMock,
      captureBrowserTab: captureBrowserTabMock,
      stop: sourceStopMock,
      reset: sourceResetMock,
      refreshCapabilities: vi.fn(),
      ...overrides,
    };
  }

  function createRuntimeHookResult(
    overrides: Partial<UseOpenAITranslationResult> = {}
  ): UseOpenAITranslationResult {
    return {
      status: 'idle',
      error: null,
      translatedAudioStream: null,
      transcripts: [],
      isStarting: false,
      isConnected: false,
      start: runtimeStartMock,
      stop: runtimeStopMock,
      clearTranscripts: runtimeClearTranscriptsMock,
      reset: runtimeResetMock,
      ...overrides,
    };
  }
});

function createSourceResult(mode: OpenAITranslationSourceMode): OpenAITranslationSourceResult {
  const sourceStream = createMediaStream();

  return {
    mode,
    sourceStream,
    audioTracks: sourceStream.getAudioTracks(),
    ownsSourceStream: true,
  };
}

function createMediaStream(): MediaStream {
  const track = {
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaStreamTrack;

  return {
    getAudioTracks: vi.fn(() => [track]),
    getTracks: vi.fn(() => [track]),
  } as unknown as MediaStream;
}
