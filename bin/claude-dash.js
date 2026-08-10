#!/usr/bin/env node
import detect from 'detect-port';
import open from 'open';
import { startServer } from '../dist-server/server/index.js';

async function main() {
  console.log('claude-dashboard: Starting...');

  const port = await detect(3456);
  await startServer(port);

  const url = `http://localhost:${port}`;
  console.log(`claude-dashboard: Dashboard ready at ${url}`);

  await open(url);
  console.log('claude-dashboard: Browser opened.');
}

main().catch((err) => {
  console.error('claude-dashboard: Failed to start:', err);
  process.exit(1);
});
