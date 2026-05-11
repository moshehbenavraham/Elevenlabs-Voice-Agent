# Voice-Agent-PuPuPlatter

> **Project assembled by [AI with Apex](https://AIwithApex.com)**

## [VIDEO] Video Tutorial Series

Learn how to create and configure ElevenLabs agents (in general and) for this application:

| Tutorial                                                                                        | Description                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [DOCS] [Building Your First ElevenLabs Agent](https://youtu.be/oEkyNSWRqxc?si=30fMIpIhm0hgbzfz) | Complete walkthrough of creating your base conversational AI agent |
| [FILES] [Setting Up Knowledge Base (RAG)](https://youtu.be/S93uZ9Cuz4w?si=WxEtWKrEzx_e5XBL)     | Quick 60-second guide to prepare your agent's knowledge base       |
| [TOOLS] [Creating Agent Tools & Functions](https://youtu.be/jHTMYmptHI0?si=1O0kVsWjTDr6bbVC)    | Build your first agent tool for contact detail collection          |
| [NOTES] [Handling Call Transcripts](https://youtu.be/--j6hfnCc-w?si=Hz12v8ukPi4y2pU4)           | Process and manage post-call transcripts effectively               |
| [NEW] [Advanced Features & Configuration](https://youtu.be/55UJWHi_ZMk?si=p58wnk-bmEkgDg2_)     | Explore new features and advanced usage patterns                   |

---

A sophisticated multi-provider voice AI web application built with React 19, TypeScript, and support for 8 different voice AI providers. Experience real-time voice conversations with beautiful audio visualizations and a modern glassmorphism UI.

## Built With

- The very first version featured just the Elevenlabs Widget and was built with Lovable.dev and Cursor
- All revisions to the app since its initial launch were made with Claude Code Plugin Skill 'Apex Spec System':
  https://github.com/moshehbenavraham/apex-spec-system

## [FEATURES] Features

### Core Features

- **Real-time Voice Conversation**: Talk naturally with AI using multiple voice providers
- **8 Voice Providers**: ElevenLabs (Widget + SDK), xAI Grok, OpenAI Realtime, Ultravox, Vapi, Retell, and Google Gemini Live
- **Audio Visualization**: Beautiful 60fps audio visualizer with real-time frequency analysis
- **Glassmorphism Design**: Modern, premium UI with dark/light theme toggle
- **Mobile-First**: Responsive design optimized for all devices (375px to 1920px)
- **Accessibility**: Full keyboard navigation, ARIA support, and respects prefers-reduced-motion

### Advanced Features

- **Voice Selection UI**: Choose from multiple voices per provider
- **Real-time Transcript**: Live conversation transcript with user/AI message differentiation and auto-scroll
- **Automatic Reconnection**: WebSocket reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Function Calling**: AI can execute tools like weather lookup, time queries, and calculations
- **Connection Status**: Visual indicators for connecting, connected, reconnecting states
- **Voice Persistence**: Selected voice saved to localStorage across sessions
- **Docker Support**: Full containerization with Docker and docker-compose

### Testing Infrastructure

- **E2E Testing**: Playwright-based end-to-end testing with multi-browser support
- **Voice Flow Tests**: Comprehensive voice connection, transcript, and function calling tests
- **429+ Unit Tests**: Extensive test coverage including voice, contexts, hooks, and accessibility
- **Configuration Modal**: Settings modal for configuring voice providers

## [MIC] Multi-Provider Voice System

This application supports 8 voice AI providers through a tabbed interface:

### Supported Providers

| Provider              | Status    | Backend Required | Description                                                 |
| --------------------- | --------- | ---------------- | ----------------------------------------------------------- |
| **ElevenLabs Widget** | Available | No               | Pre-built embed from ElevenLabs CDN with customizable UI    |
| **ElevenLabs SDK**    | Available | No               | Custom React UI with @elevenlabs/react SDK                  |
| **xAI Grok**          | Available | Yes              | Grok-powered voice assistant with realtime API              |
| **OpenAI**            | Available | Yes              | GPT-4o realtime voice conversations with server VAD         |
| **Ultravox**          | Available | Yes              | Low-latency voice AI with call-based WebSocket connections  |
| **Vapi**              | Available | No               | Voice AI platform with Daily.co WebRTC and public web token |
| **Retell**            | Available | Yes              | Retell AI with LiveKit WebRTC and agent dashboard config    |
| **Gemini Live**       | Available | Yes              | Google Gemini Live with AudioWorklet and 30 HD voices       |

### Configuration

#### ElevenLabs Setup

```bash
# Add to your .env file (used by both Widget and SDK tabs)
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
VITE_ELEVENLABS_ENABLED=true      # Enable Widget tab
VITE_ELEVENLABS_SDK_ENABLED=true  # Enable SDK tab
```

#### xAI Grok Setup

```bash
# Server-side environment (xAI requires backend authentication)
XAI_API_KEY=your_xai_api_key_here

# Client-side (enable xAI in frontend)
VITE_XAI_ENABLED=true
VITE_XAI_VOICE=Ara  # Options: Ara, Eve, Leo, Rex, Sal
VITE_API_BASE_URL=http://localhost:3001
```

#### OpenAI Setup

```bash
# Server-side environment (OpenAI requires backend for ephemeral tokens)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Client-side (enable OpenAI in frontend)
VITE_OPENAI_ENABLED=true
VITE_OPENAI_VOICE=alloy  # Options: alloy, ash, ballad, coral, echo, sage, shimmer, verse
VITE_API_BASE_URL=http://localhost:3001
```

OpenAI uses the Realtime API with ephemeral tokens for secure WebSocket connections. The backend generates short-lived tokens (60s expiry) so your API key is never exposed to the client.

#### Ultravox Setup

```bash
# Server-side environment (Ultravox requires backend for call creation)
ULTRAVOX_API_KEY=your_ultravox_api_key_here

# Client-side (enable Ultravox in frontend)
VITE_ULTRAVOX_ENABLED=true
VITE_ULTRAVOX_VOICE=Mark
VITE_API_BASE_URL=http://localhost:3001
```

Ultravox uses a call-based model where the backend creates a call via REST API and returns a WebSocket joinUrl. The frontend connects using the ultravox-client SDK.

#### Vapi Setup

```bash
# Client-side only (Vapi uses public web token, no backend required)
VITE_VAPI_ENABLED=true
VITE_VAPI_WEB_TOKEN=your_public_web_token_here
VITE_VAPI_ASSISTANT_ID=your_assistant_id_here  # Optional
VITE_VAPI_VOICE=paula  # Default voice
VITE_VAPI_MODEL=gpt-3.5-turbo  # Model selection
```

Vapi uses a frontend-only integration with a public web token. The @vapi-ai/web SDK handles all connection and audio via Daily.co WebRTC. No backend is required.

#### Retell Setup

```bash
# Server-side environment (Retell requires backend for access tokens)
RETELL_API_KEY=key_your_retell_api_key_here

# Client-side (enable Retell in frontend)
VITE_RETELL_ENABLED=true
VITE_RETELL_AGENT_ID=your-retell-agent-id
VITE_API_BASE_URL=http://localhost:3001
```

Retell uses a backend-generated access token for secure WebRTC connections via LiveKit. The agent configuration (voice, LLM, prompts) is managed in the [Retell Dashboard](https://dashboard.retellai.com/). The `retell-client-js-sdk` handles audio streaming.

#### Gemini Live Setup

```bash
# Server-side environment (Gemini requires backend for ephemeral tokens)
GEMINI_API_KEY=your_gemini_api_key_here

# Client-side (enable Gemini in frontend)
VITE_GEMINI_ENABLED=true
VITE_GEMINI_VOICE=Puck  # Options: Puck, Charon, Kore, Fenrir, Aoede, + 25 more HD voices
VITE_API_BASE_URL=http://localhost:3001
```

Gemini Live uses ephemeral tokens from the backend for secure WebSocket connections. Features AudioWorklet-based audio capture (16kHz) and playback (24kHz), 30 HD voices, session timer with warnings, and thinking state visualization. Sessions are limited to 15 minutes.

### Provider Features

- **Smooth Tab Transitions**: Framer Motion animations for seamless provider switching
- **Empty State Guidance**: Clear setup instructions when providers aren't configured
- **Keyboard Navigation**: Arrow keys to navigate tabs, Enter/Space to select
- **Mobile Responsive**: Horizontal scrolling tabs on smaller screens
- **Touch Optimized**: 44px minimum touch targets for accessibility

## [DOCS] Documentation

This project includes comprehensive documentation:

### Getting Started

- **[Quick Start Guide](#-quick-start)** - Get up and running in minutes
- **[Installation & Configuration](#configuration)** - Detailed setup instructions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Docker/Coolify production deployment and split-hosting notes

### Technical Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design, components, and data flow
- **[API Integration Guide](docs/API_INTEGRATION.md)** - Voice SDK integration and best practices
- **[Voice Features Documentation](docs/VOICE_FEATURES.md)** - Voice orb, audio visualization, and voice interactions
- **[Mobile Optimization Guide](docs/MOBILE_OPTIMIZATION.md)** - Touch interactions, PWA features, and mobile performance

### AI-Assistant Documentation

- **[Claude Code Integration Guide](CLAUDE.md)** - Development commands, architecture overview, and guidelines for Claude Code

### Community & Support

- **[Contributing Guidelines](CONTRIBUTING.md)** - Development setup, code style, and contribution process
- **[Code of Conduct](docs/CODE_OF_CONDUCT.md)** - Community standards and guidelines
- **[Support Guide](docs/SUPPORT.md)** - Getting help, troubleshooting, and community resources
- **[Security Policy](docs/SECURITY.md)** - Vulnerability reporting and security best practices

### Help & Troubleshooting

- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues, solutions, and diagnostic tools
- **[Changelog](docs/CHANGELOG.md)** - Version history and release notes

### Quick Links

| Type      | Documentation                                   | Description                    |
| --------- | ----------------------------------------------- | ------------------------------ |
| [DEPLOY]  | **[Deployment](docs/DEPLOYMENT.md)**            | Production deployment guides   |
| [DEMO]    | **[Demo Mode](docs/DEMO_MODE.md)**              | ngrok demo mode setup          |
| [ARCH]    | **[Architecture](docs/ARCHITECTURE.md)**        | Technical system design        |
| [VOICE]   | **[Voice Features](docs/VOICE_FEATURES.md)**    | Voice AI functionality         |
| [MOBILE]  | **[Mobile Guide](docs/MOBILE_OPTIMIZATION.md)** | Mobile optimization            |
| [API]     | **[API Integration](docs/API_INTEGRATION.md)**  | Voice SDK integration guide    |
| [HELP]    | **[Troubleshooting](docs/TROUBLESHOOTING.md)**  | Problem resolution             |
| [AI]      | **[Claude Integration](CLAUDE.md)**             | AI assistant development guide |
| [CONTRIB] | **[Contributing](CONTRIBUTING.md)**             | Development guidelines         |
| [SECURE]  | **[Security](docs/SECURITY.md)**                | Security policies              |

## [START] Quick Start

### Prerequisites

- Node.js 18+ and npm (or Bun)
- Modern browser with microphone access
- Voice provider credentials (see provider setup sections above)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd Voice-Agent-PuPuPlatter

# Install dependencies
npm install
# or with Bun
bun install

# Copy environment template
cp .env.example .env
# Edit .env with your provider credentials

# Start development server (frontend only)
npm run dev

# Or start both frontend and backend
npm run dev:all
```

### Development Server

The frontend runs on port **8082** by default. The backend API server runs on port **3001**.

```bash
# Frontend only
npm run dev          # http://localhost:8082

# Frontend + Backend (for xAI, OpenAI, Ultravox, Retell)
npm run dev:all      # Frontend: 8082, Backend: 3001

# Backend only
npm run server       # http://localhost:3001
```

### Demo Mode (ngrok)

Demo mode exposes your local development environment via secure HTTPS tunnels for client demos, mobile testing, and team collaboration.

```bash
# Quick start
npm run demo
```

This builds the frontend, starts Express in production mode on port 3001, and exposes it through a single ngrok HTTPS tunnel. A shareable demo card is displayed:

```
+--------------------------------------------------------------+
|  Voice-Agent-PuPuPlatter - Demo Mode Active                  |
|                                                              |
|  Demo URL: https://abc123.ngrok-free.app                     |
|  Local:    http://localhost:3001                             |
|                                                              |
|  Press Ctrl+C to stop                                        |
+--------------------------------------------------------------+
```

**Prerequisites:**

- Install ngrok: `./scripts/ngrok/install-instructions.sh`
- Authenticate: `ngrok config add-authtoken YOUR_TOKEN`
- Install jq: `sudo apt install jq` (or `brew install jq`)

**Optional Configuration** (in `.env`):

```bash
NGROK_DOMAIN=myapp.ngrok.dev    # Custom domain (paid plans)
NGROK_AUTH_USER=demo            # Basic auth username
NGROK_AUTH_PASS=secretpass      # Basic auth password
```

See [docs/DEMO_MODE.md](docs/DEMO_MODE.md) for comprehensive documentation, troubleshooting, and provider-specific notes.

## [TOOLS] Technologies

- **Framework**: React 19.2, TypeScript 5.9
- **Build Tool**: Vite 7.2 with SWC for fast compilation
- **Styling**: Tailwind CSS 4.1, Framer Motion animations
- **Voice AI SDKs**:
  - @elevenlabs/react v0.12.3
  - @vapi-ai/web v2.5.2
  - ultravox-client v0.5.0
  - retell-client-js-sdk v2.0.7
  - @google/genai v1.37.0 (Gemini Live)
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **State Management**: React Context, TanStack Query
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Containerization**: Docker, docker-compose

## [MOBILE] Mobile Support

The app is built mobile-first with:

- Touch-optimized controls (44px+ tap targets)
- Responsive breakpoints: 375px -> 768px -> 1024px+
- Thumb-reachable CTAs in bottom 20% of viewport
- Optimized for both portrait and landscape orientations

## [DESIGN] Design System

### Color Palette

- **Primary**: Purple (#7C3AED) to Pink (#EC4899) gradients
- **Background**: Dark slate (#050714) with glassmorphism overlays
- **Glass**: Semi-transparent containers with backdrop blur
- **Text**: High contrast white/slate for accessibility

### Typography

- **Font**: Inter (300-700 weights)
- **Scale**: Mobile-first responsive scaling
- **Hierarchy**: Clear visual hierarchy with gradient text accents

### Animations

- **Duration**: 0.8s for major transitions, 0.2s for interactions
- **Easing**: `ease-out` for natural motion
- **Respect**: `prefers-reduced-motion` for accessibility

## [TEST] Testing

The project includes a comprehensive test suite:

```bash
# Run tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Test Coverage

- **623+ tests** covering components, contexts, hooks, and utilities
- **28 test files** with comprehensive coverage
- **Voice configuration tests** - Provider voice selection, persistence
- **Reconnection tests** - Backoff logic, retry limits, connection recovery
- **Conversation tests** - Message bubbles, transcript panel, auto-scroll
- **Function calling tests** - Tool definitions, execution, result handling
- **ProviderContext tests** - Provider selection, localStorage persistence
- **ProviderTabs tests** - Tab rendering, keyboard navigation, accessibility
- **Audio utilities tests** - PCM encoding/decoding, base64 conversion

### Test Categories

- **Unit Tests**: Component behavior, hooks, and utility functions
- **Accessibility Tests**: ARIA labels, keyboard navigation (Arrow keys, Tab, Enter)
- **Integration Tests**: Provider switching, voice connection flows
- **E2E Tests**: Full user flows with Playwright (Chromium, Firefox, WebKit)

## [DEPLOY] Deployment

### Build for Production

```bash
# Build the application
npm run build

# Preview production build locally
npm run preview
```

### Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Build and start the full-stack container
npm run docker:up

# Local production smoke test (start + health probe)
npm run docker:prod

# Check health
npm run docker:health

# Follow service logs
npm run docker:logs

# Stop containers
npm run docker:down
```

The combined Docker container serves the React app and Express API from `http://localhost:3001` by default.

### Deployment Options

#### Coolify / Docker (Recommended)

```bash
# Build Docker image
npm run docker:build

# Start the full-stack container locally
npm run docker:up
```

Coolify, a VPS, or another Docker-capable host can run the same full-stack container. Express serves both the frontend and API on port 3001.

For same-origin Docker production, set `VITE_API_BASE_URL=/` before building so browser API calls stay on the current host. Use an absolute `VITE_API_BASE_URL` only when the frontend and backend are deployed separately.

#### Split Frontend Hosting

```bash
# Build command: npm run build
# Publish directory: dist
```

Use Vercel, Netlify, or static hosting only when the Express backend is deployed separately and `VITE_API_BASE_URL` points to that backend.

#### Traditional Web Hosting

- Build the project with `npm run build`
- Upload the `dist` folder contents to your web server
- Ensure HTTPS is configured for microphone access

### Production Checklist

1. **Security**
   - Configure environment variables on your hosting platform (never commit `.env`)
   - Use server-side API key proxy for xAI, OpenAI, Ultravox, Retell
   - Enable HTTPS with valid SSL certificate
   - Set appropriate CORS origins in backend

2. **Backend Server**
   - Prefer the combined Docker app unless you explicitly split frontend/backend hosting
   - Configure `CORS_ORIGIN` to match your production origin when split hosting is used
   - Ensure API keys are set in server environment variables

3. **Environment Variables**

   ```bash
   # Frontend (build-time)
   VITE_ELEVENLABS_AGENT_ID=your_agent_id
   VITE_ELEVENLABS_ENABLED=true
   VITE_ELEVENLABS_SDK_ENABLED=true
   VITE_XAI_ENABLED=true
   VITE_OPENAI_ENABLED=true
   VITE_ULTRAVOX_ENABLED=true
   VITE_VAPI_ENABLED=true
   VITE_VAPI_WEB_TOKEN=your_web_token
   VITE_RETELL_ENABLED=true
   VITE_RETELL_AGENT_ID=your_retell_agent_id
   VITE_GEMINI_ENABLED=true
   VITE_GEMINI_VOICE=Puck
   # Combined Docker same-origin
   VITE_API_BASE_URL=/
   # Split hosting example:
   # VITE_API_BASE_URL=https://your-backend-api.com

   # Backend (runtime)
   ELEVENLABS_API_KEY=sk_xxx
   XAI_API_KEY=xai-xxx
   OPENAI_API_KEY=sk-xxx
   ULTRAVOX_API_KEY=your_ultravox_key
   RETELL_API_KEY=key_xxx
   GEMINI_API_KEY=your_gemini_key
   SERVER_PORT=3001
   HOST_PORT=3001
   CORS_ORIGIN=https://your-production-origin.com
   ```

4. **Browser Compatibility**
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari: Requires user gesture for AudioContext (handled automatically)
   - Mobile: Works on iOS Safari 15+ and Chrome for Android

5. **Reconnection Behavior**
   - Automatic reconnection on network interruption
   - Exponential backoff: 1s, 2s, 4s, 8s, up to 30s max
   - Maximum 10 retry attempts before giving up
   - User can manually reconnect after max retries

## [PERF] Performance

- **Audio Processing**: 60fps canvas animation with WebAudio API
- **Bundle Size**: Optimized with Vite tree-shaking
- **Loading**: Progressive enhancement with loading states
- **Accessibility**: Full ARIA support and keyboard navigation

## [SECURE] Privacy & Security

- **Audio Data**: Processed locally and streamed securely to voice providers
- **No Storage**: Conversations are not stored locally by default
- **Permissions**: Explicit microphone permission requests
- **HTTPS**: Required for microphone access in production
- **API Keys**: Server-side only for providers requiring backend

## [CONTRIB] Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

### Commit Convention

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Formatting changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## [ARCH] Architecture

```
src/
|-- components/          # Reusable UI components
|   |-- voice/           # Voice interaction components
|   |   |-- VoiceButton.tsx
|   |   |-- VoiceStatus.tsx
|   |   |-- VoiceVisualizer.tsx
|   |   |-- VoiceSelector.tsx
|   |   |-- VoiceWidget.tsx
|   |   |-- FunctionCallIndicator.tsx
|   |   \-- ReconnectionStatus.tsx
|   |-- providers/       # Provider-specific components
|   |   |-- ElevenLabsProvider.tsx
|   |   |-- OpenAIProvider.tsx
|   |   |-- XAIProvider.tsx
|   |   |-- UltravoxProvider.tsx
|   |   |-- VapiProvider.tsx
|   |   |-- RetellProvider.tsx
|   |   \-- GeminiProvider.tsx
|   |-- conversation/    # Conversation UI components
|   |   |-- ConversationPanel.tsx
|   |   |-- MessageBubble.tsx
|   |   |-- ElevenLabsConversationPanel.tsx
|   |   |-- OpenAIConversationPanel.tsx
|   |   |-- XAIConversationPanel.tsx
|   |   |-- UltravoxConversationPanel.tsx
|   |   |-- VapiConversationPanel.tsx
|   |   \-- GeminiConversationPanel.tsx
|   |-- tabs/            # Tab navigation
|   |   |-- ProviderTabs.tsx
|   |   \-- ProviderTab.tsx
|   |-- settings/        # Settings components
|   |   |-- ConfigurationDialog.tsx
|   |   |-- ProviderSettingsPanel.tsx
|   |   \-- ConnectionDiagnostics.tsx
|   |-- ui/              # shadcn/ui components
|   |-- BackgroundEffects.tsx
|   |-- HeroSection.tsx
|   |-- VoiceEnvironment.tsx
|   |-- ParticleSystem.tsx
|   \-- ThemeToggle.tsx
|-- contexts/            # React contexts
|   |-- ThemeContext.tsx
|   |-- VoiceContext.tsx       # ElevenLabs SDK state
|   |-- XAIVoiceContext.tsx
|   |-- OpenAIVoiceContext.tsx
|   |-- UltravoxVoiceContext.tsx
|   |-- VapiVoiceContext.tsx
|   |-- GeminiVoiceContext.tsx # Gemini Live state
|   \-- ProviderContext.tsx    # Active provider selection
|-- hooks/               # Custom React hooks
|   |-- useReconnection.ts     # WebSocket reconnection with backoff
|   |-- useVapiVoice.ts
|   |-- useRetellVoice.ts
|   |-- useUltravoxVoice.ts
|   |-- useOpenAIVoice.ts
|   |-- useXAIVoice.ts
|   |-- useGeminiVoice.ts      # Gemini Live hook
|   |-- useAccessibility.ts
|   |-- useReducedMotion.ts
|   \-- use-toast.ts
|-- lib/                 # Utility functions
|   |-- utils.ts
|   |-- audio/           # Audio processing utilities
|   |   \-- audioUtils.ts
|   |-- gemini/          # Gemini Live utilities
|   |   |-- audioUtils.ts       # PCM encoding/decoding (16kHz/24kHz)
|   |   |-- audio-recorder.ts   # Microphone capture (AudioWorklet)
|   |   |-- audio-streamer.ts   # Audio playback
|   |   |-- genai-live-client.ts # WebSocket client
|   |   |-- config.ts           # Voice/model configuration
|   |   \-- types.ts            # TypeScript interfaces
|   |-- worklets/        # AudioWorklet processors
|   |   \-- gemini-audio-worklet.ts
|   |-- tools/           # Function calling tool definitions
|   |   \-- toolDefinitions.ts
|   \-- vapi.ts          # Vapi utilities
|-- pages/               # Page components
|   |-- Index.tsx        # Main application page
|   \-- NotFound.tsx     # 404 page
|-- test/                # Test files (28 test files, 623+ tests)
|-- types/               # TypeScript type definitions
|   |-- ultravox.ts
|   |-- vapi.ts
|   |-- retell.ts
|   |-- gemini.ts        # Gemini types
|   \-- voice-provider.ts
\-- server/              # Backend API server
    |-- index.js         # Express server
    \-- routes/          # API routes
```

### Key Components

#### Provider System

Each voice provider has:

- **Provider Component** (`*Provider.tsx`): UI wrapper with buttons, status, visualizer
- **Voice Hook** (`use*Voice.ts`): Connection logic, state management, events
- **Voice Context** (`*VoiceContext.tsx`): Global state for the provider
- **Conversation Panel** (`*ConversationPanel.tsx`): Real-time transcript display

#### Tab Navigation

- `ProviderTabs.tsx` renders all enabled provider tabs
- Tabs are controlled via environment variables (`VITE_*_ENABLED`)
- Smooth Framer Motion transitions between providers
- Keyboard navigation with arrow keys

## [ISSUES] Known Issues & Browser Compatibility

### Browser Compatibility

- **Chrome/Edge**: Full feature support
- **Firefox**: Full support, some animation optimizations may vary
- **Safari**: WebAudio API requires user gesture for initialization
- **Mobile Browsers**: Optimized for mobile, background tab throttling may affect audio

### Known Issues

1. **HTTPS Requirement**: Microphone access requires HTTPS in production
2. **Safari WebAudio**: May require user interaction before audio processing starts
3. **Mobile Chrome**: Background tab throttling affects audio visualization
4. **Provider Configuration**: Each provider requires specific setup (see Configuration section)

### Troubleshooting

#### "Connection Failed" Error

- Verify your provider credentials are correctly configured
- Check browser console for specific error messages
- Ensure microphone permissions are granted
- Verify HTTPS is used in production
- For backend-requiring providers, ensure the backend is running

#### Audio Visualization Not Working

- Check browser compatibility with Web Audio API
- Ensure microphone permissions are granted
- Verify audio input device is working
- Check for browser tab throttling

#### Performance Issues

- Reduce animation complexity in settings
- Disable particle effects on lower-end devices
- Check for browser-specific optimizations

## [SETUP] Development Setup

### Prerequisites

- Node.js 18+ (or Bun)
- Modern browser with microphone support
- Voice provider credentials

### Development Commands

```bash
# Development server
npm run dev           # Frontend only
npm run dev:all       # Frontend + Backend
npm run server        # Backend only

# Build
npm run build         # Production build
npm run build:dev     # Development build
npm run preview       # Preview production build

# Code quality
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm run format:check  # Check formatting

# Testing
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:ui       # Visual UI
npm run test:e2e      # Playwright E2E

# Docker
npm run docker:build   # Build local image
npm run docker:up      # Build and start Compose stack
npm run docker:prod    # Start stack and run health probe
npm run docker:health  # Check /api/health
npm run docker:logs    # Follow Compose service logs
npm run docker:down    # Stop containers
```

### Environment Setup

1. Clone the repository
2. Install dependencies with `npm install` or `bun install`
3. Copy `.env.example` to `.env` and configure your credentials
4. Start development server with `npm run dev` (or `npm run dev:all` for full stack)
5. Open `http://localhost:8082` in your browser

## [LICENSE] License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## [THANKS] Acknowledgments

- [ElevenLabs](https://elevenlabs.io) for conversational AI technology
- [OpenAI](https://openai.com) for GPT-4o Realtime API
- [xAI](https://x.ai) for Grok voice assistant
- [Ultravox](https://ultravox.ai) for low-latency voice AI
- [Vapi](https://vapi.ai) for voice AI platform
- [Retell AI](https://retellai.com) for conversational AI
- [Google Gemini](https://ai.google.dev/gemini-api/docs/live) for Gemini Live API
- [Radix UI](https://radix-ui.com) for accessible UI primitives
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Framer Motion](https://framer.com/motion) for smooth animations
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [Vite](https://vitejs.dev) for fast development and building

---

**Current Version**: v1.0.31

**[!] Important**: For production use, implement proper API key management and server-side authentication for providers requiring backend support.
