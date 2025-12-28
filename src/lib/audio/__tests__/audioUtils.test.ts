import { describe, it, expect } from 'vitest';
import {
  encodeBase64,
  decodeBase64,
  floatToPcm16,
  pcm16ToFloat,
  int16ToBytes,
  bytesToInt16,
  encodeAudioForXAI,
  decodeAudioFromXAI,
  resampleAudio,
  XAI_SAMPLE_RATE,
  XAI_BIT_DEPTH,
  XAI_CHANNELS,
} from '../audioUtils';

describe('audioUtils', () => {
  describe('constants', () => {
    it('exports correct xAI audio format constants', () => {
      expect(XAI_SAMPLE_RATE).toBe(24000);
      expect(XAI_BIT_DEPTH).toBe(16);
      expect(XAI_CHANNELS).toBe(1);
    });
  });

  describe('encodeBase64', () => {
    it('encodes Uint8Array to base64 string', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = encodeBase64(data);
      expect(result).toBe('SGVsbG8=');
    });

    it('handles empty array', () => {
      const data = new Uint8Array([]);
      const result = encodeBase64(data);
      expect(result).toBe('');
    });

    it('handles binary data with zeros', () => {
      const data = new Uint8Array([0, 1, 2, 3]);
      const result = encodeBase64(data);
      expect(result).toBe('AAECAw==');
    });
  });

  describe('decodeBase64', () => {
    it('decodes base64 string to Uint8Array', () => {
      const base64 = 'SGVsbG8='; // "Hello"
      const result = decodeBase64(base64);
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it('handles empty string', () => {
      const result = decodeBase64('');
      expect(result).toEqual(new Uint8Array([]));
    });

    it('roundtrips correctly', () => {
      const original = new Uint8Array([0, 128, 255, 64, 32]);
      const encoded = encodeBase64(original);
      const decoded = decodeBase64(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('floatToPcm16', () => {
    it('converts float samples to PCM 16-bit', () => {
      const float32 = new Float32Array([0, 0.5, -0.5, 1, -1]);
      const result = floatToPcm16(float32);

      expect(result[0]).toBe(0); // 0 stays 0
      expect(result[1]).toBeCloseTo(16383, 0); // 0.5 * 0x7fff
      expect(result[2]).toBeCloseTo(-16384, 0); // -0.5 * 0x8000
      expect(result[3]).toBe(32767); // 1 * 0x7fff
      expect(result[4]).toBe(-32768); // -1 * 0x8000
    });

    it('clamps values outside [-1, 1] range', () => {
      const float32 = new Float32Array([1.5, -1.5]);
      const result = floatToPcm16(float32);

      expect(result[0]).toBe(32767); // Clamped to max
      expect(result[1]).toBe(-32768); // Clamped to min
    });
  });

  describe('pcm16ToFloat', () => {
    it('converts PCM 16-bit to float samples', () => {
      const pcm16 = new Int16Array([0, 16384, -16384, 32767, -32768]);
      const result = pcm16ToFloat(pcm16);

      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(0.5, 1);
      expect(result[2]).toBeCloseTo(-0.5, 1);
      expect(result[3]).toBeCloseTo(1, 1);
      expect(result[4]).toBe(-1);
    });

    it('roundtrips approximately with floatToPcm16', () => {
      const original = new Float32Array([0, 0.25, -0.25, 0.75, -0.75]);
      const pcm = floatToPcm16(original);
      const roundtrip = pcm16ToFloat(pcm);

      for (let i = 0; i < original.length; i++) {
        expect(roundtrip[i]).toBeCloseTo(original[i], 2);
      }
    });
  });

  describe('int16ToBytes', () => {
    it('converts Int16Array to little-endian bytes', () => {
      const int16 = new Int16Array([0x0102, 0x0304]);
      const result = int16ToBytes(int16);

      // Little-endian: low byte first
      expect(result[0]).toBe(0x02);
      expect(result[1]).toBe(0x01);
      expect(result[2]).toBe(0x04);
      expect(result[3]).toBe(0x03);
    });

    it('handles negative values correctly', () => {
      const int16 = new Int16Array([-1]); // 0xFFFF in two's complement
      const result = int16ToBytes(int16);

      expect(result[0]).toBe(0xff);
      expect(result[1]).toBe(0xff);
    });
  });

  describe('bytesToInt16', () => {
    it('converts little-endian bytes to Int16Array', () => {
      const bytes = new Uint8Array([0x02, 0x01, 0x04, 0x03]);
      const result = bytesToInt16(bytes);

      expect(result[0]).toBe(0x0102);
      expect(result[1]).toBe(0x0304);
    });

    it('roundtrips with int16ToBytes', () => {
      const original = new Int16Array([1000, -1000, 32767, -32768, 0]);
      const bytes = int16ToBytes(original);
      const roundtrip = bytesToInt16(bytes);

      expect(roundtrip).toEqual(original);
    });
  });

  describe('encodeAudioForXAI', () => {
    it('combines floatToPcm16, int16ToBytes, and encodeBase64', () => {
      const float32 = new Float32Array([0, 0.5, -0.5]);
      const result = encodeAudioForXAI(float32);

      // Verify it produces a non-empty base64 string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Verify it can be decoded back
      const decoded = decodeBase64(result);
      expect(decoded.length).toBe(float32.length * 2); // 2 bytes per sample
    });
  });

  describe('decodeAudioFromXAI', () => {
    it('combines decodeBase64, bytesToInt16, and pcm16ToFloat', () => {
      // Create known PCM16 data
      const pcm16 = new Int16Array([0, 16384, -16384]);
      const bytes = int16ToBytes(pcm16);
      const base64 = encodeBase64(bytes);

      const result = decodeAudioFromXAI(base64);

      expect(result.length).toBe(3);
      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(0.5, 1);
      expect(result[2]).toBeCloseTo(-0.5, 1);
    });

    it('roundtrips with encodeAudioForXAI', () => {
      const original = new Float32Array([0, 0.25, -0.25, 0.5, -0.5]);
      const encoded = encodeAudioForXAI(original);
      const decoded = decodeAudioFromXAI(encoded);

      for (let i = 0; i < original.length; i++) {
        expect(decoded[i]).toBeCloseTo(original[i], 2);
      }
    });
  });

  describe('resampleAudio', () => {
    it('returns same array if sample rates match', () => {
      const input = new Float32Array([1, 2, 3, 4, 5]);
      const result = resampleAudio(input, 24000, 24000);
      expect(result).toBe(input);
    });

    it('downsamples correctly (48kHz to 24kHz)', () => {
      // 10 samples at 48kHz = 5 samples at 24kHz
      const input = new Float32Array([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
      const result = resampleAudio(input, 48000, 24000);

      expect(result.length).toBe(5);
      // Linear interpolation should produce intermediate values
      expect(result[0]).toBeCloseTo(0, 2);
      expect(result[2]).toBeCloseTo(0.4, 2);
    });

    it('upsamples correctly (24kHz to 48kHz)', () => {
      const input = new Float32Array([0, 1]);
      const result = resampleAudio(input, 24000, 48000);

      expect(result.length).toBe(4);
      expect(result[0]).toBeCloseTo(0, 2);
      expect(result[1]).toBeCloseTo(0.5, 2);
      expect(result[2]).toBeCloseTo(1, 2);
    });

    it('handles empty input', () => {
      const input = new Float32Array([]);
      const result = resampleAudio(input, 48000, 24000);
      expect(result.length).toBe(0);
    });
  });
});
