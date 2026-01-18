/**
 * Audio Utilities for Gemini Live Voice
 *
 * Provides PCM encoding/decoding for bidirectional audio streaming
 * with Google Gemini Live API.
 *
 * Audio Format Requirements:
 * - Input (microphone): 16000 Hz, 16-bit signed integer PCM, mono
 * - Output (playback): 24000 Hz, 16-bit signed integer PCM, mono
 * - Encoding: Little-endian, base64 for WebSocket transport
 */

// Gemini Live API audio format constants
export const GEMINI_INPUT_SAMPLE_RATE = 16000;
export const GEMINI_OUTPUT_SAMPLE_RATE = 24000;
export const GEMINI_BIT_DEPTH = 16;
export const GEMINI_CHANNELS = 1;

/**
 * Encodes Float32Array audio samples to base64-encoded PCM16.
 * Float samples are expected in range [-1.0, 1.0].
 *
 * @param float32Data - Audio samples as Float32Array
 * @returns Base64-encoded PCM16 audio string
 */
export function float32ToBase64PCM(float32Data: Float32Array): string {
  // Handle empty input
  if (float32Data.length === 0) {
    return '';
  }

  // Allocate buffer for 16-bit samples (2 bytes each)
  const buffer = new ArrayBuffer(float32Data.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Data.length; i++) {
    // Clamp to [-1, 1] range to handle overflow
    const sample = Math.max(-1, Math.min(1, float32Data[i]));
    // Scale to 16-bit signed integer range [-32768, 32767]
    // Use asymmetric scaling for proper audio representation
    const int16 = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
    // Write as little-endian
    view.setInt16(i * 2, int16, true);
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes base64-encoded PCM16 audio to Float32Array.
 * Output samples are in range [-1.0, 1.0].
 *
 * @param base64Audio - Base64-encoded PCM16 audio string
 * @returns Audio samples as Float32Array
 */
export function base64PCMToFloat32(base64Audio: string): Float32Array {
  // Handle empty input
  if (!base64Audio || base64Audio.length === 0) {
    return new Float32Array(0);
  }

  // Decode base64 to bytes
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // Convert bytes to Int16 samples (little-endian)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sampleCount = Math.floor(bytes.length / 2);
  const float32 = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    // Scale from 16-bit signed integer to [-1, 1] range
    float32[i] = int16 / 0x8000;
  }

  return float32;
}
