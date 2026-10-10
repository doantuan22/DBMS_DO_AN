import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { createServer } from 'vite';
import { createAuthSession } from '../src/services/authSession.js';
import { createApp } from '../../backend/src/app.js';

let vite, request;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ request } = await vite.ssrLoadModule('/src/api/httpClient.js'));
});
after(async () => {
  await vite?.close();
});

test('existing HTTP client preserves real429 error/status and never retries automatically', async (t) => {
  const policy = { windowMs: 2000, loginMax: 1, registerMax: 1, maxKeys: 10 };
  const server = createApp({ authRateLimit: { policy, now: () => 0 } }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`,
    original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (url, options) => {
    calls++;
    return original(base + url, options);
  };
  t.after(async () => {
    globalThis.fetch = original;
    await new Promise((resolve) => server.close(resolve));
  });
  for (const endpoint of ['login', 'register']) {
    await assert.rejects(request('/auth/' + endpoint, { method: 'POST', body: {} }), {
      status: 400,
      code: 'INVALID_REQUEST',
    });
    const count = calls;
    await assert.rejects(request('/auth/' + endpoint, { method: 'POST', body: {} }), {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication requests. Please try again later.',
    });
    assert.equal(calls, count + 1);
  }
});

test('existing auth session preserves state and makes no repeated requests when login/register rate limited', async () => {
  const state = { token: 'existing-session' },
    calls = [];
  const limited = Object.assign(new Error('Too many authentication requests.'), {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
  });
  const session = createAuthSession({
    storage: {
      get: () => state.token,
      set: (value) => {
        state.token = value;
      },
      clear: () => {
        state.token = null;
      },
    },
    api: {
      login: async () => {
        calls.push('login');
        throw limited;
      },
      registerCustomer: async () => {
        calls.push('register');
        throw limited;
      },
      getCurrentUser: async () => {
        throw new Error('must not refresh on failed login');
      },
    },
  });
  await assert.rejects(session.login({}), (error) => error === limited);
  await assert.rejects(session.register({}), (error) => error === limited);
  assert.deepEqual(calls, ['login', 'register']);
  assert.equal(state.token, 'existing-session');
});
