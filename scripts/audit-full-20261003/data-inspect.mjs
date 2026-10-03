import fs from 'node:fs';
import path from 'node:path';
import { out, save } from './collect.mjs';
import { inspect } from './live-inspect.mjs';

const read = name => JSON.parse(fs.readFileSync(path.join(out,`${name}.json`),'utf8'));
const fk=read('live-foreign-keys');
const orphans=[];
for (const r of fk) {
  const rows=inspect(`orphan-${r.name}`,`SELECT COUNT_BIG(*) invalidRows FROM dbo.[${r.childTable}] c LEFT JOIN dbo.[${r.parentTable}] p ON c.[${r.childColumn}]=p.[${r.parentColumn}] WHERE c.[${r.childColumn}] IS NOT NULL AND p.[${r.parentColumn}] IS NULL`);
  orphans.push({constraint:r.name,child:r.childTable,parent:r.parentTable,...rows[0]});
}
save('orphan-summary.json',orphans);
const status=[];
for(const col of read('live-columns').filter(c=>/TrangThai/.test(c.name)))status.push({table:col.tableName,column:col.name,values:inspect(`status-${col.tableName}-${col.name}`,`SELECT [${col.name}] value,COUNT(*) rows FROM dbo.[${col.tableName}] GROUP BY [${col.name}]`)});
save('status-domains.json',status);
const indexes=read('live-indexes').filter(i=>i.is_unique&&!i.is_included_column);
const uniqueGroups=Object.groupBy(indexes,x=>`${x.tableName}.${x.name}`);
const duplicates=[];
for(const [key,columns] of Object.entries(uniqueGroups)) {
  const names=columns.sort((a,b)=>a.key_ordinal-b.key_ordinal).map(c=>`[${c.columnName}]`).join(',');
  const rows=inspect(`duplicates-${columns[0].name}`,`SELECT ${names},COUNT(*) rows FROM dbo.[${columns[0].tableName}] ${columns[0].filter_definition?'WHERE '+columns[0].filter_definition:''} GROUP BY ${names} HAVING COUNT(*)>1`);
  duplicates.push({index:key,duplicateGroups:rows.length});
}
save('duplicate-summary.json',duplicates);
const scans = {
  'data-active-seat-duplicates': `SELECT d.SuatChieuID,v.GheID,COUNT(*) tickets FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE v.TrangThai<>N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d.HanGiuCho,SYSDATETIME())=1 GROUP BY d.SuatChieuID,v.GheID HAVING COUNT(*)>1`,
  'data-seat-wrong-room': `SELECT v.VeID,d.DonDatVeID,d.SuatChieuID,g.GheID,g.PhongID seatRoom,s.PhongID showtimeRoom FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID JOIN dbo.GHE g ON g.GheID=v.GheID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE g.PhongID<>s.PhongID`,
  'data-showtime-overlaps': `SELECT a.SuatChieuID firstId,b.SuatChieuID secondId,a.PhongID FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.SuatChieuID<b.SuatChieuID AND a.PhongID=b.PhongID WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau`,
  'data-showtime-duration': `SELECT s.SuatChieuID,s.PhimID,s.TrangThai,p.ThoiLuong,DATEDIFF(SECOND,s.ThoiGianBatDau,s.ThoiGianKetThuc)/60.0 duration FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID WHERE DATEDIFF(SECOND,s.ThoiGianBatDau,s.ThoiGianKetThuc)<p.ThoiLuong*60`,
  'data-showtime-movie-dates': `SELECT s.SuatChieuID,s.PhimID,s.ThoiGianBatDau,p.NgayKhoiChieu,p.NgayKetThuc FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID WHERE CAST(s.ThoiGianBatDau AS date)<p.NgayKhoiChieu OR CAST(s.ThoiGianBatDau AS date)>p.NgayKetThuc`,
  'data-order-totals': `SELECT d.DonDatVeID,d.TrangThai,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,ISNULL(v.ticketTotal,0) actualTicketTotal,ISNULL(f.productTotal,0) actualProductTotal FROM dbo.DONDATVE d OUTER APPLY (SELECT SUM(GiaVe) ticketTotal FROM dbo.CHITIETVE WHERE DonDatVeID=d.DonDatVeID) v OUTER APPLY (SELECT SUM(DonGia*SoLuong) productTotal FROM dbo.CHITIETDOAN WHERE DonDatVeID=d.DonDatVeID) f WHERE d.TongTienVe<>ISNULL(v.ticketTotal,0) OR d.TongTienDoAn<>ISNULL(f.productTotal,0) OR d.TienGiamGia>d.TongTienVe+d.TongTienDoAn`,
  'data-payment-amounts': `SELECT t.ThanhToanID,t.DonDatVeID,t.TrangThai,t.SoTien,d.TongTienVe+d.TongTienDoAn-d.TienGiamGia expected FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE t.SoTien<>d.TongTienVe+d.TongTienDoAn-d.TienGiamGia`,
  'data-payment-order-state': `SELECT d.DonDatVeID,d.TrangThai,COUNT(t.ThanhToanID) successfulAttempts FROM dbo.DONDATVE d LEFT JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công' GROUP BY d.DonDatVeID,d.TrangThai HAVING COUNT(t.ThanhToanID)>1 OR (d.TrangThai IN (N'Đã thanh toán',N'Hoàn thành') AND COUNT(t.ThanhToanID)<>1) OR (d.TrangThai NOT IN (N'Đã thanh toán',N'Hoàn thành',N'Hoàn tiền') AND COUNT(t.ThanhToanID)>0)`,
  'data-complaint-owner': `SELECT c.KhieuNaiID,c.NguoiDungID,c.DonDatVeID,d.NguoiDungID orderOwner FROM dbo.KHIEUNAI c JOIN dbo.DONDATVE d ON d.DonDatVeID=c.DonDatVeID WHERE c.NguoiDungID<>d.NguoiDungID`,
  'data-complaint-history': `SELECT c.KhieuNaiID,c.TrangThai,h.XuLyID,h.TrangThaiSauXuLy FROM dbo.KHIEUNAI c CROSS APPLY (SELECT TOP(1) XuLyID,TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=c.KhieuNaiID ORDER BY NgayXuLy DESC,XuLyID DESC) h WHERE c.TrangThai<>h.TrangThaiSauXuLy`,
  'data-assignment-role': `SELECT a.PhanCongID,a.NguoiDungID,a.RapID,r.MaVaiTro,a.TrangThai FROM dbo.PHANCONG_RAP a JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=a.NguoiDungID JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro<>'QUAN_LY_RAP'`,
  'data-assignment-duplicates': `SELECT a.PhanCongID firstId,b.PhanCongID secondId,a.NguoiDungID,a.RapID FROM dbo.PHANCONG_RAP a JOIN dbo.PHANCONG_RAP b ON a.PhanCongID<b.PhanCongID AND a.NguoiDungID=b.NguoiDungID AND a.RapID=b.RapID WHERE a.TrangThai=N'Hiệu lực' AND b.TrangThai=N'Hiệu lực' AND a.NgayBatDau<=ISNULL(b.NgayKetThuc,'99991231') AND b.NgayBatDau<=ISNULL(a.NgayKetThuc,'99991231')`,
  'data-pricing-overlaps': `SELECT a.GiaID firstId,b.GiaID secondId,a.RapID FROM dbo.BANGGIA a JOIN dbo.BANGGIA b ON a.GiaID<b.GiaID AND a.RapID=b.RapID AND a.LoaiGhe=b.LoaiGhe AND a.LoaiNgay=b.LoaiNgay AND a.DinhDang=b.DinhDang WHERE a.TrangThai=N'Áp dụng' AND b.TrangThai=N'Áp dụng' AND a.NgayBatDau<=ISNULL(b.NgayKetThuc,'99991231') AND b.NgayBatDau<=ISNULL(a.NgayKetThuc,'99991231')`,
  'data-promotion-counter': `SELECT p.KhuyenMaiID,p.SoLuongDaDung,COUNT(d.DonDatVeID) currentUse FROM dbo.KHUYENMAI p LEFT JOIN dbo.DONDATVE d ON d.KhuyenMaiID=p.KhuyenMaiID AND (d.TrangThai IN (N'Đã thanh toán',N'Hoàn thành') OR (d.TrangThai=N'Chờ thanh toán' AND d.HanGiuCho>SYSDATETIME())) GROUP BY p.KhuyenMaiID,p.SoLuongDaDung HAVING p.SoLuongDaDung<>COUNT(d.DonDatVeID)`,
  'data-covers': `SELECT RapID,COUNT(*) covers FROM dbo.HINHANH_RAPCHIEUPHIM WHERE LaAnhDaiDien=1 GROUP BY RapID HAVING COUNT(*)>1`,
  'data-hidden-covers': `SELECT HinhAnhRapID,RapID,TrangThai FROM dbo.HINHANH_RAPCHIEUPHIM WHERE LaAnhDaiDien=1 AND TrangThai<>N'Hoạt động'`,
  'data-image-duplicates': `SELECT RapID,URL,COUNT(*) rows FROM dbo.HINHANH_RAPCHIEUPHIM GROUP BY RapID,URL HAVING COUNT(*)>1`,
  'data-image-order-duplicates': `SELECT RapID,ThuTuHienThi,COUNT(*) rows FROM dbo.HINHANH_RAPCHIEUPHIM GROUP BY RapID,ThuTuHienThi HAVING COUNT(*)>1`,
  'data-paid-cancelled-showtime': `SELECT d.DonDatVeID,d.SuatChieuID,d.TrangThai,s.TrangThai showtimeStatus FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') AND s.TrangThai=N'Đã hủy'`,
  'data-invalid-born-dates': `SELECT NguoiDungID,NgaySinh FROM dbo.HOSOKHACHHANG WHERE NgaySinh>CAST(SYSDATETIME() AS date)`,
  'data-stale-open-showtimes': `SELECT SuatChieuID,ThoiGianBatDau,ThoiGianKetThuc,TrangThai FROM dbo.SUATCHIEU WHERE TrangThai=N'Mở bán' AND ThoiGianKetThuc<SYSDATETIME()`,
};
const results=[];
for(const [name,q] of Object.entries(scans)){const rows=inspect(name,q);results.push({name,rows:rows.length});}
save('data-scan-summary.json',results);
const blank=[];
for(const col of read('live-columns').filter(c=>!c.is_nullable&&['varchar','nvarchar'].includes(c.typeName)&&!['MatKhau'].includes(c.name))) {
  const rows=inspect(`blank-${col.tableName}-${col.name}`,`SELECT COUNT(*) invalidRows FROM dbo.[${col.tableName}] WHERE LEN(LTRIM(RTRIM([${col.name}])))=0`);
  if(rows[0].invalidRows)blank.push({table:col.tableName,column:col.name,...rows[0]});
}
save('data-blank-required.json',blank);
console.log(JSON.stringify({orphans:orphans.filter(r=>r.invalidRows),duplicates:duplicates.filter(r=>r.duplicateGroups),scans:results.filter(r=>r.rows),blank},null,2));
