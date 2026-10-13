CREATE TABLE dbo.[PHIM] (
  [PhimID] int IDENTITY(1,1) NOT NULL,
  [TenPhim] nvarchar(255) COLLATE Vietnamese_CI_AS NOT NULL,
  [ThoiLuong] int NOT NULL,
  [NgayKhoiChieu] date NOT NULL,
  [NgayKetThuc] date NULL,
  [NgonNgu] nvarchar(100) COLLATE Vietnamese_CI_AS NULL,
  [PhuDe] nvarchar(100) COLLATE Vietnamese_CI_AS NULL,
  [DoTuoi] nvarchar(20) COLLATE Vietnamese_CI_AS NULL,
  [DaoDien] nvarchar(150) COLLATE Vietnamese_CI_AS NULL,
  [MoTa] nvarchar(MAX) COLLATE Vietnamese_CI_AS NULL,
  [PosterURL] nvarchar(500) COLLATE Vietnamese_CI_AS NULL,
  [TrailerURL] nvarchar(500) COLLATE Vietnamese_CI_AS NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
