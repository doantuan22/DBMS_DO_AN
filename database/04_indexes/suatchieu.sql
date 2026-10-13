-- Tạo chỉ mục phục vụ tra cứu và kiểm soát dữ liệu trùng.
CREATE NONCLUSTERED
INDEX [IX_SUATCHIEU_Phim_ThoiGian] ON dbo.[SUATCHIEU]([PhimID] ASC, [ThoiGianBatDau] ASC, [TrangThai] ASC);

GO

CREATE NONCLUSTERED
INDEX [IX_SUATCHIEU_Phong_ThoiGian] ON dbo.[SUATCHIEU]([PhongID] ASC, [ThoiGianBatDau] ASC, [ThoiGianKetThuc] ASC);

GO
