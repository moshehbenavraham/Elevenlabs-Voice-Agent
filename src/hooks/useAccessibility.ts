import { useEffect, useState, useCallback } from 'react';

interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusManagement: boolean;
}

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reduceMotion: false,
    highContrast: false,
    screenReader: false,
    keyboardNavigation: true,
    focusManagement: true,
  });

  // Detect motion preferences
  const detectMotionPreference = useCallback(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSettings(prev => ({ ...prev, reduceMotion: mediaQuery.matches }));
    
    return mediaQuery;
  }, []);

  // Detect high contrast preference
  const detectContrastPreference = useCallback(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setSettings(prev => ({ ...prev, highContrast: mediaQuery.matches }));
    
    return mediaQuery;
  }, []);

  // Screen reader detection
  const detectScreenReader = useCallback(() => {
    // Basic screen reader detection
    const isScreenReader = !!(
      window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|Narrator/i) ||
      window.speechSynthesis ||
      document.body.getAttribute('aria-hidden') === 'true'
    );
    
    setSettings(prev => ({ ...prev, screenReader: isScreenReader }));
    return isScreenReader;
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
    let focusStack: HTMLElement[] = [];
    
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
      'role': 'status',
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
    const motionQuery = detectMotionPreference();
    const contrastQuery = detectContrastPreference();
    
    detectScreenReader();
    
    const motionHandler = () => setSettings(prev => ({ 
      ...prev, 
      reduceMotion: motionQuery.matches 
    }));
    
    const contrastHandler = () => setSettings(prev => ({ 
      ...prev, 
      highContrast: contrastQuery.matches 
    }));
    
    motionQuery.addEventListener('change', motionHandler);
    contrastQuery.addEventListener('change', contrastHandler);
    
    const keyboardCleanup = enhanceKeyboardNavigation();
    
    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      contrastQuery.removeEventListener('change', contrastHandler);
      keyboardCleanup();
    };
  }, [detectMotionPreference, detectContrastPreference, detectScreenReader, enhanceKeyboardNavigation]);

  return {
    settings,
    getReducedMotionAlternatives,
    getScreenReaderOptimizations,
    getHighContrastStyles,
    createFocusManager,
  };
};