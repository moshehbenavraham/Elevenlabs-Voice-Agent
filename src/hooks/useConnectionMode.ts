export type ConnectionMode = 'agent-sdk' | 'widget';

export function useConnectionMode(): ConnectionMode {
  const mode = import.meta.env.VITE_VOICE_CONNECTION_MODE;

  if (mode === 'widget') {
    return 'widget';
  }

  return 'agent-sdk'; // default
}
