import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './db/pool.js';
import { startExpirePendingOrdersJob } from './jobs/expirePendingOrders.js';
import { logger } from './utils/logger.js';

const server = createApp().listen(env.port, () => {
  logger.info('API listening', { port: env.port, environment: env.nodeEnv });
});

// The database pool connects lazily on the first procedure call.
const expireJob = startExpirePendingOrdersJob();

async function shutdown() {
  expireJob.stop();
  server.close(async () => {
    try {
      await closePool();
      process.exit(0);
    } catch (err) {
      logger.error('Graceful shutdown failed', { error: err });
      process.exit(1);
    }
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
