CREATE TABLE dbo.[PHANCONG_RAP] (
  [PhanCongID] int IDENTITY(1,1) NOT NULL,
  [NguoiDungID] int NOT NULL,
  [RapID] int NOT NULL,
  [NgayBatDau] date NOT NULL,
  [NgayKetThuc] date NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
