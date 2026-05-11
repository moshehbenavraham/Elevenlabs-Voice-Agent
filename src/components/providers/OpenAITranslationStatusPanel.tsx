import { AlertTriangle, CheckCircle2, Loader2, Radio, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  OpenAITranslationHookStatus,
  OpenAITranslationSourceStatus,
} from '@/types/openai-translation';

export type OpenAITranslationUiStatusTone = 'idle' | 'busy' | 'success' | 'warning' | 'error';

export interface OpenAITranslationUiStatus {
  readonly tone: OpenAITranslationUiStatusTone;
  readonly title: string;
  readonly message: string;
  readonly details: readonly string[];
}

interface OpenAITranslationStatusPanelProps {
  readonly status: OpenAITranslationUiStatus;
  readonly sourceStatus: OpenAITranslationSourceStatus;
  readonly runtimeStatus: OpenAITranslationHookStatus;
}

const STATUS_ICON = {
  idle: Radio,
  busy: Loader2,
  success: CheckCircle2,
  warning: WifiOff,
  error: AlertTriangle,
} as const satisfies Record<OpenAITranslationUiStatusTone, typeof Radio>;

export function OpenAITranslationStatusPanel({
  status,
  sourceStatus,
  runtimeStatus,
}: OpenAITranslationStatusPanelProps) {
  const Icon = STATUS_ICON[status.tone];
  const isBusy = status.tone === 'busy';

  return (
    <section
      role="status"
      aria-live={status.tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'rounded-xl border bg-zinc-950/65 p-4 backdrop-blur-xl sm:p-5',
        getToneClassName(status.tone)
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <Icon
            className={cn('mt-1 h-5 w-5 flex-shrink-0', isBusy && 'animate-spin')}
            aria-hidden="true"
          />
          <div>
            <h2 className="font-display text-xl text-zinc-100">{status.title}</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{status.message}</p>
          </div>
        </div>

        <dl className="grid min-w-[220px] grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <dt className="uppercase tracking-[0.18em] text-zinc-600">Source</dt>
            <dd className="mt-1 text-zinc-300">{formatStatus(sourceStatus)}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <dt className="uppercase tracking-[0.18em] text-zinc-600">Runtime</dt>
            <dd className="mt-1 text-zinc-300">{formatStatus(runtimeStatus)}</dd>
          </div>
        </dl>
      </div>

      {status.details.length > 0 && (
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-500 sm:grid-cols-2">
          {status.details.map((detail) => (
            <li
              key={detail}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              {detail}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getToneClassName(tone: OpenAITranslationUiStatusTone): string {
  switch (tone) {
    case 'idle':
      return 'border-white/10 text-zinc-400';
    case 'busy':
      return 'border-sky-500/20 text-sky-300';
    case 'success':
      return 'border-emerald-500/20 text-emerald-300';
    case 'warning':
      return 'border-amber-500/20 text-amber-300';
    case 'error':
      return 'border-red-500/25 text-red-300';
    default:
      return assertNeverTone(tone);
  }
}

function formatStatus(status: OpenAITranslationHookStatus | OpenAITranslationSourceStatus): string {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function assertNeverTone(tone: never): never {
  throw new Error(`Unhandled OpenAI translation status tone: ${String(tone)}`);
}
