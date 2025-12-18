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
- **Voice AI**: @elevenlabs/react SDK v0.1.4 for conversational AI
- **Animations**: Framer Motion for smooth transitions
- **State**: React Context (theme), Tanstack Query (server state), custom hooks

### Project Structure

```
src/
├── components/          # UI components
│   ├── voice/          # Voice-specific components
│   │   ├── VoiceButton.tsx # Voice interaction button
│   │   ├── VoiceStatus.tsx # Connection status display
│   │   └── VoiceVisualizer.tsx # Audio visualization component
│   ├── BackgroundEffects.tsx # Dynamic background animations
│   ├── HeroSection.tsx # Landing page hero section
│   ├── VoiceEnvironment.tsx # 3D voice environment
│   ├── ConfigurationModal.tsx # Settings modal
│   └── ui/             # 50+ shadcn/ui components
├── hooks/              # Business logic
│   ├── useAccessibility.ts # Accessibility features
│   ├── use-mobile.tsx  # Mobile detection hook
│   └── use-toast.ts    # Toast notifications
├── pages/              # Route components
│   ├── Index.tsx       # Main app page (uses env vars for Agent ID)
│   └── NotFound.tsx    # 404 error page
├── test/               # Test infrastructure
│   ├── setup.ts        # Test configuration and mocks
│   └── App.test.tsx    # Basic app tests
├── contexts/           # Global state
│   ├── ThemeContext.tsx # Dark/light theme management
│   └── VoiceContext.tsx # Voice state management
└── lib/                # Utilities
    └── utils.ts        # Helper functions
```

### Environment Variables

- **Required**: `.env` file with ElevenLabs credentials (not tracked by git)
- **Template**: `.env.example` shows required format
- **Variables**:
  - `VITE_ELEVENLABS_AGENT_ID` - ElevenLabs Agent ID for voice conversations
  - `VITE_ELEVENLABS_API_KEY` - ElevenLabs API key (if needed for future features)
  - `VITE_NODE_ENV` - Development environment flag

### Key Integration Points

1. **ElevenLabs Voice Agent**:
   - Agent ID is configured via environment variable `VITE_ELEVENLABS_AGENT_ID`
   - Uses ElevenLabs React SDK Conversation component
   - Requires HTTPS in production for microphone access

2. **Audio Visualization**:
   - `VoiceVisualizer.tsx` uses Web Audio API for real-time frequency analysis
   - Canvas-based rendering optimized for 60fps
   - Integrates with voice state from conversation events

3. **Theme System**:
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
   - Voice state: VoiceContext and ElevenLabs SDK

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
