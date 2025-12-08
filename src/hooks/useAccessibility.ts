import { useEffect, useState, useCallback } from 'react';

interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusManagement: boolean;
}

// Helper functions for initial detection (called once at init)
const getInitialMotionPreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const getInitialContrastPreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

const getInitialScreenReaderDetection = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|Narrator/i) ||
    window.speechSynthesis ||
    document.body.getAttribute('aria-hidden') === 'true'
  );
};

const getInitialSettings = (): AccessibilitySettings => ({
  reduceMotion: getInitialMotionPreference(),
  highContrast: getInitialContrastPreference(),
  screenReader: getInitialScreenReaderDetection(),
  keyboardNavigation: true,
  focusManagement: true,
});

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(getInitialSettings);

  // Get media query for motion preferences
  const getMotionMediaQuery = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)');
  }, []);

  // Get media query for high contrast preference
  const getContrastMediaQuery = useCallback(() => {
    return window.matchMedia('(prefers-contrast: high)');
  }, []);

  // Keyboard navigation enhancement
  const enhanceKeyboardNavigation = useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Custom keyboard shortcuts for voice interface
      switch (event.key) {
        case 'Space':
          if (event.ctrlKey) {
            event.preventDefault();
            // Trigger voice activation
            const voiceButton = document.querySelector('[data-voice-toggle]') as HTMLButtonElement;
            if (voiceButton) voiceButton.click();
          }
          break;
        case 'Escape':
          // End conversation
          const endButton = document.querySelector('[data-voice-end]') as HTMLButtonElement;
          if (endButton) endButton.click();
          break;
        case 'Tab':
          // Ensure focus is visible
          document.body.classList.add('keyboard-navigation');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus management system
  const createFocusManager = useCallback(() => {
    const focusStack: HTMLElement[] = [];

    const pushFocus = (element: HTMLElement) => {
      if (document.activeElement instanceof HTMLElement) {
        focusStack.push(document.activeElement);
      }
      element.focus();
    };

    const popFocus = () => {
      const previousElement = focusStack.pop();
      if (previousElement) {
        previousElement.focus();
      }
    };

    const trapFocus = (container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      container.addEventListener('keydown', handleTabKey);
      return () => container.removeEventListener('keydown', handleTabKey);
    };

    return { pushFocus, popFocus, trapFocus };
  }, []);

  // Get reduced motion alternatives
  const getReducedMotionAlternatives = useCallback(() => {
    if (!settings.reduceMotion) return null;

    return {
      // Replace complex animations with simple transitions
      fadeIn: { opacity: 1, transition: { duration: 0.2 } },
      slideIn: { opacity: 1, transition: { duration: 0.3 } },
      scaleIn: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
      // Disable infinite animations
      disableInfinite: true,
      // Reduce particle count
      particleCount: 0,
    };
  }, [settings.reduceMotion]);

  // Screen reader optimizations
  const getScreenReaderOptimizations = useCallback(() => {
    if (!settings.screenReader) return {};

    return {
      'aria-live': 'polite',
      'aria-atomic': 'true',
      role: 'status',
      'aria-label': 'Voice chat interface',
      'aria-describedby': 'voice-status',
    };
  }, [settings.screenReader]);

  // High contrast mode adjustments
  const getHighContrastStyles = useCallback(() => {
    if (!settings.highContrast) return {};

    return {
      '--primary': '0 0% 100%',
      '--background': '0 0% 0%',
      '--border': '0 0% 100%',
      '--text': '0 0% 100%',
      filter: 'contrast(1.2)',
    };
  }, [settings.highContrast]);

  useEffect(() => {
    const motionQuery = getMotionMediaQuery();
    const contrastQuery = getContrastMediaQuery();

    const motionHandler = () =>
      setSettings((prev) => ({
        ...prev,
        reduceMotion: motionQuery.matches,
      }));

    const contrastHandler = () =>
      setSettings((prev) => ({
        ...prev,
        highContrast: contrastQuery.matches,
      }));

    motionQuery.addEventListener('change', motionHandler);
    contrastQuery.addEventListener('change', contrastHandler);

    const keyboardCleanup = enhanceKeyboardNavigation();

    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      contrastQuery.removeEventListener('change', contrastHandler);
      keyboardCleanup();
    };
  }, [getMotionMediaQuery, getContrastMediaQuery, enhanceKeyboardNavigation]);

  return {
    settings,
    getReducedMotionAlternatives,
    getScreenReaderOptimizations,
    getHighContrastStyles,
    createFocusManager,
  };
};
