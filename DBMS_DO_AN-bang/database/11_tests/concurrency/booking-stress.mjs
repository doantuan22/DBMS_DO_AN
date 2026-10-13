#!/usr/bin/env node
// Manual pre-release stress test for booking concurrency (seat locks, per-customer hold limit), through the real API.
//   A. SEAT_REQUESTS parallel bookings of ONE seat from several customers: exactly one 201, the rest 409.
//   B. OVERLAP_REQUESTS parallel bookings of random 3-seat subsets of a small seat pool: no seat is sold twice.
//   C. Every customer fires BURST parallel bookings: exactly 3 succeed (the holding-order limit), the rest are 409.
// Exit code: 0 = clean, 1 = a 5xx, a wrong outcome or an invariant violation, 2 = bad setup.
// It creates data that the API cannot delete (customers audit.stress.*, one showtime in the year 2100+):
// run it ONLY against a disposable database. Not part of `npm test` or deploy -RunTests. See README.md.

const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')).map(([key, value]) => [key, value ?? 'true']));
const setting = (name, env, fallback) => args[name] ?? process.env[env] ?? fallback;

const baseUrl = String(setting('base-url', 'STRESS_BASE_URL', 'http://localhost:4000/api')).replace(/\/$/, '');
const adminEmail = setting('email', 'STRESS_ADMIN_EMAIL');
const adminPassword = process.env.STRESS_ADMIN_PASSWORD; // never accepted on the command line
const customerCount = Number(setting('customers', 'STRESS_CUSTOMERS', 8));
const seatRequests = Number(setting('seat-requests', 'STRESS_SEAT_REQUESTS', 60));
const overlapRequests = Number(setting('overlap-requests', 'STRESS_OVERLAP_REQUESTS', 120));
const burst = Number(setting('burst', 'STRESS_BURST', 4));
const roomId = Number(setting('room-id', 'STRESS_ROOM_ID', 1));
const movieId = Number(setting('movie-id', 'STRESS_MOVIE_ID', 1));
const HOLD_LIMIT = 3; // dbo.fn_GioiHanDonDangGiu()

if (!adminEmail || !adminPassword || process.env.STRESS_CONFIRM_DISPOSABLE !== 'yes'
  || ![customerCount, seatRequests, overlapRequests, burst, roomId, movieId].every((n) => Number.isInteger(n) && n > 0)) {
  console.error('Usage: STRESS_CONFIRM_DISPOSABLE=yes STRESS_ADMIN_PASSWORD=... node booking-stress.mjs --email=admin@example.com [--base-url=...] [--customers=8] [--seat-requests=60] [--overlap-requests=120] [--burst=4] [--room-id=1] [--movie-id=1]');
  console.error('The run leaves customers and a showtime behind: use a disposable database only (set STRESS_CONFIRM_DISPOSABLE=yes).');
  process.exit(2);
}

const call = async (method, path, token, body) => {
  try {
    const response = await fetch(baseUrl + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) });
    return { status: response.status, body: await response.json().catch(() => null) };
  } catch (error) { return { status: 0, body: { error: { code: `NETWORK_${error.cause?.code ?? error.name}` } } }; }
};
const label = (r) => `${r.status}${r.body?.error?.code ? ' ' + r.body.error.code : ''}`;
const failures = [];
const expect = (ok, text) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${text}`); if (!ok) failures.push(text); };
const dist = (rows) => rows.reduce((m, k) => (m[k] = (m[k] ?? 0) + 1, m), {});
const runId = Date.now().toString(36);

const admin = (await call('POST', '/auth/login', undefined, { Email: adminEmail, MatKhau: adminPassword })).body?.token;
if (!admin) { console.error('Admin login failed'); process.exit(2); }

// customers
const customers = [];
for (let i = 1; i <= customerCount; i++) {
  const email = `audit.stress.${runId}.${i}@example.invalid`; const password = `Stress#${runId}${i}`;
  await call('POST', '/auth/register', undefined, { HoTen: `AUDIT_Stress_${runId}_${i}`, Email: email, MatKhau: password, SoDienThoai: `0${Math.floor(1e8 + Math.random() * 9e8)}` });
  const token = (await call('POST', '/auth/login', undefined, { Email: email, MatKhau: password })).body?.token;
  if (token) customers.push({ token });
}
if (customers.length !== customerCount) { console.error(`Could only create ${customers.length}/${customerCount} customers`); process.exit(2); }

