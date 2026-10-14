-- Tạo bảng lưu lịch sử phân công nhân viên phụ trách khiếu nại.
CREATE TABLE dbo.[LICHSU_PHANCONG_KHIEUNAI](
    [LichSuID] int IDENTITY(1, 1) NOT NULL,
    [KhieuNaiID] int NOT NULL,
    [NhanVienCuID] int NULL,
    [NhanVienMoiID] int NULL,
    [NguoiThucHienID] int NOT NULL,
    [ThoiGian] datetime2(7) NOT NULL,
    [LyDo] nvarchar(500) COLLATE Vietnamese_CI_AS NULL
);

GO
