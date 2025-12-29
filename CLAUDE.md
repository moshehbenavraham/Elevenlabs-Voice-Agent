# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- **Start dev server**: `npm run dev` or `bun dev` - Runs on port 8082
- **Build production**: `npm run build` - Creates optimized build in `dist/`
- **Build development**: `npm run build:dev` - Development mode build
- **Preview build**: `npm run preview` - Preview production build locally
- **Lint code**: `npm run lint` - Run ESLint checks (MVP config: warnings only)
- **Format code**: `npm run format` - Format source files with Prettier
- **Check formatting**: `npm run format:check` - Check Prettier formatting without changes

### Testing

- **Run tests**: `npm run test` - Interactive test watcher with Vitest
- **Run tests once**: `npm run test:run` - Single test run for CI/CD
- **Test UI**: `npm run test:ui` - Visual test interface
- **Test setup**: Vitest + React Testing Library + jsdom environment
- **Mocks included**: Web Audio API, IntersectionObserver, ResizeObserver, matchMedia

## Architecture

### Technology Stack

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **UI Components**: Radix UI primitives wrapped in shadcn/ui pattern
- **Voice AI**: @elevenlabs/react SDK v0.12.1, OpenAI Realtime API, xAI Realtime API
- **Animations**: Framer Motion for smooth transitions
- **State**: React Context (theme), Tanstack Query (server state), custom hooks

### Project Structure

```
src/
|-- components/          # UI components
|   |-- voice/          # Voice-specific components
|   |   |-- VoiceButton.tsx # Voice interaction button
|   |   |-- VoiceStatus.tsx # Connection status display
|   |   |-- VoiceVisualizer.tsx # Audio visualization component
|   |   |-- VoiceSelector.tsx # Voice selection dropdown (Phase 02)
|   |   |-- ConversationPanel.tsx # Real-time transcript display (Phase 02)
|   |   |-- MessageBubble.tsx # Individual message component (Phase 02)
|   |   `-- FunctionCallIndicator.tsx # Function execution UI (Phase 02)
|   |-- providers/      # Provider-specific components
|   |   |-- ElevenLabsProvider.tsx # ElevenLabs voice interface
|   |   |-- OpenAIProvider.tsx # OpenAI Realtime interface
|   |   `-- XAIProvider.tsx # xAI Grok interface
|   |-- tabs/           # Tab navigation
|   |   |-- ProviderTabs.tsx # Provider tab container
|   |   `-- ProviderTab.tsx # Individual tab component
|   |-- BackgroundEffects.tsx # Dynamic background animations
|   |-- HeroSection.tsx # Landing page hero section
|   |-- VoiceEnvironment.tsx # 3D voice environment
|   |-- ConfigurationModal.tsx # Settings modal
|   `-- ui/             # 50+ shadcn/ui components
|-- hooks/              # Business logic
|   |-- useAccessibility.ts # Accessibility features
|   |-- useReconnection.ts # WebSocket reconnection with backoff (Phase 02)
|   |-- use-mobile.tsx  # Mobile detection hook
|   `-- use-toast.ts    # Toast notifications
|-- pages/              # Route components
|   |-- Index.tsx       # Main app page (uses env vars for Agent ID)
|   `-- NotFound.tsx    # 404 error page
|-- test/               # Test infrastructure (174+ tests)
|   |-- setup.ts        # Test configuration and mocks
|   |-- useReconnection.test.ts # Reconnection logic tests
|   |-- voiceConfig.test.ts # Voice selection tests
|   |-- ConversationPanel.test.tsx # Transcript tests
|   `-- ... (14 test files total)
|-- contexts/           # Global state
|   |-- ThemeContext.tsx # Dark/light theme management
|   |-- VoiceContext.tsx # ElevenLabs voice state
|   |-- XAIVoiceContext.tsx # xAI voice state with reconnection (Phase 02)
|   |-- OpenAIVoiceContext.tsx # OpenAI voice state with reconnection (Phase 02)
|   `-- ProviderContext.tsx # Active provider selection
`-- lib/                # Utilities
    |-- utils.ts        # Helper functions
    |-- audio/          # Audio processing (Phase 02)
    |   `-- audioUtils.ts # PCM encoding, base64 conversion
    `-- tools/          # Function calling (Phase 02)
        `-- toolDefinitions.ts # Weather, time, calculator tools
```

### Environment Variables

