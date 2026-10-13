CREATE TABLE dbo.[RAPCHIEUPHIM] (
  [RapID] int IDENTITY(1,1) NOT NULL,
  [TenRap] nvarchar(150) COLLATE Vietnamese_CI_AS NOT NULL,
  [DiaChi] nvarchar(255) COLLATE Vietnamese_CI_AS NOT NULL,
  [ThanhPho] nvarchar(100) COLLATE Vietnamese_CI_AS NOT NULL,
  [SoDienThoai] varchar(20) COLLATE Vietnamese_CI_AS NULL,
  [MoTa] nvarchar(500) COLLATE Vietnamese_CI_AS NULL,
  [NgayHoatDong] date NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
