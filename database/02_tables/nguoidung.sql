CREATE TABLE dbo.[NGUOIDUNG] (
  [NguoiDungID] int IDENTITY(1,1) NOT NULL,
  [VaiTroID] int NOT NULL,
  [HoTen] nvarchar(100) COLLATE Vietnamese_CI_AS NOT NULL,
  [Email] varchar(150) COLLATE Vietnamese_CI_AS NOT NULL,
  [MatKhau] varchar(255) COLLATE Vietnamese_CI_AS NOT NULL,
  [SoDienThoai] varchar(20) COLLATE Vietnamese_CI_AS NULL,
  [NgayTao] datetime2(7) NOT NULL,
  [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL
);
GO
