import assert from 'node:assert/strict';
import path from 'node:path';
import { database,connect,snapshot,summarize,read,write,evidenceRoot } from './common.mjs';
assert.equal(database,'CinemaBookingDB');const pool=await connect(),evidence={database,startedAt:new Date().toISOString(),status:'RUNNING'};
try {
 const current=await snapshot(pool),migration=JSON.parse(read(path.join(evidenceRoot,'main-migration.json')));
 assert.equal(migration.status,'PASS');assert.deepEqual(current.data,migration.after.data);
 assert.deepEqual(summarize(current).metadataHashes,migration.after.metadataHashes);
 const rows=(await pool.request().query(`
 SELECT COUNT(*) shows,SUM(CONVERT(INT,IsBookable)) bookable,SUM(CASE WHEN TrangThaiSuatChieu=N'Mở bán' AND ThoiGianBatDau>dbo.fn_BayGio() AND IsBookable=0 THEN 1 ELSE 0 END) ineligibleFutureOpen
 FROM dbo.vw_LichChieuChiTiet;
 SELECT COUNT(*) overlaps FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID
 WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau;
 SELECT COUNT(*) tables FROM sys.tables WHERE is_ms_shipped=0;
 SELECT COUNT(*) invalidQuota FROM dbo.KHUYENMAI WHERE SoLuongDaDung<0 OR SoLuongDaDung>SoLuong;`)).recordsets;
 evidence.availability=rows[0][0];evidence.finalCommittedOverlapCount=rows[1][0].overlaps;assert.equal(evidence.finalCommittedOverlapCount,0);assert.equal(rows[2][0].tables,27);
 evidence.invalidPromotionQuotaCount=rows[3][0].invalidQuota;assert.equal(evidence.invalidPromotionQuotaCount,0);
 assert.equal(current.metadata.environment[0].is_read_committed_snapshot_on,true);assert.ok(current.metadata.foreignKeys.every(row=>!row.is_disabled&&!row.is_not_trusted));assert.ok(current.metadata.checks.every(row=>!row.is_disabled&&!row.is_not_trusted));
 evidence.state=summarize(current);evidence.dataPreserved='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'main-readonly.json'),evidence);await pool.close();}
console.log('PASS main read-only: unified availability; data27 preserved; overlap0; RCSI and trusted constraints unchanged.');
