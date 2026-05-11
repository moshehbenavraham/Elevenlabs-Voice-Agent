import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpenAITranslationSource } from '@/hooks/useOpenAITranslationSource';
import {
  FakeOpenAITranslationMediaStreamTrack as FakeMediaStreamTrack,
  createFakeOpenAITranslationStream as createFakeStream,
  createOpenAITranslationNamedError as createNamedError,
} from '@/test/openaiTranslationTestUtils';

const getUserMediaMock = vi.fn();
const getDisplayMediaMock = vi.fn();
const SOURCE_HOOK_FIXTURES = {
  deniedErrorName: 'NotAllowedError',
  cancelledErrorName: 'AbortError',
  missingAudioMode: 'browser-tab',
  endedTrackCode: 'source-track-ended',
  cleanupOrder: ['remove:cleanup-audio', 'stop:cleanup-audio'],
} as const;

function installMediaDevices(): void {
  Object.assign(navigator.mediaDevices, {
    getUserMedia: getUserMediaMock,
    getDisplayMedia: getDisplayMediaMock,
  });
}

describe('useOpenAITranslationSource', () => {
  beforeEach(() => {
    getUserMediaMock.mockReset();
    getDisplayMediaMock.mockReset();
    installMediaDevices();
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps source fake fixtures aligned with capture and cleanup scenarios', () => {
    expect(SOURCE_HOOK_FIXTURES).toEqual({
      deniedErrorName: 'NotAllowedError',
      cancelledErrorName: 'AbortError',
      missingAudioMode: 'browser-tab',
      endedTrackCode: 'source-track-ended',
      cleanupOrder: ['remove:cleanup-audio', 'stop:cleanup-audio'],
    });
  });

  it('exposes the stable source contract without requesting permissions on render', () => {
    const { result } = renderHook(() => useOpenAITranslationSource());

    expect(result.current.status).toBe('idle');
    expect(result.current.mode).toBeNull();
    expect(result.current.stream).toBeNull();
    expect(result.current.audioTracks).toEqual([]);
    expect(result.current.source).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isRequesting).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(result.current.canCaptureMicrophone).toBe(true);
    expect(result.current.canCaptureBrowserTab).toBe(true);
    expect(typeof result.current.captureMicrophone).toBe('function');
    expect(typeof result.current.captureBrowserTab).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(getUserMediaMock).not.toHaveBeenCalled();
    expect(getDisplayMediaMock).not.toHaveBeenCalled();
  });

  it('captures microphone audio and exposes owned source metadata', async () => {
    const audioTrack = new FakeMediaStreamTrack('audio', 'mic-audio');
    const { stream } = createFakeStream([audioTrack]);
    getUserMediaMock.mockResolvedValue(stream);
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await expect(result.current.captureMicrophone()).resolves.toBe(true);
    });

    expect(getUserMediaMock).toHaveBeenCalledWith({ audio: true });
    expect(result.current.status).toBe('ready');
    expect(result.current.mode).toBe('microphone');
    expect(result.current.stream).toBe(stream);
    expect(result.current.audioTracks).toEqual([audioTrack]);
    expect(result.current.source).toEqual({
      mode: 'microphone',
      sourceStream: stream,
      audioTracks: [audioTrack],
      ownsSourceStream: true,
    });
    expect(audioTrack.getEndedListenerCount()).toBe(1);
  });

  it('captures browser-tab audio with display-media options', async () => {
    const audioTrack = new FakeMediaStreamTrack('audio', 'tab-audio');
    const videoTrack = new FakeMediaStreamTrack('video', 'tab-video');
    const { stream } = createFakeStream([audioTrack, videoTrack]);
    getDisplayMediaMock.mockResolvedValue(stream);
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await expect(result.current.captureBrowserTab()).resolves.toBe(true);
    });

    expect(getDisplayMediaMock).toHaveBeenCalledWith({
      audio: true,
      video: true,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'include',
      systemAudio: 'include',
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.mode).toBe('browser-tab');
    expect(result.current.source?.audioTracks).toEqual([audioTrack]);
    expect(videoTrack.getEndedListenerCount()).toBe(1);
  });

  it('returns unsupported source errors before calling missing media APIs', async () => {
    Object.assign(navigator.mediaDevices, {
      getUserMedia: undefined,
      getDisplayMedia: undefined,
    });
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await expect(result.current.captureMicrophone()).resolves.toBe(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'unsupported',
      mode: 'microphone',
      code: 'source-unsupported',
    });
    expect(getUserMediaMock).not.toHaveBeenCalled();
    expect(getDisplayMediaMock).not.toHaveBeenCalled();
  });

  it('returns restricted source errors before capture outside secure browser contexts', async () => {
    vi.stubGlobal('isSecureContext', false);
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await expect(result.current.captureBrowserTab()).resolves.toBe(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'unsupported',
      mode: 'browser-tab',
      code: 'source-restricted',
      recoverable: true,
    });
    expect(getUserMediaMock).not.toHaveBeenCalled();
    expect(getDisplayMediaMock).not.toHaveBeenCalled();
  });

  it('maps permission denial, cancellation, and device failures to typed errors', async () => {
    getUserMediaMock.mockRejectedValueOnce(createNamedError('NotAllowedError'));
    getDisplayMediaMock
      .mockRejectedValueOnce(createNamedError('AbortError'))
      .mockRejectedValueOnce(createNamedError('NotFoundError'));
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await expect(result.current.captureMicrophone()).resolves.toBe(false);
    });
    expect(result.current.error).toMatchObject({
      kind: 'permission-denied',
      mode: 'microphone',
      code: 'permission-denied',
    });

    await act(async () => {
      await expect(result.current.captureBrowserTab()).resolves.toBe(false);
    });
    expect(result.current.error).toMatchObject({
      kind: 'capture-cancelled',
      mode: 'browser-tab',
      code: 'capture-cancelled',
    });

    await act(async () => {
      await expect(result.current.captureBrowserTab()).resolves.toBe(false);
    });
    expect(result.current.error).toMatchObject({
      kind: 'device-unavailable',
      mode: 'browser-tab',
      code: 'device-unavailable',
    });

    getDisplayMediaMock.mockRejectedValueOnce(createNamedError('NotSupportedError'));
    await act(async () => {
      await expect(result.current.captureBrowserTab()).resolves.toBe(false);
    });
    expect(result.current.error).toMatchObject({
      kind: 'unsupported',
      mode: 'browser-tab',
      code: 'source-unsupported',
      recoverable: false,
    });
  });

  it('stops display streams that are missing audio tracks before surfacing an error', async () => {
    const videoTrack = new FakeMediaStreamTrack('video', 'display-video');
    const { stream } = createFakeStream([videoTrack]);
    getDisplayMediaMock.mockResolvedValue(stream);
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await expect(result.current.captureBrowserTab()).resolves.toBe(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'missing-audio-track',
      mode: 'browser-tab',
    });
    expect(videoTrack.stop).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBeNull();
    expect(result.current.source).toBeNull();
  });

  it('prevents duplicate capture while a request is in flight', async () => {
    const audioTrack = new FakeMediaStreamTrack('audio', 'slow-audio');
    const { stream } = createFakeStream([audioTrack]);
    let resolveCapture: ((stream: MediaStream) => void) | null = null;
    getUserMediaMock.mockImplementation(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveCapture = resolve;
        })
    );
    const { result } = renderHook(() => useOpenAITranslationSource());
    let firstCapture: Promise<boolean>;

    await act(async () => {
      firstCapture = result.current.captureMicrophone();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('requesting');
    await act(async () => {
      await expect(result.current.captureMicrophone()).resolves.toBe(false);
    });

    await act(async () => {
      resolveCapture?.(stream);
      await expect(firstCapture).resolves.toBe(true);
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('ready');
  });

  it('stops stale capture streams when reset wins an in-flight source request', async () => {
    const audioTrack = new FakeMediaStreamTrack('audio', 'stale-audio');
    const { stream } = createFakeStream([audioTrack]);
    let resolveCapture: ((stream: MediaStream) => void) | null = null;
    getUserMediaMock.mockImplementation(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveCapture = resolve;
        })
    );
    const { result } = renderHook(() => useOpenAITranslationSource());
    let capturePromise: Promise<boolean>;

    await act(async () => {
      capturePromise = result.current.captureMicrophone();
      await Promise.resolve();
    });
    expect(result.current.status).toBe('requesting');

    await act(async () => {
      result.current.reset();
      resolveCapture?.(stream);
      await expect(capturePromise).resolves.toBe(false);
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
    expect(result.current.source).toBeNull();
    expect(audioTrack.addEventListener).not.toHaveBeenCalled();
    expect(audioTrack.stop).toHaveBeenCalledTimes(1);
  });

  it('cleans previous streams during capture replacement', async () => {
    const micTrack = new FakeMediaStreamTrack('audio', 'mic-audio');
    const tabTrack = new FakeMediaStreamTrack('audio', 'tab-audio');
    const micStream = createFakeStream([micTrack]).stream;
    const tabStream = createFakeStream([tabTrack]).stream;
    getUserMediaMock.mockResolvedValue(micStream);
    getDisplayMediaMock.mockResolvedValue(tabStream);
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await result.current.captureMicrophone();
    });
    await act(async () => {
      await result.current.captureBrowserTab();
    });

    expect(micTrack.removeEventListener).toHaveBeenCalledTimes(1);
    expect(micTrack.stop).toHaveBeenCalledTimes(1);
    expect(micTrack.getCleanupEvents()).toEqual(['remove:mic-audio', 'stop:mic-audio']);
    expect(result.current.status).toBe('ready');
    expect(result.current.mode).toBe('browser-tab');
    expect(result.current.stream).toBe(tabStream);
  });

  it('moves to ended state when a source track ends externally', async () => {
    const audioTrack = new FakeMediaStreamTrack('audio', 'ended-audio');
    const { stream } = createFakeStream([audioTrack]);
    getUserMediaMock.mockResolvedValue(stream);
    const { result } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await result.current.captureMicrophone();
    });
    await act(async () => {
      audioTrack.dispatchEnded();
    });

    expect(result.current.status).toBe('ended');
    expect(result.current.mode).toBe('microphone');
    expect(result.current.stream).toBeNull();
    expect(result.current.source).toBeNull();
    expect(result.current.error).toMatchObject({
      kind: 'track-ended',
      mode: 'microphone',
      code: 'source-track-ended',
    });
    expect(audioTrack.removeEventListener).toHaveBeenCalledTimes(1);
    expect(audioTrack.stop).not.toHaveBeenCalled();
    expect(audioTrack.getCleanupEvents()).toEqual(['remove:ended-audio']);
  });

  it('handles repeated stop, reset after errors, and unmount cleanup idempotently', async () => {
    const audioTrack = new FakeMediaStreamTrack('audio', 'cleanup-audio');
    const { stream } = createFakeStream([audioTrack]);
    getUserMediaMock
      .mockResolvedValueOnce(stream)
      .mockRejectedValueOnce(createNamedError('AbortError'));
    const { result, unmount } = renderHook(() => useOpenAITranslationSource());

    await act(async () => {
      await result.current.captureMicrophone();
      result.current.stop();
      result.current.stop();
    });

    expect(result.current.status).toBe('stopped');
    expect(audioTrack.removeEventListener).toHaveBeenCalledTimes(1);
    expect(audioTrack.stop).toHaveBeenCalledTimes(1);
    expect(audioTrack.getCleanupEvents()).toEqual(['remove:cleanup-audio', 'stop:cleanup-audio']);

    await act(async () => {
      audioTrack.dispatchEnded();
    });
    expect(result.current.status).toBe('stopped');
    expect(audioTrack.removeEventListener).toHaveBeenCalledTimes(1);
    expect(audioTrack.stop).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.captureMicrophone();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({ kind: 'capture-cancelled' });

    await act(async () => {
      result.current.reset();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();

    const unmountTrack = new FakeMediaStreamTrack('audio', 'unmount-audio');
    getUserMediaMock.mockResolvedValue(createFakeStream([unmountTrack]).stream);
    await act(async () => {
      await result.current.captureMicrophone();
    });
    unmount();
    expect(unmountTrack.removeEventListener).toHaveBeenCalledTimes(1);
    expect(unmountTrack.stop).toHaveBeenCalledTimes(1);
  });
});
