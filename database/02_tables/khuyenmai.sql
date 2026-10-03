CREATE TABLE dbo.[KHUYENMAI] (
  [KhuyenMaiID] int IDENTITY(1,1) NOT NULL,
  [MaCode] varchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [MoTa] nvarchar(255) COLLATE Vietnamese_CI_AS NULL,
  [LoaiGiamGia] nvarchar(20) COLLATE Vietnamese_CI_AS NOT NULL,
  [GiaTriGiam] decimal(18,2) NOT NULL,
  [DonHangToiThieu] decimal(18,2) NOT NULL,
  [GiamToiDa] decimal(18,2) NULL,
  [NgayBatDau] datetime2(7) NOT NULL,
  [NgayKetThuc] datetime2(7) NOT NULL,
  [SoLuong] int NOT NULL,
  [SoLuongDaDung] int NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
