# ElevenLabs API Integration

This guide covers the integration of ElevenLabs API with the Voice Agent application.

## 🎯 Overview

The ElevenLabs Voice Agent uses the ElevenLabs Conversational AI API to provide real-time voice interactions. This document provides comprehensive guidance on integration, configuration, and best practices.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Setup](#api-setup)
- [SDK Configuration](#sdk-configuration)
- [Authentication](#authentication)
- [Conversation Management](#conversation-management)
- [Audio Processing](#audio-processing)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Testing](#testing)
- [Production Considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### 1. Get API Access
1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Navigate to your dashboard
3. Create a new Conversational AI agent
4. Copy your API key and Agent ID

### 2. Environment Setup
```bash
# Create .env file
VITE_ELEVENLABS_API_KEY=your_api_key_here
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### 3. Basic Integration
```typescript
import { useConversation } from '@11labs/react';

const MyComponent = () => {
  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs'),
    onDisconnect: () => console.log('Disconnected from ElevenLabs'),
    onMessage: (message) => console.log('Message received:', message),
    onError: (error) => console.error('ElevenLabs error:', error),
  });

  const startConversation = async () => {
    await conversation.startSession({
      agentId: process.env.VITE_ELEVENLABS_AGENT_ID
    });
  };
};
```

## 🔧 API Setup

### Account Requirements
- **ElevenLabs Account**: Active subscription
- **API Key**: Generated from dashboard
- **Agent Configuration**: Properly configured conversational agent
- **Quota**: Sufficient API quota for expected usage

### Subscription Tiers
- **Free Tier**: 10,000 characters/month
- **Starter**: 30,000 characters/month
- **Creator**: 100,000 characters/month
- **Pro**: 500,000 characters/month
- **Enterprise**: Custom limits

### API Endpoints
```typescript
const API_ENDPOINTS = {
  BASE_URL: 'https://api.elevenlabs.io/v1',
  CONVERSATION_START: '/conversation/start',
  CONVERSATION_MESSAGE: '/conversation/message',
  CONVERSATION_END: '/conversation/end',
  USER_INFO: '/user',
  VOICES: '/voices',
  MODELS: '/models'
};
```

## ⚙️ SDK Configuration

### Installation
```bash
npm install @11labs/react
```

### Basic React SDK Setup
```typescript
import { useConversation } from '@11labs/react';

const VoiceComponent = () => {
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      console.log('Message received:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    },
  });

  return (
    <div>
      <button onClick={() => conversation.startSession({ agentId: 'your-agent-id' })}>
        Start Conversation
      </button>
      <button onClick={() => conversation.endSession()}>
        End Conversation
      </button>
    </div>
  );
};
```

### Advanced Hook Configuration
```typescript
import { useConversation } from '@11labs/react';
import { useState, useCallback } from 'react';

const useElevenLabsConversation = () => {
  const [state, setState] = useState({
    isConnected: false,
    isLoading: false,
    isSpeaking: false,
    error: null,
    conversationId: null,
  });

  const conversation = useConversation({
    onConnect: () => {
      setState(prev => ({ ...prev, isConnected: true, isLoading: false, error: null }));
    },
    onDisconnect: () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        conversationId: null
      }));
    },
    onMessage: (message) => {
      // Handle incoming messages
      console.log('Message received:', message);
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        error: 'Connection error occurred',
        isLoading: false
      }));
    },
  });

  const startConversation = useCallback(async (agentId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const conversationId = await conversation.startSession({ agentId });
      setState(prev => ({ ...prev, conversationId, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start conversation',
        isLoading: false
      }));
    }
  }, [conversation]);

  return {
    ...state,
    startConversation,
    endConversation: conversation.endSession,
    setVolume: conversation.setVolume,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
  };
};
```

## 🔐 Authentication

### API Key Management
```typescript
// Environment-based configuration
const getApiKey = (): string => {
  const apiKey = process.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }
  return apiKey;
};

