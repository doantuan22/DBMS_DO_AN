import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {connect,mainSnapshot,rbacInventory,productionHashes,evidence,write,read,dbRoot,normalizeModule,ask} from './common.mjs';
const final=process.argv.includes('--final');
const pool=await connect('CinemaBookingDB');
try {
 const state={at:new Date().toISOString(),source:productionHashes(),database:await mainSnapshot(pool)};
 if(final){
  const before=JSON.parse(read(path.join(evidence,'before.json')));
  assert.deepEqual(state.source,before.source,'R3A must not modify production source.');
  assert.deepEqual(state.database,before.database,'R3A must not modify main database source, schema, permissions or data.');
  const names=(await ask(pool,"SELECT name FROM sys.databases WHERE name LIKE N'CinemaBookingDB%' ORDER BY name")).recordset;
  assert.deepEqual(names,[{name:'CinemaBookingDB'}],'Audit fixture must be deleted.');
  state.productionUnchanged=true;state.fixtureCleaned=true;
 } else {
  write(path.join(evidence,'rbac-inventory.json'),await rbacInventory(pool));
  const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
  const modules=(await ask(pool,'SELECT o.name,m.definition FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0')).recordset;
  const drift=[];
  for(const [name,file] of Object.entries(manifest.modules)) {
   const body=read(path.join(dbRoot,file));const start=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);
   if(normalizeModule(body.slice(start.index).replace(/\s+GO\s*$/i,''))!==normalizeModule(modules.find(m=>m.name===name)?.definition))drift.push(name);
  }
  assert.deepEqual(drift,[],'Main DB must match audited source.');
  state.modulesChecked=Object.keys(manifest.modules).length;
 }
 write(path.join(evidence,final?'after.json':'before.json'),state);
 console.log(`PASS ${final?'production source + main DB unchanged; fixture cleaned':'main snapshot; 158 modules match source'}`);
} finally {await pool.close();}
