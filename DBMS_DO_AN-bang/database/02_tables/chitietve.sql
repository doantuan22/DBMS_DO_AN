CREATE TABLE dbo.[CHITIETVE] (
  [VeID] int IDENTITY(1,1) NOT NULL,
  [DonDatVeID] int NOT NULL,
  [GheID] int NOT NULL,
  [GiaVe] decimal(18,2) NOT NULL,
  [MaVe] varchar(100) COLLATE Vietnamese_CI_AS NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
