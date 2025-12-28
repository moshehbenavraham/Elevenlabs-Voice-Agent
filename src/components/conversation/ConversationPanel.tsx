import { useEffect, useRef, useCallback, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';
import type { VoiceMessage } from '@/types';

interface ConversationPanelProps {
  messages: VoiceMessage[];
  className?: string;
}

/**
 * Scrollable conversation transcript panel with auto-scroll and accessibility
 */
export function ConversationPanel({ messages, className }: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const lastMessageCountRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive (unless user scrolled up)
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && !isUserScrolled) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, isUserScrolled]);

  // Handle scroll to detect if user manually scrolled up
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setIsUserScrolled(!isAtBottom);
  }, []);

  // Get last message for screen reader announcement
  const lastMessage = messages[messages.length - 1];

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-2xl',
        'bg-white/5 backdrop-blur-lg',
        'border border-white/10',
        className
      )}
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-medium text-white/80">Conversation</h2>
        <span className="text-xs text-white/50">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4" onScrollCapture={handleScroll} ref={scrollRef}>
        <div className="py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              <p>Start speaking to begin the conversation...</p>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </ScrollArea>

      {/* Screen reader announcement for new messages */}
      {lastMessage && (
        <div className="sr-only" aria-live="assertive" aria-atomic="true">
          {lastMessage.role === 'user'
            ? 'You said: '
            : lastMessage.role === 'function'
              ? 'Function executed: '
              : 'Assistant said: '}
          {lastMessage.content}
        </div>
      )}
    </div>
  );
}
