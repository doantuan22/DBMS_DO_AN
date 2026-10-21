/*
  Main-database trigger verification demo.
  Run only against DoanTuanIT / CinemaBookingDB. Every DML case is in its own
  transaction and rolled back. Explicit negative identity keys avoid advancing
  identity counters. Missing fixture cases return BLOCKED.
*/
USE [CinemaBookingDB];
GO
SET NOCOUNT ON;
SET XACT_ABORT OFF;
IF @@SERVERNAME <> N'DoanTuanIT' OR DB_NAME() <> N'CinemaBookingDB'
    THROW 51090, 'Wrong SQL Server or database; expected DoanTuanIT/CinemaBookingDB.', 1;
IF DATABASEPROPERTYEX(DB_NAME(), 'Status') <> N'ONLINE'
    THROW 51091, 'Main database is not ONLINE.', 1;

DECLARE @Results table(
    TestId int IDENTITY(1,1), ObjectName sysname, Scenario nvarchar(120),
    Expected nvarchar(80), Actual nvarchar(80), Verdict varchar(8), Details nvarchar(4000)
);
DECLARE @E int, @Base int = -1000000000 - ABS(CHECKSUM(NEWID()) % 1000000000);
DECLARE @Now datetime2(7)=dbo.fn_BayGio();
DECLARE @Movie int=(SELECT TOP(1) PhimID FROM dbo.PHIM ORDER BY PhimID);
DECLARE @Room int=(SELECT TOP(1) PhongID FROM dbo.PHONGCHIEU ORDER BY PhongID);
DECLARE @Cinema int=(SELECT TOP(1) RapID FROM dbo.RAPCHIEUPHIM ORDER BY RapID);
DECLARE @PriceSeat nvarchar(50)=N'Thường', @PriceDay nvarchar(50)=N'Ngày thường', @PriceFormat nvarchar(50)=N'2D';
DECLARE @TicketOrder int, @TicketShow int, @TicketSeat int, @WrongSeat int;
DECLARE @DupOrder int, @DupSeat int;
DECLARE @ReviewUser int, @ReviewMovie int, @BadReviewUser int, @BadReviewMovie int;
DECLARE @AssignedComplaint int, @AssignedStaff int, @OtherStaff int;
DECLARE @UserId int, @CurrentRole int, @OtherRole int;
DECLARE @NoHistory1 int, @NoHistory2 int, @Cskh int, @Customer int;
DECLARE @RoomShowA int, @RoomShowB int;
DECLARE @InitialIdentities table(ObjectName sysname, IdentityValue numeric(38,0));
INSERT @InitialIdentities VALUES
 ('dbo.BANGGIA',IDENT_CURRENT('dbo.BANGGIA')),
 ('dbo.CHITIETVE',IDENT_CURRENT('dbo.CHITIETVE')),
 ('dbo.DANHGIAPHIM',IDENT_CURRENT('dbo.DANHGIAPHIM')),
 ('dbo.SUATCHIEU',IDENT_CURRENT('dbo.SUATCHIEU')),
 ('dbo.XULY_KHIEUNAI',IDENT_CURRENT('dbo.XULY_KHIEUNAI'));

SELECT TOP(1) @TicketOrder=d.DonDatVeID,@TicketShow=d.SuatChieuID,@TicketSeat=g.GheID
FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
JOIN dbo.GHE g ON g.PhongID=s.PhongID AND g.TrangThai=N'Hoạt động'
WHERE NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE x JOIN dbo.DONDATVE dx ON dx.DonDatVeID=x.DonDatVeID
  WHERE dx.SuatChieuID=d.SuatChieuID AND x.GheID=g.GheID AND x.TrangThai<>N'Đã hủy'
    AND dbo.fn_DonDangGiuGhe(dx.TrangThai,dx.HanGiuCho,dbo.fn_BayGio())=1)
