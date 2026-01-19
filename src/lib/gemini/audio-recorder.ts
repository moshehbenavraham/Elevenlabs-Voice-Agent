/**
 * Gemini Audio Recorder
 *
 * Handles microphone capture at 16kHz for Gemini Live API.
 * Uses AudioWorklet for non-blocking audio processing.
 */

import EventEmitter from 'eventemitter3';
import { GEMINI_INPUT_SAMPLE_RATE } from './audioUtils';
import type { GeminiWorkletMessage } from '../worklets/gemini-audio-worklet';

// Event types emitted by the recorder
export interface GeminiAudioRecorderEvents {
  audio: (base64Audio: string) => void;
  started: () => void;
  stopped: () => void;
  error: (error: Error) => void;
}

// Configuration options for the recorder
export interface GeminiAudioRecorderConfig {
  sampleRate?: number;
  bufferSize?: number;
}

/**
 * GeminiAudioRecorder captures microphone audio and emits base64-encoded PCM.
 *
 * Usage:
 * ```ts
 * const recorder = new GeminiAudioRecorder();
 * recorder.on('audio', (base64) => sendToWebSocket(base64));
 * await recorder.start();
 * // ... later
 * recorder.stop();
 * ```
 */
export class GeminiAudioRecorder extends EventEmitter<GeminiAudioRecorderEvents> {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private readonly config: Required<GeminiAudioRecorderConfig>;
  private isRecording = false;

  constructor(config: GeminiAudioRecorderConfig = {}) {
    super();
    this.config = {
      sampleRate: config.sampleRate ?? GEMINI_INPUT_SAMPLE_RATE,
      bufferSize: config.bufferSize ?? 2048,
    };
  }

  /**
   * Start recording from the microphone.
   * Requests microphone permission if not already granted.
   */
  async start(): Promise<void> {
    if (this.isRecording) {
      return;
    }

    try {
      // Create AudioContext with desired sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
          channelCount: 1,
        },
      });

      // Create source node from microphone
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Load and register the AudioWorklet processor
      // Use absolute path to public worklet file - works in both dev and production
      await this.audioContext.audioWorklet.addModule('/worklets/gemini-audio-worklet.js');

      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'gemini-audio-processor', {
        processorOptions: {
          bufferSize: this.config.bufferSize,
        },
      });

      // Handle audio data from worklet
      this.workletNode.port.onmessage = (event: MessageEvent<GeminiWorkletMessage>) => {
        if (event.data.type === 'audio' && event.data.data) {
          const base64 = this.int16ToBase64(event.data.data);
          this.emit('audio', base64);
        }
      };

      // Connect the audio graph: microphone -> worklet
      this.sourceNode.connect(this.workletNode);

      this.isRecording = true;
      this.emit('started');
    } catch (error) {
      this.cleanup();
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  /**
   * Stop recording and release resources.
   */
  stop(): void {
    if (!this.isRecording) {
      return;
    }

    // Send stop message to worklet
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'stop' });
    }

    this.cleanup();
    this.isRecording = false;
    this.emit('stopped');
  }

  /**
   * Check if currently recording.
   */
  get recording(): boolean {
    return this.isRecording;
  }

  /**
   * Get the current sample rate.
   */
  get sampleRate(): number {
    return this.config.sampleRate;
  }

  /**
   * Clean up all audio resources.
   */
  private cleanup(): void {
    // Disconnect and close worklet node
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    // Disconnect source node
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Stop all tracks on the media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close the audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {
        // Ignore close errors
      });
      this.audioContext = null;
    }
  }

  /**
   * Convert Int16Array to base64 string.
   */
  private int16ToBase64(int16Data: Int16Array): string {
    const buffer = new ArrayBuffer(int16Data.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < int16Data.length; i++) {
      view.setInt16(i * 2, int16Data[i], true); // little-endian
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
