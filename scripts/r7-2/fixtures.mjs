// Direct SQL is confined to disposable test setup/assertions/cleanup.
import assert from 'node:assert/strict';
import {createFixture as baseFixture,cleanupFixture as baseCleanup,cleanSession} from '../r21/fixtures.mjs';
import {sql} from './common.mjs';
export {cleanSession};
export async function createFixture(h){
 const f=await baseFixture(h.pool);
 f.customer=f.users.find(r=>r.Email==='khachhang1@gmail.com').NguoiDungID;
 f.manager=f.users.find(r=>r.Email==='manager.q1@cinemadb.vn').NguoiDungID;
 f.profiles=await h.query('SELECT NguoiDungID,DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID',{ID:f.customer});
 f.date=f.showDate.toISOString().slice(0,10);
 f.setup=[];
 f.q=async(text,inputs={})=>{const rows=await h.query(text,inputs);f.setup.push({text,inputs,rows});return rows;};
 return f;
}
export async function cleanupFixture(h,f){
 await f.q(`DECLARE @Orders TABLE(ID INT);INSERT @Orders SELECT d.DonDatVeID FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE p.RapID=@Cinema;
 DELETE b FROM dbo.BOITHUONG_HUYSUAT b JOIN @Orders o ON b.DonDatVeID=o.ID;
 DELETE t FROM dbo.THANHTOAN t JOIN @Orders o ON t.DonDatVeID=o.ID;
 DELETE t FROM dbo.CHITIETVE t JOIN @Orders o ON t.DonDatVeID=o.ID;
 DELETE t FROM dbo.CHITIETDOAN t JOIN @Orders o ON t.DonDatVeID=o.ID;
 DELETE d FROM dbo.DONDATVE d JOIN @Orders o ON d.DonDatVeID=o.ID;
 DELETE dbo.BANGGIA WHERE RapID=@Cinema;DELETE dbo.DANHGIAPHIM WHERE PhimID=@Movie;`,{Cinema:f.cinema,Movie:f.movie});
 for(const p of f.profiles)await h.query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@ID',{ID:p.NguoiDungID,Points:p.DiemTichLuy});
 await baseCleanup(h.pool,f);return cleanSession(h.pool);
}
export async function historicalOrder(f){
 const row=(await f.q(`INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai)
 VALUES(@User,@Show,80000,10000,0,N'Đã thanh toán');DECLARE @ID INT=SCOPE_IDENTITY();
 INSERT dbo.CHITIETVE(DonDatVeID,GheID,GiaVe,MaVe,TrangThai) VALUES(@ID,@Seat,80000,CONVERT(VARCHAR(36),NEWID()),N'Đã đặt');
 INSERT dbo.CHITIETDOAN(DonDatVeID,SanPhamID,SoLuong,DonGia) VALUES(@ID,@Product,1,10000);
 INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,SoTien,TrangThai,NgayThanhToan) VALUES(@ID,N'MOMO',90000,N'Thành công',dbo.fn_BayGio());SELECT @ID id;`,{User:f.customer,Show:f.show,Seat:f.seats[0],Product:f.product}))[0];
 f.order=row.id;return row.id;
}
export async function eligible(f){
 await historicalOrder(f);
 await f.q(`UPDATE dbo.PHIM SET NgayKhoiChieu=DATEADD(DAY,-5,dbo.fn_HomNay()),NgayKetThuc=DATEADD(DAY,20,dbo.fn_HomNay()) WHERE PhimID=@Movie;
 UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(DAY,-1,dbo.fn_BayGio()),ThoiGianKetThuc=DATEADD(MINUTE,90,DATEADD(DAY,-1,dbo.fn_BayGio())) WHERE SuatChieuID=@Show;`,{Movie:f.movie,Show:f.show});
}
export async function assignment(h,f,mode,work){
 const previous=await h.query('SELECT * FROM dbo.PHANCONG_RAP WHERE RapID=@Cinema',{Cinema:f.cinema});assert.equal(previous.length,1);
 await f.q(mode==='revoked'?"UPDATE dbo.PHANCONG_RAP SET TrangThai=N'Đã hủy' WHERE RapID=@Cinema":"UPDATE dbo.PHANCONG_RAP SET NgayKetThuc=DATEADD(DAY,-1,dbo.fn_HomNay()) WHERE RapID=@Cinema",{Cinema:f.cinema});
 try{return await work();}finally{await h.pool.request().input('ID',sql.Int,previous[0].PhanCongID).input('Status',sql.NVarChar(50),previous[0].TrangThai).input('End',sql.Date,previous[0].NgayKetThuc).query('UPDATE dbo.PHANCONG_RAP SET TrangThai=@Status,NgayKetThuc=@End WHERE PhanCongID=@ID');}
}
export async function dataset(f){
 await f.q(`UPDATE dbo.PHIM SET NgayKhoiChieu=DATEADD(DAY,-40,dbo.fn_HomNay()),NgayKetThuc=DATEADD(DAY,40,dbo.fn_HomNay()) WHERE PhimID=@Movie;
 UPDATE dbo.SUATCHIEU SET GiaVeCoBan=100.10 WHERE SuatChieuID=@Show;
 UPDATE dbo.SANPHAM SET Gia=25.25 WHERE SanPhamID=@Product;
 UPDATE dbo.GHE SET TrangThai=CASE SoGhe WHEN 3 THEN N'Hỏng' ELSE N'Bảo trì' END WHERE PhongID=@Room AND SoGhe IN(3,4);
 INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) SELECT @Room,'A',v.n,N'Thường',N'Hoạt động' FROM (VALUES(5),(6),(7),(8),(9),(10))v(n);
 INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R72 inactive',N'2D',N'Ngưng hoạt động');DECLARE @Inactive INT=SCOPE_IDENTITY();
 INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Inactive,'B',1,N'Thường',N'Hoạt động'),(@Inactive,'B',2,N'Thường',N'Hỏng');
 DECLARE @Day DATETIME2=CONVERT(DATETIME2,dbo.fn_HomNay());
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
 SELECT @Movie,@Room,dbo.fn_UtcTuGioRap(DATEADD(MINUTE,v.minute,@Day)),dbo.fn_UtcTuGioRap(DATEADD(MINUTE,v.minute+90,@Day)),N'2D',100.10,v.status FROM (VALUES(30,N'Hoàn thành'),(720,N'Đóng bán'),(1020,N'Đã hủy'),(-120,N'Hoàn thành'))v(minute,status);
 DECLARE @n INT=1,@ID INT,@Seat INT,@Paid DATETIME2,@Payment NVARCHAR(50),@Status NVARCHAR(50);
 WHILE @n<=8 BEGIN
 SELECT @Seat=GheID FROM (SELECT GheID,ROW_NUMBER() OVER(ORDER BY GheID) rn FROM dbo.GHE WHERE PhongID=@Room AND TrangThai=N'Hoạt động')s WHERE rn=@n;
 SET @Paid=dbo.fn_UtcTuGioRap(DATEADD(MINUTE,CASE @n WHEN 1 THEN 30 WHEN 2 THEN 1439 WHEN 3 THEN -1 WHEN 4 THEN 1440 ELSE 720 END,@Day));
 SET @Status=CASE WHEN @n<=4 THEN N'Đã thanh toán' WHEN @n IN(5,6) THEN N'Chờ thanh toán' ELSE N'Đã hủy' END;
 SET @Payment=CASE WHEN @n<=4 OR @n=8 THEN N'Thành công' WHEN @n=6 THEN N'Đang xử lý' ELSE N'Thất bại' END;
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai,HanGiuCho)
 VALUES(@User,@Show,100.10,25.25,5.05,@Status,CASE WHEN @Status=N'Chờ thanh toán' THEN DATEADD(MINUTE,5,dbo.fn_BayGio()) ELSE NULL END);SET @ID=SCOPE_IDENTITY();
 INSERT dbo.CHITIETVE(DonDatVeID,GheID,GiaVe,MaVe,TrangThai) VALUES(@ID,@Seat,100.10,CONVERT(VARCHAR(36),NEWID()),CASE WHEN @n>=7 THEN N'Đã hủy' ELSE N'Đã đặt' END);
 INSERT dbo.CHITIETDOAN(DonDatVeID,SanPhamID,SoLuong,DonGia) VALUES(@ID,@Product,1,25.25);
 INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,SoTien,TrangThai,NgayTao,NgayThanhToan) VALUES(@ID,N'MOMO',120.30,@Payment,@Paid,CASE WHEN @Payment=N'Thành công' THEN @Paid ELSE NULL END);
 IF @n=1 INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,SoTien,TrangThai,NgayTao) VALUES(@ID,N'MOMO',120.30,N'Thất bại',@Paid);
 SET @n+=1;END;
 SELECT CONVERT(VARCHAR(10),dbo.fn_HomNay(),23) today,CONVERT(VARCHAR(10),DATEADD(DAY,-1,dbo.fn_HomNay()),23) yesterday,CONVERT(VARCHAR(10),DATEADD(DAY,1,dbo.fn_HomNay()),23) tomorrow;`,{Cinema:f.cinema,Movie:f.movie,Room:f.room,Show:f.show,User:f.customer,Product:f.product});
 const dates=f.setup.at(-1).rows[0];Object.assign(f,dates);
}
export async function integrity(h){
 const rows=await h.query(`IF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) OR EXISTS(SELECT 1 FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) OR EXISTS(SELECT 1 FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1) THROW 51072,'Database protection disabled.',1;
 IF EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.TongTienVe<>ISNULL((SELECT SUM(v.GiaVe) FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID),0) OR d.TongTienDoAn<>ISNULL((SELECT SUM(f.SoLuong*f.DonGia) FROM dbo.CHITIETDOAN f WHERE f.DonDatVeID=d.DonDatVeID),0)) THROW 51072,'Order snapshot mismatch.',1;
 IF EXISTS(SELECT 1 FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE t.SoTien<>d.TongTienVe+d.TongTienDoAn-d.TienGiamGia) THROW 51072,'Payment snapshot mismatch.',1;
 IF EXISTS(SELECT DonDatVeID FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công' GROUP BY DonDatVeID HAVING COUNT(*)>1) THROW 51072,'Duplicate successful payment.',1;
 IF EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE TrangThai=N'Đã thanh toán' AND HanGiuCho IS NOT NULL) THROW 51072,'Paid order retains hold.',1;
 IF EXISTS(SELECT d.SuatChieuID,v.GheID FROM dbo.DONDATVE d JOIN dbo.CHITIETVE v ON v.DonDatVeID=d.DonDatVeID WHERE v.TrangThai<>N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d.HanGiuCho,dbo.fn_BayGio())=1 GROUP BY d.SuatChieuID,v.GheID HAVING COUNT(*)>1) THROW 51072,'Seat conflict.',1;
 IF EXISTS(SELECT NguoiDungID FROM dbo.DONDATVE WHERE TrangThai=N'Chờ thanh toán' AND HanGiuCho>dbo.fn_BayGio() GROUP BY NguoiDungID HAVING COUNT(*)>dbo.fn_GioiHanDonDangGiu()) THROW 51072,'Hold limit exceeded.',1;
 IF EXISTS(SELECT 1 FROM sys.dm_tran_session_transactions s JOIN sys.dm_tran_database_transactions d ON d.transaction_id=s.transaction_id WHERE d.database_id=DB_ID() AND s.is_user_transaction=1 AND s.session_id<>@@SPID) THROW 51072,'Other test connection retains transaction.',1;
 SELECT N'PASS' constraintsAndTriggers,N'PASS' snapshots,N'PASS' uniquenessAndHoldLimit,N'PASS' otherConnectionsTransactions;`);
 const dbcc=await h.pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS,NO_INFOMSGS;');
 assert.ok((dbcc.recordsets??[]).every(r=>r.length===0),'DBCC constraint violations');
 return {assertions:rows,dbcc:'PASS',session:await cleanSession(h.pool)};
}
