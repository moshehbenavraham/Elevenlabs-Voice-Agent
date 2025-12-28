import * as Tabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { useProvider } from '@/contexts/ProviderContext';
import { PROVIDERS, type ProviderType } from '@/types';
import { ProviderTab } from './ProviderTab';
import { cn } from '@/lib/utils';

interface ProviderTabsProps {
  /** Content to render for each provider tab */
  children?: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Callback when provider changes (for handling disconnect before switch) */
  onProviderChange?: (provider: ProviderType) => void;
}

/**
 * Tab container component for provider selection
 * Uses Radix UI Tabs primitive for keyboard accessibility:
 * - Tab: Focus tab list
 * - Arrow Left/Right: Navigate between tabs
 * - Enter/Space: Select focused tab
 *
 * Styled with glassmorphism design matching the app aesthetic
 */
export function ProviderTabs({ children, className, onProviderChange }: ProviderTabsProps) {
  const { activeProvider, setActiveProvider, providers } = useProvider();

  const handleValueChange = (value: string) => {
    const provider = value as ProviderType;

    // Call optional callback for disconnect handling
    if (onProviderChange) {
      onProviderChange(provider);
    }

    setActiveProvider(provider);
  };

  return (
    <Tabs.Root
      value={activeProvider}
      onValueChange={handleValueChange}
      className={cn('w-full', className)}
    >
      {/* Tab List - Glassmorphism container */}
      <Tabs.List
        className={cn(
          'flex items-center gap-2 p-2 rounded-xl',
          'bg-white/5 backdrop-blur-lg border border-white/10',
          'shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
        )}
        aria-label="Voice provider selection"
      >
        {providers.map((providerType) => {
          const provider = PROVIDERS[providerType];
          return (
            <ProviderTab
              key={providerType}
              provider={providerType}
              label={provider.name}
              disabled={!provider.isAvailable}
              disabledReason={
                !provider.isAvailable ? `${provider.name} coming soon` : undefined
              }
            />
          );
        })}
      </Tabs.List>

      {/* Tab Content Panels */}
      {children && (
        <div className="mt-6">
          {providers.map((providerType) => (
            <Tabs.Content
              key={providerType}
              value={providerType}
              className={cn(
                'focus-visible:outline-none',
                'data-[state=inactive]:hidden'
              )}
            >
              {/* Only render content for the active provider */}
              {providerType === activeProvider && children}
            </Tabs.Content>
          ))}
        </div>
      )}
    </Tabs.Root>
  );
}
