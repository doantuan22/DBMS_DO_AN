import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,database,connect,snapshot,summarize,read,write,evidenceRoot,normalizeModule} from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(f=>f&&!f.startsWith('scripts/r47/')&&!f.startsWith('docs/evidence/r47/'));
write(path.join(evidenceRoot,'preserved-before.json'),Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])));
for(const file of ['database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql','backend/src/services/orderService.js','docs/FULL_SYSTEM_AUDIT.md'])write(path.join(evidenceRoot,'before-source',file),read(path.join(root,file)));
const pool=await connect();
try{
 const before=await snapshot(pool),manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
 for(const [name,file] of Object.entries(manifest.modules)){
  const source=read(path.join(root,'database',file)),match=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(source);
  assert.equal(normalizeModule(before.metadata.objects.find(row=>row.name===name).definition),normalizeModule(source.slice(match.index).replace(/\s+GO\s*$/i,'')),name);
 }
 const tables=['DONDATVE','CHITIETVE','CHITIETDOAN','GHE','THANHTOAN','KHUYENMAI'];
 const graph=(await pool.request().query("SELECT OBJECT_NAME(referencing_id) caller,referenced_schema_name,referenced_entity_name callee FROM sys.sql_expression_dependencies WHERE referencing_id IN(OBJECT_ID('dbo.sp_Order_GetDetailByCustomer'),OBJECT_ID('dbo.vw_ChiTietDonDatVe'),OBJECT_ID('dbo.fn_BayGio'),OBJECT_ID('dbo.sp_Order_ExpirePending')) ORDER BY caller,callee")).recordset;
 const inventory=(await pool.request().query("SELECT TrangThai,COUNT(*) n FROM dbo.DONDATVE GROUP BY TrangThai;SELECT COUNT(*) n FROM dbo.DONDATVE WHERE TrangThai=N'Ch? thanh to?n' AND(HanGiuCho IS NULL OR HanGiuCho<=dbo.fn_BayGio())")).recordsets;
 write(path.join(evidenceRoot,'audit-before.json'),{status:'PASS',at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),baseline:'Working source after Task14, pending Tasks9-14 and all evidence preserved',database,main:summarize(before),allModuleParity:Object.keys(manifest.modules).length,parameters:before.metadata.parameters.filter(row=>['sp_Order_GetDetailByCustomer','sp_Order_ExpirePending'].includes(row.objectName)),columns:before.metadata.columns.filter(row=>tables.includes(row.tableName)),checks:before.metadata.checks.filter(row=>tables.includes(row.tableName)),keys:before.metadata.keys.filter(row=>tables.includes(row.tableName)),foreignKeys:before.metadata.foreignKeys.filter(row=>tables.includes(row.tableName)),graph,orderInventory:inventory[0],expiredPending:inventory[1][0].n,rootCause:'Detail SP calls expiry for entire showtime before reading four resultsets; expires unrelated orders/tickets and returns promotion quota.',job:'Existing server startup registers 60s job; shutdown stops it; tick calls typed EXPIRE_PENDING_ORDERS, overlap guard/error recovery/unref existing. No production job change needed.',statusDecision:'Existing TrangThaiDon/DTO status already effective via SQL view. Keep fields and four sets; Detail projection uses existing expiry predicate including NULL, persisted state unchanged; no new EffectiveStatus field or JS calculation.',plan:'Remove nested expiry and unused show lookup; compute existing status projection in Detail using DB fn_BayGio. No expiry/payment/booking/job/Backend/Frontend production change.'});
 console.log(`PASS before R4.7: ${Object.keys(manifest.modules).length} modules, ${before.data.length} tables, main expiredPending=${inventory[1][0].n}; source/main frozen.`);
}finally{await pool.close();}
