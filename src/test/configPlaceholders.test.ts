import { describe, expect, it } from 'vitest';
import {
  hasConfiguredValue as hasConfiguredFrontendValue,
  isPlaceholderConfigValue,
} from '@/lib/configPlaceholders';
import { hasConfiguredValue as hasConfiguredServerValue } from '../../shared/config-placeholders.mjs';

describe('runtime configuration placeholder detection', () => {
  it.each([
    undefined,
    null,
    '',
    '   ',
    '<your-key>',
    'your_api_key',
    'your-key',
    'placeholder',
    'https://voice.example.com',
  ])('rejects setup value %j in the browser and server', (value) => {
    expect(isPlaceholderConfigValue(value)).toBe(true);
    expect(hasConfiguredFrontendValue(value)).toBe(false);
    expect(hasConfiguredServerValue(value)).toBe(false);
  });

  it.each(['sk-real-value', 'agent_123', 'wss://project.livekit.cloud'])(
    'accepts configured value %j in the browser and server',
    (value) => {
      expect(isPlaceholderConfigValue(value)).toBe(false);
      expect(hasConfiguredFrontendValue(value)).toBe(true);
      expect(hasConfiguredServerValue(value)).toBe(true);
    }
  );
});
