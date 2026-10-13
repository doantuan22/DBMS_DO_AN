CREATE TABLE dbo.[KHIEUNAI] (
  [KhieuNaiID] int IDENTITY(1,1) NOT NULL,
  [NguoiDungID] int NOT NULL,
  [DonDatVeID] int NULL,
  [LoaiKhieuNai] nvarchar(100) COLLATE Vietnamese_CI_AS NOT NULL,
  [TieuDe] nvarchar(200) COLLATE Vietnamese_CI_AS NOT NULL,
  [NoiDung] nvarchar(MAX) COLLATE Vietnamese_CI_AS NOT NULL,
  [MucDoUuTien] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [NgayTao] datetime2(7) NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