ORDER BY d.DonDatVeID,g.GheID;
SELECT TOP(1) @WrongSeat=g.GheID FROM dbo.GHE g
WHERE @TicketShow IS NOT NULL AND g.PhongID<>(SELECT PhongID FROM dbo.SUATCHIEU WHERE SuatChieuID=@TicketShow)
  AND NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE x WHERE x.DonDatVeID=@TicketOrder AND x.GheID=g.GheID)
ORDER BY g.GheID;
SELECT TOP(1) @DupOrder=d2.DonDatVeID,@DupSeat=t.GheID
FROM dbo.DONDATVE d1 JOIN dbo.DONDATVE d2 ON d2.SuatChieuID=d1.SuatChieuID AND d1.DonDatVeID<d2.DonDatVeID
JOIN dbo.CHITIETVE t ON t.DonDatVeID=d1.DonDatVeID
WHERE dbo.fn_DonDangGiuGhe(d1.TrangThai,d1.HanGiuCho,dbo.fn_BayGio())=1
 AND dbo.fn_DonDangGiuGhe(d2.TrangThai,d2.HanGiuCho,dbo.fn_BayGio())=1
 AND t.TrangThai<>N'Đã hủy'
 AND NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE x WHERE x.DonDatVeID=d2.DonDatVeID AND x.GheID=t.GheID)
ORDER BY d1.SuatChieuID,d1.DonDatVeID,d2.DonDatVeID,t.GheID;
SELECT TOP(1) @ReviewUser=d.NguoiDungID,@ReviewMovie=s.PhimID
FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
WHERE d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') AND s.ThoiGianBatDau<=@Now
 AND NOT EXISTS(SELECT 1 FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID=d.NguoiDungID AND r.PhimID=s.PhimID)
ORDER BY d.DonDatVeID;
SELECT TOP(1) @BadReviewUser=u.NguoiDungID,@BadReviewMovie=p.PhimID
FROM dbo.NGUOIDUNG u CROSS JOIN dbo.PHIM p
WHERE NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
 WHERE d.NguoiDungID=u.NguoiDungID AND s.PhimID=p.PhimID
   AND d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') AND s.ThoiGianBatDau<=@Now)
 AND NOT EXISTS(SELECT 1 FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID=u.NguoiDungID AND r.PhimID=p.PhimID)
ORDER BY u.NguoiDungID,p.PhimID;
SELECT TOP(1) @AssignedComplaint=KhieuNaiID,@AssignedStaff=NhanVienPhuTrachID
FROM dbo.KHIEUNAI WHERE NhanVienPhuTrachID IS NOT NULL ORDER BY KhieuNaiID;
SELECT TOP(1) @OtherStaff=NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID
WHERE v.MaVaiTro IN('ADMIN','CSKH') AND u.TrangThai=N'Hoạt động' AND u.NguoiDungID<>ISNULL(@AssignedStaff,-1)
ORDER BY u.NguoiDungID;
SELECT TOP(1) @UserId=NguoiDungID,@CurrentRole=VaiTroID
FROM dbo.NGUOIDUNG WHERE VaiTroID=(SELECT MIN(VaiTroID) FROM dbo.VAITRO) ORDER BY NguoiDungID;
SELECT TOP(1) @OtherRole=VaiTroID FROM dbo.VAITRO WHERE VaiTroID<>ISNULL(@CurrentRole,-1) ORDER BY VaiTroID;
SELECT TOP(1) @Cskh=u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID
WHERE v.MaVaiTro IN('ADMIN','CSKH') AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID;
SELECT TOP(1) @Customer=u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID
WHERE v.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID;
SELECT TOP(1) @NoHistory1=k.KhieuNaiID FROM dbo.KHIEUNAI k
WHERE NOT EXISTS(SELECT 1 FROM dbo.XULY_KHIEUNAI x WHERE x.KhieuNaiID=k.KhieuNaiID) ORDER BY k.KhieuNaiID;
SELECT TOP(1) @NoHistory2=k.KhieuNaiID FROM dbo.KHIEUNAI k
WHERE k.KhieuNaiID<>ISNULL(@NoHistory1,-1)
 AND NOT EXISTS(SELECT 1 FROM dbo.XULY_KHIEUNAI x WHERE x.KhieuNaiID=k.KhieuNaiID) ORDER BY k.KhieuNaiID;
