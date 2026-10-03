CREATE TABLE dbo.[PHONGCHIEU] (
  [PhongID] int IDENTITY(1,1) NOT NULL,
  [RapID] int NOT NULL,
  [TenPhong] nvarchar(100) COLLATE Vietnamese_CI_AS NOT NULL,
  [LoaiPhong] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
