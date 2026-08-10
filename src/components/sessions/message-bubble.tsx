import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, Brain, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type Message } from '@/lib/api';
import { cn } from '@/lib/utils';

function formatTokens(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showThinking, setShowThinking] = useState(false);
  const [showToolCalls, setShowToolCalls] = useState(false);

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {message.durationMs
            ? `Turn completed in ${(message.durationMs / 1000).toFixed(1)}s`
            : 'System'}
        </div>
      </div>
    );
  }

  if (message.type === 'user' && message.role === 'tool') {
    if (!message.content.trim()) return null;
    return (
      <div className="flex justify-center py-1">
        <div className="max-w-lg rounded-lg bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          <p className="line-clamp-2">{message.content}</p>
        </div>
      </div>
    );
  }

  const isUser = message.type === 'user';
  const isMeta = message.isMeta;

  if (isMeta && !message.content.trim()) return null;

  return (
    <div className={cn('flex py-2', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border'
        )}
      >
        {/* Model badge for assistant */}
        {!isUser && message.model && (
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
              {message.model}
            </Badge>
          </div>
        )}

        {/* Thinking block */}
        {message.thinking && (
          <div className="mb-2">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showThinking ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Brain className="h-3 w-3" />
              Thinking
            </button>
            {showThinking && (
              <div className="mt-1.5 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground whitespace-pre-wrap">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div className={cn(
            'text-sm whitespace-pre-wrap break-words',
            isMeta && 'text-muted-foreground italic'
          )}>
            {message.content}
          </div>
        )}

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowToolCalls(!showToolCalls)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showToolCalls ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Wrench className="h-3 w-3" />
              {message.toolCalls.length} tool call{message.toolCalls.length > 1 ? 's' : ''}
            </button>
            {showToolCalls && (
              <div className="mt-1.5 space-y-1.5">
                {message.toolCalls.map((tc) => (
                  <div
                    key={tc.id}
                    className="rounded-md bg-muted/50 p-2.5 text-xs"
                  >
                    <span className="font-medium text-foreground">{tc.name}</span>
                    {tc.input && Object.keys(tc.input).length > 0 && (
                      <pre className="mt-1 text-muted-foreground overflow-x-auto">
                        {JSON.stringify(tc.input, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          'mt-1.5 text-[10px]',
          isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
