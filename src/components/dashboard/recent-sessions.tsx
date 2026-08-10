import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SessionSummary } from '@/lib/api';
import { cn } from '@/lib/utils';

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

function formatCost(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 100) return `$${n.toFixed(0)}`;
  if (n >= 10) return `$${n.toFixed(1)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
}

interface RecentSessionsProps {
  sessions: SessionSummary[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No sessions yet
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.slice(0, 8).map((session) => (
              <button
                key={session.id}
                onClick={() => navigate(`/sessions/${session.id}`)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left',
                  'hover:bg-accent transition-colors'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.project.split('/').pop() || session.project}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2 shrink-0">
                  {session.models.slice(0, 2).map((m) => (
                    <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {m}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {formatTokens(session.totalInputTokens + session.totalOutputTokens)}
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">
                    {formatCost(session.estimatedCost)}
                  </span>
                  <span className="text-xs text-muted-foreground w-14 text-right">
                    {timeAgo(session.lastActiveAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
