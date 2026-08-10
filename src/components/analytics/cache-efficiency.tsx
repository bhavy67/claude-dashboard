import { useMemo } from 'react';
import { DatabaseZap, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';
import { fetchCacheStats } from '@/lib/api';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Cache read tokens cost ~10% of normal input tokens (rough estimate)
const CACHE_READ_DISCOUNT = 0.9;
const INPUT_PRICE_PER_M = 3.0; // rough average, $ per 1M tokens

export function CacheEfficiency() {
  const { data, loading } = useApi(fetchCacheStats, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const { cacheReadTokens, cacheCreateTokens, totalInputTokens, cacheHitRate } = data;
    // Tokens saved = what would have been billed as full-price input, minus the discounted cache read price
    const savedTokens = Math.round(cacheReadTokens * CACHE_READ_DISCOUNT);
    const savedCostEst = (savedTokens / 1_000_000) * INPUT_PRICE_PER_M;
    return { cacheReadTokens, cacheCreateTokens, totalInputTokens, cacheHitRate, savedTokens, savedCostEst };
  }, [data]);

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (!stats) return null;

  const pct = (stats.cacheHitRate * 100).toFixed(1);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
              <p className="text-2xl font-bold tracking-tight">{pct}%</p>
              <p className="text-xs text-muted-foreground">
                {formatTokens(stats.cacheReadTokens)} read / {formatTokens(stats.cacheReadTokens + stats.cacheCreateTokens)} cacheable
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <DatabaseZap className="h-5 w-5 text-primary" />
            </div>
          </div>
          {/* Hit rate bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tokens Saved</p>
              <p className="text-2xl font-bold tracking-tight">{formatTokens(stats.savedTokens)}</p>
              <p className="text-xs text-muted-foreground">via cache reads</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Zap className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Est. Cost Saved</p>
              <p className="text-2xl font-bold tracking-tight">
                ${stats.savedCostEst >= 1 ? stats.savedCostEst.toFixed(2) : stats.savedCostEst.toFixed(3)}
              </p>
              <p className="text-xs text-muted-foreground">from caching</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
