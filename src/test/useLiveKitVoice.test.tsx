import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { RoomEvent } from 'livekit-client';
import { useLiveKitVoice } from '@/hooks/useLiveKitVoice';

const state = vi.hoisted(() => ({
  room: null as unknown,
  assistant: { state: 'listening', agentAttributes: {} },
  transcripts: [] as unknown[],
}));
vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => state.room,
  useVoiceAssistant: () => state.assistant,
  useTranscriptions: () => state.transcripts,
  useConnectionState: () => 'connected',
}));
const token = vi.hoisted(() => vi.fn());
vi.mock('@/lib/livekit', async (original) => ({
  ...(await original<typeof import('@/lib/livekit')>()),
  getLiveKitToken: token,
}));

class FakeRoom extends EventEmitter {
  state = 'disconnected';
  canPlaybackAudio = true;
  localParticipant = {
    identity: 'visitor',
    setMicrophoneEnabled: vi.fn(async () => undefined),
    getTrackPublication: () => undefined,
  };
  switchActiveDevice = vi.fn(async () => undefined);
  connect = vi.fn(async () => {
    this.state = 'connected';
  });
  disconnect = vi.fn(async () => {
    this.state = 'disconnected';
  });
  startAudio = vi.fn(async () => {
    this.canPlaybackAudio = true;
  });
}
let room: FakeRoom;
let stopTrack: ReturnType<typeof vi.fn>;
let permission: ReturnType<typeof vi.fn>;
beforeEach(() => {
  room = new FakeRoom();
  state.room = room;
  state.transcripts = [];
  state.assistant = { state: 'listening', agentAttributes: {} };
  stopTrack = vi.fn();
  permission = vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] }));
  Object.assign(navigator.mediaDevices, {
    getUserMedia: permission,
    enumerateDevices: vi.fn(async () => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  token
    .mockReset()
    .mockResolvedValue({ serverUrl: 'wss://demo.livekit.cloud', participantToken: 'test-token' });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('LiveKit lifecycle', () => {
  it('does not request a token or microphone on mount; releases preflight tracks and ends on unmount', async () => {
    const { result, unmount } = renderHook(() => useLiveKitVoice(600));
    expect(token).not.toHaveBeenCalled();
    expect(permission).not.toHaveBeenCalled();
    await act(() => result.current.start());
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(token).toHaveBeenCalledOnce();
    expect(result.current.phase).toBe('active');
    unmount();
    expect(room.disconnect).toHaveBeenCalledWith(true);
  });
  it('prevents duplicate starts and cancels a delayed token before connecting', async () => {
    let resolve!: (value: { serverUrl: string; participantToken: string }) => void;
    token.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const { result } = renderHook(() => useLiveKitVoice(600));
    let starting!: Promise<void>;
    act(() => {
      starting = result.current.start();
      void result.current.start();
    });
    await waitFor(() => expect(token).toHaveBeenCalledOnce());
    await act(() => result.current.stop());
    await act(async () => {
      resolve({ serverUrl: 'wss://demo.livekit.cloud', participantToken: 'late' });
      await starting;
    });
    expect(room.connect).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('ended');
    expect(token.mock.calls[0][0].aborted).toBe(true);
  });
  it('stops permission tracks that arrive after unmount without issuing a token', async () => {
    let resolve!: (value: unknown) => void;
    permission.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const { result, unmount } = renderHook(() => useLiveKitVoice(600));
    let starting!: Promise<void>;
    act(() => {
      starting = result.current.start();
    });
    unmount();
    await act(async () => {
      resolve({ getTracks: () => [{ stop: stopTrack }] });
      await starting;
    });
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(token).not.toHaveBeenCalled();
  });
  it('shows a useful permission error and never requests a token', async () => {
    permission.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    const { result } = renderHook(() => useLiveKitVoice(600));
    await act(() => result.current.start());
    expect(result.current.error).toMatch(/Microphone access was denied/);
    expect(token).not.toHaveBeenCalled();
  });
  it('preserves final transcript on end and starts a fresh conversation on retry', async () => {
    const { result, rerender } = renderHook(() => useLiveKitVoice(600));
    await act(() => result.current.start());
    state.transcripts = [
      {
        streamInfo: {
          id: 'stream',
          timestamp: Date.now(),
          attributes: { 'lk.segment_id': 'segment' },
        },
        participantInfo: { identity: 'agent' },
        text: 'Hello',
      },
    ];
    rerender();
    expect(result.current.messages[0].id).toBe('segment');
    await act(() => result.current.stop());
    expect(result.current.messages[0].content).toBe('Hello');
    act(() => result.current.clearMessages());
    expect(result.current.messages).toEqual([]);
    await act(() => result.current.start());
    expect(token).toHaveBeenCalledTimes(2);
  });
  it('mutes and unmutes the actual participant and recovers blocked playback', async () => {
    const { result } = renderHook(() => useLiveKitVoice(600));
    await act(() => result.current.start());
    await act(() => result.current.toggleMute());
    expect(result.current.muted).toBe(true);
    expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
    await act(() => result.current.toggleMute());
    expect(result.current.muted).toBe(false);
    room.canPlaybackAudio = false;
    act(() => {
      room.emit(RoomEvent.AudioPlaybackStatusChanged);
    });
    expect(result.current.canPlayAudio).toBe(false);
    await act(() => result.current.enableAudio());
    expect(room.startAudio).toHaveBeenCalledOnce();
  });
  it('ends when the agent does not become ready within 30 seconds', async () => {
    vi.useFakeTimers();
    state.assistant.state = 'connecting';
    const { result } = renderHook(() => useLiveKitVoice(600));
    await act(() => result.current.start());
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(result.current.phase).toBe('ended');
    expect(result.current.error).toMatch(/assistant is unavailable/);
  });
  it('enforces the session cap independently of join-token expiry', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLiveKitVoice(30));
    await act(() => result.current.start());
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(result.current.phase).toBe('ended');
    expect(result.current.notice).toMatch(/time limit/);
  });
});
