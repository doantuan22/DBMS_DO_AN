import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthSession } from '../src/services/authSession.js';

function fixture() {
  const calls = [];
  const state = { token: null, user: { userId: 7, role: 'KHACH_HANG' } };
  const storage = {
    get: () => state.token,
    set: (token) => { state.token = token; },
    clear: () => { state.token = null; },
  };
  const api = {
    login: async () => { calls.push('login'); return { token: 'jwt-session' }; },
    getCurrentUser: async () => { calls.push('me'); return { user: state.user }; },
    registerCustomer: async () => { calls.push('register'); return { user: state.user }; },
    updateCurrentUser: async () => { calls.push('update'); return { user: state.user }; },
  };
  return { session: createAuthSession({ api, storage }), calls, state, api, storage };
}

test('initialization restores a user only when a session token exists', async () => {
  const { session, calls, state } = fixture();
  assert.equal(await session.initialize(), null);
  assert.deepEqual(calls, []);
  state.token = 'existing-token';
  assert.equal((await session.initialize()).userId, 7);
  assert.deepEqual(calls, ['me']);
});

test('login stores one token, loads current user, and logout clears it', async () => {
  const { session, calls, state } = fixture();
  const user = await session.login({ Email: 'user@example.com', MatKhau: 'secret' });
  assert.equal(user.role, 'KHACH_HANG');
  assert.equal(state.token, 'jwt-session');
  assert.deepEqual(calls, ['login', 'me']);
  session.logout();
  assert.equal(state.token, null);
});

test('failed current-user refresh clears the just-issued token', async () => {
  const { session, state, api } = fixture();
  api.getCurrentUser = async () => { throw Object.assign(new Error('expired'), { status: 401 }); };
  await assert.rejects(session.login({ Email: 'user@example.com', MatKhau: 'secret' }), { status: 401 });
  assert.equal(state.token, null);
});
