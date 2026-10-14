-- Tạo chỉ mục cho lịch sử phân công nhân viên theo khiếu nại.
CREATE NONCLUSTERED INDEX [IX_LICHSU_PHANCONG_KhieuNai]
ON dbo.[LICHSU_PHANCONG_KHIEUNAI]([KhieuNaiID] ASC, [ThoiGian] ASC);

GO
