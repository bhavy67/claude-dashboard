import { useMemo, type CSSProperties } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';
import { fetchHourlyStats } from '@/lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_LABELS: Record<number, string> = {
  0: '12am', 3: '3am', 6: '6am', 9: '9am',
  12: '12pm', 15: '3pm', 18: '6pm', 21: '9pm',
};

function cellStyle(count: number, max: number): CSSProperties {
  if (count === 0 || max === 0) {
    return { backgroundColor: 'var(--color-border)' };
  }
  const opacity = 0.18 + (count / max) * 0.82;
  return { backgroundColor: 'var(--color-primary)', opacity };
}

export function HourlyHeatmap() {
  const { data, loading } = useApi(fetchHourlyStats, []);

  const max = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.grid.flat());
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Usage by Hour</CardTitle>
          <span className="text-xs text-muted-foreground">When you use Claude most</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1 min-w-max">
              {/* Hour labels */}
              <div className="flex gap-[3px] ml-10">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="w-[22px] text-[9px] text-muted-foreground text-center overflow-visible whitespace-nowrap">
                    {HOUR_LABELS[h] ?? ''}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {DAYS.map((day, di) => (
                <div key={day} className="flex items-center gap-[3px]">
                  <span className="w-9 text-right text-[10px] text-muted-foreground pr-1">{day}</span>
                  {Array.from({ length: 24 }, (_, h) => {
                    const count = data?.grid[di][h] ?? 0;
                    return (
                      <div
                        key={h}
                        title={`${day} ${HOUR_LABELS[h] ?? `${h}:00`} — ${count} session${count !== 1 ? 's' : ''}`}
                        className="h-[22px] w-[22px] rounded-[3px] cursor-default"
                        style={cellStyle(count, max)}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-[3px] self-end mt-1">
                <span className="text-[9px] text-muted-foreground mr-1">Less</span>
                {[0, 0.15, 0.35, 0.6, 1].map((r, i) => (
                  <div key={i} className="h-[22px] w-[22px] rounded-[3px]" style={cellStyle(Math.round(r * max), max)} />
                ))}
                <span className="text-[9px] text-muted-foreground ml-1">More</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
