CREATE TABLE dbo.[SUATCHIEU] (
  [SuatChieuID] int IDENTITY(1,1) NOT NULL,
  [PhimID] int NOT NULL,
  [PhongID] int NOT NULL,
  [ThoiGianBatDau] datetime2(7) NOT NULL,
  [ThoiGianKetThuc] datetime2(7) NOT NULL,
  [DinhDang] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [GiaVeCoBan] decimal(18,2) NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
