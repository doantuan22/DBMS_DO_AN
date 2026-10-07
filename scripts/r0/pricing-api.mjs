// R0 HTTP integration against a disposable source-built database only.
import assert from 'node:assert/strict';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { spawn } from 'node:child_process';
import { credentials, root, write } from '../db/lib.mjs';
const database = process.argv.find(arg => arg.startsWith('--database='))?.slice(11);
assert.match(database ?? '', /^CinemaBookingDB_R0_[A-Za-z0-9_]+$/);
const env = credentials();
Object.assign(process.env, env, { DB_DATABASE: database });
process.chdir(path.join(root, 'backend'));
const { createApp } = await import('../../backend/src/app.js');
const { closePool } = await import('../../backend/src/db/pool.js');
const pool = await new sql.ConnectionPool({ server: env.DB_SERVER || 'localhost', port: Number(env.DB_PORT || 1433), database, user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: env.DB_ENCRYPT === 'true', trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== 'false', useUTC: true } }).connect();
const server = createApp().listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const evidence = { database, startedAt: new Date().toISOString(), status: 'RUNNING', requests: [], createdRuleIds: [] };
const tokens = {};
async function api(role, method, route, body, expected) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(tokens[role] ? { Authorization: 'Bearer ' + tokens[role] } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (method === 'POST' && /\/pricing$/.test(route) && response.status < 300) {
    const row = (result.data ?? result).pricing;
    const id = row?.id ?? row?.GiaID;
    if (Number.isInteger(id)) evidence.createdRuleIds.push(id);
  }
  evidence.requests.push({ role, method, route, dayType: body?.dayType, status: response.status, expected, error: result.error?.code });
  assert.equal(response.status, expected, `${role} ${route}: ${JSON.stringify(result)}`);
  return result.data ?? result;
}
const fingerprint = async () => JSON.stringify((await pool.request().query('SELECT * FROM dbo.BANGGIA ORDER BY GiaID')).recordset);
try {
  evidence.beforePricing = await fingerprint();
  for (const [role, email] of [['manager','manager.q1@cinemadb.vn'],['admin','admin@cinemadb.vn']]) {
    tokens[role] = (await api(role, 'POST', '/auth/login', { Email: email, MatKhau: '123456' }, 200)).token;
    assert.ok(tokens[role]);
    for (const dayType of ['Ngày thường','Cuối tuần','Tất cả']) {
      const body = { seatType: 'Đôi', dayType, format: role === 'manager' ? 'ScreenX' : '4DX', surcharge: 1234, startsOn: '2038-01-01', endsOn: '2038-01-02' };
      const result = await api(role, 'POST', role === 'manager' ? '/manager/cinemas/1/pricing' : '/admin/pricing', role === 'admin' ? { ...body, cinemaId: 1 } : body, role === 'manager' ? 201 : 200);
      const row = result.pricing; const id = row?.id ?? row?.GiaID;
      assert.ok(Number.isInteger(id));
      assert.equal(row.dayType ?? row.LoaiNgay, dayType);
      if (role === 'manager') {
        const changed = await api(role, 'PUT', `/manager/pricing/${id}`, { ...body, surcharge: 4321, status: 'Áp dụng' }, 200);
        assert.equal(changed.pricing.dayType, dayType);
        assert.equal(Number(changed.pricing.surcharge), 4321);
      }
      const invalidBefore = await fingerprint();
      for (const invalid of ['Ngày lễ','holiday','Holiday','HOLIDAY']) {
        await api(role, 'POST', role === 'manager' ? '/manager/cinemas/1/pricing' : '/admin/pricing',
          { ...body, dayType: invalid, ...(role === 'admin' ? { cinemaId: 1 } : {}) }, 400);
        if (role === 'manager') await api(role, 'PUT', `/manager/pricing/${id}`, { ...body, dayType: invalid, status: 'Áp dụng' }, 400);
      }
      assert.equal(await fingerprint(), invalidBefore, 'Rejected requests must not write pricing data.');
    }
  }
  evidence.rejectedRequestsPreservePricing = true;
  if (process.argv.includes('--stress')) {
    const result = await new Promise((resolve,reject) => {
      const child = spawn(process.execPath,[path.join(root,'database/11_tests/concurrency/pricing-overlap-stress.mjs'),'--email=admin@cinemadb.vn',`--base-url=${base}`,'--rounds=4','--parallel=2'],
        {env:{...process.env,STRESS_ADMIN_PASSWORD:'123456',STRESS_CONFIRM_DISPOSABLE:'yes'}});
      let output = ''; child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      child.stdout.on('data',chunk=>{output+=chunk;}); child.stderr.on('data',chunk=>{output+=chunk;});
      child.on('error',reject); child.on('exit',exitCode=>resolve({exitCode,output}));
    });
    write(path.join(root,'docs/r0-20261007/pricing-stress.txt'),result.output);
    const cinema = /^cinema (\d+) \(run /m.exec(result.output)?.[1];
    if (cinema) {
      const cleanup = await pool.request().input('Cinema',sql.Int,Number(cinema)).query(`
        IF EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema AND TenRap LIKE 'AUDIT_STRESS_PRICING[_]%')
        BEGIN DELETE dbo.BANGGIA WHERE RapID=@Cinema; DELETE dbo.RAPCHIEUPHIM WHERE RapID=@Cinema; END;`);
      evidence.stressFixtureCleanup = {cinemaId:Number(cinema),affected:cleanup.rowsAffected};
    }
    evidence.pricingStress = {status:result.exitCode===0?'PASS':'FAIL',exitCode:result.exitCode,rounds:4,parallel:2};
    assert.equal(result.exitCode,0,'Existing pricing overlap stress must pass with the R0 day types.');
  }
  evidence.status = 'PASS';
} catch (error) { evidence.status = 'FAIL'; evidence.error = error.message; throw error; }
finally {
  // Remove only rows returned by this run, on the explicitly disposable target.
  if (evidence.createdRuleIds.length) await pool.request().query(`DELETE dbo.BANGGIA WHERE GiaID IN (${evidence.createdRuleIds.join(',')});`);
  evidence.fixtureCleanupPreservesPricing = (await fingerprint()) === evidence.beforePricing;
  delete evidence.beforePricing;
  evidence.completedAt = new Date().toISOString();
  write(path.join(root, 'docs/r0-20261007/pricing-api.json'), evidence);
  await new Promise(resolve => server.close(resolve)); await closePool(); await pool.close();
}
assert.ok(evidence.fixtureCleanupPreservesPricing);
console.log(JSON.stringify({ status: evidence.status, requests: evidence.requests.length, rejectedRequestsPreservePricing: true, fixtureCleanup: true }));
