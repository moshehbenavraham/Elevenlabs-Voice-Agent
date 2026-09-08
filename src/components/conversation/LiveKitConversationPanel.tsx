import { useEffect, useRef } from 'react';
import { AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LiveKitMessage } from '@/types/livekit';

export function LiveKitConversationPanel({
  messages,
  onClear,
  active,
}: {
  messages: LiveKitMessage[];
  onClear: () => void;
  active: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  useEffect(() => {
    if (follow.current && viewport.current)
      viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [messages]);
  const lastFinal = messages.filter((m) => m.final).at(-1);
  return (
    <section className="lk-transcript" aria-labelledby="lk-conversation-title">
      <div className="lk-transcript-header">
        <h2 id="lk-conversation-title">Conversation</h2>
        <Button
          variant="ghost"
          onClick={onClear}
          disabled={!messages.length || active}
          aria-label="Clear transcript"
        >
          Clear
        </Button>
      </div>
      <div
        ref={viewport}
        className="lk-transcript-content"
        onScroll={() => {
          const el = viewport.current;
          if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {!messages.length ? (
          <div className="lk-transcript-empty">
            <AudioLines aria-hidden="true" />
            <h3>Your conversation starts here</h3>
            <p>You and your assistant, one turn at a time.</p>
          </div>
        ) : (
          <ol className="lk-messages">
            {messages.map((message) => (
              <li key={message.id}>
                <span className={message.role === 'assistant' ? 'lk-speaker-agent' : ''}>
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <p>
                  {message.content}
                  {!message.final && <span aria-label="Transcribing"> …</span>}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {lastFinal
          ? `${lastFinal.role === 'user' ? 'You' : 'Assistant'}: ${lastFinal.content}`
          : ''}
      </p>
    </section>
  );
}
