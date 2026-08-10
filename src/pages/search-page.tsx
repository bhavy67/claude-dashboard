import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Clock, FileText } from 'lucide-react';
import { fetchSearch, type SearchResult } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 not-italic font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const ROLE_LABEL: Record<string, string> = {
  user: 'You',
  assistant: 'Claude',
  system: 'System',
};

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchSearch(query.trim());
        setResults(data.results);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across all conversation content
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search conversations…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10 h-11 text-base"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
      </div>

      {/* Status line */}
      {searched && !loading && (
        <p className="text-sm text-muted-foreground -mt-2">
          {results.length === 0
            ? `No results for "${query}"`
            : `${results.length} session${results.length !== 1 ? 's' : ''} matched "${query}"`}
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(({ session, matchCount, matches }) => (
            <button
              key={session.id}
              onClick={() => navigate(`/sessions/${session.id}`)}
              className={cn(
                'w-full text-left rounded-xl border border-border bg-card p-4',
                'hover:border-primary/30 hover:shadow-md transition-all'
              )}
            >
              {/* Session header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {session.project.split('/').pop() || session.project}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px] h-5">
                    <FileText className="h-2.5 w-2.5 mr-1" />
                    {matchCount} match{matchCount !== 1 ? 'es' : ''}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(session.lastActiveAt)}
                  </span>
                </div>
              </div>

              {/* Model badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {session.models.slice(0, 3).map(m => (
                  <Badge key={m} variant="outline" className="text-[10px] h-4 px-1.5">
                    {m}
                  </Badge>
                ))}
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-1">
                  <MessageSquare className="h-3 w-3" />
                  {session.messageCount} messages
                </span>
              </div>

              {/* Snippets */}
              <div className="space-y-2">
                {matches.map((match, i) => (
                  <div key={i} className="rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mr-2">
                      {ROLE_LABEL[match.role] ?? match.role}
                    </span>
                    <span className="text-xs text-foreground/80 leading-relaxed">
                      <Highlight text={match.snippet} query={query} />
                    </span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">Type at least 2 characters to search</p>
          <p className="text-xs mt-1 opacity-70">Searches through all message content across every session</p>
        </div>
      )}
    </div>
  );
}
