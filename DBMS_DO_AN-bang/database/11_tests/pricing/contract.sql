SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @OriginalDateFirst int = @@DATEFIRST;
BEGIN TRY
    BEGIN TRANSACTION;
    INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai)
        VALUES(N'R0 pricing rollback fixture',N'Local test',N'Test',N'Hoạt động');
    DECLARE @Cinema int = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R0 pricing room',N'2D',N'Hoạt động');
    DECLARE @Room int = SCOPE_IDENTITY();
    INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'R0',1,N'Thường',N'Hoạt động');
    DECLARE @Seat int = SCOPE_IDENTITY();
    DECLARE @Movie int = (SELECT TOP(1) PhimID FROM dbo.PHIM ORDER BY PhimID);
    IF @Movie IS NULL THROW 51010, 'R0 pricing requires the existing seed movie fixture.', 1;
    -- Upcoming Monday; convert business-local dates to UTC at 00:30 local (previous UTC date).
    DECLARE @Today date = dbo.fn_HomNay();
    DECLARE @Monday date = DATEADD(DAY,14 - DATEDIFF(DAY,CONVERT(date,'19000101',112),@Today)%7,@Today);
    DECLARE @Start datetime2 = dbo.fn_UtcTuGioRap(DATEADD(MINUTE,30,CONVERT(datetime2,@Monday)));
    INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
        VALUES(@Movie,@Room,@Start,DATEADD(HOUR,4,@Start),N'2D',100000,N'Mở bán');
    DECLARE @Show int = SCOPE_IDENTITY();
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 100000 THROW 51010, 'R0 base price changed without matching rules.', 1;
    INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai) VALUES
        (@Cinema,N'Tất cả',N'Tất cả',N'Tất cả',1000,@Monday,NULL,N'Áp dụng'),
        (@Cinema,N'Thường',N'Ngày thường',N'2D',2000,@Monday,NULL,N'Áp dụng'),
        (@Cinema,N'Thường',N'Cuối tuần',N'2D',3000,@Monday,NULL,N'Áp dụng'),
        (@Cinema,N'VIP',N'Tất cả',N'Tất cả',99999,@Monday,NULL,N'Áp dụng'),
        (@Cinema,N'Thường',N'Tất cả',N'IMAX',88888,@Monday,NULL,N'Áp dụng'),
        (@Cinema,N'Thường',N'Tất cả',N'2D',77777,DATEADD(DAY,14,@Monday),NULL,N'Áp dụng'),
        (@Cinema,N'Thường',N'Tất cả',N'3D',66666,@Monday,NULL,N'Tạm dừng');
    SET DATEFIRST 1;
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 103000 THROW 51010, 'R0 Monday/all-day matching or rule filters failed.', 1;
    SET DATEFIRST 7;
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 103000 THROW 51010, 'R0 weekday must not depend on DATEFIRST.', 1;
    UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(DAY,5,@Start),ThoiGianKetThuc=DATEADD(HOUR,4,DATEADD(DAY,5,@Start)) WHERE SuatChieuID=@Show;
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 104000 THROW 51010, 'R0 Saturday/all-day matching failed.', 1;
    SET DATEFIRST 1;
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 104000 THROW 51010, 'R0 weekend must not depend on DATEFIRST.', 1;
    UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(DAY,6,@Start),ThoiGianKetThuc=DATEADD(HOUR,4,DATEADD(DAY,6,@Start)) WHERE SuatChieuID=@Show;
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 104000 THROW 51010, 'R0 Sunday/all-day matching failed.', 1;
    UPDATE dbo.BANGGIA SET TrangThai=N'Tạm dừng' WHERE RapID=@Cinema AND LoaiNgay=N'Cuối tuần';
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 101000 THROW 51010, 'R0 inactive rules must be excluded.', 1;
    UPDATE dbo.BANGGIA SET NgayKetThuc=@Monday WHERE RapID=@Cinema AND LoaiNgay=N'Tất cả' AND NgayBatDau=@Monday;
    IF dbo.fn_TinhGiaVe(@Show,@Seat) <> 100000 THROW 51010, 'R0 expired rules must be excluded.', 1;
    ROLLBACK TRANSACTION;
    SET DATEFIRST @OriginalDateFirst;
    PRINT 'PASS R0 SQL authoritative base/weekday/Saturday/Sunday/all-day/additive/seat/format/date/status/DATEFIRST/local-midnight pricing; fixture rolled back';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SET DATEFIRST @OriginalDateFirst;
    THROW;
END CATCH;
GO
