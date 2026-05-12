import { describe, expect, it } from 'vitest';

interface SecurityConfig {
  readonly ok: boolean;
  readonly isProduction: boolean;
  readonly origins: readonly string[];
  readonly hasWildcard: boolean;
  readonly usingFallback: boolean;
  readonly allowLocalhostProductionOrigins: boolean;
  readonly issues: readonly string[];
  readonly warnings: readonly string[];
}

interface SecurityModule {
  readonly DEFAULT_DEV_ORIGIN: string;
  readonly DEFAULT_JSON_BODY_LIMIT: string;
  readonly OPENAI_TRANSLATION_TOKEN_ENDPOINT_PATH: string;
  readonly TOKEN_ENDPOINT_PATHS: readonly string[];
  normalizeOrigin: (value: unknown) => string | null;
  parseAllowedOrigins: (
    value: unknown,
    options?: { readonly isProduction?: boolean }
  ) => {
    readonly configured: boolean;
    readonly usingFallback: boolean;
    readonly origins: readonly string[];
    readonly invalid: readonly string[];
    readonly hasWildcard: boolean;
  };
  validateProductionSecurityConfig: (options?: {
    readonly nodeEnv?: string;
    readonly corsOrigin?: string;
    readonly isProduction?: boolean;
    readonly isDemoMode?: boolean;
    readonly allowLocalhostProductionOrigins?: boolean;
  }) => SecurityConfig;
  isOriginAllowed: (origin: string | undefined, securityConfig: SecurityConfig) => boolean;
  getSecurityHeaderValues: (options?: {
    readonly isProduction?: boolean;
  }) => Record<string, string>;
  validateAllowedKeys: (
    value: unknown,
    allowedKeys: readonly string[],
    field?: string
  ) => { readonly valid: boolean; readonly error?: { readonly message: string } };
  validateString: (
    value: unknown,
    options?: {
      readonly field?: string;
      readonly required?: boolean;
      readonly maxLength?: number;
      readonly pattern?: RegExp;
    }
  ) => {
    readonly valid: boolean;
    readonly value?: string;
    readonly error?: { readonly message: string };
  };
  validateInteger: (
    value: unknown,
    options?: {
      readonly field?: string;
      readonly required?: boolean;
      readonly min?: number;
      readonly max?: number;
      readonly defaultValue?: number;
    }
  ) => {
    readonly valid: boolean;
    readonly value?: number;
    readonly error?: { readonly message: string };
  };
  validateOptionalObject: (
    value: unknown,
    options?: {
      readonly field?: string;
      readonly maxDepth?: number;
      readonly maxKeys?: number;
      readonly maxStringLength?: number;
      readonly allowedKeys?: readonly string[];
    }
  ) => { readonly valid: boolean; readonly error?: { readonly message: string } };
  mapProviderError: (
    provider: string,
    status: number
  ) => { readonly error: string; readonly message: string };
  getGeminiBrowserTokenPolicy: (options?: {
    readonly nodeEnv?: string;
    readonly isProduction?: boolean;
  }) => {
    readonly canReturnRawApiKey: boolean;
    readonly status: string;
    readonly message: string;
  };
  getJsonBodyLimit: (env?: Record<string, string | undefined>) => string;
}

const modulePath = '../../server/utils/security.js';
const security = (await import(modulePath)) as SecurityModule;

