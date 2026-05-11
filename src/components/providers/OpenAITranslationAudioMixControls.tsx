import { SlidersHorizontal, Volume1, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { buildTranslationAudioMixState } from '@/lib/openaiTranslation';
import { cn } from '@/lib/utils';
import type { OpenAITranslationAudioMixState } from '@/types/openai-translation';

interface OpenAITranslationAudioMixControlsProps {
  readonly mixState: OpenAITranslationAudioMixState;
  readonly disabled?: boolean;
  readonly onMixChange: (translatedPercent: number) => void;
}

export function OpenAITranslationAudioMixControls({
  mixState,
  disabled = false,
  onMixChange,
}: OpenAITranslationAudioMixControlsProps) {
  const handleValueChange = (values: readonly number[]): void => {
    if (disabled) {
      return;
    }

    onMixChange(buildTranslationAudioMixState(values[0]).translatedPercent);
  };

  return (
    <section
      className="rounded-lg border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5"
      aria-labelledby="openai-translation-mix-heading"
    >
      <div className="mb-4 flex items-start gap-3">
        <SlidersHorizontal className="mt-1 h-5 w-5 flex-shrink-0 text-sky-300" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="openai-translation-mix-heading" className="font-display text-xl text-zinc-100">
            Audio Mix
          </h2>
          <p className="text-xs leading-5 text-zinc-500">{mixState.valueLabel}</p>
        </div>
      </div>

      <div className="grid gap-4" role="group" aria-label="Browser tab audio mix">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <MixMeter label={mixState.originalLabel} value={mixState.originalPercent} tone="source" />
          <MixMeter
            label={mixState.translatedLabel}
            value={mixState.translatedPercent}
            tone="translated"
          />
        </div>

        <div className="flex items-center gap-3">
          <Volume1 className="h-4 w-4 flex-shrink-0 text-sky-300" aria-hidden="true" />
          <Slider
            value={[mixState.translatedPercent]}
            max={100}
            min={0}
            step={1}
            disabled={disabled}
            aria-label="Translated audio mix"
            aria-valuetext={mixState.valueLabel}
            onValueChange={handleValueChange}
            className={cn('flex-1', disabled && 'opacity-60')}
          />
          <Volume2 className="h-4 w-4 flex-shrink-0 text-emerald-300" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function MixMeter({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: number;
  readonly tone: 'source' | 'translated';
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/45 px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500">
          {tone === 'source' ? 'Original' : 'Translated'}
        </span>
        <span className="text-xs font-medium text-zinc-200">{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-lg bg-white/10" aria-hidden="true">
        <div
          className={cn(
            'h-full rounded-lg',
            tone === 'source' ? 'bg-sky-400/80' : 'bg-emerald-400/80'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
