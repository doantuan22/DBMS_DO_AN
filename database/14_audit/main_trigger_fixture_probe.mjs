// Read-only probe for selecting rollback-safe fixtures for Main trigger tests.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const require=createRequire(path.join(ROOT,'backend','package.json'));
const sql=require('mssql');
const dotenv=require('dotenv');
const env=dotenv.parse(fs.readFileSync(path.join(ROOT,'backend','.env')));
if(env.DB_DATABASE!=='CinemaBookingDB') throw new Error('Main database guard failed.');
const pool=await new sql.ConnectionPool({server:env.DB_SERVER,port:Number(env.DB_PORT??1433),database:env.DB_DATABASE,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:String(env.DB_ENCRYPT).toLowerCase()==='true',trustServerCertificate:String(env.DB_TRUST_SERVER_CERTIFICATE??'true')==='true',useUTC:true},requestTimeout:60000}).connect();
try {
  const identity=(await pool.request().query("SELECT @@SERVERNAME serverName,DB_NAME() databaseName,DATABASEPROPERTYEX(DB_NAME(),'Status') state")).recordset[0];
  if(identity.serverName!=='DoanTuanIT'||identity.databaseName!=='CinemaBookingDB'||identity.state!=='ONLINE') throw new Error('Unexpected Main identity/state.');
  const probes=await pool.request().query(`
    SELECT 'identity' AS probe,
      IDENT_CURRENT('dbo.BANGGIA') AS priceIdentity,IDENT_CURRENT('dbo.CHITIETVE') AS ticketIdentity,
      IDENT_CURRENT('dbo.DANHGIAPHIM') AS reviewIdentity,IDENT_CURRENT('dbo.SUATCHIEU') AS showtimeIdentity,
      IDENT_CURRENT('dbo.XULY_KHIEUNAI') AS processingIdentity
    UNION ALL SELECT 'counts', (SELECT COUNT(*) FROM dbo.BANGGIA),(SELECT COUNT(*) FROM dbo.CHITIETVE),
      (SELECT COUNT(*) FROM dbo.DANHGIAPHIM),(SELECT COUNT(*) FROM dbo.SUATCHIEU),(SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI);

    SELECT TOP(5) 'assigned_complaint' probe, k.KhieuNaiID, k.NguoiDungID, k.NhanVienPhuTrachID,
      k.TrangThai, CAST(NULL AS int) AS otherId
    FROM dbo.KHIEUNAI k WHERE k.NhanVienPhuTrachID IS NOT NULL ORDER BY k.KhieuNaiID;
    SELECT TOP(5) 'complaint_pair' probe, k.KhieuNaiID, k.NguoiDungID, k.NhanVienPhuTrachID,
      k.TrangThai, CAST(NULL AS int) AS otherId
    FROM dbo.KHIEUNAI k ORDER BY k.KhieuNaiID;

    SELECT TOP(5) 'role_user' probe, u.NguoiDungID, u.VaiTroID, u.TrangThai,
      (SELECT TOP(1) v.VaiTroID FROM dbo.VAITRO v WHERE v.VaiTroID<>u.VaiTroID ORDER BY v.VaiTroID) AS otherId
    FROM dbo.NGUOIDUNG u ORDER BY u.NguoiDungID;
    SELECT TOP(4) 'staff' probe,u.NguoiDungID,v.MaVaiTro,u.TrangThai,CAST(NULL AS int) AS otherId
    FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID
    WHERE v.MaVaiTro IN ('ADMIN','CSKH','KHACH_HANG') AND u.TrangThai=N'Hoạt động' ORDER BY v.MaVaiTro,u.NguoiDungID;

    SELECT TOP(5) 'review_valid' probe, d.NguoiDungID, s.PhimID, COUNT(*) AS qualifyingOrders
    FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
    WHERE d.TrangThai IN (N'Đã thanh toán',N'Hoàn thành') AND s.ThoiGianBatDau<=dbo.fn_BayGio()
      AND NOT EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID=d.NguoiDungID AND r.PhimID=s.PhimID)
    GROUP BY d.NguoiDungID,s.PhimID ORDER BY MIN(d.DonDatVeID);
    SELECT TOP(5) 'review_invalid' probe,u.NguoiDungID,p.PhimID,CAST(NULL AS int) AS qualifyingOrders
    FROM dbo.NGUOIDUNG u CROSS JOIN dbo.PHIM p
    WHERE NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
      WHERE d.NguoiDungID=u.NguoiDungID AND s.PhimID=p.PhimID AND d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') AND s.ThoiGianBatDau<=dbo.fn_BayGio())
      AND NOT EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID=u.NguoiDungID AND r.PhimID=p.PhimID)
    ORDER BY u.NguoiDungID,p.PhimID;

    SELECT TOP(5) 'duplicate_seat_pair' probe,d1.SuatChieuID,d1.DonDatVeID orderA,d2.DonDatVeID orderB,
      t.GheID,CAST(NULL AS int) AS otherId
    FROM dbo.DONDATVE d1 JOIN dbo.DONDATVE d2 ON d2.SuatChieuID=d1.SuatChieuID AND d1.DonDatVeID<d2.DonDatVeID
    JOIN dbo.CHITIETVE t ON t.DonDatVeID=d1.DonDatVeID
    WHERE d1.TrangThai NOT IN(N'Đã hủy',N'Hết hạn') AND d2.TrangThai NOT IN(N'Đã hủy',N'Hết hạn')
      AND t.TrangThai<>N'Đã hủy' AND NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE x WHERE x.DonDatVeID=d2.DonDatVeID AND x.GheID=t.GheID)
    ORDER BY d1.SuatChieuID,d1.DonDatVeID,d2.DonDatVeID;
    SELECT TOP(5) 'cross_room' probe,d.DonDatVeID,d.SuatChieuID,s.PhongID AS orderRoom,g.GheID,g.PhongID AS seatRoom
    FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
    CROSS JOIN dbo.GHE g WHERE g.PhongID<>s.PhongID
      AND NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE x WHERE x.DonDatVeID=d.DonDatVeID AND x.GheID=g.GheID)
    ORDER BY d.DonDatVeID,g.GheID;

    SELECT TOP(5) 'multi_showtime_room' probe,a.PhongID,a.SuatChieuID showA,b.SuatChieuID showB,a.PhimID,
      a.ThoiGianBatDau startA,a.ThoiGianKetThuc endA,b.ThoiGianBatDau startB,b.ThoiGianKetThuc endB
    FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON b.PhongID=a.PhongID AND a.SuatChieuID<b.SuatChieuID
    ORDER BY a.PhongID,a.SuatChieuID,b.SuatChieuID;

    SELECT TOP(1) 'price_combo' probe,r.RapID, c.LoaiGhe,c.LoaiNgay,c.DinhDang
    FROM dbo.RAPCHIEUPHIM r
    CROSS JOIN (VALUES(N'Thường',N'Ngày thường',N'2D'),(N'VIP',N'Tất cả',N'IMAX'),(N'Sweetbox',N'Cuối tuần',N'3D')) c(LoaiGhe,LoaiNgay,DinhDang)
    WHERE NOT EXISTS(SELECT 1 FROM dbo.BANGGIA b WHERE b.RapID=r.RapID AND b.LoaiGhe=c.LoaiGhe AND b.LoaiNgay=c.LoaiNgay AND b.DinhDang=c.DinhDang
      AND b.TrangThai=N'Áp dụng' AND b.NgayBatDau<='2000-01-02' AND ISNULL(b.NgayKetThuc,'9999-12-31')>='2000-01-01')
    ORDER BY r.RapID;
    SELECT TOP(5) 'complaint_history' probe,k.KhieuNaiID,k.TrangThai,CAST(NULL AS int) AS otherId
    FROM dbo.KHIEUNAI k ORDER BY k.KhieuNaiID;
  `);
  console.log(JSON.stringify({identity,sets:probes.recordsets.map((set)=>set.map((row)=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v instanceof Date?v.toISOString():v]))))},null,2));
} finally {await pool.close();}
