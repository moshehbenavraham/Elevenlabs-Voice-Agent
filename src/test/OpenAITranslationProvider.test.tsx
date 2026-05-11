import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAITranslationProvider } from '@/components/providers/OpenAITranslationProvider';
import {
  OPENAI_TRANSLATION_LANGUAGE_COUNT,
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
  const runtimeResetMock = vi.fn();
  const audioPauseMock = vi.fn();
  const audioLoadMock = vi.fn();
  let sourceResult: UseOpenAITranslationSourceResult;
  let runtimeResult: UseOpenAITranslationResult;

  beforeEach(() => {
    captureMicrophoneMock.mockResolvedValue(true);
    captureBrowserTabMock.mockResolvedValue(true);
    runtimeStartMock.mockResolvedValue(true);
    runtimeStopMock.mockResolvedValue(undefined);

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
    vi.clearAllMocks();
  });

  it('renders interactive source, language, status, and audio controls without media or network requests', () => {
    render(<OpenAITranslationProvider />);

    expect(
      screen.getByRole('heading', { name: /live translation/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /audio source/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /target language/i })).toHaveValue('en');
    expect(screen.getByRole('status')).toHaveTextContent(/ready to translate/i);
    expect(screen.getByLabelText(/translated audio playback/i)).toBeInTheDocument();
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
    expect(screen.getByRole('status')).toHaveTextContent(/requesting client secret/i);
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
      expect(runtimeStopMock).toHaveBeenCalledTimes(1);
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

  it('registers a provider-switch stop handler and clears it on unmount', async () => {
    const stopRef = createRef<(() => Promise<void>) | null>();
    runtimeResult = createRuntimeHookResult({ status: 'connected', isConnected: true });

    const { unmount } = render(<OpenAITranslationProvider stopRef={stopRef} />);

    expect(stopRef.current).toBeTypeOf('function');
    await act(async () => {
      await stopRef.current?.();
    });

    expect(runtimeStopMock).toHaveBeenCalledTimes(1);
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
