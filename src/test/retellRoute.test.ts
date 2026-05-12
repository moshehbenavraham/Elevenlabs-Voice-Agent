import { describe, expect, it } from 'vitest';

interface RetellRouteModule {
  mapRetellApiError: (status: number) => { readonly error: string; readonly message: string };
}

const modulePath = '../../server/routes/retell.js';
const { mapRetellApiError } = (await import(modulePath)) as RetellRouteModule;

describe('Retell route helpers', () => {
  it('maps Retell agent lookup failures to an actionable configuration message', () => {
    expect(mapRetellApiError(404)).toEqual({
      error: 'Retell API error',
      message:
        'Retell agent not found. Verify VITE_RETELL_AGENT_ID belongs to the account used by RETELL_API_KEY.',
    });
  });

  it('keeps Retell auth failures generic', () => {
    expect(mapRetellApiError(401)).toEqual({
      error: 'Retell API error',
      message: 'Invalid Retell API key',
    });
  });
});
