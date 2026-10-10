import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { METHODS } from 'node:http';
import { createAuthRateLimiter, authClientKey } from '../src/middleware/authRateLimit.js';
import { createApp } from '../src/app.js';
import { authService } from '../src/services/authService.js';
import { env } from '../src/config/env.js';

const policy = { windowMs: 2000, loginMax: 3, registerMax: 2, maxKeys: 20 };
function fixture(custom = {}) {
  let time = 0;
  const limiter = createAuthRateLimiter({ policy: { ...policy, ...custom }, now: () => time });
  function call({ ip = '192.0.2.1', path = '/login', method = 'POST', body } = {}) {
    const headers = {};
    let called = 0,
      error;
    limiter(
      { ip, path, method, body },
      {
        setHeader: (key, value) => {
          headers[key] = value;
        },
      },
      (err) => {
        called++;
        error = err;
      },
    );
    assert.equal(called, 1);
    return { allowed: !error, error, headers };
  }
  return {
    call,
    advance: (ms) => {
      time += ms;
    },
  };
}

test('R4.5-01/02 allows requests below and exactly at the configured threshold', () => {
  for (const [path, maximum] of [
    ['/login', policy.loginMax],
    ['/register', policy.registerMax],
  ]) {
    const f = fixture();
    for (let i = 1; i <= maximum; i++)
      assert.deepEqual(f.call({ path }), { allowed: true, error: undefined, headers: {} });
  }
});

test('R4.5-03/09 rejects only excess with account-neutral429 and real positive Retry-After', () => {
  const f = fixture();
  for (let i = 0; i < policy.loginMax; i++) f.call();
  let result = f.call({ body: { Email: 'different@example.test', MatKhau: 'never stored' } });
  assert.equal(result.allowed, false);
  assert.equal(result.error.status, 429);
  assert.equal(result.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.equal(result.error.message, 'Too many authentication requests. Please try again later.');
  assert.equal(result.headers['Retry-After'], '2');
  f.advance(1001);
  result = f.call();
  assert.equal(result.headers['Retry-After'], '1');
});

test('R4.5-04/10 expiry resets at exact boundary and rejection does not extend window', () => {
  const f = fixture();
  for (let i = 0; i < policy.loginMax; i++) f.call();
  f.advance(policy.windowMs - 1);
  assert.equal(f.call().error.status, 429);
  f.advance(1);
  for (let i = 0; i < policy.loginMax; i++) assert.equal(f.call().allowed, true);
  assert.equal(f.call().error.status, 429);
});

test('R4.5-05 independent clients and endpoints have independent counters', () => {
  const f = fixture();
  for (let i = 0; i < policy.loginMax; i++) f.call();
  assert.equal(f.call().error.status, 429);
  assert.equal(f.call({ ip: '192.0.2.2' }).allowed, true);
  for (let i = 0; i < policy.registerMax; i++)
    assert.equal(f.call({ path: '/register' }).allowed, true);
  assert.equal(f.call({ path: '/register' }).error.status, 429);
});

test('R4.5-06 synchronous counting prevents a rapid parallel burst bypass', async () => {
  const f = fixture();
  const results = await Promise.all(
    Array.from({ length: policy.loginMax + 20 }, () => Promise.resolve().then(() => f.call())),
  );
  assert.equal(results.filter((row) => row.allowed).length, policy.loginMax);
  assert.equal(results.filter((row) => row.error?.status === 429).length, 20);
});

test('bounded state refuses new keys without resetting active buckets and reclaims expired keys', () => {
  const f = fixture({ maxKeys: 2 });
  assert.equal(f.call().allowed, true);
  f.advance(500);
  assert.equal(f.call({ ip: '192.0.2.2' }).allowed, true);
  assert.equal(f.call({ ip: '192.0.2.3' }).error.status, 429);
  for (let i = 1; i < policy.loginMax; i++) assert.equal(f.call().allowed, true);
  assert.equal(f.call().error.status, 429);
  f.advance(policy.windowMs - 500);
  assert.equal(f.call({ ip: '192.0.2.3' }).allowed, true);
  for (let i = 1; i < policy.loginMax; i++) assert.equal(f.call({ ip: '192.0.2.2' }).allowed, true);
  assert.equal(f.call({ ip: '192.0.2.2' }).error.status, 429);
  f.advance(500);
  assert.equal(f.call({ ip: '192.0.2.4' }).allowed, true);
});

test('IPv4-mapped addresses and IPv6 textual variants/prefix rotation cannot reset identity', () => {
  assert.equal(authClientKey('192.0.2.1'), authClientKey('::ffff:192.0.2.1'));
  assert.equal(authClientKey('::ffff:c000:201'), authClientKey('192.0.2.1'));
  assert.equal(
    authClientKey('2001:db8:1:2::1'),
    authClientKey('2001:0DB8:0001:0002:abcd:ef01:2345:6789'),
  );
  assert.notEqual(authClientKey('2001:db8:1:2::1'), authClientKey('2001:db8:1:3::1'));
  assert.equal(authClientKey('fe80::1%eth0'), authClientKey('fe80::2%eth1'));
  assert.equal(authClientKey(undefined), 'unknown');
  const f = fixture();
  for (let i = 0; i < policy.loginMax; i++) f.call({ ip: '2001:db8:1:2::1' });
  assert.equal(f.call({ ip: '2001:db8:1:2::99' }).error.status, 429);
  assert.equal(f.call({ ip: '2001:db8:1:3::1' }).allowed, true);
});

test('limiter guards only POST login/register, with existing case/trailing-slash matching', () => {
  const f = fixture();
  for (const method of METHODS.filter((value) => value !== 'POST')) {
    for (let i = 0; i < policy.loginMax + 1; i++) assert.equal(f.call({ method }).allowed, true);
  }
  for (const path of ['/me', '/permissions', '/login/other', '/register/other', '/movies']) {
    for (let i = 0; i < policy.loginMax + 1; i++) assert.equal(f.call({ path }).allowed, true);
  }
  for (let i = 0; i < policy.loginMax; i++)
    assert.equal(f.call({ path: i % 2 ? '/LOGIN/' : '/login' }).allowed, true);
  assert.equal(f.call({ path: '/Login' }).error.status, 429);
});

test('R4.5-10 separate limiter factories start independent state without a global reset', () => {
  const a = fixture(),
    b = fixture();
  for (let i = 0; i < policy.loginMax; i++) a.call();
  assert.equal(a.call().error.status, 429);
  assert.equal(b.call().allowed, true);
});

test('invalid policies cannot accidentally disable protection', () => {
  for (const field of Object.keys(policy)) {
    for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '3']) {
      assert.throws(
        () => createAuthRateLimiter({ policy: { ...policy, [field]: value } }),
        TypeError,
      );
    }
  }
});

