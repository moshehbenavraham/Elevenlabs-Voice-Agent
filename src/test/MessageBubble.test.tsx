import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageBubble } from '@/components/conversation/MessageBubble';
import type { VoiceMessage } from '@/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  useReducedMotion: () => false,
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('MessageBubble', () => {
  const userMessage: VoiceMessage = {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: Date.now(),
  };

  const assistantMessage: VoiceMessage = {
    id: 'msg-2',
    role: 'assistant',
    content: 'I am doing well, thank you for asking!',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user message content', () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
  });

  it('applies user styling for user messages', () => {
    const { container } = render(<MessageBubble message={userMessage} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-end');
  });

  it('applies assistant styling for assistant messages', () => {
    const { container } = render(<MessageBubble message={assistantMessage} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-start');
  });

  it('renders copy button', () => {
    render(<MessageBubble message={userMessage} />);
    const copyButton = screen.getByRole('button', { name: /copy message/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('copies message to clipboard when copy button clicked', async () => {
    render(<MessageBubble message={userMessage} />);
    const copyButton = screen.getByRole('button', { name: /copy message/i });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello, how are you?');
    });
  });

  it('shows check icon after copying', async () => {
    render(<MessageBubble message={userMessage} />);
    const copyButton = screen.getByRole('button', { name: /copy message/i });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(<MessageBubble message={userMessage} className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('preserves whitespace in message content', () => {
    const messageWithWhitespace: VoiceMessage = {
      id: 'msg-3',
      role: 'assistant',
      content: 'Line 1\nLine 2\nLine 3',
      timestamp: Date.now(),
    };
    render(<MessageBubble message={messageWithWhitespace} />);
    const textElement = screen.getByText(/Line 1/);
    expect(textElement).toHaveClass('whitespace-pre-wrap');
  });

  it('has minimum touch target size for copy button', () => {
    render(<MessageBubble message={userMessage} />);
    const copyButton = screen.getByRole('button', { name: /copy message/i });
    expect(copyButton).toHaveClass('min-w-[44px]');
    expect(copyButton).toHaveClass('min-h-[44px]');
  });
});
