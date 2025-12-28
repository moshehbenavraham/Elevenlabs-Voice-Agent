import * as Tabs from '@radix-ui/react-tabs';
import { AudioLines, Bot, Sparkles } from 'lucide-react';
import type { ProviderType } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Icon mapping for provider types
 */
const PROVIDER_ICONS: Record<ProviderType, React.ComponentType<{ className?: string }>> = {
  elevenlabs: AudioLines,
  xai: Bot,
  openai: Sparkles,
};

interface ProviderTabProps {
  /** The provider type this tab represents */
  provider: ProviderType;
  /** Display label for the tab */
  label: string;
  /** Whether the tab is disabled (provider unavailable) */
  disabled?: boolean;
  /** Tooltip text when disabled */
  disabledReason?: string;
}

/**
 * Individual tab component for provider selection
 * Features glassmorphism styling with distinct states:
 * - default: subtle background
 * - hover: increased opacity
 * - active: highlighted with accent color
 * - disabled: muted appearance, non-interactive
 */
export function ProviderTab({
  provider,
  label,
  disabled = false,
  disabledReason,
}: ProviderTabProps) {
  const Icon = PROVIDER_ICONS[provider];

  return (
    <Tabs.Trigger
      value={provider}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className={cn(
        // Base styles
        'group relative flex items-center gap-2 px-4 py-2.5 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',

        // Default state - glassmorphism
        'bg-white/5 backdrop-blur-sm border border-white/10',
        'text-zinc-400',

        // Hover state (when not disabled)
        !disabled && [
          'hover:bg-white/10 hover:border-white/20',
          'hover:text-zinc-200',
        ],

        // Active/selected state
        'data-[state=active]:bg-amber-500/10 data-[state=active]:border-amber-500/30',
        'data-[state=active]:text-amber-400',
        'data-[state=active]:shadow-[0_0_20px_rgba(245,158,11,0.1)]',

        // Disabled state
        disabled && [
          'opacity-50 cursor-not-allowed',
          'hover:bg-white/5 hover:border-white/10 hover:text-zinc-400',
        ]
      )}
    >
      {/* Icon */}
      <Icon
        className={cn(
          'w-4 h-4 transition-colors duration-200',
          'group-data-[state=active]:text-amber-400'
        )}
      />

      {/* Label */}
      <span>{label}</span>

      {/* Active indicator */}
      <span
        className={cn(
          'absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full',
          'bg-amber-500 opacity-0 transition-opacity duration-200',
          'group-data-[state=active]:opacity-100'
        )}
      />
    </Tabs.Trigger>
  );
}
