import { useEffect, useState, useCallback } from 'react';

interface MobileConfig {
  touchThreshold: number;
  batteryOptimization: boolean;
  responsiveParticles: boolean;
  adaptiveAnimations: boolean;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  batteryLevel?: number;
  isLowPowerMode?: boolean;
}

export const useMobileOptimization = (config: MobileConfig) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    screenSize: 'large',
    orientation: 'landscape',
  });

  const [touchState, setTouchState] = useState({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  // Detect device capabilities
  const detectDevice = useCallback(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent) && window.innerWidth > 768;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    const screenSize = window.innerWidth < 768 ? 'small' : 
                      window.innerWidth < 1024 ? 'medium' : 'large';
    
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    setDeviceInfo(prev => ({
      ...prev,
      isMobile,
      isTablet,
      isTouch,
      screenSize,
      orientation,
    }));
  }, []);

  // Battery optimization
  const detectBatteryStatus = useCallback(async () => {
    if (!config.batteryOptimization) return;
    
    try {
      // @ts-ignore - Battery API not in TS definitions
      const battery = await navigator.getBattery?.();
      if (battery) {
        const batteryLevel = battery.level;
        const isCharging = battery.charging;
        const isLowPowerMode = batteryLevel < 0.2 && !isCharging;
        
        setDeviceInfo(prev => ({
          ...prev,
          batteryLevel,
          isLowPowerMode,
        }));
      }
    } catch (error) {
      // Battery API not supported
    }
  }, [config.batteryOptimization]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    setTouchState({
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchState.isActive) return;
    
    const touch = event.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  }, [touchState.isActive]);

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({ ...prev, isActive: false }));
  }, []);

  // Mobile-specific gestures
  const detectGestures = useCallback(() => {
    if (!touchState.isActive) return null;
    
    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < config.touchThreshold) return null;
    
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    if (Math.abs(angle) < 45) return 'swipeRight';
    if (Math.abs(angle) > 135) return 'swipeLeft';
    if (angle > 45 && angle < 135) return 'swipeDown';
    if (angle < -45 && angle > -135) return 'swipeUp';
    
    return null;
  }, [touchState, config.touchThreshold]);

  // Battery-conscious animations
  const getBatteryOptimizedConfig = useCallback(() => {
    if (!deviceInfo.isLowPowerMode) return null;
    
    return {
      // Reduce animation complexity
      particleCount: Math.max(10, Math.floor(50 * 0.3)),
      animationDuration: 2, // Slower animations
      frameRate: 30, // Lower frame rate
      disableComplexEffects: true,
      reduceBlur: true,
    };
  }, [deviceInfo.isLowPowerMode]);

  // Responsive particle system
  const getResponsiveParticleConfig = useCallback(() => {
    if (!config.responsiveParticles) return null;
    
    const baseCount = 100;
    let multiplier = 1;
    
    switch (deviceInfo.screenSize) {
      case 'small':
        multiplier = 0.3;
        break;
      case 'medium':
        multiplier = 0.6;
        break;
      case 'large':
        multiplier = 1;
        break;
    }
    
    // Further reduce on mobile devices
    if (deviceInfo.isMobile) {
      multiplier *= 0.5;
    }
    
    return {
      maxParticles: Math.floor(baseCount * multiplier),
      particleSize: deviceInfo.screenSize === 'small' ? 2 : 3,
      updateFrequency: deviceInfo.isMobile ? 60 : 30, // ms
    };
  }, [config.responsiveParticles, deviceInfo]);

  // Adaptive animations for different screen sizes
  const getAdaptiveAnimations = useCallback(() => {
    if (!config.adaptiveAnimations) return {};
    
    const baseAnimations = {
      orbScale: deviceInfo.screenSize === 'small' ? 0.8 : 1,
      orbSize: deviceInfo.screenSize === 'small' ? '240px' : '300px',
      buttonSize: deviceInfo.screenSize === 'small' ? 'md' : 'lg',
      fontSize: deviceInfo.screenSize === 'small' ? '14px' : '16px',
      spacing: deviceInfo.screenSize === 'small' ? '16px' : '24px',
    };
    
    // Adjust for touch interfaces
    if (deviceInfo.isTouch) {
      return {
        ...baseAnimations,
        buttonMinHeight: '44px', // iOS accessibility guideline
        touchTargetSize: '44px',
        tapScale: 0.95, // Provide visual feedback for taps
      };
    }
    
    return baseAnimations;
  }, [config.adaptiveAnimations, deviceInfo]);

  // Orientation handling
  const handleOrientationChange = useCallback(() => {
    setTimeout(() => {
      detectDevice();
    }, 100); // Delay to ensure proper measurements
  }, [detectDevice]);

  useEffect(() => {
    detectDevice();
    detectBatteryStatus();
    
    // Set up touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Orientation change listener
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', detectDevice);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', detectDevice);
    };
  }, [detectDevice, detectBatteryStatus, handleTouchStart, handleTouchMove, handleTouchEnd, handleOrientationChange]);

  return {
    deviceInfo,
    touchState,
    currentGesture: detectGestures(),
    getBatteryOptimizedConfig,
    getResponsiveParticleConfig,
    getAdaptiveAnimations,
  };
};