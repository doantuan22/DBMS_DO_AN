import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthenticate } from '../src/middleware/authenticate.js';
import { requirePermission } from '../src/middleware/requirePermission.js';

function run(middleware, req) {
  return new Promise((resolve) => middleware(req, {}, (error) => resolve(error ?? null)));
}

test('authentication requires a bearer token and attaches DB-reloaded identity', async () => {
  let loadedId;
  const authenticate = createAuthenticate({
    verify: (token) => token === 'valid' ? { userId: 23 } : (() => { throw Object.assign(new Error(), { status: 401, code: 'UNAUTHENTICATED' }); })(),
    loadUser: async (id) => { loadedId = id; return { userId: id, role: 'ADMIN', permissions: [] }; },
  });
  const missing = await run(authenticate, { get: () => undefined });
  assert.equal(missing.status, 401);
  const invalid = await run(authenticate, { get: () => 'Bearer invalid' });
  assert.equal(invalid.status, 401);
  const req = { get: () => 'Bearer valid' };
  assert.equal(await run(authenticate, req), null);
  assert.equal(loadedId, 23);
  assert.equal(req.user.userId, 23);
});

test('permission middleware allows a grant and returns 401/403 otherwise', async () => {
  const check = requirePermission('QL_NGUOIDUNG');
  assert.equal(await run(check, { user: { permissions: [{ code: 'QL_NGUOIDUNG' }] } }), null);
  assert.equal((await run(check, { user: { permissions: [] } })).status, 403);
  assert.equal((await run(check, {})).status, 401);
});
