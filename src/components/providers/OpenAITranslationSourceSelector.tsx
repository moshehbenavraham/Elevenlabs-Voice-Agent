import { Mic, Monitor } from 'lucide-react';
import {
  getOpenAITranslationSourceCapability,
  getOpenAITranslationSourceModes,
} from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type {
  OpenAITranslationSourceCapabilities,
  OpenAITranslationSourceMode,
} from '@/types/openai-translation';

interface OpenAITranslationSourceSelectorProps {
  readonly selectedMode: OpenAITranslationSourceMode;
  readonly capabilities: OpenAITranslationSourceCapabilities;
  readonly disabled?: boolean;
  readonly onModeChange: (mode: OpenAITranslationSourceMode) => void;
}

const SOURCE_MODE_ICONS: Record<OpenAITranslationSourceMode, typeof Mic> = {
  microphone: Mic,
  'browser-tab': Monitor,
};

export function OpenAITranslationSourceSelector({
  selectedMode,
  capabilities,
  disabled = false,
  onModeChange,
}: OpenAITranslationSourceSelectorProps) {
  const sourceModes = getOpenAITranslationSourceModes();

  return (
    <section
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5"
      aria-labelledby="openai-translation-source-heading"
    >
      <div className="mb-4 flex items-center gap-3">
        <Mic className="h-5 w-5 text-emerald-300" aria-hidden="true" />
        <div>
          <h2 id="openai-translation-source-heading" className="font-display text-xl text-zinc-100">
            Audio Source
          </h2>
          <p className="text-xs leading-5 text-zinc-500">Select one source before starting.</p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="openai-translation-source-heading"
        className="grid gap-3 sm:grid-cols-2"
      >
        {sourceModes.map((sourceMode) => {
          const Icon = SOURCE_MODE_ICONS[sourceMode.mode];
          const capability = getOpenAITranslationSourceCapability(capabilities, sourceMode.mode);
          const isSelected = selectedMode === sourceMode.mode;
          const isDisabled = disabled || !capability.canRequest;
          const capabilityLabel = getCapabilityLabel(capability.status);
          const description = capability.canRequest
            ? sourceMode.description
            : (capability.message ?? sourceMode.unavailableDescription);
          const descriptionId = `openai-translation-source-${sourceMode.mode}-description`;

          return (
            <button
              key={sourceMode.mode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${sourceMode.label} source ${capabilityLabel.toLowerCase()}`}
              aria-describedby={descriptionId}
              disabled={isDisabled}
              onClick={() => onModeChange(sourceMode.mode)}
              className={cn(
                'min-h-[132px] rounded-lg border bg-zinc-950/55 p-4 text-left',
                'transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                isSelected
                  ? 'border-emerald-400/60 ring-1 ring-emerald-400/30'
                  : 'border-zinc-800/80 hover:border-zinc-600',
                isDisabled && 'cursor-not-allowed opacity-60 hover:border-zinc-800/80'
              )}
            >
              <span className="mb-3 flex items-center justify-between gap-3">
                <Icon
                  className={cn(
                    'h-5 w-5',
                    capability.canRequest ? 'text-emerald-300' : 'text-zinc-500'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px] leading-5',
                    capability.canRequest
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-500'
                  )}
                >
                  {capabilityLabel}
                </span>
              </span>
              <span className="block text-sm font-medium text-zinc-200">{sourceMode.label}</span>
              <span id={descriptionId} className="mt-1 block text-xs leading-5 text-zinc-500">
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getCapabilityLabel(status: OpenAITranslationSourceCapabilities['microphone']['status']) {
  switch (status) {
    case 'available':
      return 'Available';
    case 'restricted':
      return 'Secure context required';
    case 'unavailable':
      return 'Unavailable';
    case 'unsupported':
      return 'Unsupported';
    default:
      return assertNeverCapabilityStatus(status);
  }
}

function assertNeverCapabilityStatus(status: never): never {
  throw new Error(`Unhandled OpenAI translation source capability status: ${String(status)}`);
}
