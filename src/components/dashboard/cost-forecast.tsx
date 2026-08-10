import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';
import { fetchDailyStats } from '@/lib/api';

function formatCost(n: number): string {
  if (n >= 100) return `$${n.toFixed(0)}`;
  if (n >= 10) return `$${n.toFixed(1)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
}

export function CostForecast() {
  const { data, loading } = useApi(fetchDailyStats, []);

  const forecast = useMemo(() => {
    const days = data?.days || [];
    if (days.length === 0) return null;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysRemaining = daysInMonth - daysElapsed;
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // This month's spend so far
    const thisMonthDays = days.filter(d => d.date.startsWith(monthPrefix));
    const spentThisMonth = thisMonthDays.reduce((sum, d) => sum + (d.cost ?? 0), 0);
    const hasUnknownCost = thisMonthDays.some(d => d.cost === null);
    if (hasUnknownCost) return null;

    // Daily rate from last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDays = days.filter(d => new Date(d.date) >= sevenDaysAgo && d.cost !== null);
    const recentCost = recentDays.reduce((sum, d) => sum + (d.cost ?? 0), 0);
    const dailyRate = recentDays.length > 0 ? recentCost / 7 : spentThisMonth / daysElapsed;

    const projected = spentThisMonth + dailyRate * daysRemaining;
    const progressPct = Math.min((spentThisMonth / projected) * 100, 100);

    // Last month for comparison
    const lastMonthDate = new Date(year, month - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthCost = days
      .filter(d => d.date.startsWith(lastMonthPrefix))
      .reduce((sum, d) => sum + (d.cost ?? 0), 0);

    return {
      spentThisMonth,
      projected,
      dailyRate,
      progressPct,
      daysRemaining,
      lastMonthCost,
      monthName: now.toLocaleString('en-US', { month: 'long' }),
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Cost Forecast</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-28 w-full" />
        ) : !forecast ? (
          <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
            Not enough data
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{forecast.monthName} so far</p>
                <p className="text-2xl font-bold tracking-tight">{formatCost(forecast.spentThisMonth)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Projected total</p>
                <p className="text-lg font-semibold text-primary">{formatCost(forecast.projected)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${forecast.progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{forecast.daysRemaining}d remaining</span>
                <span>{formatCost(forecast.dailyRate)}/day avg</span>
              </div>
            </div>

            {forecast.lastMonthCost > 0 && (
              <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
                Last month: {formatCost(forecast.lastMonthCost)}
                {forecast.projected > forecast.lastMonthCost
                  ? ` · +${formatCost(forecast.projected - forecast.lastMonthCost)} projected`
                  : ` · ${formatCost(forecast.lastMonthCost - forecast.projected)} less projected`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
