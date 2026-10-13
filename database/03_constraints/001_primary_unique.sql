-- Khai báo ràng buộc toàn vẹn dữ liệu.
ALTER TABLE dbo.[BANGGIA]
ADD CONSTRAINT [PK_BANGGIA] PRIMARY KEY CLUSTERED ([GiaID] ASC);

GO

-- Định danh duy nhất từng bản ghi đồ ăn trong đơn.
ALTER TABLE dbo.[CHITIETDOAN]
ADD CONSTRAINT [PK_CHITIETDOAN] PRIMARY KEY CLUSTERED ([ChiTietDoAnID] ASC);

GO

-- Định danh duy nhất từng bản ghi vé theo ghế.
ALTER TABLE dbo.[CHITIETVE]
ADD CONSTRAINT [PK_CHITIETVE] PRIMARY KEY CLUSTERED ([VeID] ASC);

GO

-- Định danh duy nhất từng bản ghi đánh giá phim.
ALTER TABLE dbo.[DANHGIAPHIM]
ADD CONSTRAINT [PK_DANHGIAPHIM] PRIMARY KEY CLUSTERED ([DanhGiaID] ASC);

GO

-- Định danh duy nhất từng bản ghi diễn viên.
ALTER TABLE dbo.[DIENVIEN]
ADD CONSTRAINT [PK_DIENVIEN] PRIMARY KEY CLUSTERED ([DienVienID] ASC);

GO

-- Định danh duy nhất từng bản ghi đơn đặt vé.
ALTER TABLE dbo.[DONDATVE]
ADD CONSTRAINT [PK_DONDATVE] PRIMARY KEY CLUSTERED ([DonDatVeID] ASC);

GO

-- Định danh duy nhất từng bản ghi ghế.
ALTER TABLE dbo.[GHE]
ADD CONSTRAINT [PK_GHE] PRIMARY KEY CLUSTERED ([GheID] ASC);

GO

-- Định danh duy nhất từng bản ghi ảnh rạp.
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM]
ADD CONSTRAINT [PK_HINHANH_RAPCHIEUPHIM] PRIMARY KEY CLUSTERED ([HinhAnhRapID] ASC);

GO

-- Định danh duy nhất từng bản ghi hồ sơ khách hàng.
ALTER TABLE dbo.[HOSOKHACHHANG]
ADD CONSTRAINT [PK_HOSOKHACHHANG] PRIMARY KEY CLUSTERED ([NguoiDungID] ASC);

GO

-- Định danh duy nhất từng bản ghi khiếu nại.
ALTER TABLE dbo.[KHIEUNAI]
ADD CONSTRAINT [PK_KHIEUNAI] PRIMARY KEY CLUSTERED ([KhieuNaiID] ASC);

GO

-- Định danh duy nhất từng bản ghi khuyến mãi.
ALTER TABLE dbo.[KHUYENMAI]
ADD CONSTRAINT [PK_KHUYENMAI] PRIMARY KEY CLUSTERED ([KhuyenMaiID] ASC);

GO

-- Định danh duy nhất từng bản ghi tài khoản người dùng.
ALTER TABLE dbo.[NGUOIDUNG]
ADD CONSTRAINT [PK_NGUOIDUNG] PRIMARY KEY CLUSTERED ([NguoiDungID] ASC);

GO

-- Định danh duy nhất từng bản ghi phân công quản lý rạp.
ALTER TABLE dbo.[PHANCONG_RAP]
ADD CONSTRAINT [PK_PHANCONG_RAP] PRIMARY KEY CLUSTERED ([PhanCongID] ASC);

GO

-- Định danh duy nhất từng bản ghi phim.
ALTER TABLE dbo.[PHIM]
ADD CONSTRAINT [PK_PHIM] PRIMARY KEY CLUSTERED ([PhimID] ASC);

GO

-- Định danh duy nhất từng bản ghi diễn viên của phim.
ALTER TABLE dbo.[PHIM_DIENVIEN]
ADD CONSTRAINT [PK_PHIM_DIENVIEN] PRIMARY KEY CLUSTERED ([PhimID] ASC, [DienVienID] ASC);

GO

-- Định danh duy nhất từng bản ghi thể loại của phim.
ALTER TABLE dbo.[PHIM_THELOAI]
ADD CONSTRAINT [PK_PHIM_THELOAI] PRIMARY KEY CLUSTERED ([PhimID] ASC, [TheLoaiID] ASC);

GO

-- Định danh duy nhất từng bản ghi phòng chiếu.
ALTER TABLE dbo.[PHONGCHIEU]
ADD CONSTRAINT [PK_PHONGCHIEU] PRIMARY KEY CLUSTERED ([PhongID] ASC);

GO

