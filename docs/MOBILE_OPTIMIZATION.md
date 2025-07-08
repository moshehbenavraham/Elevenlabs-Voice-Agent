# Mobile Optimization Guide

This guide covers mobile-specific features, optimizations, and best practices for the ElevenLabs Voice Agent on mobile devices.

## 📱 Overview

The ElevenLabs Voice Agent is designed to provide excellent voice interaction experiences across all devices, with special attention to mobile optimization. This document covers mobile-specific implementations, performance considerations, and user experience patterns.

## 📋 Table of Contents

- [Mobile-First Design](#mobile-first-design)
- [Touch Interactions](#touch-interactions)
- [Mobile Voice Features](#mobile-voice-features)
- [Performance Optimization](#performance-optimization)
- [Battery Efficiency](#battery-efficiency)
- [Network Optimization](#network-optimization)
- [Responsive Design](#responsive-design)
- [Mobile Testing](#mobile-testing)
- [Progressive Web App](#progressive-web-app)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)

## 📐 Mobile-First Design

### Design Philosophy
The application follows a mobile-first approach, ensuring core functionality works seamlessly on mobile devices before enhancing for larger screens.

### Mobile Layout Principles
```typescript
// Mobile breakpoint system
const breakpoints = {
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Large laptops
  '2xl': '1536px' // Desktop
};

// Mobile-first CSS approach
const mobileStyles = {
  // Base styles for mobile
  container: {
    width: '100%',
    padding: '1rem',
    margin: '0 auto'
  },
  // Tablet and up
  '@media (min-width: 768px)': {
    container: {
      maxWidth: '1024px',
      padding: '2rem'
    }
  },
  // Desktop and up
  '@media (min-width: 1024px)': {
    container: {
      maxWidth: '1200px',
      padding: '3rem'
    }
  }
};
```

### Mobile-Specific Components
```typescript
const MobileVoiceInterface = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return <MobileOptimizedVoiceOrb />;
  }
  
  return <DesktopVoiceOrb />;
};

const MobileOptimizedVoiceOrb = () => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <div className="mobile-voice-orb">
      <TouchableVoiceButton
        onPress={() => setIsPressed(true)}
        onRelease={() => setIsPressed(false)}
        isPressed={isPressed}
      />
      <MobileStatusIndicator />
      <MobileVoiceHints />
    </div>
  );
};
```

## 👆 Touch Interactions

### Touch-Optimized Controls
```typescript
interface TouchableVoiceButtonProps {
  onPress: () => void;
  onRelease: () => void;
  isPressed: boolean;
  disabled?: boolean;
}

const TouchableVoiceButton: React.FC<TouchableVoiceButtonProps> = ({
  onPress,
  onRelease,
  isPressed,
  disabled = false
}) => {
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!disabled) {
      onPress();
    }
  }, [onPress, disabled]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!disabled) {
      onRelease();
    }
  }, [onRelease, disabled]);
  
  // Prevent accidental touches
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Check if touch moved outside button area
    const isOutside = (
      touch.clientX < rect.left ||
      touch.clientX > rect.right ||
      touch.clientY < rect.top ||
      touch.clientY > rect.bottom
    );
    
    if (isOutside && isPressed) {
      onRelease();
    }
  }, [isPressed, onRelease]);
  
  return (
    <button
      className={`touchable-voice-button ${isPressed ? 'pressed' : ''} ${disabled ? 'disabled' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchEnd}
      disabled={disabled}
      aria-label="Hold to speak"
    >
      <MicrophoneIcon size={48} />
      <div className="touch-ripple" />
    </button>
  );
};
```

### Touch Target Sizing
```css
/* Mobile touch targets should be at least 44x44px */
.touchable-voice-button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.touchable-voice-button:active,
.touchable-voice-button.pressed {
  transform: scale(0.95);
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.touchable-voice-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Touch ripple effect */
.touch-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.6s linear;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

### Gesture Support
```typescript
const useSwipeGestures = () => {
  const [startTouch, setStartTouch] = useState<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    setStartTouch({ x: touch.clientX, y: touch.clientY });
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!startTouch) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.x;
    const deltaY = touch.clientY - startTouch.y;
    
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right
        onSwipeRight();
      } else {
        // Swipe left
        onSwipeLeft();
      }
    }
    
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        // Swipe down
        onSwipeDown();
      } else {
        // Swipe up
        onSwipeUp();
      }
    }
    
    setStartTouch(null);
  };
  
  return { handleTouchStart, handleTouchEnd };
};
```

## 🎤 Mobile Voice Features

### Mobile Audio Configuration
```typescript
const useMobileAudioConfig = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const audioConfig = useMemo(() => ({
    // Mobile-optimized settings
    sampleRate: isMobile ? 22050 : 44100,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    bufferSize: isMobile ? 1024 : 2048,
    // Mobile-specific constraints
    googEchoCancellation: true,
    googNoiseSuppression: true,
    googAutoGainControl: true,
    googHighpassFilter: true,
    googTypingNoiseDetection: true
  }), [isMobile]);
  
  return { isMobile, audioConfig };
};
```

### Mobile Voice Recording
```typescript
const useMobileVoiceRecording = () => {
  const { isMobile, audioConfig } = useMobileAudioConfig();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request permission with mobile-optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConfig
      });
      
      // Create MediaRecorder with mobile-friendly options
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: getMobileSupportedMimeType(),
        audioBitsPerSecond: isMobile ? 64000 : 128000
      });
      
      setIsRecording(true);
      mediaRecorder.start();
      
      return mediaRecorder;
    } catch (err) {
      const errorMessage = handleMobileAudioError(err);
      setError(errorMessage);
      throw err;
    }
  }, [audioConfig, isMobile]);
  
  return { isRecording, error, startRecording };
};

const getMobileSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'audio/webm'; // Fallback
};
```

### Mobile Audio Playback
```typescript
const MobileAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  
  const playAudio = useCallback(async (audioData: Blob) => {
    if (!audioRef.current) return;
    
    try {
      const audioUrl = URL.createObjectURL(audioData);
      audioRef.current.src = audioUrl;
      
      // Mobile browsers require user interaction for audio
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Mobile audio playback failed:', error);
      // Handle mobile audio restrictions
      showUserInteractionPrompt();
    }
  }, []);
  
  const showUserInteractionPrompt = () => {
    // Show prompt for user to enable audio
    const prompt = document.createElement('div');
    prompt.className = 'audio-permission-prompt';
    prompt.innerHTML = `
      <div class="prompt-content">
        <p>Tap to enable audio playback</p>
        <button onclick="this.parentElement.parentElement.remove(); window.enableAudio();">
          Enable Audio
        </button>
      </div>
    `;
    document.body.appendChild(prompt);
  };
  
  return (
    <audio
      ref={audioRef}
      preload="none"
      onEnded={() => setIsPlaying(false)}
      onError={(e) => console.error('Audio error:', e)}
      volume={volume}
    />
  );
};
```

## ⚡ Performance Optimization

### Mobile Performance Monitoring
```typescript
const useMobilePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    batteryLevel: 0,
    isCharging: false
  });
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({ 
          ...prev, 
          fps: Math.round(frameCount * 1000 / (currentTime - lastTime))
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
    
    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
        }));
      }
    }, 5000);
    
    // Monitor battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: battery.level,
            isCharging: battery.charging
          }));
        };
        
        updateBattery();
        battery.addEventListener('chargingchange', updateBattery);
        battery.addEventListener('levelchange', updateBattery);
      });
    }
    
    return () => clearInterval(memoryInterval);
  }, []);
  
  return metrics;
};
```

### Resource Optimization
```typescript
const MobileOptimizedComponents = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  // Reduce animation complexity on mobile
  const animationComplexity = useMemo(() => {
    const isMobile = window.innerWidth < 768;
    return {
      particleCount: isMobile ? 10 : 50,
      updateFrequency: isMobile ? 30 : 60,
      enableShadows: !isMobile,
      enableBlur: !isMobile
    };
  }, []);
  
  return (
    <div ref={containerRef}>
      {isVisible && (
        <VoiceVisualization
          particleCount={animationComplexity.particleCount}
          updateFrequency={animationComplexity.updateFrequency}
          enableEffects={animationComplexity.enableShadows}
        />
      )}
    </div>
  );
};
```

### Image and Asset Optimization
```typescript
const OptimizedImage = ({ src, alt, ...props }: ImageProps) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const img = new Image();
    
    // Use appropriate image size for device
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    
    let optimizedSrc = src;
    
    // Serve smaller images for mobile
    if (screenWidth < 768) {
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/, '_mobile.$1');
    } else if (devicePixelRatio > 1) {
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/, '_2x.$1');
    }
    
    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      // Fallback to original image
      setImageSrc(src);
      setIsLoaded(true);
    };
    
    img.src = optimizedSrc;
  }, [src]);
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
      {...props}
    />
  );
};
```

## 🔋 Battery Efficiency

### Battery-Aware Features
```typescript
const useBatteryAwareOptimizations = () => {
  const [batteryStatus, setBatteryStatus] = useState({
    level: 1,
    charging: false,
    chargingTime: Infinity,
    dischargingTime: Infinity
  });
  
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          setBatteryStatus({
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          });
        };
        
        updateBatteryStatus();
        
        battery.addEventListener('chargingchange', updateBatteryStatus);
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingtimechange', updateBatteryStatus);
        battery.addEventListener('dischargingtimechange', updateBatteryStatus);
      });
    }
  }, []);
  
  // Optimize based on battery level
  const optimizations = useMemo(() => {
    const isLowBattery = batteryStatus.level < 0.2 && !batteryStatus.charging;
    
    return {
      // Reduce animation frequency when battery is low
      animationRate: isLowBattery ? 15 : 60,
      // Disable intensive visual effects
      enableParticles: !isLowBattery,
      enableBlur: !isLowBattery,
      // Reduce audio quality slightly
      audioQuality: isLowBattery ? 'standard' : 'high',
      // Increase API request timeouts to reduce retries
      apiTimeout: isLowBattery ? 45000 : 30000
    };
  }, [batteryStatus]);
  
  return { batteryStatus, optimizations };
};
```

### Power-Efficient Audio Processing
```typescript
const usePowerEfficientAudio = () => {
  const { optimizations } = useBatteryAwareOptimizations();
  
  const createAudioContext = useCallback(() => {
    const context = new AudioContext();
    
    // Reduce sample rate for battery efficiency
    if (optimizations.audioQuality === 'standard') {
      context.sampleRate = 22050;
    }
    
    return context;
  }, [optimizations.audioQuality]);
  
  const processAudioWithEfficiency = useCallback((audioData: Float32Array) => {
    // Skip processing frames when battery is low
    if (optimizations.audioQuality === 'standard') {
      // Process every other frame
      const reducedData = new Float32Array(audioData.length / 2);
      for (let i = 0; i < reducedData.length; i++) {
        reducedData[i] = audioData[i * 2];
      }
      return reducedData;
    }
    
    return audioData;
  }, [optimizations.audioQuality]);
  
  return { createAudioContext, processAudioWithEfficiency };
};
```

## 🌐 Network Optimization

### Adaptive Bitrate
```typescript
const useAdaptiveBitrate = () => {
  const [connectionType, setConnectionType] = useState<string>('4g');
  const [effectiveType, setEffectiveType] = useState<string>('4g');
  
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnection = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || '4g');
      };
      
      updateConnection();
      connection.addEventListener('change', updateConnection);
      
      return () => connection.removeEventListener('change', updateConnection);
    }
  }, []);
  
  const getBitrateForConnection = useCallback(() => {
    switch (effectiveType) {
      case 'slow-2g':
        return { audio: 32000, video: 128000 };
      case '2g':
        return { audio: 48000, video: 256000 };
      case '3g':
        return { audio: 64000, video: 512000 };
      case '4g':
      default:
        return { audio: 128000, video: 1024000 };
    }
  }, [effectiveType]);
  
  return { connectionType, effectiveType, getBitrateForConnection };
};
```

### Data Usage Optimization
```typescript
const useDataUsageOptimization = () => {
  const [dataUsage, setDataUsage] = useState(0);
  const [isDataSaverMode, setIsDataSaverMode] = useState(false);
  
  useEffect(() => {
    // Check for data saver mode
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setIsDataSaverMode(connection.saveData || false);
    }
  }, []);
  
  const optimizeForDataUsage = useCallback((options: any) => {
    if (isDataSaverMode) {
      return {
        ...options,
        // Reduce audio quality for data saving
        audioBitsPerSecond: Math.min(options.audioBitsPerSecond || 128000, 64000),
        // Disable preloading
        preload: 'none',
        // Compress requests
        compression: true
      };
    }
    
    return options;
  }, [isDataSaverMode]);
  
  return { dataUsage, isDataSaverMode, optimizeForDataUsage };
};
```

## 📐 Responsive Design

### Mobile Layout Patterns
```typescript
const ResponsiveVoiceInterface = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  const layout = useMemo(() => {
    const { width, height } = screenSize;
    const isPortrait = height > width;
    const isSmallScreen = width < 640;
    
    return {
      isPortrait,
      isSmallScreen,
      orbSize: isSmallScreen ? 120 : 200,
      padding: isSmallScreen ? 16 : 24,
      fontSize: isSmallScreen ? 14 : 16,
      layoutDirection: isPortrait ? 'column' : 'row'
    };
  }, [screenSize]);
  
  return (
    <div 
      className={`responsive-voice-interface ${layout.isPortrait ? 'portrait' : 'landscape'}`}
      style={{
        padding: layout.padding,
        flexDirection: layout.layoutDirection
      }}
    >
      <VoiceOrb size={layout.orbSize} />
      <VoiceControls compact={layout.isSmallScreen} />
      <AudioVisualizer 
        height={layout.isSmallScreen ? 100 : 200}
        responsive={true}
      />
    </div>
  );
};
```

### Orientation Handling
```css
/* Portrait orientation */
@media (orientation: portrait) {
  .voice-interface {
    flex-direction: column;
    height: 100vh;
    justify-content: space-between;
  }
  
  .voice-orb {
    margin-bottom: 2rem;
  }
  
  .audio-visualizer {
    width: 100%;
    height: 120px;
  }
}

/* Landscape orientation */
@media (orientation: landscape) and (max-height: 600px) {
  .voice-interface {
    flex-direction: row;
    align-items: center;
    padding: 1rem;
  }
  
  .voice-orb {
    margin-right: 2rem;
    flex-shrink: 0;
  }
  
  .audio-visualizer {
    flex: 1;
    height: 80px;
  }
}

/* Safe area insets for notched devices */
.voice-interface {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

## 🧪 Mobile Testing

### Device Testing Matrix
```typescript
const MOBILE_TEST_DEVICES = [
  // iOS Devices
  { name: 'iPhone SE', width: 375, height: 667, userAgent: 'iPhone' },
  { name: 'iPhone 12', width: 390, height: 844, userAgent: 'iPhone' },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, userAgent: 'iPhone' },
  { name: 'iPad', width: 768, height: 1024, userAgent: 'iPad' },
  { name: 'iPad Pro', width: 1024, height: 1366, userAgent: 'iPad' },
  
  // Android Devices
  { name: 'Samsung Galaxy S21', width: 360, height: 800, userAgent: 'Android' },
  { name: 'Samsung Galaxy S21 Ultra', width: 384, height: 854, userAgent: 'Android' },
  { name: 'Google Pixel 5', width: 393, height: 851, userAgent: 'Android' },
  { name: 'OnePlus 9', width: 412, height: 915, userAgent: 'Android' }
];

const simulateDevice = (device: typeof MOBILE_TEST_DEVICES[0]) => {
  // Simulate device viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      `width=${device.width}, height=${device.height}, initial-scale=1`
    );
  }
  
  // Simulate user agent
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: navigator.userAgent.replace(/\([^)]*\)/, `(${device.userAgent})`)
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};
```

### Automated Mobile Testing
```typescript
const runMobileTests = async () => {
  const tests = [
    testTouchInteractions,
    testVoiceFeatures,
    testResponsiveLayout,
    testPerformance,
    testBatteryUsage,
    testNetworkConditions
  ];
  
  const results = [];
  
  for (const device of MOBILE_TEST_DEVICES) {
    simulateDevice(device);
    
    for (const test of tests) {
      try {
        const result = await test(device);
        results.push({
          device: device.name,
          test: test.name,
          status: 'passed',
          result
        });
      } catch (error) {
        results.push({
          device: device.name,
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }
  
  return results;
};

const testTouchInteractions = async (device: any) => {
  // Test touch events
  const voiceButton = document.querySelector('.touchable-voice-button');
  if (!voiceButton) throw new Error('Voice button not found');
  
  // Simulate touch events
  const touchStart = new TouchEvent('touchstart', {
    touches: [new Touch({
      identifier: 0,
      target: voiceButton,
      clientX: 100,
      clientY: 100
    })]
  });
  
  voiceButton.dispatchEvent(touchStart);
  
  // Verify response
  const isPressed = voiceButton.classList.contains('pressed');
  if (!isPressed) throw new Error('Touch interaction failed');
  
  return { touchInteraction: 'working' };
};
```

## 📲 Progressive Web App

### PWA Configuration
```json
// manifest.json
{
  "name": "ElevenLabs Voice Agent",
  "short_name": "Voice Agent",
  "description": "AI-powered voice conversation app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["productivity", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/mobile-portrait.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/tablet-landscape.png",
      "sizes": "1024x768",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

### Service Worker for Mobile
```typescript
// sw.js
const CACHE_NAME = 'voice-agent-v1';
const OFFLINE_PAGES = [
  '/',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_PAGES))
  );
});

self.addEventListener('fetch', (event) => {
  // Handle voice API requests differently
  if (event.request.url.includes('api.elevenlabs.io')) {
    // Don't cache API requests, but provide offline fallback
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - voice features unavailable' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // Cache-first strategy for assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
```

## 🌐 Browser Compatibility

### Mobile Browser Support Matrix
```typescript
const MOBILE_BROWSER_SUPPORT = {
  'iOS Safari': {
    versions: ['14+'],
    features: {
      webAudio: true,
      getUserMedia: true,
      mediaRecorder: false, // Limited support
      webRTC: true,
      serviceWorker: true
    }
  },
  'Chrome Mobile': {
    versions: ['90+'],
    features: {
      webAudio: true,
      getUserMedia: true,
      mediaRecorder: true,
      webRTC: true,
      serviceWorker: true
    }
  },
  'Firefox Mobile': {
    versions: ['88+'],
    features: {
      webAudio: true,
      getUserMedia: true,
      mediaRecorder: true,
      webRTC: true,
      serviceWorker: true
    }
  },
  'Samsung Internet': {
    versions: ['13+'],
    features: {
      webAudio: true,
      getUserMedia: true,
      mediaRecorder: true,
      webRTC: true,
      serviceWorker: true
    }
  }
};

const checkMobileBrowserSupport = () => {
  const userAgent = navigator.userAgent;
  const support = {
    webAudio: !!(window.AudioContext || window.webkitAudioContext),
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    mediaRecorder: !!window.MediaRecorder,
    webRTC: !!window.RTCPeerConnection,
    serviceWorker: 'serviceWorker' in navigator
  };
  
  return support;
};
```

## 🔧 Troubleshooting

### Common Mobile Issues

#### iOS Safari Audio Issues
```typescript
const handleIOSAudioIssues = () => {
  // iOS requires user interaction to play audio
  const enableIOSAudio = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (audioContext.state === 'suspended') {
      const resumeAudio = () => {
        audioContext.resume().then(() => {
          console.log('iOS audio context resumed');
          document.removeEventListener('touchstart', resumeAudio);
          document.removeEventListener('click', resumeAudio);
        });
      };
      
      document.addEventListener('touchstart', resumeAudio, { once: true });
      document.addEventListener('click', resumeAudio, { once: true });
    }
  };
  
  // Check if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    enableIOSAudio();
  }
};
```

#### Android Chrome Audio Latency
```typescript
const optimizeAndroidAudio = () => {
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isAndroid) {
    // Use smaller buffer sizes for lower latency
    const audioContext = new AudioContext();
    
    if (audioContext.baseLatency) {
      console.log('Audio latency:', audioContext.baseLatency);
    }
    
    // Enable low-latency mode if available
    if ('audioWorklet' in audioContext) {
      audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
    }
  }
};
```

#### Mobile Performance Issues
```typescript
const diagnoseMobilePerformance = () => {
  const metrics = {
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    userAgent: navigator.userAgent,
    screen: {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio
    }
  };
  
  console.log('Mobile performance metrics:', metrics);
  
  // Provide recommendations based on metrics
  const recommendations = [];
  
  if (metrics.deviceMemory && metrics.deviceMemory < 4) {
    recommendations.push('Reduce animation complexity');
    recommendations.push('Lower audio quality');
  }
  
  if (metrics.connection === 'slow-2g' || metrics.connection === '2g') {
    recommendations.push('Enable data saver mode');
    recommendations.push('Reduce API call frequency');
  }
  
  return { metrics, recommendations };
};
```

## 📞 Support

For mobile-specific issues:
- Test on actual devices when possible
- Use browser developer tools mobile simulation
- Check device-specific limitations
- Monitor performance metrics
- Refer to mobile browser documentation

---

**Last Updated**: January 8, 2025
**Next Review**: April 8, 2025

This guide provides comprehensive mobile optimization strategies. For device-specific issues, refer to the [troubleshooting section](#troubleshooting) or create an issue with device details. 📱