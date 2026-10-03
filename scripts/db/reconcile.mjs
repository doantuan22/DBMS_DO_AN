import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, dbRoot, audit, read, write, walk, sqlcmd } from './lib.mjs';
import { inventory } from './inventory.mjs';
import { PROCEDURES } from '../../backend/src/db/procedures.js';

export function normalize(s) {
  return (s || '').replace(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\/|\s+|[^\s]+/g, token => {
    if (token.startsWith('--') || token.startsWith('/*')) return ' ';
    if (/^N?'/.test(token)) return token;
    return token.toLowerCase().replaceAll('[', '').replaceAll(']', '');
  }).replace(/^\s*(?:create\s+or\s+alter|alter)\s+/i, 'create ').replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();
}
const legacy = path.join(dbRoot, '_legacy_snapshot');
const stages = ['schema/01_schema.sql', 'functions/02_functions.sql', 'views/03_views.sql', 'triggers/04_triggers.sql', ...['system','auth','customer','manager','support','admin'].map(n => `procedures/${n}/${n}_procedures.sql`), ...fs.readdirSync(path.join(legacy, 'migrations')).filter(n => n.endsWith('.sql')).sort().map(n => `migrations/${n}`)];
const sourceModules = new Map();
for (const file of stages) {
  const sql = read(path.join(legacy, file));
  for (const batch of sql.split(/^\s*GO\s*(?:--[^\r\n]*)?$/im)) {
    const m = /\b(?:CREATE\s+(?:OR\s+ALTER\s+)?|ALTER\s+)(PROCEDURE|FUNCTION|VIEW|TRIGGER)\s+(?:\[?dbo\]?\.)?\[?(\w+)\]?/i.exec(batch);
    if (m) sourceModules.set(m[2], { name: m[2], kind: m[1], file, definition: batch.slice(m.index).trim() });
  }
}
const before = JSON.parse(read(path.join(audit, 'before-metadata.json')));
const drift = before.objects.filter(o => o.definition).map(o => {
  const src = sourceModules.get(o.name);
  return { name: o.name, type: o.type.trim(), status: !src ? 'DB_ONLY' : normalize(src.definition) === normalize(o.definition) ? 'MATCH' : 'DIFFERENT_DEFINITION', source: src?.file || null, decision: 'KEEP', reason: 'Preserve deployed behavior; bring its reviewed definition into source.' };
});
for (const src of sourceModules.values()) if (!drift.some(o => o.name === src.name)) drift.push({name: src.name, type: src.kind, status: 'SOURCE_ONLY', source: src.file, decision: 'KEEP', reason: 'Retain source object and verify dependencies; no deletion based on absence alone.'});
write(path.join(audit, 'source-modules.json'), [...sourceModules.values()]);
write(path.join(audit, 'module-reconciliation.json'), drift);
const files = walk(root).filter(p => p.endsWith('.sql')).map(p => ({ path: path.relative(root,p).replaceAll('\\','/'), sha256: crypto.createHash('sha256').update(read(p)).digest('hex') }));
write(path.join(audit, 'source-files.json'), files);
const calls = Object.entries(PROCEDURES).map(([key, qualifiedName]) => {
  const name = qualifiedName.split('.').at(-1);
  const callers = walk(path.join(root,'backend/src')).filter(p => p.endsWith('.js') && read(p).includes(`'${key}'`)).map(p => path.relative(root,p).replaceAll('\\','/'));
  return { key,name,callers,source:sourceModules.has(name),database:before.objects.some(o => o.name===name),parameters:before.parameters.filter(p=>p.objectName===name) };
});
write(path.join(audit, 'backend-procedure-contracts.json'), calls);
const table = rows => rows.map(r => '| '+r.join(' | ')+' |').join('\n');
write(path.join(audit, 'current-db-inventory.md'), `# Current database inventory\n\nCaptured directly from SQL Server before rebuild. Full columns, identity, computed columns, constraints, indexes, module definitions and SET options, parameter signatures, schemas, users, roles, permissions and dependencies: [before-metadata.json](before-metadata.json).\n\n${JSON.stringify(before.environment)}\n\nThe 26th table is dbo.HINHANH_RAPCHIEUPHIM: business metadata, KEEP. Created by migration 009_cinema_images.sql, refined by 010/011. Used by public cinema list/gallery and admin image CRUD. It is not an audit fixture.\n\n| Object Type | Object Name | Schema | Dependency | Found In Source? | Found In Database? | Classification | Notes |\n|---|---|---|---|---|---|---|---|\n${table(before.objects.map(o=>[o.type_desc,o.name,o.schemaName,[...new Set(before.dependencies.filter(d=>d.objectName===o.name).map(d=>d.referenced_entity_name))].join(', '),o.definition?(sourceModules.has(o.name)?'Yes':'No'):'See source replay','Yes','KEEP',drift.find(d=>d.name===o.name)?.status || 'Structural object']))}\n`);
write(path.join(audit, 'source-db-inventory.md'), `# Source SQL inventory\n\nLegacy source preserved in ../_legacy_snapshot (never executed by baseline). Active legacy deployment order was inspected before changes. ${files.length} repository SQL files inventoried in source-files.json; ${sourceModules.size} final module definitions after ordered migration replay. Test/plan SQL is evidence, not production deployment.\n\n| Object | Kind | Final source file |\n|---|---|---|\n${table([...sourceModules.values()].map(o=>[o.name,o.kind,o.file]))}\n\nWhitelist entries: ${calls.length}; unique procedures: ${new Set(calls.map(c=>c.name)).size}; active service call sites: ${calls.reduce((n,c)=>n+c.callers.length,0)}. Backend calls without source: ${calls.filter(c=>c.callers.length&&!c.source).map(c=>c.name).join(', ') || 'none'}. Calls and deployed signatures: backend-procedure-contracts.json.\n`);
write(path.join(audit, 'reconciliation-report.md'), `# Source ↔ Database reconciliation\n\nCompare final ordered legacy module definitions, live SQL metadata and backend whitelist. No business policy changed. Deployed module definitions chosen for drift objects to preserve running behavior; source definitions retained for any SOURCE_ONLY object. CREATE OR ALTER and explicit result columns are mechanical changes only. Structural source comparison is performed by a disposable replay database, without seed or server login changes.\n\n| Object | Status | Source | Decision | Reason |\n|---|---|---|---|---|\n${table(drift.map(o=>[o.name,o.status,o.source || '—',o.decision,o.reason]))}\n\nSOURCE_SP_NOT_USED / possible UNUSED (retained until a separate removal review): ${[...sourceModules.values()].filter(o=>o.kind==='PROCEDURE'&&!calls.some(c=>c.name===o.name&&c.callers.length)).map(o=>o.name).join(', ')}. Backend call without database: ${calls.filter(c=>c.callers.length&&!c.database).map(c=>c.name).join(', ')||'none'}. Missing from baseline is verified after generation; it must be zero. Result contracts are checked using SQL metadata and live smoke tests, not only counts. See structural-reconciliation.json after disposable replay.\n`);
console.log(JSON.stringify(drift.reduce((a,o)=>(a[o.status]=(a[o.status]||0)+1,a),{})));

if (process.argv.includes('--replay-source')) {
  const database = 'CinemaBookingDB_R0_Source';
  sqlcmd(`IF DB_ID(N'${database}') IS NOT NULL THROW 51000, 'Source replay target already exists; refusing overwrite.', 1;`, {database:'master',integrated:true});
  for (const file of stages) {
    sqlcmd(read(path.join(legacy,file)).replaceAll('CinemaBookingDB',database), {database:file.startsWith('schema/')?'master':database,integrated:true,file:true});
    console.log(`replayed ${file}`);
  }
  const replay = inventory(database,true);
  write(path.join(audit,'source-replay-metadata.json'), replay);
  const differences = {};
  for (const name of ['columns','keys','foreignKeys','checks','indexes']) {
    const clean = a => a.map(o => { const c={...o}; if(c.defaultName?.startsWith('DF__')) delete c.defaultName; return c; });
    const actual=clean(before[name]), source=clean(replay[name]);
    const a=new Set(actual.map(JSON.stringify)), b=new Set(source.map(JSON.stringify));
    differences[name]={databaseOnly:actual.filter(o=>!b.has(JSON.stringify(o))),sourceOnly:source.filter(o=>!a.has(JSON.stringify(o)))};
  }
  write(path.join(audit,'structural-reconciliation.json'),differences);
  console.log('Structural differences: '+JSON.stringify(Object.fromEntries(Object.entries(differences).map(([k,v])=>[k,{dbOnly:v.databaseOnly.length,sourceOnly:v.sourceOnly.length}]))));
}
