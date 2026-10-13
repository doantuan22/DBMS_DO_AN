// Real HTTP/SP integration on a verified disposable database, never on main.
import assert from 'node:assert/strict';
import { credentials, sqlcmd, expandSql, write } from './lib.mjs';
import { preflight, validateTestName } from './test-target.mjs';
const database = validateTestName(process.argv.find((v) => v.startsWith('--database='))?.slice(11));
const gate = preflight(database);
assert.ok(gate.target, 'A built, seeded test target is required');
Object.assign(process.env, credentials(), { DB_DATABASE: database });
const { createApp } = await import('../../backend/src/app.js');
const { getPool } = await import('../../backend/src/db/pool.js');
const server = createApp().listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const checks = [];
const runId = Date.now().toString(36);
const password = 'FixedRbac-demo-123!';
async function request(path, { method = 'GET', token, body } = {}, expected = 200, code) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${data.error?.code ?? 'response'}`);
  if (code) assert.equal(data.error?.code, code);
  checks.push({ method, path, expected, actual: response.status, status: 'PASS' });
  return data;
}
const login = (email, plain = '123456') => request('/auth/login', { method: 'POST', body: { Email: email, MatKhau: plain } });
const expectedCodes = {
  KHACH_HANG: ['XEM_PHIM','DAT_VE','THANH_TOAN','DANH_GIA','GUI_KHIEU_NAI'],
  QUAN_LY_RAP: ['XEM_PHIM','DAT_VE','THANH_TOAN','QL_PHONG','QL_GHE','QL_SUAT_CHIEU','QL_BANG_GIA','XEM_BAO_CAO_RAP'],
  CSKH: ['XEM_PHIM','QL_KHIEUNAI','XULY_KHIEUNAI','TRA_CUU_DON'],
};
function permissionsMatch(user, expected) {
  assert.deepEqual(user.permissions.map((p) => p.code).sort(), [...expected].sort());
}
try {
  // Recheck identity in the same SQL session and prove the migration is safe to reapply.
  const migration = sqlcmd(gate.sqlGuard + expandSql('13_migrations/r9_fixed_rbac.sql'), { database, file: true });
  write('.audit-output/fixed-rbac-migration.log', migration);
  const actors = {};
  for (const [role,email] of [['ADMIN','admin@cinemadb.vn'],['QUAN_LY_RAP','manager.q1@cinemadb.vn'],['CSKH','cskh@cinemadb.vn'],['KHACH_HANG','khachhang1@gmail.com']]) {
    actors[role] = await login(email);
    assert.equal(actors[role].user.role, role);
    if (expectedCodes[role]) permissionsMatch(actors[role].user, expectedCodes[role]);
    else assert.equal(actors[role].user.permissions.length, 23);
    const current = await request('/auth/me', { token: actors[role].token });
    assert.equal(current.user.role, role);
  }
  const admin = actors.ADMIN.token;
  for (const [role,path] of [['ADMIN','/admin/users'],['QUAN_LY_RAP','/manager/cinemas'],['CSKH','/support/complaints'],['KHACH_HANG','/orders']]) {
    await request(path, { token: actors[role].token });
    for (const other of Object.keys(actors).filter((v) => v !== role))
      // Admin shares complaint handling via its own /admin route; staff portals retain exact role guards.
      await request(path, { token: actors[other].token }, 403);
  }
  const retiredPaths = ['/admin/roles','/admin/roles/2','/admin/permissions','/admin/permissions/1','/admin/roles/2/permissions'];
  for (const path of retiredPaths)
    for (const method of ['POST','PUT','PATCH','DELETE'])
      await request(path, { method, token: admin, body: { permissionIds: [14], name: 'Blocked' } }, 403, 'RBAC_FIXED');
  await request('/admin/roles', { method: 'POST', body: {} }, 401);
  await request('/admin/roles', { method: 'POST', token: actors.KHACH_HANG.token, body: {} }, 403);
  await request('/admin/permissions', { token: admin }, 404);
  await request('/admin/roles/2/permissions', { token: admin }, 404);
  const roles = (await request('/admin/roles', { token: admin })).roles;
  assert.deepEqual(roles.map((r) => r.MaVaiTro).sort(), ['ADMIN','CSKH','KHACH_HANG','QUAN_LY_RAP']);
  const customerRole = roles.find((r) => r.MaVaiTro === 'KHACH_HANG').VaiTroID;
  for (const roleId of [customerRole,999999])
    await request('/admin/users', { method: 'POST', token: admin, body: { name: 'Forbidden', email: `forbidden-${runId}-${roleId}@example.test`, password, roleId } }, 403, 'ROLE_CREATE_FORBIDDEN');
  const created = {};
  for (const role of ['QUAN_LY_RAP','CSKH','ADMIN']) {
    const email = `fixed-${role.toLowerCase()}-${runId}@example.test`;
    await request('/admin/users', { method: 'POST', token: admin, body: { name: `Fixed ${role}`, email, password, roleId: roles.find((r) => r.MaVaiTro === role).VaiTroID } });
    created[role] = await login(email,password);
    assert.equal(created[role].user.role,role);
    permissionsMatch(created[role].user,actors[role].user.permissions.map((p)=>p.code));
  }
  await request('/auth/register', { method:'POST',body:{ HoTen:'Escalation',Email:`escalation-${runId}@example.test`,MatKhau:password,role:'ADMIN' } },400,'ACCESS_FIELDS_NOT_ALLOWED');
  const customerEmail=`fixed-customer-${runId}@example.test`;
  await request('/auth/register',{method:'POST',body:{HoTen:'Fixed Customer',Email:customerEmail,MatKhau:password}},201);
  const customer=await login(customerEmail,password);
  assert.equal(customer.user.role,'KHACH_HANG');
  permissionsMatch(customer.user,expectedCodes.KHACH_HANG);
  await request(`/admin/users/${customer.user.userId}/status`,{method:'PUT',token:admin,body:{status:'Hoạt động',roleId:1}},400);
  await request(`/admin/users/${customer.user.userId}`,{method:'PUT',token:admin,body:{roleId:1}},404);
  const cinemas=(await request('/admin/cinemas',{token:admin})).cinemas;
  const [from,to]=cinemas;
  const manager=created.QUAN_LY_RAP;
  const assignmentBody={userId:manager.user.userId,cinemaId:from.RapID,startsOn:'2026-01-01',endsOn:null};
  await request('/admin/assignments',{method:'POST',token:admin,body:{...assignmentBody,userId:customer.user.userId}},400,'ASSIGNMENT_MANAGER_REQUIRED');
  const assignment=(await request('/admin/assignments',{method:'POST',token:admin,body:assignmentBody})).assignment;
  await request(`/manager/cinemas/${from.RapID}/rooms`,{token:manager.token});
  await request(`/manager/cinemas/${to.RapID}/rooms`,{token:manager.token},403);
  await request(`/admin/assignments/${assignment.PhanCongID}`,{method:'PUT',token:admin,body:{...assignmentBody,cinemaId:to.RapID,status:'Hiệu lực'}});
  // The original JWT must lose its old cinema scope immediately.
  await request(`/manager/cinemas/${from.RapID}/rooms`,{token:manager.token},403);
  await request(`/manager/cinemas/${to.RapID}/rooms`,{token:manager.token});
  const fresh=(await request('/auth/me',{token:manager.token})).user;
  assert.equal(fresh.cinemaAssignments.length,1);
  const listed=(await request('/admin/assignments',{token:admin})).assignments;
  assert.equal(listed.find((a)=>a.PhanCongID===assignment.PhanCongID).RapID,to.RapID);
  const sqlTests=sqlcmd(gate.sqlGuard+expandSql('11_tests/permissions/fixed_rbac.sql'),{database,file:true});
  write('.audit-output/fixed-rbac-sql-tests.log',sqlTests);
  console.log(sqlTests.trim());
  write('.audit-output/fixed-rbac-http-results.json',{database,transport:'REAL_HTTP_SQL',checks,status:'PASS'});
  console.log(`PASS ${checks.length} real HTTP/SQL checks on ${database}`);
} catch (error) {
  write('.audit-output/fixed-rbac-http-results.json',{database,transport:'REAL_HTTP_SQL',checks,status:'FAIL',error:error.message});
  throw error;
} finally {
  await new Promise((resolve)=>server.close(resolve));
  await (await getPool()).close();
}
