-- Tạo chỉ mục phục vụ tra cứu và kiểm soát dữ liệu trùng.
CREATE NONCLUSTERED
INDEX [IX_BANGGIA_Lookup] ON dbo.[BANGGIA](
    [RapID] ASC,
    [LoaiGhe] ASC,
    [LoaiNgay] ASC,
    [DinhDang] ASC,
    [TrangThai] ASC,
    [NgayBatDau] ASC,
    [NgayKetThuc] ASC
);

GO
