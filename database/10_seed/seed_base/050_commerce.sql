IF @BaseNew=1 BEGIN
INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,MoTa,HinhAnh,TrangThai) VALUES
(N'Bắp rang nhỏ',N'Bắp rang',35000,N'Ảnh minh họa; Ziongarage; CC0; http://creativecommons.org/publicdomain/zero/1.0/deed.en',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Popcorn_in_a_bowl.jpg/960px-Popcorn_in_a_bowl.jpg',N'Đang bán'),
(N'Bắp rang lớn',N'Bắp rang',50000,N'Ảnh minh họa; Ziongarage; CC0; http://creativecommons.org/publicdomain/zero/1.0/deed.en',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Popcorn_in_a_bowl.jpg/960px-Popcorn_in_a_bowl.jpg',N'Đang bán'),
(N'Nước cam nhỏ',N'Nước ngọt',30000,N'Ảnh minh họa; Agency of the United States Department of Agriculture Edited Version by: Arad; Public domain; https://creativecommons.org/publicdomain/zero/1.0/',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/960px-Orange_juice_1_edit1.jpg',N'Đang bán'),
(N'Nước cam lớn',N'Nước ngọt',45000,N'Ảnh minh họa; Agency of the United States Department of Agriculture Edited Version by: Arad; Public domain; https://creativecommons.org/publicdomain/zero/1.0/',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/960px-Orange_juice_1_edit1.jpg',N'Đang bán'),
(N'Snack bánh giòn',N'Snack',25000,N'Ảnh minh họa; Tomwsulcer; CC0; http://creativecommons.org/publicdomain/zero/1.0/deed.en',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Chips_in_a_bowl_at_a_party.JPG/960px-Chips_in_a_bowl_at_a_party.JPG',N'Đang bán'),
(N'Nước lọc',N'Khác',20000,N'Sản phẩm demo; ảnh chưa xác minh, dùng fallback.',NULL,N'Đang bán'),
(N'Combo bắp và nước cam',N'Combo',60000,N'Sản phẩm demo; ảnh chưa xác minh, dùng fallback.',NULL,N'Đang bán'),
(N'Combo đôi bắp và nước',N'Combo',110000,N'Sản phẩm demo; ảnh chưa xác minh, dùng fallback.',NULL,N'Đang bán');
INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai)
SELECT r.RapID,x.LoaiGhe,x.LoaiNgay,x.DinhDang,x.PhuThu,DATEADD(DAY,-60,@Day),DATEADD(DAY,365,@Day),N'Áp dụng' FROM dbo.RAPCHIEUPHIM r CROSS JOIN (VALUES(N'VIP',N'Tất cả',N'Tất cả',15000),(N'Sweetbox',N'Tất cả',N'Tất cả',25000),(N'Đôi',N'Tất cả',N'Tất cả',20000),(N'Tất cả',N'Cuối tuần',N'Tất cả',10000),(N'Tất cả',N'Ngày thường',N'3D',5000)) x(LoaiGhe,LoaiNgay,DinhDang,PhuThu);
INSERT dbo.KHUYENMAI(MaCode,MoTa,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,GiamToiDa,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai) VALUES
('DEMO10',N'Demo giảm 10%',N'Phần trăm',10,0,50000,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),100,0,N'Hoạt động'),
('DEMO20K',N'Demo giảm 20.000đ',N'Số tiền',20000,100000,NULL,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),100,0,N'Hoạt động'),
('DEMOEXPIRED',N'Đã hết hạn',N'Phần trăm',10,0,50000,DATEADD(DAY,-10,@Now),DATEADD(DAY,-1,@Now),100,0,N'Hết hạn'),
('DEMOEMPTY',N'Quota hết',N'Phần trăm',10,0,50000,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),0,0,N'Hoạt động'),
('DEMOMIN',N'Chưa đạt tối thiểu',N'Số tiền',30000,500000,NULL,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),100,0,N'Hoạt động');
END;
