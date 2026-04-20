import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConfiguredRetellAgentId } from './retell.js';
import { getConfiguredUltravoxOptions } from './ultravox.js';

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.RETELL_AGENT_ID;
  delete process.env.VITE_RETELL_AGENT_ID;
  delete process.env.ULTRAVOX_SYSTEM_PROMPT;
  delete process.env.ULTRAVOX_VOICE;
  delete process.env.ULTRAVOX_MODEL;
  delete process.env.VITE_ULTRAVOX_INSTRUCTIONS;
  delete process.env.VITE_ULTRAVOX_VOICE;
  delete process.env.VITE_ULTRAVOX_MODEL;
});

describe('provider route config', () => {
  it('prefers the trusted server-side Retell agent ID', () => {
    vi.stubEnv('RETELL_AGENT_ID', 'server-agent');
    vi.stubEnv('VITE_RETELL_AGENT_ID', 'client-agent');

    expect(getConfiguredRetellAgentId()).toEqual({
      valid: true,
      agentId: 'server-agent',
    });
  });

  it('rejects the placeholder Retell agent ID', () => {
    vi.stubEnv('VITE_RETELL_AGENT_ID', 'your-retell-agent-id');

    expect(getConfiguredRetellAgentId()).toEqual({
      valid: false,
      error: {
        error: 'Server configuration error',
        message: 'Retell agent ID not configured',
      },
    });
  });

  it('prefers trusted Ultravox server-side settings over VITE fallbacks', () => {
    vi.stubEnv('ULTRAVOX_SYSTEM_PROMPT', 'server prompt');
    vi.stubEnv('ULTRAVOX_VOICE', 'ServerVoice');
    vi.stubEnv('ULTRAVOX_MODEL', 'server-model');
    vi.stubEnv('VITE_ULTRAVOX_INSTRUCTIONS', 'client prompt');
    vi.stubEnv('VITE_ULTRAVOX_VOICE', 'ClientVoice');
    vi.stubEnv('VITE_ULTRAVOX_MODEL', 'client-model');

    expect(getConfiguredUltravoxOptions()).toEqual({
      systemPrompt: 'server prompt',
      voice: 'ServerVoice',
      model: 'server-model',
    });
  });

  it('falls back to defaults for Ultravox when no env overrides are set', () => {
    expect(getConfiguredUltravoxOptions()).toEqual({
      systemPrompt: 'You are a helpful voice assistant. Keep responses conversational and concise.',
      voice: undefined,
      model: undefined,
    });
  });
});
