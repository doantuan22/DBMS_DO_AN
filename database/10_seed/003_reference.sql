IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 3. SEED VAITRO_QUYEN (Gán quyền cho 4 Vai trò)
-- Khách hàng: QuyenID 1..5
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5);

-- Quản lý rạp: QuyenID 1..3, 6..10
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID) VALUES
(2, 1), (2, 2), (2, 3), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10);

-- CSKH: QuyenID 1, 11..13
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID) VALUES
(3, 1), (3, 11), (3, 12), (3, 13);

-- Admin: mọi quyền hiện hành (ADM-17/System Config permission is excluded)
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID)
SELECT 1, QuyenID FROM dbo.QUYEN;
-- Seed fixture timestamp is fixed by SeedDate, rather than wall-clock timing.
UPDATE dbo.VAITRO_QUYEN SET NgayGan=CONVERT(datetime2,@SeedDay);

END;
GO
