import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, Download, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useWebSocket } from '@/hooks/use-websocket';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { fetchSessions, fetchProjects, type SessionSummary } from '@/lib/api';
import { SessionList } from '@/components/sessions/session-list';
import { SessionCard } from '@/components/sessions/session-card';
import { Button } from '@/components/ui/button';

function toCSV(sessions: SessionSummary[]): string {
  const headers = [
    'ID', 'Title', 'Project', 'Started', 'Last Active',
    'Messages', 'Input Tokens', 'Output Tokens', 'Total Tokens',
    'Models', 'Est. Cost',
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = sessions.map(s => [
    escape(s.id), escape(s.title), escape(s.project),
    escape(s.startedAt), escape(s.lastActiveAt),
    s.messageCount, s.totalInputTokens, s.totalOutputTokens,
    s.totalInputTokens + s.totalOutputTokens,
    escape(s.models.join(', ')),
    s.estimatedCost !== null ? s.estimatedCost.toFixed(4) : '',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SessionsPage() {
  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get('project') || undefined;
  const [exporting, setExporting] = useState(false);

  const { data: sessionsData, loading, refetch } = useApi(() => fetchSessions({ limit: 100 }), []);
  const { data: projects } = useApi(fetchProjects, []);
  const { bookmarks, toggle, isBookmarked } = useBookmarks();

  useWebSocket(useCallback(() => { refetch(); }, [refetch]));

  const projectPaths = projects?.map((p) => p.path) || [];
  const allSessions = sessionsData?.sessions || [];
  const pinnedSessions = allSessions.filter(s => bookmarks.has(s.id));

  async function handleExport() {
    setExporting(true);
    try {
      const all = await fetchSessions({ limit: 10000 });
      const csv = toCSV(all.sessions);
      downloadCSV(csv, `claude-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Browse and search all your Claude Code sessions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-2 shrink-0">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </Button>
      </div>

      {/* Pinned / bookmarked sessions */}
      {pinnedSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-3.5 w-3.5 fill-primary text-primary" />
            <h2 className="text-sm font-medium">Pinned</h2>
            <span className="text-xs text-muted-foreground">({pinnedSessions.length})</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedSessions.map(s => (
              <SessionCard key={s.id} session={s} isBookmarked={true} onToggleBookmark={toggle} />
            ))}
          </div>
        </div>
      )}

      <SessionList
        sessions={allSessions}
        loading={loading}
        projects={projectPaths}
        initialProjectFilter={initialProject}
        bookmarkedIds={bookmarks}
        onToggleBookmark={toggle}
      />
    </div>
  );
}
