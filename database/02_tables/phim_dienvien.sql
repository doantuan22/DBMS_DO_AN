-- Tạo bảng lưu diễn viên của phim.
CREATE TABLE dbo.[PHIM_DIENVIEN](
    [PhimID] int NOT NULL,
    [DienVienID] int NOT NULL,
    [VaiDien] nvarchar(150) COLLATE Vietnamese_CI_AS NULL
);

GO
