/**
 * Unit Tests for Gemini Audio Utilities
 *
 * Tests PCM encoding/decoding functions with various edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  float32ToBase64PCM,
  base64PCMToFloat32,
  GEMINI_INPUT_SAMPLE_RATE,
  GEMINI_OUTPUT_SAMPLE_RATE,
  GEMINI_BIT_DEPTH,
  GEMINI_CHANNELS,
} from '../audioUtils';

describe('Gemini Audio Constants', () => {
  it('has correct input sample rate (16kHz)', () => {
    expect(GEMINI_INPUT_SAMPLE_RATE).toBe(16000);
  });

  it('has correct output sample rate (24kHz)', () => {
    expect(GEMINI_OUTPUT_SAMPLE_RATE).toBe(24000);
  });

  it('has correct bit depth (16-bit)', () => {
    expect(GEMINI_BIT_DEPTH).toBe(16);
  });

  it('has correct channel count (mono)', () => {
    expect(GEMINI_CHANNELS).toBe(1);
  });
});

describe('float32ToBase64PCM', () => {
  it('encodes empty array to empty string', () => {
    const input = new Float32Array(0);
    const result = float32ToBase64PCM(input);
    expect(result).toBe('');
  });

  it('encodes silence (zeros) correctly', () => {
    const input = new Float32Array([0, 0, 0, 0]);
    const result = float32ToBase64PCM(input);
    // Decode and verify all zeros
    const decoded = base64PCMToFloat32(result);
    expect(decoded.length).toBe(4);
    for (const sample of decoded) {
      expect(sample).toBe(0);
    }
  });

  it('encodes single sample correctly', () => {
    const input = new Float32Array([0.5]);
    const result = float32ToBase64PCM(input);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('encodes maximum positive amplitude (1.0) correctly', () => {
    const input = new Float32Array([1.0]);
    const result = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(result);
    // Max positive: 0x7FFF = 32767, divided by 32768 = 0.99997
    expect(decoded[0]).toBeCloseTo(0x7fff / 0x8000, 4);
  });

  it('encodes maximum negative amplitude (-1.0) correctly', () => {
    const input = new Float32Array([-1.0]);
    const result = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(result);
    // Max negative: -32768 / 32768 = -1.0
    expect(decoded[0]).toBeCloseTo(-1.0, 4);
  });

  it('clamps values exceeding +1.0', () => {
    const input = new Float32Array([1.5, 2.0, 100.0]);
    const result = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(result);
    // All should be clamped to max positive
    for (const sample of decoded) {
      expect(sample).toBeCloseTo(0x7fff / 0x8000, 4);
    }
  });

  it('clamps values exceeding -1.0', () => {
    const input = new Float32Array([-1.5, -2.0, -100.0]);
    const result = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(result);
    // All should be clamped to max negative
    for (const sample of decoded) {
      expect(sample).toBeCloseTo(-1.0, 4);
    }
  });

  it('encodes mixed positive and negative samples', () => {
    const input = new Float32Array([0.25, -0.25, 0.5, -0.5]);
    const result = float32ToBase64PCM(input);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces valid base64 output', () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);
    const result = float32ToBase64PCM(input);
    // Base64 should only contain valid characters
    expect(/^[A-Za-z0-9+/=]*$/.test(result)).toBe(true);
  });
});

describe('base64PCMToFloat32', () => {
  it('decodes empty string to empty array', () => {
    const result = base64PCMToFloat32('');
    expect(result.length).toBe(0);
  });

  it('decodes null-ish input to empty array', () => {
    // @ts-expect-error Testing null input
    const resultNull = base64PCMToFloat32(null);
    expect(resultNull.length).toBe(0);

    // @ts-expect-error Testing undefined input
    const resultUndefined = base64PCMToFloat32(undefined);
    expect(resultUndefined.length).toBe(0);
  });

  it('decodes valid base64 PCM correctly', () => {
    // Create known PCM data: 0x0000 (silence)
    const base64 = btoa(String.fromCharCode(0, 0)); // 0x0000 little-endian
    const result = base64PCMToFloat32(base64);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(0);
  });

  it('handles odd byte count gracefully', () => {
    // 3 bytes = 1 complete sample (2 bytes) + 1 leftover byte
    const base64 = btoa(String.fromCharCode(0, 0, 0));
    const result = base64PCMToFloat32(base64);
    // Should only decode complete samples
    expect(result.length).toBe(1);
  });

  it('throws on invalid base64 input', () => {
    expect(() => base64PCMToFloat32('not-valid-base64!@#$')).toThrow();
  });
});

describe('Round-trip encoding/decoding', () => {
  it('preserves silence', () => {
    const input = new Float32Array([0, 0, 0, 0]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(input.length);
    for (let i = 0; i < input.length; i++) {
      expect(decoded[i]).toBeCloseTo(input[i], 4);
    }
  });

  it('preserves small positive values within tolerance', () => {
    const input = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(input.length);
    for (let i = 0; i < input.length; i++) {
      // 16-bit quantization allows ~0.00003 tolerance
      expect(decoded[i]).toBeCloseTo(input[i], 3);
    }
  });

  it('preserves small negative values within tolerance', () => {
    const input = new Float32Array([-0.1, -0.2, -0.3, -0.4]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(input.length);
    for (let i = 0; i < input.length; i++) {
      expect(decoded[i]).toBeCloseTo(input[i], 3);
    }
  });

  it('preserves mixed values within tolerance', () => {
    const input = new Float32Array([0.5, -0.5, 0.25, -0.25, 0.75, -0.75]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(input.length);
    for (let i = 0; i < input.length; i++) {
      expect(decoded[i]).toBeCloseTo(input[i], 3);
    }
  });

  it('preserves large buffer correctly', () => {
    // Create a 1024-sample buffer with varied values
    const input = new Float32Array(1024);
    for (let i = 0; i < input.length; i++) {
      input[i] = Math.sin((2 * Math.PI * i) / 100) * 0.8; // Sine wave
    }

    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(input.length);
    for (let i = 0; i < input.length; i++) {
      expect(decoded[i]).toBeCloseTo(input[i], 3);
    }
  });

  it('handles single sample round-trip', () => {
    const input = new Float32Array([0.333]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(1);
    expect(decoded[0]).toBeCloseTo(input[0], 3);
  });

  it('quantization error is within acceptable range', () => {
    // 16-bit PCM has 65536 levels
    // Maximum quantization error should be ~1/65536 = ~0.0000153
    const input = new Float32Array([0.123456789]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    const error = Math.abs(decoded[0] - input[0]);
    expect(error).toBeLessThan(0.001); // 0.1% tolerance
  });
});

describe('Edge cases', () => {
  it('handles alternating max values', () => {
    const input = new Float32Array([1.0, -1.0, 1.0, -1.0]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(4);
    // Check alternating pattern
    expect(decoded[0]).toBeGreaterThan(0.99);
    expect(decoded[1]).toBeLessThan(-0.99);
    expect(decoded[2]).toBeGreaterThan(0.99);
    expect(decoded[3]).toBeLessThan(-0.99);
  });

  it('handles very small non-zero values', () => {
    // Near the quantization limit
    const input = new Float32Array([0.00001, -0.00001]);
    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(2);
    // Values this small may quantize to 0
    expect(Math.abs(decoded[0])).toBeLessThan(0.001);
    expect(Math.abs(decoded[1])).toBeLessThan(0.001);
  });

  it('handles typical audio buffer size (2048 samples)', () => {
    const input = new Float32Array(2048);
    for (let i = 0; i < input.length; i++) {
      input[i] = (Math.random() * 2 - 1) * 0.5; // Random values -0.5 to 0.5
    }

    const encoded = float32ToBase64PCM(input);
    const decoded = base64PCMToFloat32(encoded);

    expect(decoded.length).toBe(2048);
    // Spot check a few values
    expect(decoded[0]).toBeCloseTo(input[0], 2);
    expect(decoded[1000]).toBeCloseTo(input[1000], 2);
    expect(decoded[2047]).toBeCloseTo(input[2047], 2);
  });
});
