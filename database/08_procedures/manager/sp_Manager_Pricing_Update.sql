SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Pricing_Update
(
    @NguoiDungID INT,
    @GiaID INT,
    @PhuThu DECIMAL(18,2),
    @TrangThai NVARCHAR(50),
    @LoaiGhe NVARCHAR(50) = NULL,
    @LoaiNgay NVARCHAR(50) = NULL,
    @DinhDang NVARCHAR(50) = NULL,
    @NgayBatDau DATE = NULL,
    @NgayKetThuc DATE = NULL,
    @CapNhatDieuKien BIT = 0
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('QUAN_LY_RAP'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_BANG_GIA') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerPricingUpdate;
        DECLARE @RapID INT;
        SELECT @RapID = RapID FROM dbo.BANGGIA WITH (UPDLOCK, HOLDLOCK) WHERE GiaID = @GiaID;
        IF @RapID IS NULL THROW 50116, N'Bảng giá không tồn tại.', 1;
        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
            THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        IF @CapNhatDieuKien = 1 AND
           (@LoaiGhe IS NULL OR @LoaiNgay IS NULL OR @DinhDang IS NULL OR @NgayBatDau IS NULL
            OR (@NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau))
            THROW 50209, N'Điều kiện hoặc khoảng ngày bảng giá không hợp lệ.', 1;
        -- Keep RapID immutable, existing trigger/CHECK semantics, and order snapshots.
        UPDATE dbo.BANGGIA
        SET PhuThu = @PhuThu, TrangThai = @TrangThai,
            LoaiGhe = CASE WHEN @CapNhatDieuKien = 1 THEN @LoaiGhe ELSE LoaiGhe END,
            LoaiNgay = CASE WHEN @CapNhatDieuKien = 1 THEN @LoaiNgay ELSE LoaiNgay END,
            DinhDang = CASE WHEN @CapNhatDieuKien = 1 THEN @DinhDang ELSE DinhDang END,
            NgayBatDau = CASE WHEN @CapNhatDieuKien = 1 THEN @NgayBatDau ELSE NgayBatDau END,
            NgayKetThuc = CASE WHEN @CapNhatDieuKien = 1 THEN @NgayKetThuc ELSE NgayKetThuc END
        WHERE GiaID = @GiaID;
        IF @OwnTran = 1 COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @OwnTran = 1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION ManagerPricingUpdate;
        END;
        THROW;
    END CATCH;

    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA
    WHERE GiaID = @GiaID;
END;
GO