// Validate API key format
const validateApiKey = (apiKey: string): boolean => {
  return /^sk-[a-zA-Z0-9]{32,}$/.test(apiKey);
};
```

### Authentication Headers
```typescript
const authenticatedRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const apiKey = getApiKey();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
};
```

### Session Validation
```typescript
const validateSession = async (conversation: any): Promise<boolean> => {
  try {
    // The React SDK handles session validation internally
    // Check connection status through the conversation object
    return conversation.status === 'connected';
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
};
```

## 💬 Conversation Management

### Starting a Conversation with React SDK
```typescript
import { useConversation } from '@11labs/react';

interface ConversationConfig {
  agentId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
}

const VoiceChat = ({ agentId }: { agentId: string }) => {
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      // Handle incoming messages - typically audio responses
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    },
  });

  const startConversation = async () => {
    try {
      await conversation.startSession({ agentId });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  return (
    <div>
      <button onClick={startConversation}>Start Conversation</button>
      <button onClick={endConversation}>End Conversation</button>
      <p>Status: {conversation.status}</p>
      <p>Speaking: {conversation.isSpeaking ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

### Real-time Message Handling
```typescript
const useMessageHandler = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const conversation = useConversation({
    onMessage: (message) => {
      // ElevenLabs React SDK provides message with source and content
      if (message.message && message.source) {
        const role = message.source === 'user' ? 'user' : 'assistant';
        setMessages(prev => [...prev, { role, content: message.message }]);
      }
    },
    onError: (error) => {
      console.error('Message handling error:', error);
    },
  });

  return { messages, conversation };
};
```

### Advanced Conversation State Management
```typescript
import { useConversation } from '@11labs/react';
import { useState, useCallback, useEffect } from 'react';

interface ConversationState {
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  error: string | null;
  conversationId: string | null;
}

const useElevenLabsConversation = () => {
  const [state, setState] = useState<ConversationState>({
    isConnected: false,
    isLoading: false,
    isSpeaking: false,
    error: null,
    conversationId: null,
  });

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const conversation = useConversation({
    onConnect: () => {
      setState(prev => ({ ...prev, isConnected: true, isLoading: false, error: null }));
    },
    onDisconnect: () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        conversationId: null
      }));
    },
    onMessage: (message) => {
      if (message.message && message.source) {
        const role = message.source === 'user' ? 'user' : 'assistant';
        setMessages(prev => [...prev, { role, content: message.message }]);
      }
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        error: 'Connection error occurred',
        isLoading: false
      }));
    },
  });

  // Track speaking state
  useEffect(() => {
    setState(prev => ({ ...prev, isSpeaking: conversation.isSpeaking }));
  }, [conversation.isSpeaking]);

  const startConversation = useCallback(async (agentId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const conversationId = await conversation.startSession({ agentId });
      setState(prev => ({ ...prev, conversationId, isLoading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start conversation',
        isLoading: false
      }));
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setMessages([]);
    } catch (error: any) {
      console.error('Failed to end conversation:', error);
    }
  }, [conversation]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
    } catch (error: any) {
      console.error('Failed to set volume:', error);
    }
  }, [conversation]);

  return {
    ...state,
    messages,
    startConversation,
    endConversation,
    setVolume,
    status: conversation.status,
  };
};
```

## 🎵 Audio Processing

### Audio Input Configuration
```typescript
interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  format: 'wav' | 'mp3' | 'webm';
}

const defaultAudioConfig: AudioConfig = {
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16,
  format: 'wav'
};

const configureAudioInput = (config: AudioConfig = defaultAudioConfig) => {
  const constraints: MediaStreamConstraints = {
    audio: {
      sampleRate: config.sampleRate,
      channelCount: config.channels,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };
  
  return navigator.mediaDevices.getUserMedia(constraints);
};
```

### Audio Recording
```typescript
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  async startRecording(stream: MediaStream): Promise<void> {
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.start(100); // Collect data every 100ms
  }
  
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: 'audio/webm;codecs=opus' 
        });
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
}
```

### Audio Playback
```typescript
class AudioPlayer {
  private audioElement: HTMLAudioElement;
  private audioContext: AudioContext;
  private gainNode: GainNode;
  
  constructor() {
    this.audioElement = new Audio();
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    
    // Connect audio graph
    const source = this.audioContext.createMediaElementSource(this.audioElement);
    source.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }
  
  async playAudio(audioData: Blob): Promise<void> {
    const audioUrl = URL.createObjectURL(audioData);
    this.audioElement.src = audioUrl;
    
    return new Promise((resolve, reject) => {
      this.audioElement.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      this.audioElement.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      this.audioElement.play();
    });
  }
  
  setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }
}
```

## 🚫 Error Handling

### Error Types
```typescript
interface ElevenLabsError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}

const ErrorCodes = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  CONVERSATION_ENDED: 'CONVERSATION_ENDED',
  AUDIO_PROCESSING_ERROR: 'AUDIO_PROCESSING_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};
```

### Error Handling Strategies
```typescript
const handleApiError = (error: any): ElevenLabsError => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return {
          code: ErrorCodes.INVALID_API_KEY,
          message: 'Invalid API key',
          retryable: false
        };
      case 429:
        return {
          code: ErrorCodes.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded',
          retryable: true,
          details: data.retry_after
        };
      case 402:
        return {
          code: ErrorCodes.QUOTA_EXCEEDED,
          message: 'API quota exceeded',
          retryable: false
        };
      default:
        return {
          code: 'API_ERROR',
          message: data.message || 'Unknown API error',
          retryable: status >= 500
        };
    }
  }
  
  return {
    code: ErrorCodes.NETWORK_ERROR,
    message: 'Network connection error',
    retryable: true
  };
};
```

### Retry Logic
```typescript
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      const elevenLabsError = handleApiError(error);
      
      if (!elevenLabsError.retryable || attempt === maxRetries) {
        throw elevenLabsError;
      }
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError!;
};
```

## ⏱️ Rate Limiting

### Rate Limit Configuration
```typescript
interface RateLimitConfig {
  requests: number;
  windowMs: number;
  retryAfter?: number;
}

const rateLimits: Record<string, RateLimitConfig> = {
  conversation: {
    requests: 100,
    windowMs: 60000, // 1 minute
    retryAfter: 1000
  },
  message: {
    requests: 1000,
    windowMs: 60000,
    retryAfter: 500
  }
};
```

### Rate Limiter Implementation
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const requestTimes = this.requests.get(key) || [];
    const recentRequests = requestTimes.filter(time => time > windowStart);
    
    this.requests.set(key, recentRequests);
    
    return recentRequests.length < config.requests;
  }
  
  recordRequest(key: string): void {
    const requestTimes = this.requests.get(key) || [];
    requestTimes.push(Date.now());
    this.requests.set(key, requestTimes);
  }
  
  getRetryAfter(key: string, config: RateLimitConfig): number {
    const requestTimes = this.requests.get(key) || [];
    if (requestTimes.length === 0) return 0;
    
    const oldestRequest = Math.min(...requestTimes);
    const windowEnd = oldestRequest + config.windowMs;
    
    return Math.max(0, windowEnd - Date.now());
  }
}
```

## 🧪 Testing

### Unit Testing React SDK
```typescript
import { renderHook, act } from '@testing-library/react';
import { useConversation } from '@11labs/react';

// Mock the ElevenLabs React SDK
jest.mock('@11labs/react', () => ({
  useConversation: jest.fn(),
}));

describe('ElevenLabs React SDK Integration', () => {
  const mockUseConversation = useConversation as jest.MockedFunction<typeof useConversation>;
  
  beforeEach(() => {
    mockUseConversation.mockReturnValue({
      startSession: jest.fn(),
      endSession: jest.fn(),
      setVolume: jest.fn(),
      status: 'disconnected',
      isSpeaking: false,
    });
  });
  
  it('should initialize conversation hook', () => {
    const { result } = renderHook(() => useConversation({
      onConnect: jest.fn(),
      onDisconnect: jest.fn(),
      onMessage: jest.fn(),
      onError: jest.fn(),
    }));
    
    expect(result.current).toBeDefined();
    expect(result.current.startSession).toBeDefined();
    expect(result.current.endSession).toBeDefined();
  });
  
  it('should handle conversation start', async () => {
    const mockStartSession = jest.fn().mockResolvedValue('conversation-id');
    mockUseConversation.mockReturnValue({
      startSession: mockStartSession,
      endSession: jest.fn(),
      setVolume: jest.fn(),
      status: 'connected',
      isSpeaking: false,
    });
    
    const { result } = renderHook(() => useConversation({
      onConnect: jest.fn(),
      onDisconnect: jest.fn(),
      onMessage: jest.fn(),
      onError: jest.fn(),
    }));
    
    await act(async () => {
      await result.current.startSession({ agentId: 'test-agent' });
    });
    
    expect(mockStartSession).toHaveBeenCalledWith({ agentId: 'test-agent' });
  });
});
```

### Integration Testing with React SDK
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useConversation } from '@11labs/react';

// Test component using the hook
const TestVoiceComponent = ({ agentId }: { agentId: string }) => {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  return (
    <div>
      <button onClick={() => conversation.startSession({ agentId })}>
        Start
      </button>
      <button onClick={() => conversation.endSession()}>
        End
      </button>
      <div data-testid="status">{conversation.status}</div>
      <div data-testid="speaking">{conversation.isSpeaking.toString()}</div>
    </div>
  );
};

describe('Voice Component Integration', () => {
  const testAgentId = 'test-agent-id';
  
  it('should render and handle conversation controls', async () => {
    render(<TestVoiceComponent agentId={testAgentId} />);
    
    const startButton = screen.getByText('Start');
    const endButton = screen.getByText('End');
    
    expect(startButton).toBeInTheDocument();
    expect(endButton).toBeInTheDocument();
    
    // Test conversation start
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('connected');
    });
    
    // Test conversation end
    fireEvent.click(endButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    });
  });
});
```

## 🏭 Production Considerations

### Environment Configuration for React SDK
```typescript
// Production environment setup for React SDK
const productionConfig = {
  agentId: process.env.VITE_ELEVENLABS_AGENT_ID,
  // React SDK handles authentication through signed URLs
  // API key should be managed server-side for security
  monitoring: {
    enabled: true,
    errorReporting: true,
    performanceTracking: true
  }
};

// Production-ready conversation hook
const useProductionConversation = () => {
  const conversation = useConversation({
    onConnect: () => {
      // Log connection for monitoring
      console.log('Production: Connected to ElevenLabs');
    },
    onDisconnect: () => {
      console.log('Production: Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      // Handle production message processing
      console.log('Production: Message received');
    },
    onError: (error) => {
      // Production error handling with monitoring
      console.error('Production: ElevenLabs error:', error);
      // Send to error tracking service
    },
  });

  return conversation;
};
```

### Security Best Practices for React SDK
```typescript
// The React SDK handles authentication through signed URLs
// This should be implemented server-side for security
const getSecureAgentId = (): string => {
  const agentId = process.env.VITE_ELEVENLABS_AGENT_ID;
  
  if (!agentId) {
    throw new Error('ElevenLabs Agent ID not configured');
  }
  
  // Validate agent ID format
  if (!agentId.match(/^[a-zA-Z0-9-_]+$/)) {
    throw new Error('Invalid Agent ID format');
  }
  
  return agentId;
};

// Secure conversation initialization
const useSecureConversation = () => {
  const conversation = useConversation({
    onConnect: () => {
      // Log connection without sensitive data
      console.log('Secure connection established');
    },
    onError: (error) => {
      // Sanitize error logs
      const sanitizedError = {
        message: error.message,
        timestamp: new Date().toISOString(),
        // Exclude any sensitive data
      };
      console.error('Secure conversation error:', sanitizedError);
    },
  });

  return conversation;
};
```

### Performance Optimization for React SDK
```typescript
// Optimized conversation hook with memoization
import { useMemo, useCallback } from 'react';

const useOptimizedConversation = () => {
  // Memoize event handlers to prevent unnecessary re-renders
  const eventHandlers = useMemo(() => ({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message: any) => console.log('Message:', message),
    onError: (error: any) => console.error('Error:', error),
  }), []);

  const conversation = useConversation(eventHandlers);

  // Memoize conversation controls
  const controls = useMemo(() => ({
    startSession: conversation.startSession,
    endSession: conversation.endSession,
    setVolume: conversation.setVolume,
  }), [conversation]);

  return {
    ...conversation,
    ...controls,
  };
};

// Component-level optimization
const OptimizedVoiceComponent = React.memo(({ agentId }: { agentId: string }) => {
  const conversation = useOptimizedConversation();
  
  const handleStart = useCallback(() => {
    conversation.startSession({ agentId });
  }, [conversation, agentId]);
  
  const handleEnd = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleEnd}>End</button>
    </div>
  );
});
```

## 🔍 Troubleshooting

### Common Issues

#### React SDK Connection Errors
```typescript
// Debug React SDK connection
const debugReactSDKConnection = () => {
  const agentId = process.env.VITE_ELEVENLABS_AGENT_ID;
  
  console.log('Agent ID configured:', !!agentId);
  console.log('Agent ID format valid:', /^[a-zA-Z0-9-_]+$/.test(agentId || ''));
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Debug: Connection successful');
    },
    onDisconnect: () => {
      console.log('Debug: Disconnected');
    },
    onError: (error) => {
      console.error('Debug: Connection error:', error);
      // Common error types:
      // - Invalid agent ID
      // - Network connectivity issues
      // - Microphone permissions
      // - Browser compatibility
    },
  });

  return conversation;
};
```

#### Session Management Issues
```typescript
// Debug session management
const debugSession = async (conversation: any, agentId: string) => {
  try {
    console.log('Starting session debug...');
    console.log('Agent ID:', agentId);
    console.log('Conversation status:', conversation.status);
    
    const sessionId = await conversation.startSession({ agentId });
    console.log('Session started successfully:', sessionId);
    
    // Test session state
    setTimeout(() => {
      console.log('Session status after 2s:', conversation.status);
      console.log('Is speaking:', conversation.isSpeaking);
    }, 2000);
    
  } catch (error) {
    console.error('Session debug failed:', error);
    
    // Analyze error type
    if (error.message?.includes('agent')) {
      console.error('Issue: Invalid or missing agent ID');
    } else if (error.message?.includes('permission')) {
      console.error('Issue: Microphone permissions denied');
    } else if (error.message?.includes('network')) {
      console.error('Issue: Network connectivity problem');
    }
  }
};
```

#### Audio Issues
```typescript
// Audio debugging
const debugAudio = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Microphone access granted');
    
    const audioContext = new AudioContext();
    console.log('Audio context created:', audioContext.state);
    
    const recorder = new MediaRecorder(stream);
    console.log('MediaRecorder created:', recorder.state);
    
    stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error('Audio setup failed:', error);
  }
};
```

### Error Diagnostics
```typescript
const diagnoseError = (error: any) => {
  const diagnosis = {
    type: error.constructor.name,
    message: error.message,
    stack: error.stack,
    apiError: handleApiError(error),
    timestamp: new Date().toISOString()
  };
  
  console.error('Error diagnosis:', diagnosis);
  
  // Report to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
  }
  
  return diagnosis;
};
```

## 📞 Support Resources

### ElevenLabs Resources
- **[Official Documentation](https://elevenlabs.io/docs)**
- **[API Reference](https://elevenlabs.io/docs/api-reference)**
- **[React SDK Documentation](https://elevenlabs.io/docs/sdk/react)**
- **[Conversational AI Guide](https://elevenlabs.io/docs/conversational-ai)**
- **[Community Discord](https://discord.gg/elevenlabs)**

### React SDK Specific Resources
- **[React SDK GitHub](https://github.com/elevenlabs/elevenlabs-js/tree/main/packages/react)**
- **[React SDK Examples](https://github.com/elevenlabs/elevenlabs-examples/tree/main/react)**
- **[TypeScript Definitions](https://www.npmjs.com/package/@11labs/react)**

### Development Resources
- **[GitHub Issues](https://github.com/yourusername/elevenlabs-voice-agent/issues)**
- **[Contributing Guide](../CONTRIBUTING.md)**
- **[Support Guide](../SUPPORT.md)**

---

**Last Updated**: January 8, 2025
**Next Review**: April 8, 2025

This integration guide provides comprehensive coverage of ElevenLabs API integration. For specific implementation questions, refer to the [support resources](#support-resources) or create an issue in the repository. 🎤