import { useTrackVolume } from '@livekit/components-react';
import type { TrackReference } from '@livekit/components-react';
import type { LocalAudioTrack } from 'livekit-client';

const SHAPE = Array.from({ length: 45 }, (_, i) => {
  const x = (i - 22) / 22;
  return 3 + 78 * Math.exp(-x * x * 6) * (0.3 + 0.7 * Math.cos(x * 11) ** 2);
});

export function LiveKitWaveform({
  agentTrack,
  localTrack,
  active,
  muted,
}: {
  agentTrack?: TrackReference;
  localTrack?: LocalAudioTrack;
  active: boolean;
  muted: boolean;
}) {
  const output = useTrackVolume(agentTrack);
  const input = useTrackVolume(localTrack);
  const level = Math.min(1, Math.max(output, muted ? 0 : input) * 4);
  return (
    <div className="lk-waveform" aria-hidden="true">
      <svg viewBox="0 0 460 150" fill="none">
        {SHAPE.map((height, i) => {
          const h = active ? 3 + height * level : height;
          return (
            <line
              key={i}
              x1={10 + i * 10}
              x2={10 + i * 10}
              y1={75 - h / 2}
              y2={75 + h / 2}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}
