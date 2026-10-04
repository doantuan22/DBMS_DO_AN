import assert from 'node:assert/strict';
import path from 'node:path';
import { query, sqlcmd, dbRoot, root, read, write } from '../db/lib.mjs';
const database = 'CinemaBookingDB';
const cases = query(`SELECT v.Ticket,v.Food,v.Discount,v.Expected,f.DiemCong AS Actual
 FROM (VALUES (150000,0,30000,120),(150000,100000,50000,120),(100000,0,10000,90),
 (125000,125000,50000,100),(0,100000,10000,0),(999,0,0,0),(1000,0,0,1)) v(Ticket,Food,Discount,Expected)
 CROSS APPLY dbo.fn_TinhBoiThuongVe(v.Ticket,v.Food,v.Discount) f`, { database });
assert.ok(cases.every(c => c.Expected === c.Actual));
const clock = query('SELECT ABS(DATEDIFF(SECOND,dbo.fn_BayGio(),SYSUTCDATETIME())) AS DifferenceSeconds', { database });
assert.ok(clock[0].DifferenceSeconds <= 2, 'DB clock must remain UTC.');
sqlcmd(read(path.join(dbRoot,'11_tests/payment/compensation_schema.sql')), { database, file: true });
const databases = query("SELECT name FROM sys.databases WHERE name LIKE N'CinemaBookingDB%'", { database: 'master' }).map(d => d.name);
assert.deepEqual(databases, [database]);
const counts = query('SELECT (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT) AS CompensationEvents,(SELECT COUNT(*) FROM dbo.DONDATVE) AS Orders,(SELECT COUNT(*) FROM dbo.THANHTOAN) AS Payments,(SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianBatDau>dbo.fn_BayGio()) AS FutureShows', { database });
const evidence = { status:'PASS', database, at:new Date().toISOString(), points:cases, utcClock:clock[0], remainingCinemaDatabases:databases, counts:counts[0], schema:'PASS' };
write(path.join(root,'audit/remediation/r2fix/evidence/main-readonly.json'),evidence);
console.log(JSON.stringify(evidence,null,2));
