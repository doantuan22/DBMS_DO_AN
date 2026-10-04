// Deterministic clock/fixture mutation is transaction-scoped and disposable-only.
import assert from 'node:assert/strict';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, root, dbRoot, read, write } from '../db/lib.mjs';

const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if(!/^CinemaBookingDB_R0_R1_[A-Za-z0-9_]+$/.test(database||''))throw new Error('Disposable R1 database required.');
const env=credentials();
const pool=await new sql.ConnectionPool({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:true,useUTC:true}}).connect();
const results=[];
const transaction=new sql.Transaction(pool);
let open=false;
transaction.on('rollback',()=>{open=false;});
try {
 await transaction.begin();open=true;
 // SQL Server blocks ALTER of a function referenced by DEFAULT constraints.
 // Drop/re-add the same source constraints inside the rollback-only fixture.
 const defaults=read(path.join(dbRoot,'03_constraints/005_function_defaults.sql'));
 const drop=[...defaults.matchAll(/ALTER TABLE (dbo\.\[\w+\]) ADD CONSTRAINT (\[\w+\])/g)].map(m=>`ALTER TABLE ${m[1]} DROP CONSTRAINT ${m[2]};`).join('\n');
 await new sql.Request(transaction).query(drop);
 await new sql.Request(transaction).query("ALTER FUNCTION dbo.fn_BayGio() RETURNS datetime2(7) AS BEGIN RETURN CONVERT(datetime2(7),'2026-10-03T12:35:00'); END;");
 await new sql.Request(transaction).query(defaults.replace(/^GO\s*$/gm,''));
 const result=await new sql.Request(transaction).query(`
 DECLARE @Now datetime2=dbo.fn_BayGio();
 DECLARE @User int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='khachhang1@gmail.com'),
 @Manager int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn'),
 @Show int=(SELECT TOP(1) SuatChieuID FROM dbo.SUATCHIEU WHERE ThoiGianBatDau>@Now ORDER BY SuatChieuID), @Order int;
 DECLARE @Before int,@Equal int,@After int;
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TrangThai,HanGiuCho) VALUES(@User,@Show,N'Chờ thanh toán',DATEADD(SECOND,1,@Now)); SET @Before=SCOPE_IDENTITY();
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TrangThai,HanGiuCho) VALUES(@User,@Show,N'Chờ thanh toán',@Now); SET @Equal=SCOPE_IDENTITY();
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TrangThai,HanGiuCho) VALUES(@User,@Show,N'Chờ thanh toán',DATEADD(SECOND,-1,@Now)); SET @After=SCOPE_IDENTITY();
 EXEC dbo.sp_Order_ExpirePending @TraVeKetQua=0;
 IF NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Before AND TrangThai=N'Chờ thanh toán')
 OR NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Equal AND TrangThai=N'Hết hạn')
 OR NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@After AND TrangThai=N'Hết hạn')
 THROW 51021,'Fixed-clock expiration SP boundary failed.',1;
 SELECT 'expiry SP minus/equal/plus one second' AS Test,'PASS' AS Status;
 -- A fresh cinema isolates report amounts while the assignment retains the existing RBAC rule.
 INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho) VALUES(N'R1 report rollback',N'Fixture',N'Fixture');
 DECLARE @Cinema int=SCOPE_IDENTITY();
 INSERT dbo.PHANCONG_RAP(NguoiDungID,RapID,NgayBatDau,TrangThai) VALUES(@Manager,@Cinema,'2026-01-01',N'Hiệu lực');
 INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong) VALUES(@Cinema,N'R1 report room',N'2D');
 DECLARE @Room int=SCOPE_IDENTITY();
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
 VALUES(1,@Room,'2026-11-03T12:30:00','2026-11-03T15:16:00',N'2D',80000,N'Mở bán');
 SET @Show=SCOPE_IDENTITY();
 DECLARE @Times table(ID int, UtcTime datetime2);
 INSERT @Times VALUES(1,'2026-10-02T16:59:59'),(2,'2026-10-02T17:00:00'),(3,'2026-10-03T16:59:59'),(4,'2026-10-03T17:00:00');
 DECLARE @I int=1,@Time datetime2;
 WHILE @I<=4 BEGIN
 SELECT @Time=UtcTime FROM @Times WHERE ID=@I;
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai) VALUES(@User,@Show,80000,0,0,N'Đã thanh toán');
 SET @Order=SCOPE_IDENTITY();
 INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,SoTien,NgayTao,NgayThanhToan,MaGiaoDich,TrangThai) VALUES(@Order,N'VNPAY',80000,@Time,@Time,CONVERT(varchar(36),NEWID()),N'Thành công');
 SET @I+=1;
 END;
 DECLARE @Revenue table(Ngay date,SoDon int,SoVeBan int,DoanhThuVe decimal(18,2),DoanhThuDoAn decimal(18,2),TienGiamGia decimal(18,2),DoanhThuThucTe decimal(18,2));
 INSERT @Revenue EXEC dbo.sp_Manager_Revenue @NguoiDungID=@Manager,@RapID=@Cinema,@TuNgay='2026-10-03',@DenNgay='2026-10-03';
 IF NOT EXISTS(SELECT 1 FROM @Revenue WHERE Ngay='2026-10-03' AND SoDon=2 AND DoanhThuThucTe=160000)
 THROW 51021,'Manager revenue local-day range failed.',1;
 SELECT 'manager report includes local midnight/excludes next midnight' AS Test,'PASS' AS Status;
 DECLARE @Admin INT=(SELECT TOP(1) nd.NguoiDungID FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID WHERE vt.MaVaiTro='ADMIN');
 EXEC dbo.sp_Admin_Report_Revenue @ActorID=@Admin,@TuNgay='2026-10-03',@DenNgay='2026-10-03',@RapID=@Cinema;
 SELECT 'admin revenue fixture' AS Test,'PASS' AS Status;
 -- Saturday in Vietnam is still Friday on the UTC calendar.
 INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,TrangThai)
 VALUES(@Cinema,N'Tất cả',N'Cuối tuần',N'Tất cả',10000,'2026-01-01',N'Áp dụng');
 INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',1,N'Thường',N'Hoạt động');
 DECLARE @Seat int=SCOPE_IDENTITY();
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
 VALUES(1,@Room,'2026-10-02T17:30:00','2026-10-02T20:16:00',N'2D',80000,N'Hoàn thành');
 DECLARE @MidnightShow int=SCOPE_IDENTITY();
 IF dbo.fn_TinhGiaVe(@MidnightShow,@Seat)<>90000 THROW 51021,'Local weekend pricing date failed.',1;
 SELECT 'near-midnight weekend pricing keeps business day' AS Test,'PASS' AS Status;
 `);
 results.push(...result.recordsets);
 const adminCinema=result.recordsets.find(s=>s[0]?.RapID!=null);
 const adminTotal=result.recordsets.find(s=>s[0]?.TongSoDonToanHeThong!=null);
 assert.equal(adminCinema[0].SoDon,2);assert.equal(adminCinema[0].DoanhThuThucTe,160000);
 assert.equal(adminTotal[0].TongSoDonToanHeThong,2);
 await transaction.rollback();open=false;
 const now=(await pool.request().query('SELECT SYSUTCDATETIME() AS ActualNow,dbo.fn_BayGio() AS ContractNow')).recordset[0];
 assert.ok(Math.abs(now.ActualNow.getTime()-now.ContractNow.getTime())<1000,'Rollback must restore the production UTC clock');
 write(path.join(root,'audit/remediation/evidence/sql-fixed-clock-report-expiry.json'),{status:'PASS',database,results,clockRestored:true,fixtureRowsCommitted:0});
 console.log('PASS fixed clock: expiration SP before/equal/after; manager/admin local-day revenue; fixture and clock rolled back');
}finally{if(open)await transaction.rollback();await pool.close();}
