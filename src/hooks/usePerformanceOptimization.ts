import { useEffect, useRef, useCallback } from 'react';

interface PerformanceConfig {
  enableGPUAcceleration: boolean;
  maxParticles: number;
  animationFrameThrottling: boolean;
  memoryCleanupInterval: number;
}

export const usePerformanceOptimization = (config: PerformanceConfig) => {
  const animationFrameId = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsTracker = useRef<number[]>([]);
  const memoryCleanupTimer = useRef<NodeJS.Timeout>();

  // GPU acceleration detection and enablement
  const enableGPUAcceleration = useCallback(() => {
    if (!config.enableGPUAcceleration) return false;
    
    const canvas = document.createElement('canvas');
    const contexts = ['webgl2', 'webgl', 'experimental-webgl'];
    
    for (const contextType of contexts) {
      try {
        const context = canvas.getContext(contextType as any);
        if (context) {
          return true;
        }
      } catch (e) {
        // Context not supported
      }
    }
    return false;
  }, [config.enableGPUAcceleration]);

  // Optimized animation frame management
  const requestOptimizedFrame = useCallback((callback: FrameRequestCallback) => {
    if (config.animationFrameThrottling) {
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      
      // Throttle to 60fps max
      if (delta >= 16.67) {
        lastFrameTime.current = now;
        frameCount.current++;
        
        // Track FPS
        fpsTracker.current.push(1000 / delta);
        if (fpsTracker.current.length > 60) {
          fpsTracker.current.shift();
        }
        
        return requestAnimationFrame(callback);
      }
      return null;
    }
    
    return requestAnimationFrame(callback);
  }, [config.animationFrameThrottling]);

  // Memory management for long sessions
  const setupMemoryManagement = useCallback(() => {
    const cleanup = () => {
      // Clear old animation frames
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Clear FPS tracking history
      if (fpsTracker.current.length > 120) {
        fpsTracker.current.splice(0, 60);
      }
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
    };

    memoryCleanupTimer.current = setInterval(cleanup, config.memoryCleanupInterval);
    
    return cleanup;
  }, [config.memoryCleanupInterval]);

  // Get current performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const avgFps = fpsTracker.current.length > 0 
      ? fpsTracker.current.reduce((a, b) => a + b, 0) / fpsTracker.current.length 
      : 0;
    
    return {
      averageFps: Math.round(avgFps),
      frameCount: frameCount.current,
      gpuAcceleration: enableGPUAcceleration(),
      memoryUsage: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };
  }, [enableGPUAcceleration]);

  // Efficient re-render strategies
  const shouldSkipRender = useCallback((intensity: number, threshold: number = 0.01) => {
    // Skip render if change is too small to be perceptible
    return Math.abs(intensity) < threshold;
  }, []);

  // Optimize particle count based on performance
  const getOptimalParticleCount = useCallback(() => {
    const avgFps = fpsTracker.current.length > 0 
      ? fpsTracker.current.reduce((a, b) => a + b, 0) / fpsTracker.current.length 
      : 60;
    
    if (avgFps < 30) return Math.max(20, config.maxParticles * 0.5);
    if (avgFps < 45) return Math.max(40, config.maxParticles * 0.7);
    return config.maxParticles;
  }, [config.maxParticles]);

  useEffect(() => {
    const cleanup = setupMemoryManagement();
    
    return () => {
      cleanup();
      if (memoryCleanupTimer.current) {
        clearInterval(memoryCleanupTimer.current);
      }
    };
  }, [setupMemoryManagement]);

  return {
    requestOptimizedFrame,
    getPerformanceMetrics,
    shouldSkipRender,
    getOptimalParticleCount,
    gpuAccelerated: enableGPUAcceleration(),
  };
};