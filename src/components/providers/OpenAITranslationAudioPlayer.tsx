import { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpenAITranslationAudioPlayerProps {
  readonly stream: MediaStream | null;
  readonly disabled?: boolean;
}

export function OpenAITranslationAudioPlayer({
  stream,
  disabled = false,
}: OpenAITranslationAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  return (
    <section
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5"
      aria-labelledby="openai-translation-audio-heading"
    >
      <div className="mb-4 flex items-center gap-3">
        <Volume2 className="h-5 w-5 text-amber-300" aria-hidden="true" />
        <div>
          <h2 id="openai-translation-audio-heading" className="font-display text-xl text-zinc-100">
            Translated Audio
          </h2>
          <p className="text-xs leading-5 text-zinc-500">
            {stream ? 'Live output stream attached.' : 'Waiting for translated audio.'}
          </p>
        </div>
      </div>

      <audio
        ref={audioRef}
        controls
        autoPlay
        aria-label="Translated audio playback"
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
