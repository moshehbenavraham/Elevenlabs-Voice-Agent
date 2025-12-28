import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { FC, ReactNode } from 'react';
import { type ProviderType, DEFAULT_PROVIDER, PROVIDERS } from '@/types';

const STORAGE_KEY = 'voice-ai-provider';

interface ProviderContextType {
  /** Currently active provider */
  activeProvider: ProviderType;
  /** Set the active provider */
  setActiveProvider: (provider: ProviderType) => void;
  /** Check if a provider is available */
  isProviderAvailable: (provider: ProviderType) => boolean;
  /** Get list of all provider types */
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
 * Validate and get initial provider from localStorage
 * Falls back to DEFAULT_PROVIDER if invalid or unavailable
 */
function getInitialProvider(): ProviderType {
  if (typeof window === 'undefined') return DEFAULT_PROVIDER;

  try {
    const savedProvider = localStorage.getItem(STORAGE_KEY);

    // Validate saved value is a valid provider type
    if (savedProvider && isValidProvider(savedProvider)) {
      return savedProvider as ProviderType;
    }
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }

  return DEFAULT_PROVIDER;
}

/**
 * Check if a value is a valid provider type
 */
function isValidProvider(value: string): value is ProviderType {
  return value === 'elevenlabs' || value === 'xai' || value === 'openai';
}

interface ProviderProviderProps {
  children: ReactNode;
}

/**
 * Provider component for voice provider state management
 * Persists the active provider selection to localStorage
 */
export const ProviderProvider: FC<ProviderProviderProps> = ({ children }) => {
  const [activeProvider, setActiveProviderState] = useState<ProviderType>(getInitialProvider);

  // Persist to localStorage when provider changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeProvider);
    } catch {
      // Ignore storage errors
    }
  }, [activeProvider]);

  // List of all provider types
  const providers: ProviderType[] = ['elevenlabs', 'xai', 'openai'];

  // Check if a provider is available
  const isProviderAvailable = useCallback((provider: ProviderType): boolean => {
    return PROVIDERS[provider]?.isAvailable ?? false;
  }, []);

  // Set active provider with validation
  const setActiveProvider = useCallback((provider: ProviderType) => {
    if (!isValidProvider(provider)) {
      console.warn(`Invalid provider type: ${provider}`);
      return;
    }

    // Only allow switching to available providers
    if (!PROVIDERS[provider]?.isAvailable) {
      console.warn(`Provider ${provider} is not available`);
      return;
    }

    setActiveProviderState(provider);
  }, []);

  const value: ProviderContextType = {
    activeProvider,
    setActiveProvider,
    isProviderAvailable,
    providers,
  };

  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
};
