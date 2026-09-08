export const DEFAULT_AGENT_NAME = 'pupuplatter-livekit-demo';
export const DEFAULT_SESSION_SECONDS = 600;

export function getLiveKitConfig(env = process.env) {
  const configured = (value) =>
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !/your[_ -]|[<>]|placeholder|example\.com/i.test(value);
  const enabled = /^(true|1)$/i.test(env.LIVEKIT_ENABLED ?? env.VITE_LIVEKIT_ENABLED ?? 'false');
  const required = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'];
  const missing = required.filter((name) => !configured(env[name]));
  let validUrl = false;
  try {
    const url = new URL(env.LIVEKIT_URL);
    validUrl =
      url.protocol === 'wss:' && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    /* Invalid or absent server URL. */
  }
  const agentName = env.LIVEKIT_AGENT_NAME || DEFAULT_AGENT_NAME;
  const maxSessionSeconds = Number(env.LIVEKIT_SESSION_MAX_SECONDS ?? DEFAULT_SESSION_SECONDS);
  const agentWaitSeconds = Number(env.LIVEKIT_AGENT_WAIT_SECONDS ?? 30);
  const valid =
    missing.length === 0 &&
    validUrl &&
    /^[a-zA-Z0-9_-]{1,80}$/.test(agentName) &&
    Number.isInteger(maxSessionSeconds) &&
    maxSessionSeconds >= 30 &&
    maxSessionSeconds <= 1800 &&
    Number.isInteger(agentWaitSeconds) &&
    agentWaitSeconds >= 5 &&
    agentWaitSeconds <= 120;
  return {
    enabled,
    configured: valid,
    missing,
    agentName,
    maxSessionSeconds,
    agentWaitSeconds,
    serverUrl: env.LIVEKIT_URL,
    apiKey: env.LIVEKIT_API_KEY,
    apiSecret: env.LIVEKIT_API_SECRET,
  };
}
