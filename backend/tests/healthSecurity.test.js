import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createHealthRouter } from '../src/routes/healthRoutes.js';
import { checkDatabase } from '../src/services/healthService.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { logger } from '../src/utils/logger.js';
import { HttpError } from '../src/utils/httpError.js';

async function withHealthServer(check, run) {
  const app = express();
  app.use('/api/health', createHealthRouter({ checkDatabase: check }));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function captureLogs(run) {
  const original = console.error;
  const logs = [];
  console.error = (entry) => logs.push(JSON.parse(entry));
  try {
    return { result: await run(), logs };
  } finally {
    console.error = original;
  }
}

test('DB health executes the existing procedure and projects only a boolean', async () => {
  const calls = [];
  const health = await checkDatabase(async (...args) => {
    calls.push(args);
    return { recordset: [{ Status: 'Healthy', DatabaseName: 'synthetic-private-db' }] };
  });
  assert.deepEqual(calls, [['SYSTEM_HEALTH_CHECK']]);
  assert.deepEqual(health, { ok: true });
  for (const result of [{ recordset: [{ Status: 'Unhealthy' }] }, { recordset: [] }, {}])
    assert.deepEqual(await checkDatabase(async () => result), { ok: false });
});

test('anonymous monitoring endpoints keep 200 status and never project service metadata', async () => {
  let calls = 0;
  await withHealthServer(async () => {
    calls++;
    return { ok: true, database: 'synthetic-private-db', procedure: 'synthetic-private-procedure',
      server: 'synthetic-host', connectionString: 'synthetic-connection', stack: 'synthetic-stack' };
  }, async (base) => {
    for (const headers of [{}, { Authorization: 'Bearer invalid' }]) {
      const live = await fetch(`${base}/api/health`, { headers });
      assert.equal(live.status, 200);
      assert.deepEqual(await live.json(), { status: 'ok' });
      const ready = await fetch(`${base}/api/health/db`, { headers });
      assert.equal(ready.status, 200);
      assert.deepEqual(await ready.json(), { ok: true });
    }
    assert.equal(calls, 2, 'liveness must never depend on DB availability');
  });
});

test('unhealthy, missing and nonboolean DB status return 503 without metadata', async () => {
  for (const health of [{ ok: false, database: 'synthetic-private-db' }, undefined, { ok: 'true' }])
    await withHealthServer(async () => health, async (base) => {
      const response = await fetch(`${base}/api/health/db`);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { ok: false });
    });
});

test('safe simulated connection failures preserve liveness and give sanitized 503 responses', async () => {
  const { logs } = await captureLogs(async () => {
    for (const code of ['ESOCKET', 'ECONNREFUSED', 'ETIMEOUT', 'ENOTOPEN', 'ELOGIN', 'EINSTLOOKUP', 'ENOCONN'])
      await withHealthServer(() => checkDatabase(async () => {
        throw Object.assign(new Error('SQL Server synthetic-private-db; Procedure synthetic-private-procedure; Password=synthetic-password;'), { code });
      }), async (base) => {
        const ready = await fetch(`${base}/api/health/db?token=synthetic-query-token`);
        assert.equal(ready.status, 503);
        assert.deepEqual(await ready.json(), { error: {
          code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable.',
        } });
        const live = await fetch(`${base}/api/health`);
        assert.equal(live.status, 200);
        assert.deepEqual(await live.json(), { status: 'ok' });
      });
  });
  assert.equal(logs.length, 7);
  for (const log of logs) {
    assert.equal(log.details.path, '/api/health/db');
    assert.ok(log.details.error.code);
    assert.match(log.details.error.message, /synthetic-private-procedure/);
    assert.doesNotMatch(JSON.stringify(log), /synthetic-password|synthetic-query-token/);
  }
});

test('unknown SQL errors never expose driver codes, messages or stack traces', async () => {
  const { logs } = await captureLogs(() => withHealthServer(async () => {
    throw Object.assign(new Error('synthetic-private-db synthetic-private-procedure'), {
      code: 'synthetic-internal-driver-code', number: 99999,
    });
  }, async (base) => {
    const response = await fetch(`${base}/api/health/db`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: {
      code: 'INTERNAL_ERROR', message: 'Internal server error',
    } });
  }));
  assert.equal(logs[0].details.error.number, 99999);
  assert.match(logs[0].details.error.stack, /synthetic-private-procedure/);
});

test('server HttpErrors are sanitized while existing domain 4xx contracts are preserved', async () => {
  await captureLogs(async () => {
    for (const [error, status, body] of [
      [new HttpError(503, 'AUTH_NOT_CONFIGURED', 'private auth config'), 503,
        { code: 'AUTH_NOT_CONFIGURED', message: 'Service temporarily unavailable.' }],
      [new HttpError(500, 'private-code', 'private-message'), 500,
        { code: 'INTERNAL_ERROR', message: 'Internal server error' }],
      [new HttpError(500, 'ORDER_RESPONSE_INVALID', 'private-message'), 500,
        { code: 'ORDER_RESPONSE_INVALID', message: 'Internal server error' }],
      [new HttpError(500, 'AUTH_RESPONSE_INVALID', 'private-message'), 500,
        { code: 'AUTH_RESPONSE_INVALID', message: 'Internal server error' }],
      [new HttpError(409, 'SEAT_CONFLICT', 'Seats are no longer available.'), 409,
        { code: 'SEAT_CONFLICT', message: 'Seats are no longer available.' }],
      [Object.assign(new Error('private SQL error'), { number: 547 }), 400,
        { code: 'INVALID_REFERENCE', message: 'The request conflicts with an existing data constraint.' }],
      [Object.assign(new Error('private SQL error'), { status: 400, code: 'EREQUEST' }), 400,
        { code: 'INVALID_REQUEST', message: 'Invalid request.' }],
    ]) {
      await withHealthServer(async () => { throw error; }, async (base) => {
        const response = await fetch(`${base}/api/health/db`);
        assert.equal(response.status, status);
        assert.deepEqual(await response.json(), { error: body });
      });
    }
  });
});

test('logs retain diagnostics while redacting structured and embedded credentials', async () => {
  const { logs } = await captureLogs(async () => logger.error('Connection failed', {
    password: 'synthetic-password', token: 'synthetic-token',
    nested: { access_token: 'synthetic-access-token', JWT_SECRET: 'synthetic-jwt-secret' },
    connectionString: 'synthetic-connection', authorization: 'Bearer synthetic-bearer',
    error: new Error('Server=synthetic-host; User Id=synthetic-user; Password="synthetic password with spaces"; Pwd=synthetic-pwd; Bearer synthetic-bearer https://synthetic-user:synthetic-uri-password@example.test'),
  }));
  assert.doesNotMatch(JSON.stringify(logs), /synthetic-password|synthetic-token|synthetic-access-token|synthetic-jwt-secret|synthetic-connection|synthetic-bearer|synthetic-user|synthetic-pwd|synthetic-uri-password|synthetic password with spaces/);
  assert.match(logs[0].details.error.message, /synthetic-host/);
  assert.match(logs[0].details.error.message, /\[redacted\]/);
});
