/* Main CHECK-constraint negative-DML verification. Every UPDATE rolls back. */
SET NOCOUNT ON;
SET XACT_ABORT OFF;
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
  THROW 51100,'Wrong SQL Server or database; expected DoanTuanIT/CinemaBookingDB.',1;
IF DATABASEPROPERTYEX(DB_NAME(),'Status')<>N'ONLINE' THROW 51101,'Main database is not ONLINE.',1;

DECLARE @Cases table(ConstraintName sysname PRIMARY KEY, TestSql nvarchar(max));
INSERT @Cases VALUES
(N'CK_BANGGIA_DinhDang',N'UPDATE TOP(1) dbo.BANGGIA SET DinhDang=N''__AUDIT_INVALID__'''),
(N'CK_BANGGIA_LoaiGhe',N'UPDATE TOP(1) dbo.BANGGIA SET LoaiGhe=N''__AUDIT_INVALID__'''),
(N'CK_BANGGIA_LoaiNgay',N'UPDATE TOP(1) dbo.BANGGIA SET LoaiNgay=N''__AUDIT_INVALID__'''),
(N'CK_BANGGIA_PhuThu',N'UPDATE TOP(1) dbo.BANGGIA SET PhuThu=-1'),
(N'CK_BANGGIA_ThoiGian',N'UPDATE TOP(1) dbo.BANGGIA SET NgayKetThuc=DATEADD(DAY,-1,NgayBatDau)'),
(N'CK_BANGGIA_TrangThai',N'UPDATE TOP(1) dbo.BANGGIA SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_BOITHUONG_HUYSUAT_Diem',N'UPDATE TOP(1) dbo.BOITHUONG_HUYSUAT SET DiemBoiThuong=-1'),
(N'CK_CHITIETDOAN_DonGia',N'UPDATE TOP(1) dbo.CHITIETDOAN SET DonGia=-1'),
(N'CK_CHITIETDOAN_SoLuong',N'UPDATE TOP(1) dbo.CHITIETDOAN SET SoLuong=0'),
(N'CK_CHITIETVE_GiaVe',N'UPDATE TOP(1) dbo.CHITIETVE SET GiaVe=-1'),
(N'CK_CHITIETVE_TrangThai',N'UPDATE TOP(1) dbo.CHITIETVE SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_DANHGIAPHIM_SoSao',N'UPDATE TOP(1) dbo.DANHGIAPHIM SET SoSao=0'),
(N'CK_DONDATVE_DiemSuDung',N'UPDATE TOP(1) dbo.DONDATVE SET DiemSuDung=-1'),
(N'CK_DONDATVE_HanGiuCho',N'UPDATE TOP(1) dbo.DONDATVE SET TrangThai=N''Chờ thanh toán'',HanGiuCho=NULL'),
(N'CK_DONDATVE_TienGiamGia',N'UPDATE TOP(1) dbo.DONDATVE SET TienGiamGia=-1'),
(N'CK_DONDATVE_TongGiam',N'UPDATE TOP(1) dbo.DONDATVE SET TienGiamGia=TongTienVe+TongTienDoAn+1'),
(N'CK_DONDATVE_TongTienDoAn',N'UPDATE TOP(1) dbo.DONDATVE SET TongTienDoAn=-1'),
(N'CK_DONDATVE_TongTienVe',N'UPDATE TOP(1) dbo.DONDATVE SET TongTienVe=-1'),
(N'CK_DONDATVE_TrangThai',N'UPDATE TOP(1) dbo.DONDATVE SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_GHE_LoaiGhe',N'UPDATE TOP(1) dbo.GHE SET LoaiGhe=N''__AUDIT_INVALID__'''),
(N'CK_GHE_SoGhe',N'UPDATE TOP(1) dbo.GHE SET SoGhe=0'),
(N'CK_GHE_TrangThai',N'UPDATE TOP(1) dbo.GHE SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi',N'UPDATE TOP(1) dbo.HINHANH_RAPCHIEUPHIM SET ThuTuHienThi=-1'),
(N'CK_HINHANH_RAPCHIEUPHIM_TrangThai',N'UPDATE TOP(1) dbo.HINHANH_RAPCHIEUPHIM SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_HINHANH_RAPCHIEUPHIM_URL',N'UPDATE TOP(1) dbo.HINHANH_RAPCHIEUPHIM SET URL=N'''''),
(N'CK_HOSOKHACHHANG_DiemTichLuy',N'UPDATE TOP(1) dbo.HOSOKHACHHANG SET DiemTichLuy=-1'),
(N'CK_HOSOKHACHHANG_GioiTinh',N'UPDATE TOP(1) dbo.HOSOKHACHHANG SET GioiTinh=N''BAD'''),
(N'CK_KHIEUNAI_MucDoUuTien',N'UPDATE TOP(1) dbo.KHIEUNAI SET MucDoUuTien=N''__AUDIT_INVALID__'''),
(N'CK_KHIEUNAI_TrangThai',N'UPDATE TOP(1) dbo.KHIEUNAI SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_KHUYENMAI_DonHangToiThieu',N'UPDATE TOP(1) dbo.KHUYENMAI SET DonHangToiThieu=-1'),
(N'CK_KHUYENMAI_GiamToiDa',N'UPDATE TOP(1) dbo.KHUYENMAI SET GiamToiDa=-1'),
(N'CK_KHUYENMAI_GiaTriGiam',N'UPDATE TOP(1) dbo.KHUYENMAI SET GiaTriGiam=0'),
(N'CK_KHUYENMAI_LoaiGiamGia',N'UPDATE TOP(1) dbo.KHUYENMAI SET LoaiGiamGia=N''__AUDIT_INVALID__'''),
(N'CK_KHUYENMAI_PhanTram99',N'UPDATE TOP(1) dbo.KHUYENMAI SET LoaiGiamGia=N''PERCENT'',GiaTriGiam=100'),
(N'CK_KHUYENMAI_SoLuong',N'UPDATE TOP(1) dbo.KHUYENMAI SET SoLuong=0,SoLuongDaDung=1'),
(N'CK_KHUYENMAI_ThoiGian',N'UPDATE TOP(1) dbo.KHUYENMAI SET NgayKetThuc=DATEADD(DAY,-1,NgayBatDau)'),
(N'CK_KHUYENMAI_TrangThai',N'UPDATE TOP(1) dbo.KHUYENMAI SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_NGUOIDUNG_TrangThai',N'UPDATE TOP(1) dbo.NGUOIDUNG SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_PHANCONG_RAP_ThoiGian',N'UPDATE TOP(1) dbo.PHANCONG_RAP SET NgayKetThuc=DATEADD(DAY,-1,NgayBatDau)'),
(N'CK_PHANCONG_RAP_TrangThai',N'UPDATE TOP(1) dbo.PHANCONG_RAP SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_PHIM_DoTuoi',N'UPDATE TOP(1) dbo.PHIM SET DoTuoi=N''__AUDIT_INVALID__'''),
(N'CK_PHIM_ThoiGian',N'UPDATE TOP(1) dbo.PHIM SET NgayKetThuc=DATEADD(DAY,-1,NgayKhoiChieu)'),
(N'CK_PHIM_ThoiLuong',N'UPDATE TOP(1) dbo.PHIM SET ThoiLuong=0'),
(N'CK_PHIM_TrangThai',N'UPDATE TOP(1) dbo.PHIM SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_PHONGCHIEU_LoaiPhong',N'UPDATE TOP(1) dbo.PHONGCHIEU SET LoaiPhong=N''__AUDIT_INVALID__'''),
(N'CK_PHONGCHIEU_TrangThai',N'UPDATE TOP(1) dbo.PHONGCHIEU SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_RAPCHIEUPHIM_TrangThai',N'UPDATE TOP(1) dbo.RAPCHIEUPHIM SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_SANPHAM_Gia',N'UPDATE TOP(1) dbo.SANPHAM SET Gia=-1'),
(N'CK_SANPHAM_LoaiSanPham',N'UPDATE TOP(1) dbo.SANPHAM SET LoaiSanPham=N''__AUDIT_INVALID__'''),
(N'CK_SANPHAM_TrangThai',N'UPDATE TOP(1) dbo.SANPHAM SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_SUATCHIEU_DinhDang',N'UPDATE TOP(1) dbo.SUATCHIEU SET DinhDang=N''__AUDIT_INVALID__'''),
(N'CK_SUATCHIEU_GiaVeCoBan',N'UPDATE TOP(1) dbo.SUATCHIEU SET GiaVeCoBan=-1'),
(N'CK_SUATCHIEU_ThoiGian',N'UPDATE TOP(1) dbo.SUATCHIEU SET ThoiGianKetThuc=ThoiGianBatDau'),
(N'CK_SUATCHIEU_TrangThai',N'UPDATE TOP(1) dbo.SUATCHIEU SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_TINNHAN_KHIEUNAI_LoaiTinNhan',N'UPDATE TOP(1) dbo.TINNHAN_KHIEUNAI SET LoaiTinNhan=N''__AUDIT_INVALID__'''),
(N'CK_TINNHAN_KHIEUNAI_NoiDung',N'UPDATE TOP(1) dbo.TINNHAN_KHIEUNAI SET NoiDung=N'''''),
(N'CK_THANHTOAN_PhuongThuc',N'UPDATE TOP(1) dbo.THANHTOAN SET PhuongThuc=N''__AUDIT_INVALID__'''),
(N'CK_THANHTOAN_TrangThai',N'UPDATE TOP(1) dbo.THANHTOAN SET TrangThai=N''__AUDIT_INVALID__'''),
(N'CK_XULY_KHIEUNAI_TrangThaiSauXuLy',N'UPDATE TOP(1) dbo.XULY_KHIEUNAI SET TrangThaiSauXuLy=N''__AUDIT_INVALID__'''),
(N'CK_YEUCAU_CHUYENCAP_KetQua',N'UPDATE TOP(1) dbo.YEUCAU_CHUYENCAP SET TrangThai=N''Đã giải quyết'',KetQuaXuLy=NULL,ThoiGianHoanTat=NULL'),
(N'CK_YEUCAU_CHUYENCAP_LyDo',N'UPDATE TOP(1) dbo.YEUCAU_CHUYENCAP SET LyDo=N'''''),
(N'CK_YEUCAU_CHUYENCAP_MucDoUuTien',N'UPDATE TOP(1) dbo.YEUCAU_CHUYENCAP SET MucDoUuTien=N''__AUDIT_INVALID__'''),
(N'CK_YEUCAU_CHUYENCAP_ThoiGianHoanTat',N'UPDATE TOP(1) dbo.YEUCAU_CHUYENCAP SET ThoiGianTiepNhan=NULL,ThoiGianHoanTat=dbo.fn_BayGio()'),
(N'CK_YEUCAU_CHUYENCAP_ThoiGianTiepNhan',N'UPDATE TOP(1) dbo.YEUCAU_CHUYENCAP SET ThoiGianTiepNhan=DATEADD(DAY,-1,ThoiGianGui)'),
(N'CK_YEUCAU_CHUYENCAP_TrangThai',N'UPDATE TOP(1) dbo.YEUCAU_CHUYENCAP SET TrangThai=N''__AUDIT_INVALID__''');

