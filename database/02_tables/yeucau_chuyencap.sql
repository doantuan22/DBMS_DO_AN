-- Tạo bảng lưu yêu cầu chuyển cấp khiếu nại lên Admin.
CREATE TABLE dbo.[YEUCAU_CHUYENCAP](
    [YeuCauID] int IDENTITY(1, 1) NOT NULL,
    [KhieuNaiID] int NOT NULL,
    [NguoiYeuCauID] int NOT NULL,
    [LyDo] nvarchar(500) COLLATE Vietnamese_CI_AS NOT NULL,
    [MucDoUuTien] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
    [AdminPhuTrachID] int NULL,
    [TrangThai] nvarchar(50) COLLATE Vietnamese_CI_AS NOT NULL,
    [ThoiGianGui] datetime2(7) NOT NULL,
    [ThoiGianTiepNhan] datetime2(7) NULL,
    [KetQuaXuLy] nvarchar(MAX) COLLATE Vietnamese_CI_AS NULL,
    [ThoiGianHoanTat] datetime2(7) NULL
);

GO
