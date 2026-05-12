import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authTokensCreate: vi.fn(),
  GoogleGenAI: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: mocks.GoogleGenAI,
}));

// @ts-expect-error The Express route is implemented as a JS module.
const { createEphemeralToken } = await import('../../server/routes/gemini.js');

describe('Gemini session route helpers', () => {
  beforeEach(() => {
    mocks.authTokensCreate.mockReset();
    mocks.GoogleGenAI.mockReset();
    mocks.GoogleGenAI.mockImplementation(function MockGoogleGenAI() {
      return {
        authTokens: {
          create: mocks.authTokensCreate,
        },
      };
    });
  });

  it('creates a browser-safe Gemini Live auth token with v1alpha token options', async () => {
    mocks.authTokensCreate.mockResolvedValue({ name: 'auth_tokens/test-token' });

    const result = await createEphemeralToken(
      'server-api-key',
      'gemini-2.5-flash-native-audio-preview-12-2025'
    );

    expect(result).toMatchObject({
      success: true,
      token: 'auth_tokens/test-token',
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    });
    expect(mocks.GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'server-api-key' });

    const request = mocks.authTokensCreate.mock.calls[0]?.[0];
    expect(request).toMatchObject({
      config: {
        uses: 1,
        liveConnectConstraints: {
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        },
        lockAdditionalFields: [],
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });
    expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
    expect(Date.parse(request.config.expireTime)).toBeGreaterThan(Date.now());
    expect(Date.parse(request.config.newSessionExpireTime)).toBeGreaterThan(Date.now());
  });

  it('returns an error when Gemini does not return a token name', async () => {
    mocks.authTokensCreate.mockResolvedValue({});

    const result = await createEphemeralToken('server-api-key', 'gemini-live-model');

    expect(result).toMatchObject({
      success: false,
      status: 500,
      error: {
        error: 'Gemini API error',
        message: 'Failed to create Gemini session',
      },
    });
  });
});
