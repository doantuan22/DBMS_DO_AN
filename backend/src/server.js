import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './db/pool.js';

const server = createApp().listen(env.port, () => {
  console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
});

// The database pool connects lazily on the first procedure call.
async function shutdown() {
  server.close();
  await closePool();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
