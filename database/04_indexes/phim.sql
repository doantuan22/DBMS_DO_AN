-- Tạo chỉ mục phục vụ tra cứu và kiểm soát dữ liệu trùng.
CREATE NONCLUSTERED
INDEX [IX_PHIM_TrangThai] ON dbo.[PHIM]([TrangThai] ASC, [NgayKhoiChieu] ASC);

GO
