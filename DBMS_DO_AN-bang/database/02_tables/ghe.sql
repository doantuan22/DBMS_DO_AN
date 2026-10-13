CREATE TABLE dbo.[GHE] (
  [GheID] int IDENTITY(1,1) NOT NULL,
  [PhongID] int NOT NULL,
  [HangGhe] varchar(10) COLLATE Vietnamese_CI_AS NOT NULL,
  [SoGhe] int NOT NULL,
  [LoaiGhe] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
