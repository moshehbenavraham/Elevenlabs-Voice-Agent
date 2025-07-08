# Voice Features Guide

This comprehensive guide covers all voice-related features and capabilities of the ElevenLabs Voice Agent.

## 🎤 Overview

The ElevenLabs Voice Agent provides a sophisticated voice interaction system with real-time audio processing, visualization, and AI-powered conversations. This document covers all voice features, implementation details, and usage guidelines.

## 📋 Table of Contents

- [Voice Features Overview](#voice-features-overview)
- [Voice Orb Interface](#voice-orb-interface)
- [Audio Processing](#audio-processing)
- [Voice Recognition](#voice-recognition)
- [Audio Visualization](#audio-visualization)
- [Voice Animations](#voice-animations)
- [Mobile Voice Features](#mobile-voice-features)
- [Voice Accessibility](#voice-accessibility)
- [Configuration Options](#configuration-options)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## 🎯 Voice Features Overview

### Core Capabilities
- **Real-time Voice Conversation**: Seamless voice interactions with AI
- **Audio Recording**: High-quality audio capture from microphone
- **Voice Playback**: Clear audio playback with volume control
- **Visual Feedback**: Dynamic animations and visual indicators
- **Audio Visualization**: Real-time frequency analysis and display
- **Cross-platform Support**: Works on desktop and mobile browsers
- **Accessibility**: Screen reader support and keyboard alternatives

### Technical Foundation
- **Web Audio API**: Native browser audio processing
- **MediaRecorder API**: Audio recording capabilities
- **ElevenLabs SDK**: AI conversation processing
- **Real-time Processing**: Low-latency audio handling
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge support

## 🔮 Voice Orb Interface

### Visual States
The Voice Orb provides visual feedback for different states:

#### Idle State
```typescript
const IdleOrb = () => (
  <div className="voice-orb idle">
    <div className="orb-core" />
    <div className="orb-ring" />
    <div className="pulse-animation" />
  </div>
);
```

#### Listening State
```typescript
const ListeningOrb = () => (
  <div className="voice-orb listening">
    <div className="orb-core listening" />
    <div className="orb-ring listening" />
    <div className="audio-waves">
      {audioLevels.map((level, index) => (
        <div key={index} className="wave" style={{ height: level }} />
      ))}
    </div>
  </div>
);
```

#### Speaking State
```typescript
const SpeakingOrb = () => (
  <div className="voice-orb speaking">
    <div className="orb-core speaking" />
    <div className="orb-ring speaking" />
    <div className="voice-particles">
      {particles.map((particle, index) => (
        <div key={index} className="particle" style={particle.style} />
      ))}
    </div>
  </div>
);
```

### Interactive Controls
```typescript
const VoiceControls = () => {
  const { isRecording, startRecording, stopRecording } = useVoiceRecording();
  
  return (
    <div className="voice-controls">
      <button
        className="voice-button"
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        aria-label="Hold to speak"
      >
        {isRecording ? <MicIcon /> : <MicOffIcon />}
      </button>
      
      <div className="voice-status">
        {isRecording ? 'Listening...' : 'Hold to speak'}
      </div>
    </div>
  );
};
```

## 🎵 Audio Processing

### Audio Input Configuration
```typescript
interface AudioInputConfig {
  sampleRate: number;
  channels: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

const defaultConfig: AudioInputConfig = {
  sampleRate: 44100,
  channels: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
};

const setupAudioInput = async (config: AudioInputConfig) => {
  const constraints: MediaStreamConstraints = {
    audio: {
      sampleRate: config.sampleRate,
      channelCount: config.channels,
      echoCancellation: config.echoCancellation,
      noiseSuppression: config.noiseSuppression,
      autoGainControl: config.autoGainControl
    }
  };
  
  return await navigator.mediaDevices.getUserMedia(constraints);
};
```

### Audio Processing Pipeline
```typescript
class AudioProcessor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private source: MediaStreamAudioSourceNode;
  
  constructor(stream: MediaStream) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.source = this.audioContext.createMediaStreamSource(stream);
    
    // Configure analyser
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    // Connect nodes
    this.source.connect(this.analyser);
    
    // Initialize data array
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }
  
  getFrequencyData(): Uint8Array {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
  
  getVolumeLevel(): number {
    const data = this.getFrequencyData();
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length / 255;
  }
  
  dispose(): void {
    this.source.disconnect();
    this.audioContext.close();
  }
}
```

### Audio Recording
```typescript
const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioData(audioBlob);
        chunksRef.current = [];
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  return { isRecording, audioData, startRecording, stopRecording };
};
```

## 🗣️ Voice Recognition

### Speech Recognition Setup
```typescript
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, []);
  
  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };
  
  return { isListening, transcript, startListening, stopListening };
};
```

### Voice Command Processing
```typescript
interface VoiceCommand {
  pattern: RegExp;
  action: (matches: string[]) => void;
  description: string;
}

const voiceCommands: VoiceCommand[] = [
  {
    pattern: /^(start|begin) conversation$/i,
    action: () => startConversation(),
    description: 'Start a new conversation'
  },
  {
    pattern: /^(stop|end) conversation$/i,
    action: () => endConversation(),
    description: 'End the current conversation'
  },
  {
    pattern: /^volume (\d+)$/i,
    action: ([, volume]) => setVolume(parseInt(volume) / 100),
    description: 'Set volume (0-100)'
  },
  {
    pattern: /^switch to (light|dark) theme$/i,
    action: ([, theme]) => setTheme(theme),
    description: 'Switch theme'
  }
];

const processVoiceCommand = (transcript: string) => {
  for (const command of voiceCommands) {
    const matches = transcript.match(command.pattern);
    if (matches) {
      command.action(matches);
      return true;
    }
  }
  return false;
};
```

## 📊 Audio Visualization

### Frequency Visualization
```typescript
const AudioVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { audioProcessor } = useAudioProcessor();
  
  const draw = useCallback(() => {
    if (!canvasRef.current || !audioProcessor) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const frequencyData = audioProcessor.getFrequencyData();
    
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / frequencyData.length;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw frequency bars
    frequencyData.forEach((frequency, index) => {
      const barHeight = (frequency / 255) * height;
      const x = index * barWidth;
      const y = height - barHeight;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1e40af');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
    
    animationRef.current = requestAnimationFrame(draw);
  }, [audioProcessor]);
  
  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);
  
  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="audio-visualizer"
      aria-label="Audio frequency visualization"
    />
  );
};
```

### Waveform Visualization
```typescript
const WaveformVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { audioProcessor } = useAudioProcessor();
  
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !audioProcessor) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const timeData = audioProcessor.getTimeData();
    
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    timeData.forEach((amplitude, index) => {
      const x = (index / timeData.length) * width;
      const y = centerY + (amplitude - 128) * (height / 256);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    requestAnimationFrame(drawWaveform);
  }, [audioProcessor]);
  
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);
  
  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="waveform-visualizer"
      aria-label="Audio waveform visualization"
    />
  );
};
```

## 🎨 Voice Animations

### Orb Animation System
```typescript
const useVoiceAnimations = () => {
  const [animationState, setAnimationState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const createParticle = useCallback((x: number, y: number) => {
    return {
      id: Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      decay: 0.02,
      size: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`
    };
  }, []);
  
  const updateParticles = useCallback(() => {
    setParticles(prev => prev
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - particle.decay
      }))
      .filter(particle => particle.life > 0)
    );
  }, []);
  
  const startListeningAnimation = useCallback(() => {
    setAnimationState('listening');
    setPulseIntensity(0.5);
  }, []);
  
  const startSpeakingAnimation = useCallback(() => {
    setAnimationState('speaking');
    setPulseIntensity(1);
    
    // Create speech particles
    const newParticles = Array.from({ length: 20 }, (_, i) => 
      createParticle(
        Math.cos(i * 0.314) * 50,
        Math.sin(i * 0.314) * 50
      )
    );
    setParticles(prev => [...prev, ...newParticles]);
  }, [createParticle]);
  
  const stopAnimation = useCallback(() => {
    setAnimationState('idle');
    setPulseIntensity(0);
  }, []);
  
  useEffect(() => {
    if (animationState === 'speaking') {
      const interval = setInterval(updateParticles, 16);
      return () => clearInterval(interval);
    }
  }, [animationState, updateParticles]);
  
  return {
    animationState,
    pulseIntensity,
    particles,
    startListeningAnimation,
    startSpeakingAnimation,
    stopAnimation
  };
};
```

### CSS Animations
```css
.voice-orb {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.voice-orb.idle {
  background: radial-gradient(circle, #3b82f6 0%, #1e40af 100%);
  animation: idle-pulse 2s ease-in-out infinite;
}

.voice-orb.listening {
  background: radial-gradient(circle, #10b981 0%, #047857 100%);
  animation: listening-pulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 50px rgba(16, 185, 129, 0.5);
}

.voice-orb.speaking {
  background: radial-gradient(circle, #f59e0b 0%, #d97706 100%);
  animation: speaking-pulse 0.5s ease-in-out infinite;
  box-shadow: 0 0 70px rgba(245, 158, 11, 0.7);
}

@keyframes idle-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes listening-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes speaking-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.audio-waves {
  position: absolute;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.wave {
  width: 4px;
  background: rgba(255, 255, 255, 0.8);
  margin: 0 1px;
  border-radius: 2px;
  animation: wave-animation 0.5s ease-in-out infinite;
}

@keyframes wave-animation {
  0%, 100% { height: 20px; }
  50% { height: 60px; }
}
```

## 📱 Mobile Voice Features

### Touch-Optimized Interface
```typescript
const MobileVoiceInterface = () => {
  const [isPressed, setIsPressed] = useState(false);
  const { startRecording, stopRecording } = useVoiceRecording();
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(true);
    startRecording();
  }, [startRecording]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    stopRecording();
  }, [stopRecording]);
  
  return (
    <div className="mobile-voice-interface">
      <button
        className={`mobile-voice-button ${isPressed ? 'pressed' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Hold to speak"
      >
        <MicrophoneIcon size={32} />
      </button>
      
      <p className="mobile-voice-hint">
        Hold the button to speak
      </p>
    </div>
  );
};
```

### Mobile-Specific Optimizations
```typescript
const useMobileVoiceOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Mobile-specific audio configuration
  const mobileAudioConfig = useMemo(() => ({
    sampleRate: isMobile ? 22050 : 44100, // Lower sample rate for mobile
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    bufferSize: isMobile ? 1024 : 2048 // Smaller buffer for mobile
  }), [isMobile]);
  
  return { isMobile, mobileAudioConfig };
};
```

## ♿ Voice Accessibility

### Screen Reader Support
```typescript
const AccessibleVoiceInterface = () => {
  const [status, setStatus] = useState('Ready to listen');
  const [isRecording, setIsRecording] = useState(false);
  
  const announceStatus = useCallback((message: string) => {
    setStatus(message);
    
    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, []);
  
  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    announceStatus('Recording started. Speak now.');
  }, [announceStatus]);
  
  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    announceStatus('Recording stopped. Processing your message.');
  }, [announceStatus]);
  
  return (
    <div className="accessible-voice-interface">
      <div 
        className="voice-status"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {status}
      </div>
      
      <button
        className="voice-button"
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        aria-pressed={isRecording}
      >
        {isRecording ? <StopIcon /> : <MicrophoneIcon />}
      </button>
      
      <div className="keyboard-shortcuts">
        <p>Keyboard shortcuts:</p>
        <ul>
          <li>Space: Start/stop recording</li>
          <li>Enter: Send message</li>
          <li>Escape: Cancel recording</li>
        </ul>
      </div>
    </div>
  );
};
```

### Keyboard Navigation
```typescript
const useKeyboardVoiceControls = () => {
  const { isRecording, startRecording, stopRecording } = useVoiceRecording();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (!isRecording) {
            startRecording();
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (isRecording) {
            stopRecording();
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (isRecording) {
            stopRecording();
          }
          break;
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && isRecording) {
        event.preventDefault();
        stopRecording();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, startRecording, stopRecording]);
};
```

## ⚙️ Configuration Options

### Voice Settings
```typescript
interface VoiceSettings {
  // Audio Settings
  sampleRate: number;
  bitRate: number;
  channels: number;
  
  // Processing Settings
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  
  // ElevenLabs Settings
  voiceId: string;
  model: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  
  // UI Settings
  showVisualizer: boolean;
  showWaveform: boolean;
  animationIntensity: number;
  theme: 'light' | 'dark' | 'auto';
  
  // Accessibility Settings
  screenReaderSupport: boolean;
  keyboardShortcuts: boolean;
  visualAlternatives: boolean;
}

const defaultVoiceSettings: VoiceSettings = {
  sampleRate: 44100,
  bitRate: 128000,
  channels: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceId: 'default',
  model: 'eleven_monolingual_v1',
  stability: 0.5,
  similarityBoost: 0.8,
  style: 0.0,
  useSpeakerBoost: true,
  showVisualizer: true,
  showWaveform: false,
  animationIntensity: 0.8,
  theme: 'auto',
  screenReaderSupport: true,
  keyboardShortcuts: true,
  visualAlternatives: true
};
```

### Settings Panel
```typescript
const VoiceSettingsPanel = () => {
  const [settings, setSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  
  const updateSetting = useCallback(<K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  return (
    <div className="voice-settings-panel">
      <h3>Voice Settings</h3>
      
      <div className="settings-section">
        <h4>Audio Quality</h4>
        <label>
          Sample Rate:
          <select 
            value={settings.sampleRate}
            onChange={(e) => updateSetting('sampleRate', Number(e.target.value))}
          >
            <option value={22050}>22.05 kHz</option>
            <option value={44100}>44.1 kHz</option>
            <option value={48000}>48 kHz</option>
          </select>
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.echoCancellation}
            onChange={(e) => updateSetting('echoCancellation', e.target.checked)}
          />
          Echo Cancellation
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.noiseSuppression}
            onChange={(e) => updateSetting('noiseSuppression', e.target.checked)}
          />
          Noise Suppression
        </label>
      </div>
      
      <div className="settings-section">
        <h4>Voice AI</h4>
        <label>
          Stability:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.stability}
            onChange={(e) => updateSetting('stability', Number(e.target.value))}
          />
          <span>{settings.stability}</span>
        </label>
        
        <label>
          Similarity Boost:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.similarityBoost}
            onChange={(e) => updateSetting('similarityBoost', Number(e.target.value))}
          />
          <span>{settings.similarityBoost}</span>
        </label>
      </div>
      
      <div className="settings-section">
        <h4>Visualization</h4>
        <label>
          <input
            type="checkbox"
            checked={settings.showVisualizer}
            onChange={(e) => updateSetting('showVisualizer', e.target.checked)}
          />
          Show Audio Visualizer
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.showWaveform}
            onChange={(e) => updateSetting('showWaveform', e.target.checked)}
          />
          Show Waveform
        </label>
        
        <label>
          Animation Intensity:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.animationIntensity}
            onChange={(e) => updateSetting('animationIntensity', Number(e.target.value))}
          />
          <span>{Math.round(settings.animationIntensity * 100)}%</span>
        </label>
      </div>
    </div>
  );
};
```

## 🚀 Advanced Features

### Voice Commands
```typescript
const VoiceCommandProcessor = () => {
  const commands = useMemo(() => [
    {
      pattern: /^play music$/i,
      handler: () => playMusic(),
      description: 'Play music'
    },
    {
      pattern: /^what time is it$/i,
      handler: () => speakTime(),
      description: 'Get current time'
    },
    {
      pattern: /^change theme to (light|dark)$/i,
      handler: (matches: string[]) => setTheme(matches[1]),
      description: 'Change theme'
    }
  ], []);
  
  const processCommand = useCallback((transcript: string) => {
    for (const command of commands) {
      const matches = transcript.match(command.pattern);
      if (matches) {
        command.handler(matches);
        return true;
      }
    }
    return false;
  }, [commands]);
  
  return { processCommand, commands };
};
```

### Voice Shortcuts
```typescript
const VoiceShortcuts = () => {
  const shortcuts = [
    { key: 'Space', action: 'Hold to speak', description: 'Start/stop recording' },
    { key: 'Enter', action: 'Send message', description: 'Send recorded message' },
    { key: 'Escape', action: 'Cancel', description: 'Cancel current recording' },
    { key: 'V', action: 'Toggle visualizer', description: 'Show/hide audio visualizer' },
    { key: 'M', action: 'Mute/unmute', description: 'Toggle audio mute' }
  ];
  
  return (
    <div className="voice-shortcuts">
      <h4>Voice Shortcuts</h4>
      <ul>
        {shortcuts.map(shortcut => (
          <li key={shortcut.key}>
            <kbd>{shortcut.key}</kbd>
            <span>{shortcut.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## 🔧 Troubleshooting

### Common Issues

#### Microphone Not Working
```typescript
const diagnoseMicrophoneIssues = async () => {
  const diagnosis = {
    hasMediaDevices: !!navigator.mediaDevices,
    hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
    permissions: 'unknown',
    devices: []
  };
  
  try {
    // Check permissions
    const permission = await navigator.permissions.query({ name: 'microphone' as any });
    diagnosis.permissions = permission.state;
    
    // Check available devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    diagnosis.devices = devices.filter(device => device.kind === 'audioinput');
    
    // Test microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    
    console.log('Microphone diagnosis:', diagnosis);
  } catch (error) {
    console.error('Microphone diagnosis failed:', error);
  }
  
  return diagnosis;
};
```

#### Audio Quality Issues
```typescript
const optimizeAudioQuality = () => {
  const constraints = {
    audio: {
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      googEchoCancellation: true,
      googNoiseSuppression: true,
      googAutoGainControl: true,
      googHighpassFilter: true,
      googTypingNoiseDetection: true
    }
  };
  
  return navigator.mediaDevices.getUserMedia(constraints);
};
```

### Performance Optimization
```typescript
const optimizeVoicePerformance = () => {
  // Reduce visualization frequency on mobile
  const isMobile = window.innerWidth < 768;
  const visualizationRate = isMobile ? 30 : 60; // FPS
  
  // Optimize audio buffer sizes
  const bufferSize = isMobile ? 1024 : 2048;
  
  // Reduce particle count on mobile
  const particleCount = isMobile ? 10 : 50;
  
  return { visualizationRate, bufferSize, particleCount };
};
```

## 📞 Support

For voice-related issues:
- Check browser compatibility requirements
- Verify microphone permissions
- Test with different audio devices
- Review network connection for ElevenLabs API
- Consult the [troubleshooting guide](TROUBLESHOOTING.md)

---

**Last Updated**: January 8, 2025
**Next Review**: April 8, 2025

This guide covers all voice features and capabilities. For additional support, refer to the [main documentation](../README.md) or create an issue in the repository. 🎤✨