import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { FC, ReactNode } from 'react';
import {
  type ProviderType,
  DEFAULT_PROVIDER,
  getVisibleProviderTypes,
  isProviderAvailableInEnv,
  isProviderType,
} from '@/types/voice-provider';

const STORAGE_KEY = 'voice-ai-provider';

interface ProviderContextType {
  /** Currently active provider */
  activeProvider: ProviderType;
  /** Set the active provider */
  setActiveProvider: (provider: ProviderType) => void;
  /** Check if a provider is available */
  isProviderAvailable: (provider: ProviderType) => boolean;
  /** Get list of visible provider types */
  providers: ProviderType[];
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

/**
 * Hook to access the provider context
 * @throws Error if used outside of ProviderProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useProvider(): ProviderContextType {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return context;
}

/**
 * Check if a provider can be selected in the current environment.
 */
function isSelectableProvider(
  provider: ProviderType,
  visibleProviders: readonly ProviderType[]
): boolean {
  return visibleProviders.includes(provider) && isProviderAvailableInEnv(provider);
}

/**
 * Get default fallback from the visible provider list.
 */
function getFallbackProvider(visibleProviders: readonly ProviderType[]): ProviderType {
  if (isSelectableProvider(DEFAULT_PROVIDER, visibleProviders)) {
    return DEFAULT_PROVIDER;
  }

  return (
    visibleProviders.find((provider) => isProviderAvailableInEnv(provider)) ?? DEFAULT_PROVIDER
  );
}

/**
 * Validate and get initial provider from localStorage.
 * Falls back to DEFAULT_PROVIDER if invalid, unavailable, or hidden.
 */
function getInitialProvider(visibleProviders: readonly ProviderType[]): ProviderType {
  if (typeof window === 'undefined') return getFallbackProvider(visibleProviders);

  try {
    const savedProvider = localStorage.getItem(STORAGE_KEY);

    if (savedProvider && isProviderType(savedProvider)) {
      return isSelectableProvider(savedProvider, visibleProviders)
        ? savedProvider
        : getFallbackProvider(visibleProviders);
    }
  } catch {
    // localStorage may be unavailable in private browsing or restricted contexts.
  }

  return getFallbackProvider(visibleProviders);
}

interface ProviderProviderProps {
  children: ReactNode;
}

/**
 * Provider component for voice provider state management
 * Persists the active provider selection to localStorage
 */
export const ProviderProvider: FC<ProviderProviderProps> = ({ children }) => {
  const providers = useMemo(() => [...getVisibleProviderTypes()], []);
  const [activeProvider, setActiveProviderState] = useState<ProviderType>(() =>
    getInitialProvider(providers)
  );

  // Persist to localStorage when provider changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeProvider);
    } catch {
      // Ignore storage errors
    }
  }, [activeProvider]);

  // Check if a provider is available
  const isProviderAvailable = useCallback(
    (provider: ProviderType): boolean => {
      return providers.includes(provider) && isProviderAvailableInEnv(provider);
    },
    [providers]
  );

  // Set active provider with validation
  const setActiveProvider = useCallback(
    (provider: ProviderType) => {
      if (!isProviderType(provider)) {
        console.warn(`Invalid provider type: ${provider}`);
        return;
      }

      if (!providers.includes(provider)) {
        console.warn(`Provider ${provider} is hidden`);
        return;
      }

      // Only allow switching to available providers.
      if (!isProviderAvailableInEnv(provider)) {
        console.warn(`Provider ${provider} is not available`);
        return;
      }

      setActiveProviderState(provider);
    },
    [providers]
  );

  const value: ProviderContextType = {
    activeProvider,
    setActiveProvider,
    isProviderAvailable,
    providers,
  };

  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
};
