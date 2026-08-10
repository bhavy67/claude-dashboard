import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';
import { fetchProjects } from '@/lib/api';
import { FolderGit2, MessageSquare, Zap, Clock, DollarSign } from 'lucide-react';
import { ProjectCostChart } from '@/components/projects/project-cost-chart';

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

      {/* Cost breakdown chart */}
      {!loading && projects && projects.length > 0 && (
        <ProjectCostChart projects={projects} />
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No projects found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const avgCost =
              project.totalCost !== null && project.sessionCount > 0
                ? project.totalCost / project.sessionCount
                : null;

            return (
              <Card
                key={project.path}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => navigate(`/sessions?project=${encodeURIComponent(project.path)}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                      <FolderGit2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{project.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">{project.path}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <MessageSquare className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-sm font-semibold">{project.sessionCount}</p>
                      <p className="text-[10px] text-muted-foreground">Sessions</p>
                    </div>
                    <div>
                      <Zap className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-sm font-semibold">{formatTokens(project.totalTokens)}</p>
                      <p className="text-[10px] text-muted-foreground">Tokens</p>
                    </div>
                    <div>
                      <DollarSign className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-sm font-semibold">{formatCost(project.totalCost)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <Clock className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-sm font-semibold">{formatCost(avgCost)}</p>
                      <p className="text-[10px] text-muted-foreground">Avg/session</p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Last active</span>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(project.lastActive)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
