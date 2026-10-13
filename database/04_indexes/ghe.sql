-- Tạo chỉ mục phục vụ tra cứu và kiểm soát dữ liệu trùng.
CREATE NONCLUSTERED
INDEX [IX_GHE_PhongID_LoaiGhe] ON dbo.[GHE]([PhongID] ASC, [LoaiGhe] ASC, [TrangThai] ASC);

GO
