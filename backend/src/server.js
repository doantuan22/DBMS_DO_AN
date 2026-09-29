import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './db/pool.js';
import { startExpirePendingOrdersJob } from './jobs/expirePendingOrders.js';

const server = createApp().listen(env.port, () => {
  console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
});

// The database pool connects lazily on the first procedure call.
const expireJob = startExpirePendingOrdersJob();

async function shutdown() {
  expireJob.stop();
  server.close();
  await closePool();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
