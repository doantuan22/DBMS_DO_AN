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

test('auth routes reject missing credentials and role escalation before database access', async () => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    const missingToken = await fetch(`http://127.0.0.1:${port}/api/auth/me`);
    assert.equal(missingToken.status, 401);
    assert.equal((await missingToken.json()).error.code, 'UNAUTHENTICATED');

    const escalation = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ HoTen: 'Test', Email: 'test@example.com', MatKhau: 'password-123', role: 'ADMIN' }),
    });
    assert.equal(escalation.status, 400);
    assert.equal((await escalation.json()).error.code, 'ACCESS_FIELDS_NOT_ALLOWED');
  } finally {
    server.close();
  }
});
