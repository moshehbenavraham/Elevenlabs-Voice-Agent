import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App } from '../App';

// Mock the pages to avoid complex component rendering with animations
vi.mock('../pages/Index', () => ({
  Index: () => <div data-testid="index-page">Index Page</div>,
}));

vi.mock('../pages/NotFound', () => ({
  NotFound: () => <div data-testid="not-found-page">Not Found</div>,
}));

// Mock the contexts to prevent initialization issues
vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('@/contexts/VoiceContext', () => ({
  VoiceProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useVoice: () => ({
    isConnected: false,
    isLoading: false,
    isSpeaking: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('@/contexts/ProviderContext', () => ({
  ProviderProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useProvider: () => ({
    activeProvider: 'elevenlabs',
    setActiveProvider: vi.fn(),
    isProviderAvailable: vi.fn(() => true),
    providers: ['elevenlabs', 'xai', 'openai'],
  }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    // Basic test to ensure the app renders
    expect(document.body).toBeInTheDocument();
  });

  it('renders the app component', () => {
    const { container } = render(<App />);
    // Check that the app component renders something
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the index page on root route', async () => {
    render(<App />);
    // Wait for lazy-loaded component to render (Suspense boundary)
    await waitFor(() => {
      expect(screen.getByTestId('index-page')).toBeInTheDocument();
    });
  });
});
