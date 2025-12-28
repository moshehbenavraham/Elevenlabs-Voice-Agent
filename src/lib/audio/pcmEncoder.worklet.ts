/**
 * PCM Encoder AudioWorklet Processor
 *
 * Runs in a separate audio worklet thread to process microphone input
 * in real-time. Converts Float32 audio samples to PCM 16-bit format
 * at 24kHz for xAI Realtime API.
 *
 * Message Protocol:
 * - Input: Audio frames from AudioWorkletNode
 * - Output: { type: 'audio', audio: Int16Array } via MessagePort
 *
 * Note: This file must be loaded as a separate worklet module.
 * Vite handles this via new URL('./file.ts', import.meta.url)
 */

const TARGET_SAMPLE_RATE = 24000;

class PCMEncoderProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array[];
  private inputSampleRate: number;

  constructor() {
    super();
    this.buffer = [];
    // sampleRate is a global in AudioWorkletGlobalScope
    this.inputSampleRate = sampleRate;
  }

  /**
   * Process audio frames from microphone input.
   * Called for each render quantum (128 samples at native sample rate).
   */
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    // AudioWorklet API requires these parameters but we don't use them
    void outputs;
    void parameters;

    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    // Use first channel (mono)
    const channelData = input[0];
    if (!channelData || channelData.length === 0) {
      return true;
    }

    // Copy input data (input arrays are reused by the audio system)
    this.buffer.push(new Float32Array(channelData));

    // Process when we have enough samples for a chunk
    // Target: ~100ms of audio for reasonable latency
    const samplesPerChunk = Math.floor(this.inputSampleRate * 0.1);
    const totalSamples = this.buffer.reduce((sum, arr) => sum + arr.length, 0);

    if (totalSamples >= samplesPerChunk) {
      this.processBuffer();
    }

    return true;
  }

  /**
   * Concatenate buffer, resample to 24kHz, convert to PCM16, and send.
   */
  private processBuffer(): void {
    // Concatenate all buffered samples
    const totalLength = this.buffer.reduce((sum, arr) => sum + arr.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.buffer) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    this.buffer = [];

    // Resample to target sample rate
    const resampled = this.resample(
      combined,
      this.inputSampleRate,
      TARGET_SAMPLE_RATE
    );

    // Convert to PCM 16-bit
    const pcm16 = this.floatToPcm16(resampled);

    // Send to main thread
    this.port.postMessage({ type: 'audio', audio: pcm16 });
  }

  /**
   * Linear interpolation resampling.
   */
  private resample(
    input: Float32Array,
    inputRate: number,
    outputRate: number
  ): Float32Array {
    if (inputRate === outputRate) {
      return input;
    }

    const ratio = inputRate / outputRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const floor = Math.floor(srcIndex);
      const ceil = Math.min(floor + 1, input.length - 1);
      const t = srcIndex - floor;
      output[i] = input[floor] * (1 - t) + input[ceil] * t;
    }

    return output;
  }

  /**
   * Convert Float32 samples [-1, 1] to PCM 16-bit Int16.
   */
  private floatToPcm16(float32Data: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Data[i]));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return pcm16;
  }
}

registerProcessor('pcm-encoder-processor', PCMEncoderProcessor);
