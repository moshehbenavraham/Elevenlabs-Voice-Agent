/**
 * Gemini Audio Streamer
 *
 * Handles audio playback at 24kHz for Gemini Live API responses.
 * Uses AudioBufferSourceNode with precise scheduling for smooth playback.
 */

import EventEmitter from 'eventemitter3';
import { GEMINI_OUTPUT_SAMPLE_RATE, base64PCMToFloat32 } from './audioUtils';

// Event types emitted by the streamer
export interface GeminiAudioStreamerEvents {
  started: () => void;
  stopped: () => void;
  playing: () => void;
  ended: () => void;
  error: (error: Error) => void;
}

// Configuration options for the streamer
export interface GeminiAudioStreamerConfig {
  sampleRate?: number;
  initialVolume?: number;
}

// Internal queue item for scheduled audio
interface QueuedAudio {
  buffer: AudioBuffer;
  startTime: number;
  source: AudioBufferSourceNode;
}

/**
 * GeminiAudioStreamer plays back audio from Gemini Live API.
 *
 * Usage:
 * ```ts
 * const streamer = new GeminiAudioStreamer();
 * streamer.start();
 * streamer.addPCM(base64Audio); // Add audio chunks as they arrive
 * // ... later
 * streamer.stop();
 * ```
 */
export class GeminiAudioStreamer extends EventEmitter<GeminiAudioStreamerEvents> {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private readonly config: Required<GeminiAudioStreamerConfig>;
  private isPlaying = false;
  private queue: QueuedAudio[] = [];
  private nextStartTime = 0;
  private currentVolume: number;

  constructor(config: GeminiAudioStreamerConfig = {}) {
    super();
    this.config = {
      sampleRate: config.sampleRate ?? GEMINI_OUTPUT_SAMPLE_RATE,
      initialVolume: config.initialVolume ?? 1.0,
    };
    this.currentVolume = this.config.initialVolume;
  }

  /**
   * Initialize the audio context and gain node for playback.
   * Call this before adding audio data.
   */
  start(): void {
    if (this.audioContext) {
      return;
    }

    try {
      // Create AudioContext with desired sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.audioContext.currentTime);
      this.gainNode.connect(this.audioContext.destination);

      // Reset scheduling state
      this.nextStartTime = this.audioContext.currentTime;
      this.queue = [];

      this.emit('started');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  /**
   * Add base64-encoded PCM audio to the playback queue.
   * Audio is scheduled for gapless playback.
   *
   * @param base64Audio - Base64-encoded PCM16 audio from Gemini
   */
  addPCM(base64Audio: string): void {
    if (!this.audioContext || !this.gainNode) {
      throw new Error('Audio streamer not started. Call start() first.');
    }

    // Decode base64 to Float32 samples
    const float32Data = base64PCMToFloat32(base64Audio);
    if (float32Data.length === 0) {
      return;
    }

    // Create AudioBuffer from samples
    const buffer = this.audioContext.createBuffer(1, float32Data.length, this.config.sampleRate);
    buffer.copyToChannel(new Float32Array(float32Data), 0);

    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    // Calculate start time for gapless playback
    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(this.nextStartTime, currentTime);

    // Schedule playback
    source.start(startTime);

    // Track when this buffer ends
    const endTime = startTime + buffer.duration;
    this.nextStartTime = endTime;

    // Add to queue for tracking
    const queuedAudio: QueuedAudio = {
      buffer,
      startTime,
      source,
    };
    this.queue.push(queuedAudio);

    // Emit playing event on first audio
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.emit('playing');
    }

    // Clean up completed buffers when source ends
    source.onended = () => {
      const index = this.queue.indexOf(queuedAudio);
      if (index > -1) {
        this.queue.splice(index, 1);
      }

      // Emit ended event when all audio has played
      if (this.queue.length === 0 && this.isPlaying) {
        this.isPlaying = false;
        this.emit('ended');
      }
    };
  }

  /**
   * Set the playback volume.
   *
   * @param volume - Volume level from 0.0 (mute) to 1.0 (full)
   */
  setVolume(volume: number): void {
    // Clamp to valid range
    this.currentVolume = Math.max(0, Math.min(1, volume));

    if (this.gainNode && this.audioContext) {
      // Use setValueAtTime to prevent clicks
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.audioContext.currentTime);
    }
  }

  /**
   * Get the current volume level.
   */
  get volume(): number {
    return this.currentVolume;
  }

  /**
   * Check if audio is currently playing.
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Get the current sample rate.
   */
  get sampleRate(): number {
    return this.config.sampleRate;
  }

  /**
   * Stop playback and clear the queue.
   * Useful for barge-in (user interruption).
   */
  stop(): void {
    // Stop all queued audio sources immediately
    for (const item of this.queue) {
      try {
        item.source.stop();
        item.source.disconnect();
      } catch {
        // Ignore errors if already stopped
      }
    }
    this.queue = [];

    // Reset scheduling state
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      this.emit('ended');
    }
  }

  /**
   * Clean up all audio resources.
   * Call this when done with the streamer.
   */
  cleanup(): void {
    this.stop();

    // Disconnect gain node
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {
        // Ignore close errors
      });
      this.audioContext = null;
    }

    this.emit('stopped');
  }
}
