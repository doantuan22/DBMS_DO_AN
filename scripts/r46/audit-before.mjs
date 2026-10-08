import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,database,connect,snapshot,summarize,read,write,evidenceRoot,normalizeModule} from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(f=>f&&!f.startsWith('scripts/r46/')&&!f.startsWith('docs/evidence/r46/'));
write(path.join(evidenceRoot,'preserved-before.json'),Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])));
for(const file of ['database/08_procedures/auth/sp_User_UpdateProfile.sql','frontend/src/pages/auth/Profile.jsx','docs/FULL_SYSTEM_AUDIT.md'])write(path.join(evidenceRoot,'before-source',file),read(path.join(root,file)));
const pool=await connect();
try{
 const before=await snapshot(pool),manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
 for(const [name,file] of Object.entries(manifest.modules)){
  const source=read(path.join(root,'database',file)),match=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(source);
  assert.equal(normalizeModule(before.metadata.objects.find(row=>row.name===name).definition),normalizeModule(source.slice(match.index).replace(/\s+GO\s*$/i,'')),name);
 }
 const roles=(await pool.request().query('SELECT VaiTroID,MaVaiTro,TenVaiTro FROM dbo.VAITRO ORDER BY VaiTroID')).recordset;
 const profileInventory=(await pool.request().query('SELECT v.MaVaiTro,COUNT(n.NguoiDungID) users,COUNT(h.NguoiDungID) profiles FROM dbo.VAITRO v LEFT JOIN dbo.NGUOIDUNG n ON n.VaiTroID=v.VaiTroID LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=n.NguoiDungID GROUP BY v.MaVaiTro ORDER BY v.MaVaiTro')).recordset;
 const dependencies=(await pool.request().query("SELECT referenced_schema_name,referenced_entity_name FROM sys.sql_expression_dependencies WHERE referencing_id=OBJECT_ID(N'dbo.sp_User_UpdateProfile') ORDER BY referenced_entity_name")).recordset;
 const knownTables=['NGUOIDUNG','HOSOKHACHHANG','VAITRO','VAITRO_QUYEN'];
 write(path.join(evidenceRoot,'audit-before.json'),{status:'PASS',at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),baseline:'Current working source after Task 13 including pending Tasks 9–13; no reset/commit/history change',database,main:summarize(before),allModuleParity:Object.keys(manifest.modules).length,roles,profileInventory,abnormalNonCustomerProfiles:profileInventory.filter(row=>row.MaVaiTro!=='KHACH_HANG').reduce((sum,row)=>sum+row.profiles,0),parameters:before.metadata.parameters.filter(row=>row.objectName==='sp_User_UpdateProfile'),columns:before.metadata.columns.filter(row=>knownTables.includes(row.tableName)),checks:before.metadata.checks.filter(row=>knownTables.includes(row.tableName)),keys:before.metadata.keys.filter(row=>knownTables.includes(row.tableName)),foreignKeys:before.metadata.foreignKeys.filter(row=>knownTables.includes(row.tableName)),dependencies,rootCause:'Unconditional profile EXISTS/UPDATE/INSERT after common update; no current role/status lookup. Existence of a profile is incorrectly treated as sufficient to write it.',contract:'PUT /api/auth/me, authenticated req.user.userId, four editable fields; common HoTen/SoDienThoai and Customer-only NgaySinh/GioiTinh, no role/owner input',plan:'Single existing SP: locked current role/status, Customer-only profile branch, reject non-null staff-specific input with existing50301/FORBIDDEN, savepoint pattern for atomicity; Backend unchanged. Verify actual form compatibility before minimal FE guard.'});
 console.log(`PASS before: ${Object.keys(manifest.modules).length} modules, one-role model; main abnormal staff profiles=${profileInventory.filter(row=>row.MaVaiTro!=='KHACH_HANG').reduce((sum,row)=>sum+row.profiles,0)}; previous source/main frozen.`);
}finally{await pool.close();}
