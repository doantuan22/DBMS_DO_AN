-- One historical or ongoing schedule row for the local synthetic demo seed.
-- Past/current rows bypass the future-only admin procedure while retaining its schema constraints.
SET NOCOUNT ON;
DECLARE @Inserted TABLE(SuatChieuID int,ThoiGianBatDau datetime2(7),ThoiGianKetThuc datetime2(7));
INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
OUTPUT inserted.SuatChieuID,inserted.ThoiGianBatDau,inserted.ThoiGianKetThuc INTO @Inserted
VALUES(
  @MovieID,@RoomID,
  COALESCE(@StartUtc,DATEADD(minute,-20,dbo.fn_BayGio())),
  COALESCE(@EndUtc,DATEADD(minute,@DurationMinutes,dbo.fn_BayGio())),
  N'2D',@BasePrice,@ShowtimeStatus
);
SELECT SuatChieuID,ThoiGianBatDau,ThoiGianKetThuc FROM @Inserted;
