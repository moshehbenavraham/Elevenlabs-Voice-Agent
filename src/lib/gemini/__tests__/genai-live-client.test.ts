/**
 * Unit Tests for GenAILiveClient
 *
 * Tests WebSocket message handling and event emission for Gemini Live API.
 * Uses mock WebSocket to avoid real network connections.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GenAILiveClient } from '../genai-live-client';
import type {
  AudioEventData,
  ContentEventData,
  ToolCallEventData,
  TranscriptionEventData,
  GoAwayEventData,
  ErrorEventData,
  CloseEventData,
} from '../types';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = {
        code: code || 1000,
        reason: reason || '',
        wasClean: true,
      } as CloseEvent;
      this.onclose(closeEvent);
    }
  }

  // Helper to simulate receiving a message
  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  // Helper to simulate an error
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  // Helper to get sent messages for verification
  getSentMessages(): string[] {
    return this.sentMessages;
  }
}

// Store original WebSocket
const OriginalWebSocket = global.WebSocket;

describe('GenAILiveClient', () => {
  let mockWs: MockWebSocket | null = null;

  beforeEach(() => {
    // Mock global WebSocket using a class wrapper that vitest can construct
    const MockWebSocketWrapper = function (this: MockWebSocket, url: string) {
      mockWs = new MockWebSocket(url);
      return mockWs;
    } as unknown as typeof WebSocket;
    Object.defineProperties(MockWebSocketWrapper, {
      CONNECTING: { value: 0 },
      OPEN: { value: 1 },
      CLOSING: { value: 2 },
      CLOSED: { value: 3 },
    });

    global.WebSocket = MockWebSocketWrapper;
  });

  afterEach(() => {
    global.WebSocket = OriginalWebSocket;
    mockWs = null;
  });

  describe('constructor', () => {
    it('creates instance with default options', () => {
      const client = new GenAILiveClient();
      expect(client.state).toBe('disconnected');
      expect(client.isConnected).toBe(false);
    });

    it('creates instance with custom options', () => {
      const client = new GenAILiveClient({
        model: 'custom-model',
        voice: 'Puck',
        systemInstruction: 'Be helpful',
        inputAudioTranscription: false,
        outputAudioTranscription: false,
      });
      expect(client.state).toBe('disconnected');
    });
  });

  describe('connect', () => {
    it('connects to WebSocket with token in URL', async () => {
      const client = new GenAILiveClient();
      const token = 'test-token-123';

      // Start connection
      const connectPromise = client.connect(token);

      // Wait for connection to open
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));

      // Simulate setup complete
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));

      await connectPromise;

      expect(client.state).toBe('connected');
      expect(client.isConnected).toBe(true);
      expect(mockWs?.url).toContain(token);
    });

    it('sends setup message after connection opens', async () => {
      const client = new GenAILiveClient({ voice: 'Zephyr' });

      const connectPromise = client.connect('test-token');

      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));

      // Verify setup message was sent
      const sentMessages = mockWs?.getSentMessages() || [];
      expect(sentMessages.length).toBeGreaterThan(0);

      const setupMessage = JSON.parse(sentMessages[0]);
      expect(setupMessage.setup).toBeDefined();
      expect(
        setupMessage.setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName
      ).toBe('Zephyr');

      // Complete the connection
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;
    });

    it('emits open event when WebSocket connects', async () => {
      const client = new GenAILiveClient();
      const openHandler = vi.fn();
      client.on('open', openHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(openHandler).toHaveBeenCalled());

      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;
    });

    it('emits setupComplete event when setup completes', async () => {
      const client = new GenAILiveClient();
      const setupCompleteHandler = vi.fn();
      client.on('setupComplete', setupCompleteHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));

      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      expect(setupCompleteHandler).toHaveBeenCalled();
    });

    it('rejects when already connecting', async () => {
      const client = new GenAILiveClient();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Start first connection
      client.connect('token1');

      // Try to connect again while connecting
      await client.connect('token2');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Already connected'));
      warnSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('disconnects and emits close event', async () => {
      const client = new GenAILiveClient();
      const closeHandler = vi.fn();
      client.on('close', closeHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      client.disconnect();

      await vi.waitFor(() => expect(closeHandler).toHaveBeenCalled());
      expect(client.state).toBe('disconnected');
      expect(client.isConnected).toBe(false);
    });
  });

  describe('sendRealtimeInput', () => {
    it('sends audio data in correct format', async () => {
      const client = new GenAILiveClient();

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      // Clear setup message
      const sentMessages = mockWs?.getSentMessages() || [];
      sentMessages.length = 0;

      client.sendRealtimeInput('base64audiodata');

      const messages = mockWs?.getSentMessages() || [];
      expect(messages.length).toBe(1);

      const audioMessage = JSON.parse(messages[0]);
      expect(audioMessage.realtimeInput).toBeDefined();
      expect(audioMessage.realtimeInput.mediaChunks[0].mimeType).toBe('audio/pcm;rate=16000');
      expect(audioMessage.realtimeInput.mediaChunks[0].data).toBe('base64audiodata');
    });

    it('ignores empty audio data', async () => {
      const client = new GenAILiveClient();

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const sentMessages = mockWs?.getSentMessages() || [];
      const initialCount = sentMessages.length;

      client.sendRealtimeInput('');
      client.sendRealtimeInput('');

      expect(sentMessages.length).toBe(initialCount);
    });

    it('warns when not connected', () => {
      const client = new GenAILiveClient();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      client.sendRealtimeInput('test');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot send audio'));
      warnSpy.mockRestore();
    });
  });

  describe('sendToolResponse', () => {
    it('sends tool response in correct format', async () => {
      const client = new GenAILiveClient();

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      client.sendToolResponse('call-123', { result: 'success' });

      const messages = mockWs?.getSentMessages() || [];
      const lastMessage = JSON.parse(messages[messages.length - 1]);

      expect(lastMessage.toolResponse).toBeDefined();
      expect(lastMessage.toolResponse.functionResponses[0].id).toBe('call-123');
      expect(lastMessage.toolResponse.functionResponses[0].response.output).toEqual({
        result: 'success',
      });
    });

    it('warns when not connected', () => {
      const client = new GenAILiveClient();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      client.sendToolResponse('call-123', { result: 'test' });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot send tool response'));
      warnSpy.mockRestore();
    });
  });

  describe('message parsing and event emission', () => {
    it('emits audio event for audio data', async () => {
      const client = new GenAILiveClient();
      const audioHandler = vi.fn();
      client.on('audio', audioHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        serverContent: {
          modelTurn: {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/pcm;rate=24000',
                  data: 'base64audiodata',
                },
              },
            ],
          },
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(audioHandler).toHaveBeenCalled());

      const audioData: AudioEventData = audioHandler.mock.calls[0][0];
      expect(audioData.audio).toBe('base64audiodata');
      expect(audioData.mimeType).toBe('audio/pcm;rate=24000');
    });

    it('emits content event for text content', async () => {
      const client = new GenAILiveClient();
      const contentHandler = vi.fn();
      client.on('content', contentHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        serverContent: {
          modelTurn: {
            parts: [{ text: 'Hello, world!' }],
          },
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(contentHandler).toHaveBeenCalled());

      const contentData: ContentEventData = contentHandler.mock.calls[0][0];
      expect(contentData.text).toBe('Hello, world!');
    });

    it('emits toolcall event for function calls', async () => {
      const client = new GenAILiveClient();
      const toolcallHandler = vi.fn();
      client.on('toolcall', toolcallHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        toolCall: {
          functionCalls: [
            {
              name: 'get_weather',
              args: { location: 'Tokyo' },
              id: 'call-456',
            },
          ],
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(toolcallHandler).toHaveBeenCalled());

      const toolcallData: ToolCallEventData = toolcallHandler.mock.calls[0][0];
      expect(toolcallData.name).toBe('get_weather');
      expect(toolcallData.args).toEqual({ location: 'Tokyo' });
      expect(toolcallData.id).toBe('call-456');
    });

    it('emits transcription event for input transcription', async () => {
      const client = new GenAILiveClient();
      const transcriptionHandler = vi.fn();
      client.on('transcription', transcriptionHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        serverContent: {
          inputTranscription: { text: 'User said something' },
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(transcriptionHandler).toHaveBeenCalled());

      const transcriptionData: TranscriptionEventData = transcriptionHandler.mock.calls[0][0];
      expect(transcriptionData.text).toBe('User said something');
      expect(transcriptionData.type).toBe('input');
    });

    it('emits transcription event for output transcription', async () => {
      const client = new GenAILiveClient();
      const transcriptionHandler = vi.fn();
      client.on('transcription', transcriptionHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        serverContent: {
          outputTranscription: { text: 'Model responded' },
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(transcriptionHandler).toHaveBeenCalled());

      const transcriptionData: TranscriptionEventData = transcriptionHandler.mock.calls[0][0];
      expect(transcriptionData.text).toBe('Model responded');
      expect(transcriptionData.type).toBe('output');
    });

    it('emits interrupted event on barge-in', async () => {
      const client = new GenAILiveClient();
      const interruptedHandler = vi.fn();
      client.on('interrupted', interruptedHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        serverContent: {
          interrupted: true,
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(interruptedHandler).toHaveBeenCalled());
    });

    it('emits turnComplete event when turn ends', async () => {
      const client = new GenAILiveClient();
      const turnCompleteHandler = vi.fn();
      client.on('turnComplete', turnCompleteHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        serverContent: {
          turnComplete: true,
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(turnCompleteHandler).toHaveBeenCalled());
    });

    it('emits goAway event and disconnects', async () => {
      const client = new GenAILiveClient();
      const goAwayHandler = vi.fn();
      const closeHandler = vi.fn();
      client.on('goAway', goAwayHandler);
      client.on('close', closeHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      const serverMessage = {
        goAway: {
          reason: 'SESSION_EXPIRED',
          message: 'Your session has expired',
        },
      };

      mockWs?.simulateMessage(JSON.stringify(serverMessage));

      await vi.waitFor(() => expect(goAwayHandler).toHaveBeenCalled());

      const goAwayData: GoAwayEventData = goAwayHandler.mock.calls[0][0];
      expect(goAwayData.reason).toBe('SESSION_EXPIRED');
      expect(goAwayData.message).toBe('Your session has expired');
    });

    it('emits error event for invalid JSON', async () => {
      const client = new GenAILiveClient();
      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      mockWs?.simulateMessage('not-valid-json{{{');

      await vi.waitFor(() => expect(errorHandler).toHaveBeenCalled());

      const errorData: ErrorEventData = errorHandler.mock.calls[0][0];
      expect(errorData.code).toBe('JSON_PARSE_ERROR');
    });
  });

  describe('error handling', () => {
    it('emits error event on WebSocket error', async () => {
      const client = new GenAILiveClient();
      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      // Start connect but don't await - we'll simulate error before setup complete
      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));

      mockWs?.simulateError();

      // The connect promise will reject due to the error
      await expect(connectPromise).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalled();
      const errorData: ErrorEventData = errorHandler.mock.calls[0][0];
      expect(errorData.code).toBe('WEBSOCKET_ERROR');
    });

    it('emits close event with details on connection close', async () => {
      const client = new GenAILiveClient();
      const closeHandler = vi.fn();
      client.on('close', closeHandler);

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));
      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;

      mockWs?.close(1001, 'Server shutdown');

      await vi.waitFor(() => expect(closeHandler).toHaveBeenCalled());

      const closeData: CloseEventData = closeHandler.mock.calls[0][0];
      expect(closeData.code).toBe(1001);
      expect(closeData.reason).toBe('Server shutdown');
    });
  });

  describe('tools configuration', () => {
    it('sends tools in setup message when provided', async () => {
      const tools = [
        {
          name: 'get_weather',
          description: 'Get weather for a location',
          parameters: {
            type: 'object' as const,
            properties: {
              location: { type: 'string' as const, description: 'City name' },
            },
            required: ['location'],
          },
        },
      ];

      const client = new GenAILiveClient({ tools });

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));

      const sentMessages = mockWs?.getSentMessages() || [];
      const setupMessage = JSON.parse(sentMessages[0]);

      expect(setupMessage.setup.tools).toBeDefined();
      expect(setupMessage.setup.tools[0].functionDeclarations).toHaveLength(1);
      expect(setupMessage.setup.tools[0].functionDeclarations[0].name).toBe('get_weather');

      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;
    });

    it('omits tools from setup message when not provided', async () => {
      const client = new GenAILiveClient();

      const connectPromise = client.connect('test-token');
      await vi.waitFor(() => expect(mockWs?.readyState).toBe(MockWebSocket.OPEN));

      const sentMessages = mockWs?.getSentMessages() || [];
      const setupMessage = JSON.parse(sentMessages[0]);

      expect(setupMessage.setup.tools).toBeUndefined();

      mockWs?.simulateMessage(JSON.stringify({ setupComplete: {} }));
      await connectPromise;
    });
  });
});
