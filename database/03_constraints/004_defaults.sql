-- Khai báo ràng buộc toàn vẹn dữ liệu.
ALTER TABLE dbo.[BANGGIA]
ADD CONSTRAINT [DF_BANGGIA_PhuThu] DEFAULT((0)) FOR [PhuThu];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[BANGGIA]
ADD CONSTRAINT [DF_BANGGIA_TrangThai] DEFAULT(N'Áp dụng') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[CHITIETVE]
ADD CONSTRAINT [DF_CHITIETVE_TrangThai] DEFAULT(N'Đã đặt') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[DONDATVE]
ADD CONSTRAINT [DF_DONDATVE_TongTienVe] DEFAULT((0)) FOR [TongTienVe];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[DONDATVE]
ADD CONSTRAINT [DF_DONDATVE_TongTienDoAn] DEFAULT((0)) FOR [TongTienDoAn];

GO

-- Điểm dùng để thanh toán (1 điểm = 1.000 VNĐ, cùng tỷ lệ với điểm bồi thường).
ALTER TABLE dbo.[DONDATVE]
ADD CONSTRAINT [DF_DONDATVE_DiemSuDung] DEFAULT((0)) FOR [DiemSuDung];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[DONDATVE]
ADD CONSTRAINT [DF_DONDATVE_TienGiamGia] DEFAULT((0)) FOR [TienGiamGia];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[DONDATVE]
ADD CONSTRAINT [DF_DONDATVE_TrangThai] DEFAULT(N'Chờ thanh toán') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[GHE]
ADD CONSTRAINT [DF_GHE_LoaiGhe] DEFAULT(N'Thường') FOR [LoaiGhe];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[GHE]
ADD CONSTRAINT [DF_GHE_TrangThai] DEFAULT(N'Hoạt động') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM]
ADD CONSTRAINT [DF_HINHANH_RAPCHIEUPHIM_LaAnhDaiDien] DEFAULT((0)) FOR [LaAnhDaiDien];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM]
ADD CONSTRAINT [DF_HINHANH_RAPCHIEUPHIM_ThuTuHienThi] DEFAULT((0)) FOR [ThuTuHienThi];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM]
ADD CONSTRAINT [DF_HINHANH_RAPCHIEUPHIM_TrangThai] DEFAULT(N'Hoạt động') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[HOSOKHACHHANG]
ADD CONSTRAINT [DF_HOSOKHACHHANG_DiemTichLuy] DEFAULT((0)) FOR [DiemTichLuy];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[KHIEUNAI]
ADD CONSTRAINT [DF_KHIEUNAI_MucDoUuTien] DEFAULT(N'Trung bình') FOR [MucDoUuTien];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[KHIEUNAI]
ADD CONSTRAINT [DF_KHIEUNAI_TrangThai] DEFAULT(N'Mới') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[KHUYENMAI]
ADD CONSTRAINT [DF_KHUYENMAI_DonHangToiThieu] DEFAULT((0)) FOR [DonHangToiThieu];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[KHUYENMAI]
ADD CONSTRAINT [DF_KHUYENMAI_SoLuongDaDung] DEFAULT((0)) FOR [SoLuongDaDung];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[KHUYENMAI]
ADD CONSTRAINT [DF_KHUYENMAI_TrangThai] DEFAULT(N'Hoạt động') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[NGUOIDUNG]
ADD CONSTRAINT [DF_NGUOIDUNG_TrangThai] DEFAULT(N'Hoạt động') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[PHANCONG_RAP]
ADD CONSTRAINT [DF_PHANCONG_RAP_TrangThai] DEFAULT(N'Hiệu lực') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[PHIM]
ADD CONSTRAINT [DF_PHIM_TrangThai] DEFAULT(N'Sắp chiếu') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[PHONGCHIEU]
ADD CONSTRAINT [DF_PHONGCHIEU_LoaiPhong] DEFAULT(N'2D') FOR [LoaiPhong];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[PHONGCHIEU]
ADD CONSTRAINT [DF_PHONGCHIEU_TrangThai] DEFAULT(N'Hoạt động') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[RAPCHIEUPHIM]
ADD CONSTRAINT [DF_RAPCHIEUPHIM_TrangThai] DEFAULT(N'Hoạt động') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[SANPHAM]
ADD CONSTRAINT [DF_SANPHAM_TrangThai] DEFAULT(N'Đang bán') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[SUATCHIEU]
ADD CONSTRAINT [DF_SUATCHIEU_DinhDang] DEFAULT(N'2D') FOR [DinhDang];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[SUATCHIEU]
ADD CONSTRAINT [DF_SUATCHIEU_TrangThai] DEFAULT(N'Mở bán') FOR [TrangThai];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[THANHTOAN]
ADD CONSTRAINT [DF_THANHTOAN_TrangThai] DEFAULT(N'Đang xử lý') FOR [TrangThai];

GO
