import { HourlyHeatmap } from '@/components/analytics/hourly-heatmap';
import { ToolFrequencyChart } from '@/components/analytics/tool-frequency-chart';
import { CacheEfficiency } from '@/components/analytics/cache-efficiency';
import { SessionLengthChart } from '@/components/analytics/session-length-chart';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Deep insights into your Claude Code usage patterns
        </p>
      </div>

      {/* Cache efficiency — 3 stat cards */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Cache Efficiency</h2>
        <CacheEfficiency />
      </div>

      {/* Hourly heatmap + Session length */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HourlyHeatmap />
        <SessionLengthChart />
      </div>

      {/* Tool frequency */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Tool Call Frequency</h2>
        <ToolFrequencyChart />
      </div>
    </div>
  );
}
