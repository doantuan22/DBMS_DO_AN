IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 10. SEED DIENVIEN
SET IDENTITY_INSERT dbo.DIENVIEN ON;
INSERT INTO dbo.DIENVIEN (DienVienID, HoTen, NgaySinh, QuocTich) VALUES
(1, N'Tom Cruise', '1962-07-03', N'Mỹ'),
(2, N'Cillian Murphy', '1976-05-25', N'Ireland'),
(3, N'Margot Robbie', '1990-07-02', N'Úc'),
(4, N'Trấn Thành', '1987-02-05', N'Việt Nam'),
(5, N'Phương Anh Đào', '1992-04-30', N'Việt Nam'),
(6, N'Tuấn Trần', '1992-11-20', N'Việt Nam');
SET IDENTITY_INSERT dbo.DIENVIEN OFF;

END;
GO
