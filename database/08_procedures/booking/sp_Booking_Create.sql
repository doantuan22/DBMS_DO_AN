SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/012_booking_limits_and_pricing.sql:253 (dbo.sp_Booking_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Booking_Create
(
    @NguoiDungID INT,
    @SuatChieuID INT,
    @MaKhuyenMai VARCHAR(50) = NULL,
    -- Danh sách ID ghế ngăn cách bởi dấu phẩy, ví dụ '101,102'
    @DanhSachGheId VARCHAR(MAX),
    -- Chuỗi JSON danh sách đồ ăn: '[{"SanPhamID":1,"SoLuong":2},{"SanPhamID":2,"SoLuong":1}]'
    @DanhSachDoAnJson NVARCHAR(MAX) = NULL,
    @NewDonDatVeID INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('KHACH_HANG'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'DAT_VE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    -- Gọi được cả độc lập lẫn trong transaction của bên gọi: chỉ COMMIT/ROLLBACK khi tự mở transaction,
    -- ngược lại dùng SAVE TRANSACTION và chỉ rollback phần của mình.
    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;

    BEGIN TRY
        -- Sử dụng mức cô lập cao nhất để ngăn race condition (đặt trùng cùng 1 ghế)
        IF @TuMoTran = 1
            BEGIN TRANSACTION;
        ELSE
            SAVE TRANSACTION sp_Booking_Create;

        -- 1. Kiểm tra tài khoản khách hàng hợp lệ. Khóa dòng khách (UPDLOCK, HOLDLOCK, gán vào biến, không phát
        -- result set) TRƯỚC khóa suất chiếu: các đơn song song của cùng một khách bị xếp hàng, nên giới hạn số đơn
        -- đang giữ chỗ bên dưới không thể bị vượt bằng race. Thứ tự khóa luôn là khách -> suất chiếu -> ghế.
        DECLARE @KhoaKhach INT;
        SELECT @KhoaKhach = NguoiDungID
        FROM dbo.NGUOIDUNG WITH (UPDLOCK, HOLDLOCK)
        WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động';

        IF @KhoaKhach IS NULL
        BEGIN
            ;THROW 50020, N'Tài khoản người dùng không tồn tại hoặc đã bị khóa.', 1;
        END

        -- 1b. Tối đa fn_GioiHanDonDangGiu() đơn đang giữ chỗ (chưa thanh toán và chưa quá HanGiuCho) mỗi khách
        IF (SELECT COUNT(*) FROM dbo.DONDATVE
            WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Chờ thanh toán' AND HanGiuCho > dbo.fn_BayGio())
           >= dbo.fn_GioiHanDonDangGiu()
        BEGIN
            ;THROW 50028, N'Bạn đang giữ chỗ tối đa số đơn cho phép. Hãy thanh toán hoặc chờ đơn cũ hết hạn.', 1;
        END

        -- 2. Kiểm tra suất chiếu hợp lệ (còn mở bán và chưa bắt đầu)
        DECLARE @PhongID INT;
        DECLARE @TrangThaiSuatChieu NVARCHAR(50);
        DECLARE @ThoiGianBatDau DATETIME2;

        SELECT
            @PhongID = PhongID,
            @TrangThaiSuatChieu = TrangThai,
            @ThoiGianBatDau = ThoiGianBatDau
        FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK)
        WHERE SuatChieuID = @SuatChieuID;

        IF @PhongID IS NULL
        BEGIN
            ;THROW 50021, N'Suất chiếu không tồn tại.', 1;
        END

        IF @TrangThaiSuatChieu <> N'Mở bán' OR @ThoiGianBatDau <= dbo.fn_BayGio()
        BEGIN
            ;THROW 50022, N'Suất chiếu đã kết thúc, đã đóng bán hoặc bị hủy.', 1;
        END

        -- 2b. Giải phóng các đơn đã quá hạn giữ ghế của suất chiếu này (đã khóa suất chiếu ở trên)
        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatChieuID, @TraVeKetQua = 0;

        -- 3. Tách danh sách ghế cần đặt vào bảng tạm
        DECLARE @BangGheCanDat TABLE (GheID INT PRIMARY KEY);
        INSERT INTO @BangGheCanDat (GheID)
        SELECT DISTINCT CAST(value AS INT)
        FROM STRING_SPLIT(@DanhSachGheId, ',')
        WHERE LTRIM(RTRIM(value)) <> '';

        IF NOT EXISTS (SELECT 1 FROM @BangGheCanDat)
        BEGIN
            ;THROW 50023, N'Vui lòng chọn ít nhất một ghế để đặt vé.', 1;
        END

        IF (SELECT COUNT(*) FROM @BangGheCanDat) > dbo.fn_GioiHanGheMoiDon()
        BEGIN
            ;THROW 50026, N'Mỗi đơn chỉ được đặt tối đa số ghế cho phép.', 1;
        END

        -- 4. KHÓA CÁC GHẾ VÀ KIỂM TRA TOÀN VẸN:
        -- Khóa hàng trong GHE để ngăn chặn xung đột giữa các giao dịch đồng thời
        DECLARE @GheCount INT;
        SELECT @GheCount = COUNT(*)
        FROM dbo.GHE g WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN @BangGheCanDat bg ON g.GheID = bg.GheID
        WHERE g.PhongID = @PhongID AND g.TrangThai = N'Hoạt động';

        IF @GheCount <> (SELECT COUNT(*) FROM @BangGheCanDat)
        BEGIN
            ;THROW 50024, N'Một số ghế được chọn không hợp lệ, không thuộc phòng chiếu này hoặc đang bảo trì.', 1;
        END

        -- 5. KIỂM TRA TRÙNG GHẾ: Đảm bảo không có ghế nào trong danh sách đã được đặt trong đơn hợp lệ
        IF EXISTS (
            SELECT 1
            FROM dbo.CHITIETVE cv WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID
            INNER JOIN @BangGheCanDat bg ON cv.GheID = bg.GheID
            WHERE ddv.SuatChieuID = @SuatChieuID
              AND cv.TrangThai <> N'Đã hủy'
              AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, dbo.fn_BayGio()) = 1
        )
        BEGIN
            ;THROW 50025, N'Một hoặc nhiều ghế bạn chọn vừa được khách hàng khác đặt. Vui lòng chọn ghế khác.', 1;
        END

        -- 6. TÍNH SNAPSHOT GIÁ VÉ CHO TỪNG GHẾ (dùng hàm fn_TinhGiaVe)
        DECLARE @BangChiTietVe TABLE (
            GheID INT,
            GiaVe DECIMAL(18,2),
            MaVe VARCHAR(100)
        );

        INSERT INTO @BangChiTietVe (GheID, GiaVe, MaVe)
        SELECT
            bg.GheID,
            dbo.fn_TinhGiaVe(@SuatChieuID, bg.GheID),
            CONCAT('TK-', FORMAT(dbo.fn_BayGio(), 'yyyyMMddHHmmss'), '-', CAST(bg.GheID AS VARCHAR(10)), '-', LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 6))
        FROM @BangGheCanDat bg;

        DECLARE @TongTienVe DECIMAL(18,2) = 0;
        SELECT @TongTienVe = ISNULL(SUM(GiaVe), 0) FROM @BangChiTietVe;

        -- 7. TÍNH SNAPSHOT ĐỒ ĂN (NẾU CÓ TRUYỀN JSON)
        DECLARE @BangChiTietDoAn TABLE (
            SanPhamID INT,
            SoLuong INT,
            DonGia DECIMAL(18,2)
        );

        IF @DanhSachDoAnJson IS NOT NULL AND ISJSON(@DanhSachDoAnJson) = 1
        BEGIN
            -- Cộng dồn các dòng trùng sản phẩm TRƯỚC khi kiểm trần (không lách được bằng cách tách dòng).
            -- SoLuong đọc BIGINT để giá trị ngoài miền INT bị chặn bởi trần thay vì gây lỗi tràn số.
            IF EXISTS (
                SELECT 1
                FROM OPENJSON(@DanhSachDoAnJson)
                WITH (SanPhamID INT '$.SanPhamID', SoLuong BIGINT '$.SoLuong') j
                WHERE j.SoLuong > 0
                GROUP BY j.SanPhamID
                HAVING SUM(j.SoLuong) > dbo.fn_GioiHanSoLuongSanPham()
            )
            BEGIN
                ;THROW 50027, N'Số lượng mỗi sản phẩm vượt quá mức cho phép.', 1;
            END

            INSERT INTO @BangChiTietDoAn (SanPhamID, SoLuong, DonGia)
            SELECT
                j.SanPhamID,
                CAST(SUM(j.SoLuong) AS INT),
                sp.Gia
            FROM OPENJSON(@DanhSachDoAnJson)
            WITH (
                SanPhamID INT '$.SanPhamID',
                SoLuong BIGINT '$.SoLuong'
            ) j
            INNER JOIN dbo.SANPHAM sp WITH (UPDLOCK, HOLDLOCK) ON j.SanPhamID = sp.SanPhamID
            WHERE j.SoLuong > 0 AND sp.TrangThai = N'Đang bán'
            GROUP BY j.SanPhamID, sp.Gia;
        END

        DECLARE @TongTienDoAn DECIMAL(18,2) = 0;
        SELECT @TongTienDoAn = ISNULL(SUM(SoLuong * DonGia), 0) FROM @BangChiTietDoAn;

        -- 8. TÍNH KHUYẾN MÃI (NẾU CÓ)
        DECLARE @KhuyenMaiID INT = NULL;
        DECLARE @TienGiamGia DECIMAL(18,2) = 0;
        DECLARE @TongTruocGiam DECIMAL(18,2) = @TongTienVe + @TongTienDoAn;

        IF @MaKhuyenMai IS NOT NULL AND LTRIM(RTRIM(@MaKhuyenMai)) <> ''
        BEGIN
            DECLARE @LoaiGiamGia NVARCHAR(20);
            DECLARE @GiaTriGiam DECIMAL(18,2);
            DECLARE @IsValid BIT;
            DECLARE @Msg NVARCHAR(255);

            EXEC dbo.sp_Promotion_Validate
                @NguoiDungID = @NguoiDungID,
                @MaCode = @MaKhuyenMai,
                @TongTienDon = @TongTruocGiam,
                @KhuyenMaiID = @KhuyenMaiID OUTPUT,
                @LoaiGiamGia = @LoaiGiamGia OUTPUT,
                @GiaTriGiam = @GiaTriGiam OUTPUT,
                @TienGiam = @TienGiamGia OUTPUT,
                @IsValid = @IsValid OUTPUT,
                @Message = @Msg OUTPUT;

            IF @IsValid = 1 AND @KhuyenMaiID IS NOT NULL
            BEGIN
                -- Chặn cứng lần nữa: giảm tối đa 99% tổng tạm tính, tổng đơn luôn > 0
                DECLARE @TranGiam DECIMAL(18,2) = ROUND(@TongTruocGiam * dbo.fn_GioiHanGiamGiaPhanTram() / 100.0, 2, 1);
                IF @TienGiamGia > @TranGiam SET @TienGiamGia = @TranGiam;

                -- Khóa và tăng số lượng đã dùng của khuyến mãi
                UPDATE dbo.KHUYENMAI WITH (UPDLOCK, HOLDLOCK)
                SET SoLuongDaDung = SoLuongDaDung + 1
                WHERE KhuyenMaiID = @KhuyenMaiID;
            END
            ELSE
            BEGIN
                SET @KhuyenMaiID = NULL;
                SET @TienGiamGia = 0;
            END
        END

        -- 9. TẠO BẢN GHI DONDATVE
        INSERT INTO dbo.DONDATVE
        (
            NguoiDungID,
            SuatChieuID,
            KhuyenMaiID,
            NgayDat,
            TongTienVe,
            TongTienDoAn,
            TienGiamGia,
            TrangThai,
            HanGiuCho
        )
        VALUES
        (
            @NguoiDungID,
            @SuatChieuID,
            @KhuyenMaiID,
            dbo.fn_BayGio(),
            @TongTienVe,
            @TongTienDoAn,
            @TienGiamGia,
            N'Chờ thanh toán',
            DATEADD(MINUTE, dbo.fn_ThoiGianGiuChoPhut(), dbo.fn_BayGio())
        );

        SET @NewDonDatVeID = SCOPE_IDENTITY();

        -- 10. TẠO CÁC BẢN GHI CHITIETVE
        INSERT INTO dbo.CHITIETVE (DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
        SELECT
            @NewDonDatVeID,
            GheID,
            GiaVe,
            MaVe,
            N'Đã đặt'
        FROM @BangChiTietVe;

        -- 11. TẠO CÁC BẢN GHI CHITIETDOAN (NẾU CÓ)
        IF EXISTS (SELECT 1 FROM @BangChiTietDoAn)
        BEGIN
            INSERT INTO dbo.CHITIETDOAN (DonDatVeID, SanPhamID, SoLuong, DonGia)
            SELECT
                @NewDonDatVeID,
                SanPhamID,
                SoLuong,
                DonGia
            FROM @BangChiTietDoAn;
        END

        IF @TuMoTran = 1
            COMMIT TRANSACTION;

        -- Trả về kết quả chốt của đơn đặt vé
        SELECT
            ddv.DonDatVeID,
            ddv.NguoiDungID,
            ddv.SuatChieuID,
            ddv.NgayDat,
            ddv.TongTienVe,
            ddv.TongTienDoAn,
            ddv.TienGiamGia,
            (ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TongThanhToan,
            ddv.TrangThai,
            ddv.HanGiuCho,
            (SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID = ddv.DonDatVeID) AS SoLuongVe
        FROM dbo.DONDATVE ddv
        WHERE ddv.DonDatVeID = @NewDonDatVeID;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1
            ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @TuMoTran = 1
                ROLLBACK TRANSACTION;
            ELSE
                ROLLBACK TRANSACTION sp_Booking_Create;
        END
        ;THROW;
    END CATCH
END;
GO
