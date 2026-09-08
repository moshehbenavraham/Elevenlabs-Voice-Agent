export interface LiveKitConfig {
  enabled: boolean;
  configured: boolean;
  agentOnline: null;
  maxSessionSeconds: number;
}

export interface LiveKitMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  final: boolean;
}

export type LiveKitPhase = 'idle' | 'starting' | 'active' | 'ending' | 'ended' | 'error';
