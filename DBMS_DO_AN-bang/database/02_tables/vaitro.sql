CREATE TABLE dbo.[VAITRO] (
  [VaiTroID] int IDENTITY(1,1) NOT NULL,
  [MaVaiTro] varchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [TenVaiTro] nvarchar(100) COLLATE Vietnamese_CI_AS NOT NULL,
  [MoTa] nvarchar(255) COLLATE Vietnamese_CI_AS NULL
);
GO
