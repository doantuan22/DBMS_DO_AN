-- Xử lý dữ liệu đặt vé của nhân viên: sp_StaffBooking_Detail.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_Detail
    @ActorID int,
    @PortalRole varchar(50),
    @DonDatVeID int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Own bit = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @Own = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION StaffBookingDetail;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole;
        DECLARE @Rap int;
        SELECT
            @Rap = p.RapID
        FROM
            dbo.DONDATVE d
            JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
            JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
        WHERE
            d.DonDatVeID = @DonDatVeID;
        IF @Rap IS NULL
            THROW 50033, N'Đơn đặt vé không tồn tại.', 1;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole,
            @Rap;
        SELECT
            v.[DonDatVeID],
            v.[NguoiDungID],
            v.[HoTenKhachHang],
            v.[Email],
            v.[SoDienThoai],
            v.[SuatChieuID],
            v.[PhimID],
            v.[TenPhim],
            v.[PosterURL],
            v.[DoTuoi],
            v.[ThoiLuong],
            v.[RapID],
            v.[TenRap],
            v.[DiaChiRap],
            v.[PhongID],
            v.[TenPhong],
            v.[LoaiPhong],
            v.[ThoiGianBatDau],
            v.[ThoiGianKetThuc],
            v.[DinhDang],
            v.[NgayDat],
            v.[TongTienVe],
            v.[TongTienDoAn],
            v.[TienGiamGia],
            v.[TongTienThanhToan],
            v.[TrangThaiDon],
            v.[HanGiuCho],
            v.[MaKhuyenMai],
            v.[MoTaKhuyenMai],
            v.[DanhSachGhe],
            v.[DanhSachMaVe],
            d.LyDoHuy,
            d.ThongBaoHuy,
            CONVERT(
                bit,
                CASE
                    WHEN d.TrangThai = N'Chờ thanh toán'
                    AND d.HanGiuCho > dbo.fn_BayGio()
                    AND d.KhuyenMaiID IS NULL
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.CHITIETDOAN
                        WHERE
                            DonDatVeID = d.DonDatVeID
                    )
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.THANHTOAN
                        WHERE
                            DonDatVeID = d.DonDatVeID
                    )
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.CHITIETVE
                        WHERE
                            DonDatVeID = d.DonDatVeID
                            AND TrangThai = N'Đã sử dụng'
                    )
                    AND EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.NGUOIDUNG n
                            JOIN dbo.VAITRO r ON r.VaiTroID = n.VaiTroID
                        WHERE
                            n.NguoiDungID = d.NguoiDungID
                            AND n.TrangThai = N'Hoạt động'
                            AND r.MaVaiTro = 'KHACH_HANG'
                    )
                    AND EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.vw_LichChieuChiTiet
                        WHERE
                            SuatChieuID = d.SuatChieuID
                            AND IsBookable = 1
                    ) THEN 1
                    ELSE 0
                END
            ) AS CanEdit,
            CONVERT(
                bit,
                CASE
                    WHEN d.TrangThai = N'Chờ thanh toán'
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.THANHTOAN
                        WHERE
                            DonDatVeID = d.DonDatVeID
                            AND TrangThai IN (N'Đang xử lý', N'Thành công', N'Đã hoàn tiền')
                    )
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.CHITIETVE
                        WHERE
                            DonDatVeID = d.DonDatVeID
                            AND TrangThai = N'Đã sử dụng'
                    ) THEN 1
                    ELSE 0
                END
            ) AS CanCancel,
            (
                SELECT
                    COUNT(*)
                FROM
                    dbo.CHITIETVE
                WHERE
                    DonDatVeID = d.DonDatVeID
                    AND TrangThai <> N'Đã hủy'
            ) AS SoLuongVe,
            b.DiemBoiThuong,
            b.NgayBoiThuong
        FROM
            dbo.vw_ChiTietDonDatVe v
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
            LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = d.DonDatVeID
        WHERE
            v.DonDatVeID = @DonDatVeID;
        SELECT
            cv.VeID,
            cv.MaVe,
            g.GheID,
            g.HangGhe,
            g.SoGhe,
            (g.HangGhe + CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,
            g.LoaiGhe,
            cv.GiaVe,
            cv.TrangThai AS TrangThaiVe
        FROM
            dbo.CHITIETVE cv
            INNER JOIN dbo.GHE g ON g.GheID = cv.GheID
        WHERE
            cv.DonDatVeID = @DonDatVeID;
        SELECT
            cda.ChiTietDoAnID,
            sp.SanPhamID,
            sp.TenSanPham,
            sp.LoaiSanPham,
            cda.SoLuong,
            cda.DonGia,
            cda.SoLuong * cda.DonGia AS ThanhTien
        FROM
            dbo.CHITIETDOAN cda
            INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID = cda.SanPhamID
        WHERE
            cda.DonDatVeID = @DonDatVeID;
        -- STRICT 3NF: Tái dựng SoTien từ d.TongTienVe + d.TongTienDoAn - d.TienGiamGia
        SELECT
            t.ThanhToanID,
            t.PhuongThuc,
            (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien,
            t.NgayTao,
            t.NgayThanhToan,
            t.MaGiaoDich,
            t.TrangThai,
            t.GhiChu
        FROM
            dbo.THANHTOAN t
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID
        WHERE
            t.DonDatVeID = @DonDatVeID
        ORDER BY
            t.ThanhToanID;
        IF @Own = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF XACT_STATE() = - 1
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        ELSE
            IF XACT_STATE() = 1
            BEGIN
                IF @Own = 1
                    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                    ROLLBACK TRANSACTION
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION StaffBookingDetail;
        END;
        THROW;
    END CATCH;
END;

GO