- **Required**: `.env` file with credentials (not tracked by git)
- **Template**: `.env.example` shows required format
- **Frontend Variables** (VITE\_ prefix):
  - `VITE_ELEVENLABS_AGENT_ID` - ElevenLabs Agent ID (used by both Widget and SDK)
  - `VITE_ELEVENLABS_ENABLED` - Enable ElevenLabs Widget tab (true/false)
  - `VITE_ELEVENLABS_SDK_ENABLED` - Enable ElevenLabs SDK tab (true/false)
  - `VITE_XAI_ENABLED` - Enable xAI provider tab (true/false)
  - `VITE_OPENAI_ENABLED` - Enable OpenAI provider tab (true/false)
  - `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3001)
  - `VITE_OPENAI_VOICE` / `VITE_XAI_VOICE` - Default voice selection
- **Backend Variables** (server-side only):
  - `ELEVENLABS_API_KEY` - ElevenLabs API key
  - `XAI_API_KEY` - xAI API key for Grok
  - `OPENAI_API_KEY` - OpenAI API key for Realtime API
  - `CORS_ORIGIN` - Allowed frontend origin

### Key Integration Points

1. **ElevenLabs Voice Agent** (Two Modes Available as Separate Tabs):
   - **Widget Mode** (`elevenlabs` tab): Pre-built embed from ElevenLabs CDN
     - Uses `VoiceWidget.tsx` component with `<elevenlabs-convai>` web component
     - Customizable via VITE_WIDGET_* environment variables (colors, text, avatar)
     - Self-contained UI - no custom components needed
   - **SDK Mode** (`elevenlabs-sdk` tab): Custom React UI with @elevenlabs/react SDK
     - Uses `VoiceContext.tsx` with `useConversation()` hook
     - Full control over UI with VoiceButton, VoiceVisualizer, VoiceStatus components
     - Access to MediaStream for custom audio processing
   - Agent ID shared via `VITE_ELEVENLABS_AGENT_ID`
   - Requires HTTPS in production for microphone access

2. **OpenAI Realtime API** (Phase 02):
   - Uses ephemeral tokens from backend (60s expiry for security)
   - WebSocket connection at `wss://api.openai.com/v1/realtime`
   - Protocol array auth: `['realtime', 'openai-insecure-api-key.{token}']`
   - 8 voices available: alloy, ash, ballad, coral, echo, sage, shimmer, verse

3. **xAI Realtime API** (Phase 02):
   - Uses ephemeral tokens from backend
   - WebSocket connection at `wss://api.x.ai/v1/realtime`
   - 5 voices available: ash, ballad, coral, sage, verse

4. **Reconnection with Backoff** (Phase 02):
   - Automatic reconnection on WebSocket disconnect
   - Exponential backoff: 1s, 2s, 4s, 8s, up to 30s max
   - Maximum 10 retry attempts
   - `useReconnection.ts` hook handles logic

5. **Function Calling** (Phase 02):
   - Tool definitions in `lib/tools/toolDefinitions.ts`
   - Demo tools: weather, time, calculator
   - Results displayed via `FunctionCallIndicator.tsx`
   - AI incorporates function results into responses

6. **Audio Visualization**:
   - `VoiceVisualizer.tsx` uses Web Audio API for real-time frequency analysis
   - Canvas-based rendering optimized for 60fps
   - Integrates with voice state from conversation events

7. **Theme System**:
   - Glassmorphism design with backdrop-filter effects
   - Theme toggle persists to localStorage
   - CSS variables defined in Tailwind config

### Development Guidelines

1. **Component Patterns**:
   - Use TypeScript interfaces for all props
   - Follow existing shadcn/ui component patterns in `components/ui/`
   - Animations should respect `prefers-reduced-motion`

2. **Performance**:
   - Audio visualizations are throttled to 60fps
   - Mobile optimizations via `use-mobile` hook
   - Lazy loading for heavy components

3. **State Management**:
   - Theme: Context API (`ThemeContext`)
   - Server data: Tanstack Query
   - Local state: Custom hooks pattern
   - Voice state: Provider-specific contexts (`VoiceContext`, `XAIVoiceContext`, `OpenAIVoiceContext`)
   - Provider selection: `ProviderContext` with localStorage persistence
   - Reconnection state: `useReconnection` hook (Phase 02)
   - Conversation history: Stored in provider contexts (Phase 02)

4. **Styling**:
   - Tailwind utilities first
   - Custom CSS only for complex animations
   - Glassmorphism effects use backdrop-blur and semi-transparent backgrounds

### Production Considerations

1. **Security**:
   - Environment variables properly configured (.env ignored by git)
   - API keys stored in environment variables (not hardcoded)
   - Consider backend proxy for production API key management
   - Never commit .env files to repository

2. **Browser Requirements**:
   - HTTPS required for microphone access
   - Modern browser with Web Audio API support
   - Safari may require user gesture for audio initialization

3. **Mobile Support**:
   - Touch targets minimum 44px
   - Responsive breakpoints: 375px, 768px, 1024px
   - Background tab throttling affects audio visualization
