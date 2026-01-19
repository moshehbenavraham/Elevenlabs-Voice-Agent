/**
 * Gemini Audio Worklet Processor
 *
 * AudioWorklet processor for capturing microphone audio at 16kHz.
 * Runs in a separate thread to avoid blocking the main thread.
 *
 * NOTE: This is the production-ready JS version of the worklet.
 * The TypeScript source is at src/lib/worklets/gemini-audio-worklet.ts
 */

class GeminiAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    // Default buffer size: 2048 samples (~128ms at 16kHz)
    const processorOptions = options?.processorOptions;
    this.bufferSize = processorOptions?.bufferSize ?? 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.stopped = false;

    // Listen for stop message from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'stop') {
        this.stopped = true;
      }
    };
  }

  /**
   * Process audio input and accumulate samples.
   * When buffer is full, convert to Int16 and send to main thread.
   */
  process(inputs, _outputs, _parameters) {
    // Stop processing if stopped
    if (this.stopped) {
      return false;
    }

    // Get first input channel (mono)
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const channelData = input[0];
    if (!channelData || channelData.length === 0) {
      return true;
    }

    // Accumulate samples into buffer
    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];

      // When buffer is full, convert and send
      if (this.bufferIndex >= this.bufferSize) {
        this.sendBuffer();
        this.bufferIndex = 0;
      }
    }

    return true;
  }

  /**
   * Convert Float32 buffer to Int16 and send to main thread.
   */
  sendBuffer() {
    const int16Data = new Int16Array(this.bufferSize);

    for (let i = 0; i < this.bufferSize; i++) {
      // Clamp to [-1, 1] range
      const sample = Math.max(-1, Math.min(1, this.buffer[i]));
      // Scale to 16-bit signed integer range
      int16Data[i] = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
    }

    // Send to main thread
    const message = {
      type: 'audio',
      data: int16Data,
    };

    this.port.postMessage(message, [int16Data.buffer]);
  }
}

// Register the processor with the name 'gemini-audio-processor'
registerProcessor('gemini-audio-processor', GeminiAudioProcessor);
