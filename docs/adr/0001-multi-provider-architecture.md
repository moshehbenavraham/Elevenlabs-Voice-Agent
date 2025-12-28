# 1. Multi-Provider Voice Architecture

**Status:** Accepted
**Date:** 2025-12-28

## Context

The application originally supported only ElevenLabs voice agent. There was a need to support multiple voice AI providers (xAI Grok, future OpenAI, Gemini, etc.) while maintaining a clean user experience and extensible architecture.

## Decision

Implement a provider abstraction layer with:

1. **Separate Contexts**: Each provider has its own React context (`VoiceContext` for ElevenLabs, `XAIVoiceContext` for xAI)
2. **Tab-Based UI**: Radix UI Tabs for provider switching with Framer Motion animations
3. **Provider Context**: Central `ProviderContext` tracks active provider selection
4. **Disconnect on Switch**: Active connections are closed before switching providers

## Consequences

### Positive
- Clean separation of provider-specific logic
- Easy to add new providers without modifying existing code
- Each provider manages its own connection lifecycle
- Shared UI components (VoiceButton, VoiceVisualizer) can be reused with provider-specific styling

### Negative
- Some code duplication between provider components
- Larger bundle size with multiple provider implementations
- More complex state management with multiple contexts

### Neutral
- Requires backend endpoints for each provider that needs server-side authentication
- localStorage used for persisting provider preference
