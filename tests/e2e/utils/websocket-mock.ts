/**
 * WebSocket mocking utilities for E2E tests
 * Simulates realtime API connections for OpenAI, xAI, ElevenLabs, and Gemini
 */

/**
 * Script to inject into the page that mocks WebSocket connections
 * Must be injected via page.addInitScript() before page load
 */
export const websocketMockScript = `
(function() {
  const OriginalWebSocket = window.WebSocket;

  // Store active mock connections for testing
  const mockConnections = [];
  const getProviderConnections = () => mockConnections.filter(conn => conn._provider !== 'unknown');

  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url, protocols) {
      this.url = url;
      this.protocol = Array.isArray(protocols) ? protocols[0] : (protocols || '');
      this.readyState = MockWebSocket.CONNECTING;
      this.bufferedAmount = 0;
      this.extensions = '';
      this.binaryType = 'blob';

      this.onopen = null;
      this.onclose = null;
      this.onmessage = null;
      this.onerror = null;

      this._eventListeners = {
        open: [],
        close: [],
        message: [],
        error: []
      };

      mockConnections.push(this);

      // Determine provider from URL
      this._provider = this._detectProvider(url);

      console.log('[E2E Mock] WebSocket connecting to:', url, 'Provider:', this._provider);

      // Simulate connection after a brief delay
      setTimeout(() => {
        this._handleOpen();
      }, 50);
    }

    _detectProvider(url) {
      if (url.includes('api.openai.com')) return 'openai';
      if (url.includes('api.x.ai')) return 'xai';
      if (url.includes('elevenlabs')) return 'elevenlabs';
      if (url.includes('generativelanguage.googleapis.com')) return 'gemini';
      return 'unknown';
    }

    _handleOpen() {
      this.readyState = MockWebSocket.OPEN;
      const event = new Event('open');

      if (this.onopen) this.onopen(event);
      this._eventListeners.open.forEach(fn => fn(event));

      console.log('[E2E Mock] WebSocket opened:', this.url);

      // Send initial session response for OpenAI/xAI
      if (this._provider === 'openai' || this._provider === 'xai') {
        setTimeout(() => {
          this._sendMockMessage({
            type: 'session.created',
            session: {
              id: 'mock-session-' + Math.random().toString(36).substr(2, 9),
              model: this._provider === 'openai' ? 'gpt-4o-realtime-preview' : 'grok-2-public',
              voice: 'alloy'
            }
          });
        }, 100);
      }

      // Send initial setup complete for Gemini
      if (this._provider === 'gemini') {
        setTimeout(() => {
          this._sendMockMessage({
            setupComplete: {}
          });
        }, 100);
      }

      // Send initial conversation metadata for ElevenLabs v1
      if (this._provider === 'elevenlabs') {
        setTimeout(() => {
          this._sendMockMessage({
            type: 'conversation_initiation_metadata',
            conversation_initiation_metadata_event: {
              conversation_id: 'mock-elevenlabs-conversation-' + Math.random().toString(36).substr(2, 9),
              agent_output_audio_format: 'pcm_16000',
              user_input_audio_format: 'pcm_16000'
            }
          });
        }, 100);
      }
    }

    _sendMockMessage(data) {
      if (this.readyState !== MockWebSocket.OPEN) return;

      if (this._provider === 'openai' && data && typeof data === 'object') {
        if (data.type === 'response.text.done') {
          const responseId = 'resp-' + Date.now();
          this._sendMockMessage({
            type: 'response.created',
            response: {
              id: responseId,
              status: 'in_progress'
            }
          });
          this._sendMockMessage({
            type: 'response.output_audio_transcript.delta',
            delta: data.text || ''
          });
          return;
        }

        if (data.type === 'conversation.item.created' && data.item?.role === 'user') {
          const content = Array.isArray(data.item.content) ? data.item.content[0] : null;
          this._sendMockMessage({
            type: 'conversation.item.input_audio_transcription.completed',
            item_id: data.item.id,
            transcript: content?.text || ''
          });
          return;
        }
      }

      const messageData = typeof data === 'string' ? data : JSON.stringify(data);
      const event = new MessageEvent('message', { data: messageData });

      if (this.onmessage) this.onmessage(event);
      this._eventListeners.message.forEach(fn => fn(event));
    }

    send(data) {
      if (this.readyState !== MockWebSocket.OPEN) {
        throw new Error('WebSocket is not open');
      }

      console.log('[E2E Mock] WebSocket send:', typeof data === 'string' ? data.substr(0, 100) : '[binary]');

      // Parse and respond to certain message types
      try {
        const parsed = JSON.parse(data);
        this._handleClientMessage(parsed);
      } catch (e) {
        // Binary data or non-JSON, ignore
      }
    }

    _handleClientMessage(message) {
      // Simulate responses based on message type
      if (message.type === 'session.update') {
        setTimeout(() => {
          this._sendMockMessage({
            type: 'session.updated',
            session: message.session || {}
          });
        }, 100);
        return;
      }

      if (message.type === 'input_audio_buffer.append') {
        // Audio chunk received - no response needed
        return;
      }

      if (message.type === 'input_audio_buffer.commit') {
        // Simulate transcription response
        setTimeout(() => {
          this._sendMockMessage({
            type: 'conversation.item.created',
            item: {
              id: 'item-' + Date.now(),
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: 'Mock transcribed audio' }]
            }
          });
        }, 200);
        return;
      }

      if (message.type === 'response.create') {
        // Simulate assistant response
        setTimeout(() => {
          this._sendMockMessage({
            type: 'response.created',
            response: {
              id: 'resp-' + Date.now(),
              status: 'in_progress'
            }
          });

          // Send text delta
          setTimeout(() => {
            this._sendMockMessage({
              type: 'response.text.delta',
              delta: 'This is a mock response from the voice agent.'
            });
          }, 100);

          // Send done
          setTimeout(() => {
            this._sendMockMessage({
              type: 'response.done',
              response: {
                id: 'resp-' + Date.now(),
                status: 'completed'
              }
            });
          }, 300);
        }, 100);
        return;
      }
    }

    close(code = 1000, reason = '') {
      if (this.readyState === MockWebSocket.CLOSED) return;

      this.readyState = MockWebSocket.CLOSING;

      setTimeout(() => {
        this.readyState = MockWebSocket.CLOSED;
        const event = new CloseEvent('close', {
          code: code,
          reason: reason,
          wasClean: code === 1000
        });

        if (this.onclose) this.onclose(event);
        this._eventListeners.close.forEach(fn => fn(event));

        console.log('[E2E Mock] WebSocket closed:', code, reason);
      }, 50);
    }

    addEventListener(type, listener) {
      if (this._eventListeners[type]) {
        this._eventListeners[type].push(listener);
      }
    }

    removeEventListener(type, listener) {
      if (this._eventListeners[type]) {
        const index = this._eventListeners[type].indexOf(listener);
        if (index > -1) {
          this._eventListeners[type].splice(index, 1);
        }
      }
    }

    dispatchEvent(event) {
      const listeners = this._eventListeners[event.type] || [];
      listeners.forEach(fn => fn(event));
      return true;
    }
  }

  // Copy static properties
  MockWebSocket.CONNECTING = 0;
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSING = 2;
  MockWebSocket.CLOSED = 3;

  // Replace global WebSocket
  window.WebSocket = MockWebSocket;

  // Expose for testing
  window.__E2E_WEBSOCKET_MOCK__ = {
    MockWebSocket,
    OriginalWebSocket,
    getConnections: getProviderConnections,
    simulateClose: (index, code = 1006) => {
      const conn = getProviderConnections()[index];
      if (conn) {
        conn.close(code, 'Simulated disconnect');
      }
    },
    simulateReconnect: (index) => {
      const conn = getProviderConnections()[index];
      if (conn && conn.readyState === MockWebSocket.CLOSED) {
        conn.readyState = MockWebSocket.CONNECTING;
        setTimeout(() => {
          conn._handleOpen();
        }, 50);
      }
    },
    simulateError: (index, errorMsg = 'Mock WebSocket error') => {
      const conn = getProviderConnections()[index];
      if (conn) {
        const event = new Event('error');
        event.message = errorMsg;
        if (conn.onerror) conn.onerror(event);
        conn._eventListeners.error.forEach(fn => fn(event));
        console.log('[E2E Mock] WebSocket error simulated:', errorMsg);
      }
    },
    simulateNetworkDisconnect: () => {
      getProviderConnections().forEach((conn) => {
        if (conn.readyState === MockWebSocket.OPEN) {
          conn.close(1006, 'Network disconnected');
        }
      });
    },
    simulateFunctionCall: (index, functionName, args, result) => {
      const conn = getProviderConnections()[index];
      if (conn && conn.readyState === MockWebSocket.OPEN) {
        // Send function call event
        conn._sendMockMessage({
          type: 'response.function_call_arguments.done',
          call_id: 'call-' + Date.now(),
          name: functionName,
          arguments: JSON.stringify(args)
        });
        // Send function output after delay
        setTimeout(() => {
          conn._sendMockMessage({
            type: 'response.function_call_output',
            call_id: 'call-' + Date.now(),
            output: JSON.stringify(result)
          });
        }, 200);
      }
    },
    getConnectionCount: () => getProviderConnections().length,
    clearConnections: () => {
      mockConnections.forEach(conn => {
        if (conn.readyState !== MockWebSocket.CLOSED) {
          conn.close(1000, 'Test cleanup');
        }
      });
      mockConnections.length = 0;
    }
  };

  console.log('[E2E Mock] WebSocket API mocked successfully');
})();
`;

/**
 * Type definitions for the mock WebSocket API exposed on window
 */
export interface E2EWebSocketMock {
  MockWebSocket: typeof WebSocket;
  OriginalWebSocket: typeof WebSocket;
  getConnections: () => WebSocket[];
  simulateClose: (index: number, code?: number) => void;
  simulateReconnect: (index: number) => void;
  simulateError: (index: number, errorMsg?: string) => void;
  simulateNetworkDisconnect: () => void;
  simulateFunctionCall: (
    index: number,
    functionName: string,
    args: Record<string, unknown>,
    result: unknown
  ) => void;
  getConnectionCount: () => number;
  clearConnections: () => void;
}

declare global {
  interface Window {
    __E2E_WEBSOCKET_MOCK__?: E2EWebSocketMock;
  }
}
