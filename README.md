
# VoiceAI - Conversational Intelligence

A cutting-edge voice AI web application built with React, ElevenLabs, and modern web technologies. Experience the future of voice interaction with real-time conversational AI that feels natural and intelligent.

## ✨ Features

- **Real-time Voice Conversation**: Talk naturally with advanced AI using ElevenLabs technology
- **Audio Visualization**: Beautiful 60fps audio visualizer with real-time frequency analysis
- **Glassmorphism Design**: Modern, premium UI with dark/light theme toggle
- **Mobile-First**: Responsive design optimized for all devices (375px to 1920px)
- **Real-time Transcript**: Live conversation transcript with message history
- **Voice Intelligence**: Powered by ElevenLabs for the most natural voice interactions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- ElevenLabs API key and Agent ID
- Modern browser with microphone access

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd voiceai-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. **ElevenLabs Setup**:
   - Create an account at [ElevenLabs](https://elevenlabs.io)
   - Create a conversational AI agent
   - Get your Agent ID from the ElevenLabs dashboard
   - Update the agent ID in `src/pages/Index.tsx`

2. **Environment Variables**:
   - No environment variables needed for the frontend
   - ElevenLabs API key handling is done client-side for demo purposes
   - For production, implement server-side signed URL generation

## 🛠 Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Voice AI**: @11labs/react SDK
- **Audio**: Web Audio API, Canvas API
- **UI Components**: shadcn/ui
- **Testing**: Jest, React Testing Library

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

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Strategy
- **Unit Tests**: Component behavior and props
- **Integration Tests**: Hook interactions and state management
- **Accessibility Tests**: ARIA labels, keyboard navigation
- **Visual Tests**: Theme switching, responsive behavior

## 🚀 Deployment

### Lovable.dev (Recommended)
```bash
# Deploy to Lovable
lovable deploy
```

### Manual Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

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
│   └── HeroSection.tsx # Landing page hero
├── contexts/           # React contexts
│   └── ThemeContext.tsx # Theme management
├── hooks/              # Custom React hooks
│   └── useElevenLabsConversation.ts # ElevenLabs integration
├── pages/              # Page components
│   └── Index.tsx       # Main application page
└── lib/                # Utility functions
    └── utils.ts        # Helper functions
```

## 🐛 Known Issues

- **Safari**: WebAudio API may require user gesture for initialization
- **Firefox**: Some audio visualization features may have reduced performance
- **Mobile Chrome**: Background tab throttling may affect audio processing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io) for voice AI technology
- [Lovable.dev](https://lovable.dev) for development platform
- [shadcn/ui](https://ui.shadcn.com) for UI components
- [Framer Motion](https://framer.com/motion) for animations

---

Built with ❤️ using Lovable.dev
