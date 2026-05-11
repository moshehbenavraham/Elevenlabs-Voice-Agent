import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { Check, MessageSquareText, Trash2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getOpenAITranslationTranscriptDisplayEntries,
  summarizeOpenAITranslationTranscripts,
} from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type {
  OpenAITranslationTranscriptDisplayEntry,
  OpenAITranslationTranscriptEntry,
} from '@/types/openai-translation';

interface TranslationTranscriptPanelProps {
  readonly entries: readonly OpenAITranslationTranscriptEntry[];
  readonly isActive?: boolean;
  readonly onClearTranscripts: () => void | Promise<void>;
  readonly className?: string;
}

export function TranslationTranscriptPanel({
  entries,
  isActive = false,
  onClearTranscripts,
  className,
}: TranslationTranscriptPanelProps) {
  const displayEntries = useMemo(
    () => getOpenAITranslationTranscriptDisplayEntries(entries),
    [entries]
  );
  const summary = useMemo(() => summarizeOpenAITranslationTranscripts(entries), [entries]);
  const panelRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const mountedRef = useRef(true);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [confirmationSignature, setConfirmationSignature] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const hasEntries = summary.hasEntries;
  const transcriptSignature = useMemo(
    () => displayEntries.map((entry) => `${entry.stream}:${entry.id}:${entry.updatedAt}`).join('|'),
    [displayEntries]
  );
  const isConfirmingClear = hasEntries && confirmationSignature === transcriptSignature;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasEntries && !isUserScrolled) {
      bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
    }
  }, [displayEntries.length, hasEntries, isUserScrolled]);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 48;
    setIsUserScrolled(!isAtBottom);
  }, []);

  const handleClearClick = useCallback((): void => {
    if (!hasEntries || isClearing) {
      return;
    }

    setClearError(null);
    if (!isConfirmingClear) {
      setConfirmationSignature(transcriptSignature);
      return;
    }

    const clearOperation = async (): Promise<void> => {
      setIsClearing(true);
      try {
        await onClearTranscripts();
      } catch (error) {
        console.error('[TranslationTranscriptPanel] Failed to clear transcripts', error);
        if (mountedRef.current) {
          setClearError('Transcript could not be cleared.');
        }
      } finally {
        if (mountedRef.current) {
          setConfirmationSignature(null);
          setIsClearing(false);
          panelRef.current?.focus();
        }
      }
    };

    void clearOperation();
  }, [hasEntries, isClearing, isConfirmingClear, onClearTranscripts, transcriptSignature]);

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      className={cn(
        'flex min-h-[360px] flex-col rounded-xl border border-white/10 bg-zinc-950/65 backdrop-blur-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60',
        className
      )}
      aria-labelledby="translation-transcript-heading"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <MessageSquareText className="h-5 w-5 flex-shrink-0 text-sky-300" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="translation-transcript-heading" className="font-display text-xl text-zinc-100">
              Transcript
            </h2>
            <p className="truncate text-xs leading-5 text-zinc-500">
              {summary.sourceCount} source, {summary.translatedCount} translated
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isConfirmingClear && (
            <button
              type="button"
              onClick={() => setConfirmationSignature(null)}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
          )}
          <button
            ref={clearButtonRef}
            type="button"
            onClick={handleClearClick}
            disabled={!hasEntries || isClearing}
            aria-busy={isClearing}
            className={cn(
              'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
              isConfirmingClear
                ? 'border border-amber-500/30 bg-amber-500/15 text-amber-100 hover:bg-amber-500/20'
                : 'border border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.07]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isConfirmingClear ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            {isConfirmingClear ? 'Confirm clear' : 'Clear transcript'}
          </button>
        </div>
      </div>

      {clearError && (
        <p className="border-b border-red-500/20 px-4 py-2 text-sm text-red-300" role="alert">
          {clearError}
        </p>
      )}

      <ScrollArea className="h-[360px] px-4" onScrollCapture={handleScroll}>
        <div
          className="space-y-3 py-4"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Translation transcript"
        >
          {displayEntries.length > 0 ? (
            displayEntries.map((entry) => (
              <TranscriptRow key={`${entry.stream}:${entry.id}`} entry={entry} />
            ))
          ) : (
            <TranscriptEmptyState isActive={isActive} />
          )}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </ScrollArea>
    </section>
  );
}

function TranscriptRow({ entry }: { readonly entry: OpenAITranslationTranscriptDisplayEntry }) {
  return (
    <article
      className={cn(
        'rounded-lg border px-3 py-3',
        entry.stream === 'translated'
          ? 'border-emerald-500/20 bg-emerald-500/[0.07]'
          : 'border-sky-500/20 bg-sky-500/[0.06]',
        !entry.isFinal && 'border-dashed'
      )}
      aria-label={entry.ariaLabel}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium uppercase tracking-[0.18em] text-zinc-400">
          {entry.streamLabel}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-zinc-500">
          {entry.statusLabel}
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-100">
        {entry.text}
      </p>
    </article>
  );
}

function TranscriptEmptyState({ isActive }: { readonly isActive: boolean }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 text-center">
      <p className="max-w-sm text-sm leading-6 text-zinc-500">
        {isActive
          ? 'Listening for source and translated transcript lines.'
          : 'No transcript lines in the current session.'}
      </p>
    </div>
  );
}
