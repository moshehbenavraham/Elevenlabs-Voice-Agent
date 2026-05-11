import { useEffect, useId, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  OpenAITranslationAudioStreamKind,
  OpenAITranslationPlaybackError,
} from '@/types/openai-translation';

interface OpenAITranslationAudioPlayerProps {
  readonly stream: MediaStream | null;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly activeDescription?: string;
  readonly inactiveDescription?: string;
  readonly playbackLabel?: string;
  readonly streamKind?: OpenAITranslationAudioStreamKind;
  readonly volume?: number;
  readonly onPlaybackError?: (error: OpenAITranslationPlaybackError) => void;
}

export function OpenAITranslationAudioPlayer({
  stream,
  disabled = false,
  label = 'Translated Audio',
  activeDescription,
  inactiveDescription,
  playbackLabel,
  streamKind = 'translated',
  volume = 1,
  onPlaybackError,
}: OpenAITranslationAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const headingId = useId();
  const resolvedActiveDescription = activeDescription ?? 'Live output stream attached.';
  const resolvedInactiveDescription = inactiveDescription ?? 'Waiting for translated audio.';
  const resolvedPlaybackLabel = playbackLabel ?? `${label} playback`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    if (stream) {
      audio.srcObject = stream;
    } else {
      clearAudioElement(audio);
    }

    return () => {
      clearAudioElement(audio);
    };
  }, [stream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    try {
      audio.volume = clampAudioVolume(volume);
    } catch (error) {
      console.error('[OpenAITranslationAudioPlayer] Failed to set audio volume', error);
    }
  }, [volume]);

  return (
    <section
      className="rounded-lg border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5"
      aria-labelledby={headingId}
    >
      <div className="mb-4 flex items-center gap-3">
        <Volume2
          className={cn('h-5 w-5', streamKind === 'translated' ? 'text-amber-300' : 'text-sky-300')}
          aria-hidden="true"
        />
        <div>
          <h2 id={headingId} className="font-display text-xl text-zinc-100">
            {label}
          </h2>
          <p className="text-xs leading-5 text-zinc-500">
            {stream ? resolvedActiveDescription : resolvedInactiveDescription}
          </p>
        </div>
      </div>

      <audio
        ref={audioRef}
        controls
        autoPlay
        onError={() => {
          onPlaybackError?.({
            streamKind,
            message: `${label} playback failed in the browser audio element.`,
            recoverable: true,
            code: `${streamKind}-audio-playback-failed`,
          });
        }}
        aria-label={resolvedPlaybackLabel}
        aria-disabled={disabled}
        className={cn(
          'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/75',
          disabled && 'opacity-60'
        )}
      />
    </section>
  );
}

function clearAudioElement(audio: HTMLAudioElement): void {
  try {
    audio.pause();
  } catch (error) {
    console.error('[OpenAITranslationAudioPlayer] Failed to pause audio element', error);
  }

  audio.srcObject = null;
  audio.removeAttribute('src');

  try {
    audio.load();
  } catch (error) {
    console.error('[OpenAITranslationAudioPlayer] Failed to reset audio element', error);
  }
}

function clampAudioVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(1, Math.max(0, value));
}
