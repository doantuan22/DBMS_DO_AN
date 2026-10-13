-- Tạo chỉ mục phục vụ tra cứu và kiểm soát dữ liệu trùng.
CREATE NONCLUSTERED
INDEX [IX_PHONGCHIEU_RapID] ON dbo.[PHONGCHIEU]([RapID] ASC, [TrangThai] ASC);

GO
