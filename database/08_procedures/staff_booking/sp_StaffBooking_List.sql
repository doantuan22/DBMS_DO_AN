SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_List
    @ActorID int, @PortalRole varchar(50), @Search nvarchar(100)=NULL, @Status nvarchar(50)=NULL,
    @RapID int=NULL, @Page int=1, @PageSize int=20
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole,@RapID;
    IF @Page<1 OR @Page>100000 OR @PageSize<1 OR @PageSize>100 OR @Page IS NULL OR @PageSize IS NULL
        THROW 50511,N'Tham số phân trang không hợp lệ.',1;
    SELECT v.DonDatVeID,v.NguoiDungID,v.HoTenKhachHang,v.Email,v.SoDienThoai,v.SuatChieuID,v.TenPhim,
        v.RapID,v.TenRap,v.TenPhong,v.ThoiGianBatDau,v.NgayDat,v.TongTienThanhToan,v.TrangThaiDon,v.HanGiuCho,
        v.SoLuongVe,v.TrangThaiThanhToanMoiNhat,
        (SELECT STRING_AGG(CONCAT(g.HangGhe,g.SoGhe),', ') FROM dbo.CHITIETVE t JOIN dbo.GHE g ON g.GheID=t.GheID
            WHERE t.DonDatVeID=v.DonDatVeID AND t.TrangThai<>N'Đã hủy') AS DanhSachGhe
    INTO #Filtered FROM dbo.vw_LichSuDatVe v
    WHERE (@RapID IS NULL OR v.RapID=@RapID) AND (@Status IS NULL OR v.TrangThaiDon=@Status)
      AND (@PortalRole='ADMIN' OR dbo.fn_KiemTraQuanLyRapScope(@ActorID,v.RapID)=1)
      AND (@Search IS NULL OR @Search='' OR CHARINDEX(@Search,v.HoTenKhachHang)>0 OR CHARINDEX(@Search,v.Email)>0
        OR CHARINDEX(@Search,ISNULL(v.SoDienThoai,''))>0 OR CHARINDEX(@Search,v.TenPhim)>0
        OR CONVERT(varchar(20),v.DonDatVeID)=@Search OR EXISTS(SELECT 1 FROM dbo.CHITIETVE t
            WHERE t.DonDatVeID=v.DonDatVeID AND CHARINDEX(@Search,t.MaVe)>0));
    SELECT DonDatVeID,NguoiDungID,HoTenKhachHang,Email,SoDienThoai,SuatChieuID,TenPhim,RapID,TenRap,TenPhong,
        ThoiGianBatDau,NgayDat,TongTienThanhToan,TrangThaiDon,HanGiuCho,SoLuongVe,TrangThaiThanhToanMoiNhat,DanhSachGhe
    FROM #Filtered ORDER BY NgayDat DESC,DonDatVeID DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
    SELECT COUNT(*) AS Total,@Page AS Page,@PageSize AS PageSize FROM #Filtered;
END;
GO
