CREATE TABLE dbo.[CHITIETDOAN] (
  [ChiTietDoAnID] int IDENTITY(1,1) NOT NULL,
  [DonDatVeID] int NOT NULL,
  [SanPhamID] int NOT NULL,
  [SoLuong] int NOT NULL,
  [DonGia] decimal(18,2) NOT NULL
);
GO
