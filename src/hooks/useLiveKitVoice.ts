import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  useRoomContext,
  useVoiceAssistant,
  useTranscriptions,
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState, RoomEvent, Track, LocalAudioTrack } from 'livekit-client';
import { getLiveKitToken, liveKitErrorMessage } from '@/lib/livekit';
import type { LiveKitMessage, LiveKitPhase } from '@/types/livekit';

export function useLiveKitVoice(maxSessionSeconds: number, agentWaitSeconds = 30) {
  const controller = useRef<AbortController | null>(null);
  const operation = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(true);
  const starting = useRef(false);
  const stopping = useRef<Promise<void> | null>(null);
  const [phase, setPhase] = useState<LiveKitPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [deviceId, setDeviceId] = useState('default');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [canPlayAudio, setCanPlayAudio] = useState(true);
  const [savedMessages, setSavedMessages] = useState<LiveKitMessage[]>([]);
  const startTime = useRef(0);
  const [messageStart, setMessageStart] = useState(0);
  const room = useRoomContext();
  const assistant = useVoiceAssistant();
  const connectionState = useConnectionState(room);
  const transcriptions = useTranscriptions({ room });
  const agent = {
    state: assistant.state,
    attributes: assistant.agentAttributes,
    microphoneTrack: assistant.audioTrack,
  };
  const messages = useMemo(
    () =>
      transcriptions
        .filter((m) => m.streamInfo.timestamp >= messageStart)
        .map((m, index, all): LiveKitMessage => {
          const role =
            m.participantInfo.identity === room.localParticipant.identity ? 'user' : 'assistant';
          return {
            id: m.streamInfo.attributes?.['lk.segment_id'] || m.streamInfo.id,
            role,
            content: m.text,
            timestamp: m.streamInfo.timestamp,
            final:
              role === 'assistant'
                ? index < all.length - 1 || assistant.state === 'listening'
                : m.streamInfo.attributes?.['lk.transcription_final'] !== 'false',
          };
        }),
    [transcriptions, messageStart, room, assistant.state]
  );
  const endSession = useCallback(async () => {
    await room.disconnect(true);
  }, [room]);
  const latestMessages = useRef(messages);
  useEffect(() => {
    latestMessages.current = messages;
  }, [messages]);

  const stop = useCallback(
    (reason?: string): Promise<void> => {
      if (stopping.current) return stopping.current;
      busy.current = true;
      operation.current += 1;
      controller.current?.abort();
      if (mounted.current) {
        setPhase('ending');
        setSavedMessages(latestMessages.current.map((m) => ({ ...m, final: true })));
        if (reason) setNotice(reason);
      }
      const task = endSession().finally(() => {
        stopping.current = null;
        busy.current = starting.current;
        if (mounted.current) {
          setPhase('ended');
          setMuted(false);
        }
      });
      stopping.current = task;
      return task;
    },
    [endSession]
  );

  const start = useCallback(async () => {
    if (busy.current || room.state !== ConnectionState.Disconnected) return;
    busy.current = true;
    starting.current = true;
    const generation = ++operation.current;
    const abort = new AbortController();
    controller.current = abort;
    setPhase('starting');
    setError(null);
    setNotice(null);
    setSavedMessages([]);
    setElapsed(0);
    setMessageStart(Date.now());
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Could not access a microphone. Use HTTPS and a supported browser.');
      const permission = await navigator.mediaDevices.getUserMedia({
        audio: deviceId === 'default' ? true : { deviceId: { exact: deviceId } },
      });
      permission.getTracks().forEach((track) => track.stop());
      if (generation !== operation.current || !mounted.current) return;
      setDevices(
        (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput')
      );
      await room.switchActiveDevice('audioinput', deviceId);
      if (generation !== operation.current) return;
      startTime.current = Date.now();
      const token = await getLiveKitToken(
        AbortSignal.any([abort.signal, AbortSignal.timeout(15000)])
      );
      if (generation !== operation.current) return;
      await room.connect(token.serverUrl, token.participantToken, {
        autoSubscribe: true,
        peerConnectionTimeout: 15000,
        websocketTimeout: 15000,
      });
      if (generation !== operation.current) {
        await endSession();
        return;
      }
      await room.localParticipant.setMicrophoneEnabled(true);
      if (generation !== operation.current || !mounted.current) {
        await endSession();
        return;
      }
      setPhase('active');
      setMuted(false);
      setCanPlayAudio(room.canPlaybackAudio);
    } catch (cause) {
      await endSession();
      if (generation === operation.current && mounted.current) {
        setError(liveKitErrorMessage(cause));
        setPhase('error');
      }
    } finally {
      starting.current = false;
      if (!stopping.current) busy.current = false;
    }
  }, [deviceId, room, endSession]);

  useEffect(() => {
    mounted.current = true;
    const onPageHide = () => {
      operation.current += 1;
      controller.current?.abort();
      void endSession();
    };
    window.addEventListener('pagehide', onPageHide);
    const updateDevices = () => {
      void navigator.mediaDevices
        ?.enumerateDevices()
        .then((items) => {
          if (mounted.current) setDevices(items.filter((d) => d.kind === 'audioinput'));
        })
        .catch(() => undefined);
    };
    updateDevices();
    navigator.mediaDevices?.addEventListener('devicechange', updateDevices);
    return () => {
      mounted.current = false;
      operation.current += 1;
      controller.current?.abort();
      window.removeEventListener('pagehide', onPageHide);
      navigator.mediaDevices?.removeEventListener('devicechange', updateDevices);
      void endSession();
    };
  }, [endSession]);

  useEffect(() => {
    const playback = () => setCanPlayAudio(room.canPlaybackAudio);
    const disconnected = () => {
      if (!busy.current) void stop('The connection ended. You can start again.');
    };
    const mediaError = (cause: Error) => {
      setError(liveKitErrorMessage(cause));
      void stop();
    };
    room
      .on(RoomEvent.AudioPlaybackStatusChanged, playback)
      .on(RoomEvent.Disconnected, disconnected)
      .on(RoomEvent.MediaDevicesError, mediaError);
    return () => {
      room
        .off(RoomEvent.AudioPlaybackStatusChanged, playback)
        .off(RoomEvent.Disconnected, disconnected)
        .off(RoomEvent.MediaDevicesError, mediaError);
    };
  }, [room, stop]);

  useEffect(() => {
    if (phase !== 'active') return;
    const tick = () => {
      const seconds = Math.floor((Date.now() - startTime.current) / 1000);
      setElapsed(seconds);
      if (seconds >= maxSessionSeconds)
        void stop('The demo time limit was reached. You can start again.');
    };
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [phase, maxSessionSeconds, stop]);

  useEffect(() => {
    const attributes = (changed: Record<string, string>) => {
      const reason = changed['pupu.sessionEnd'];
      if (reason)
        void stop(
          reason === 'duration-limit'
            ? 'The demo time limit was reached.'
            : 'The assistant ended this session. Ask the demo host to check LiveKit if this was unexpected.'
        );
    };
    room.on(RoomEvent.ParticipantAttributesChanged, attributes);
    return () => {
      room.off(RoomEvent.ParticipantAttributesChanged, attributes);
    };
  }, [room, stop]);

  useEffect(() => {
    if (phase !== 'active' || ['listening', 'thinking', 'speaking'].includes(agent.state)) return;
    const timer = window.setTimeout(() => {
      setError(
        'The assistant is unavailable. Ask the demo host to check the local agent and LiveKit quota.'
      );
      void stop();
    }, agentWaitSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [phase, agent.state, agentWaitSeconds, stop]);

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Reconnecting &&
      connectionState !== ConnectionState.SignalReconnecting
    )
      return;
    const timer = window.setTimeout(() => {
      void stop('Reconnection timed out. Check your network and start again.');
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [connectionState, stop]);

  const mutePending = useRef(false);
  const toggleMute = async () => {
    if (mutePending.current) return;
    mutePending.current = true;
    try {
      await room.localParticipant.setMicrophoneEnabled(muted);
      setMuted(!muted);
    } catch (cause) {
      setError(liveKitErrorMessage(cause));
    } finally {
      mutePending.current = false;
    }
  };
  const enableAudio = async () => {
    try {
      await room.startAudio();
      setCanPlayAudio(room.canPlaybackAudio);
    } catch {
      setError('Could not enable audio. Check your browser sound permissions.');
    }
  };
  return {
    room,
    agent,
    connectionState,
    microphoneTrack: room.localParticipant.getTrackPublication(Track.Source.Microphone)
      ?.audioTrack as LocalAudioTrack | undefined,
    phase,
    error,
    notice,
    muted,
    elapsed,
    deviceId,
    devices,
    setDeviceId,
    canPlayAudio,
    start,
    stop,
    toggleMute,
    enableAudio,
    messages: phase === 'ended' || phase === 'error' ? savedMessages : messages,
    clearMessages: () => {
      setMessageStart(Date.now());
      setSavedMessages([]);
    },
  };
}
