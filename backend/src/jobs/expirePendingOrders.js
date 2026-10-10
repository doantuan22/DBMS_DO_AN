import { executeProcedure } from '../db/procedureClient.js';
import { logger } from '../utils/logger.js';

const DEFAULT_INTERVAL_MS = 60_000;

// Periodically releases orders whose seat hold has expired.
// Seat availability never depends on this job (the database ignores expired holds); it only cleans data.
export function startExpirePendingOrdersJob({
  intervalMs = DEFAULT_INTERVAL_MS,
  execute = executeProcedure,
  log = logger,
} = {}) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await execute('EXPIRE_PENDING_ORDERS');
      const expired = result.recordset?.[0]?.SoDonHetHan ?? 0;
      if (expired > 0) log.info('Released expired pending orders', { count: expired });
    } catch (err) {
      log.error('Expire pending orders job failed', { error: err });
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return { tick, stop: () => clearInterval(timer) };
}
