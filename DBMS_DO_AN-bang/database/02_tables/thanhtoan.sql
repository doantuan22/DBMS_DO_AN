CREATE TABLE dbo.[THANHTOAN] (
  [ThanhToanID] int IDENTITY(1,1) NOT NULL,
  [DonDatVeID] int NOT NULL,
  [PhuongThuc] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [SoTien] decimal(18,2) NOT NULL,
  [NgayTao] datetime2(7) NOT NULL,
  [NgayThanhToan] datetime2(7) NULL,
  [MaGiaoDich] varchar(100) COLLATE Vietnamese_CI_AS NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [GhiChu] nvarchar(255) COLLATE Vietnamese_CI_AS NULL
);
GO