// a private far-future showtime (retry on overlap: the day is derived from the clock)
let showtimeId = null;
for (let attempt = 0; attempt < 20 && !showtimeId; attempt++) {
  const day = new Date(Date.UTC(2100, 0, 1) + (Date.now() % 20000 + attempt * 37) * 86400000).toISOString().slice(0, 10);
  const r = await call('POST', '/admin/showtimes', admin, { movieId, roomId, startsAt: `${day}T10:00:00Z`, endsAt: `${day}T12:00:00Z`, format: '2D', basePrice: 80000 });
  showtimeId = r.body?.showtime?.recordsets?.[0]?.[0]?.SuatChieuID ?? null;
}
if (!showtimeId) { console.error('Could not create a showtime'); process.exit(2); }
const seatIds = (await call('GET', `/showtimes/${showtimeId}/seats`)).body?.seats?.map((s) => s.id) ?? [];
if (seatIds.length < 20) { console.error(`Room ${roomId} has only ${seatIds.length} seats; need at least 20`); process.exit(2); }
const book = (customer, seats) => call('POST', '/bookings', customer.token, { showtimeId, seatIds: seats, products: [] });
const nonFree = async () => (await call('GET', `/showtimes/${showtimeId}/seats`)).body.seats.filter((s) => s.status !== 'Trống').length;
console.log(`showtime ${showtimeId}, room ${roomId}, ${seatIds.length} seats, ${customers.length} customers (run ${runId})`);

// A: one seat, many parallel requests. Hold limit does not interfere: only one booking can succeed.
{
  const results = await Promise.all(Array.from({ length: seatRequests }, (_, i) => book(customers[i % customers.length], [seatIds[0]])));
  const d = dist(results.map(label));
  expect(results.filter((r) => r.status === 201).length === 1 && results.every((r) => r.status === 201 || r.status === 409), `A: ${seatRequests} parallel bookings of one seat -> exactly one 201, rest 409 ${JSON.stringify(d)}`);
  expect(!results.some((r) => r.status >= 500 || r.status === 0), 'A: no 5xx / network error');
}
// B: overlapping 3-seat sets from the pool seats[1..8]; the customers' hold limit caps successes, so use a fresh customer per request group
{
  const pool = seatIds.slice(1, 9); const pick = () => [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  const requested = Array.from({ length: overlapRequests }, pick);
  const results = await Promise.all(requested.map((seats, i) => book(customers[i % customers.length], seats)));
  const sold = requested.filter((_, i) => results[i].status === 201).flat();
  const unique = new Set(sold).size;
  expect(sold.length === unique, `B: ${overlapRequests} overlapping bookings -> ${sold.length} seats sold, ${unique} distinct (no seat sold twice) ${JSON.stringify(dist(results.map(label)))}`);
  expect(!results.some((r) => r.status >= 500 || r.status === 0), 'B: no 5xx / network error');
  const after = await nonFree();
  expect(after >= unique, `B: seat map shows ${after} non-free seats for ${unique} sold pool seats (+ seat 1 from A)`);
}
// C: per-customer holding limit under parallel bursts, on fresh customers and distinct seats
{
  const free = seatIds.slice(10);
  const groups = Math.min(customerCount, Math.floor(free.length / burst)); // every request gets its own seat, so only the hold limit can refuse
  if (groups < 1) { console.error(`Not enough free seats (${free.length}) for a burst of ${burst}`); process.exit(2); }
  const fresh = [];
  for (let i = 1; i <= groups; i++) {
    const email = `audit.stress.${runId}.c${i}@example.invalid`; const password = `Stress#${runId}c${i}`;
    await call('POST', '/auth/register', undefined, { HoTen: `AUDIT_Stress_${runId}_c${i}`, Email: email, MatKhau: password, SoDienThoai: `0${Math.floor(1e8 + Math.random() * 9e8)}` });
    const token = (await call('POST', '/auth/login', undefined, { Email: email, MatKhau: password })).body?.token; if (token) fresh.push({ token });
  }
  let n = 0;
  const all = await Promise.all(fresh.flatMap((customer) => Array.from({ length: burst }, () => book(customer, [free[n++]]))));
  const perCustomer = fresh.map((_, i) => all.slice(i * burst, (i + 1) * burst));
  const limitOk = perCustomer.every((rows) => rows.filter((r) => r.status === 201).length <= HOLD_LIMIT && rows.every((r) => r.body?.error?.code !== 'ACTIVE_ORDER_LIMIT_REACHED' || r.status === 409));
  const exact = burst > HOLD_LIMIT ? perCustomer.every((rows) => rows.filter((r) => r.status === 201).length === HOLD_LIMIT) : true;
  expect(limitOk, `C: no customer holds more than ${HOLD_LIMIT} orders (successes per customer: ${perCustomer.map((rows) => rows.filter((r) => r.status === 201).length)})`);
  expect(exact, `C: with a burst above the limit every customer gets exactly ${HOLD_LIMIT} successes`);
  expect(!all.some((r) => r.status >= 500 || r.status === 0), `C: no 5xx / network error ${JSON.stringify(dist(all.map(label)))}`);
}
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
