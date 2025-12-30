/**
 * Type verification file for Vapi SDK integration
 * This file confirms TypeScript can resolve @vapi-ai/web module types
 */

import Vapi from '@vapi-ai/web';
import type { CreateAssistantDTO } from '@vapi-ai/web/dist/api';

// Type exports for use in VapiVoiceContext (Session 02)
export type { CreateAssistantDTO };

// Re-export Vapi class type for typing hook returns
export type VapiInstance = InstanceType<typeof Vapi>;

// Vapi event types for type-safe event handling
export interface VapiCallState {
  isCallActive: boolean;
  isMuted: boolean;
  volumeLevel: number;
}

export interface VapiTranscript {
  role: 'user' | 'assistant';
  text: string;
  isFinal: boolean;
}
