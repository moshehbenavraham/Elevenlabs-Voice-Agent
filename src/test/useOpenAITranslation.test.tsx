import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpenAITranslation } from '@/hooks/useOpenAITranslation';
import {
  FakeOpenAITranslationMediaStream as FakeMediaStream,
  FakeOpenAITranslationMediaStreamTrack as FakeMediaStreamTrack,
  FakeOpenAITranslationRTCPeerConnection as FakeRTCPeerConnection,
  createFakeOpenAITranslationStream,
  createOpenAITranslationJsonResponse,
} from '@/test/openaiTranslationTestUtils';

const fetchMock = vi.fn();
const RUNTIME_HOOK_FIXTURES = {
  duplicateStartStatus: 'requesting-client-secret',
  duplicateStopReason: 'manual',
  partialStartupFailureStatus: 503,
  abortErrorName: 'AbortError',
  remoteTrackId: 'remote-track',
  unknownEventType: 'session.created',
} as const;

function createSourceStream(): {
  readonly stream: MediaStream;
  readonly track: FakeMediaStreamTrack;
} {
  const track = new FakeMediaStreamTrack('audio', 'source-track');
  const { stream } = createFakeOpenAITranslationStream([track]);
  return {
    stream,
    track,
  };
}

function mockSuccessfulFetches(): void {
  fetchMock.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);

    if (url.includes('/api/openai/translation-session')) {
      return createOpenAITranslationJsonResponse({
        clientSecret: 'ek_test',
        expiresAt: '2026-05-11T18:30:00.000Z',
        targetLanguage: 'es',
        model: 'gpt-realtime-translate',
      });
    }

    if (url === 'https://api.openai.com/v1/realtime/translations') {
      return new Response('answer-sdp', { status: 200 });
    }

    return createOpenAITranslationJsonResponse({ message: 'not found' }, 404);
  });
}

