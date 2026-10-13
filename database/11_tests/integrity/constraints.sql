-- Kiểm thử nghiệp vụ trên database độc lập.
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @error int;
-- Mở transaction để các bước ghi được xử lý cùng nhau.
BEGIN TRANSACTION;
-- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
BEGIN TRY
    INSERT
        dbo.NGUOIDUNG(VaiTroID, HoTen, Email, MatKhau, SoDienThoai)
    SELECT
        VaiTroID,
        HoTen,
        Email,
        MatKhau,
        NULL
    FROM
        dbo.NGUOIDUNG
    WHERE
        Email = 'admin1@example.test';
END TRY
-- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
BEGIN CATCH
    SET
        @error = ERROR_NUMBER();
END CATCH;
IF @@TRANCOUNT > 0
    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
    ROLLBACK TRANSACTION;
IF ISNULL(@error, 0) NOT IN (2627, 2601)
    THROW 51014, 'Email uniqueness failed.', 1;
PRINT 'PASS email business key rejects duplicate';

GO

DECLARE @error int;
-- Mở transaction để các bước ghi được xử lý cùng nhau.
BEGIN TRANSACTION;
-- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
BEGIN TRY
    INSERT
        dbo.GHE(PhongID, HangGhe, SoGhe)
    VALUES
        (- 2147483647, 'Z', 1);
END TRY
-- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
BEGIN CATCH
    SET
        @error = ERROR_NUMBER();
END CATCH;
IF @@TRANCOUNT > 0
    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
    ROLLBACK TRANSACTION;
IF ISNULL(@error, 0) <> 547
    THROW 51014, 'Room foreign key failed.', 1;
PRINT 'PASS seat room FK rejects orphan';

GO
