import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthSession } from '../src/services/authSession.js';

function fixture() {
  const calls = [];
  const state = { token: null, user: { userId: 7, role: 'KHACH_HANG' } };
  const storage = {
    get: () => state.token,
    set: (token) => {
      state.token = token;
    },
    clear: () => {
      state.token = null;
    },
  };
  const api = {
    login: async () => {
      calls.push('login');
      return { token: 'jwt-session' };
    },
    getCurrentUser: async () => {
      calls.push('me');
      return { user: state.user };
    },
    registerCustomer: async () => {
      calls.push('register');
      return { user: state.user };
    },
    updateCurrentUser: async () => {
      calls.push('update');
      return { user: state.user };
    },
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
  api.getCurrentUser = async () => {
    throw Object.assign(new Error('expired'), { status: 401 });
  };
  await assert.rejects(session.login({ Email: 'user@example.com', MatKhau: 'secret' }), {
    status: 401,
  });
  assert.equal(state.token, null);
});

const deferred = () => { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes; reject=no; }); return {promise,resolve,reject}; };
test('profile and restore results arriving after logout cannot restore the former actor', async () => {
  const {session,state,api}=fixture(), profile=deferred(), me=deferred();
  state.token='old-token'; api.updateCurrentUser=()=>profile.promise; api.getCurrentUser=()=>me.promise;
  const updating=session.updateProfile({HoTen:'old user'}), restoring=session.initialize();
  session.logout(); profile.resolve({user:state.user}); me.resolve({user:state.user});
  await assert.rejects(updating,{name:'AbortError'});await assert.rejects(restoring,{name:'AbortError'});assert.equal(state.token,null);
});
test('late login cannot store its token after logout', async () => {
  const {session,state,api}=fixture(), response=deferred(); api.login=()=>response.promise;
  const signingIn=session.login({});session.logout();response.resolve({token:'stale-token'});
  await assert.rejects(signingIn,{name:'AbortError'});assert.equal(state.token,null);
});
test('older failed login refresh cannot erase a newer successful login token', async () => {
  const {session,state,api}=fixture(), oldMe=deferred();let reads=0,logins=0;
  api.login=async()=>({token:`token-${++logins}`}); api.getCurrentUser=()=>++reads===1?oldMe.promise:Promise.resolve({user:{userId:8}});
  const old=session.login({}); await Promise.resolve();await Promise.resolve();
  assert.equal((await session.login({})).userId,8);oldMe.reject(new Error('old response failed'));
  await assert.rejects(old);assert.equal(state.token,'token-2');
});
