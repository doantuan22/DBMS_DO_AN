CREATE TABLE dbo.[SANPHAM] (
  [SanPhamID] int IDENTITY(1,1) NOT NULL,
  [TenSanPham] nvarchar(150) COLLATE Vietnamese_CI_AS NOT NULL,
  [LoaiSanPham] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
  [Gia] decimal(18,2) NOT NULL,
  [MoTa] nvarchar(255) COLLATE Vietnamese_CI_AS NULL,
  [HinhAnh] nvarchar(500) COLLATE Vietnamese_CI_AS NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
