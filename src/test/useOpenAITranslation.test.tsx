import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpenAITranslation } from '@/hooks/useOpenAITranslation';

class FakeMediaStreamTrack {
  readonly kind: string;
  readonly id: string;
  stop = vi.fn();

  constructor(kind = 'audio', id = `${kind}-track`) {
    this.kind = kind;
    this.id = id;
  }
}

class FakeMediaStream {
  private readonly tracks: FakeMediaStreamTrack[];

  constructor(tracks: readonly FakeMediaStreamTrack[] = []) {
    this.tracks = [...tracks];
  }

  getTracks(): readonly FakeMediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): readonly FakeMediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio');
  }

  addTrack(track: FakeMediaStreamTrack): void {
    this.tracks.push(track);
  }
}

class FakeRTCDataChannel {
  readonly label: string;
  readyState: RTCDataChannelState = 'open';
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  close = vi.fn(() => {
    this.readyState = 'closed';
    this.onclose?.({} as Event);
  });

  constructor(label: string) {
    this.label = label;
  }

  emitMessage(data: string): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  emitError(): void {
    this.onerror?.({} as Event);
  }
}

class FakeRTCPeerConnection {
  static instances: FakeRTCPeerConnection[] = [];

  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  dataChannel: FakeRTCDataChannel | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onconnectionstatechange: ((event: Event) => void) | null = null;
  oniceconnectionstatechange: ((event: Event) => void) | null = null;
  addTrack = vi.fn((_track: FakeMediaStreamTrack, _stream: FakeMediaStream) => {
    return { track: _track } as unknown as RTCRtpSender;
  });
  createDataChannel = vi.fn((label: string) => {
    this.dataChannel = new FakeRTCDataChannel(label);
    return this.dataChannel as unknown as RTCDataChannel;
  });
  createOffer = vi.fn(async (): Promise<RTCSessionDescriptionInit> => {
    return { type: 'offer', sdp: 'offer-sdp' };
  });
  setLocalDescription = vi.fn(async (_description: RTCSessionDescriptionInit): Promise<void> => {
    return undefined;
  });
  setRemoteDescription = vi.fn(async (_description: RTCSessionDescriptionInit): Promise<void> => {
    return undefined;
  });
  close = vi.fn(() => {
    this.connectionState = 'closed';
  });

  constructor(_configuration?: RTCConfiguration) {
    FakeRTCPeerConnection.instances.push(this);
  }

  dispatchTrack(track: FakeMediaStreamTrack, streams: readonly FakeMediaStream[] = []): void {
    this.ontrack?.({
      track,
      streams,
    } as unknown as RTCTrackEvent);
  }

  failConnection(): void {
    this.connectionState = 'failed';
    this.onconnectionstatechange?.({} as Event);
  }
}

const fetchMock = vi.fn();

function createSourceStream(): {
  readonly stream: MediaStream;
  readonly track: FakeMediaStreamTrack;
} {
  const track = new FakeMediaStreamTrack('audio', 'source-track');
  const stream = new FakeMediaStream([track]);
  return {
    stream: stream as unknown as MediaStream,
    track,
  };
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function mockSuccessfulFetches(): void {
  fetchMock.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);

    if (url.includes('/api/openai/translation-session')) {
      return createJsonResponse({
        clientSecret: 'ek_test',
        expiresAt: '2026-05-11T18:30:00.000Z',
        targetLanguage: 'es',
        model: 'gpt-realtime-translate',
      });
    }

    if (url === 'https://api.openai.com/v1/realtime/translations/calls') {
      return new Response('answer-sdp', { status: 200 });
    }

    return createJsonResponse({ message: 'not found' }, 404);
  });
}

describe('useOpenAITranslation', () => {
  beforeEach(() => {
    FakeRTCPeerConnection.instances = [];
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
      'https://api.openai.com/v1/realtime/translations/calls',
      expect.objectContaining({
        method: 'POST',
        body: 'offer-sdp',
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
    fetchMock.mockResolvedValue(createJsonResponse({ message: 'Token failure' }, 500));
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
      status: 500,
    });
    expect(FakeRTCPeerConnection.instances).toHaveLength(0);
  });

  it('cleans partial peer resources when SDP exchange fails', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);

      if (url.includes('/api/openai/translation-session')) {
        return createJsonResponse({
          clientSecret: 'ek_test',
          expiresAt: '2026-05-11T18:30:00.000Z',
          targetLanguage: 'es',
          model: 'gpt-realtime-translate',
        });
      }

      return new Response('sdp failed', { status: 503 });
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
    });
    expect(peerConnection.close).toHaveBeenCalledTimes(1);
    expect(peerConnection.dataChannel?.close).toHaveBeenCalledTimes(1);
    expect(track.stop).not.toHaveBeenCalled();
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
        createJsonResponse({
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
