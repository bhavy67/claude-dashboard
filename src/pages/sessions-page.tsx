import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { useWebSocket } from '@/hooks/use-websocket';
import { fetchSessions, fetchProjects } from '@/lib/api';
import { SessionList } from '@/components/sessions/session-list';

export function SessionsPage() {
  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get('project') || undefined;

  const { data: sessionsData, loading, refetch } = useApi(() => fetchSessions({ limit: 100 }), []);
  const { data: projects } = useApi(fetchProjects, []);

  useWebSocket(useCallback(() => {
    refetch();
  }, [refetch]));

  const projectPaths = projects?.map((p) => p.path) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Browse and search all your Claude Code sessions
        </p>
      </div>

      <SessionList
        sessions={sessionsData?.sessions || []}
        loading={loading}
        projects={projectPaths}
        initialProjectFilter={initialProject}
      />
    </div>
  );
}
