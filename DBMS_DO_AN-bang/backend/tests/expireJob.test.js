import assert from 'node:assert/strict';
import test from 'node:test';
import { startExpirePendingOrdersJob } from '../src/jobs/expirePendingOrders.js';

const silent = { log() {}, error() {} };

test('job calls the whitelisted expire procedure and survives errors', async () => {
  const calls = [];
  let fail = true;
  const job = startExpirePendingOrdersJob({
    intervalMs: 3_600_000,
    log: silent,
    execute: async (key) => {
      calls.push(key);
      if (fail) throw new Error('db down');
      return { recordset: [{ SoDonHetHan: 2 }] };
    },
  });
  await job.tick();
  fail = false;
  await job.tick();
  job.stop();
  assert.deepEqual(calls, ['EXPIRE_PENDING_ORDERS', 'EXPIRE_PENDING_ORDERS']);
});
