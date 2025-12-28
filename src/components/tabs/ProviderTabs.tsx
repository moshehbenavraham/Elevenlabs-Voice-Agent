import * as Tabs from '@radix-ui/react-tabs';
import { type ReactNode, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useProvider } from '@/contexts/ProviderContext';
import { PROVIDERS, type ProviderType } from '@/types';
import { ProviderTab } from './ProviderTab';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Animation variants for tab content transitions
 * Uses opacity + subtle slide for smooth tab switching
 */
export const contentVariants: Variants = {
  enter: {
    opacity: 0,
    y: 10,
  },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/**
 * Reduced motion variants (opacity only, no movement)
 */
export const reducedMotionContentVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

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
 * Features:
 * - Framer Motion animations for content transitions
 * - Mobile-responsive horizontal scrolling
 * - Respects prefers-reduced-motion
 * - Glassmorphism design
 *
 * ARIA: Radix UI Tabs provides proper tablist/tab/tabpanel roles automatically
 */
export function ProviderTabs({ children, className, onProviderChange }: ProviderTabsProps) {
  const { activeProvider, setActiveProvider, providers } = useProvider();
  const prefersReducedMotion = useReducedMotion();
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleValueChange = (value: string) => {
    const provider = value as ProviderType;

    // Call optional callback for disconnect handling
    if (onProviderChange) {
      onProviderChange(provider);
    }

    setActiveProvider(provider);
  };

  // Select animation variants based on reduced motion preference
  const variants = prefersReducedMotion ? reducedMotionContentVariants : contentVariants;

  return (
    <Tabs.Root
      value={activeProvider}
      onValueChange={handleValueChange}
      className={cn('w-full', className)}
    >
      {/* Tab List - Glassmorphism container with mobile scroll */}
      <Tabs.List
        ref={tabListRef}
        className={cn(
          // Layout - horizontal scroll on mobile
          'flex items-center gap-2 p-2 rounded-xl',
          'overflow-x-auto scrollbar-hide',
          '-mx-2 px-4 sm:mx-0 sm:px-2',
          // Glassmorphism
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
              disabledReason={!provider.isAvailable ? `${provider.name} coming soon` : undefined}
              isActive={activeProvider === providerType}
              reduceMotion={prefersReducedMotion}
            />
          );
        })}
      </Tabs.List>

      {/* Tab Content Panels with AnimatePresence */}
      {children && (
        <div className="mt-6 relative">
          <AnimatePresence mode="wait">
            {providers.map((providerType) =>
              providerType === activeProvider ? (
                <Tabs.Content
                  key={providerType}
                  value={providerType}
                  forceMount
                  className="focus-visible:outline-none"
                >
                  <motion.div
                    key={providerType}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {children}
                  </motion.div>
                </Tabs.Content>
              ) : null
            )}
          </AnimatePresence>
        </div>
      )}
    </Tabs.Root>
  );
}
