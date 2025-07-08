# Contributing to ElevenLabs Voice Agent

Thank you for your interest in contributing to the ElevenLabs Voice Agent! This document provides guidelines and instructions for contributing to the project.

## 🚀 Quick Start

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`
4. **Make your changes** following our guidelines
5. **Test thoroughly** including voice features
6. **Submit a pull request**

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Component Development Patterns](#component-development-patterns)
- [Testing Requirements](#testing-requirements)
- [ElevenLabs Integration Guidelines](#elevenlabs-integration-guidelines)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Process](#pull-request-process)
- [Voice Testing Procedures](#voice-testing-procedures)
- [Mobile Testing Guidelines](#mobile-testing-guidelines)
- [Accessibility Requirements](#accessibility-requirements)
- [Community Guidelines](#community-guidelines)

## 🔧 Development Setup

### Prerequisites

- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher (or yarn/pnpm equivalent)
- **Git**: Latest version
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Microphone**: For testing voice features
- **ElevenLabs Account**: For API integration testing

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/elevenlabs-voice-agent.git
   cd elevenlabs-voice-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your ElevenLabs API key and configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Verify setup**
   - Open `http://localhost:5173` in your browser
   - Allow microphone permissions when prompted
   - Test basic voice functionality

### Development Tools

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Vite**: Build tool and dev server
- **React DevTools**: Browser extension for debugging

## 🎨 Code Style Guidelines

### TypeScript Standards

- Use **strict TypeScript** configuration
- Prefer **interfaces** over types for object shapes
- Use **proper typing** for all props and function parameters
- Avoid `any` type - use proper type definitions

```typescript
// ✅ Good
interface VoiceConfig {
  agentId: string;
  model: string;
  voice: string;
}

// ❌ Avoid
const config: any = { agentId: "123", model: "test" };
```

### React Patterns

- Use **functional components** with hooks
- Prefer **custom hooks** for complex logic
- Use **React.memo** for performance optimization when appropriate
- Follow **single responsibility principle** for components

```typescript
// ✅ Good - Custom hook for voice logic
const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // Hook logic here
  return { isRecording, audioStream, startRecording, stopRecording };
};
```

### Naming Conventions

- **Components**: PascalCase (`VoiceOrb`, `AudioVisualizer`)
- **Hooks**: camelCase with "use" prefix (`useVoiceRecording`)
- **Constants**: UPPER_SNAKE_CASE (`AUDIO_SAMPLE_RATE`)
- **Variables/Functions**: camelCase (`handleVoiceStart`)
- **Files**: PascalCase for components, camelCase for utilities

### Code Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs)
│   └── voice/          # Voice-specific components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── services/           # API and external service integrations
```

## 🧩 Component Development Patterns

### Component Structure

```typescript
// ComponentName.tsx
import React from 'react';
import { ComponentNameProps } from './types';
import styles from './ComponentName.module.css';

export const ComponentName: React.FC<ComponentNameProps> = ({ 
  prop1, 
  prop2,
  ...props 
}) => {
  // Hooks at the top
  const [state, setState] = useState(initialState);
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Render
  return (
    <div className={styles.container} {...props}>
      {/* JSX content */}
    </div>
  );
};
```

### Props Interface

```typescript
// types.ts
export interface ComponentNameProps {
  // Required props
  id: string;
  title: string;
  
  // Optional props
  className?: string;
  onAction?: (data: ActionData) => void;
  
