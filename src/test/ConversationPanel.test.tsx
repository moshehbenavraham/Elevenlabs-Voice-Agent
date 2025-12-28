import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
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

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('ConversationPanel', () => {
  const mockMessages: VoiceMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, can you help me?',
      timestamp: Date.now() - 2000,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Of course! I am here to help.',
      timestamp: Date.now() - 1000,
    },
    {
      id: 'msg-3',
      role: 'user',
      content: 'What can you do?',
      timestamp: Date.now(),
    },
  ];

  it('renders empty state when no messages', () => {
    render(<ConversationPanel messages={[]} />);
    expect(screen.getByText(/start speaking to begin/i)).toBeInTheDocument();
  });

  it('renders message count', () => {
    render(<ConversationPanel messages={mockMessages} />);
    expect(screen.getByText('3 messages')).toBeInTheDocument();
  });

  it('renders singular message count', () => {
    render(<ConversationPanel messages={[mockMessages[0]]} />);
    expect(screen.getByText('1 message')).toBeInTheDocument();
  });

  it('renders all messages', () => {
    render(<ConversationPanel messages={mockMessages} />);
    expect(screen.getByText('Hello, can you help me?')).toBeInTheDocument();
    expect(screen.getByText('Of course! I am here to help.')).toBeInTheDocument();
    expect(screen.getByText('What can you do?')).toBeInTheDocument();
  });

  it('renders conversation header', () => {
    render(<ConversationPanel messages={mockMessages} />);
    expect(screen.getByText('Conversation')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<ConversationPanel messages={mockMessages} />);
    const panel = screen.getByRole('log');
    expect(panel).toHaveAttribute('aria-label', 'Conversation transcript');
    expect(panel).toHaveAttribute('aria-live', 'polite');
  });

  it('includes screen reader announcement for last message', () => {
    render(<ConversationPanel messages={mockMessages} />);
    // The sr-only element should contain the last message info
    const srAnnouncement = document.querySelector('.sr-only[aria-live="assertive"]');
    expect(srAnnouncement).toBeInTheDocument();
    expect(srAnnouncement?.textContent).toContain('You said:');
  });

  it('announces assistant messages correctly', () => {
    const assistantLastMessages: VoiceMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Hello there!',
        timestamp: Date.now(),
      },
    ];
    render(<ConversationPanel messages={assistantLastMessages} />);
    const srAnnouncement = document.querySelector('.sr-only[aria-live="assertive"]');
    expect(srAnnouncement?.textContent).toContain('Assistant said:');
  });

  it('applies custom className', () => {
    const { container } = render(<ConversationPanel messages={[]} className="custom-class" />);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('custom-class');
  });

  it('has glassmorphism styling', () => {
    const { container } = render(<ConversationPanel messages={[]} />);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('backdrop-blur-lg');
    expect(panel).toHaveClass('bg-white/5');
  });
});
