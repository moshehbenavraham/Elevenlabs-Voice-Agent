
# ElevenLabs Voice Agent

> **Project assembled by [AI with Apex](https://AIwithApex.com)**  
> 🚀 **[Remix this project on Lovable](https://elevenlabs-voice-agent.lovable.app/)**  
> 💻 **Developed on [Lovable.dev](https://lovable.dev/)**

## 🎥 Video Tutorial Series

Learn how to create and configure ElevenLabs agents for this application:

| Tutorial | Description |
|----------|-------------|
| 📚 [Building Your First ElevenLabs Agent](https://youtu.be/oEkyNSWRqxc?si=30fMIpIhm0hgbzfz) | Complete walkthrough of creating your base conversational AI agent |
| 🗂️ [Setting Up Knowledge Base (RAG)](https://youtu.be/S93uZ9Cuz4w?si=WxEtWKrEzx_e5XBL) | Quick 60-second guide to prepare your agent's knowledge base |
| 🛠️ [Creating Agent Tools & Functions](https://youtu.be/jHTMYmptHI0?si=1O0kVsWjTDr6bbVC) | Build your first agent tool for contact detail collection |
| 📝 [Handling Call Transcripts](https://youtu.be/--j6hfnCc-w?si=Hz12v8ukPi4y2pU4) | Process and manage post-call transcripts effectively |
| ✨ [Advanced Features & Configuration](https://youtu.be/55UJWHi_ZMk?si=p58wnk-bmEkgDg2_) | Explore new features and advanced usage patterns |

---

A sophisticated voice AI web application built with React, TypeScript, and the ElevenLabs Conversational AI SDK. Experience real-time voice conversations with advanced AI featuring beautiful audio visualizations and a modern glassmorphism UI.

## ✨ Features

- **Real-time Voice Conversation**: Talk naturally with advanced AI using ElevenLabs technology
- **Audio Visualization**: Beautiful 60fps audio visualizer with real-time frequency analysis
- **Glassmorphism Design**: Modern, premium UI with dark/light theme toggle
- **Mobile-First**: Responsive design optimized for all devices (375px to 1920px)
- **Real-time Transcript**: Live conversation transcript with message history
- **Voice Intelligence**: Powered by ElevenLabs for the most natural voice interactions

## 📚 Documentation

This project includes comprehensive documentation to help you get started, contribute, and deploy successfully:

### 🔧 **Getting Started**
- **[Quick Start Guide](#-quick-start)** - Get up and running in minutes
- **[Installation & Configuration](#configuration)** - Detailed setup instructions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment for Vercel, Netlify, AWS, Firebase

### 🏗️ **Technical Documentation**
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design, components, and data flow
- **[API Integration Guide](docs/API_INTEGRATION.md)** - ElevenLabs React SDK integration and best practices
- **[Voice Features Documentation](docs/VOICE_FEATURES.md)** - Voice orb, audio visualization, and voice interactions
- **[Mobile Optimization Guide](docs/MOBILE_OPTIMIZATION.md)** - Touch interactions, PWA features, and mobile performance

### 🤖 **AI-Assistant Documentation**
- **[Claude Code Integration Guide](CLAUDE.md)** - Development commands, architecture overview, and guidelines for Claude Code

### 🤝 **Community & Support**
- **[Contributing Guidelines](CONTRIBUTING.md)** - Development setup, code style, and contribution process
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards and guidelines
- **[Support Guide](SUPPORT.md)** - Getting help, troubleshooting, and community resources
- **[Security Policy](SECURITY.md)** - Vulnerability reporting and security best practices

### 🔍 **Help & Troubleshooting**
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues, solutions, and diagnostic tools
- **[Changelog](CHANGELOG.md)** - Version history and release notes
- **[Issue Templates](.github/ISSUE_TEMPLATE/)** - Bug reports, feature requests, and voice integration issues
- **[License](LICENSE)** - MIT License terms and conditions

### 📋 **Quick Links**
| Type | Documentation | Description |
|------|---------------|-------------|
| 🚀 | **[Deployment](docs/DEPLOYMENT.md)** | Production deployment guides |
| 🏗️ | **[Architecture](docs/ARCHITECTURE.md)** | Technical system design |
| 🎤 | **[Voice Features](docs/VOICE_FEATURES.md)** | Voice AI functionality |
| 📱 | **[Mobile Guide](docs/MOBILE_OPTIMIZATION.md)** | Mobile optimization |
| 🔌 | **[API Integration](docs/API_INTEGRATION.md)** | ElevenLabs React SDK guide |
| 🆘 | **[Troubleshooting](docs/TROUBLESHOOTING.md)** | Problem resolution |
| 🤖 | **[Claude Integration](CLAUDE.md)** | AI assistant development guide |
| 🤝 | **[Contributing](CONTRIBUTING.md)** | Development guidelines |
| 🔒 | **[Security](SECURITY.md)** | Security policies |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- ElevenLabs account and Agent ID (React SDK handles authentication)
- Modern browser with microphone access

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd Elevenlabs-Voice-Agent

# Install dependencies (uses Bun for faster installation)
bun install
# or use npm
npm install

# Start development server
bun dev
# or use npm
npm run dev
```

### Configuration

1. **ElevenLabs Setup**:
   - Create an account at [ElevenLabs](https://elevenlabs.io)
   - Navigate to the Conversational AI section in your dashboard
   - Create a new conversational AI agent
   - Copy your Agent ID from the agent settings
   - Replace the placeholder in [`src/pages/Index.tsx:36`](src/pages/Index.tsx:36):
     ```typescript
     const agentId = 'INSERT YOUR AGENT ID HERE'; // Replace with your actual Agent ID
     ```

2. **Environment Configuration**:
   - **Current Implementation**: Mock/demo setup for development
   - **Production Requirements**:
     - Implement server-side signed URL generation for security
     - Set up proper authentication with ElevenLabs API
     - Configure HTTPS for microphone access
   - **Browser Permissions**: Microphone access will be requested on first use

3. **Important Notes**:
   - This is currently a **demo implementation** with hardcoded agent ID
   - For production use, implement proper API key management on your backend
   - The app uses the ElevenLabs React SDK for real-time conversation handling

## 🛠 Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: Tailwind CSS, Framer Motion animations
- **Voice AI**: @11labs/react SDK v0.1.4
- **Audio Processing**: Web Audio API, Canvas API for visualizations
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Routing**: React Router v6
- **State Management**: React hooks with custom state management
- **Icons**: Lucide React
- **Theming**: next-themes for dark/light mode
- **Notifications**: Sonner for toast notifications
- **Package Manager**: Bun (with npm fallback support)

## 📱 Mobile Support

The app is built mobile-first with:
- Touch-optimized controls (44px+ tap targets)
- Responsive breakpoints: 375px → 768px → 1024px+
- Thumb-reachable CTAs in bottom 20% of viewport
- Optimized for both portrait and landscape orientations

## 🎨 Design System

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

## 🧪 Testing

**Note**: Testing infrastructure is not currently set up in this project. To add testing capabilities:

```bash
# Install testing dependencies
bun add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom

# Add test scripts to package.json
```

### Recommended Test Strategy
- **Unit Tests**: Component behavior and props validation
- **Integration Tests**: Hook interactions and ElevenLabs React SDK integration
- **Accessibility Tests**: ARIA labels, keyboard navigation, screen reader compatibility
- **Visual Tests**: Theme switching, responsive behavior, animation states
- **Audio Tests**: Microphone permissions, audio visualization, conversation flow

## 🚀 Deployment

### Build for Production
```bash
# Build the application
bun run build
# or
npm run build

# Preview production build locally
bun run preview
# or
npm run preview
```

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build command: npm run build
# Publish directory: dist
```

#### Traditional Web Hosting
- Build the project with `npm run build`
- Upload the `dist` folder contents to your web server
- Ensure HTTPS is configured for microphone access

### Production Considerations
- **HTTPS Required**: Microphone access requires HTTPS in production
- **ElevenLabs API**: Implement server-side signed URL generation
- **Error Handling**: Add proper error boundaries and fallbacks
- **Performance**: Enable gzip compression and CDN for static assets

## 📊 Performance

- **Audio Processing**: 60fps canvas animation with WebAudio API
- **Bundle Size**: Optimized with Vite tree-shaking
- **Loading**: Progressive enhancement with loading states
- **Accessibility**: Full ARIA support and keyboard navigation

## 🔒 Privacy & Security

- **Audio Data**: Processed locally and streamed securely to ElevenLabs
- **No Storage**: Conversations are not stored locally
- **Permissions**: Explicit microphone permission requests
- **HTTPS**: Required for microphone access in production

## 🤝 Contributing

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

## 📖 Architecture

```
src/
├── components/          # Reusable UI components
│   ├── VoiceOrb.tsx    # Main voice interaction component
│   ├── AudioVisualizer.tsx # Real-time audio visualization
│   ├── ThemeToggle.tsx # Dark/light theme switcher
│   ├── HeroSection.tsx # Landing page hero
│   ├── BackgroundEffects.tsx # Dynamic background animations
│   ├── VoiceEnvironment.tsx # Voice environment visualization
│   ├── ParticleSystem.tsx # Particle effects
│   ├── AnimatedText.tsx # Text animations
│   ├── ThemeCustomizer.tsx # Theme customization
│   └── ui/             # shadcn/ui components
│       ├── button.tsx  # Button component
│       ├── card.tsx    # Card component
│       ├── dialog.tsx  # Dialog component
│       └── ... (50+ UI components)
├── contexts/           # React contexts
│   └── ThemeContext.tsx # Theme management
├── hooks/              # Custom React hooks
│   ├── useElevenLabsConversation.ts # ElevenLabs integration
│   ├── useVoiceAnimations.ts # Voice animation logic
│   ├── usePerformanceOptimization.ts # Performance hooks
│   ├── useMobileOptimization.ts # Mobile-specific optimizations
│   ├── useAccessibility.ts # Accessibility features
│   └── use-toast.ts    # Toast notifications
├── pages/              # Page components
│   ├── Index.tsx       # Main application page
│   └── NotFound.tsx    # 404 page
└── lib/                # Utility functions
    └── utils.ts        # Helper functions and utilities
```

### Key Components

#### VoiceOrb Component
- Central voice interaction interface
- Real-time audio visualization
- Connection status indicators
- Touch and click interactions

#### ElevenLabs Integration
- Real-time conversation handling via [`useElevenLabsConversation.ts`](src/hooks/useElevenLabsConversation.ts)
- Message transcription and history
- Connection state management
- Error handling and recovery

#### Audio Visualization
- 60fps Canvas-based audio visualization
- Real-time frequency analysis
- Dynamic particle effects
- Performance-optimized rendering

## 🐛 Known Issues & Browser Compatibility

### Browser Compatibility
- **Chrome/Edge**: Full feature support ✅
- **Firefox**: Full support, some animation optimizations may vary ✅
- **Safari**: WebAudio API requires user gesture for initialization ⚠️
- **Mobile Browsers**: Optimized for mobile, background tab throttling may affect audio ⚠️

### Known Issues
1. **Agent ID Configuration**: Must replace placeholder in [`src/pages/Index.tsx:36`](src/pages/Index.tsx:36)
2. **Safari WebAudio**: May require user interaction before audio processing starts
3. **Mobile Chrome**: Background tab throttling affects audio visualization
4. **HTTPS Requirement**: Microphone access requires HTTPS in production
5. **Demo Implementation**: Current implementation is for demo purposes only

### Troubleshooting

#### "Connection Failed" Error
- Verify your ElevenLabs Agent ID is correctly configured
- Check browser console for specific error messages
- Ensure microphone permissions are granted
- Verify HTTPS is used in production

#### Audio Visualization Not Working
- Check browser compatibility with Web Audio API
- Ensure microphone permissions are granted
- Verify audio input device is working
- Check for browser tab throttling

#### Performance Issues
- Reduce animation complexity in [`src/components/VoiceEnvironment.tsx`](src/components/VoiceEnvironment.tsx)
- Disable particle effects on lower-end devices
- Check for browser-specific optimizations

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm
- Modern browser with microphone support
- ElevenLabs account and Agent ID

### Development Commands
```bash
# Development server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

### Environment Setup
1. Clone the repository
2. Install dependencies with `bun install`
3. Configure your ElevenLabs Agent ID in [`src/pages/Index.tsx:36`](src/pages/Index.tsx:36)
4. Start development server with `bun dev`
5. Open `http://localhost:5173` in your browser

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io) for conversational AI technology
- [Radix UI](https://radix-ui.com) for accessible UI primitives
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Framer Motion](https://framer.com/motion) for smooth animations
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [Vite](https://vitejs.dev) for fast development and building

---

**⚠️ Important**: This is a demo implementation. For production use, implement proper API key management and server-side authentication with ElevenLabs.
