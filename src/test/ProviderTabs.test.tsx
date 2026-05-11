import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProviderTabs } from '@/components/tabs/ProviderTabs';
import { ProviderProvider } from '@/contexts/ProviderContext';

// Wrapper with ProviderProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ProviderProvider>{children}</ProviderProvider>
);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ProviderTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('rendering', () => {
    it('renders all provider tabs', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      expect(screen.getByRole('tab', { name: /elevenlabs widget/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /elevenlabs sdk/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /xai/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /openai/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ultravox/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /vapi/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /retell/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /gemini/i })).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /^openai translation$/i })).not.toBeInTheDocument();
    });

    it('renders OpenAI Translation tab when feature flag is enabled', () => {
      vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'true');

      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const translationTab = screen.getByRole('tab', { name: /^openai translation$/i });
      expect(translationTab).toBeInTheDocument();
      expect(translationTab).not.toBeDisabled();
      expect(screen.getByText('Translate')).toBeInTheDocument();
    });

    it('renders with correct aria-label', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      expect(
        screen.getByRole('tablist', { name: /voice provider selection/i })
      ).toBeInTheDocument();
    });

    it('shows ElevenLabs Widget as selected by default', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const elevenlabsTab = screen.getByRole('tab', { name: /elevenlabs widget/i });
      expect(elevenlabsTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('disabled states', () => {
    it('enables xAI tab when VITE_XAI_ENABLED=true', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const xaiTab = screen.getByRole('tab', { name: /xai/i });
      // xAI is now enabled via env var
      expect(xaiTab).not.toBeDisabled();
    });

    it('enables OpenAI tab when VITE_OPENAI_ENABLED=true', () => {
      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const openaiTab = screen.getByRole('tab', { name: /openai/i });
      // OpenAI is now enabled via env var
      expect(openaiTab).not.toBeDisabled();
    });

    it('enables OpenAI Translation tab when VITE_OPENAI_TRANSLATION_ENABLED=true', () => {
      vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'true');

      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const translationTab = screen.getByRole('tab', { name: /^openai translation$/i });
      expect(translationTab).not.toBeDisabled();
    });
  });

  describe('interaction', () => {
    it('calls onProviderChange when switching to xAI tab', async () => {
      const user = userEvent.setup();
      const onProviderChange = vi.fn();

      render(
        <TestWrapper>
          <ProviderTabs onProviderChange={onProviderChange} />
        </TestWrapper>
      );

      // xAI is now available, click it to switch
      const xaiTab = screen.getByRole('tab', { name: /xai/i });
      await user.click(xaiTab);

      // Callback should be called with xai
      expect(onProviderChange).toHaveBeenCalledWith('xai');
    });

    it('switches to OpenAI tab when clicked', async () => {
      const user = userEvent.setup();
      const onProviderChange = vi.fn();

      render(
        <TestWrapper>
          <ProviderTabs onProviderChange={onProviderChange} />
        </TestWrapper>
      );

      const openaiTab = screen.getByRole('tab', { name: /openai/i });
      await user.click(openaiTab);

      // OpenAI should now be selected since it's enabled
      expect(openaiTab).toHaveAttribute('data-state', 'active');
      expect(onProviderChange).toHaveBeenCalledWith('openai');
    });

    it('switches to OpenAI Translation tab when enabled and clicked', async () => {
      vi.stubEnv('VITE_OPENAI_TRANSLATION_ENABLED', 'true');
      const user = userEvent.setup();
      const onProviderChange = vi.fn();

      render(
        <TestWrapper>
          <ProviderTabs onProviderChange={onProviderChange} />
        </TestWrapper>
      );

      const translationTab = screen.getByRole('tab', { name: /^openai translation$/i });
      await user.click(translationTab);

      expect(translationTab).toHaveAttribute('data-state', 'active');
      expect(onProviderChange).toHaveBeenCalledWith('openai-translation');
    });
  });

  describe('keyboard navigation', () => {
    it('tabs can be focused with keyboard', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      const tabList = screen.getByRole('tablist');

      // Tab into the tablist
      await user.tab();

      // One of the tabs should be focused
      expect(tabList.contains(document.activeElement)).toBe(true);
    });

    it('arrow right moves to next available tab', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      // Focus the first tab
      const elevenlabsTab = screen.getByRole('tab', { name: /elevenlabs widget/i });
      elevenlabsTab.focus();

      // Press arrow right to move to ElevenLabs SDK
      await user.keyboard('{ArrowRight}');

      // ElevenLabs SDK tab should now be focused
      const sdkTab = screen.getByRole('tab', { name: /elevenlabs sdk/i });
      expect(sdkTab).toHaveFocus();
    });

    it('arrow left moves to previous tab', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProviderTabs />
        </TestWrapper>
      );

      // Focus ElevenLabs SDK tab first
      const sdkTab = screen.getByRole('tab', { name: /elevenlabs sdk/i });
      sdkTab.focus();

      // Press arrow left to move to ElevenLabs Widget
      await user.keyboard('{ArrowLeft}');

      // ElevenLabs Widget should be focused
      const elevenlabsTab = screen.getByRole('tab', { name: /elevenlabs widget/i });
      expect(elevenlabsTab).toHaveFocus();
    });

    it('enter key activates focused tab', async () => {
      const user = userEvent.setup();
      const onProviderChange = vi.fn();

      render(
        <TestWrapper>
          <ProviderTabs onProviderChange={onProviderChange} />
        </TestWrapper>
      );

      // Focus xAI tab
      const xaiTab = screen.getByRole('tab', { name: /xai/i });
      xaiTab.focus();

      // Press enter to activate
      await user.keyboard('{Enter}');

      expect(onProviderChange).toHaveBeenCalledWith('xai');
    });

    it('space key activates focused tab', async () => {
      const user = userEvent.setup();
      const onProviderChange = vi.fn();

      render(
        <TestWrapper>
          <ProviderTabs onProviderChange={onProviderChange} />
        </TestWrapper>
      );

      // Focus xAI tab
      const xaiTab = screen.getByRole('tab', { name: /xai/i });
      xaiTab.focus();

      // Press space to activate
      await user.keyboard(' ');

      expect(onProviderChange).toHaveBeenCalledWith('xai');
    });

    it('tab key moves focus out of tablist', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProviderTabs>
            <button data-testid="content-button">Content Button</button>
          </ProviderTabs>
        </TestWrapper>
      );

      // Focus a tab
      const elevenlabsTab = screen.getByRole('tab', { name: /elevenlabs widget/i });
      elevenlabsTab.focus();

      // Press Tab to move focus out
      await user.tab();

      // Focus should have moved to content (or out of tablist)
      expect(elevenlabsTab).not.toHaveFocus();
    });
  });

  describe('content rendering', () => {
    it('renders children content when provided', () => {
      render(
        <TestWrapper>
          <ProviderTabs>
            <div data-testid="tab-content">Tab Content</div>
          </ProviderTabs>
        </TestWrapper>
      );

      expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    });
  });
});
