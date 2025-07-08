# Troubleshooting Guide

This comprehensive guide helps you diagnose and resolve common issues with the ElevenLabs Voice Agent.

## 🔍 Overview

This troubleshooting guide covers common issues, error messages, and solutions for the ElevenLabs Voice Agent. Use the table of contents to quickly find solutions for your specific issue.

## 📋 Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Voice and Audio Issues](#voice-and-audio-issues)
- [API Integration Issues](#api-integration-issues)
- [Browser Compatibility Issues](#browser-compatibility-issues)
- [Mobile-Specific Issues](#mobile-specific-issues)
- [Performance Issues](#performance-issues)
- [Installation and Setup Issues](#installation-and-setup-issues)
- [Network and Connectivity Issues](#network-and-connectivity-issues)
- [Error Messages Reference](#error-messages-reference)
- [Advanced Diagnostics](#advanced-diagnostics)
- [Getting Additional Help](#getting-additional-help)

## ⚡ Quick Diagnostics

### System Health Check
Run this diagnostic script to quickly identify common issues:

```typescript
const runSystemDiagnostics = async () => {
  const diagnostics = {
    browser: {
      name: navigator.userAgent,
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      mediaRecorder: !!window.MediaRecorder,
      serviceWorker: 'serviceWorker' in navigator
    },
    permissions: {
      microphone: 'unknown',
      camera: 'unknown'
    },
    network: {
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    },
    environment: {
      https: location.protocol === 'https:',
      localhost: location.hostname === 'localhost',
      apiKey: !!process.env.VITE_ELEVENLABS_API_KEY
    }
  };
  
  // Check permissions
  try {
    const micPermission = await navigator.permissions.query({ name: 'microphone' as any });
    diagnostics.permissions.microphone = micPermission.state;
  } catch (e) {
    diagnostics.permissions.microphone = 'unavailable';
  }
  
  console.log('System Diagnostics:', diagnostics);
  return diagnostics;
};

// Run diagnostics
runSystemDiagnostics();
```

### Quick Fixes Checklist
Before diving into specific issues, try these quick fixes:

- [ ] **Refresh the page** - Clears temporary state issues
- [ ] **Check HTTPS** - Voice features require secure contexts
- [ ] **Allow microphone permissions** - Check browser permission settings
- [ ] **Test in incognito mode** - Rules out extension conflicts
- [ ] **Try a different browser** - Identifies browser-specific issues
- [ ] **Check internet connection** - Verify stable network connectivity
- [ ] **Restart browser** - Clears browser-level issues
- [ ] **Clear browser cache** - Removes cached files that might be corrupted

## 🎤 Voice and Audio Issues

### Microphone Not Working

#### **Issue**: "Microphone permission denied" or no audio input detected

**Possible Causes:**
- Browser permissions not granted
- Microphone blocked by system settings
- Hardware microphone issues
- Browser security restrictions

**Solutions:**

1. **Check Browser Permissions**
   ```javascript
   // Check current permission status
   navigator.permissions.query({ name: 'microphone' })
     .then(permission => {
       console.log('Microphone permission:', permission.state);
       if (permission.state === 'denied') {
         alert('Please enable microphone access in browser settings');
       }
     });
   ```

2. **Grant Microphone Access**
   - **Chrome**: Click the microphone icon in the address bar
   - **Firefox**: Click the microphone icon in the address bar
   - **Safari**: Go to Safari > Settings > Websites > Microphone
   - **Edge**: Click the microphone icon in the address bar

3. **Check System Microphone Settings**
   - **Windows**: Settings > Privacy > Microphone
   - **macOS**: System Preferences > Security & Privacy > Microphone
   - **Linux**: Check PulseAudio/ALSA settings

4. **Test Microphone Hardware**
   ```javascript
   // Test microphone access
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => {
       console.log('Microphone access granted');
       stream.getTracks().forEach(track => track.stop());
     })
     .catch(error => {
       console.error('Microphone access failed:', error);
     });
   ```

#### **Issue**: "Poor audio quality" or "Audio cutting out"

**Solutions:**

1. **Optimize Audio Settings**
   ```javascript
   const optimizedConstraints = {
     audio: {
       sampleRate: 44100,
       channelCount: 1,
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true
     }
   };
   ```

2. **Check Audio Device Quality**
   - Use a higher-quality microphone
   - Reduce background noise
   - Ensure stable USB/Bluetooth connection

3. **Adjust Browser Audio Settings**
   - Close other applications using the microphone
   - Disable browser audio enhancements
   - Test with different audio sample rates

### Audio Playback Issues

#### **Issue**: "No audio output" or "Audio not playing"

**Solutions:**

1. **Check Audio Context State**
   ```javascript
   const audioContext = new AudioContext();
   if (audioContext.state === 'suspended') {
     // Resume audio context (required on mobile)
     audioContext.resume().then(() => {
       console.log('Audio context resumed');
     });
   }
   ```

2. **Mobile Audio Requirements**
   ```javascript
   // Mobile browsers require user interaction for audio
   const enableMobileAudio = () => {
     const audio = new Audio();
     audio.play().catch(() => {
       // Show user prompt to enable audio
       showAudioEnablePrompt();
     });
   };
   ```

3. **Check Volume Settings**
   - Verify system volume is not muted
   - Check browser tab audio settings
   - Test with different audio output devices

#### **Issue**: "Audio delay" or "Echo problems"

**Solutions:**

1. **Enable Echo Cancellation**
   ```javascript
   const constraints = {
     audio: {
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true
     }
   };
   ```

2. **Use Headphones**
   - Prevents audio feedback loops
   - Improves voice recognition accuracy
   - Reduces echo and background noise

3. **Adjust Audio Latency**
   ```javascript
   // For lower latency
   const audioContext = new AudioContext();
   console.log('Audio latency:', audioContext.baseLatency);
   ```

## 🔌 API Integration Issues

### ElevenLabs API Connection Issues

#### **Issue**: "API key invalid" or "Authentication failed"

**Error Messages:**
- `401 Unauthorized`
- `Invalid API key format`
- `API key not found`

**Solutions:**

1. **Verify API Key Format**
   ```javascript
   const validateApiKey = (apiKey) => {
     const pattern = /^sk-[a-zA-Z0-9]{32,}$/;
     return pattern.test(apiKey);
   };
   
   const apiKey = process.env.VITE_ELEVENLABS_API_KEY;
   if (!validateApiKey(apiKey)) {
     console.error('Invalid API key format');
   }
   ```

2. **Check Environment Variables**
   ```bash
   # Verify environment variables are set
   echo $VITE_ELEVENLABS_API_KEY
   echo $VITE_ELEVENLABS_AGENT_ID
   ```

3. **Test API Key Manually**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.elevenlabs.io/v1/user
   ```

4. **Regenerate API Key**
   - Go to ElevenLabs dashboard
   - Generate a new API key
   - Update environment variables
   - Restart development server

#### **Issue**: "Rate limit exceeded" or "Quota exceeded"

**Error Messages:**
- `429 Too Many Requests`
- `402 Payment Required`
- `Quota exceeded for current subscription`

**Solutions:**

1. **Check Account Limits**
   ```javascript
   const checkQuota = async () => {
     try {
       const response = await fetch('https://api.elevenlabs.io/v1/user', {
         headers: { 'Authorization': `Bearer ${API_KEY}` }
       });
       const userData = await response.json();
       console.log('Subscription:', userData.subscription);
     } catch (error) {
       console.error('Failed to check quota:', error);
     }
   };
   ```

2. **Implement Rate Limiting**
   ```javascript
   class RateLimiter {
     constructor(maxRequests = 100, windowMs = 60000) {
       this.maxRequests = maxRequests;
       this.windowMs = windowMs;
       this.requests = [];
     }
     
     canMakeRequest() {
       const now = Date.now();
       this.requests = this.requests.filter(time => now - time < this.windowMs);
       return this.requests.length < this.maxRequests;
     }
     
     recordRequest() {
       this.requests.push(Date.now());
     }
   }
   ```

3. **Upgrade Subscription**
   - Visit ElevenLabs dashboard
   - Upgrade to higher tier plan
   - Monitor usage patterns

#### **Issue**: "Agent not found" or "Invalid agent ID"

**Solutions:**

1. **Verify Agent Configuration**
   ```javascript
   const checkAgent = async (agentId) => {
     try {
       const response = await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}`, {
         headers: { 'Authorization': `Bearer ${API_KEY}` }
       });
       
       if (!response.ok) {
         console.error('Agent not found:', agentId);
         return false;
       }
       
       const agent = await response.json();
       console.log('Agent found:', agent.name);
       return true;
     } catch (error) {
       console.error('Failed to check agent:', error);
       return false;
     }
   };
   ```

2. **List Available Agents**
   ```javascript
   const listAgents = async () => {
     try {
       const response = await fetch('https://api.elevenlabs.io/v1/agents', {
         headers: { 'Authorization': `Bearer ${API_KEY}` }
       });
       const agents = await response.json();
       console.log('Available agents:', agents);
     } catch (error) {
       console.error('Failed to list agents:', error);
     }
   };
   ```

## 🌐 Browser Compatibility Issues

### Chrome Issues

#### **Issue**: "Web Audio API not working in Chrome"

**Solutions:**

1. **Check Chrome Version**
   - Minimum supported: Chrome 90+
   - Update to latest Chrome version
   - Enable experimental web features in `chrome://flags`

2. **Clear Chrome Data**
   ```bash
   # Clear specific site data
   # Go to chrome://settings/content/all
   # Find your site and clear data
   ```

3. **Disable Chrome Extensions**
   - Test in incognito mode
   - Disable ad blockers and privacy extensions
   - Check for audio-related extensions

### Safari Issues

#### **Issue**: "MediaRecorder not supported in Safari"

**Solutions:**

1. **Use Safari-Compatible Recording**
   ```javascript
   const createSafariCompatibleRecorder = (stream) => {
     if (!window.MediaRecorder || !MediaRecorder.isTypeSupported('audio/webm')) {
       // Fallback for Safari
       return new WebAudioRecorder(stream);
     }
     return new MediaRecorder(stream);
   };
   ```

2. **Check Safari Version**
   - Minimum supported: Safari 14+
   - Update to latest Safari version
   - Enable Develop menu features if needed

#### **Issue**: "Audio context suspended in Safari"

**Solutions:**

1. **Resume Audio Context on User Interaction**
   ```javascript
   const handleSafariAudio = () => {
     const audioContext = new (window.AudioContext || window.webkitAudioContext)();
     
     if (audioContext.state === 'suspended') {
       const resumeAudio = () => {
         audioContext.resume();
         document.removeEventListener('touchstart', resumeAudio);
         document.removeEventListener('click', resumeAudio);
       };
       
       document.addEventListener('touchstart', resumeAudio, { once: true });
       document.addEventListener('click', resumeAudio, { once: true });
     }
   };
   ```

### Firefox Issues

#### **Issue**: "getUserMedia restrictions in Firefox"

**Solutions:**

1. **Check Firefox Security Settings**
   - Go to `about:config`
   - Search for `media.navigator.enabled`
   - Ensure it's set to `true`

2. **Enable Firefox Audio Features**
   ```javascript
   // Check Firefox-specific features
   const isFirefox = navigator.userAgent.includes('Firefox');
   if (isFirefox) {
     // Use Firefox-compatible audio constraints
     const constraints = {
       audio: {
         mozNoiseSuppression: true,
         mozAutoGainControl: true
       }
     };
   }
   ```

## 📱 Mobile-Specific Issues

### iOS Issues

#### **Issue**: "Audio not working on iOS Safari"

**Solutions:**

1. **Handle iOS Audio Context**
   ```javascript
   const enableiOSAudio = () => {
     const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
     
     if (isIOS) {
       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
       
       if (audioContext.state === 'suspended') {
         const unlock = () => {
           audioContext.resume();
           document.body.removeEventListener('touchstart', unlock);
           document.body.removeEventListener('touchend', unlock);
         };
         
         document.body.addEventListener('touchstart', unlock, false);
         document.body.addEventListener('touchend', unlock, false);
       }
     }
   };
   ```

2. **iOS Audio Permissions**
   - iOS requires explicit user interaction for audio
   - Show clear audio enable instructions
   - Use touch events to trigger audio

#### **Issue**: "Touch events not working properly"

**Solutions:**

1. **Optimize Touch Handling**
   ```javascript
   const handleIOSTouch = (element) => {
     element.addEventListener('touchstart', (e) => {
       e.preventDefault();
       element.classList.add('touching');
     }, { passive: false });
     
     element.addEventListener('touchend', (e) => {
       e.preventDefault();
       element.classList.remove('touching');
     }, { passive: false });
   };
   ```

2. **Prevent iOS Touch Issues**
   ```css
   /* Prevent iOS touch issues */
   button {
     -webkit-tap-highlight-color: transparent;
     -webkit-touch-callout: none;
     -webkit-user-select: none;
     user-select: none;
   }
   ```

### Android Issues

#### **Issue**: "Audio latency on Android Chrome"

**Solutions:**

1. **Optimize Android Audio**
   ```javascript
   const optimizeAndroidAudio = () => {
     const isAndroid = /Android/.test(navigator.userAgent);
     
     if (isAndroid) {
       // Use smaller buffer sizes
       const audioContext = new AudioContext();
       const bufferSize = 1024; // Smaller buffer for lower latency
       
       // Enable low-latency mode
       if ('audioWorklet' in audioContext) {
         audioContext.audioWorklet.addModule('/low-latency-processor.js');
       }
     }
   };
   ```

2. **Handle Android Permissions**
   ```javascript
   const handleAndroidPermissions = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({
         audio: {
           sampleRate: 22050, // Lower sample rate for Android
           channelCount: 1,
           echoCancellation: true
         }
       });
       return stream;
     } catch (error) {
       console.error('Android audio permission failed:', error);
     }
   };
   ```

## ⚡ Performance Issues

### High CPU Usage

#### **Issue**: "Browser becomes slow or unresponsive"

**Solutions:**

1. **Optimize Animation Performance**
   ```javascript
   // Use requestAnimationFrame for animations
   const optimizeAnimations = () => {
     let animationId;
     
     const animate = () => {
       // Limit animation updates
       if (Date.now() % 2 === 0) {
         updateVisualizations();
       }
       
       animationId = requestAnimationFrame(animate);
     };
     
     return () => cancelAnimationFrame(animationId);
   };
   ```

2. **Reduce Audio Processing**
   ```javascript
   // Optimize audio analysis
   const optimizeAudioProcessing = (audioContext) => {
     const analyser = audioContext.createAnalyser();
     
     // Reduce FFT size for better performance
     analyser.fftSize = 1024; // Instead of 2048
     analyser.smoothingTimeConstant = 0.8;
     
     return analyser;
   };
   ```

3. **Implement Performance Monitoring**
   ```javascript
   const monitorPerformance = () => {
     const observer = new PerformanceObserver((list) => {
       for (const entry of list.getEntries()) {
         if (entry.duration > 16) { // > 16ms indicates dropped frame
           console.warn('Performance issue detected:', entry);
         }
       }
     });
     
     observer.observe({ entryTypes: ['measure'] });
   };
   ```

### Memory Leaks

#### **Issue**: "Memory usage keeps increasing"

**Solutions:**

1. **Clean Up Audio Resources**
   ```javascript
   const cleanupAudioResources = () => {
     // Stop all audio tracks
     if (audioStream) {
       audioStream.getTracks().forEach(track => track.stop());
     }
     
     // Close audio context
     if (audioContext) {
       audioContext.close();
     }
     
     // Remove event listeners
     document.removeEventListener('visibilitychange', handleVisibilityChange);
   };
   
   // Cleanup on page unload
   window.addEventListener('beforeunload', cleanupAudioResources);
   ```

2. **Use Memory-Efficient Patterns**
   ```javascript
   // Use weak references where possible
   const audioBuffers = new WeakMap();
   
   // Clear intervals and timeouts
   const intervals = [];
   const timeouts = [];
   
   const cleanup = () => {
     intervals.forEach(clearInterval);
     timeouts.forEach(clearTimeout);
   };
   ```

## 🔧 Installation and Setup Issues

### Development Server Issues

#### **Issue**: "Development server won't start"

**Solutions:**

1. **Check Node.js Version**
   ```bash
   node --version  # Should be 16.x or higher
   npm --version   # Should be 7.x or higher
   ```

2. **Clear Dependencies and Reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check for Port Conflicts**
   ```bash
   # Check what's using port 5173
   lsof -i :5173
   
   # Kill process if needed
   kill -9 <PID>
   ```

4. **Environment Variables**
   ```bash
   # Check if .env file exists and has correct variables
   cat .env
   
   # Required variables:
   # VITE_ELEVENLABS_API_KEY=your_key_here
   # VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```

### Build Issues

#### **Issue**: "Build fails with errors"

**Solutions:**

1. **TypeScript Errors**
   ```bash
   # Check for TypeScript errors
   npm run type-check
   
   # Fix common issues
   npm run lint:fix
   ```

2. **Missing Dependencies**
   ```bash
   # Check for missing peer dependencies
   npm ls
   
   # Install missing dependencies
   npm install missing-package
   ```

3. **Clear Build Cache**
   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite
   
   # Clear build directory
   rm -rf dist
   ```

## 🌐 Network and Connectivity Issues

### API Connection Issues

#### **Issue**: "Cannot connect to ElevenLabs API"

**Solutions:**

1. **Check Network Connectivity**
   ```javascript
   const testAPIConnectivity = async () => {
     try {
       const response = await fetch('https://api.elevenlabs.io/v1/user', {
         method: 'HEAD'
       });
       console.log('API reachable:', response.ok);
     } catch (error) {
       console.error('API unreachable:', error);
     }
   };
   ```

2. **Check Corporate Firewall**
   ```bash
   # Test from command line
   curl -I https://api.elevenlabs.io/v1/user
   
   # Check for proxy requirements
   echo $HTTP_PROXY
   echo $HTTPS_PROXY
   ```

3. **Configure Proxy Settings**
   ```javascript
   // If behind corporate proxy
   const proxyConfig = {
     proxy: {
       host: 'proxy.company.com',
       port: 8080,
       auth: {
         username: 'username',
         password: 'password'
       }
     }
   };
   ```

#### **Issue**: "Slow API responses" or "Timeouts"

**Solutions:**

1. **Increase Timeout Values**
   ```javascript
   const apiConfig = {
     timeout: 45000, // 45 seconds
     retries: 3,
     retryDelay: 2000
   };
   ```

2. **Implement Request Caching**
   ```javascript
   const cache = new Map();
   
   const cachedRequest = async (url, options) => {
     const cacheKey = `${url}-${JSON.stringify(options)}`;
     
     if (cache.has(cacheKey)) {
       return cache.get(cacheKey);
     }
     
     const response = await fetch(url, options);
     cache.set(cacheKey, response);
     
     return response;
   };
   ```

## ❌ Error Messages Reference

### Common Error Codes

#### API Errors
- **401 Unauthorized**: Invalid API key or expired session
- **403 Forbidden**: Insufficient permissions or blocked request
- **404 Not Found**: Agent ID not found or invalid endpoint
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: ElevenLabs server issue
- **502 Bad Gateway**: Network connectivity issue
- **503 Service Unavailable**: ElevenLabs service temporarily down

#### Browser Errors
- **NotAllowedError**: Microphone permission denied
- **NotFoundError**: No microphone device found
- **NotSupportedError**: Feature not supported in browser
- **SecurityError**: HTTPS required for microphone access
- **InvalidStateError**: Audio context in invalid state

#### Application Errors
- **Configuration Error**: Missing environment variables
- **Network Error**: Internet connectivity issues
- **Timeout Error**: Request took too long
- **Validation Error**: Invalid input parameters

### Error Handling Examples

```javascript
const handleError = (error) => {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Microphone access denied. Please allow microphone permissions.';
    
    case 'NotFoundError':
      return 'No microphone found. Please connect a microphone.';
    
    case 'NotSupportedError':
      return 'Your browser does not support this feature. Please update your browser.';
    
    case 'SecurityError':
      return 'HTTPS is required for voice features. Please access the site securely.';
    
    case 'NetworkError':
      return 'Network connection failed. Please check your internet connection.';
    
    default:
      return `An unexpected error occurred: ${error.message}`;
  }
};
```

## 🔬 Advanced Diagnostics

### Comprehensive System Check

```javascript
const runComprehensiveDiagnostics = async () => {
  const report = {
    timestamp: new Date().toISOString(),
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    },
    screen: {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.angle || 'unknown'
    },
    features: {
      webAudio: checkWebAudioSupport(),
      mediaDevices: checkMediaDevicesSupport(),
      serviceWorker: 'serviceWorker' in navigator,
      webRTC: 'RTCPeerConnection' in window
    },
    performance: {
      memory: (performance as any).memory || 'unavailable',
      timing: performance.timing || 'unavailable'
    },
    network: (navigator as any).connection || 'unavailable',
    environment: {
      protocol: location.protocol,
      hostname: location.hostname,
      port: location.port
    }
  };
  
  console.log('Comprehensive Diagnostics Report:', report);
  return report;
};

const checkWebAudioSupport = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const support = {
      available: true,
      sampleRate: context.sampleRate,
      state: context.state,
      maxChannels: context.destination.maxChannelCount
    };
    context.close();
    return support;
  } catch (error) {
    return { available: false, error: error.message };
  }
};

const checkMediaDevicesSupport = async () => {
  try {
    if (!navigator.mediaDevices) {
      return { available: false, reason: 'MediaDevices not supported' };
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    
    return {
      available: true,
      deviceCount: devices.length,
      audioInputs: audioInputs.length,
      supportsGetUserMedia: !!navigator.mediaDevices.getUserMedia
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
};
```

### Performance Profiling

```javascript
const profilePerformance = () => {
  const startTime = performance.now();
  let frameCount = 0;
  let totalFrameTime = 0;
  
  const measureFrame = () => {
    const frameStart = performance.now();
    
    // Simulate frame work
    requestAnimationFrame(() => {
      const frameEnd = performance.now();
      const frameTime = frameEnd - frameStart;
      
      frameCount++;
      totalFrameTime += frameTime;
      
      if (frameCount % 60 === 0) {
        const avgFrameTime = totalFrameTime / frameCount;
        const fps = 1000 / avgFrameTime;
        
        console.log(`Performance: ${fps.toFixed(1)} FPS, ${avgFrameTime.toFixed(2)}ms avg frame time`);
        
        if (fps < 30) {
          console.warn('Low FPS detected - consider reducing visual complexity');
        }
      }
      
      measureFrame();
    });
  };
  
  measureFrame();
};
```

## 🆘 Getting Additional Help

### Before Seeking Help

1. **Gather Information**
   ```javascript
   // Run this to get system info for support
   const supportInfo = {
     diagnostics: await runSystemDiagnostics(),
     userAgent: navigator.userAgent,
     url: window.location.href,
     timestamp: new Date().toISOString(),
     error: 'Describe your specific error here'
   };
   
   console.log('Support Information:', JSON.stringify(supportInfo, null, 2));
   ```

2. **Document Steps to Reproduce**
   - What were you trying to do?
   - What did you expect to happen?
   - What actually happened?
   - Can you reproduce the issue consistently?

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for error messages in Console tab
   - Check Network tab for failed requests
   - Note any red error messages

### Support Channels

1. **GitHub Issues** (Primary Support)
   - Create a new issue: [GitHub Issues](https://github.com/yourusername/elevenlabs-voice-agent/issues)
   - Use appropriate issue templates
   - Include system diagnostics output
   - Provide steps to reproduce

2. **Community Discussion**
   - GitHub Discussions for general questions
   - Stack Overflow with tag `elevenlabs-voice-agent`
   - Reddit communities for voice AI

3. **Professional Support**
   - Enterprise support for business customers
   - Priority support for subscribers
   - Custom implementation assistance

### Creating Effective Bug Reports

```markdown
**Bug Report Template:**

## Issue Description
Brief description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. Observe...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## System Information
```javascript
// Paste output from runSystemDiagnostics() here
```

## Additional Context
- Screenshots or recordings
- Error messages from console
- Any workarounds found
```

---

**Last Updated**: January 8, 2025
**Next Review**: April 8, 2025

This troubleshooting guide is regularly updated based on user feedback and common issues. If you can't find a solution here, please create an issue or reach out through our support channels. 🔧✨