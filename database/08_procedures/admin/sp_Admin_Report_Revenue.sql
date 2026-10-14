-- Xử lý dữ liệu quản trị hệ thống: sp_Admin_Report_Revenue.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Admin_Report_Revenue
    (
    @ActorID INT,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL,
    @RapID INT = NULL
    )
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @ActorID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @ActorID
            AND vt.MaVaiTro IN ('ADMIN')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'XEM_BAO_CAO_TOANHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    -- Existing cash-receipt contract: successful payment snapshots, independent of
    -- order status. Compensation is loyalty points, not a cash refund.
    -- One row/order keeps ticket, food and discount snapshots from being multiplied.
    CREATE TABLE #DonDaThu(
        DonDatVeID INT PRIMARY KEY,
        RapID INT NOT NULL,
        PhimID INT NOT NULL,
        NgayThu DATE NOT NULL,
        TongTienVe DECIMAL(18, 2),
        TongTienDoAn DECIMAL(18, 2),
        TienGiamGia DECIMAL(18, 2),
        DiemSuDung INT,
        TrangThaiDon NVARCHAR(50),
        TienDaThu DECIMAL(18, 2),
        SoVe INT
    );
    INSERT INTO
        #DonDaThu(
            DonDatVeID,
            RapID,
            PhimID,
            NgayThu,
            TongTienVe,
            TongTienDoAn,
            TienGiamGia,
            DiemSuDung,
            TrangThaiDon,
            TienDaThu,
            SoVe
        )
    SELECT
        ddv.DonDatVeID,
        pc.RapID,
        sc.PhimID,
        dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))),
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia,
        ddv.DiemSuDung,
        ddv.TrangThai,
        -- Tiền thực thu = tiền thật đã trả sau tổng mọi khoản giảm; một dòng/đơn.
        CASE WHEN ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia < 0 THEN 0 ELSE ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia END,
        (
            SELECT
                COUNT(*)
            FROM
                dbo.CHITIETVE cv
            WHERE
                cv.DonDatVeID = ddv.DonDatVeID
                AND cv.TrangThai <> N'Đã hủy'
        )
    FROM
        dbo.DONDATVE ddv
        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
        INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
        INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID
        AND tt.TrangThai = N'Thành công'
    WHERE
        (
            @RapID IS NULL
            OR pc.RapID = @RapID
        )
    GROUP BY
        ddv.DonDatVeID,
        pc.RapID,
        sc.PhimID,
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia,
        ddv.DiemSuDung,
        ddv.TrangThai
    HAVING
        (
            @TuNgay IS NULL
            OR dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) >= @TuNgay
        )
        AND (
            @DenNgay IS NULL
            OR dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) <= @DenNgay
        );
    -- Recordset 1: Summary (same metrics as the former second recordset).
    SELECT
        -- Đơn có thanh toán thành công (tiền và/hoặc điểm). Các cột sau tách rõ từng loại mẫu số.
        COUNT(DonDatVeID) AS TongSoDonToanHeThong,
        ISNULL(SUM(CASE WHEN TrangThaiDon IN (N'Đã thanh toán', N'Hoàn thành') THEN 1 ELSE 0 END), 0) AS SoDonHopLe,
        ISNULL(SUM(CASE WHEN TienDaThu > 0 THEN 1 ELSE 0 END), 0) AS SoDonCoTienThucThu,
        ISNULL(SUM(CASE WHEN TrangThaiDon = N'Đã hủy' THEN TienDaThu ELSE 0 END), 0) AS TienThuocDonHuy,
        ISNULL(SUM(CAST(DiemSuDung AS DECIMAL(18, 2)) * 1000), 0) AS TongGiaTriThanhToanBangDiem,
        ISNULL(SUM(DiemSuDung), 0) AS TongDiemSuDung,
        ISNULL(SUM(SoVe), 0) AS TongSoVeBan,
        ISNULL(SUM(TongTienVe), 0) AS TongDoanhThuVe,
        ISNULL(SUM(TongTienDoAn), 0) AS TongDoanhThuDoAn,
        ISNULL(SUM(TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(TienDaThu), 0) AS TongDoanhThuThucTe
    FROM
        #DonDaThu;
    -- Recordset 2: RevenueByCinema; preserve zero rows for existing cinemas.
    SELECT
        r.RapID,
        r.TenRap,
        r.ThanhPho,
        COUNT(d.DonDatVeID) AS SoDon,
        ISNULL(SUM(d.SoVe), 0) AS SoVeBan,
        ISNULL(SUM(d.TongTienVe), 0) AS DoanhThuVe,
        ISNULL(SUM(d.TongTienDoAn), 0) AS DoanhThuDoAn,
        ISNULL(SUM(d.TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(d.TienDaThu), 0) AS DoanhThuThucTe,
        ISNULL(SUM(CAST(d.DiemSuDung AS DECIMAL(18, 2)) * 1000), 0) AS GiaTriThanhToanBangDiem
    FROM
        dbo.RAPCHIEUPHIM r
        LEFT JOIN #DonDaThu d ON d.RapID = r.RapID
    WHERE
        (
            @RapID IS NULL
            OR r.RapID = @RapID
        )
    GROUP BY
        r.RapID,
        r.TenRap,
        r.ThanhPho
    ORDER BY
        r.RapID;
    -- Recordset 3: RevenueByMovie. Every order has exactly one show/movie;
    -- its complete receipt (including food/discount) belongs to that movie.
    SELECT
        p.PhimID,
        p.TenPhim,
        COUNT(d.DonDatVeID) AS SoDon,
        SUM(d.SoVe) AS SoVeBan,
        SUM(d.TongTienVe) AS DoanhThuVe,
        SUM(d.TongTienDoAn) AS DoanhThuDoAn,
        SUM(d.TienGiamGia) AS TongTienGiam,
        SUM(d.TienDaThu) AS DoanhThuThucTe,
        SUM(CAST(d.DiemSuDung AS DECIMAL(18, 2)) * 1000) AS GiaTriThanhToanBangDiem
    FROM
        #DonDaThu d
        INNER JOIN dbo.PHIM p ON p.PhimID = d.PhimID
    GROUP BY
        p.PhimID,
        p.TenPhim
    ORDER BY
        p.PhimID;
    -- Recordset 4: RevenueByDate, inclusive Vietnam business-date bounds.
    SELECT
        NgayThu AS Ngay,
        COUNT(DonDatVeID) AS SoDon,
        SUM(SoVe) AS SoVeBan,
        SUM(TongTienVe) AS DoanhThuVe,
        SUM(TongTienDoAn) AS DoanhThuDoAn,
        SUM(TienGiamGia) AS TongTienGiam,
        SUM(TienDaThu) AS DoanhThuThucTe,
        SUM(CAST(DiemSuDung AS DECIMAL(18, 2)) * 1000) AS GiaTriThanhToanBangDiem
    FROM
        #DonDaThu
    GROUP BY
        NgayThu
    ORDER BY
        NgayThu;
    DROP TABLE #DonDaThu;
END;

GO
