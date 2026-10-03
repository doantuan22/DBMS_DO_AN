CREATE TABLE dbo.[DANHGIAPHIM] (
  [DanhGiaID] int IDENTITY(1,1) NOT NULL,
  [PhimID] int NOT NULL,
  [NguoiDungID] int NOT NULL,
  [SoSao] int NOT NULL,
  [NoiDung] nvarchar(1000) COLLATE Vietnamese_CI_AS NULL,
  [NgayDanhGia] datetime2(7) NOT NULL
);
GO
