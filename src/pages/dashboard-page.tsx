import { useCallback } from 'react';
import { BarChart3, MessageSquare, FolderGit2, Zap, DollarSign } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useWebSocket } from '@/hooks/use-websocket';
import { fetchOverview } from '@/lib/api';
import { StatCard } from '@/components/dashboard/stat-card';
import { TokenUsageChart } from '@/components/dashboard/token-usage-chart';
import { ModelDistribution } from '@/components/dashboard/model-distribution';
import { DailyUsageChart } from '@/components/dashboard/daily-usage-chart';
import { RecentSessions } from '@/components/dashboard/recent-sessions';

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

export function DashboardPage() {
  const { data, loading, refetch } = useApi(fetchOverview, []);

  useWebSocket(useCallback(() => {
    refetch();
  }, [refetch]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your Claude Code usage across all projects
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={MessageSquare}
          label="Total Sessions"
          value={loading ? '...' : String(data?.totalSessions || 0)}
          subtitle="All time"
        />
        <StatCard
          icon={Zap}
          label="Total Tokens"
          value={loading ? '...' : formatTokens(data?.totalTokens || 0)}
          subtitle="Input + Output"
        />
        <StatCard
          icon={DollarSign}
          label="Est. Cost"
          value={loading ? '...' : formatCost(data?.totalCost)}
          subtitle="All time"
        />
        <StatCard
          icon={FolderGit2}
          label="Projects"
          value={loading ? '...' : String(data?.totalProjects || 0)}
          subtitle={loading ? '' : `${data?.activeSessions || 0} active`}
        />
        <StatCard
          icon={BarChart3}
          label="Models Used"
          value={loading ? '...' : String(data?.topModels.length || 0)}
          subtitle={loading ? '' : data?.topModels[0]?.model || ''}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TokenUsageChart />
        </div>
        <div>
          <ModelDistribution />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyUsageChart />
        <RecentSessions sessions={data?.recentActivity || []} />
      </div>
    </div>
  );
}
