SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- ---------------------------------------------------------------------------------------------
-- Single places for the rules (same pattern as fn_ThoiGianGiuChoPhut)
-- ---------------------------------------------------------------------------------------------
CREATE OR ALTER FUNCTION dbo.fn_ThoiGianGiuChoPhut()
RETURNS INT
AS
BEGIN
    RETURN 5;   -- Điểm duy nhất cấu hình thời gian giữ ghế; không gia hạn
END;
GO
