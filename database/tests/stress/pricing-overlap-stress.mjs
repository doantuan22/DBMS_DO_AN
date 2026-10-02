#!/usr/bin/env node
// Manual pre-release stress test for the pricing overlap trigger (migration 013), through the real API.
// For each round it sends PARALLEL identical pricing-rule creations (same cinema, same conditions, overlapping validity):
// exactly one may succeed, the others must be 409 PRICING_OVERLAP. After every round the active rules of the cinema are read
// back and checked for an overlapping pair with the same conditions. Any 5xx fails the run.
// Exit code: 0 = clean, 1 = a wrong outcome / 5xx / overlapping pair, 2 = bad setup.
// It leaves a cinema AUDIT_STRESS_PRICING_<id> and its pricing rows (the API cannot delete them; the rows are set to
// "Hết hạn" at the end), so run it ONLY against a disposable database. Not part of `npm test`. See README.md.

const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')).map(([key, value]) => [key, value ?? 'true']));
const setting = (name, env, fallback) => args[name] ?? process.env[env] ?? fallback;

const baseUrl = String(setting('base-url', 'STRESS_BASE_URL', 'http://localhost:4000/api')).replace(/\/$/, '');
const adminEmail = setting('email', 'STRESS_ADMIN_EMAIL');
const adminPassword = process.env.STRESS_ADMIN_PASSWORD; // never accepted on the command line
const rounds = Number(setting('rounds', 'STRESS_ROUNDS', 12));
const parallel = Number(setting('parallel', 'STRESS_PARALLEL', 2));

if (!adminEmail || !adminPassword || process.env.STRESS_CONFIRM_DISPOSABLE !== 'yes' || !Number.isInteger(rounds) || rounds < 1 || rounds > 60 || !Number.isInteger(parallel) || parallel < 2) {
  console.error('Usage: STRESS_CONFIRM_DISPOSABLE=yes STRESS_ADMIN_PASSWORD=... node pricing-overlap-stress.mjs --email=admin@example.com [--base-url=...] [--rounds=12 (1-60)] [--parallel=2]');
  console.error('The run leaves a cinema and pricing rows behind: use a disposable database only (set STRESS_CONFIRM_DISPOSABLE=yes).');
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

const admin = (await call('POST', '/auth/login', undefined, { Email: adminEmail, MatKhau: adminPassword })).body?.token;
if (!admin) { console.error('Admin login failed'); process.exit(2); }
const runId = Date.now().toString(36);
const cinemaId = (await call('POST', '/admin/cinemas', admin, { name: `AUDIT_STRESS_PRICING_${runId}`, address: 'stress', city: 'stress' })).body?.cinema?.RapID;
if (!cinemaId) { console.error('Could not create the stress cinema'); process.exit(2); }
console.log(`cinema ${cinemaId} (run ${runId}), ${rounds} rounds x ${parallel} parallel creates`);

const SEATS = ['Thường', 'VIP', 'Sweetbox', 'Đôi'], DAYS = ['Ngày thường', 'Cuối tuần', 'Ngày lễ'], FORMATS = ['2D', '3D', 'IMAX', '4DX', 'ScreenX'];
const create = (body) => call('POST', '/admin/pricing', admin, { cinemaId, surcharge: 1000, ...body });
const overlaps = (a, b) => a.PhuThu !== undefined && a.LoaiGhe === b.LoaiGhe && a.LoaiNgay === b.LoaiNgay && a.DinhDang === b.DinhDang
  && a.NgayBatDau.slice(0, 10) <= (b.NgayKetThuc?.slice(0, 10) ?? '9999-12-31') && b.NgayBatDau.slice(0, 10) <= (a.NgayKetThuc?.slice(0, 10) ?? '9999-12-31');

let wrongRounds = 0; let fiveHundreds = 0; const created = [];
for (let r = 0; r < rounds; r++) {
  // each round has its own condition set, so rounds never conflict with each other; the requests of one round do
  const body = { seatType: SEATS[r % SEATS.length], dayType: DAYS[Math.floor(r / SEATS.length) % DAYS.length], format: FORMATS[Math.floor(r / (SEATS.length * DAYS.length)) % FORMATS.length], startsOn: '2041-01-01', endsOn: '2041-12-31' };
  const results = await Promise.all(Array.from({ length: parallel }, () => create(body)));
  const ok = results.filter((x) => x.status >= 200 && x.status < 300);
  const conflicts = results.filter((x) => x.status === 409 && x.body?.error?.code === 'PRICING_OVERLAP');
  if (ok.length !== 1 || conflicts.length !== parallel - 1) { wrongRounds++; console.log(`  round ${r + 1}: ${results.map(label).join(' | ')}`); }
  fiveHundreds += results.filter((x) => x.status >= 500 || x.status === 0).length;
  ok.forEach((x) => created.push(x.body?.pricing?.GiaID));
}
expect(wrongRounds === 0, `${rounds} rounds x ${parallel} identical parallel creates -> exactly one success per round, the rest 409 PRICING_OVERLAP (wrong rounds: ${wrongRounds})`);
expect(fiveHundreds === 0, `no 5xx / network error (${fiveHundreds})`);

const rows = (await call('GET', `/admin/pricing?cinemaId=${cinemaId}`, admin)).body?.pricing ?? [];
const active = rows.filter((row) => row.TrangThai === 'Áp dụng');
let pairs = 0; for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) if (overlaps(active[i], active[j])) pairs++;
expect(pairs === 0 && active.length === rounds, `${active.length} active rules for ${rounds} rounds, ${pairs} overlapping pair(s)`);

// reference semantics once: an adjacent range and an expired duplicate are allowed
const base = { seatType: 'Đôi', dayType: 'Ngày lễ', format: 'ScreenX' };
const a = await create({ ...base, startsOn: '2050-01-01', endsOn: '2050-01-31' });
const adjacent = await create({ ...base, startsOn: '2050-02-01', endsOn: null });
const touching = await create({ ...base, startsOn: '2050-01-31', endsOn: '2050-02-02' });
expect(a.status < 300 && adjacent.status < 300 && touching.status === 409, `control cases: first ${label(a)}, adjacent day ${label(adjacent)}, touching end day ${label(touching)}`);

// leave nothing active
for (const row of (await call('GET', `/admin/pricing?cinemaId=${cinemaId}`, admin)).body?.pricing ?? []) {
  if (row.TrangThai === 'Áp dụng') await call('PUT', `/admin/pricing/${row.GiaID}`, admin, { surcharge: row.PhuThu, status: 'Hết hạn' });
}
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
