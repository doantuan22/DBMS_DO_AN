CREATE TABLE dbo.[BANGGIA] (
  [GiaID] int IDENTITY(1,1) NOT NULL,
  [RapID] int NOT NULL,
  [LoaiGhe] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [LoaiNgay] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [DinhDang] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [PhuThu] decimal(18,2) NOT NULL,
  [NgayBatDau] date NOT NULL,
  [NgayKetThuc] date NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
