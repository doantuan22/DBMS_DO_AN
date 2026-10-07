// Offline tooling and sqlcmd orchestration only. Never imported by backend/src.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import os from 'node:os';
import crypto from 'node:crypto';

export const root = path.resolve(import.meta.dirname, '../..');
export const dbRoot = path.join(root, 'database');
export const audit = path.join(dbRoot, '_audit');
export const read = p => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
export const write = (p, value) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); };
export function credentials() {
  const file = path.join(root, 'backend/.env');
  return { ...(fs.existsSync(file) ? parseEnv(read(file)) : {}), ...process.env };
}
export function sqlcmd(sql, { database = 'CinemaBookingDB', integrated = false, json = false, file = false } = {}) {
  const env = credentials();
  const args = ['-S', `${env.DB_SERVER || 'localhost'},${env.DB_PORT || 1433}`, '-d', database, '-I', '-b', '-r', '1', '-l', '10', '-t', '180', '-f', '65001'];
  if(env.DB_TRUST_SERVER_CERTIFICATE!=='false')args.push('-C');
  const help=spawnSync('sqlcmd',['-?'],{encoding:'utf8'}).stdout || '';
  const optionalEncryption=help.includes('-N[s|m|o]');
  if(env.DB_ENCRYPT==='true')args.push(optionalEncryption?'-Nm':'-N');
  else if(optionalEncryption)args.push('-No');
  if (integrated) args.push('-E');
  else {
    if (!env.DB_USER || !env.DB_PASSWORD) throw new Error('Configure DB_USER and DB_PASSWORD in backend/.env or environment.');
    args.push('-U', env.DB_USER);
  }
  if (json) args.push('-y', '0', '-w', '65535');
  // Credentials travel in environment, never command arguments, files or output.
  let temporary;
  if (file) {
    temporary = path.join(os.tmpdir(), `cinema-r0-${crypto.randomUUID()}.sql`);
    fs.writeFileSync(temporary, sql);
  }
  let result;
  try {
    result = spawnSync('sqlcmd', [...args, ...(file ? ['-i', temporary] : ['-Q', sql])], { cwd: dbRoot, env: { ...process.env, SQLCMDPASSWORD: env.DB_PASSWORD || '' }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } finally { if (temporary) fs.unlinkSync(temporary); }
  // Some local Windows ODBC clients cannot initialize TLS even when the project disables encryption.
  // The failure occurs before SQL is executed. Reuse mssql for offline build/test tooling only.
  if (!integrated && result.status !== 0 && /Encryption not supported on the client/.test(result.stderr || '')) {
    result = spawnSync(process.execPath, [path.join(root, 'scripts/db/mssql-runner.mjs'), database, json ? 'json' : 'text'],
      { cwd: dbRoot, env: { ...process.env, ...env }, input: sql, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  }
  if (result.status !== 0) throw new Error(`sqlcmd failed (${result.status}): ${result.stdout}\n${result.stderr}`);
  return json ? result.stdout : result.stdout + result.stderr;
}
export function query(sql, options = {}) {
  const raw = sqlcmd(`SET NOCOUNT ON; SELECT CAST((${sql} FOR JSON PATH, INCLUDE_NULL_VALUES) AS nvarchar(max));`, { ...options, json: true }).trim().split(/\r?\n/).join('');
  return raw === 'NULL' ? [] : JSON.parse(raw);
}
export const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => ['node_modules', '.git', 'dist', '_legacy_snapshot'].includes(e.name) ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
export function expandSql(file, stack=[]) {
  const absolute=path.resolve(dbRoot,file);
  if(!absolute.startsWith(dbRoot+path.sep)||stack.includes(absolute))throw new Error('Unsafe or cyclic SQL include: '+file);
  return read(absolute).replace(/^:on error exit\s*$/gm,'').replace(/^:r\s+(.+)$/gm,(_,ref)=>expandSql(ref.trim(),[...stack,absolute]));
}
export function normalizeModule(sql) {
  const tokens=(sql||'').match(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\/|\s+|[^\s'\/-]+|./g)||[];
  const normalized=tokens.map(t=>/^N?'/.test(t)?t:/^--|^\/\*|^\s/.test(t)?' ':t.toLowerCase());
  // Collapse adjacent whitespace tokens only; never normalize whitespace within a SQL literal.
  return normalized.filter((t,i)=>t!==' '||normalized[i-1]!==' ').join('').trim()
    .replace(/^(?:create(?:\s+or\s+alter)?|alter)\s+/i,'create ');
}
