import * as Tabs from '@radix-ui/react-tabs';
import { type ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProvider } from '@/contexts/ProviderContext';
import { PROVIDERS, type ProviderType } from '@/types';
import { ProviderTab } from './ProviderTab';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Animation variants for tab content transitions
 * Uses opacity + subtle slide for smooth tab switching
 */
// eslint-disable-next-line react-refresh/only-export-components
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
// eslint-disable-next-line react-refresh/only-export-components
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
  onProviderChange?: (provider: ProviderType) => Promise<void> | void;
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
  const { activeProvider, setActiveProvider, isProviderAvailable, providers } = useProvider();
  const prefersReducedMotion = useReducedMotion();
  const tabListRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll state
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Update scroll state on mount and resize
  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, providers]);

  // Scroll by amount
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleValueChange = async (value: string) => {
    const provider = value as ProviderType;

    if (!providers.includes(provider) || !isProviderAvailable(provider)) {
      return;
    }

    // Call optional callback for disconnect handling
    if (onProviderChange) {
      await onProviderChange(provider);
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
      {/* Tab List Container with scroll arrows */}
      <div className="relative flex items-center gap-1 sm:gap-2">
        {/* Left scroll button - desktop only */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className={cn(
            'hidden sm:flex items-center justify-center',
            'w-8 h-8 rounded-lg',
            'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20',
            'text-zinc-400 hover:text-zinc-200',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
            !canScrollLeft && 'opacity-0 pointer-events-none'
          )}
          aria-label="Scroll tabs left"
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable tab list */}
        <Tabs.List
          ref={(el) => {
            (tabListRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          className={cn(
            // Layout - flex with wrap on mobile, scrollable row on desktop
            'flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start',
            'gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl',
            // Scrollable on larger screens
            'sm:overflow-x-auto scrollbar-hide',
            // Full width on mobile, flexible on larger
            'w-full sm:flex-1',
            // Glassmorphism with enhanced depth
            'bg-white/[0.03] backdrop-blur-xl border border-white/10',
            'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
            // Subtle inner glow
            'ring-1 ring-inset ring-white/[0.05]'
          )}
          aria-label="Voice provider selection"
        >
          {providers.map((providerType) => {
            const provider = PROVIDERS[providerType];
            const isAvailable = isProviderAvailable(providerType);
            return (
              <ProviderTab
                key={providerType}
                provider={providerType}
                label={provider.name}
                disabled={!isAvailable}
                disabledReason={!isAvailable ? `${provider.name} coming soon` : undefined}
                isActive={activeProvider === providerType}
                reduceMotion={prefersReducedMotion}
              />
            );
          })}
        </Tabs.List>

        {/* Right scroll button - desktop only */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className={cn(
            'hidden sm:flex items-center justify-center',
            'w-8 h-8 rounded-lg',
            'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20',
            'text-zinc-400 hover:text-zinc-200',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
            !canScrollRight && 'opacity-0 pointer-events-none'
          )}
          aria-label="Scroll tabs right"
          tabIndex={canScrollRight ? 0 : -1}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

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
