import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ProjectSummary } from '@/lib/api';

function formatCost(n: number): string {
  if (n >= 100) return `$${n.toFixed(0)}`;
  if (n >= 10) return `$${n.toFixed(1)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
}

interface ProjectCostChartProps {
  projects: ProjectSummary[];
}

export function ProjectCostChart({ projects }: ProjectCostChartProps) {
  const chartData = projects
    .filter(p => p.totalCost !== null && p.totalCost > 0)
    .sort((a, b) => (b.totalCost ?? 0) - (a.totalCost ?? 0))
    .slice(0, 8)
    .map(p => ({
      name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
      fullName: p.name,
      cost: p.totalCost ?? 0,
      sessions: p.sessionCount,
    }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Cost by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 44, 160)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatCost}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, _name: string, props) => [
                `${formatCost(value)} · ${props.payload.sessions} sessions`,
                props.payload.fullName,
              ]}
              cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={`var(--chart-${(index % 5) + 1})`}
                  opacity={1 - index * 0.07}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
