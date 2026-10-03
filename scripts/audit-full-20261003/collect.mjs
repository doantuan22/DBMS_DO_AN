import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const root = path.resolve(import.meta.dirname, '../..');
export const out = path.join(root, 'docs/audit-full-20261003/evidence');
fs.mkdirSync(out, { recursive: true });
export const save = (name, value) => fs.writeFileSync(path.join(out, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2));
export const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  if (['node_modules', '.git', 'dist', 'audit-full-20261003'].includes(e.name)) return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});

if (process.argv[1] === import.meta.filename) {
  for (const [name, args] of [
    ['git-status-before.txt', ['status']], ['git-log-before.txt', ['log', '--oneline', '-10']],
    ['git-diff-before.patch', ['diff']], ['git-diff-cached-before.patch', ['diff', '--cached']],
    ['git-head.txt', ['rev-parse', 'HEAD']],
  ]) {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    save(name, r.stdout + r.stderr);
  }
  const files = walk(root).filter(p => /\.(?:md|sql|jsx?|mjs|json|ps1)$/.test(p) && !p.endsWith('package-lock.json'));
  save('source-inventory.json', files.map(p => ({
    path: path.relative(root, p).replaceAll('\\', '/'),
    lines: fs.readFileSync(p, 'utf8').split('\n').length,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),
  })));
  const env = {};
  for (const area of ['backend', 'frontend']) {
    const p = path.join(root, area, '.env');
    const values = fs.existsSync(p) ? Object.fromEntries(fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => {
      const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
    })) : {};
    const allowed = /^(NODE_ENV|PORT|FRONTEND_URL|DB_SERVER|DB_PORT|DB_DATABASE|DB_USER|DB_ENCRYPT|DB_TRUST_SERVER_CERTIFICATE|VITE_API_BASE_URL)$/;
    env[area] = { exists: fs.existsSync(p), safeValues: Object.fromEntries(Object.entries(values).filter(([k]) => allowed.test(k))), passwordConfigured: !!values.DB_PASSWORD, jwtConfigured: !!values.JWT_SECRET };
  }
  save('environment-redacted.json', { node: process.version, platform: process.platform, env });
  console.log(JSON.stringify({ files: files.length, env, evidence: out }, null, 2));
}
