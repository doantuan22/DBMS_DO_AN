// Live GET check for the reviewed manifest URLs; never changes their license/match classification.
import { root, dbRoot, read, write } from './lib.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
const manifests = ['movie', 'cinema', 'product'].flatMap((kind) =>
  JSON.parse(read(path.join(dbRoot, '10_seed/media/' + kind + '-media-manifest.json'))).map(
    (e) => ({ ...e, kind }),
  ),
);
const urls = [...new Set(manifests.filter((e) => e.status === 'VALID').map((e) => e.posterUrl))];
const results = [];
for (const url of urls) {
  const item = { url, checkedAt: new Date().toISOString() };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || /token|signature|expires|undefined/i.test(parsed.search))
      throw new Error('HTTPS stable URL required');
    const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
    const b = Buffer.from(await r.arrayBuffer());
    Object.assign(item, {
      status: r.status,
      mime: r.headers.get('content-type'),
      bytes: b.length,
      sha256: crypto.createHash('sha256').update(b).digest('hex'),
    });
    if (!r.ok || !item.mime?.startsWith('image/')) throw new Error('Image HTTP/MIME mismatch');
    item.result = 'PASS';
  } catch (e) {
    item.result = 'FAIL';
    item.reason = e.message;
  }
  results.push(item);
  console.log(item.result, item.status || '', url);
}
const blockers = manifests
  .filter((e) => e.status !== 'VALID')
  .map((e) => ({ kind: e.kind, key: e.key, status: e.status, reason: e.reason }));
write(path.join(root, '.audit-output/seed-v2/media-transport-latest.json'), {
  checkedAt: new Date().toISOString(),
  urls: results,
  blockers,
  status: results.some((r) => r.result === 'FAIL')
    ? 'FAIL'
    : 'PASS_TRANSPORT_WITH_DECLARED_BLOCKERS',
});
if (results.some((r) => r.result === 'FAIL')) process.exitCode = 1;
