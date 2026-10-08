import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,database,connect,snapshot,summarize,read,write,evidenceRoot,normalizeModule} from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(f=>f&&!f.startsWith('scripts/r44/')&&!f.startsWith('docs/evidence/r44/'));
write(path.join(evidenceRoot,'preserved-before.json'),Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])));
for(const file of ['backend/src/services/bookingService.js','docs/FULL_SYSTEM_AUDIT.md'])write(path.join(evidenceRoot,'before-source',file),read(path.join(root,file)));
const pool=await connect();try {
 const before=await snapshot(pool),manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
 for(const [name,file] of Object.entries(manifest.modules)){
  const source=read(path.join(root,'database',file)),match=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(source);
  assert.equal(normalizeModule(before.metadata.objects.find(row=>row.name===name).definition),normalizeModule(source.slice(match.index).replace(/\s+GO\s*$/i,'')),name);
 }
 const limits=(await pool.request().query('SELECT dbo.fn_GioiHanGheMoiDon() maxSeats,dbo.fn_GioiHanSoLuongSanPham() maxPerProduct,dbo.fn_GioiHanGiamGiaPhanTram() maxPercent,dbo.fn_GioiHanDonDangGiu() maxHolding,dbo.fn_ThoiGianGiuChoPhut() holdMinutes')).recordset[0];
 assert.deepEqual(limits,{maxSeats:10,maxPerProduct:10,maxPercent:99,maxHolding:3,holdMinutes:5});
 const names=['sp_Booking_Create','sp_Promotion_Validate','sp_Payment_CreateAttempt'];
 write(path.join(evidenceRoot,'audit-before.json'),{status:'PASS',at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline:'Current working state after Task 11, including uncommitted Tasks 9–11; preserve all existing files/evidence.',database,main:summarize(before),allModuleParity:Object.keys(manifest.modules).length,limits,parameters:before.metadata.parameters.filter(row=>names.includes(row.objectName)),checks:before.metadata.checks.filter(row=>['KHUYENMAI','CHITIETDOAN','DONDATVE','SUATCHIEU','SANPHAM'].includes(row.tableName))});
 console.log('PASS before audit: current Task 11 main/source parity; limits 10/10/99, 3 holds/5 minutes; original files and main fingerprint frozen.');
}finally{await pool.close();}
