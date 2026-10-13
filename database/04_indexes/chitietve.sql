-- Tạo chỉ mục phục vụ tra cứu và kiểm soát dữ liệu trùng.
CREATE NONCLUSTERED
INDEX [IX_CHITIETVE_DonDatVe] ON dbo.[CHITIETVE]([DonDatVeID] ASC) INCLUDE([GheID], [TrangThai], [GiaVe]);

GO

CREATE NONCLUSTERED
INDEX [IX_CHITIETVE_GheID] ON dbo.[CHITIETVE]([GheID] ASC, [TrangThai] ASC);

GO
