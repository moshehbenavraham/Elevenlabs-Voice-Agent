export const DEFAULT_AGENT_NAME: string;
export const DEFAULT_SESSION_SECONDS: number;
export function getLiveKitConfig(env?: Record<string, string | undefined>): {
  enabled: boolean;
  configured: boolean;
  missing: string[];
  agentName: string;
  maxSessionSeconds: number;
  agentWaitSeconds: number;
  serverUrl: string | undefined;
  apiKey: string | undefined;
  apiSecret: string | undefined;
};
