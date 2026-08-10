import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';
import { fetchDailyStats } from '@/lib/api';

type Cell = { date: string; count: number; isFuture: boolean };

function intensityClass(count: number): string {
  if (count === 0) return 'bg-border';
  if (count === 1) return 'bg-primary/25';
  if (count <= 3) return 'bg-primary/50';
  if (count <= 6) return 'bg-primary/75';
  return 'bg-primary';
}

export function ActivityHeatmap() {
  const { data, loading } = useApi(fetchDailyStats, []);

  const { weeks, totalSessions, maxCount } = useMemo(() => {
    const countMap = new Map<string, number>();
    let total = 0;
    let max = 0;
    for (const d of data?.days || []) {
      countMap.set(d.date, d.sessions);
      total += d.sessions;
      if (d.sessions > max) max = d.sessions;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7 * 52);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // rewind to Sunday

    const weeks: Cell[][] = [];
    const cursor = new Date(startDate);

    while (cursor <= now) {
      const week: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const isFuture = cursor > now;
        week.push({ date: dateStr, count: countMap.get(dateStr) ?? 0, isFuture });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, totalSessions: total, maxCount: max };
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Activity</CardTitle>
          <span className="text-xs text-muted-foreground">{totalSessions} sessions all time</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <div className="overflow-x-auto pb-1">
            <div className="inline-flex flex-col gap-2 min-w-max">
              {/* Month labels */}
              <div className="flex gap-[3px] ml-6">
                {weeks.map((week, wi) => {
                  const d = new Date(week[1]?.date || week[0].date);
                  const isFirstOfMonth = d.getDate() <= 7;
                  return (
                    <div key={wi} className="w-[13px] text-[9px] text-muted-foreground overflow-visible whitespace-nowrap">
                      {isFirstOfMonth ? d.toLocaleString('en-US', { month: 'short' }) : ''}
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="flex gap-[3px]">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] w-5 mr-1">
                  {['', 'M', '', 'W', '', 'F', ''].map((label, i) => (
                    <div key={i} className="h-[13px] flex items-center justify-end text-[9px] text-muted-foreground">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Week columns */}
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((cell, di) => (
                      <div
                        key={di}
                        title={cell.isFuture ? undefined : `${cell.date} — ${cell.count} session${cell.count !== 1 ? 's' : ''}`}
                        className={[
                          'h-[13px] w-[13px] rounded-[3px] cursor-default',
                          cell.isFuture ? 'opacity-0' : intensityClass(cell.count),
                        ].join(' ')}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-[3px] self-end">
                <span className="text-[9px] text-muted-foreground mr-1">Less</span>
                {[0, 1, 2, 4, 7].map((n) => (
                  <div key={n} className={`h-[13px] w-[13px] rounded-[3px] ${intensityClass(n)}`} />
                ))}
                <span className="text-[9px] text-muted-foreground ml-1">More</span>
                {maxCount > 0 && (
                  <span className="text-[9px] text-muted-foreground ml-3">
                    peak {maxCount} sessions/day
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
