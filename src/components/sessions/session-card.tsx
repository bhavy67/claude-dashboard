import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SessionSummary } from '@/lib/api';
import { MessageSquare, Clock, Activity } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface SessionCardProps {
  session: SessionSummary;
}

export function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={() => navigate(`/sessions/${session.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{session.title}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {session.project.split('/').pop() || session.project}
            </p>
          </div>
          {session.isActive && (
            <Badge variant="default" className="shrink-0 bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] h-4 px-1.5">
              <Activity className="mr-1 h-2.5 w-2.5" />
              Live
            </Badge>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {session.models.slice(0, 3).map((m) => (
            <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {m}
            </Badge>
          ))}
          {session.models.length > 3 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              +{session.models.length - 3}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {session.messageCount}
          </span>
          <span>{formatTokens(session.totalInputTokens + session.totalOutputTokens)} tokens</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(session.lastActiveAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
