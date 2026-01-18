/**
 * GenAILiveClient - WebSocket Client for Gemini Live API
 *
 * Manages bidirectional audio streaming with Google's Gemini Live API.
 * Uses EventEmitter3 for loose coupling with React components.
 *
 * Usage:
 * ```ts
 * const client = new GenAILiveClient({ voice: 'Zephyr' });
 * client.on('audio', (data) => audioStreamer.addPCM(data.audio));
 * client.on('transcription', (data) => console.log(data.text));
 * await client.connect(token);
 * client.sendRealtimeInput(base64Audio);
 * ```
 */

import EventEmitter from 'eventemitter3';
import {
  buildWebSocketUrl,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_VOICE,
  DEFAULT_SYSTEM_INSTRUCTION,
  GEMINI_AUDIO_CONFIG,
} from './config';
import type {
  AudioEventData,
  ConnectionState,
  ContentEventData,
  ErrorEventData,
  GenAILiveClientEvents,
  GenAILiveClientOptions,
  GeminiFunctionDeclaration,
  GeminiServerMessage,
  GoAwayEventData,
  RealtimeInputMessage,
  ServerContentMessage,
  SetupMessage,
  ToolCallEventData,
  ToolCallMessage,
  ToolResponseMessage,
  TranscriptionEventData,
} from './types';

/**
 * GenAILiveClient wraps WebSocket communication with Gemini Live API.
 * Emits typed events for audio, content, tool calls, transcription, and errors.
 */
export class GenAILiveClient extends EventEmitter<GenAILiveClientEvents> {
  private ws: WebSocket | null = null;
  private _state: ConnectionState = 'disconnected';
  private readonly model: string;
  private readonly voice: string;
  private readonly systemInstruction: string;
  private readonly tools: GeminiFunctionDeclaration[];
  private readonly inputAudioTranscription: boolean;
  private readonly outputAudioTranscription: boolean;

  constructor(options: GenAILiveClientOptions = {}) {
    super();
    this.model = options.model ?? DEFAULT_GEMINI_MODEL;
    this.voice = options.voice ?? DEFAULT_GEMINI_VOICE;
    this.systemInstruction = options.systemInstruction ?? DEFAULT_SYSTEM_INSTRUCTION;
    this.tools = options.tools ?? [];
    this.inputAudioTranscription = options.inputAudioTranscription ?? true;
    this.outputAudioTranscription = options.outputAudioTranscription ?? true;
  }

  /**
   * Current connection state.
   */
  get state(): ConnectionState {
    return this._state;
  }

  /**
   * Whether the client is currently connected.
   */
  get isConnected(): boolean {
    return this._state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to Gemini Live API with the provided ephemeral token.
   * Automatically sends setup message after connection established.
   *
   * @param token - Ephemeral authentication token from backend
   * @returns Promise that resolves when setup is complete
   */
  async connect(token: string): Promise<void> {
    if (this._state === 'connecting' || this._state === 'connected') {
      console.warn('[GenAILiveClient] Already connected or connecting');
      return;
    }

    this._state = 'connecting';

    return new Promise<void>((resolve, reject) => {
      const url = buildWebSocketUrl(token);

      try {
        this.ws = new WebSocket(url);
      } catch (error) {
        this._state = 'error';
        const err = error instanceof Error ? error : new Error(String(error));
        this.emit('error', {
          code: 'WEBSOCKET_CREATION_FAILED',
          message: err.message,
          error: err,
        });
        reject(err);
        return;
      }

      // Set up one-time setup complete handler
      const onSetupComplete = () => {
        this.off('setupComplete', onSetupComplete);
        this.off('error', onSetupError);
        resolve();
      };

      const onSetupError = (data: ErrorEventData) => {
        this.off('setupComplete', onSetupComplete);
        this.off('error', onSetupError);
        reject(new Error(data.message));
      };

      this.on('setupComplete', onSetupComplete);
      this.on('error', onSetupError);

      this.ws.onopen = () => {
        this._state = 'connected';
        this.emit('open');
        this.sendSetupMessage();
      };

      this.ws.onclose = (event: CloseEvent) => {
        this._state = 'disconnected';
        this.emit('close', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        this.ws = null;
      };

      this.ws.onerror = () => {
        // WebSocket error event doesn't provide details
        // Actual error info comes in onclose or message events
        this._state = 'error';
        this.emit('error', {
          code: 'WEBSOCKET_ERROR',
          message: 'WebSocket connection error',
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };
    });
  }

  /**
   * Disconnect from the Gemini Live API.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
    this._state = 'disconnected';
  }

  /**
   * Send audio input to Gemini for processing.
   * Audio should be base64-encoded PCM16 at 16kHz.
   *
   * @param base64Audio - Base64-encoded PCM audio data
   */
  sendRealtimeInput(base64Audio: string): void {
    if (!this.isConnected) {
      console.warn('[GenAILiveClient] Cannot send audio: not connected');
      return;
    }

    // Handle empty audio buffer
    if (!base64Audio || base64Audio.length === 0) {
      return;
    }

    const message: RealtimeInputMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: GEMINI_AUDIO_CONFIG.inputMimeType,
            data: base64Audio,
          },
        ],
      },
    };

    this.send(message);
  }

