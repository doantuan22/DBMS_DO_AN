-- Tra cứu dữ liệu đặt vé của nhân viên: sp_StaffBooking_Options.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_Options
    @ActorID int,
    @PortalRole varchar(50),
    @RapID int = NULL,
    @SuatChieuID int = NULL,
    @DonDatVeID int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_StaffBooking_Authorize @ActorID,
        @PortalRole,
        @RapID;
    IF @SuatChieuID IS NOT NULL
    BEGIN
        DECLARE @ShowRap int;
        SELECT
            @ShowRap = p.RapID
        FROM
            dbo.SUATCHIEU s
            JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
        WHERE
            s.SuatChieuID = @SuatChieuID;
        IF @ShowRap IS NULL
            THROW 50021, N'Suất chiếu không tồn tại.', 1;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole,
            @ShowRap;
        IF @RapID IS NOT NULL
            AND @RapID <> @ShowRap
            THROW 50511, N'Suất chiếu không thuộc rạp đã chọn.', 1;
        IF NOT EXISTS (
            SELECT
                1
            FROM
                dbo.vw_LichChieuChiTiet
            WHERE
                SuatChieuID = @SuatChieuID
                AND IsBookable = 1
        )
            THROW 50022, N'Suất chiếu không còn mở bán.', 1;
    END;
    IF @DonDatVeID IS NOT NULL
        AND NOT EXISTS (
        SELECT
            1
        FROM
            dbo.DONDATVE
        WHERE
            DonDatVeID = @DonDatVeID
            AND SuatChieuID = @SuatChieuID
    )
        THROW 50033, N'Đơn đặt vé không tồn tại trong suất chiếu đã chọn.', 1;
    SELECT
        RapID,
        TenRap,
        ThanhPho
    FROM
        dbo.RAPCHIEUPHIM
    WHERE
        @PortalRole = 'ADMIN'
        OR dbo.fn_KiemTraQuanLyRapScope(@ActorID, RapID) = 1
    ORDER BY
        TenRap,
        RapID;
    SELECT
        TOP(200) SuatChieuID,
        RapID,
        TenRap,
        PhongID,
        TenPhong,
        PhimID,
        TenPhim,
        ThoiGianBatDau,
        DinhDang,
        GiaVeCoBan,
        COUNT(*) OVER() AS TotalMatches
    FROM
        dbo.vw_LichChieuChiTiet
    WHERE
        IsBookable = 1
        AND (
            @RapID IS NULL
            OR RapID = @RapID
        )
        AND (
            @PortalRole = 'ADMIN'
            OR dbo.fn_KiemTraQuanLyRapScope(@ActorID, RapID) = 1
        )
    ORDER BY
        ThoiGianBatDau,
        SuatChieuID;
    SELECT
        f.GheID,
        f.PhongID,
        f.HangGhe,
        f.SoGhe,
        f.TenGhe,
        f.LoaiGhe,
        COALESCE(t.GiaVe, f.GiaVe) AS GiaVe,
        CASE
            WHEN t.VeID IS NOT NULL THEN N'Trống'
            ELSE f.TrangThaiGhe
        END AS TrangThaiGhe
    FROM
        dbo.fn_DanhSachGheSuatChieu(@SuatChieuID) f
        OUTER APPLY(
            SELECT
                TOP(1) VeID,
                GiaVe
            FROM
                dbo.CHITIETVE
            WHERE
                DonDatVeID = @DonDatVeID
                AND GheID = f.GheID
                AND TrangThai = N'Đã đặt'
            ORDER BY
                VeID DESC
        ) t
    WHERE
        @SuatChieuID IS NOT NULL
    ORDER BY
        f.HangGhe,
        f.SoGhe;
END;

GO
