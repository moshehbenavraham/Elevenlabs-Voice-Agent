/**
 * WebSocket mocking utilities for E2E tests
 * Simulates realtime API connections for OpenAI, xAI, and ElevenLabs
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
    }

    _sendMockMessage(data) {
      if (this.readyState !== MockWebSocket.OPEN) return;

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
    getConnections: () => mockConnections,
    simulateClose: (index, code = 1006) => {
      const conn = mockConnections[index];
      if (conn) {
        conn.close(code, 'Simulated disconnect');
      }
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
}

declare global {
  interface Window {
    __E2E_WEBSOCKET_MOCK__?: E2EWebSocketMock;
  }
}
