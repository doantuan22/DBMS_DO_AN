-- Tạo chỉ mục cho yêu cầu chuyển cấp phục vụ danh sách chờ và lọc trạng thái.
CREATE NONCLUSTERED INDEX [IX_YEUCAU_CHUYENCAP_TrangThai_UuTien]
ON dbo.[YEUCAU_CHUYENCAP]([TrangThai] ASC, [MucDoUuTien] ASC, [ThoiGianGui] DESC);

GO

CREATE NONCLUSTERED INDEX [IX_YEUCAU_CHUYENCAP_KhieuNai]
ON dbo.[YEUCAU_CHUYENCAP]([KhieuNaiID] ASC, [ThoiGianGui] DESC);

GO

-- Ngăn tạo nhiều yêu cầu chuyển cấp đang mở trên cùng một khiếu nại (SQL Server filtered index không hỗ trợ OR)
CREATE UNIQUE NONCLUSTERED INDEX [UQ_YEUCAU_CHUYENCAP_ChoTiepNhan]
ON dbo.[YEUCAU_CHUYENCAP]([KhieuNaiID] ASC)
WHERE [TrangThai] = N'Chờ tiếp nhận';

GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_YEUCAU_CHUYENCAP_DangXuLy]
ON dbo.[YEUCAU_CHUYENCAP]([KhieuNaiID] ASC)
WHERE [TrangThai] = N'Đang xử lý';

GO
