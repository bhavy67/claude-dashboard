import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';
import { fetchProjects } from '@/lib/api';
import { FolderGit2, MessageSquare, Zap, Clock, DollarSign } from 'lucide-react';

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

export function ProjectsPage() {
  const { data: projects, loading } = useApi(fetchProjects, []);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Claude Code usage broken down by project
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No projects found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.path}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => navigate(`/sessions?project=${encodeURIComponent(project.path)}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <FolderGit2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{project.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{project.path}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                    </div>
                    <p className="text-sm font-semibold">{project.sessionCount}</p>
                    <p className="text-[10px] text-muted-foreground">Sessions</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                    </div>
                    <p className="text-sm font-semibold">{formatTokens(project.totalTokens)}</p>
                    <p className="text-[10px] text-muted-foreground">Tokens</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                    </div>
                    <p className="text-sm font-semibold">{formatCost(project.totalCost)}</p>
                    <p className="text-[10px] text-muted-foreground">Cost</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                    </div>
                    <p className="text-sm font-semibold">{timeAgo(project.lastActive)}</p>
                    <p className="text-[10px] text-muted-foreground">Last Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
