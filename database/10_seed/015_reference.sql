IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 15. SEED SANPHAM (Đồ ăn, thức uống, Combo)
SET IDENTITY_INSERT dbo.SANPHAM ON;
INSERT INTO dbo.SANPHAM (SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai) VALUES
(1, N'Bắp rang bơ phô mai lớn', N'Bắp rang', 45000, N'Bắp ngô nở đều phủ ngập phô mai cheddar thơm lừng', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400', N'Đang bán'),
(2, N'Bắp rang bơ Caramel vừa', N'Bắp rang', 40000, N'Vị ngọt ngào của sốt caramel truyền thống', 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400', N'Đang bán'),
(3, N'Coca-Cola tươi lớn', N'Nước ngọt', 30000, N'Ly nước ngọt có gas mát lạnh sảng khoái', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400', N'Đang bán'),
(4, N'Nước suối Dasani 500ml', N'Nước ngọt', 20000, N'Nước khoáng tinh khiết đóng chai', 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400', N'Đang bán'),
(5, N'Combo Couple (1 Bắp lớn + 2 Nước)', N'Combo', 95000, N'Gói tiết kiệm trọn vẹn trải nghiệm xem phim cho cặp đôi', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400', N'Đang bán');
SET IDENTITY_INSERT dbo.SANPHAM OFF;

END;
GO
