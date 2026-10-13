CREATE TABLE dbo.[DIENVIEN] (
  [DienVienID] int IDENTITY(1,1) NOT NULL,
  [HoTen] nvarchar(150) COLLATE Vietnamese_CI_AS NOT NULL,
  [NgaySinh] date NULL,
  [QuocTich] nvarchar(100) COLLATE Vietnamese_CI_AS NULL
);
GO
