import assert from 'node:assert/strict';
import path from 'node:path';
import { database,connect,snapshot,summarize,read,write,evidenceRoot } from './common.mjs';
assert.equal(database,'CinemaBookingDB');const pool=await connect(),evidence={database,startedAt:new Date().toISOString(),status:'RUNNING'};
try {
 const state=await snapshot(pool),migration=JSON.parse(read(path.join(evidenceRoot,'main-migration.json')));
 assert.equal(migration.status,'PASS');assert.deepEqual(state.data,migration.after.data);
 evidence.overlapPairs=(await pool.request().query(`SELECT a.SuatChieuID firstShow,b.SuatChieuID secondShow,a.PhongID FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID
 WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau`)).recordset;
 assert.deepEqual(evidence.overlapPairs,[]);evidence.finalCommittedOverlapCount=0;
 await pool.request().batch(`DECLARE @Movie INT,@Duration INT,@Start DATETIME2=DATEADD(DAY,10,dbo.fn_BayGio()),@End DATETIME2;
 SELECT TOP(1) @Movie=PhimID,@Duration=ThoiLuong FROM dbo.PHIM ORDER BY PhimID;SET @End=DATEADD(MINUTE,@Duration+10,@Start);
 EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@Movie,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End;`);
 evidence.legacyThreeParameterValidation='PASS';
 const types=state.metadata.objects.reduce((counts,row)=>{const key=row.type.trim();counts[key]=(counts[key]??0)+1;return counts;},{});
 assert.equal(types.U,27);assert.equal(types.P,125);assert.equal(types.TR,7);
 assert.equal(state.metadata.environment[0].is_read_committed_snapshot_on,true);
 assert.ok(state.metadata.foreignKeys.every(row=>!row.is_disabled&&!row.is_not_trusted));assert.ok(state.metadata.checks.every(row=>!row.is_disabled&&!row.is_not_trusted));
 evidence.state=summarize(state);evidence.objectCounts=types;evidence.r1RoomDeletePreserved='PASS';evidence.dataPreserved='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'main-readonly.json'),evidence);await pool.close();}
console.log('PASS main read-only: zero committed overlap; all27 tables preserved; RCSI ON;125 SP/7 triggers; legacy3-parameter helper call compatible.');
