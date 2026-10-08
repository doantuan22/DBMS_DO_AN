import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { root,database,connect,snapshot,summarize,read,write,evidenceRoot,normalizeModule } from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const sourceFiles=['database/08_procedures/admin/sp_Admin_Report_Revenue.sql','backend/src/services/adminService.js','backend/tests/adminService.test.js','docs/FULL_SYSTEM_AUDIT.md'];
for(const file of sourceFiles)write(path.join(evidenceRoot,'before-source',file),read(path.join(root,file)));
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(f=>f&&!f.startsWith('scripts/r42/')&&!f.startsWith('docs/evidence/r42/'));
write(path.join(evidenceRoot,'preserved-before.json'),Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])));
const pool=await connect();
try{
 const before=await snapshot(pool);
 const report=before.metadata.objects.find(x=>x.name==='sp_Admin_Report_Revenue');
 const source=read(path.join(root,sourceFiles[0]));
 assert.equal(normalizeModule(report.definition),normalizeModule(source.slice(source.indexOf('CREATE OR ALTER')).replace(/\s+GO\s*$/i,'')));
 const inventory=(await pool.request().query("SELECT name FROM sys.databases WHERE name LIKE 'CinemaBookingDB%' ORDER BY name;SELECT p.name,TYPE_NAME(p.user_type_id) type,p.max_length,p.is_output FROM sys.parameters p WHERE p.object_id=OBJECT_ID('dbo.sp_Admin_Report_Revenue') ORDER BY p.parameter_id;SELECT TOP(1) NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='admin@cinemadb.vn';")).recordsets;
 const result=await pool.request().input('ActorID',(await import('./common.mjs')).sql.Int,inventory[2][0].NguoiDungID).execute('dbo.sp_Admin_Report_Revenue');
 assert.equal(result.recordsets.length,2);
 write(path.join(evidenceRoot,'audit-before.json'),{at:new Date().toISOString(),database,status:'PASS',main:summarize(before),databases:inventory[0],parameters:inventory[1],liveSourceParity:'PASS',recordsets:result.recordsets.map(rows=>({columns:Object.keys(rows.columns??{}),rows})),rules:'Success payment amounts aggregated once per order; business date of latest success (fallback created); no order-status filter; active ticket count; inclusive DATE bounds; optional cinema filter.'});
 console.log(`PASS before audit: live/source identical;${before.data.length} tables;2 recordsets;${inventory[0].length} databases available.`);
}finally{await pool.close();}
