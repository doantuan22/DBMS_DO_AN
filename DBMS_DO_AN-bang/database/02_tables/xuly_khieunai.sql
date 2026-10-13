CREATE TABLE dbo.[XULY_KHIEUNAI] (
  [XuLyID] int IDENTITY(1,1) NOT NULL,
  [KhieuNaiID] int NOT NULL,
  [NguoiXuLyID] int NOT NULL,
  [NoiDungXuLy] nvarchar(MAX) COLLATE Vietnamese_CI_AS NOT NULL,
  [NgayXuLy] datetime2(7) NOT NULL,
  [TrangThaiSauXuLy] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
