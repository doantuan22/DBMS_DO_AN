// Offline/read-only audit tooling. Never imported by the backend.
import path from 'node:path';
import { root, dbRoot, read, write, walk, query } from '../db/lib.mjs';

const out = path.join(root, 'audit/remediation/evidence');
const files = walk(dbRoot).filter(f => /\/(?:03_constraints|05_functions|06_views|07_triggers|08_procedures|10_seed)\//.test(f.replaceAll('\\', '/')) && f.endsWith('.sql'));
const refs = files.map(f => ({ file: path.relative(root, f).replaceAll('\\', '/'), source: read(f) }));
const consumers = {
  HOSOKHACHHANG: ['birthday', 'auth/Profile, auth/Register'], DIENVIEN: ['NgaySinh', 'AdminPortal actors'],
  PHIM: ['releaseDate/endDate; NgayKhoiChieu/NgayKetThuc', 'MovieDetail, AdminPortal movies'],
  RAPCHIEUPHIM: ['operatingSince; NgayHoatDong', 'Cinemas, AdminPortal cinemas'],
  BANGGIA: ['startsOn/endsOn; NgayBatDau/NgayKetThuc', 'ManagerPortal pricing, AdminPortal pricing'],
  PHANCONG_RAP: ['startsOn/endsOn; NgayBatDau/NgayKetThuc', 'ManagerPortal cinemas, AdminPortal assignments'],
  SUATCHIEU: ['startsAt/endsAt, date/startTime/endTime; ThoiGianBatDau/ThoiGianKetThuc', 'ShowtimeBrowser, BookingPreparation, Orders, OrderDetail, ManagerPortal, AdminPortal showtimes'],
  DONDATVE: ['bookedAt/holdExpiresAt', 'BookingPreparation, Orders, OrderDetail, SupportPortal, ComplaintDetail'],
  THANHTOAN: ['createdAt/paidAt', 'PaymentPage, OrderDetail, SupportPortal, AdminPortal reports'],
  KHUYENMAI: ['NgayBatDau/NgayKetThuc', 'AdminPortal promotions'],
  NGUOIDUNG: ['createdAt; NgayTao', 'auth/Profile, AdminPortal users'],
  KHIEUNAI: ['createdAt', 'Complaints, ComplaintDetail, SupportPortal, AdminPortal complaints'],
  XULY_KHIEUNAI: ['createdAt', 'ComplaintDetail, SupportPortal, AdminPortal complaints'],
  HINHANH_RAPCHIEUPHIM: ['createdAt; NgayTao', 'CinemaImageManager, Cinemas'],
  DANHGIAPHIM: ['createdAt', 'MovieReviews, MovieDetail'], VAITRO_QUYEN: ['NgayGan (not exposed in current REST)', 'No time consumer'],
};
const meanings = { NgaySinh: 'Birthday', NgayKhoiChieu: 'Movie release business date', NgayKetThuc: 'End of validity', NgayBatDau: 'Start of validity', NgayHoatDong: 'Cinema opening business date', NgayTao: 'Record creation', NgayDat: 'Booking creation', HanGiuCho: 'Authoritative seat hold deadline', NgayDanhGia: 'Review creation', ThoiGianBatDau: 'Showtime start', ThoiGianKetThuc: 'Showtime end', NgayThanhToan: 'Payment result recorded', NgayXuLy: 'Complaint processing', NgayGan: 'Permission grant', ThoiLuong: 'Movie duration in minutes' };
const inventory = [];
for (const f of walk(path.join(dbRoot, '02_tables'))) {
 const source = read(f); const table = /CREATE TABLE dbo\.\[(\w+)\]/i.exec(source)[1];
 for (const m of source.matchAll(/\[(\w+)\]\s+(date(?:time(?:offset|2)?)?|smalldatetime|time)(\(\d+\))?\b/gi)) {
  const [, column, type, scale = ''] = m; const category = type.toLowerCase() === 'date' ? 'DATE_ONLY' : type.toLowerCase() === 'time' ? 'TIME_ONLY' : 'INSTANT';
  const related = refs.filter(r => new RegExp(`\\b${table}\\b`, 'i').test(r.source) && new RegExp(`\\b${column}\\b`, 'i').test(r.source));
  const writers = related.filter(r => /\b(?:INSERT|UPDATE|DEFAULT)\b/i.test(r.source));
  const readers = related.filter(r => /\bSELECT\b/i.test(r.source));
  inventory.push({ Object: table, 'Column/Field': column, 'SQL Type': type + scale, Meaning: meanings[column], Category: category, 'Written By': writers.map(r => r.file), 'Read By': readers.map(r => r.file), 'API Field': consumers[table][0], 'Frontend Consumer': consumers[table][1], 'Current Semantics': category === 'DATE_ONLY' ? 'Business calendar date; driver Date may leak ISO timestamp' : table === 'SUATCHIEU' || table === 'KHUYENMAI' ? 'Mixed: local seed; UTC API parameters; local DB comparison' : 'Vietnam wall-clock via fn_BayGio default/explicit writer; driver decodes as UTC', 'Target Semantics': category === 'DATE_ONLY' ? 'DATE / YYYY-MM-DD; no conversion' : 'UTC datetime2 / ISO UTC Z', Risk: category === 'DATE_ONLY' ? 'Date becoming timestamp in DTO' : 'Mixed historical origin; not safe to mass migrate' });
 }
 if (/\[ThoiLuong\]/.test(source)) inventory.push({ Object: table, 'Column/Field': 'ThoiLuong', 'SQL Type': 'int', Meaning: meanings.ThoiLuong, Category: 'DURATION', 'Written By': refs.filter(r => /\bPHIM\b/.test(r.source) && /ThoiLuong/.test(r.source) && /INSERT|UPDATE/.test(r.source)).map(r => r.file), 'Read By': refs.filter(r => /ThoiLuong/.test(r.source)).map(r => r.file), 'API Field': 'durationMinutes/ThoiLuong', 'Frontend Consumer': 'MovieCard, MovieDetail, AdminPortal movies', 'Current Semantics': 'Minutes', 'Target Semantics': 'Minutes', Risk: 'No timezone conversion' });
}
write(path.join(out, 'temporal-inventory-before.json'), inventory);
const headers = Object.keys(inventory[0]);
write(path.join(root, 'audit/remediation/R1_TEMPORAL_INVENTORY.md'), '# Temporal column inventory (pre-fix)\n\nModule references are candidate direct writers/readers determined from both table and field tokens; indirect callers are in module inventory.\n\n| ' + headers.join(' | ') + ' |\n|' + headers.map(() => '---').join('|') + '|\n' + inventory.map(r => '| ' + headers.map(h => Array.isArray(r[h]) ? r[h].join('<br>') : r[h]).join(' | ') + ' |').join('\n') + '\n');
const patterns = /GETDATE\(|CURRENT_TIMESTAMP|SYSDATETIME\(|SYSUTCDATETIME\(|GETUTCDATE\(|DATEADD\(|DATEDIFF(?:_BIG)?\(|DATETIME(?:2)?FROMPARTS|AT TIME ZONE|SWITCHOFFSET|TODATETIMEOFFSET|CAST\(.+AS DATE|CONVERT\(|FORMAT\(|fn_BayGio\(|fn_HomNay\(/i;
const usages = refs.flatMap(r => r.source.split(/\r?\n/).flatMap((s, i) => patterns.test(s) ? [{file:r.file,line:i+1,source:s.trim(),classification:/DATEADD\(HOUR, 7|SYSDATETIME\(/i.test(s)?'WRONG':/AS DATE|CONVERT\(DATE|fn_HomNay/i.test(s)?'BUSINESS-DATE':/FORMAT\(/i.test(s)?'DISPLAY-ONLY':/fn_BayGio\(/i.test(s)?'SUSPICIOUS':'CORRECT',reason:/fn_BayGio\(/i.test(s)?'Pre-fix local now; callers require UTC instant after contract change':'Reviewed in R1 scan; date operations must be classified by argument semantics'}] : []));
write(path.join(out,'sql-time-scan-before.json'), usages);
for (const area of ['backend', 'frontend']) {
 const hits=walk(path.join(root,area,'src')).flatMap(f=>read(f).split(/\r?\n/).flatMap((s,i)=>/new Date|Date\.(now|parse)|toISOString|toLocale|[gs]et(?:UTC)?Hours|getTimezoneOffset|Intl.DateTimeFormat|datetime-local|type="date"/.test(s)?[{file:path.relative(root,f).replaceAll('\\','/'),line:i+1,source:s.trim(),category:/datetime-local|type="date"/.test(s)?'INPUT':/Date.now/.test(s)?'COMPARISON':/toLocale/.test(s)?'DISPLAY':/new Date\(input/.test(s)?'API PARSE':'FILTER'}]:[]));
 write(path.join(out,`${area}-time-scan-before.json`),hits);
}
if (!process.argv.includes('--offline')) {
 const modules=query('SELECT o.name, o.type_desc, m.definition FROM sys.objects o JOIN sys.sql_modules m ON o.object_id=m.object_id WHERE o.is_ms_shipped=0');
 const params=query("SELECT o.name AS objectName,p.name AS parameter,t.name AS sqlType,p.scale,p.is_output FROM sys.parameters p JOIN sys.objects o ON p.object_id=o.object_id JOIN sys.types t ON p.user_type_id=t.user_type_id WHERE t.name IN ('date','time','datetime','datetime2','smalldatetime','datetimeoffset')");
 write(path.join(out,'sql-temporal-module-inventory-before.json'),modules.filter(m=>/date|time|fn_BayGio|fn_HomNay/i.test(m.definition)).map(m=>({object:m.name,type:m.type_desc,parameters:params.filter(p=>p.objectName===m.name),temporalLines:m.definition.split(/\r?\n/).filter(s=>/date|time|fn_BayGio|fn_HomNay/i.test(s))})));
 const history=[];
 const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
 for(const table of new Set(inventory.filter(r=>r.Category==='INSTANT').map(r=>r.Object))) {
  const fields=inventory.filter(r=>r.Object===table&&r.Category==='INSTANT').map(r=>r['Column/Field']);
  const pk=query(`SELECT c.name FROM sys.indexes i JOIN sys.index_columns ic ON i.object_id=ic.object_id AND i.index_id=ic.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.is_primary_key=1 AND OBJECT_NAME(i.object_id)=N'${table}' ORDER BY ic.key_ordinal`);
  history.push({table,classification:['SUATCHIEU','KHUYENMAI'].includes(table)?'D: origin ambiguous; seed local vs UTC API path':'B: fn_BayGio/default local writer, legacy/manual overrides not provable per row',modified:false,records:query(`SELECT ${[...pk.map(p=>p.name),...fields].map(n=>`[${n}]`).join(',')} FROM dbo.[${table}]`)});
 }
 write(path.join(out,'historical-data-before.json'),history);
}
console.log(JSON.stringify({columns:inventory.filter(r=>r.Category!=='DURATION').length,categories:inventory.reduce((a,r)=>(a[r.Category]=(a[r.Category]||0)+1,a),{}),sqlTimeUsages:usages.length}));