-- Định danh duy nhất từng bản ghi quyền chức năng.
ALTER TABLE dbo.[QUYEN]
ADD CONSTRAINT [PK_QUYEN] PRIMARY KEY CLUSTERED ([QuyenID] ASC);

GO

-- Định danh duy nhất từng bản ghi rạp chiếu phim.
ALTER TABLE dbo.[RAPCHIEUPHIM]
ADD CONSTRAINT [PK_RAPCHIEUPHIM] PRIMARY KEY CLUSTERED ([RapID] ASC);

GO

-- Định danh duy nhất từng bản ghi sản phẩm.
ALTER TABLE dbo.[SANPHAM]
ADD CONSTRAINT [PK_SANPHAM] PRIMARY KEY CLUSTERED ([SanPhamID] ASC);

GO

-- Định danh duy nhất từng bản ghi suất chiếu.
ALTER TABLE dbo.[SUATCHIEU]
ADD CONSTRAINT [PK_SUATCHIEU] PRIMARY KEY CLUSTERED ([SuatChieuID] ASC);

GO

-- Định danh duy nhất từng bản ghi lần thử thanh toán.
ALTER TABLE dbo.[THANHTOAN]
ADD CONSTRAINT [PK_THANHTOAN] PRIMARY KEY CLUSTERED ([ThanhToanID] ASC);

GO

-- Định danh duy nhất từng bản ghi thể loại.
ALTER TABLE dbo.[THELOAI]
ADD CONSTRAINT [PK_THELOAI] PRIMARY KEY CLUSTERED ([TheLoaiID] ASC);

GO

-- Định danh duy nhất từng bản ghi vai trò.
ALTER TABLE dbo.[VAITRO]
ADD CONSTRAINT [PK_VAITRO] PRIMARY KEY CLUSTERED ([VaiTroID] ASC);

GO

-- Định danh duy nhất từng bản ghi quyền theo vai trò.
ALTER TABLE dbo.[VAITRO_QUYEN]
ADD CONSTRAINT [PK_VAITRO_QUYEN] PRIMARY KEY CLUSTERED ([VaiTroID] ASC, [QuyenID] ASC);

GO

-- Định danh duy nhất từng bản ghi lịch sử xử lý khiếu nại.
ALTER TABLE dbo.[XULY_KHIEUNAI]
ADD CONSTRAINT [PK_XULY_KHIEUNAI] PRIMARY KEY CLUSTERED ([XuLyID] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của đồ ăn trong đơn.
ALTER TABLE dbo.[CHITIETDOAN]
ADD CONSTRAINT [UQ_CHITIETDOAN_Don_SanPham] UNIQUE NONCLUSTERED ([DonDatVeID] ASC, [SanPhamID] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của vé theo ghế.
ALTER TABLE dbo.[CHITIETVE]
ADD CONSTRAINT [UQ_CHITIETVE_MaVe] UNIQUE NONCLUSTERED ([MaVe] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của đánh giá phim.
ALTER TABLE dbo.[DANHGIAPHIM]
ADD CONSTRAINT [UQ_DANHGIAPHIM_Phim_User] UNIQUE NONCLUSTERED ([PhimID] ASC, [NguoiDungID] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của ghế.
ALTER TABLE dbo.[GHE]
ADD CONSTRAINT [UQ_GHE_ViTri] UNIQUE NONCLUSTERED ([PhongID] ASC, [HangGhe] ASC, [SoGhe] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của khuyến mãi.
ALTER TABLE dbo.[KHUYENMAI]
ADD CONSTRAINT [UQ_KHUYENMAI_MaCode] UNIQUE NONCLUSTERED ([MaCode] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của tài khoản người dùng.
ALTER TABLE dbo.[NGUOIDUNG]
ADD CONSTRAINT [UQ_NGUOIDUNG_Email] UNIQUE NONCLUSTERED ([Email] ASC);

GO

-- Tên phòng không được trùng trong cùng một rạp.
ALTER TABLE dbo.[PHONGCHIEU]
ADD CONSTRAINT [UQ_PHONGCHIEU_TenPhong] UNIQUE NONCLUSTERED ([RapID] ASC, [TenPhong] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của quyền chức năng.
ALTER TABLE dbo.[QUYEN]
ADD CONSTRAINT [UQ_QUYEN_MaQuyen] UNIQUE NONCLUSTERED ([MaQuyen] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của thể loại.
ALTER TABLE dbo.[THELOAI]
ADD CONSTRAINT [UQ_THELOAI_TenTheLoai] UNIQUE NONCLUSTERED ([TenTheLoai] ASC);

GO

-- Ngăn dữ liệu trùng theo khóa duy nhất của vai trò.
ALTER TABLE dbo.[VAITRO]
ADD CONSTRAINT [UQ_VAITRO_MaVaiTro] UNIQUE NONCLUSTERED ([MaVaiTro] ASC);

GO
