-- Tạo chỉ mục phục vụ tra cứu và kiểm soát dữ liệu trùng.
CREATE NONCLUSTERED
INDEX [IX_XULY_KHIEUNAI_KhieuNai] ON dbo.[XULY_KHIEUNAI]([KhieuNaiID] ASC, [NgayXuLy] DESC);

GO