  /**
   * Send a tool/function response back to Gemini.
   *
   * @param callId - The function call ID to respond to
   * @param result - The result of the function execution
   */
  sendToolResponse(callId: string, result: Record<string, unknown>): void {
    if (!this.isConnected) {
      console.warn('[GenAILiveClient] Cannot send tool response: not connected');
      return;
    }

    const message: ToolResponseMessage = {
      toolResponse: {
        functionResponses: [
          {
            response: {
              output: result,
            },
            id: callId,
          },
        ],
      },
    };

    this.send(message);
  }

  /**
   * Send the setup message to configure the session.
   * Called automatically after WebSocket connection opens.
   */
  private sendSetupMessage(): void {
    const message: SetupMessage = {
      setup: {
        model: `models/${this.model}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.voice,
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: this.systemInstruction }],
        },
        // Enable transcription by providing empty config objects
        // The presence of the field enables it; no "enabled" property needed
        ...(this.inputAudioTranscription && { inputAudioTranscription: {} }),
        ...(this.outputAudioTranscription && { outputAudioTranscription: {} }),
      },
    };

    // Add tools if configured
    if (this.tools.length > 0) {
      message.setup.tools = [
        {
          functionDeclarations: this.tools,
        },
      ];
    }

    this.send(message);
  }

  /**
   * Send a message to the WebSocket.
   */
  private send(message: object): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[GenAILiveClient] Cannot send: WebSocket not open');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', {
        code: 'SEND_FAILED',
        message: err.message,
        error: err,
      });
    }
  }

  /**
   * Handle incoming WebSocket messages.
   * Parses JSON and emits appropriate events.
   */
  private handleMessage(data: string | ArrayBuffer | Blob): void {
    // Handle string messages (JSON)
    if (typeof data === 'string') {
      this.parseAndEmit(data);
      return;
    }

    // Handle ArrayBuffer
    if (data instanceof ArrayBuffer) {
      const text = new TextDecoder().decode(data);
      this.parseAndEmit(text);
      return;
    }

    // Handle Blob
    if (data instanceof Blob) {
      data
        .text()
        .then((text) => {
          this.parseAndEmit(text);
        })
        .catch((error) => {
          this.emit('error', {
            code: 'BLOB_PARSE_ERROR',
            message: error.message,
            error,
          });
        });
      return;
    }
  }

  /**
   * Parse JSON message and emit appropriate events.
   */
  private parseAndEmit(jsonString: string): void {
    let message: GeminiServerMessage;

    try {
      message = JSON.parse(jsonString) as GeminiServerMessage;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', {
        code: 'JSON_PARSE_ERROR',
        message: `Failed to parse server message: ${err.message}`,
        error: err,
      });
      return;
    }

    // Handle setupComplete
    if ('setupComplete' in message) {
      this.emit('setupComplete');
      return;
    }

    // Handle goAway
    if ('goAway' in message) {
      const goAwayData: GoAwayEventData = {
        reason: message.goAway.reason,
        message: message.goAway.message,
      };
      this.emit('goAway', goAwayData);
      // Gracefully disconnect after goAway
      this.disconnect();
      return;
    }

    // Handle toolCall
    if ('toolCall' in message) {
      this.handleToolCall(message);
      return;
    }

    // Handle serverContent
    if ('serverContent' in message) {
      this.handleServerContent(message);
      return;
    }
  }

  /**
   * Handle tool call messages from the server.
   */
  private handleToolCall(message: ToolCallMessage): void {
    for (const call of message.toolCall.functionCalls) {
      const toolCallData: ToolCallEventData = {
        name: call.name,
        args: call.args,
        id: call.id,
      };
      this.emit('toolcall', toolCallData);
    }
  }

  /**
   * Handle server content messages (audio, text, transcription).
   */
  private handleServerContent(message: ServerContentMessage): void {
    const content = message.serverContent;

    // Handle interruption
    if (content.interrupted) {
      this.emit('interrupted');
      return;
    }

    // Handle input transcription
    if (content.inputTranscription?.text) {
      const transcriptionData: TranscriptionEventData = {
        text: content.inputTranscription.text,
        type: 'input',
      };
      this.emit('transcription', transcriptionData);
    }

    // Handle output transcription
    if (content.outputTranscription?.text) {
      const transcriptionData: TranscriptionEventData = {
        text: content.outputTranscription.text,
        type: 'output',
      };
      this.emit('transcription', transcriptionData);
    }

    // Handle model turn content
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if ('text' in part) {
          // Text content
          const contentData: ContentEventData = {
            text: part.text,
          };
          this.emit('content', contentData);
        } else if ('inlineData' in part) {
          // Audio data
          const audioData: AudioEventData = {
            audio: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          };
          this.emit('audio', audioData);
        }
      }
    }

    // Handle turn complete
    if (content.turnComplete) {
      this.emit('turnComplete');
    }
  }
}
