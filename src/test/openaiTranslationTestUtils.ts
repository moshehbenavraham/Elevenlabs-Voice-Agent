import { expect, vi } from 'vitest';

type TrackEventHandler = (event: Event) => void;

export class FakeOpenAITranslationMediaStreamTrack {
  readonly kind: string;
  readonly id: string;
  readyState: MediaStreamTrackState = 'live';
  readonly cleanupEvents: string[] = [];
  readonly stop = vi.fn(() => {
    this.cleanupEvents.push(`stop:${this.id}`);
    this.readyState = 'ended';
  });
  readonly addEventListener = vi.fn((type: string, listener: TrackEventHandler): void => {
    if (type === 'ended') {
      this.endedListeners.add(listener);
    }
  });
  readonly removeEventListener = vi.fn((type: string, listener: TrackEventHandler): void => {
    if (type === 'ended') {
      this.cleanupEvents.push(`remove:${this.id}`);
      this.endedListeners.delete(listener);
    }
  });
  private readonly endedListeners = new Set<TrackEventHandler>();

  constructor(kind = 'audio', id = `${kind}-track`) {
    this.kind = kind;
    this.id = id;
  }

  dispatchEnded(): void {
    this.readyState = 'ended';
    for (const listener of Array.from(this.endedListeners)) {
      listener({ type: 'ended' } as Event);
    }
  }

  getEndedListenerCount(): number {
    return this.endedListeners.size;
  }

  getCleanupEvents(): readonly string[] {
    return this.cleanupEvents;
  }
}

export class FakeOpenAITranslationMediaStream {
  private readonly tracks: FakeOpenAITranslationMediaStreamTrack[];

  constructor(tracks: readonly FakeOpenAITranslationMediaStreamTrack[] = []) {
    this.tracks = [...tracks];
  }

  getTracks(): readonly FakeOpenAITranslationMediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): readonly FakeOpenAITranslationMediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio');
  }

  addTrack(track: FakeOpenAITranslationMediaStreamTrack): void {
    this.tracks.push(track);
  }
}

export class FakeOpenAITranslationRTCDataChannel {
  readonly label: string;
  readyState: RTCDataChannelState = 'open';
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  readonly close = vi.fn(() => {
    if (this.readyState === 'closed') {
      return;
    }

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

export class FakeOpenAITranslationRTCPeerConnection {
  static instances: FakeOpenAITranslationRTCPeerConnection[] = [];

  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  dataChannel: FakeOpenAITranslationRTCDataChannel | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onconnectionstatechange: ((event: Event) => void) | null = null;
  oniceconnectionstatechange: ((event: Event) => void) | null = null;
  readonly addTrack = vi.fn(
    (
      track: FakeOpenAITranslationMediaStreamTrack,
      _stream: FakeOpenAITranslationMediaStream
    ): RTCRtpSender => {
      return { track } as unknown as RTCRtpSender;
    }
  );
  readonly removeTrack = vi.fn((_sender: RTCRtpSender): void => undefined);
  readonly createDataChannel = vi.fn((label: string): RTCDataChannel => {
    this.dataChannel = new FakeOpenAITranslationRTCDataChannel(label);
    return this.dataChannel as unknown as RTCDataChannel;
  });
  readonly createOffer = vi.fn(async (): Promise<RTCSessionDescriptionInit> => {
    return { type: 'offer', sdp: 'offer-sdp' };
  });
  readonly setLocalDescription = vi.fn(
    async (_description: RTCSessionDescriptionInit): Promise<void> => undefined
  );
  readonly setRemoteDescription = vi.fn(
    async (_description: RTCSessionDescriptionInit): Promise<void> => undefined
  );
  readonly close = vi.fn(() => {
    this.connectionState = 'closed';
  });

  constructor(_configuration?: RTCConfiguration) {
    FakeOpenAITranslationRTCPeerConnection.instances.push(this);
  }

  dispatchTrack(
    track: FakeOpenAITranslationMediaStreamTrack,
    streams: readonly FakeOpenAITranslationMediaStream[] = []
  ): void {
    this.ontrack?.({
      track,
      streams,
    } as unknown as RTCTrackEvent);
  }

  failConnection(): void {
    this.connectionState = 'failed';
    this.onconnectionstatechange?.({} as Event);
  }

  failIceConnection(): void {
    this.iceConnectionState = 'failed';
    this.oniceconnectionstatechange?.({} as Event);
  }

  static reset(): void {
    FakeOpenAITranslationRTCPeerConnection.instances = [];
  }
}

export function createFakeOpenAITranslationStream(
  tracks: readonly FakeOpenAITranslationMediaStreamTrack[] = [
    new FakeOpenAITranslationMediaStreamTrack('audio'),
  ]
): {
  readonly stream: MediaStream;
  readonly tracks: readonly FakeOpenAITranslationMediaStreamTrack[];
} {
  return {
    stream: new FakeOpenAITranslationMediaStream(tracks) as unknown as MediaStream,
    tracks,
  };
}

export function createOpenAITranslationJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createOpenAITranslationNamedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

export function createOpenAITranslationAbortError(): Error {
  return createOpenAITranslationNamedError('AbortError');
}

export function expectNoOpenAITranslationSecretLeak(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('sk-');
  expect(serialized).not.toContain('Bearer');
  expect(serialized).not.toContain('OPENAI_API_KEY');
  expect(serialized).not.toContain('authorization');
  expect(serialized).not.toContain('client_secret');
  expect(serialized).not.toContain('offer-sdp');
  expect(serialized).not.toContain('answer-sdp');
  expect(serialized).not.toContain('v=0');
}
