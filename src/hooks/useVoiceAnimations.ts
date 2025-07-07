import { useEffect, useState, useCallback } from 'react';
import { useAnimation } from 'framer-motion';

interface VoiceAnimationState {
  isTransitioning: boolean;
  currentState: 'idle' | 'loading' | 'connected' | 'speaking';
  previousState: string | null;
  intensity: number;
}

export const useVoiceAnimations = (
  isConnected: boolean,
  isLoading: boolean,
  isSpeaking: boolean
) => {
  const [animationState, setAnimationState] = useState<VoiceAnimationState>({
    isTransitioning: false,
    currentState: 'idle',
    previousState: null,
    intensity: 0,
  });

  const controls = useAnimation();

  // Determine current state
  const getCurrentState = useCallback(() => {
    if (isLoading) return 'loading';
    if (isConnected && isSpeaking) return 'speaking';
    if (isConnected) return 'connected';
    return 'idle';
  }, [isConnected, isLoading, isSpeaking]);

  // Sophisticated state transition system
  useEffect(() => {
    const newState = getCurrentState();
    const previousState = animationState.currentState;
    
    if (newState !== previousState) {
      setAnimationState(prev => ({
        ...prev,
        isTransitioning: true,
        previousState,
        currentState: newState,
      }));

      // Context-aware animation timing
      const getTransitionDuration = () => {
        if (previousState === 'idle' && newState === 'loading') return 0.8;
        if (previousState === 'loading' && newState === 'connected') return 1.2;
        if (previousState === 'connected' && newState === 'speaking') return 0.4;
        if (previousState === 'speaking' && newState === 'connected') return 0.6;
        return 0.8;
      };

      // Execute context-aware transition
      controls.start({
        scale: [1, 1.05, 1],
        transition: {
          duration: getTransitionDuration(),
          ease: 'easeInOut',
        },
      }).then(() => {
        setAnimationState(prev => ({ ...prev, isTransitioning: false }));
      });
    }
  }, [isConnected, isLoading, isSpeaking, getCurrentState, controls, animationState.currentState]);

  // Predictive state changes based on patterns
  const predictNextState = useCallback(() => {
    const { currentState, previousState } = animationState;
    
    // Simple pattern prediction
    if (currentState === 'loading' && previousState === 'idle') {
      return 'connected';
    }
    if (currentState === 'connected' && !isSpeaking) {
      // Predict speaking might start soon
      return 'speaking';
    }
    return currentState;
  }, [animationState, isSpeaking]);

  // Enhanced loading state progressions
  const getLoadingProgress = useCallback(() => {
    if (!isLoading) return 100;
    
    // Simulate smooth loading progression
    const elapsed = Date.now() % 3000; // 3 second cycle
    return Math.min(95, (elapsed / 3000) * 100);
  }, [isLoading]);

  return {
    animationState,
    controls,
    predictNextState,
    getLoadingProgress,
    isTransitioning: animationState.isTransitioning,
  };
};