IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 8. SEED GHE (Sinh ghế chi tiết cho Phòng 1, 2, 3, 4, 5, 6)
-- Tạo ghế cho Phòng 1 (5 hàng A..E, mỗi hàng 8 ghế = 40 ghế)
DECLARE @p INT;
DECLARE @h INT;
DECLARE @s INT;
DECLARE @hChar CHAR(1);
DECLARE @lGhe NVARCHAR(50);

SET @p = 1;
WHILE @p <= 6
BEGIN
    SET @h = 1;
    WHILE @h <= 5
    BEGIN
        SET @hChar = CHAR(64 + @h); -- A, B, C, D, E
        IF @h IN (1, 2) SET @lGhe = N'Thường';
        ELSE IF @h IN (3, 4) SET @lGhe = N'VIP';
        ELSE SET @lGhe = N'Sweetbox';

        SET @s = 1;
        WHILE @s <= 8
        BEGIN
            INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
            VALUES (@p, @hChar, @s, @lGhe, N'Hoạt động');
            SET @s = @s + 1;
        END
        SET @h = @h + 1;
    END
    SET @p = @p + 1;
END;

END;
GO
