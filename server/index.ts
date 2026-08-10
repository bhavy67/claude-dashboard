import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseAllData } from './parser.js';
import { startWatcher } from './watcher.js';
import { overviewRouter } from './routes/overview.js';
import { sessionsRouter } from './routes/sessions.js';
import { statsRouter } from './routes/stats.js';
import { projectsRouter } from './routes/projects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer(port: number): Promise<void> {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  // Parse initial data
  console.log('claude-dashboard: Reading session data...');
  parseAllData();
  console.log('claude-dashboard: Data loaded.');

  // API routes
  app.use('/api', overviewRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/projects', projectsRouter);

  // In production, serve Vite build
  // __dirname is either server/ (dev via tsx) or dist-server/server/ (production)
  const distPath = path.join(__dirname, '..', 'dist');
  const altDistPath = path.join(__dirname, '..', '..', 'dist');
  const servePath = fs.existsSync(distPath) ? distPath :
    fs.existsSync(altDistPath) ? altDistPath : null;

  if (servePath) {
    app.use(express.static(servePath));

    // SPA fallback (Express 5 syntax)
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(servePath, 'index.html'));
    });
  }

  // WebSocket
  wss.on('connection', (ws) => {
    console.log('claude-dashboard: WebSocket client connected');
    ws.on('close', () => {
      console.log('claude-dashboard: WebSocket client disconnected');
    });
  });

  // Start file watcher
  startWatcher(wss);

  server.listen(port, () => {
    console.log(`claude-dashboard: Server running on http://localhost:${port}`);
  });
}

// Run directly (not imported) — used by `tsx server/index.ts` in dev mode
const isMainModule = process.argv[1]?.includes('server/index');
if (isMainModule) {
  const port = parseInt(process.env.PORT || '3456', 10);
  startServer(port);
}
