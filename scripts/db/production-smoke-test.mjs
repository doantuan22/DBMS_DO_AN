import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, credentials, sqlcmd } from './lib.mjs';

const env = credentials();
const TARGET_DB = 'CinemaBookingDB';

Object.assign(process.env, env, {
  DB_DATABASE: TARGET_DB,
  JWT_SECRET: env.JWT_SECRET || 'U3J2K1S2xW0LWXw5JVcggFLANj7DjQIENIlB9HclxBqoHBelHg1LfDFYCmSJCfUk',
  JWT_EXPIRES_IN: '1h',
});

process.chdir(path.join(root, 'backend'));
const { createApp } = await import('../../backend/src/app.js');
const { closePool } = await import('../../backend/src/db/pool.js');
const { issueToken } = await import('../../backend/src/utils/jwt.js');

console.log('========================================================================');
console.log('CINEMABOOKINGDB — POST-MIGRATION CONTROLLED PRODUCTION SMOKE TEST');
console.log('========================================================================');
console.log('Target Database:', TARGET_DB);

const server = createApp().listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/api`;
console.log(`Backend server listening on ${base}`);

const testResults = [];

async function apiRequest(route, { method = 'GET', token, body, expectedStatus = 200 } = {}) {
  const url = base + route;
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => null);
  assert.equal(res.status, expectedStatus, `Route ${route} expected status ${expectedStatus}, got ${res.status}: ${JSON.stringify(data)}`);
  testResults.push({ route, method, status: res.status });
  return data?.data ?? data;
}

try {
  // 1. Health Checks
  console.log('\n[1/7] Testing Health Checks ...');
  const health = await apiRequest('/health');
  assert.equal(health.status, 'ok');
  const dbHealth = await apiRequest('/health/db');
  assert.equal(dbHealth.ok, true);
  console.log('  -> Health Checks: PASS');

  // 2. Catalog & Discovery
  console.log('\n[2/7] Testing Catalog & Products ...');
  const { movies } = await apiRequest('/movies');
  assert.ok(movies.length > 0, 'Movies catalog must not be empty');
  const { cinemas } = await apiRequest('/cinemas');
  assert.ok(cinemas.length > 0, 'Cinemas list must not be empty');
  const { genres } = await apiRequest('/genres');
  assert.ok(genres.length > 0, 'Genres list must not be empty');
  const { products } = await apiRequest('/products');
  assert.ok(products.length > 0, 'Products list must not be empty');
  console.log(`  -> Catalog: PASS (${movies.length} movies, ${cinemas.length} cinemas, ${products.length} products)`);

  // 3. Customer Role Verification (User ID = 7)
  console.log('\n[3/7] Testing Customer Role & Dynamic Order Projections (User ID 7) ...');
  const custToken = issueToken(7).token;
  const custMe = await apiRequest('/auth/me', { token: custToken });
  assert.equal(custMe.user.userId, 7);
  assert.equal(custMe.user.role, 'KHACH_HANG');

  const { orders } = await apiRequest('/orders', { token: custToken });
  assert.ok(Array.isArray(orders), 'Orders list must be an array');
  console.log(`  -> Customer Orders: PASS (${orders.length} orders found)`);

  // Verify dynamic calculation on historical order #3
  const order3 = await apiRequest('/orders/3', { token: custToken });
  assert.equal(order3.order.id, 3);
  assert.ok(order3.order.payments.length >= 2, 'Order 3 must have at least 2 payment attempts');
  const p2 = order3.order.payments.find(p => p.status === 'Thành công');
  assert.ok(p2, 'Order 3 must have a successful payment');
  assert.equal(p2.amount, 99000, 'Payment amount must be dynamically projected as 99,000 VND');
  console.log('  -> Dynamic Payment Projection on Order #3: PASS (Amount = 99,000 VND)');

  // 4. Manager Scope Verification (User ID = 3, Manager of Cinemas 1 and 2)
  console.log('\n[4/7] Testing Manager Scope & Revenue (User ID 3) ...');
  const mgrToken = issueToken(3).token;
  const mgrMe = await apiRequest('/auth/me', { token: mgrToken });
  assert.equal(mgrMe.user.userId, 3);
  assert.equal(mgrMe.user.role, 'QUAN_LY_RAP');

  const mgrCinemas = await apiRequest('/manager/cinemas', { token: mgrToken });
  assert.ok(mgrCinemas.cinemas.length > 0, 'Manager must have assigned cinemas');
  const mgrDash = await apiRequest('/manager/cinemas/1/dashboard', { token: mgrToken });
  assert.ok(mgrDash, 'Manager dashboard for Cinema 1 must return data');
  const mgrRev = await apiRequest('/manager/cinemas/1/revenue', { token: mgrToken });
  assert.ok(mgrRev, 'Manager revenue report must return data');
  console.log('  -> Manager Scope & Revenue: PASS');

  // 5. Support Role Verification (User ID = 5)
  console.log('\n[5/7] Testing Customer Support Complaints Queue (User ID 5) ...');
  const supToken = issueToken(5).token;
  const supMe = await apiRequest('/auth/me', { token: supToken });
  assert.equal(supMe.user.userId, 5);
  assert.equal(supMe.user.role, 'CSKH');
  const complaints = await apiRequest('/support/complaints', { token: supToken });
  assert.ok(Array.isArray(complaints.complaints), 'Support complaints must be an array');
  console.log(`  -> Support Queue: PASS (${complaints.complaints.length} complaints)`);

  // 6. Admin Role Verification (User ID = 1)
  console.log('\n[6/7] Testing Admin Dashboard & Strict 3NF Revenue Integrity (User ID 1) ...');
  const admToken = issueToken(1).token;
  const admMe = await apiRequest('/auth/me', { token: admToken });
  assert.equal(admMe.user.userId, 1);
  assert.equal(admMe.user.role, 'ADMIN');

  const admDash = await apiRequest('/admin/dashboard', { token: admToken });
  assert.ok(admDash, 'Admin dashboard must return data');

  const admRev = await apiRequest('/admin/reports/revenue?fromDate=2026-10-01&toDate=2026-10-14', { token: admToken });
  assert.ok(admRev.summary, 'Admin revenue report must return summary');
  assert.equal(admRev.summary.TongDoanhThuThucTe, 446500, 'Total collected cash revenue must match 446,500 VND');
  console.log('  -> Admin Dashboard & Cash Revenue Integrity: PASS (Gross Collected = 446,500 VND)');

  // 7. Security Denial & RBAC Boundary Enforcement
  console.log('\n[7/7] Testing RBAC Security Boundary (Customer accessing Admin API) ...');
  await apiRequest('/admin/dashboard', { token: custToken, expectedStatus: 403 });
  console.log('  -> Security Boundary: PASS (Customer blocked with HTTP 403)');

  console.log('\n========================================================================');
  console.log(`ALL PRODUCTION SMOKE TESTS PASSED (${testResults.length} API assertions verified)`);
  console.log('========================================================================');
} finally {
  server.close();
  await closePool();
}