  // Voice-specific props
  voiceEnabled?: boolean;
  audioConfig?: AudioConfig;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```

### Voice Component Patterns

- Always handle **microphone permissions** gracefully
- Implement **loading states** for voice operations
- Provide **visual feedback** for voice interactions
- Include **error boundaries** for voice features
- Support **keyboard navigation** as alternative

## 🧪 Testing Requirements

### Unit Testing

- **Test Coverage**: Aim for 80%+ coverage
- **Test Framework**: Jest with React Testing Library
- **Voice Mocking**: Mock ElevenLabs API responses
- **Audio Mocking**: Mock Web Audio API for testing

```typescript
// Example test
describe('VoiceOrb', () => {
  it('should request microphone permission on activation', async () => {
    const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);
    global.navigator.mediaDevices = { getUserMedia: mockGetUserMedia };
    
    render(<VoiceOrb />);
    
    const activateButton = screen.getByRole('button', { name: /activate voice/i });
    fireEvent.click(activateButton);
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
  });
});
```

### Integration Testing

- Test **voice workflow** end-to-end
- Test **mobile responsiveness**
- Test **browser compatibility**
- Test **accessibility features**

### Performance Testing

- Monitor **bundle size** impact
- Test **audio processing** performance
- Verify **memory usage** doesn't leak
- Test **battery impact** on mobile

## 🎤 ElevenLabs Integration Guidelines

### API Key Management

- **Never commit** API keys to version control
- Use **environment variables** for configuration
- Implement **key validation** and error handling
- Support **multiple environments** (dev, staging, prod)

### Error Handling

```typescript
try {
  const response = await elevenLabsClient.conversationStart(config);
  handleSuccess(response);
} catch (error) {
  if (error.status === 401) {
    handleAuthError();
  } else if (error.status === 429) {
    handleRateLimitError();
  } else {
    handleGenericError(error);
  }
}
```

### Voice Configuration

- Use **sensible defaults** for voice settings
- Allow **user customization** of voice parameters
- Implement **voice model selection**
- Support **multiple languages** where applicable

## 📝 Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or fixing tests
- **chore**: Maintenance tasks

### Examples

```
feat(voice): add voice animation system
fix(mobile): resolve touch interaction issues
docs(api): update ElevenLabs integration guide
style(ui): improve button component styling
perf(audio): optimize real-time audio processing
```

### Scope Guidelines

- **voice**: Voice-related features
- **ui**: User interface components
- **mobile**: Mobile-specific changes
- **api**: API integration changes
- **a11y**: Accessibility improvements
- **perf**: Performance optimizations

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with main branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run quality checks**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

3. **Test voice features**
   - Test in multiple browsers
   - Test on mobile devices
   - Test with different audio devices
   - Test accessibility features

### PR Template

- Use the provided PR template
- Fill out all sections completely
- Include screenshots/recordings for UI changes
- List any breaking changes
- Update documentation if needed

### Review Process

1. **Automated checks** must pass
2. **Code review** by at least one maintainer
3. **Manual testing** of voice features
4. **Accessibility review** for UI changes
5. **Performance review** for significant changes

### Review Criteria

- **Code quality**: Follows style guidelines
- **Functionality**: Works as described
- **Voice integration**: Proper ElevenLabs integration
- **Mobile compatibility**: Works on mobile devices
- **Accessibility**: Meets accessibility standards
- **Performance**: No significant performance regression
- **Documentation**: Updated if needed

## 🎤 Voice Testing Procedures

### Manual Testing Checklist

- [ ] **Microphone permissions** work correctly
- [ ] **Voice recording** starts and stops properly
- [ ] **Audio playback** works without issues
- [ ] **Voice animations** respond correctly
- [ ] **Audio visualization** displays properly
- [ ] **Error handling** works for voice failures
- [ ] **Mobile voice** features work on touch devices
- [ ] **Accessibility** features work with screen readers

### Browser Testing

Test voice features in:
- **Chrome** (latest 2 versions)
- **Firefox** (latest 2 versions)
- **Safari** (latest 2 versions)
- **Edge** (latest 2 versions)
- **Mobile browsers** (iOS Safari, Android Chrome)

### Audio Device Testing

Test with different audio devices:
- **Built-in microphone** and speakers
- **USB headsets**
- **Bluetooth headphones**
- **External microphones**
- **Mobile device** built-in audio

### Performance Testing

Monitor:
- **CPU usage** during voice processing
- **Memory usage** over extended use
- **Battery drain** on mobile devices
- **Network usage** for API calls
- **Response times** for voice operations

## 📱 Mobile Testing Guidelines

### Device Testing

Test on representative devices:
- **iOS**: iPhone (latest 2 generations)
- **Android**: Samsung, Google Pixel devices
- **Tablets**: iPad, Android tablets
- **Various screen sizes**: Small, medium, large

### Mobile-Specific Features

- **Touch interactions** work correctly
- **Responsive design** adapts properly
- **Voice features** work on mobile
- **Performance** is acceptable on mobile
- **Battery usage** is reasonable

### Mobile Testing Checklist

- [ ] **Touch targets** are appropriately sized
- [ ] **Gestures** work correctly
- [ ] **Orientation changes** handled properly
- [ ] **Mobile browsers** support all features
- [ ] **Network conditions** handled gracefully
- [ ] **Battery optimization** doesn't break features

## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance

- **Color contrast**: 4.5:1 minimum ratio
- **Keyboard navigation**: All interactive elements
- **Screen reader**: Proper ARIA labels and descriptions
- **Focus management**: Logical focus order
- **Audio alternatives**: Visual indicators for audio

### Voice Accessibility

- **Visual feedback** for voice interactions
- **Keyboard alternatives** for voice commands
- **Screen reader** announcements for voice status
- **Caption support** for audio content
- **Reduced motion** options for animations

### Accessibility Testing

- **Keyboard navigation**: Tab through all interactive elements
- **Screen reader**: Test with NVDA, JAWS, or VoiceOver
- **High contrast**: Test in high contrast mode
- **Reduced motion**: Test with reduced motion preferences
- **Color blindness**: Test with color blindness simulators

### Accessibility Checklist

- [ ] **Alt text** for all images
- [ ] **ARIA labels** for complex interactions
- [ ] **Focus indicators** visible and clear
- [ ] **Heading structure** logical and semantic
- [ ] **Form labels** properly associated
- [ ] **Error messages** clear and helpful
- [ ] **Voice alternatives** for non-voice users

## 🤝 Community Guidelines

### Code of Conduct

- Be **respectful** and **inclusive**
- **Help others** learn and contribute
- **Give constructive feedback**
- **Follow** our Code of Conduct
- **Report** inappropriate behavior

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Discussions**: General questions and ideas
- **Discord**: Real-time community chat (if available)

### Contributing Areas

- **Code**: Features, bug fixes, improvements
- **Documentation**: Guides, tutorials, API docs
- **Testing**: Manual testing, automated tests
- **Design**: UI/UX improvements, accessibility
- **Community**: Helping others, triaging issues

### Recognition

Contributors are recognized through:
- **GitHub contributors** list
- **Release notes** attribution
- **Community highlights**
- **Contributor badges**

## 📚 Resources

### Development Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)

### Testing Resources

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Web Audio API Testing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)

### Accessibility Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)

### Voice Development Resources

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Voice User Interface Guidelines](https://developer.amazon.com/en-US/docs/alexa/voice-design/design-checklist.html)

## 🆘 Getting Help

### Development Questions

1. **Search existing issues** and discussions
2. **Check documentation** and resources
3. **Ask in GitHub Discussions**
4. **Join community chat** (if available)

### Bug Reports

1. **Use bug report template**
2. **Provide detailed reproduction steps**
3. **Include environment information**
4. **Test voice features specifically**

### Feature Requests

1. **Use feature request template**
2. **Describe use case and benefits**
3. **Consider voice integration impact**
4. **Discuss with community first**

---

Thank you for contributing to ElevenLabs Voice Agent! Your contributions help make voice AI more accessible and powerful for everyone. 🎤✨