describe('server security utilities', () => {
  it('normalizes exact origins and rejects unsafe production CORS configuration', () => {
    expect(security.normalizeOrigin('https://voice.example.com/')).toBe(
      'https://voice.example.com'
    );
    expect(security.normalizeOrigin('ftp://voice.example.com')).toBeNull();

    const development = security.parseAllowedOrigins('', { isProduction: false });
    expect(development.usingFallback).toBe(true);
    expect(development.origins).toEqual([security.DEFAULT_DEV_ORIGIN]);

    const production = security.validateProductionSecurityConfig({
      nodeEnv: 'production',
      corsOrigin: 'https://voice.example.com, https://admin.example.com/',
    });
    expect(production.ok).toBe(true);
    expect(production.origins).toEqual(['https://voice.example.com', 'https://admin.example.com']);

    const wildcard = security.validateProductionSecurityConfig({
      nodeEnv: 'production',
      corsOrigin: '*',
    });
    expect(wildcard.ok).toBe(false);
    expect(wildcard.issues.join(' ')).toContain('CORS_ORIGIN=*');

    const localhostOnly = security.validateProductionSecurityConfig({
      nodeEnv: 'production',
      corsOrigin: 'http://localhost:8082',
    });
    expect(localhostOnly.ok).toBe(false);
    expect(localhostOnly.issues.join(' ')).toContain('localhost-only');

    const localDockerSmoke = security.validateProductionSecurityConfig({
      nodeEnv: 'production',
      corsOrigin: 'http://localhost:3001',
      allowLocalhostProductionOrigins: true,
    });
    expect(localDockerSmoke.ok).toBe(true);
    expect(localDockerSmoke.allowLocalhostProductionOrigins).toBe(true);
    expect(localDockerSmoke.warnings.join(' ')).toContain('local Docker smoke tests');
  });

  it('allows no-origin requests while enforcing configured browser origins', () => {
    const config = security.validateProductionSecurityConfig({
      nodeEnv: 'production',
      corsOrigin: 'https://voice.example.com',
    });

    expect(security.isOriginAllowed(undefined, config)).toBe(true);
    expect(security.isOriginAllowed('https://voice.example.com', config)).toBe(true);
    expect(security.isOriginAllowed('https://evil.example.com', config)).toBe(false);
    expect(security.isOriginAllowed('not an origin', config)).toBe(false);
  });

  it('builds browser security headers with production HSTS', () => {
    const development = security.getSecurityHeaderValues({ isProduction: false });
    expect(development['Content-Security-Policy']).toContain("default-src 'self'");
    expect(development['Content-Security-Policy']).toContain('https://frontend-cdn.perplexity.ai');
    expect(development['X-Content-Type-Options']).toBe('nosniff');
    expect(development['X-Frame-Options']).toBe('DENY');
    expect(development['Referrer-Policy']).toBe('no-referrer');
    expect(development['Permissions-Policy']).toContain('microphone=(self)');
    expect(development['Strict-Transport-Security']).toBeUndefined();

    const production = security.getSecurityHeaderValues({ isProduction: true });
    expect(production['Strict-Transport-Security']).toContain('max-age=31536000');
  });

  it('validates payload shape, string bounds, integer ranges, and object bounds', () => {
    expect(security.validateAllowedKeys({ model: 'demo' }, ['model']).valid).toBe(true);
    expect(security.validateAllowedKeys({ extra: true }, ['model']).error?.message).toContain(
      'unsupported field'
    );

    expect(
      security.validateString('valid-model_1', {
        field: 'model',
        required: true,
        maxLength: 32,
        pattern: /^[A-Za-z0-9._-]+$/,
      }).valid
    ).toBe(true);
    expect(
      security.validateString('bad model!', {
        field: 'model',
        pattern: /^[A-Za-z0-9._-]+$/,
      }).valid
    ).toBe(false);

    expect(security.validateInteger(60, { field: 'expirySeconds', min: 60, max: 3600 }).valid).toBe(
      true
    );
    expect(
      security.validateInteger(999999, { field: 'expirySeconds', min: 60, max: 3600 }).valid
    ).toBe(false);

    expect(
      security.validateOptionalObject(
        { metadata: { nested: 'ok' } },
        { field: 'metadata', maxDepth: 2, maxKeys: 4, maxStringLength: 16 }
      ).valid
    ).toBe(true);
    expect(
      security.validateOptionalObject(
        { metadata: { nested: { tooDeep: true } } },
        { field: 'metadata', maxDepth: 1 }
      ).valid
    ).toBe(false);
  });

  it('publishes token endpoint coverage and blocks raw Gemini key return in production', () => {
    expect(security.OPENAI_TRANSLATION_TOKEN_ENDPOINT_PATH).toBe('/api/openai/translation-session');
    expect(security.TOKEN_ENDPOINT_PATHS).toEqual([
      '/api/openai/session',
      security.OPENAI_TRANSLATION_TOKEN_ENDPOINT_PATH,
      '/api/xai/session',
      '/api/elevenlabs/signed-url',
      '/api/ultravox/call',
      '/api/retell/create-web-call',
      '/api/gemini/session',
    ]);
    expect(security.TOKEN_ENDPOINT_PATHS).toContain(
      security.OPENAI_TRANSLATION_TOKEN_ENDPOINT_PATH
    );
    expect(
      security.TOKEN_ENDPOINT_PATHS.filter(
        (path) => path === security.OPENAI_TRANSLATION_TOKEN_ENDPOINT_PATH
      )
    ).toHaveLength(1);

    expect(security.mapProviderError('xAI', 429)).toEqual({
      error: 'xAI API error',
      message: 'xAI rate limit exceeded',
    });

    expect(security.getGeminiBrowserTokenPolicy({ nodeEnv: 'production' })).toMatchObject({
      canReturnRawApiKey: false,
      status: 'blocked-in-production',
    });
    expect(security.getGeminiBrowserTokenPolicy({ nodeEnv: 'development' })).toMatchObject({
      canReturnRawApiKey: true,
      status: 'development-compatibility',
    });
  });

  it('uses an explicit JSON body limit with environment override support', () => {
    expect(security.getJsonBodyLimit({})).toBe(security.DEFAULT_JSON_BODY_LIMIT);
    expect(security.getJsonBodyLimit({ JSON_BODY_LIMIT: '64kb' })).toBe('64kb');
  });
});
