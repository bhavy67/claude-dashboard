import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Zap, Clock, FolderGit2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationView } from '@/components/sessions/conversation-view';
import { MessageBubble } from '@/components/sessions/message-bubble';
import { useApi } from '@/hooks/use-api';
import { fetchSession } from '@/lib/api';

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, loading } = useApi(() => fetchSession(id!), [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium">Session not found</p>
        <Button variant="link" onClick={() => navigate('/sessions')}>
          Back to sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
            onClick={() => navigate('/sessions')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold tracking-tight">{session.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderGit2 className="h-3.5 w-3.5" />
            {session.project.split('/').pop() || session.project}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Messages</p>
              <p className="text-sm font-semibold">{session.messageCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tokens</p>
              <p className="text-sm font-semibold">
                {formatTokens(session.totalInputTokens + session.totalOutputTokens)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Est. Cost</p>
              <p className="text-sm font-semibold">{formatCost(session.estimatedCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="text-sm font-semibold">{formatDate(session.startedAt)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Models</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {session.models.map((m) => (
                  <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="conversation">
        <TabsList>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          {session.subagents.length > 0 && (
            <TabsTrigger value="subagents">
              Subagents ({session.subagents.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="conversation" className="mt-3">
          <Card>
            <CardContent className="p-0">
              <ConversationView messages={session.messages} />
            </CardContent>
          </Card>
        </TabsContent>

        {session.subagents.length > 0 && (
          <TabsContent value="subagents" className="mt-3">
            <div className="space-y-4">
              {session.subagents.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline">{sub.agentType}</Badge>
                      <span className="text-sm font-medium">{sub.description}</span>
                    </div>
                    <div className="space-y-1">
                      {sub.messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
