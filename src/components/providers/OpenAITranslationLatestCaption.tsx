import { Captions } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenAITranslationTranscriptDisplayEntry } from '@/types/openai-translation';

interface OpenAITranslationLatestCaptionProps {
  readonly caption: OpenAITranslationTranscriptDisplayEntry | null;
  readonly isActive?: boolean;
  readonly className?: string;
}

export function OpenAITranslationLatestCaption({
  caption,
  isActive = false,
  className,
}: OpenAITranslationLatestCaptionProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-emerald-500/20 bg-zinc-950/70 p-4 backdrop-blur-xl sm:p-5',
        className
      )}
      aria-labelledby="openai-translation-caption-heading"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Captions className="h-5 w-5 flex-shrink-0 text-emerald-300" aria-hidden="true" />
          <div className="min-w-0">
            <h2
              id="openai-translation-caption-heading"
              className="font-display text-xl text-zinc-100"
            >
              Latest Caption
            </h2>
            <p className="truncate text-xs leading-5 text-zinc-500">
              {caption ? caption.statusLabel : isActive ? 'Listening' : 'Waiting'}
            </p>
          </div>
        </div>

        {caption && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
            {caption.statusLabel}
          </span>
        )}
      </div>

      <div
        className={cn(
          'flex h-40 items-center rounded-lg border border-white/10 bg-black/30 px-4 py-3',
          caption ? 'justify-start overflow-y-auto' : 'justify-center'
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Latest translated caption"
      >
        {caption ? (
          <p className="w-full whitespace-pre-wrap break-words text-2xl leading-snug text-zinc-100 sm:text-3xl">
            {caption.text}
          </p>
        ) : (
          <p className="text-center text-sm leading-6 text-zinc-500">
            {isActive
              ? 'Listening for translated speech.'
              : 'Translated captions will appear here.'}
          </p>
        )}
      </div>
    </section>
  );
}
