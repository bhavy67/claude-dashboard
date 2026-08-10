import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';
import { fetchToolStats } from '@/lib/api';

const TOOL_LABELS: Record<string, string> = {
  bash: 'Bash',
  read: 'Read',
  edit: 'Edit',
  write: 'Write',
  multiedit: 'MultiEdit',
  glob: 'Glob',
  grep: 'Grep',
  ls: 'List',
  web_search: 'Web Search',
  web_fetch: 'Web Fetch',
  todowrite: 'Todo',
  task: 'Task',
  notebookedit: 'Notebook Edit',
  computer: 'Computer',
};

function labelTool(name: string): string {
  return TOOL_LABELS[name.toLowerCase()] ?? name;
}

export function ToolFrequencyChart() {
  const { data, loading } = useApi(fetchToolStats, []);

  const chartData = (data?.tools ?? []).slice(0, 10).map(t => ({
    name: labelTool(t.name),
    raw: t.name,
    count: t.count,
  }));

  const total = chartData.reduce((s, t) => s + t.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Tool Usage</CardTitle>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{total.toLocaleString()} total calls</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No tool data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 36, 160)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`${value.toLocaleString()} calls`, 'Count']}
                cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
