-- Tạo chỉ mục cho tin nhắn khiếu nại phục vụ truy vấn lịch sử chat theo thứ tự thời gian.
CREATE NONCLUSTERED INDEX [IX_TINNHAN_KHIEUNAI_KhieuNai_ThoiGian]
ON dbo.[TINNHAN_KHIEUNAI]([KhieuNaiID] ASC, [ThoiGianGui] ASC, [TinNhanID] ASC)
INCLUDE ([NguoiGuiID], [LoaiTinNhan]);

GO
