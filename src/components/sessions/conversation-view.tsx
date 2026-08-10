import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { type Message } from '@/lib/api';

interface ConversationViewProps {
  messages: Message[];
}

export function ConversationView({ messages }: ConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter out empty meta messages
  const displayMessages = messages.filter((m) => {
    if (m.isMeta && !m.content.trim()) return false;
    return true;
  });

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-1 px-4 py-4">
        {displayMessages.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No messages in this session
          </div>
        ) : (
          displayMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
