-- Tạo bảng lưu quyền theo vai trò.
CREATE TABLE dbo.[VAITRO_QUYEN](
    [VaiTroID] int NOT NULL,
    [QuyenID] int NOT NULL,
    [NgayGan] datetime2(7) NOT NULL
);

GO
