import type { FC } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

interface ProviderTab {
  id: string;
  label: string;
  enabled: boolean;
  accentColor: string;
}

interface ProviderSettingsPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: ProviderTab[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Tabbed panel for provider-specific settings
 * Uses Radix UI Tabs with glassmorphism styling
 */
export const ProviderSettingsPanel: FC<ProviderSettingsPanelProps> = ({
  activeTab,
  onTabChange,
  tabs,
  children,
  className,
}) => {
  const enabledTabs = tabs.filter((tab) => tab.enabled);

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={onTabChange}
      className={cn('flex flex-col', className)}
    >
      <Tabs.List
        className="flex gap-1 p-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
        aria-label="Provider settings"
      >
        {enabledTabs.map((tab) => (
          <Tabs.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
              'text-zinc-400 hover:text-zinc-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
              'data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm',
              tab.id === 'elevenlabs' && 'data-[state=active]:bg-amber-500/20',
              tab.id === 'openai' && 'data-[state=active]:bg-violet-500/20',
              tab.id === 'xai' && 'data-[state=active]:bg-sky-500/20'
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="mt-4">{children}</div>
    </Tabs.Root>
  );
};

/**
 * Individual tab content wrapper
 */
interface ProviderTabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const ProviderTabContent: FC<ProviderTabContentProps> = ({ value, children, className }) => {
  return (
    <Tabs.Content
      value={value}
      className={cn('focus:outline-none', 'data-[state=inactive]:hidden', className)}
    >
      {children}
    </Tabs.Content>
  );
};

export default ProviderSettingsPanel;
