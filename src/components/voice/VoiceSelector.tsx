import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceOption, VoiceProvider } from '@/lib/voiceConfig';
import { getVoiceOptions } from '@/lib/voiceConfig';

interface VoiceSelectorProps {
  provider: VoiceProvider;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * VoiceSelector component for selecting voice options
 * Uses Radix UI Select with glassmorphism styling
 */
export function VoiceSelector({
  provider,
  value,
  onValueChange,
  disabled = false,
  className,
}: VoiceSelectorProps) {
  const voices = getVoiceOptions(provider);
  const selectedVoice = voices.find((v) => v.id === value);

  // Provider-specific accent colors
  const accentColor = provider === 'openai' ? 'violet' : 'sky';
  const accentClasses = {
    trigger: provider === 'openai' ? 'focus:ring-violet-500/50' : 'focus:ring-sky-500/50',
    selected: provider === 'openai' ? 'text-violet-400' : 'text-sky-400',
    check: provider === 'openai' ? 'text-violet-400' : 'text-sky-400',
  };

  return (
    <div className={cn('w-full', className)}>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Voice</label>
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          data-testid="voice-selector"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg px-3 py-2',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-zinc-700/50',
            'text-sm text-zinc-100',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900',
            accentClasses.trigger,
            'hover:border-zinc-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-zinc-500'
          )}
          aria-label="Select voice"
        >
          <span className="flex items-center gap-2 truncate">
            <span className={cn('font-medium', selectedVoice && accentClasses.selected)}>
              {selectedVoice?.name || 'Select voice'}
            </span>
            {selectedVoice && (
              <span className="text-xs text-zinc-500 hidden sm:inline">
                - {selectedVoice.description}
              </span>
            )}
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'relative z-50 min-w-[200px] overflow-hidden rounded-lg',
              'bg-zinc-900/95 backdrop-blur-lg',
              'border border-zinc-700/50',
              'shadow-xl shadow-black/50',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {voices.map((voice) => (
                <VoiceItem key={voice.id} voice={voice} accentColor={accentColor} />
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {disabled && <p className="mt-1 text-xs text-zinc-500">Disconnect to change voice</p>}
    </div>
  );
}

interface VoiceItemProps {
  voice: VoiceOption;
  accentColor: 'violet' | 'sky';
}

function VoiceItem({ voice, accentColor }: VoiceItemProps) {
  return (
    <SelectPrimitive.Item
      value={voice.id}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center',
        'rounded-md px-2 py-2 pr-8',
        'text-sm text-zinc-100',
        'outline-none transition-colors',
        'focus:bg-zinc-800/80',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        accentColor === 'violet'
          ? 'data-[state=checked]:text-violet-400'
          : 'data-[state=checked]:text-sky-400'
      )}
    >
      <div className="flex flex-col gap-0.5">
        <SelectPrimitive.ItemText>
          <span className="font-medium">{voice.name}</span>
        </SelectPrimitive.ItemText>
        <span className="text-xs text-zinc-500">{voice.description}</span>
      </div>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center justify-center">
        <Check
          className={cn('h-4 w-4', accentColor === 'violet' ? 'text-violet-400' : 'text-sky-400')}
        />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export default VoiceSelector;