DECLARE @Results table(ConstraintName sysname,Expected nvarchar(40),ActualError int,ActualMessage nvarchar(2048),Verdict varchar(8));
DECLARE @Name sysname,@Sql nvarchar(max),@Error int,@Message nvarchar(2048),@Exists int;
DECLARE c CURSOR LOCAL FAST_FORWARD FOR SELECT ConstraintName,TestSql FROM @Cases ORDER BY ConstraintName;
OPEN c; FETCH NEXT FROM c INTO @Name,@Sql;
WHILE @@FETCH_STATUS=0 BEGIN
  SET @Error=0; SET @Message=NULL; SET @Exists=0;
  SELECT @Exists=COUNT(*) FROM sys.check_constraints WHERE name=@Name AND is_disabled=0 AND is_not_trusted=0;
  IF @Exists<>1 BEGIN INSERT @Results VALUES(@Name,N'547 + exact name',NULL,N'Constraint missing/disabled/untrusted',N'FAIL'); END
  ELSE BEGIN
    BEGIN TRAN;
    BEGIN TRY EXEC sys.sp_executesql @Sql; END TRY
    BEGIN CATCH SET @Error=ERROR_NUMBER(); SET @Message=ERROR_MESSAGE(); END CATCH;
    IF @@TRANCOUNT>0 ROLLBACK;
    INSERT @Results VALUES(@Name,N'547 + exact name',@Error,@Message,
      IIF(@Error=547 AND CHARINDEX(@Name,COALESCE(@Message,N''))>0,'PASS','FAIL'));
  END;
  FETCH NEXT FROM c INTO @Name,@Sql;
END;
CLOSE c; DEALLOCATE c;

/* The installed CHECK inventory must be exactly covered by the explicit case map. */
INSERT @Results
SELECT cc.name,N'case map present',NULL,N'No Main DML case mapped',N'BLOCKED'
FROM sys.check_constraints cc LEFT JOIN @Cases c ON c.ConstraintName=cc.name
WHERE cc.is_disabled=0 AND cc.is_not_trusted=0 AND c.ConstraintName IS NULL;
SELECT ConstraintName,Expected,ActualError,ActualMessage,Verdict FROM @Results ORDER BY ConstraintName;
