/**
 * Audio Utilities for xAI Realtime Voice
 *
 * Provides base64 encoding/decoding and PCM buffer conversion
 * for bidirectional audio streaming with xAI Realtime API.
 *
 * Audio Format Requirements:
 * - Sample Rate: 24000 Hz (24kHz)
 * - Bit Depth: 16-bit signed integer (PCM16)
 * - Channels: Mono
 * - Encoding: Little-endian
 */

// xAI Realtime API audio format constants
export const XAI_SAMPLE_RATE = 24000;
export const XAI_BIT_DEPTH = 16;
export const XAI_CHANNELS = 1;

/**
 * Encodes a Uint8Array to base64 string.
 * Used for sending audio data to xAI via WebSocket.
 *
 * @param data - Raw audio bytes
 * @returns Base64-encoded string
 */
export function encodeBase64(data: Uint8Array): string {
  let binary = '';
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string to Uint8Array.
 * Used for receiving audio data from xAI.
 *
 * @param base64 - Base64-encoded audio string
 * @returns Raw audio bytes
 */
export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts Float32Array audio samples to PCM 16-bit Int16Array.
 * Float samples are expected in range [-1.0, 1.0].
 *
 * @param float32Data - Audio samples as Float32Array
 * @returns PCM 16-bit samples as Int16Array
 */
export function floatToPcm16(float32Data: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Data.length);
  for (let i = 0; i < float32Data.length; i++) {
    // Clamp to [-1, 1] range
    const sample = Math.max(-1, Math.min(1, float32Data[i]));
    // Scale to 16-bit signed integer range [-32768, 32767]
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm16;
}

/**
 * Converts PCM 16-bit Int16Array to Float32Array audio samples.
 * Output samples are in range [-1.0, 1.0].
 *
 * @param pcm16Data - PCM 16-bit samples as Int16Array
 * @returns Audio samples as Float32Array
 */
export function pcm16ToFloat(pcm16Data: Int16Array): Float32Array {
  const float32 = new Float32Array(pcm16Data.length);
  for (let i = 0; i < pcm16Data.length; i++) {
    // Scale from 16-bit signed integer to [-1, 1] range
    float32[i] = pcm16Data[i] / 0x8000;
  }
  return float32;
}

/**
 * Converts Int16Array to Uint8Array (little-endian byte order).
 * Required for base64 encoding of PCM data.
 *
 * @param int16Data - PCM 16-bit samples
 * @returns Raw bytes in little-endian order
 */
export function int16ToBytes(int16Data: Int16Array): Uint8Array {
  const buffer = new ArrayBuffer(int16Data.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < int16Data.length; i++) {
    view.setInt16(i * 2, int16Data[i], true); // true = little-endian
  }
  return new Uint8Array(buffer);
}

/**
 * Converts Uint8Array bytes to Int16Array (little-endian byte order).
 * Used when decoding received audio from xAI.
 *
 * @param bytes - Raw audio bytes
 * @returns PCM 16-bit samples
 */
export function bytesToInt16(bytes: Uint8Array): Int16Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const int16Data = new Int16Array(bytes.length / 2);
  for (let i = 0; i < int16Data.length; i++) {
    int16Data[i] = view.getInt16(i * 2, true); // true = little-endian
  }
  return int16Data;
}

/**
 * Encodes Float32Array audio to base64 PCM16 for xAI.
 * Combines floatToPcm16, int16ToBytes, and encodeBase64.
 *
 * @param float32Data - Audio samples from AudioWorklet
 * @returns Base64-encoded PCM16 audio
 */
export function encodeAudioForXAI(float32Data: Float32Array): string {
  const pcm16 = floatToPcm16(float32Data);
  const bytes = int16ToBytes(pcm16);
  return encodeBase64(bytes);
}

/**
 * Decodes base64 PCM16 audio from xAI to Float32Array.
 * Combines decodeBase64, bytesToInt16, and pcm16ToFloat.
 *
 * @param base64Audio - Base64-encoded PCM16 from xAI
 * @returns Audio samples for playback
 */
export function decodeAudioFromXAI(base64Audio: string): Float32Array {
  const bytes = decodeBase64(base64Audio);
  const pcm16 = bytesToInt16(bytes);
  return pcm16ToFloat(pcm16);
}

/**
 * Creates an AudioBuffer from Float32 samples for playback.
 *
 * @param audioContext - Web Audio API AudioContext
 * @param float32Data - Decoded audio samples
 * @param sampleRate - Sample rate (default: XAI_SAMPLE_RATE)
 * @returns AudioBuffer ready for playback
 */
export function createAudioBuffer(
  audioContext: AudioContext,
  float32Data: Float32Array,
  sampleRate: number = XAI_SAMPLE_RATE
): AudioBuffer {
  const audioBuffer = audioContext.createBuffer(
    XAI_CHANNELS,
    float32Data.length,
    sampleRate
  );
  audioBuffer.copyToChannel(float32Data, 0);
  return audioBuffer;
}

/**
 * Resamples audio from source sample rate to target sample rate.
 * Uses simple linear interpolation for real-time performance.
 *
 * @param inputSamples - Source audio samples
 * @param inputSampleRate - Source sample rate (e.g., 48000)
 * @param outputSampleRate - Target sample rate (e.g., 24000)
 * @returns Resampled audio samples
 */
export function resampleAudio(
  inputSamples: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return inputSamples;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(inputSamples.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, inputSamples.length - 1);
    const t = srcIndex - srcIndexFloor;

    // Linear interpolation
    output[i] =
      inputSamples[srcIndexFloor] * (1 - t) + inputSamples[srcIndexCeil] * t;
  }

  return output;
}