async function httpFixture(t, options = {}) {
  const app = createApp({ authRateLimit: { policy, now: options.now ?? (() => 0) } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return {
    app,
    request: async (route, { method = 'POST', body = {}, raw, headers = {}, source } = {}) => {
      const url = `http://127.0.0.1:${server.address().port}/api${route}`;
      let response;
      const args = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        ...(method === 'GET' ? {} : { body: raw ?? JSON.stringify(body) }),
      };
      if (source) {
        // node:http allows genuine independent source IPs; forwarded headers do not.
        const { request } = await import('node:http');
        response = await new Promise((resolve, reject) => {
          const req = request(
            url,
            { method, headers: args.headers, localAddress: source },
            (res) => {
              let value = '';
              res.setEncoding('utf8').on('data', (chunk) => {
                value += chunk;
              });
              res.on('end', () =>
                resolve({
                  status: res.statusCode,
                  payload: JSON.parse(value),
                  retry: res.headers['retry-after'],
                }),
              );
            },
          );
          req.on('error', reject);
          req.end(args.body);
        });
        return response;
      }
      response = await fetch(url, args);
      return {
        status: response.status,
        payload: await response.json().catch(() => null),
        retry: response.headers.get('retry-after'),
      };
    },
  };
}
const credentials = { Email: 'unit@example.test', MatKhau: 'unit-password' };
const registration = { HoTen: 'Unit User', ...credentials };

test('R4.5-07/09 real HTTP login short-circuits before service and preserves429 JSON/header', async (t) => {
  let calls = 0;
  t.mock.method(authService, 'login', async () => {
    calls++;
    return { token: 'unit-token', expiresIn: '1h', user: { userId: 1 } };
  });
  const f = await httpFixture(t);
  for (let i = 0; i < policy.loginMax; i++)
    assert.equal((await f.request('/auth/login', { body: credentials })).status, 200);
  const limited = await f.request('/auth/LOGIN/?x=1', {
    body: { ...credentials, Email: 'changed@example.test' },
  });
  assert.equal(limited.status, 429);
  assert.equal(limited.retry, String(policy.windowMs / 1000));
  assert.deepEqual(limited.payload, {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication requests. Please try again later.',
    },
  });
  assert.equal(calls, policy.loginMax);
  assert.equal('token' in limited.payload, false);
});

test('R4.5-08 real HTTP register short-circuits before registration service', async (t) => {
  let calls = 0;
  t.mock.method(authService, 'registerCustomer', async () => {
    calls++;
    return { userId: 17 };
  });
  const f = await httpFixture(t);
  for (let i = 0; i < policy.registerMax; i++) {
    const result = await f.request('/auth/register', { body: registration });
    assert.equal(result.status, 201);
    assert.deepEqual(result.payload, {
      user: { userId: 17 },
      message: 'Registration completed. Please sign in.',
    });
  }
  assert.equal((await f.request('/auth/register', { body: registration })).status, 429);
  assert.equal(calls, policy.registerMax);
  assert.equal((await f.request('/auth/login')).status, 400);
});

