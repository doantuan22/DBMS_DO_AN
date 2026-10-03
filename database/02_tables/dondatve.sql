CREATE TABLE dbo.[DONDATVE] (
  [DonDatVeID] int IDENTITY(1,1) NOT NULL,
  [NguoiDungID] int NOT NULL,
  [SuatChieuID] int NOT NULL,
  [KhuyenMaiID] int NULL,
  [NgayDat] datetime2(7) NOT NULL,
  [TongTienVe] decimal(18,2) NOT NULL,
  [TongTienDoAn] decimal(18,2) NOT NULL,
  [TienGiamGia] decimal(18,2) NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [HanGiuCho] datetime2(7) NULL,
  [LyDoHuy] nvarchar(255) COLLATE Vietnamese_CI_AS NULL,
  [ThongBaoHuy] nvarchar(255) COLLATE Vietnamese_CI_AS NULL
);
GO
