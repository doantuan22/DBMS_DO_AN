-- Tạo bảng lưu tin nhắn trao đổi trong khiếu nại.
CREATE TABLE dbo.[TINNHAN_KHIEUNAI](
    [TinNhanID] int IDENTITY(1, 1) NOT NULL,
    [KhieuNaiID] int NOT NULL,
    [NguoiGuiID] int NOT NULL,
    [NoiDung] nvarchar(MAX) COLLATE Vietnamese_CI_AS NOT NULL,
    [LoaiTinNhan] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
    [ThoiGianGui] datetime2(7) NOT NULL
);

GO