describe('useOpenAITranslation', () => {
  beforeEach(() => {
    FakeRTCPeerConnection.reset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('MediaStreamTrack', FakeMediaStreamTrack);
    vi.stubGlobal('RTCPeerConnection', FakeRTCPeerConnection);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps runtime fake fixtures aligned with cleanup-sensitive scenarios', () => {
    expect(RUNTIME_HOOK_FIXTURES).toEqual({
      duplicateStartStatus: 'requesting-client-secret',
      duplicateStopReason: 'manual',
      partialStartupFailureStatus: 503,
      abortErrorName: 'AbortError',
      remoteTrackId: 'remote-track',
      unknownEventType: 'session.created',
    });
  });

  it('exposes the reusable hook contract', async () => {
    const { result } = renderHook(() => useOpenAITranslation());

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.translatedAudioStream).toBeNull();
    expect(result.current.transcripts).toEqual([]);
    expect(result.current.isStarting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.clearTranscripts).toBe('function');
    expect(typeof result.current.reset).toBe('function');

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.status).toBe('stopped');
  });

  it('starts a translation call with client secret, peer connection, and SDP exchange', async () => {
    mockSuccessfulFetches();
    const { stream, track } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await expect(
        result.current.start({
          sourceStream: stream,
          targetLanguage: 'es',
        })
      ).resolves.toBe(true);
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    expect(result.current.status).toBe('connected');
    expect(result.current.isConnected).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/openai/translation-session',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime/translations',
      expect.objectContaining({
        method: 'POST',
        body: 'offer-sdp\r\n',
      })
    );
    expect(peerConnection.addTrack).toHaveBeenCalledWith(track, stream);
    expect(peerConnection.dataChannel?.label).toBe('oai-events');
    expect(peerConnection.setLocalDescription).toHaveBeenCalledWith({
      type: 'offer',
      sdp: 'offer-sdp',
    });
    expect(peerConnection.setRemoteDescription).toHaveBeenCalledWith({
      type: 'answer',
      sdp: 'answer-sdp',
    });
    expect(track.stop).not.toHaveBeenCalled();
  });

  it('maps client-secret failures without creating a peer connection', async () => {
    fetchMock.mockResolvedValue(
      createOpenAITranslationJsonResponse(
        {
          error: 'OpenAI API error',
          message: 'OpenAI rate limit exceeded',
          category: 'openai-rate-limit',
          code: 'openai-rate-limited',
        },
        429
      )
    );
    const { stream } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await expect(
        result.current.start({
          sourceStream: stream,
          targetLanguage: 'es',
        })
      ).resolves.toBe(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'client-secret',
      status: 429,
      code: 'openai-rate-limited',
      routeCategory: 'openai-rate-limit',
    });
    expect(FakeRTCPeerConnection.instances).toHaveLength(0);
  });

  it('cleans partial peer resources when SDP exchange fails', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);

      if (url.includes('/api/openai/translation-session')) {
        return createOpenAITranslationJsonResponse({
          clientSecret: 'ek_test',
          expiresAt: '2026-05-11T18:30:00.000Z',
          targetLanguage: 'es',
          model: 'gpt-realtime-translate',
        });
      }

      return new Response('Bearer sk-test raw SDP v=0', { status: 503 });
    });
    const { stream, track } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await expect(
        result.current.start({
          sourceStream: stream,
          targetLanguage: 'es',
        })
      ).resolves.toBe(false);
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'sdp-exchange',
      status: 503,
      code: 'sdp-http-error',
      message: 'OpenAI translation SDP exchange failed with HTTP 503',
    });
    expect(JSON.stringify(result.current.error)).not.toContain('sk-test');
    expect(JSON.stringify(result.current.error)).not.toContain('v=0');
    expect(peerConnection.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.dataChannel?.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.removeTrack).toHaveBeenCalledTimes(1);
    expect(track.stop).not.toHaveBeenCalled();
  });

  it('stops owned source tracks when startup fails before peer resources are created', async () => {
    class FailingRTCPeerConnection {
      constructor(_configuration?: RTCConfiguration) {
        throw new Error('peer constructor failed');
      }
    }

    mockSuccessfulFetches();
    vi.stubGlobal('RTCPeerConnection', FailingRTCPeerConnection);
    const { stream, track } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await expect(
        result.current.start({
          sourceStream: stream,
          targetLanguage: 'es',
          ownsSourceStream: true,
        })
      ).resolves.toBe(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'webrtc',
      code: 'peer-connection-create-failed',
    });
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(FakeRTCPeerConnection.instances).toHaveLength(0);
  });

  it('fails fast while offline without requesting a client secret', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    const { stream } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await expect(
        result.current.start({
          sourceStream: stream,
          targetLanguage: 'es',
        })
      ).resolves.toBe(false);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'offline',
      code: 'browser-offline',
    });
  });

  it('aborts pending startup requests and reuses duplicate stop cleanup', async () => {
    const tokenSignalRef: { current: AbortSignal | null } = { current: null };
    fetchMock.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          tokenSignalRef.current = init?.signal ?? null;
          tokenSignalRef.current?.addEventListener(
            'abort',
            () => {
              reject(new DOMException('Aborted', 'AbortError'));
            },
            { once: true }
          );
        })
    );
    const { stream } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());
    let startPromise: Promise<boolean> = Promise.resolve(false);

    await act(async () => {
      startPromise = result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
      await Promise.resolve();
    });

    expect(result.current.status).toBe('requesting-client-secret');

    await act(async () => {
      const firstStop = result.current.stop('manual');
      const secondStop = result.current.stop('manual');
      await expect(firstStop).resolves.toEqual({ ok: true, error: null });
      await expect(secondStop).resolves.toEqual({ ok: true, error: null });
      await expect(startPromise).resolves.toBe(false);
    });

    expect(tokenSignalRef.current?.aborted).toBe(true);
    expect(result.current.status).toBe('stopped');
    expect(FakeRTCPeerConnection.instances).toHaveLength(0);
  });

  it('exposes remote translated audio streams from peer tracks', async () => {
    mockSuccessfulFetches();
    const { stream } = createSourceStream();
    const remoteTrack = new FakeMediaStreamTrack('audio', 'remote-track');
    const remoteStream = new FakeMediaStream([remoteTrack]);
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
    });

    await act(async () => {
      FakeRTCPeerConnection.instances[0].dispatchTrack(remoteTrack, [remoteStream]);
    });

    expect(result.current.translatedAudioStream).toBe(remoteStream);
  });

  it('updates transcripts from data-channel messages and errors on malformed events', async () => {
    mockSuccessfulFetches();
    const { stream } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
    });

    const dataChannel = FakeRTCPeerConnection.instances[0].dataChannel;
    await act(async () => {
      dataChannel?.emitMessage(
        JSON.stringify({
          type: 'translation.source_transcript.delta',
          item_id: 'source-1',
          delta: 'hel',
        })
      );
      dataChannel?.emitMessage(
        JSON.stringify({
          type: 'translation.source_transcript.delta',
          item_id: 'source-1',
          delta: 'lo',
        })
      );
      dataChannel?.emitMessage(
        JSON.stringify({
          type: 'response.audio_transcript.done',
          response_id: 'translated-1',
          transcript: 'hola',
        })
      );
    });

    expect(result.current.transcripts).toEqual([
      {
        id: 'source-1',
        stream: 'source',
        text: 'hello',
        isFinal: false,
        updatedAt: expect.any(Number),
      },
      {
        id: 'translated-1',
        stream: 'translated',
        text: 'hola',
        isFinal: true,
        updatedAt: expect.any(Number),
      },
    ]);

    await act(async () => {
      dataChannel?.emitMessage('{"type":');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'parser',
      code: 'malformed-json',
    });
    expect(result.current.transcripts).toHaveLength(2);
  });

  it('ignores unknown data-channel events and retries after data-channel close', async () => {
    mockSuccessfulFetches();
    const { stream } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
    });

    const firstPeerConnection = FakeRTCPeerConnection.instances[0];
    await act(async () => {
      firstPeerConnection.dataChannel?.emitMessage(
        JSON.stringify({
          type: RUNTIME_HOOK_FIXTURES.unknownEventType,
          session: { id: 'session-1' },
        })
      );
      firstPeerConnection.dataChannel?.close();
    });

    expect(result.current.status).toBe('stopped');
    expect(result.current.error).toBeNull();
    expect(result.current.transcripts).toEqual([]);

    await act(async () => {
      await expect(
        result.current.start({
          sourceStream: stream,
          targetLanguage: 'es',
        })
      ).resolves.toBe(true);
    });

    expect(FakeRTCPeerConnection.instances).toHaveLength(2);
    expect(firstPeerConnection.close).toHaveBeenCalledTimes(1);
    expect(firstPeerConnection.removeTrack).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('connected');
  });

  it('maps peer connection failures to cleanup-backed retryable errors', async () => {
    mockSuccessfulFetches();
    const { stream, track } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    await act(async () => {
      peerConnection.failConnection();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'webrtc',
      code: 'peer-connection-failed',
      recoverable: true,
    });
    expect(peerConnection.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.dataChannel?.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.removeTrack).toHaveBeenCalledTimes(1);
    expect(track.stop).not.toHaveBeenCalled();
  });

  it('cleans active runtime resources when the data channel errors', async () => {
    mockSuccessfulFetches();
    const { stream, track } = createSourceStream();
    const remoteTrack = new FakeMediaStreamTrack('audio', 'remote-track');
    const remoteStream = new FakeMediaStream([remoteTrack]);
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    await act(async () => {
      peerConnection.dispatchTrack(remoteTrack, [remoteStream]);
      peerConnection.dataChannel?.emitError();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'data-channel',
      code: 'data-channel-error',
    });
    expect(result.current.translatedAudioStream).toBeNull();
    expect(peerConnection.dataChannel?.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.removeTrack).toHaveBeenCalledTimes(1);
    expect(peerConnection.close).toHaveBeenCalledTimes(1);
    expect(remoteTrack.stop).toHaveBeenCalledTimes(1);
    expect(track.stop).not.toHaveBeenCalled();
  });

  it('maps ICE connection failures to stable WebRTC diagnostics', async () => {
    mockSuccessfulFetches();
    const { stream } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    await act(async () => {
      peerConnection.failIceConnection();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({
      kind: 'webrtc',
      code: 'ice-connection-failed',
    });
    expect(peerConnection.close).toHaveBeenCalledTimes(1);
  });

  it('clears transcript state without stopping active runtime resources', async () => {
    mockSuccessfulFetches();
    const { stream, track } = createSourceStream();
    const remoteTrack = new FakeMediaStreamTrack('audio', 'remote-track');
    const remoteStream = new FakeMediaStream([remoteTrack]);
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
        ownsSourceStream: true,
      });
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    const dataChannel = peerConnection.dataChannel;
    await act(async () => {
      peerConnection.dispatchTrack(remoteTrack, [remoteStream]);
      dataChannel?.emitMessage(
        JSON.stringify({
          type: 'translation.translated_transcript.final',
          response_id: 'translated-1',
          transcript: 'hola',
        })
      );
    });

    expect(result.current.transcripts).toHaveLength(1);
    expect(result.current.translatedAudioStream).toBe(remoteStream);

    await act(async () => {
      result.current.clearTranscripts();
    });

    expect(result.current.transcripts).toEqual([]);
    expect(result.current.status).toBe('connected');
    expect(result.current.isConnected).toBe(true);
    expect(result.current.translatedAudioStream).toBe(remoteStream);
    expect(peerConnection.close).not.toHaveBeenCalled();
    expect(dataChannel?.close).not.toHaveBeenCalled();
    expect(track.stop).not.toHaveBeenCalled();
    expect(remoteTrack.stop).not.toHaveBeenCalled();

    await act(async () => {
      dataChannel?.emitMessage(
        JSON.stringify({
          type: 'translation.translated_transcript.final',
          response_id: 'translated-2',
          transcript: 'adios',
        })
      );
    });

    expect(result.current.transcripts).toMatchObject([
      {
        id: 'translated-2',
        stream: 'translated',
        text: 'adios',
        isFinal: true,
      },
    ]);
  });

  it('prevents duplicate starts while a start is in flight', async () => {
    let resolveToken: ((response: Response) => void) | null = null;
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveToken = resolve;
          })
      )
      .mockResolvedValue(new Response('answer-sdp', { status: 200 }));
    const { stream } = createSourceStream();
    const { result } = renderHook(() => useOpenAITranslation());
    let firstStart: Promise<boolean>;

    await act(async () => {
      firstStart = result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
      await Promise.resolve();
    });

    await act(async () => {
      await expect(
        result.current.start({
          sourceStream: stream,
          targetLanguage: 'es',
        })
      ).resolves.toBe(false);
    });

    await act(async () => {
      resolveToken?.(
        createOpenAITranslationJsonResponse({
          clientSecret: 'ek_test',
          expiresAt: '2026-05-11T18:30:00.000Z',
          targetLanguage: 'es',
          model: 'gpt-realtime-translate',
        })
      );
      await expect(firstStart).resolves.toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(FakeRTCPeerConnection.instances).toHaveLength(1);
  });

  it('stops repeatedly, stops owned source tracks, and cleans remote tracks once', async () => {
    mockSuccessfulFetches();
    const { stream, track } = createSourceStream();
    const remoteTrack = new FakeMediaStreamTrack('audio', 'remote-track');
    const remoteStream = new FakeMediaStream([remoteTrack]);
    const { result } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
        ownsSourceStream: true,
      });
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    await act(async () => {
      peerConnection.dispatchTrack(remoteTrack, [remoteStream]);
    });

    await act(async () => {
      await result.current.stop();
      await result.current.stop();
    });

    expect(result.current.status).toBe('stopped');
    expect(result.current.translatedAudioStream).toBeNull();
    expect(peerConnection.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.dataChannel?.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.removeTrack).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(remoteTrack.stop).toHaveBeenCalledTimes(1);
  });

  it('cleans resources on unmount without setting state after unmount', async () => {
    mockSuccessfulFetches();
    const { stream } = createSourceStream();
    const { result, unmount } = renderHook(() => useOpenAITranslation());

    await act(async () => {
      await result.current.start({
        sourceStream: stream,
        targetLanguage: 'es',
      });
    });

    const peerConnection = FakeRTCPeerConnection.instances[0];
    unmount();

    expect(peerConnection.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.dataChannel?.close).toHaveBeenCalledTimes(1);
  });
});
