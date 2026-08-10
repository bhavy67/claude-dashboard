import { useState, useCallback } from 'react';

const KEY = 'cd-bookmarks';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function save(set: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(load);

  const toggle = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      save(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => bookmarks.has(id), [bookmarks]);

  return { bookmarks, toggle, isBookmarked };
}
