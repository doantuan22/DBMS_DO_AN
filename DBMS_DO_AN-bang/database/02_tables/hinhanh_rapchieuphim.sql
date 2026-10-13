CREATE TABLE dbo.[HINHANH_RAPCHIEUPHIM] (
  [HinhAnhRapID] int IDENTITY(1,1) NOT NULL,
  [RapID] int NOT NULL,
  [URL] nvarchar(500) COLLATE Vietnamese_CI_AS NOT NULL,
  [MoTa] nvarchar(255) COLLATE Vietnamese_CI_AS NULL,
  [LaAnhDaiDien] bit NOT NULL,
  [ThuTuHienThi] int NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [NgayTao] datetime2(7) NOT NULL
);
GO
