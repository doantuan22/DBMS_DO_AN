// Restricted migration: all 26 tables must match the proven R0/R1 seed snapshot.
// No generic conversion of production/history rows is supported.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sql from '../../backend/node_modules/mssql/index.js';
import { root, dbRoot, credentials, read, write, normalizeModule } from '../db/lib.mjs';

const R0_COMMIT='9867d15ba93f73dd8afcd618f99ab1c226289e11';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
const rollback=process.argv.includes('--rollback');
if(!/^CinemaBookingDB(?:_R0_R1_[A-Za-z0-9_]+)?$/.test(database||''))throw new Error('Explicit CinemaBookingDB or R1 disposable target required.');
if(!process.argv.includes('--apply'))throw new Error('Review the fingerprint evidence; then use --apply for the guarded seed-only migration.');
const gitRead=file=>{const result=spawnSync('git',['show',`${R0_COMMIT}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw Error(`Cannot read pinned R0 source ${file}`);return result.stdout;};
const oldManifest=JSON.parse(gitRead('database/baseline-manifest.json'));
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
const evidence=path.join(root,'audit/remediation/evidence');
const r0=JSON.parse(read(path.join(evidence,'R0-seed-reference.json'))).tables;
const r1=JSON.parse(read(path.join(evidence,'R1-seed-reference.json'))).tables;
const before=rollback?r1:r0,after=rollback?r0:r1;
const env=credentials();if(env.NODE_ENV==='production')throw Error('This exact-seed migration is development-only.');
const pool=await new sql.ConnectionPool({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:true,useUTC:true}}).connect();
const q=name=>'['+name.replaceAll(']',']]')+']';
const moduleSource=source=>source.slice(source.search(/CREATE\s+OR\s+ALTER\s+(?:FUNCTION|PROCEDURE|VIEW|TRIGGER)\b/i)).replace(/\s*GO\s*$/i,'');
function assertFingerprints(actual,expected,message) {
 const different=actual.filter(t=>!expected.some(e=>e.table===t.table&&e.rows===t.rows&&e.sha256===t.sha256));
 if(different.length)throw Error(message+' Tables: '+different.map(t=>t.table).join(', '));
}
async function fingerprints(provider) {
 const result=[];
 for(const table of before) {
  const columns=manifest.expected.columns.filter(c=>c.tableName===table.table).map(c=>q(c.name)).join(',');
  const keys=manifest.expected.indexes.filter(i=>i.tableName===table.table&&i.is_primary_key&&i.key_ordinal>0).sort((a,b)=>a.key_ordinal-b.key_ordinal).map(i=>q(i.columnName)).join(',');
  const raw=(await new sql.Request(provider).query(`SELECT CAST((SELECT ${columns} FROM dbo.${q(table.table)} ORDER BY ${keys} FOR JSON PATH, INCLUDE_NULL_VALUES) AS nvarchar(max)) AS RowsJson;`)).recordset[0].RowsJson;
  const rows=JSON.parse(raw||'[]');
  result.push({table:table.table,rows:rows.length,sha256:crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex')});
 }
 return result;
}
async function batches(source,provider) {for(const batch of source.split(/^GO\s*$/gmi).filter(s=>s.trim()))await new sql.Request(provider).query(batch);}
const changed=manifest.steps.filter(file=>Object.values(manifest.modules).includes(file)).filter(file=>{
 if(!Object.values(oldManifest.modules).includes(file))return true;
 return normalizeModule(read(path.join(dbRoot,file)))!==normalizeModule(gitRead('database/'+file));
});
const tables={NGUOIDUNG:['NgayTao'],HINHANH_RAPCHIEUPHIM:['NgayTao'],VAITRO_QUYEN:['NgayGan'],KHUYENMAI:['NgayBatDau','NgayKetThuc'],SUATCHIEU:['ThoiGianBatDau','ThoiGianKetThuc']};
const transaction=new sql.Transaction(pool);let open=false;transaction.on('rollback',()=>{open=false;});
let backup;
try {
 assertFingerprints(await fingerprints(pool),before,'Target is not the exact proven seed. DATA REMEDIATION DEFERRED; no changes applied.');
 if(database==='CinemaBookingDB') {
  const directory=(await pool.request().query("SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS Directory")).recordset[0].Directory;
  if(!directory)throw Error('SQL Server backup directory unavailable');
  const backupPath=directory.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_pre_R1_${crypto.randomUUID()}.bak`;
  await pool.request().input('BackupPath',sql.NVarChar(4000),backupPath).query(`BACKUP DATABASE ${q(database)} TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;`);
  backup={copyOnly:true,checksum:true,restoreVerifyOnly:'PASS'};
  write(path.join(dbRoot,'_audit/R1-recovery-location.local.json'),{...backup,database,path:backupPath,at:new Date().toISOString()});
 }
 await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);open=true;
 // Recheck under exclusive locks; concurrent writes cannot invalidate the proof.
 for(const table of before)await new sql.Request(transaction).query(`SELECT COUNT_BIG(*) AS N FROM dbo.${q(table.table)} WITH(TABLOCKX,HOLDLOCK);`);
 assertFingerprints(await fingerprints(transaction),before,'Seed changed since preflight; transaction aborted without conversion.');
 // Reject definition drift as well as data drift.
 const expectedModules=rollback?manifest:oldManifest;
 const definitions=(await new sql.Request(transaction).query('SELECT OBJECT_NAME(object_id) AS Name,definition FROM sys.sql_modules;')).recordset;
 for(const [name,file]of Object.entries(expectedModules.modules)) {
  const actual=definitions.find(d=>d.Name===name);
  assert.ok(actual,`Missing ${name}`);
  const expected=rollback?read(path.join(dbRoot,file)):gitRead('database/'+file);
  assert.equal(normalizeModule(actual.definition),normalizeModule(moduleSource(expected)),`Definition drift: ${name}`);
 }
 if(rollback)for(const [table,columns]of Object.entries(tables))await new sql.Request(transaction).query(`UPDATE dbo.${q(table)} SET ${columns.map(c=>`${q(c)}=CONVERT(datetime2(7),dbo.fn_GioRap(${q(c)}))`).join(',')};`);
 const defaults=read(path.join(dbRoot,'03_constraints/005_function_defaults.sql'));
 const drop=[...defaults.matchAll(/ALTER TABLE (dbo\.\[\w+\]) ADD CONSTRAINT (\[\w+\])/g)].map(m=>`ALTER TABLE ${m[1]} DROP CONSTRAINT ${m[2]};`).join('\n');
 await new sql.Request(transaction).query(drop);
 for(const file of changed) {
  if(rollback&&!Object.values(oldManifest.modules).includes(file))continue;
  await batches(rollback?gitRead('database/'+file):read(path.join(dbRoot,file)),transaction);
 }
 await batches(defaults,transaction);
 if(!rollback)for(const [table,columns]of Object.entries(tables))await new sql.Request(transaction).query(`UPDATE dbo.${q(table)} SET ${columns.map(c=>`${q(c)}=dbo.fn_UtcTuGioRap(${q(c)})`).join(',')};`);
 else await new sql.Request(transaction).query('DROP FUNCTION dbo.fn_NgayKinhDoanh; DROP FUNCTION dbo.fn_GioRap; DROP FUNCTION dbo.fn_UtcTuGioRap;');
 const actualAfter=await fingerprints(transaction);
 assertFingerprints(actualAfter,after,'After conversion differs from independently rebuilt target seed; rolling back.');
 await transaction.commit();open=false;
 const report={status:'PASS',database,direction:rollback?'R1 -> R0 rollback':'R0 -> R1',provenance:{r0Commit:R0_COMMIT,all26BeforeMatch:true,all26AfterMatch:true,origin:'Exact immutable R0 seed; SQL-local seed literals/default clock, no API-generated rows'},backup,changedModules:changed.map(f=>path.basename(f,'.sql')),data:before.filter(t=>tables[t.table]).map(t=>({table:t.table,rows:t.rows,fields:tables[t.table]})),dateOnlyChanged:0,ambiguousHistoricalRowsModified:0,at:new Date().toISOString()};
 write(path.join(evidence,`migration-${database}${rollback?'-rollback':''}.json`),report);
 console.log(`PASS guarded seed migration ${rollback?'rollback':'forward'}: ${database}; all 26 before/after hashes match; ${backup?'verified COPY_ONLY backup':'disposable fixture'}`);
}finally{if(open)await transaction.rollback();await pool.close();}