test('malformed JSON/credentials count before parsing and do not call auth service', async (t) => {
  let calls = 0;
  t.mock.method(authService, 'login', async () => {
    calls++;
  });
  const f = await httpFixture(t);
  assert.equal((await f.request('/auth/login', { raw: '{' })).status, 400);
  for (let i = 1; i < policy.loginMax; i++)
    assert.equal(
      (await f.request('/auth/login', { body: { Email: `changed${i}@example.test` } })).status,
      400,
    );
  const limited = await f.request('/auth/login', { raw: '{' });
  assert.equal(limited.status, 429);
  assert.equal(limited.payload.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.equal(calls, 0);
});

test('real HTTP forged forwarded headers cannot bypass current trust proxy=false', async (t) => {
  const f = await httpFixture(t);
  assert.equal(f.app.get('trust proxy'), false);
  for (let i = 0; i < policy.loginMax + 3; i++) {
    const result = await f.request('/auth/login', {
      headers: {
        'X-Forwarded-For': `198.51.100.${i + 1}`,
        Forwarded: `for=198.51.100.${i + 1}`,
        'X-Real-IP': `203.0.113.${i + 1}`,
      },
    });
    assert.equal(result.status, i < policy.loginMax ? 400 : 429);
  }
});

test('real HTTP independent socket sources have separate counters', async (t) => {
  const f = await httpFixture(t);
  for (let i = 0; i < policy.loginMax; i++)
    assert.equal((await f.request('/auth/login', { source: '127.0.0.1' })).status, 400);
  assert.equal((await f.request('/auth/login', { source: '127.0.0.1' })).status, 429);
  assert.equal((await f.request('/auth/login', { source: '127.0.0.2' })).status, 400);
});

test('real HTTP burst admits exact threshold and unaffected routes/methods retain contracts', async (t) => {
  const f = await httpFixture(t);
  const burst = await Promise.all(
    Array.from({ length: policy.loginMax + 10 }, () => f.request('/auth/login')),
  );
  assert.equal(burst.filter((row) => row.status === 400).length, policy.loginMax);
  assert.equal(burst.filter((row) => row.status === 429).length, 10);
  for (const [route, method, status] of [
    ['/health', 'GET', 200],
    ['/auth/login', 'GET', 404],
    ['/auth/login', 'PUT', 404],
    ['/auth/login', 'OPTIONS', 204],
    ['/auth/me', 'GET', 401],
    ['/auth/permissions', 'GET', 401],
    ['/bookings', 'POST', 401],
    ['/orders', 'GET', 401],
    ['/admin/users', 'GET', 401],
    ['/manager/cinemas', 'GET', 401],
  ]) {
    assert.equal((await f.request(route, { method })).status, status, route + ':' + method);
  }
  assert.equal((await f.request('/auth/register')).status, 400);
});

test('real HTTP app instances and deterministic expiry do not leak limiter state', async (t) => {
  let time = 0;
  const a = await httpFixture(t, { now: () => time }),
    b = await httpFixture(t);
  for (let i = 0; i < policy.loginMax; i++) await a.request('/auth/login');
  assert.equal((await a.request('/auth/login')).status, 429);
  assert.equal((await b.request('/auth/login')).status, 400);
  time = policy.windowMs;
  assert.equal((await a.request('/auth/login')).status, 400);
});

test('production defaults and positive environment overrides are validated without a test bypass', () => {
  assert.ok(Object.isFrozen(env.authRateLimit));
  const script =
    "import {env} from './src/config/env.js';console.log(JSON.stringify(env.authRateLimit));";
  const base = {
    ...process.env,
    NODE_ENV: 'test',
    AUTH_RATE_LIMIT_WINDOW_MS: '',
    AUTH_RATE_LIMIT_LOGIN_MAX: '',
    AUTH_RATE_LIMIT_REGISTER_MAX: '',
    AUTH_RATE_LIMIT_MAX_KEYS: '',
  };
  const run = (patch) =>
    spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: new URL('..', import.meta.url),
      env: { ...base, ...patch },
      encoding: 'utf8',
    });
  const defaults = run({});
  assert.equal(defaults.status, 0);
  assert.deepEqual(JSON.parse(defaults.stdout), {
    windowMs: 60000,
    loginMax: 20,
    registerMax: 10,
    maxKeys: 10000,
  });
  const configured = run({ AUTH_RATE_LIMIT_LOGIN_MAX: '7', AUTH_RATE_LIMIT_WINDOW_MS: '3000' });
  assert.equal(configured.status, 0);
  assert.equal(JSON.parse(configured.stdout).loginMax, 7);
  for (const value of ['0', '-1', '3.1', '3x', 'NaN', '9007199254740992']) {
    const invalid = run({ AUTH_RATE_LIMIT_LOGIN_MAX: value });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /must be a positive safe integer/);
  }
});
