CREATE TABLE dbo.[QUYEN] (
  [QuyenID] int IDENTITY(1,1) NOT NULL,
  [MaQuyen] varchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [TenQuyen] nvarchar(100) COLLATE Vietnamese_CI_AS NOT NULL,
  [MoTa] nvarchar(255) COLLATE Vietnamese_CI_AS NULL
);
GO
