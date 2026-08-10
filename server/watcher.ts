import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import path from 'path';
import os from 'os';
import { parseAllData } from './parser.js';

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function startWatcher(wss: WebSocketServer): void {
  const watcher = chokidar.watch(PROJECTS_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    depth: 4,
  });

  const broadcast = (type: string, data: unknown) => {
    const msg = JSON.stringify({ type, data });
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(msg);
      }
    });
  };

  const handleChange = () => {
    // Debounce: wait 500ms after last change before re-parsing
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      parseAllData();
      broadcast('update', { timestamp: new Date().toISOString() });
    }, 500);
  };

  watcher.on('add', handleChange);
  watcher.on('change', handleChange);
  watcher.on('unlink', handleChange);

  console.log('claude-dashboard: Watching for changes in', PROJECTS_DIR);
}
