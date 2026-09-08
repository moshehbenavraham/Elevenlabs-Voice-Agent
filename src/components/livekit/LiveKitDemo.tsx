import { useEffect, useState, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LiveKitProvider } from '@/components/providers/LiveKitProvider';
import { LiveKitConversationPanel } from '@/components/conversation/LiveKitConversationPanel';
import { LiveKitWaveform } from './LiveKitWaveform';
import { LiveKitHelp } from './LiveKitHelp';
import { useLiveKitVoice } from '@/hooks/useLiveKitVoice';
import { getLiveKitConfiguration } from '@/lib/livekit';
import type { LiveKitConfig } from '@/types/livekit';

interface DemoProps {
  embedded?: boolean;
  stopRef?: MutableRefObject<(() => Promise<void>) | null>;
}

/** Render voice controls and transcript while exposing awaited cleanup to the provider switcher. */
function Conversation({
  config,
  stopRef,
}: {
  config: LiveKitConfig;
  stopRef?: DemoProps['stopRef'];
}) {
  const voice = useLiveKitVoice(config.maxSessionSeconds, config.agentWaitSeconds);
  const { stop } = voice;
  useEffect(() => {
    if (stopRef) stopRef.current = () => stop();
    return () => {
      if (stopRef) stopRef.current = null;
    };
  }, [stopRef, stop]);
  const active = voice.phase === 'active';
  const busy = voice.phase === 'starting' || voice.phase === 'ending';
  const reconnecting =
    voice.connectionState === 'reconnecting' || voice.connectionState === 'signalReconnecting';
  const status = reconnecting
    ? 'Reconnecting…'
    : voice.phase === 'starting'
      ? 'Connecting your microphone…'
      : voice.phase === 'ending'
        ? 'Ending conversation…'
        : active
          ? (
              {
                listening: 'Listening to you',
                thinking: 'Thinking it through',
                speaking: 'Your assistant is speaking',
              } as Record<string, string>
            )[voice.agent.state] || 'Waiting for your assistant…'
          : voice.phase === 'ended'
            ? 'Until the next conversation'
            : 'Ready when you are';
  const elapsed = `${Math.floor(voice.elapsed / 60)}:${String(voice.elapsed % 60).padStart(2, '0')}`;
  return (
    <>
      <div className="lk-columns">
        <div className="lk-main-stage">
          <div className="lk-intro">
            <h1>
              A conversation,
              <br />
              in real time.
            </h1>
            <p>Speak naturally. An assistant that listens, responds, and keeps up.</p>
          </div>
          <div className="lk-stage">
            <LiveKitWaveform
              agentTrack={voice.agent.microphoneTrack}
              localTrack={voice.microphoneTrack}
              active={active}
              muted={voice.muted}
            />
            <p className="lk-status" role="status">
              {status}
            </p>
            {active && (
              <p className="lk-timer">
                {elapsed}{' '}
                <span>
                  {' '}
                  / {Math.floor(config.maxSessionSeconds / 60)}:
                  {String(config.maxSessionSeconds % 60).padStart(2, '0')} ·{' '}
                  {reconnecting ? 'Reconnecting' : 'Connected'}
                </span>
              </p>
            )}
            <div className="lk-controls">
              {active ? (
                <>
                  <Button
                    className="lk-mute"
                    variant="outline"
                    onClick={() => void voice.toggleMute()}
                    aria-pressed={voice.muted}
                  >
                    {voice.muted ? <MicOff /> : <Mic />}
                    {voice.muted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button className="lk-end" variant="outline" onClick={() => void stop()}>
                    <PhoneOff />
                    End conversation
                  </Button>
                </>
              ) : (
                <Button
                  className="lk-start"
                  size="lg"
                  disabled={busy || !config.enabled || !config.configured}
                  onClick={() => void voice.start()}
                >
                  <Mic />
                  {busy
                    ? 'Connecting…'
                    : voice.phase === 'idle'
                      ? 'Start conversation'
                      : 'Start again'}
                </Button>
              )}
              {voice.phase === 'starting' && (
                <Button variant="ghost" onClick={() => void stop()}>
                  Cancel
                </Button>
              )}
            </div>
            {!active && (
              <label className="lk-device">
                <span className="sr-only">Microphone</span>
                <select
                  aria-label="Microphone"
                  value={voice.deviceId}
                  disabled={busy}
                  onChange={(e) => voice.setDeviceId(e.target.value)}
                >
                  <option value="default">Microphone: System default</option>
                  {voice.devices
                    .filter((d) => d.deviceId && d.deviceId !== 'default')
                    .map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {active && !voice.canPlayAudio && (
              <Button className="lk-audio" onClick={() => void voice.enableAudio()}>
                <Volume2 />
                Enable audio
              </Button>
            )}
            {(voice.error || voice.notice) && (
              <Alert className="lk-alert" variant={voice.error ? 'destructive' : 'default'}>
                <AlertDescription>{voice.error || voice.notice}</AlertDescription>
              </Alert>
            )}
            {(!config.enabled || !config.configured) && (
              <Alert className="lk-alert">
                <AlertDescription>
                  This demo is not available yet. Ask your demo host to finish LiveKit setup.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        <LiveKitConversationPanel
          messages={voice.messages}
          onClear={voice.clearMessages}
          active={active || busy}
        />
      </div>
      <div className="lk-suggestions">
        <h2>Try asking</h2>
        <p>“What can you help me with today?”</p>
        <p>“Plan a weekend trip for me.”</p>
        <p>“Explain this concept in simple terms.”</p>
      </div>
      <footer className="lk-footer">
        <span>Powered by LiveKit Cloud</span>
        <span>
          {active && !voice.muted ? <Mic /> : <MicOff />}
          {active && !voice.muted ? 'Your microphone is on' : 'Your microphone is off'}
        </span>
      </footer>
    </>
  );
}

/** Load demo configuration and mount the shared dedicated-page or embedded conversation. */
export default function LiveKitDemo({ embedded = false, stopRef }: DemoProps) {
  const [config, setConfig] = useState<LiveKitConfig | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getLiveKitConfiguration(controller.signal)
      .then(setConfig)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <div className={`lk-demo ${embedded ? 'lk-embedded' : ''}`}>
      {embedded && (
        <div className="lk-embedded-nav">
          <span>LiveKit Cloud</span>
          <div>
            <Button variant="ghost" asChild>
              <Link to="/livekit">
                Open demo page
                <ArrowUpRight />
              </Link>
            </Button>
            <LiveKitHelp />
          </div>
        </div>
      )}
      {config ? (
        <LiveKitProvider>
          <Conversation config={config} stopRef={stopRef} />
        </LiveKitProvider>
      ) : (
        <div className="lk-loading" role="status">
          <h1>LiveKit Cloud</h1>
          <p>{error ? 'Could not reach the demo server.' : 'Preparing your conversation…'}</p>
          {error && (
            <Button
              onClick={() => {
                setError(false);
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
