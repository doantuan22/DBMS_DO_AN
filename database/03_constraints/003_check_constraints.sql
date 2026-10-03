ALTER TABLE dbo.[BANGGIA] WITH CHECK ADD CONSTRAINT [CK_BANGGIA_DinhDang] CHECK ([DinhDang]=N'Tất cả' OR [DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D');
GO
ALTER TABLE dbo.[BANGGIA] WITH CHECK ADD CONSTRAINT [CK_BANGGIA_LoaiGhe] CHECK ([LoaiGhe]=N'Tất cả' OR [LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường');
GO
ALTER TABLE dbo.[BANGGIA] WITH CHECK ADD CONSTRAINT [CK_BANGGIA_LoaiNgay] CHECK ([LoaiNgay]=N'Tất cả' OR [LoaiNgay]=N'Ngày lễ' OR [LoaiNgay]=N'Cuối tuần' OR [LoaiNgay]=N'Ngày thường');
GO
ALTER TABLE dbo.[BANGGIA] WITH CHECK ADD CONSTRAINT [CK_BANGGIA_PhuThu] CHECK ([PhuThu]>=(0));
GO
ALTER TABLE dbo.[BANGGIA] WITH CHECK ADD CONSTRAINT [CK_BANGGIA_ThoiGian] CHECK ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau]);
GO
ALTER TABLE dbo.[BANGGIA] WITH CHECK ADD CONSTRAINT [CK_BANGGIA_TrangThai] CHECK ([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Áp dụng');
GO
ALTER TABLE dbo.[CHITIETDOAN] WITH CHECK ADD CONSTRAINT [CK_CHITIETDOAN_DonGia] CHECK ([DonGia]>=(0));
GO
ALTER TABLE dbo.[CHITIETDOAN] WITH CHECK ADD CONSTRAINT [CK_CHITIETDOAN_SoLuong] CHECK ([SoLuong]>(0));
GO
ALTER TABLE dbo.[CHITIETVE] WITH CHECK ADD CONSTRAINT [CK_CHITIETVE_GiaVe] CHECK ([GiaVe]>=(0));
GO
ALTER TABLE dbo.[CHITIETVE] WITH CHECK ADD CONSTRAINT [CK_CHITIETVE_TrangThai] CHECK ([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã sử dụng' OR [TrangThai]=N'Đã đặt');
GO
ALTER TABLE dbo.[DANHGIAPHIM] WITH CHECK ADD CONSTRAINT [CK_DANHGIAPHIM_SoSao] CHECK ([SoSao]>=(1) AND [SoSao]<=(5));
GO
ALTER TABLE dbo.[DONDATVE] WITH CHECK ADD CONSTRAINT [CK_DONDATVE_HanGiuCho] CHECK ([TrangThai]<>N'Chờ thanh toán' OR [HanGiuCho] IS NOT NULL);
GO
ALTER TABLE dbo.[DONDATVE] WITH CHECK ADD CONSTRAINT [CK_DONDATVE_TienGiamGia] CHECK ([TienGiamGia]>=(0));
GO
ALTER TABLE dbo.[DONDATVE] WITH CHECK ADD CONSTRAINT [CK_DONDATVE_TongTienDoAn] CHECK ([TongTienDoAn]>=(0));
GO
ALTER TABLE dbo.[DONDATVE] WITH CHECK ADD CONSTRAINT [CK_DONDATVE_TongTienVe] CHECK ([TongTienVe]>=(0));
GO
ALTER TABLE dbo.[DONDATVE] WITH CHECK ADD CONSTRAINT [CK_DONDATVE_TrangThai] CHECK ([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoàn tiền' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã thanh toán' OR [TrangThai]=N'Chờ thanh toán');
GO
ALTER TABLE dbo.[GHE] WITH CHECK ADD CONSTRAINT [CK_GHE_LoaiGhe] CHECK ([LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường');
GO
ALTER TABLE dbo.[GHE] WITH CHECK ADD CONSTRAINT [CK_GHE_SoGhe] CHECK ([SoGhe]>(0));
GO
ALTER TABLE dbo.[GHE] WITH CHECK ADD CONSTRAINT [CK_GHE_TrangThai] CHECK ([TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hỏng' OR [TrangThai]=N'Hoạt động');
GO
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM] WITH CHECK ADD CONSTRAINT [CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi] CHECK ([ThuTuHienThi]>=(0));
GO
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM] WITH CHECK ADD CONSTRAINT [CK_HINHANH_RAPCHIEUPHIM_TrangThai] CHECK ([TrangThai]=N'Tạm ẩn' OR [TrangThai]=N'Hoạt động');
GO
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM] WITH CHECK ADD CONSTRAINT [CK_HINHANH_RAPCHIEUPHIM_URL] CHECK (len(ltrim(rtrim([URL])))>(0));
GO
ALTER TABLE dbo.[HOSOKHACHHANG] WITH CHECK ADD CONSTRAINT [CK_HOSOKHACHHANG_DiemTichLuy] CHECK ([DiemTichLuy]>=(0));
GO
ALTER TABLE dbo.[HOSOKHACHHANG] WITH CHECK ADD CONSTRAINT [CK_HOSOKHACHHANG_GioiTinh] CHECK ([GioiTinh] IS NULL OR ([GioiTinh]=N'Khác' OR [GioiTinh]=N'Nữ' OR [GioiTinh]=N'Nam'));
GO
ALTER TABLE dbo.[KHIEUNAI] WITH CHECK ADD CONSTRAINT [CK_KHIEUNAI_MucDoUuTien] CHECK ([MucDoUuTien]=N'Khẩn cấp' OR [MucDoUuTien]=N'Cao' OR [MucDoUuTien]=N'Trung bình' OR [MucDoUuTien]=N'Thấp');
GO
ALTER TABLE dbo.[KHIEUNAI] WITH CHECK ADD CONSTRAINT [CK_KHIEUNAI_TrangThai] CHECK ([TrangThai]=N'Từ chối' OR [TrangThai]=N'Đã đóng' OR [TrangThai]=N'Đã giải quyết' OR [TrangThai]=N'Đang xử lý' OR [TrangThai]=N'Mới');
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_DonHangToiThieu] CHECK ([DonHangToiThieu]>=(0));
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_GiamToiDa] CHECK ([GiamToiDa] IS NULL OR [GiamToiDa]>=(0));
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_GiaTriGiam] CHECK ([GiaTriGiam]>(0));
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_LoaiGiamGia] CHECK ([LoaiGiamGia]=N'FIXED' OR [LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Số tiền' OR [LoaiGiamGia]=N'Phần trăm');
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_PhanTram99] CHECK (NOT ([LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Phần trăm') OR [GiaTriGiam]<=(99));
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_SoLuong] CHECK ([SoLuong]>=(0) AND [SoLuongDaDung]>=(0) AND [SoLuongDaDung]<=[SoLuong]);
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_ThoiGian] CHECK ([NgayKetThuc]>=[NgayBatDau]);
GO
ALTER TABLE dbo.[KHUYENMAI] WITH CHECK ADD CONSTRAINT [CK_KHUYENMAI_TrangThai] CHECK ([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoạt động');
GO
ALTER TABLE dbo.[NGUOIDUNG] WITH CHECK ADD CONSTRAINT [CK_NGUOIDUNG_TrangThai] CHECK ([TrangThai]=N'Chưa kích hoạt' OR [TrangThai]=N'Bị khóa' OR [TrangThai]=N'Hoạt động');
GO
ALTER TABLE dbo.[PHANCONG_RAP] WITH CHECK ADD CONSTRAINT [CK_PHANCONG_RAP_ThoiGian] CHECK ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau]);
GO
ALTER TABLE dbo.[PHANCONG_RAP] WITH CHECK ADD CONSTRAINT [CK_PHANCONG_RAP_TrangThai] CHECK ([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hiệu lực');
GO
ALTER TABLE dbo.[PHIM] WITH CHECK ADD CONSTRAINT [CK_PHIM_DoTuoi] CHECK ([DoTuoi] IS NULL OR ([DoTuoi]=N'C' OR [DoTuoi]=N'T18' OR [DoTuoi]=N'T16' OR [DoTuoi]=N'T13' OR [DoTuoi]=N'K' OR [DoTuoi]=N'P'));
GO
ALTER TABLE dbo.[PHIM] WITH CHECK ADD CONSTRAINT [CK_PHIM_ThoiGian] CHECK ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayKhoiChieu]);
GO
ALTER TABLE dbo.[PHIM] WITH CHECK ADD CONSTRAINT [CK_PHIM_ThoiLuong] CHECK ([ThoiLuong]>(0));
GO
ALTER TABLE dbo.[PHIM] WITH CHECK ADD CONSTRAINT [CK_PHIM_TrangThai] CHECK ([TrangThai]=N'Ngừng chiếu' OR [TrangThai]=N'Đang chiếu' OR [TrangThai]=N'Sắp chiếu');
GO
ALTER TABLE dbo.[PHONGCHIEU] WITH CHECK ADD CONSTRAINT [CK_PHONGCHIEU_LoaiPhong] CHECK ([LoaiPhong]=N'ScreenX' OR [LoaiPhong]=N'4DX' OR [LoaiPhong]=N'IMAX' OR [LoaiPhong]=N'3D' OR [LoaiPhong]=N'2D');
GO
ALTER TABLE dbo.[PHONGCHIEU] WITH CHECK ADD CONSTRAINT [CK_PHONGCHIEU_TrangThai] CHECK ([TrangThai]=N'Ngưng hoạt động' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động');
GO
ALTER TABLE dbo.[RAPCHIEUPHIM] WITH CHECK ADD CONSTRAINT [CK_RAPCHIEUPHIM_TrangThai] CHECK ([TrangThai]=N'Tạm đóng' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động');
GO
ALTER TABLE dbo.[SANPHAM] WITH CHECK ADD CONSTRAINT [CK_SANPHAM_Gia] CHECK ([Gia]>=(0));
GO
ALTER TABLE dbo.[SANPHAM] WITH CHECK ADD CONSTRAINT [CK_SANPHAM_LoaiSanPham] CHECK ([LoaiSanPham]=N'Khác' OR [LoaiSanPham]=N'Snack' OR [LoaiSanPham]=N'Combo' OR [LoaiSanPham]=N'Nước ngọt' OR [LoaiSanPham]=N'Bắp rang');
GO
ALTER TABLE dbo.[SANPHAM] WITH CHECK ADD CONSTRAINT [CK_SANPHAM_TrangThai] CHECK ([TrangThai]=N'Ngừng bán' OR [TrangThai]=N'Hết hàng' OR [TrangThai]=N'Đang bán');
GO
ALTER TABLE dbo.[SUATCHIEU] WITH CHECK ADD CONSTRAINT [CK_SUATCHIEU_DinhDang] CHECK ([DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D');
GO
ALTER TABLE dbo.[SUATCHIEU] WITH CHECK ADD CONSTRAINT [CK_SUATCHIEU_GiaVeCoBan] CHECK ([GiaVeCoBan]>=(0));
GO
ALTER TABLE dbo.[SUATCHIEU] WITH CHECK ADD CONSTRAINT [CK_SUATCHIEU_ThoiGian] CHECK ([ThoiGianKetThuc]>[ThoiGianBatDau]);
GO
ALTER TABLE dbo.[SUATCHIEU] WITH CHECK ADD CONSTRAINT [CK_SUATCHIEU_TrangThai] CHECK ([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đóng bán' OR [TrangThai]=N'Mở bán');
GO
ALTER TABLE dbo.[THANHTOAN] WITH CHECK ADD CONSTRAINT [CK_THANHTOAN_PhuongThuc] CHECK ([PhuongThuc]=N'TIEN_MAT' OR [PhuongThuc]=N'THE_QUOC_TE' OR [PhuongThuc]=N'THE_NOI_DIA' OR [PhuongThuc]=N'ZALOPAY' OR [PhuongThuc]=N'MOMO' OR [PhuongThuc]=N'VNPAY');
GO
ALTER TABLE dbo.[THANHTOAN] WITH CHECK ADD CONSTRAINT [CK_THANHTOAN_SoTien] CHECK ([SoTien]>=(0));
GO
ALTER TABLE dbo.[THANHTOAN] WITH CHECK ADD CONSTRAINT [CK_THANHTOAN_TrangThai] CHECK ([TrangThai]=N'Đã hoàn tiền' OR [TrangThai]=N'Thất bại' OR [TrangThai]=N'Thành công' OR [TrangThai]=N'Đang xử lý');
GO
ALTER TABLE dbo.[XULY_KHIEUNAI] WITH CHECK ADD CONSTRAINT [CK_XULY_KHIEUNAI_TrangThaiSauXuLy] CHECK ([TrangThaiSauXuLy]=N'Từ chối' OR [TrangThaiSauXuLy]=N'Đã đóng' OR [TrangThaiSauXuLy]=N'Đã giải quyết' OR [TrangThaiSauXuLy]=N'Đang xử lý');
GO
