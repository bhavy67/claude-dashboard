import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionCard } from './session-card';
import { Skeleton } from '@/components/ui/skeleton';
import { type SessionSummary } from '@/lib/api';
import { Search } from 'lucide-react';

interface SessionListProps {
  sessions: SessionSummary[];
  loading: boolean;
  projects: string[];
  initialProjectFilter?: string;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (id: string) => void;
}

export function SessionList({ sessions, loading, projects, initialProjectFilter, bookmarkedIds, onToggleBookmark }: SessionListProps) {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter || 'all');

  const filtered = sessions.filter((s) => {
    if (projectFilter !== 'all' && s.project !== projectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.project.toLowerCase().includes(q) ||
        s.models.some((m) => m.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p} value={p}>
                {p.split('/').pop() || p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          {search || projectFilter !== 'all'
            ? 'No sessions match your filters'
            : 'No sessions found'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isBookmarked={bookmarkedIds?.has(session.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
