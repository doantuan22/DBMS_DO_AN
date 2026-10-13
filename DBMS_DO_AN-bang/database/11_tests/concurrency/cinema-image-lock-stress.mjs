#!/usr/bin/env node
// Manual pre-release stress test for the cinema image lock (migrations 010/011).
// Fires Update (hide/show) interleaved with SetCover on several images of one cinema through the
// real API, then checks the "at most one cover per cinema, and it is active" invariant.
// Not part of `npm test` or deploy.ps1 -RunTests. See README.md in this folder.
// Exit code: 0 = clean, 1 = a 500/unexpected status or invariant violation, 2 = bad setup.

const PREFIX = 'ZZ_STRESS_';
const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')).map(([key, value]) => [key, value ?? 'true']));
const setting = (name, env, fallback) => args[name] ?? process.env[env] ?? fallback;

const baseUrl = String(setting('base-url', 'STRESS_BASE_URL', 'http://localhost:4000/api')).replace(/\/$/, '');
const email = setting('email', 'STRESS_ADMIN_EMAIL');
const password = process.env.STRESS_ADMIN_PASSWORD; // never accepted on the command line (shell history)
const rounds = Number(setting('rounds', 'STRESS_ROUNDS', 3));
const perRound = Number(setting('requests', 'STRESS_REQUESTS', 400));
const concurrency = Number(setting('concurrency', 'STRESS_CONCURRENCY', 10));

if (!email || !password || ![rounds, perRound, concurrency].every((n) => Number.isInteger(n) && n > 0)) {
  console.error('Usage: STRESS_ADMIN_PASSWORD=... node cinema-image-lock-stress.mjs --email=admin@example.com [--base-url=http://localhost:4000/api] [--rounds=3] [--requests=400] [--concurrency=10]');
  process.exit(2);
}

let token;
const call = async (method, path, body) => {
  try {
    const response = await fetch(baseUrl + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) });
    return { status: response.status, body: await response.json().catch(() => null) };
  } catch (error) { return { status: 0, body: { error: { code: `NETWORK_${error.cause?.code ?? error.name}` } } }; }
};

const stats = { total: 0, byStatus: {}, unexpected: [], violations: [] };
let cinemaId = null;

async function deleteCinemaTree(id) {
  const images = (await call('GET', `/admin/cinemas/${id}/images`)).body?.images ?? [];
  for (const image of images) await call('DELETE', `/admin/cinemas/${id}/images/${image.HinhAnhRapID}`);
  return (await call('DELETE', `/admin/cinemas/${id}`)).status;
}

async function cleanup() {
  // Own cinema first, then leftovers of any earlier crashed run (matched by the ZZ_STRESS_ prefix only).
  const cinemas = (await call('GET', '/admin/cinemas')).body?.cinemas ?? [];
  const ids = new Set([cinemaId, ...cinemas.filter((cinema) => String(cinema.TenRap).startsWith(PREFIX)).map((cinema) => cinema.RapID)].filter(Boolean));
  for (const id of ids) {
    const status = await deleteCinemaTree(id);
    console.log(`cleanup: cinema ${id} -> ${status}`);
    if (status !== 200) stats.unexpected.push(`cleanup of cinema ${id} returned ${status}`);
  }
}

function record(label, result, allow409) {
  stats.total++;
  stats.byStatus[result.status] = (stats.byStatus[result.status] ?? 0) + 1;
  const ok = result.status === 200 || (allow409 && result.status === 409 && result.body?.error?.code === 'CINEMA_IMAGE_INACTIVE');
  if (!ok) stats.unexpected.push(`${label} -> ${result.status} ${result.body?.error?.code ?? ''}`);
}

async function main() {
  const login = await call('POST', '/auth/login', { Email: email, MatKhau: password });
  token = login.body?.token;
  if (!token) { console.error(`Login failed (${login.status})`); process.exitCode = 2; return; }

  await cleanup(); // sweep leftovers before starting
  const created = await call('POST', '/admin/cinemas', { name: `${PREFIX}${Date.now()}`, address: 'stress', city: 'stress' });
  cinemaId = created.body?.cinema?.RapID;
  if (!cinemaId) { console.error(`Could not create the stress cinema (${created.status})`); process.exitCode = 2; return; }
  const ids = [];
  for (let n = 0; n < 3; n++) ids.push((await call('POST', `/admin/cinemas/${cinemaId}/images`, { url: `https://example.invalid/stress-${n}.jpg`, displayOrder: n, cover: n === 0 })).body?.image?.HinhAnhRapID);
  if (ids.some((id) => !id)) { console.error('Could not create the stress images'); process.exitCode = 2; return; }

  const update = (id, status) => ({ label: `PUT ${id} ${status}`, allow409: false, run: () => call('PUT', `/admin/cinemas/${cinemaId}/images/${id}`, { url: 'https://example.invalid/stress.jpg', displayOrder: 0, status }) });
  const cover = (id) => ({ label: `PATCH cover ${id}`, allow409: true, run: () => call('PATCH', `/admin/cinemas/${cinemaId}/images/${id}/cover`, { cover: true }) }); // 409 = cover on a hidden image (valid)
  const [a, b, c] = ids;
  const pattern = [update(a, 'Tạm ẩn'), cover(b), update(b, 'Tạm ẩn'), cover(a), update(a, 'Hoạt động'), cover(c), update(c, 'Tạm ẩn'), update(b, 'Hoạt động'), cover(b), update(c, 'Hoạt động')];

  for (let round = 1; round <= rounds; round++) {
    for (const id of ids) await update(id, 'Hoạt động').run();
    await cover(a).run();
    let sent = 0;
    while (sent < perRound) {
      const batch = Array.from({ length: Math.min(concurrency, perRound - sent) }, (_, i) => pattern[(sent + i) % pattern.length]);
      const results = await Promise.all(batch.map((op) => op.run()));
      results.forEach((result, i) => record(batch[i].label, result, batch[i].allow409));
      sent += batch.length;
      const images = (await call('GET', `/admin/cinemas/${cinemaId}/images`)).body?.images ?? [];
      const covers = images.filter((image) => image.LaAnhDaiDien);
      if (covers.length > 1) stats.violations.push(`round ${round}, after ${sent} requests: ${covers.length} covers`);
      if (covers.some((image) => image.TrangThai !== 'Hoạt động')) stats.violations.push(`round ${round}, after ${sent} requests: a hidden image is the cover`);
    }
    console.log(`round ${round}/${rounds} done (${stats.total} requests so far)`);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { if (token) await cleanup(); process.exit(1); });

try { await main(); }
catch (error) { console.error(error); stats.unexpected.push(`script error: ${error.message}`); }
finally { if (token) await cleanup(); }

const count = (code) => stats.byStatus[code] ?? 0;
console.log(`requests=${stats.total} 200=${count(200)} 409(expected inactive-cover)=${count(409)} 500=${count(500)} other=${stats.total - count(200) - count(409) - count(500)}`);
console.log(`unexpected=${stats.unexpected.length} invariant violations=${stats.violations.length}`);
for (const line of [...stats.unexpected.slice(0, 10), ...stats.violations.slice(0, 10)]) console.log(`  ! ${line}`);
if (process.exitCode === 2) process.exit(2);
process.exit(stats.unexpected.length || stats.violations.length ? 1 : 0);
