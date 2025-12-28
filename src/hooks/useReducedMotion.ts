import { useState, useEffect, useCallback } from 'react';

/**
 * Get the current reduced motion preference
 */
function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to detect user's prefers-reduced-motion setting
 * Returns true if the user prefers reduced motion
 *
 * Usage:
 * const prefersReducedMotion = useReducedMotion();
 * const variants = prefersReducedMotion ? reducedMotionVariants : standardVariants;
 */
export function useReducedMotion(): boolean {
  // Use lazy initial state to get the value synchronously on first render
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getReducedMotionPreference);

  const handleChange = useCallback((event: MediaQueryListEvent) => {
    setPrefersReducedMotion(event.matches);
  }, []);

  useEffect(() => {
    // Check for SSR
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [handleChange]);

  return prefersReducedMotion;
}

export default useReducedMotion;
