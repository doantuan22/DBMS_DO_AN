import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../src/app.js';

test('GET /api/health returns ok and unknown routes return JSON 404', async () => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    const ok = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { status: 'ok' });
    const missing = await fetch(`http://127.0.0.1:${port}/api/nope`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  } finally {
    server.close();
  }
});
