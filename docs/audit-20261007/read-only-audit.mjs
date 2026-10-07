// Audit tooling only. SELECT-only database inspection; no production import.
import fs from 'node:fs';
import crypto from 'node:crypto';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, normalizeModule, walk } from '../../scripts/db/lib.mjs';
import { queries } from '../../scripts/db/inventory.mjs';
const out = 'docs/audit-20261007';
const save = (name, value) => fs.writeFileSync(`${out}/${name}.json`, JSON.stringify(value, null, 2));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const e = credentials();
const pool = await new sql.ConnectionPool({server:e.DB_SERVER,port:Number(e.DB_PORT),database:e.DB_DATABASE,user:e.DB_USER,password:e.DB_PASSWORD,connectionTimeout:5000,requestTimeout:30000,options:{encrypt:e.DB_ENCRYPT==='true',trustServerCertificate:e.DB_TRUST_SERVER_CERTIFICATE==='true',useUTC:true}}).connect();
async function select(source) {
  const tokens=source.replace(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\//g,' ');
  if(!/^\s*SELECT\b/i.test(tokens)||/\b(?:INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|EXEC(?:UTE)?|GRANT|DENY|REVOKE|INTO|DBCC|BACKUP|RESTORE)\b/i.test(tokens)) throw new Error('Read-only guard rejected query');
  return (await pool.request().query(source)).recordset;
}
try {
  const metadata={};
  for(const [name,q] of Object.entries(queries)) metadata[name]=await select(q);
  save(process.argv.includes('--after')?'metadata-after':'metadata',metadata);
  const fingerprints=[];
  for(const {tableName} of metadata.rowcounts) {
    const rows=await select(`SELECT * FROM dbo.[${tableName}]`);
    fingerprints.push({table:tableName,rows:rows.length,sha256:hash(rows.map(r=>JSON.stringify(r)).sort().join('\n'))});
  }
  save(process.argv.includes('--after')?'data-fingerprint-after':'data-fingerprint-before',fingerprints);
  if(process.argv.includes('--after')) {console.log(JSON.stringify({unchanged:JSON.stringify(fingerprints)===JSON.stringify(JSON.parse(fs.readFileSync(`${out}/data-fingerprint-before.json`,'utf8')))}));process.exitCode=0;}
  else {
    const drift=[];
    for(const p of walk('database').filter(p=>/[\\/]0[5-8]_/.test(p)&&p.endsWith('.sql'))) {
      const body=fs.readFileSync(p,'utf8');
      const match=/\bCREATE\s+(?:OR\s+ALTER\s+)?(PROCEDURE|FUNCTION|VIEW|TRIGGER)\s+(?:dbo\.)?(\w+)/i.exec(body);
      if(!match) continue;
      const actual=metadata.objects.find(o=>o.name===match[2]);
      const source=body.slice(match.index).replace(/\s+GO\s*$/i,'');
      if(!actual||normalizeModule(source)!==normalizeModule(actual.definition)) drift.push({file:p,name:match[2],missing:!actual});
    }
    save('module-parity',{checked:metadata.objects.filter(o=>o.definition).length,drift});
    const scans={
      activeSeatDuplicates:`SELECT d.SuatChieuID,v.GheID,COUNT(*) n FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE v.TrangThai<>N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d.HanGiuCho,dbo.fn_BayGio())=1 GROUP BY d.SuatChieuID,v.GheID HAVING COUNT(*)>1`,
      wrongSeatRoom:`SELECT v.VeID,d.DonDatVeID,g.PhongID seatRoom,s.PhongID showtimeRoom FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID JOIN dbo.GHE g ON g.GheID=v.GheID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE g.PhongID<>s.PhongID`,
      seatPositions:`SELECT PhongID,HangGhe,SoGhe,COUNT(*) n FROM dbo.GHE GROUP BY PhongID,HangGhe,SoGhe HAVING COUNT(*)>1`,
      overlaps:`SELECT a.SuatChieuID firstId,b.SuatChieuID secondId,a.PhongID FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.SuatChieuID<b.SuatChieuID AND a.PhongID=b.PhongID WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau`,
      shortDuration:`SELECT s.SuatChieuID,s.TrangThai,p.ThoiLuong,DATEDIFF(SECOND,s.ThoiGianBatDau,s.ThoiGianKetThuc)/60.0 duration FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID WHERE DATEDIFF(SECOND,s.ThoiGianBatDau,s.ThoiGianKetThuc)<p.ThoiLuong*60`,
      releaseWindow:`SELECT s.SuatChieuID,s.TrangThai,dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau) businessDate,p.NgayKhoiChieu,p.NgayKetThuc FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID WHERE dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau)<p.NgayKhoiChieu OR dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau)>p.NgayKetThuc`,
      orderTotals:`SELECT d.DonDatVeID,d.TrangThai,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,ISNULL(v.n,0) actualTickets,ISNULL(f.n,0) actualFood FROM dbo.DONDATVE d OUTER APPLY(SELECT SUM(GiaVe) n FROM dbo.CHITIETVE WHERE DonDatVeID=d.DonDatVeID) v OUTER APPLY(SELECT SUM(DonGia*SoLuong) n FROM dbo.CHITIETDOAN WHERE DonDatVeID=d.DonDatVeID) f WHERE d.TongTienVe<>ISNULL(v.n,0) OR d.TongTienDoAn<>ISNULL(f.n,0) OR d.TienGiamGia>d.TongTienVe+d.TongTienDoAn`,
      nonPositiveTotals:`SELECT DonDatVeID,TrangThai,TongTienVe+TongTienDoAn-TienGiamGia total FROM dbo.DONDATVE WHERE TongTienVe+TongTienDoAn-TienGiamGia<=0`,
      paymentAmounts:`SELECT t.ThanhToanID,t.DonDatVeID,t.TrangThai,t.SoTien,d.TongTienVe+d.TongTienDoAn-d.TienGiamGia expected FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE t.SoTien<>d.TongTienVe+d.TongTienDoAn-d.TienGiamGia`,
      paymentStates:`SELECT d.DonDatVeID,d.TrangThai,COUNT(t.ThanhToanID) successes FROM dbo.DONDATVE d LEFT JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công' GROUP BY d.DonDatVeID,d.TrangThai HAVING COUNT(t.ThanhToanID)>1 OR (d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') AND COUNT(t.ThanhToanID)<>1) OR (d.TrangThai NOT IN(N'Đã thanh toán',N'Hoàn thành',N'Hoàn tiền') AND COUNT(t.ThanhToanID)>0)`,
      cancelledPaidOrders:`SELECT d.DonDatVeID,d.SuatChieuID,d.TrangThai FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') AND s.TrangThai=N'Đã hủy'`,
      invalidQuantities:`SELECT ChiTietDoAnID,SoLuong,DonGia FROM dbo.CHITIETDOAN WHERE SoLuong<=0 OR SoLuong>dbo.fn_GioiHanSoLuongSanPham() OR DonGia<0`,
      complaintOwnership:`SELECT c.KhieuNaiID,c.NguoiDungID,c.DonDatVeID,d.NguoiDungID owner FROM dbo.KHIEUNAI c JOIN dbo.DONDATVE d ON d.DonDatVeID=c.DonDatVeID WHERE c.NguoiDungID<>d.NguoiDungID`,
      complaintHistory:`SELECT c.KhieuNaiID,c.TrangThai,h.XuLyID,h.TrangThaiSauXuLy FROM dbo.KHIEUNAI c CROSS APPLY(SELECT TOP(1) XuLyID,TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=c.KhieuNaiID ORDER BY NgayXuLy DESC,XuLyID DESC) h WHERE c.TrangThai<>h.TrangThaiSauXuLy`,
      processorRoles:`SELECT x.XuLyID,u.NguoiDungID,r.MaVaiTro FROM dbo.XULY_KHIEUNAI x JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=x.NguoiXuLyID JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro NOT IN('CSKH','ADMIN')`,
      reviewEligibility:`SELECT r.DanhGiaID,r.NguoiDungID,r.PhimID FROM dbo.DANHGIAPHIM r WHERE NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE d.NguoiDungID=r.NguoiDungID AND s.PhimID=r.PhimID AND d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') AND s.ThoiGianBatDau<=r.NgayDanhGia)`,
      assignmentRole:`SELECT a.PhanCongID,a.NguoiDungID,a.RapID,r.MaVaiTro FROM dbo.PHANCONG_RAP a JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=a.NguoiDungID JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro<>'QUAN_LY_RAP'`,
      managerUnassigned:`SELECT u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động' AND NOT EXISTS(SELECT 1 FROM dbo.PHANCONG_RAP a WHERE a.NguoiDungID=u.NguoiDungID AND dbo.fn_KiemTraQuanLyRapScope(u.NguoiDungID,a.RapID)=1)`,
      assignmentOverlaps:`SELECT a.PhanCongID firstId,b.PhanCongID secondId,a.NguoiDungID,a.RapID FROM dbo.PHANCONG_RAP a JOIN dbo.PHANCONG_RAP b ON a.PhanCongID<b.PhanCongID AND a.NguoiDungID=b.NguoiDungID AND a.RapID=b.RapID WHERE a.TrangThai=N'Hiệu lực' AND b.TrangThai=N'Hiệu lực' AND a.NgayBatDau<=ISNULL(b.NgayKetThuc,'99991231') AND b.NgayBatDau<=ISNULL(a.NgayKetThuc,'99991231')`,
      pricingOverlaps:`SELECT a.GiaID firstId,b.GiaID secondId,a.RapID FROM dbo.BANGGIA a JOIN dbo.BANGGIA b ON a.GiaID<b.GiaID AND a.RapID=b.RapID AND a.LoaiGhe=b.LoaiGhe AND a.LoaiNgay=b.LoaiNgay AND a.DinhDang=b.DinhDang WHERE a.TrangThai=N'Áp dụng' AND b.TrangThai=N'Áp dụng' AND a.NgayBatDau<=ISNULL(b.NgayKetThuc,'99991231') AND b.NgayBatDau<=ISNULL(a.NgayKetThuc,'99991231')`,
      promotionUsage:`SELECT p.KhuyenMaiID,p.SoLuong,p.SoLuongDaDung,COUNT(d.DonDatVeID) activeUses FROM dbo.KHUYENMAI p LEFT JOIN dbo.DONDATVE d ON d.KhuyenMaiID=p.KhuyenMaiID AND (d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') OR (d.TrangThai=N'Chờ thanh toán' AND d.HanGiuCho>dbo.fn_BayGio())) GROUP BY p.KhuyenMaiID,p.SoLuong,p.SoLuongDaDung HAVING p.SoLuongDaDung<>COUNT(d.DonDatVeID)`,
      futureBirthdays:`SELECT NguoiDungID,NgaySinh FROM dbo.HOSOKHACHHANG WHERE NgaySinh>dbo.fn_HomNay()`,
      missingProfiles:`SELECT u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID WHERE r.MaVaiTro='KHACH_HANG' AND h.NguoiDungID IS NULL`,
      staleOpenShows:`SELECT SuatChieuID,ThoiGianBatDau,ThoiGianKetThuc FROM dbo.SUATCHIEU WHERE TrangThai=N'Mở bán' AND ThoiGianKetThuc<dbo.fn_BayGio()`,
      expiredPending:`SELECT DonDatVeID,SuatChieuID,HanGiuCho FROM dbo.DONDATVE WHERE TrangThai=N'Chờ thanh toán' AND HanGiuCho<=dbo.fn_BayGio()`,
      roleSummary:`SELECT r.MaVaiTro,u.TrangThai,COUNT(*) n FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID GROUP BY r.MaVaiTro,u.TrangThai`,
      currentUsers:`SELECT u.NguoiDungID,u.TrangThai,r.MaVaiTro FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID ORDER BY u.NguoiDungID`,
      publicShowAvailability:`SELECT COUNT(*) n FROM dbo.SUATCHIEU WHERE TrangThai=N'Mở bán' AND ThoiGianBatDau>dbo.fn_BayGio()`,
      rolePermissions:`SELECT v.MaVaiTro,q.MaQuyen FROM dbo.VAITRO_QUYEN vq JOIN dbo.VAITRO v ON v.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID ORDER BY v.MaVaiTro,q.MaQuyen`,
      clock:`SELECT SYSUTCDATETIME() utcNow,dbo.fn_BayGio() databaseNow,dbo.fn_HomNay() businessDate`,
    };
    const data={};for(const [name,source] of Object.entries(scans)) {try{data[name]={query:source,rows:await select(source)};}catch(err){data[name]={query:source,error:err.message};}}
    const orphans=[];
    for(const fk of metadata.foreignKeys) orphans.push({constraint:fk.name,...(await select(`SELECT COUNT_BIG(*) invalidRows FROM dbo.[${fk.childTable}] c LEFT JOIN dbo.[${fk.parentTable}] p ON c.[${fk.childColumn}]=p.[${fk.parentColumn}] WHERE c.[${fk.childColumn}] IS NOT NULL AND p.[${fk.parentColumn}] IS NULL`))[0]});
    data.orphans={rows:orphans};save('data-scans',data);
    console.log(JSON.stringify({objects:metadata.objects.reduce((a,o)=>(a[o.type]=(a[o.type]??0)+1,a),{}),rowcounts:metadata.rowcounts,drift,scans:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.error??v.rows.length]))},null,2));
  }
} finally {await pool.close();}
