import { AlertTriangle, Info, RotateCcw, Square } from 'lucide-react';
import { getOpenAITranslationDiagnosticCategoryLabel } from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type { OpenAITranslationDiagnostic } from '@/types/openai-translation';

interface OpenAITranslationDiagnosticsPanelProps {
  readonly diagnostic: OpenAITranslationDiagnostic;
  readonly canRetry: boolean;
  readonly canStop: boolean;
  readonly isRetryPending: boolean;
  readonly isStopPending: boolean;
  readonly onRetry: () => void;
  readonly onStop: () => void;
}

export function OpenAITranslationDiagnosticsPanel({
  diagnostic,
  canRetry,
  canStop,
  isRetryPending,
  isStopPending,
  onRetry,
  onStop,
}: OpenAITranslationDiagnosticsPanelProps) {
  const Icon = diagnostic.severity === 'error' ? AlertTriangle : Info;
  const isAlert = diagnostic.severity === 'error';
  const categoryLabel = getOpenAITranslationDiagnosticCategoryLabel(diagnostic.category);
  const retryDisabled = !canRetry || isRetryPending || isStopPending;
  const stopDisabled = !canStop || isStopPending;

  return (
    <section
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-labelledby="openai-translation-diagnostics-title"
      className={cn(
        'rounded-xl border bg-zinc-950/65 p-4 backdrop-blur-xl sm:p-5',
        getSeverityClassName(diagnostic.severity)
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <Icon className="mt-1 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-current/75">
              {categoryLabel}
            </p>
            <h2
              id="openai-translation-diagnostics-title"
              className="mt-1 font-display text-xl text-zinc-100"
            >
              {diagnostic.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{diagnostic.message}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              <span className="font-medium text-zinc-100">{diagnostic.recovery.label}: </span>
              {diagnostic.recovery.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onRetry}
            disabled={retryDisabled}
            aria-busy={isRetryPending}
            className={cn(
              'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full px-4 py-2',
              'border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-100',
              'transition-colors hover:bg-emerald-500/15',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
              'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-emerald-500/10'
            )}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={stopDisabled}
            aria-busy={isStopPending}
            className={cn(
              'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full px-4 py-2',
              'border border-red-500/25 bg-red-500/10 text-sm font-medium text-red-100',
              'transition-colors hover:bg-red-500/15',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60',
              'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-red-500/10'
            )}
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            Stop
          </button>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        {diagnostic.details.map((detail) => (
          <div
            key={`${detail.label}:${detail.value}`}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <dt className="uppercase tracking-[0.18em] text-zinc-600">{detail.label}</dt>
            <dd className="mt-1 break-words text-zinc-300">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function getSeverityClassName(severity: OpenAITranslationDiagnostic['severity']): string {
  switch (severity) {
    case 'info':
      return 'border-sky-500/20 text-sky-300';
    case 'warning':
      return 'border-amber-500/20 text-amber-300';
    case 'error':
      return 'border-red-500/25 text-red-300';
    default:
      return assertNeverSeverity(severity);
  }
}

function assertNeverSeverity(severity: never): never {
  throw new Error(`Unhandled OpenAI translation diagnostic severity: ${String(severity)}`);
}
