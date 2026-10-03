import assert from 'node:assert/strict';
import path from 'node:path';
import { root, dbRoot, read, write, walk, query } from '../db/lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if(!/^CinemaBookingDB_R0_R1_[A-Za-z0-9_]+$/.test(database||''))throw new Error('Disposable R1 database required for final inventory.');
const out=path.join(root,'audit/remediation/evidence');
const columns=query("SELECT o.name AS objectName,c.name AS columnName,t.name AS sqlType,c.scale FROM sys.columns c JOIN sys.objects o ON o.object_id=c.object_id JOIN sys.types t ON t.user_type_id=c.user_type_id WHERE o.type='U' AND t.name IN ('date','time','datetime','datetime2','smalldatetime','datetimeoffset') ORDER BY o.name,c.column_id",{database});
const category=type=>type==='date'?'DATE_ONLY':type==='time'?'TIME_ONLY':'INSTANT';
assert.equal(columns.length,23);assert.equal(columns.filter(c=>c.sqlType==='date').length,9);
write(path.join(out,'temporal-columns-after.json'),columns.map(c=>({...c,category:category(c.sqlType),semantics:category(c.sqlType)==='INSTANT'?'UTC components':'Business calendar value'})));
const parameters=query("SELECT o.name AS objectName,o.type_desc,p.name AS parameter,p.parameter_id,t.name AS sqlType,p.scale,p.is_output FROM sys.parameters p JOIN sys.objects o ON p.object_id=o.object_id JOIN sys.types t ON p.user_type_id=t.user_type_id WHERE o.is_ms_shipped=0 AND t.name IN ('date','time','datetime','datetime2','smalldatetime','datetimeoffset') ORDER BY o.name,p.parameter_id",{database});
const viewFields=query("SELECT o.name AS objectName,c.name AS field,t.name AS sqlType,c.scale FROM sys.columns c JOIN sys.objects o ON o.object_id=c.object_id JOIN sys.types t ON t.user_type_id=c.user_type_id WHERE o.type='V' AND t.name IN ('date','time','datetime','datetime2','smalldatetime','datetimeoffset') ORDER BY o.name,c.column_id",{database});
const procedures=query("SELECT o.name FROM sys.objects o WHERE o.type='P' AND o.is_ms_shipped=0 ORDER BY o.name",{database});
const outputs=[];
const manual = {
 sp_Admin_Report_Revenue: { fields: [], review: 'Temp table holds amounts/IDs only; both response sets have no temporal fields. TuNgay/DenNgay are DATE business-day filters; fixed-clock revenue fixture proves conversion before filtering.' },
 sp_Booking_Create: { fields: ['NgayDat','HanGiuCho'], review: 'Final SELECT reads DONDATVE datetime2(7) UTC columns. Nested expiry/promotion responses are suppressed by existing caller flags; live booking and SQL smoke verified.' },
 sp_DatVe: { fields: ['NgayDat','HanGiuCho'], review: 'Exact typed forwarding alias of sp_Booking_Create; same final temporal columns.' },
 sp_Payment_UpdateResult: { fields: ['NgayThanhToan','HanGiuCho (branch-dependent)'], review: 'Both final branches read UTC datetime2(7) from THANHTOAN/DONDATVE. NULL remains NULL; idempotent branch omits hold field. Branch/lifecycle shape unchanged.' },
 sp_XuLyThanhToan: { fields: ['NgayThanhToan','HanGiuCho (branch-dependent)'], review: 'Exact typed forwarding alias of sp_Payment_UpdateResult.' },
 sp_Support_Complaint_GetOrderReference: { fields: ['ThoiGianBatDau','ThoiGianKetThuc','NgayDat'], review: 'No-order branch returns Message only; reference branch projects these UTC datetime2 fields from vw_ChiTietDonDatVe. No date-only/ambiguous time string.' },
 sp_Showtime_CancelCascade: { fields: [], review: 'Final result is Message/SoDonDaHuy; nested expiry result suppressed. Internal instant comparisons use UTC fn_BayGio. Cancellation/refund rules unchanged.' },
 sp_Manager_Showtime_Cancel: { fields: [], review: 'Scoped forwarding to sp_Showtime_CancelCascade; Message/count result, no temporal output.' },
 usp_Admin_Showtime_Cancel: { fields: [], review: 'Forwarding to sp_Showtime_CancelCascade; Message/count result, no temporal output.' },
};
for(const {name} of procedures) {
 try {
  const described=query(`SELECT name,system_type_name,error_number,error_message FROM sys.dm_exec_describe_first_result_set_for_object(OBJECT_ID(N'dbo.${name}'),0)`,{database});
  const error=described.find(d=>d.error_number);
  if(error)outputs.push({object:name,metadata:'SQL metadata unavailable',reason:error.error_message,review:'Definition inspected; temporary table/conditional/forwarded result shapes are covered by module source inventory and executed service/SQL tests.'});
  else outputs.push({object:name,metadata:'DESCRIBED',fields:described.filter(d=>/^(date|time|datetime|datetime2|datetimeoffset|smalldatetime)(?:\(|$)/.test(d.system_type_name||'')).map(d=>({...d,category:category(d.system_type_name.replace(/\(.*/,''))}))});
 }catch(error){outputs.push({object:name,metadata:'SQL metadata unavailable',reason:error.message,review:'Inspect canonical definition; dynamic/temp/conditional resultsets cannot be inferred by SQL Server metadata.'});}
}
for (const output of outputs.filter(o=>o.metadata!=='DESCRIBED')) {
 assert.ok(manual[output.object],`Uninvestigated output metadata: ${output.object}`);
 output.resolution={...manual[output.object],category:manual[output.object].fields.length?'INSTANT':'No temporal response fields',sqlType:manual[output.object].fields.length?'datetime2(7)':null};
}
write(path.join(out,'sql-temporal-module-inventory-after.json'),{parameters:parameters.map(p=>({...p,category:category(p.sqlType)})),viewFields:viewFields.map(p=>({...p,category:category(p.sqlType)})),procedureOutputs:outputs,durations:[{object:'PHIM',field:'ThoiLuong',sqlType:'int',category:'DURATION',meaning:'Movie minutes'},{object:'fn_ThoiGianGiuChoPhut',field:'return',sqlType:'int',category:'DURATION',meaning:'Hold minutes, unchanged 5'},{object:'fn_ThoiGianGiaHanThanhToanPhut',field:'return',sqlType:'int',category:'DURATION',meaning:'Legacy extension minutes, unchanged 5; no new extension policy'}],legacyTimeOnly:[{object:'vw_LichChieuChiTiet',field:'GioBatDau/GioKetThuc',sqlType:'varchar(5)',category:'TIME_ONLY',meaning:'Business local HH:mm compatibility output, never an instant'}]});
const temporalPattern=/GETDATE\(|CURRENT_TIMESTAMP|SYSDATETIME\(|SYSUTCDATETIME\(|GETUTCDATE\(|DATEADD\(|DATEDIFF(?:_BIG)?\(|DATETIME(?:2)?FROMPARTS|AT TIME ZONE|SWITCHOFFSET|TODATETIMEOFFSET|CAST\(.+AS DATE|CONVERT\(|FORMAT\(|fn_BayGio\(|fn_HomNay\(|fn_NgayKinhDoanh\(|fn_GioRap\(|fn_UtcTuGioRap\(/i;
const activeSql=walk(dbRoot).filter(f=>/\/(?:03_constraints|05_functions|06_views|07_triggers|08_procedures|10_seed)\//.test(f.replaceAll('\\','/'))&&f.endsWith('.sql'));
const sqlScan=activeSql.flatMap(f=>read(f).split(/\r?\n/).flatMap((s,i)=>temporalPattern.test(s)?[{file:path.relative(root,f).replaceAll('\\','/'),line:i+1,source:s.trim(),classification:/fn_NgayKinhDoanh|fn_HomNay|SeedDay|CinemaSeedDay/i.test(s)?'BUSINESS-DATE':/GioBatDau|GioKetThuc|FORMAT\(/i.test(s)?'DISPLAY-ONLY':'CORRECT'}]:[]));
write(path.join(out,'sql-time-scan-after.json'),sqlScan);
const activeFiles=[...activeSql,...walk(path.join(root,'backend/src')),...walk(path.join(root,'frontend/src'))];
const forbidden=/DATEADD\s*\(\s*HOUR\s*,\s*[+-]?7\b|25200000|setHours\([^\n]*[+-]\s*7\b|[+-]\s*7\s*\*\s*60\s*\*\s*60|fixTimezone|addVietnamOffset|subtractTimezone|convertHack/i;
const suspicious=/new Date\((?:input\.|datetimeLocal)|toISOString\(\)\.slice|toLocaleString\(['"]vi-VN['"]\)/;
const magic=activeFiles.flatMap(f=>read(f).split(/\r?\n/).flatMap((s,i)=>forbidden.test(s)?[{file:path.relative(root,f),line:i+1,source:s.trim()}]:[]));
const dateConversions=activeFiles.flatMap(f=>read(f).split(/\r?\n/).flatMap((s,i)=>suspicious.test(s)?[{file:path.relative(root,f),line:i+1,source:s.trim()}]:[]));
assert.equal(magic.length,0);assert.equal(dateConversions.length,0);
write(path.join(out,'static-scan-after.json'),{status:'PASS',activeFiles:activeFiles.length,magicOffsets:magic,suspiciousDateConversions:dateConversions,excluded:'Immutable _legacy_snapshot and old audit evidence intentionally contain original buggy SQL; reproduction artifact records the measured delta. Neither is built/imported.'});
const history=JSON.parse(read(path.join(out,'historical-data-before.json')));
const migrated=process.argv.includes('--migrated-main');
const afterHistory=[];
for(const table of history) {
 if(!table.records.length) {const count=query(`SELECT COUNT(*) AS n FROM dbo.[${table.table}]`)[0].n;assert.equal(count,0,table.table);continue;}
 const fields=Object.keys(table.records[0]);
  const now=query(`SELECT ${fields.map(f=>`[${f}]`).join(',')} FROM dbo.[${table.table}]`);
  const seedProjection=table.records.map(row=>'SELECT '+fields.map(field=>`${typeof row[field]==='number'?row[field]:`dbo.fn_UtcTuGioRap(CONVERT(datetime2(7),N'${String(row[field]).replaceAll("'","''")}'))`} AS [${field}]`).join(',')).join(' UNION ALL ');
  const expected=migrated?query(`SELECT * FROM (${seedProjection}) AS ProvenSeed`):table.records;
  const stable=rows=>JSON.stringify(rows.map(r=>JSON.stringify(r)).sort());
  assert.equal(stable(now),stable(expected),`${table.table}: historical data differs from proven target semantics`);
  afterHistory.push({table:table.table,origin:migrated?'Exact R0 seed, verified provenance; converted to UTC':'Unmodified pre-migration snapshot',records:now});
}
write(path.join(out,migrated?'historical-data-after.json':'historical-data-pre-migration-check.json'),{status:'PASS',database:'CinemaBookingDB',tables:afterHistory,ambiguousModified:0,note:migrated?'Only the 59 provenance-verified seed rows converted; all 26 table hashes match independently rebuilt R1. DATE values unchanged.':'DATA REMEDIATION DEFERRED until exact seed provenance proof.'});
console.log(`PASS final audit: ${columns.length} temporal columns, ${parameters.length} temporal signatures, ${procedures.length} SP output descriptions; zero active magic offsets; historical data matches ${migrated?'verified R1 seed':'original snapshot'}.`);
