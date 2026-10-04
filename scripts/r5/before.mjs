import assert from 'node:assert/strict';
import path from 'node:path';
import {connect,ask,mainSnapshot,root,write} from '../r3a/common.mjs';
const pool=await connect('CinemaBookingDB');
try {
 const snapshot=await mainSnapshot(pool);assert.equal(snapshot.data.length,27);
 const modules=(await ask(pool,'SELECT o.name,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0 ORDER BY o.name')).recordset;
 const duplicateAssignments=(await ask(pool,'SELECT NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai,COUNT(*) AS records FROM dbo.PHANCONG_RAP GROUP BY NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai HAVING COUNT(*)>1')).recordset;
 const profiles=(await ask(pool,"SELECT COUNT(*) AS missing FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID WHERE vt.MaVaiTro='KHACH_HANG' AND NOT EXISTS(SELECT 1 FROM dbo.HOSOKHACHHANG h WHERE h.NguoiDungID=nd.NguoiDungID)")).recordset;
 write(path.join(root,'audit/remediation/r5/evidence/main-before.json'),{status:'PASS',snapshot,duplicateAssignments,profiles});
 write(path.join(root,'audit/remediation/r5/evidence/baseline-modules.json'),{status:'PASS',modules});
 console.log(`PASS main before: 27 tables, ${modules.length} modules, ${duplicateAssignments.length} identical assignment groups, ${profiles[0].missing} missing customer profiles`);
}finally{await pool.close();}