SELECT TOP(1) @RoomShowA=a.SuatChieuID,@RoomShowB=b.SuatChieuID FROM dbo.SUATCHIEU a
JOIN dbo.SUATCHIEU b ON b.PhongID=a.PhongID AND b.SuatChieuID>a.SuatChieuID ORDER BY a.PhongID,a.SuatChieuID,b.SuatChieuID;

/* Price trigger: one non-overlapping valid insert, then a multi-row overlap. */
IF @Cinema IS NULL INSERT @Results VALUES(N'TRG_BangGia_KiemTraChongLan',N'Fixture selection',N'Rap exists',N'no cinema',N'BLOCKED',N'No cinema fixture.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY
    SET IDENTITY_INSERT dbo.BANGGIA ON;
    INSERT dbo.BANGGIA(GiaID,RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai)
    VALUES(@Base,@Cinema,@PriceSeat,@PriceDay,@PriceFormat,0,'2000-01-01','2000-01-10',N'Áp dụng');
    SET IDENTITY_INSERT dbo.BANGGIA OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.BANGGIA OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_BangGia_KiemTraChongLan',N'Valid single-row insert',N'no error',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=0,'PASS','FAIL'),N'Inactive-in-time applied rule; rollback.');

  BEGIN TRAN;
  BEGIN TRY
    SET IDENTITY_INSERT dbo.BANGGIA ON;
    INSERT dbo.BANGGIA(GiaID,RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai) VALUES
      (@Base-1,@Cinema,@PriceSeat,@PriceDay,@PriceFormat,0,'2000-01-01','2000-01-10',N'Áp dụng'),
      (@Base-2,@Cinema,@PriceSeat,@PriceDay,@PriceFormat,0,'2000-01-05','2000-01-15',N'Áp dụng');
    SET IDENTITY_INSERT dbo.BANGGIA OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.BANGGIA OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_BangGia_KiemTraChongLan',N'Multi-row self-overlap',N'50215',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50215,'PASS','FAIL'),N'Two same-key applied rules with intersecting dates; rollback.');
END;

/* Ticket triggers: valid seat, room mismatch, and duplicate seat within a multi-row set. */
IF @TicketOrder IS NULL OR @TicketSeat IS NULL INSERT @Results VALUES(N'TRG_ChiTietVe_KiemTraGheDungPhong',N'Valid fixture',N'order and room-local seat',N'missing',N'BLOCKED',N'No valid booking/seat fixture.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.CHITIETVE ON;
    INSERT dbo.CHITIETVE(VeID,DonDatVeID,GheID,GiaVe,MaVe,TrangThai) VALUES(@Base,@TicketOrder,@TicketSeat,80000,CONCAT('AUD-',CONVERT(varchar(36),NEWID())),N'Đã đặt');
    SET IDENTITY_INSERT dbo.CHITIETVE OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.CHITIETVE OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_ChiTietVe_KiemTraGheDungPhong',N'Valid row same room',N'no error',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=0,'PASS','FAIL'),N'Valid ticket fixture; rollback.');
END;
IF @TicketOrder IS NULL OR @WrongSeat IS NULL INSERT @Results VALUES(N'TRG_ChiTietVe_KiemTraGheDungPhong',N'Cross-room rejection',N'50002',N'missing fixture',N'BLOCKED',N'No other-room seat fixture.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.CHITIETVE ON;
    INSERT dbo.CHITIETVE(VeID,DonDatVeID,GheID,GiaVe,MaVe,TrangThai) VALUES(@Base-1,@TicketOrder,@WrongSeat,80000,CONCAT('AUD-',CONVERT(varchar(36),NEWID())),N'Đã đặt');
    SET IDENTITY_INSERT dbo.CHITIETVE OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.CHITIETVE OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_ChiTietVe_KiemTraGheDungPhong',N'Cross-room seat rejected',N'50002',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50002,'PASS','FAIL'),N'Valid FKs, seat belongs to another room; rollback.');
END;
IF @DupOrder IS NULL OR @DupSeat IS NULL INSERT @Results VALUES(N'TRG_ChiTietVe_KiemTraTrungGhe',N'Multi-row duplicate seat',N'50003',N'missing fixture',N'BLOCKED',N'No same-showtime live order pair fixture.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.CHITIETVE ON;
    INSERT dbo.CHITIETVE(VeID,DonDatVeID,GheID,GiaVe,MaVe,TrangThai) VALUES
      (@Base-2,@DupOrder,@DupSeat,80000,CONCAT('AUD-',CONVERT(varchar(36),NEWID())),N'Đã đặt'),
      (@Base-3,@DupOrder,@DupSeat,80000,CONCAT('AUD-',CONVERT(varchar(36),NEWID())),N'Đã đặt');
    SET IDENTITY_INSERT dbo.CHITIETVE OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.CHITIETVE OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_ChiTietVe_KiemTraTrungGhe',N'Multi-row duplicate seat',N'50003',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50003,'PASS','FAIL'),N'Two inserted tickets claim one seat in one showtime; rollback.');
END;

/* Review trigger: purchased/replayed pair accepted, unpurchased pair rejected, including multi-row. */
IF @ReviewUser IS NULL INSERT @Results VALUES(N'TRG_DanhGia_KiemTraDaXemPhim',N'Valid review',N'no error',N'missing fixture',N'BLOCKED',N'No unreviewed past purchase.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.DANHGIAPHIM ON;
    INSERT dbo.DANHGIAPHIM(DanhGiaID,PhimID,NguoiDungID,SoSao,NoiDung,NgayDanhGia) VALUES(@Base,@ReviewMovie,@ReviewUser,5,N'Audit rollback fixture',@Now);
    SET IDENTITY_INSERT dbo.DANHGIAPHIM OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.DANHGIAPHIM OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_DanhGia_KiemTraDaXemPhim',N'Valid past purchase',N'no error',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=0,'PASS','FAIL'),N'Existing completed/paid purchase; rollback.');
END;
IF @BadReviewUser IS NULL INSERT @Results VALUES(N'TRG_DanhGia_KiemTraDaXemPhim',N'Unpurchased review rejected',N'50004',N'missing fixture',N'BLOCKED',N'No pair without purchase.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.DANHGIAPHIM ON;
    INSERT dbo.DANHGIAPHIM(DanhGiaID,PhimID,NguoiDungID,SoSao,NoiDung,NgayDanhGia) VALUES(@Base-1,@BadReviewMovie,@BadReviewUser,4,N'Audit rollback fixture',@Now);
    SET IDENTITY_INSERT dbo.DANHGIAPHIM OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.DANHGIAPHIM OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_DanhGia_KiemTraDaXemPhim',N'Unpurchased review rejected',N'50004',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50004,'PASS','FAIL'),N'Pair has no past completed/paid purchase; rollback.');
END;
IF @ReviewUser IS NULL OR @BadReviewUser IS NULL INSERT @Results VALUES(N'TRG_DanhGia_KiemTraDaXemPhim',N'Multi-row valid+invalid set',N'50004',N'missing fixture',N'BLOCKED',N'Need one eligible and one ineligible unique review pair.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.DANHGIAPHIM ON;
    INSERT dbo.DANHGIAPHIM(DanhGiaID,PhimID,NguoiDungID,SoSao,NoiDung,NgayDanhGia) VALUES
      (@Base-4,@ReviewMovie,@ReviewUser,5,N'Audit multi-row valid',@Now),
      (@Base-5,@BadReviewMovie,@BadReviewUser,4,N'Audit multi-row invalid',@Now);
    SET IDENTITY_INSERT dbo.DANHGIAPHIM OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.DANHGIAPHIM OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_DanhGia_KiemTraDaXemPhim',N'Multi-row valid+invalid set',N'50004',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50004,'PASS','FAIL'),N'One valid and one unpurchased review in the same statement; rollback.');
END;

/* Assignment and role immutability triggers. */
IF @AssignedComplaint IS NULL OR @OtherStaff IS NULL INSERT @Results VALUES(N'TRG_KhieuNai_NhanVienPhuTrachBatBien',N'Assignment change rejected',N'50605',N'missing fixture',N'BLOCKED',N'No assigned complaint/alternate staff.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY UPDATE dbo.KHIEUNAI SET TieuDe=TieuDe WHERE KhieuNaiID=@AssignedComplaint; SET @E=0; END TRY
  BEGIN CATCH SET @E=ERROR_NUMBER(); END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_KhieuNai_NhanVienPhuTrachBatBien',N'Non-assignment field update',N'no error',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=0,'PASS','FAIL'),N'Assigned user unchanged; no-op title update; rollback.');

  BEGIN TRAN;
  BEGIN TRY UPDATE dbo.KHIEUNAI SET NhanVienPhuTrachID=@OtherStaff WHERE KhieuNaiID=@AssignedComplaint; SET @E=0; END TRY
  BEGIN CATCH SET @E=ERROR_NUMBER(); END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_KhieuNai_NhanVienPhuTrachBatBien',N'Reassign existing complaint',N'50605',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50605,'PASS','FAIL'),N'Existing assigned agent changed to another valid staff member; rollback.');

  BEGIN TRAN;
  BEGIN TRY UPDATE TOP(2) dbo.KHIEUNAI SET NhanVienPhuTrachID=@OtherStaff WHERE NhanVienPhuTrachID IS NOT NULL; SET @E=0; END TRY
  BEGIN CATCH SET @E=ERROR_NUMBER(); END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_KhieuNai_NhanVienPhuTrachBatBien',N'Multi-row reassignment',N'50605',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50605,'PASS','FAIL'),N'Two assigned complaints reassigned together; rollback.');
END;
IF @UserId IS NULL OR @OtherRole IS NULL INSERT @Results VALUES(N'TRG_NguoiDung_VaiTroBatBien',N'Role change rejected',N'50406',N'missing fixture',N'BLOCKED',N'No user/alternate role.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY UPDATE dbo.NGUOIDUNG SET HoTen=HoTen WHERE NguoiDungID=@UserId; SET @E=0; END TRY
  BEGIN CATCH SET @E=ERROR_NUMBER(); END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_NguoiDung_VaiTroBatBien',N'Non-role field update',N'no error',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=0,'PASS','FAIL'),N'Existing account name no-op update; rollback.');

  BEGIN TRAN;
  BEGIN TRY UPDATE dbo.NGUOIDUNG SET VaiTroID=@OtherRole WHERE NguoiDungID=@UserId; SET @E=0; END TRY
  BEGIN CATCH SET @E=ERROR_NUMBER(); END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_NguoiDung_VaiTroBatBien',N'Change existing account role',N'50406',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50406,'PASS','FAIL'),N'Changed role only; rollback.');

  BEGIN TRAN;
  BEGIN TRY UPDATE TOP(2) dbo.NGUOIDUNG SET VaiTroID=@OtherRole WHERE VaiTroID=@CurrentRole; SET @E=0; END TRY
  BEGIN CATCH SET @E=ERROR_NUMBER(); END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_NguoiDung_VaiTroBatBien',N'Multi-row role change',N'50406',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50406,'PASS','FAIL'),N'Two accounts assigned another existing role together; rollback.');
END;

/* Showtime trigger: a valid insert and a two-row self-overlap statement. */
IF @Movie IS NULL OR @Room IS NULL INSERT @Results VALUES(N'TRG_SuatChieu_KiemTraTrungLich',N'Multi-row overlap',N'50001',N'missing fixture',N'BLOCKED',N'No movie/room fixture.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.SUATCHIEU ON;
    INSERT dbo.SUATCHIEU(SuatChieuID,PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
    VALUES(@Base,@Movie,@Room,'2040-01-01T10:00:00','2040-01-01T12:00:00',N'2D',80000,N'Mở bán');
    SET IDENTITY_INSERT dbo.SUATCHIEU OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.SUATCHIEU OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_SuatChieu_KiemTraTrungLich',N'Valid single showtime',N'no error',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=0,'PASS','FAIL'),N'Future test date, no existing overlap; rollback.');

  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.SUATCHIEU ON;
    INSERT dbo.SUATCHIEU(SuatChieuID,PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES
      (@Base-1,@Movie,@Room,'2041-01-01T10:00:00','2041-01-01T13:00:00',N'2D',80000,N'Mở bán'),
      (@Base-2,@Movie,@Room,'2041-01-01T11:00:00','2041-01-01T14:00:00',N'2D',80000,N'Mở bán');
    SET IDENTITY_INSERT dbo.SUATCHIEU OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.SUATCHIEU OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_SuatChieu_KiemTraTrungLich',N'Multi-row self-overlap',N'50001',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50001,'PASS','FAIL'),N'Two rows overlap in one room; rollback.');
END;

/* Complaint processing history triggers: valid row must update parent; wrong role rejected. */
IF @NoHistory1 IS NULL OR @Cskh IS NULL INSERT @Results VALUES(N'TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai',N'Valid history updates parent',N'Đang xử lý',N'missing fixture',N'BLOCKED',N'No complaint without history or active CSKH/admin.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.XULY_KHIEUNAI ON;
    INSERT dbo.XULY_KHIEUNAI(XuLyID,KhieuNaiID,NguoiXuLyID,NoiDungXuLy,NgayXuLy,TrangThaiSauXuLy)
    VALUES(@Base,@NoHistory1,@Cskh,N'Audit rollback fixture',@Now,N'Đang xử lý');
    SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; END CATCH;
  DECLARE @ObservedComplaintState nvarchar(50)=(SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID=@NoHistory1);
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai',N'Valid history updates parent',N'Đang xử lý',COALESCE(@ObservedComplaintState,CONVERT(nvarchar(20),@E)),IIF(@E=0 AND @ObservedComplaintState=N'Đang xử lý','PASS','FAIL'),N'History insert and trigger parent update; both rolled back.');

  IF @NoHistory2 IS NOT NULL BEGIN
    BEGIN TRAN;
    BEGIN TRY SET IDENTITY_INSERT dbo.XULY_KHIEUNAI ON;
      INSERT dbo.XULY_KHIEUNAI(XuLyID,KhieuNaiID,NguoiXuLyID,NoiDungXuLy,NgayXuLy,TrangThaiSauXuLy) VALUES
        (@Base-2,@NoHistory1,@Cskh,N'Audit multi-row fixture 1',@Now,N'Đang xử lý'),
        (@Base-3,@NoHistory2,@Cskh,N'Audit multi-row fixture 2',@Now,N'Đang xử lý');
      SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; SET @E=0;
    END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; END CATCH;
    DECLARE @StateOne nvarchar(50)=(SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID=@NoHistory1);
    DECLARE @StateTwo nvarchar(50)=(SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID=@NoHistory2);
    IF @@TRANCOUNT>0 ROLLBACK;
    INSERT @Results VALUES(N'TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai',N'Multi-row histories update both parents',N'both Đang xử lý',CONCAT(COALESCE(@StateOne,N'NULL'),N' / ',COALESCE(@StateTwo,N'NULL')),IIF(@E=0 AND @StateOne=N'Đang xử lý' AND @StateTwo=N'Đang xử lý','PASS','FAIL'),N'Two history rows in one insert update two parents; rollback.');
  END ELSE INSERT @Results VALUES(N'TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai',N'Multi-row histories update both parents',N'both Đang xử lý',N'missing second fixture',N'BLOCKED',N'Need two complaints with no processing history.');
END;
IF @NoHistory1 IS NULL OR @Customer IS NULL INSERT @Results VALUES(N'TRG_XuLyKhieuNai_KiemTraVaiTro',N'Customer actor rejected',N'50005',N'missing fixture',N'BLOCKED',N'No complaint/customer fixture.');
ELSE BEGIN
  BEGIN TRAN;
  BEGIN TRY SET IDENTITY_INSERT dbo.XULY_KHIEUNAI ON;
    INSERT dbo.XULY_KHIEUNAI(XuLyID,KhieuNaiID,NguoiXuLyID,NoiDungXuLy,NgayXuLy,TrangThaiSauXuLy)
    VALUES(@Base-1,@NoHistory1,@Customer,N'Audit rollback fixture',@Now,N'Đang xử lý');
    SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; SET @E=0;
  END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; END CATCH;
  IF @@TRANCOUNT>0 ROLLBACK;
  INSERT @Results VALUES(N'TRG_XuLyKhieuNai_KiemTraVaiTro',N'Customer actor rejected',N'50005',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50005,'PASS','FAIL'),N'Valid customer FK but forbidden actor role; rollback.');

  IF @NoHistory2 IS NOT NULL BEGIN
    BEGIN TRAN;
    BEGIN TRY SET IDENTITY_INSERT dbo.XULY_KHIEUNAI ON;
      INSERT dbo.XULY_KHIEUNAI(XuLyID,KhieuNaiID,NguoiXuLyID,NoiDungXuLy,NgayXuLy,TrangThaiSauXuLy) VALUES
        (@Base-4,@NoHistory1,@Customer,N'Audit multi-row invalid 1',@Now,N'Đang xử lý'),
        (@Base-5,@NoHistory2,@Customer,N'Audit multi-row invalid 2',@Now,N'Đang xử lý');
      SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; SET @E=0;
    END TRY BEGIN CATCH SET @E=ERROR_NUMBER(); SET IDENTITY_INSERT dbo.XULY_KHIEUNAI OFF; END CATCH;
    IF @@TRANCOUNT>0 ROLLBACK;
    INSERT @Results VALUES(N'TRG_XuLyKhieuNai_KiemTraVaiTro',N'Multi-row customer actors rejected',N'50005',COALESCE(CONVERT(nvarchar(20),@E),N'unknown'),IIF(@E=50005,'PASS','FAIL'),N'Two forbidden customer actors in one insert; rollback.');
  END ELSE INSERT @Results VALUES(N'TRG_XuLyKhieuNai_KiemTraVaiTro',N'Multi-row customer actors rejected',N'50005',N'missing second fixture',N'BLOCKED',N'Need two complaints with no processing history.');
END;

/* Guard that rollback did not advance any identity counters. */
DECLARE @IdentityStable bit=1,@IdentityDetail nvarchar(1000)=N'';
IF EXISTS(SELECT 1 FROM @InitialIdentities i WHERE i.IdentityValue<>CASE i.ObjectName
  WHEN 'dbo.BANGGIA' THEN IDENT_CURRENT('dbo.BANGGIA') WHEN 'dbo.CHITIETVE' THEN IDENT_CURRENT('dbo.CHITIETVE')
  WHEN 'dbo.DANHGIAPHIM' THEN IDENT_CURRENT('dbo.DANHGIAPHIM') WHEN 'dbo.SUATCHIEU' THEN IDENT_CURRENT('dbo.SUATCHIEU')
  WHEN 'dbo.XULY_KHIEUNAI' THEN IDENT_CURRENT('dbo.XULY_KHIEUNAI') END)
BEGIN SET @IdentityStable=0; SET @IdentityDetail=N'At least one identity counter changed.'; END;
INSERT @Results VALUES(N'Rollback/identity safety',N'Identity values unchanged',N'unchanged',IIF(@IdentityStable=1,N'unchanged',N'changed'),IIF(@IdentityStable=1,'PASS','FAIL'),@IdentityDetail);

SELECT TestId,ObjectName,Scenario,Expected,Actual,Verdict,Details FROM @Results ORDER BY TestId;
