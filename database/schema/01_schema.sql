-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- SCRIPT 01: TẠO DATABASE VÀ 25 BẢNG (SCHEMA, CONSTRAINTS, INDEXES)
-- ============================================================================

USE master
GO

-- 1. Tạo Database nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CinemaBookingDB')
BEGIN
    EXEC('CREATE DATABASE [CinemaBookingDB] COLLATE Vietnamese_CI_AS');
    PRINT N'>>> Đã tạo Database CinemaBookingDB thành công.';
END
ELSE
BEGIN
    PRINT N'>>> Database CinemaBookingDB đã tồn tại.';
END
GO

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Bật READ_COMMITTED_SNAPSHOT để giảm lock contention cho các truy vấn đọc
ALTER DATABASE CinemaBookingDB SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO


-- ============================================================================
-- XÓA BẢNG CŨ (NẾU CÓ) THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI
-- ============================================================================
IF OBJECT_ID(N'dbo.XULY_KHIEUNAI', N'U') IS NOT NULL DROP TABLE dbo.XULY_KHIEUNAI;
IF OBJECT_ID(N'dbo.KHIEUNAI', N'U') IS NOT NULL DROP TABLE dbo.KHIEUNAI;
IF OBJECT_ID(N'dbo.DANHGIAPHIM', N'U') IS NOT NULL DROP TABLE dbo.DANHGIAPHIM;
IF OBJECT_ID(N'dbo.THANHTOAN', N'U') IS NOT NULL DROP TABLE dbo.THANHTOAN;
IF OBJECT_ID(N'dbo.CHITIETDOAN', N'U') IS NOT NULL DROP TABLE dbo.CHITIETDOAN;
IF OBJECT_ID(N'dbo.SANPHAM', N'U') IS NOT NULL DROP TABLE dbo.SANPHAM;
IF OBJECT_ID(N'dbo.CHITIETVE', N'U') IS NOT NULL DROP TABLE dbo.CHITIETVE;
IF OBJECT_ID(N'dbo.DONDATVE', N'U') IS NOT NULL DROP TABLE dbo.DONDATVE;
IF OBJECT_ID(N'dbo.KHUYENMAI', N'U') IS NOT NULL DROP TABLE dbo.KHUYENMAI;
IF OBJECT_ID(N'dbo.BANGGIA', N'U') IS NOT NULL DROP TABLE dbo.BANGGIA;
IF OBJECT_ID(N'dbo.SUATCHIEU', N'U') IS NOT NULL DROP TABLE dbo.SUATCHIEU;
IF OBJECT_ID(N'dbo.PHIM_DIENVIEN', N'U') IS NOT NULL DROP TABLE dbo.PHIM_DIENVIEN;
IF OBJECT_ID(N'dbo.DIENVIEN', N'U') IS NOT NULL DROP TABLE dbo.DIENVIEN;
IF OBJECT_ID(N'dbo.PHIM_THELOAI', N'U') IS NOT NULL DROP TABLE dbo.PHIM_THELOAI;
IF OBJECT_ID(N'dbo.THELOAI', N'U') IS NOT NULL DROP TABLE dbo.THELOAI;
IF OBJECT_ID(N'dbo.PHIM', N'U') IS NOT NULL DROP TABLE dbo.PHIM;
IF OBJECT_ID(N'dbo.GHE', N'U') IS NOT NULL DROP TABLE dbo.GHE;
IF OBJECT_ID(N'dbo.PHONGCHIEU', N'U') IS NOT NULL DROP TABLE dbo.PHONGCHIEU;
IF OBJECT_ID(N'dbo.PHANCONG_RAP', N'U') IS NOT NULL DROP TABLE dbo.PHANCONG_RAP;
IF OBJECT_ID(N'dbo.RAPCHIEUPHIM', N'U') IS NOT NULL DROP TABLE dbo.RAPCHIEUPHIM;
IF OBJECT_ID(N'dbo.HOSOKHACHHANG', N'U') IS NOT NULL DROP TABLE dbo.HOSOKHACHHANG;
IF OBJECT_ID(N'dbo.NGUOIDUNG', N'U') IS NOT NULL DROP TABLE dbo.NGUOIDUNG;
IF OBJECT_ID(N'dbo.VAITRO_QUYEN', N'U') IS NOT NULL DROP TABLE dbo.VAITRO_QUYEN;
IF OBJECT_ID(N'dbo.QUYEN', N'U') IS NOT NULL DROP TABLE dbo.QUYEN;
IF OBJECT_ID(N'dbo.VAITRO', N'U') IS NOT NULL DROP TABLE dbo.VAITRO;
GO

-- ============================================================================
-- NHÓM 1: TÀI KHOẢN - PHÂN QUYỀN (RBAC) & CẤU HÌNH HỆ THỐNG
-- ============================================================================

-- Bảng 1: VAITRO
CREATE TABLE dbo.VAITRO (
    VaiTroID INT IDENTITY(1,1) NOT NULL,
    MaVaiTro VARCHAR(50) NOT NULL,
    TenVaiTro NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(255) NULL,
    CONSTRAINT PK_VAITRO PRIMARY KEY CLUSTERED (VaiTroID),
    CONSTRAINT UQ_VAITRO_MaVaiTro UNIQUE (MaVaiTro)
);
GO

-- Bảng 2: QUYEN
CREATE TABLE dbo.QUYEN (
    QuyenID INT IDENTITY(1,1) NOT NULL,
    MaQuyen VARCHAR(50) NOT NULL,
    TenQuyen NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(255) NULL,
    CONSTRAINT PK_QUYEN PRIMARY KEY CLUSTERED (QuyenID),
    CONSTRAINT UQ_QUYEN_MaQuyen UNIQUE (MaQuyen)
);
GO

-- Bảng 3: VAITRO_QUYEN (Quan hệ nhiều - nhiều giữa Vai trò và Quyền)
CREATE TABLE dbo.VAITRO_QUYEN (
    VaiTroID INT NOT NULL,
    QuyenID INT NOT NULL,
    NgayGan DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_VAITRO_QUYEN PRIMARY KEY CLUSTERED (VaiTroID, QuyenID),
    CONSTRAINT FK_VAITRO_QUYEN_VaiTro FOREIGN KEY (VaiTroID)
        REFERENCES dbo.VAITRO(VaiTroID) ON DELETE CASCADE,
    CONSTRAINT FK_VAITRO_QUYEN_Quyen FOREIGN KEY (QuyenID)
        REFERENCES dbo.QUYEN(QuyenID) ON DELETE CASCADE
);
GO

-- Bảng 4: NGUOIDUNG (Thực thể tài khoản trung tâm)
CREATE TABLE dbo.NGUOIDUNG (
    NguoiDungID INT IDENTITY(1,1) NOT NULL,
    VaiTroID INT NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    SoDienThoai VARCHAR(20) NULL,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Hoạt động',
    CONSTRAINT PK_NGUOIDUNG PRIMARY KEY CLUSTERED (NguoiDungID),
    CONSTRAINT UQ_NGUOIDUNG_Email UNIQUE (Email),
    CONSTRAINT FK_NGUOIDUNG_VaiTro FOREIGN KEY (VaiTroID)
        REFERENCES dbo.VAITRO(VaiTroID),
    CONSTRAINT CK_NGUOIDUNG_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Bị khóa', N'Chưa kích hoạt'))
);
GO

-- Bảng 5: HOSOKHACHHANG (Quan hệ 1 - 0..1 mở rộng từ NGUOIDUNG)
CREATE TABLE dbo.HOSOKHACHHANG (
    NguoiDungID INT NOT NULL,
    NgaySinh DATE NULL,
    GioiTinh NVARCHAR(10) NULL,
    DiemTichLuy INT NOT NULL DEFAULT 0,
    CONSTRAINT PK_HOSOKHACHHANG PRIMARY KEY CLUSTERED (NguoiDungID),
    CONSTRAINT FK_HOSOKHACHHANG_NguoiDung FOREIGN KEY (NguoiDungID)
        REFERENCES dbo.NGUOIDUNG(NguoiDungID) ON DELETE CASCADE,
    CONSTRAINT CK_HOSOKHACHHANG_GioiTinh CHECK (GioiTinh IS NULL OR GioiTinh IN (N'Nam', N'Nữ', N'Khác')),
    CONSTRAINT CK_HOSOKHACHHANG_DiemTichLuy CHECK (DiemTichLuy >= 0)
);
GO

-- Bảng 6: RAPCHIEUPHIM (Cơ sở rạp chiếu)
CREATE TABLE dbo.RAPCHIEUPHIM (
    RapID INT IDENTITY(1,1) NOT NULL,
    TenRap NVARCHAR(150) NOT NULL,
    DiaChi NVARCHAR(255) NOT NULL,
    ThanhPho NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(20) NULL,
    MoTa NVARCHAR(500) NULL,
    NgayHoatDong DATE NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Hoạt động',
    CONSTRAINT PK_RAPCHIEUPHIM PRIMARY KEY CLUSTERED (RapID),
    CONSTRAINT CK_RAPCHIEUPHIM_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Bảo trì', N'Tạm đóng'))
);
GO

-- Bảng 7: PHANCONG_RAP (Quản lý phạm vi rạp được phân công cho Quản lý rạp)
CREATE TABLE dbo.PHANCONG_RAP (
    PhanCongID INT IDENTITY(1,1) NOT NULL,
    NguoiDungID INT NOT NULL,
    RapID INT NOT NULL,
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Hiệu lực',
    CONSTRAINT PK_PHANCONG_RAP PRIMARY KEY CLUSTERED (PhanCongID),
    CONSTRAINT FK_PHANCONG_RAP_NguoiDung FOREIGN KEY (NguoiDungID)
        REFERENCES dbo.NGUOIDUNG(NguoiDungID),
    CONSTRAINT FK_PHANCONG_RAP_Rap FOREIGN KEY (RapID)
        REFERENCES dbo.RAPCHIEUPHIM(RapID),
    CONSTRAINT CK_PHANCONG_RAP_ThoiGian CHECK (NgayKetThuc IS NULL OR NgayKetThuc >= NgayBatDau),
    CONSTRAINT CK_PHANCONG_RAP_TrangThai CHECK (TrangThai IN (N'Hiệu lực', N'Hết hạn', N'Đã hủy'))
);
GO

-- ============================================================================
-- NHÓM 2: RẠP - PHÒNG - GHẾ
-- ============================================================================

-- Bảng 8: PHONGCHIEU
CREATE TABLE dbo.PHONGCHIEU (
    PhongID INT IDENTITY(1,1) NOT NULL,
    RapID INT NOT NULL,
    TenPhong NVARCHAR(100) NOT NULL,
    LoaiPhong NVARCHAR(50) NOT NULL DEFAULT N'2D',
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Hoạt động',
    CONSTRAINT PK_PHONGCHIEU PRIMARY KEY CLUSTERED (PhongID),
    CONSTRAINT FK_PHONGCHIEU_Rap FOREIGN KEY (RapID)
        REFERENCES dbo.RAPCHIEUPHIM(RapID),
    CONSTRAINT UQ_PHONGCHIEU_TenPhong UNIQUE (RapID, TenPhong),
    CONSTRAINT CK_PHONGCHIEU_LoaiPhong CHECK (LoaiPhong IN (N'2D', N'3D', N'IMAX', N'4DX', N'ScreenX')),
    CONSTRAINT CK_PHONGCHIEU_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Bảo trì', N'Ngưng hoạt động'))
);
GO

-- Bảng 9: GHE (Mỗi ghế thuộc một phòng chiếu)
CREATE TABLE dbo.GHE (
    GheID INT IDENTITY(1,1) NOT NULL,
    PhongID INT NOT NULL,
    HangGhe VARCHAR(10) NOT NULL,
    SoGhe INT NOT NULL,
    LoaiGhe NVARCHAR(50) NOT NULL DEFAULT N'Thường',
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Hoạt động',
    CONSTRAINT PK_GHE PRIMARY KEY CLUSTERED (GheID),
    CONSTRAINT FK_GHE_Phong FOREIGN KEY (PhongID)
        REFERENCES dbo.PHONGCHIEU(PhongID),
    CONSTRAINT UQ_GHE_ViTri UNIQUE (PhongID, HangGhe, SoGhe),
    CONSTRAINT CK_GHE_SoGhe CHECK (SoGhe > 0),
    CONSTRAINT CK_GHE_LoaiGhe CHECK (LoaiGhe IN (N'Thường', N'VIP', N'Sweetbox', N'Đôi')),
    CONSTRAINT CK_GHE_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Hỏng', N'Bảo trì'))
);
GO

-- ============================================================================
-- NHÓM 3: PHIM - THỂ LOẠI - DIỄN VIÊN
-- ============================================================================

-- Bảng 10: PHIM
CREATE TABLE dbo.PHIM (
    PhimID INT IDENTITY(1,1) NOT NULL,
    TenPhim NVARCHAR(255) NOT NULL,
    ThoiLuong INT NOT NULL,
    NgayKhoiChieu DATE NOT NULL,
    NgayKetThuc DATE NULL,
    NgonNgu NVARCHAR(100) NULL,
    PhuDe NVARCHAR(100) NULL,
    DoTuoi NVARCHAR(20) NULL,
    DaoDien NVARCHAR(150) NULL,
    MoTa NVARCHAR(MAX) NULL,
    PosterURL NVARCHAR(500) NULL,
    TrailerURL NVARCHAR(500) NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Sắp chiếu',
    CONSTRAINT PK_PHIM PRIMARY KEY CLUSTERED (PhimID),
    CONSTRAINT CK_PHIM_ThoiLuong CHECK (ThoiLuong > 0),
    CONSTRAINT CK_PHIM_ThoiGian CHECK (NgayKetThuc IS NULL OR NgayKetThuc >= NgayKhoiChieu),
    CONSTRAINT CK_PHIM_DoTuoi CHECK (DoTuoi IS NULL OR DoTuoi IN (N'P', N'K', N'T13', N'T16', N'T18', N'C')),
    CONSTRAINT CK_PHIM_TrangThai CHECK (TrangThai IN (N'Sắp chiếu', N'Đang chiếu', N'Ngừng chiếu'))
);
GO

-- Bảng 11: THELOAI
CREATE TABLE dbo.THELOAI (
    TheLoaiID INT IDENTITY(1,1) NOT NULL,
    TenTheLoai NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_THELOAI PRIMARY KEY CLUSTERED (TheLoaiID),
    CONSTRAINT UQ_THELOAI_TenTheLoai UNIQUE (TenTheLoai)
);
GO

-- Bảng 12: PHIM_THELOAI (Quan hệ nhiều - nhiều)
CREATE TABLE dbo.PHIM_THELOAI (
    PhimID INT NOT NULL,
    TheLoaiID INT NOT NULL,
    CONSTRAINT PK_PHIM_THELOAI PRIMARY KEY CLUSTERED (PhimID, TheLoaiID),
    CONSTRAINT FK_PHIM_THELOAI_Phim FOREIGN KEY (PhimID)
        REFERENCES dbo.PHIM(PhimID) ON DELETE CASCADE,
    CONSTRAINT FK_PHIM_THELOAI_TheLoai FOREIGN KEY (TheLoaiID)
        REFERENCES dbo.THELOAI(TheLoaiID) ON DELETE CASCADE
);
GO

-- Bảng 13: DIENVIEN
CREATE TABLE dbo.DIENVIEN (
    DienVienID INT IDENTITY(1,1) NOT NULL,
    HoTen NVARCHAR(150) NOT NULL,
    NgaySinh DATE NULL,
    QuocTich NVARCHAR(100) NULL,
    CONSTRAINT PK_DIENVIEN PRIMARY KEY CLUSTERED (DienVienID)
);
GO

-- Bảng 14: PHIM_DIENVIEN (Quan hệ nhiều - nhiều có thuộc tính VaiDien)
CREATE TABLE dbo.PHIM_DIENVIEN (
    PhimID INT NOT NULL,
    DienVienID INT NOT NULL,
    VaiDien NVARCHAR(150) NULL,
    CONSTRAINT PK_PHIM_DIENVIEN PRIMARY KEY CLUSTERED (PhimID, DienVienID),
    CONSTRAINT FK_PHIM_DIENVIEN_Phim FOREIGN KEY (PhimID)
        REFERENCES dbo.PHIM(PhimID) ON DELETE CASCADE,
    CONSTRAINT FK_PHIM_DIENVIEN_DienVien FOREIGN KEY (DienVienID)
        REFERENCES dbo.DIENVIEN(DienVienID) ON DELETE CASCADE
);
GO

-- ============================================================================
-- NHÓM 4: SUẤT CHIẾU & BẢNG GIÁ
-- ============================================================================

-- Bảng 15: SUATCHIEU
CREATE TABLE dbo.SUATCHIEU (
    SuatChieuID INT IDENTITY(1,1) NOT NULL,
    PhimID INT NOT NULL,
    PhongID INT NOT NULL,
    ThoiGianBatDau DATETIME2 NOT NULL,
    ThoiGianKetThuc DATETIME2 NOT NULL,
    DinhDang NVARCHAR(50) NOT NULL DEFAULT N'2D',
    GiaVeCoBan DECIMAL(18,2) NOT NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Mở bán',
    CONSTRAINT PK_SUATCHIEU PRIMARY KEY CLUSTERED (SuatChieuID),
    CONSTRAINT FK_SUATCHIEU_Phim FOREIGN KEY (PhimID)
        REFERENCES dbo.PHIM(PhimID),
    CONSTRAINT FK_SUATCHIEU_Phong FOREIGN KEY (PhongID)
        REFERENCES dbo.PHONGCHIEU(PhongID),
    CONSTRAINT CK_SUATCHIEU_ThoiGian CHECK (ThoiGianKetThuc > ThoiGianBatDau),
    CONSTRAINT CK_SUATCHIEU_GiaVeCoBan CHECK (GiaVeCoBan >= 0),
    CONSTRAINT CK_SUATCHIEU_DinhDang CHECK (DinhDang IN (N'2D', N'3D', N'IMAX', N'4DX', N'ScreenX')),
    CONSTRAINT CK_SUATCHIEU_TrangThai CHECK (TrangThai IN (N'Mở bán', N'Đóng bán', N'Đã hủy', N'Hoàn thành'))
);
GO

-- Bảng 16: BANGGIA (Cấu hình phụ thu theo rạp, loại ghế, loại ngày, định dạng)
CREATE TABLE dbo.BANGGIA (
    GiaID INT IDENTITY(1,1) NOT NULL,
    RapID INT NOT NULL,
    LoaiGhe NVARCHAR(50) NOT NULL,
    LoaiNgay NVARCHAR(50) NOT NULL,
    DinhDang NVARCHAR(50) NOT NULL,
    PhuThu DECIMAL(18,2) NOT NULL DEFAULT 0,
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Áp dụng',
    CONSTRAINT PK_BANGGIA PRIMARY KEY CLUSTERED (GiaID),
    CONSTRAINT FK_BANGGIA_Rap FOREIGN KEY (RapID)
        REFERENCES dbo.RAPCHIEUPHIM(RapID),
    CONSTRAINT CK_BANGGIA_PhuThu CHECK (PhuThu >= 0),
    CONSTRAINT CK_BANGGIA_ThoiGian CHECK (NgayKetThuc IS NULL OR NgayKetThuc >= NgayBatDau),
    CONSTRAINT CK_BANGGIA_LoaiGhe CHECK (LoaiGhe IN (N'Thường', N'VIP', N'Sweetbox', N'Đôi', N'Tất cả')),
    CONSTRAINT CK_BANGGIA_LoaiNgay CHECK (LoaiNgay IN (N'Ngày thường', N'Cuối tuần', N'Ngày lễ', N'Tất cả')),
    CONSTRAINT CK_BANGGIA_DinhDang CHECK (DinhDang IN (N'2D', N'3D', N'IMAX', N'4DX', N'ScreenX', N'Tất cả')),
    CONSTRAINT CK_BANGGIA_TrangThai CHECK (TrangThai IN (N'Áp dụng', N'Hết hạn', N'Tạm dừng'))
);
GO

-- ============================================================================
-- NHÓM 5: KHUYẾN MÃI, ĐƠN ĐẶT VÉ, CHI TIẾT VÉ, SẢN PHẨM & THANH TOÁN
-- ============================================================================

-- Bảng 17: KHUYENMAI
CREATE TABLE dbo.KHUYENMAI (
    KhuyenMaiID INT IDENTITY(1,1) NOT NULL,
    MaCode VARCHAR(50) NOT NULL,
    MoTa NVARCHAR(255) NULL,
    LoaiGiamGia NVARCHAR(20) NOT NULL,
    GiaTriGiam DECIMAL(18,2) NOT NULL,
    DonHangToiThieu DECIMAL(18,2) NOT NULL DEFAULT 0,
    GiamToiDa DECIMAL(18,2) NULL,
    NgayBatDau DATETIME2 NOT NULL,
    NgayKetThuc DATETIME2 NOT NULL,
    SoLuong INT NOT NULL,
    SoLuongDaDung INT NOT NULL DEFAULT 0,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Hoạt động',
    CONSTRAINT PK_KHUYENMAI PRIMARY KEY CLUSTERED (KhuyenMaiID),
    CONSTRAINT UQ_KHUYENMAI_MaCode UNIQUE (MaCode),
    CONSTRAINT CK_KHUYENMAI_LoaiGiamGia CHECK (LoaiGiamGia IN (N'Phần trăm', N'Số tiền', N'PERCENT', N'FIXED')),
    CONSTRAINT CK_KHUYENMAI_GiaTriGiam CHECK (GiaTriGiam > 0),
    CONSTRAINT CK_KHUYENMAI_DonHangToiThieu CHECK (DonHangToiThieu >= 0),
    CONSTRAINT CK_KHUYENMAI_GiamToiDa CHECK (GiamToiDa IS NULL OR GiamToiDa >= 0),
    CONSTRAINT CK_KHUYENMAI_ThoiGian CHECK (NgayKetThuc >= NgayBatDau),
    CONSTRAINT CK_KHUYENMAI_SoLuong CHECK (SoLuong >= 0 AND SoLuongDaDung >= 0 AND SoLuongDaDung <= SoLuong),
    CONSTRAINT CK_KHUYENMAI_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Hết hạn', N'Tạm dừng'))
);
GO

-- Bảng 18: DONDATVE (Thực thể giao dịch trung tâm)
CREATE TABLE dbo.DONDATVE (
    DonDatVeID INT IDENTITY(1,1) NOT NULL,
    NguoiDungID INT NOT NULL,
    SuatChieuID INT NOT NULL,
    KhuyenMaiID INT NULL,
    NgayDat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TongTienVe DECIMAL(18,2) NOT NULL DEFAULT 0,
    TongTienDoAn DECIMAL(18,2) NOT NULL DEFAULT 0,
    TienGiamGia DECIMAL(18,2) NOT NULL DEFAULT 0,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Chờ thanh toán',
    -- Hạn giữ ghế của đơn đang chờ thanh toán (NULL với đơn đã thanh toán/hủy/hết hạn)
    HanGiuCho DATETIME2 NULL,
    CONSTRAINT PK_DONDATVE PRIMARY KEY CLUSTERED (DonDatVeID),
    CONSTRAINT FK_DONDATVE_NguoiDung FOREIGN KEY (NguoiDungID)
        REFERENCES dbo.NGUOIDUNG(NguoiDungID),
    CONSTRAINT FK_DONDATVE_SuatChieu FOREIGN KEY (SuatChieuID)
        REFERENCES dbo.SUATCHIEU(SuatChieuID),
    CONSTRAINT FK_DONDATVE_KhuyenMai FOREIGN KEY (KhuyenMaiID)
        REFERENCES dbo.KHUYENMAI(KhuyenMaiID),
    CONSTRAINT CK_DONDATVE_TongTienVe CHECK (TongTienVe >= 0),
    CONSTRAINT CK_DONDATVE_TongTienDoAn CHECK (TongTienDoAn >= 0),
    CONSTRAINT CK_DONDATVE_TienGiamGia CHECK (TienGiamGia >= 0),
    CONSTRAINT CK_DONDATVE_HanGiuCho CHECK (TrangThai <> N'Chờ thanh toán' OR HanGiuCho IS NOT NULL),
    CONSTRAINT CK_DONDATVE_TrangThai CHECK (TrangThai IN (N'Chờ thanh toán', N'Đã thanh toán', N'Đã hủy', N'Hoàn tiền', N'Hết hạn', N'Hoàn thành'))
);
GO

-- Bảng 19: CHITIETVE (Lưu snapshot giá vé và mã vé cho từng ghế)
CREATE TABLE dbo.CHITIETVE (
    VeID INT IDENTITY(1,1) NOT NULL,
    DonDatVeID INT NOT NULL,
    GheID INT NOT NULL,
    GiaVe DECIMAL(18,2) NOT NULL,
    MaVe VARCHAR(100) NOT NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Đã đặt',
    CONSTRAINT PK_CHITIETVE PRIMARY KEY CLUSTERED (VeID),
    CONSTRAINT FK_CHITIETVE_DonDatVe FOREIGN KEY (DonDatVeID)
        REFERENCES dbo.DONDATVE(DonDatVeID) ON DELETE CASCADE,
    CONSTRAINT FK_CHITIETVE_Ghe FOREIGN KEY (GheID)
        REFERENCES dbo.GHE(GheID),
    CONSTRAINT UQ_CHITIETVE_MaVe UNIQUE (MaVe),
    CONSTRAINT CK_CHITIETVE_GiaVe CHECK (GiaVe >= 0),
    CONSTRAINT CK_CHITIETVE_TrangThai CHECK (TrangThai IN (N'Đã đặt', N'Đã sử dụng', N'Đã hủy'))
);
GO

-- Bảng 20: SANPHAM (Đồ ăn, thức uống, Combo)
CREATE TABLE dbo.SANPHAM (
    SanPhamID INT IDENTITY(1,1) NOT NULL,
    TenSanPham NVARCHAR(150) NOT NULL,
    LoaiSanPham NVARCHAR(50) NOT NULL,
    Gia DECIMAL(18,2) NOT NULL,
    MoTa NVARCHAR(255) NULL,
    HinhAnh NVARCHAR(500) NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Đang bán',
    CONSTRAINT PK_SANPHAM PRIMARY KEY CLUSTERED (SanPhamID),
    CONSTRAINT CK_SANPHAM_Gia CHECK (Gia >= 0),
    CONSTRAINT CK_SANPHAM_LoaiSanPham CHECK (LoaiSanPham IN (N'Bắp rang', N'Nước ngọt', N'Combo', N'Snack', N'Khác')),
    CONSTRAINT CK_SANPHAM_TrangThai CHECK (TrangThai IN (N'Đang bán', N'Hết hàng', N'Ngừng bán'))
);
GO

-- Bảng 21: CHITIETDOAN (Snapshot món ăn kèm theo đơn đặt vé)
CREATE TABLE dbo.CHITIETDOAN (
    ChiTietDoAnID INT IDENTITY(1,1) NOT NULL,
    DonDatVeID INT NOT NULL,
    SanPhamID INT NOT NULL,
    SoLuong INT NOT NULL,
    DonGia DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK_CHITIETDOAN PRIMARY KEY CLUSTERED (ChiTietDoAnID),
    CONSTRAINT FK_CHITIETDOAN_DonDatVe FOREIGN KEY (DonDatVeID)
        REFERENCES dbo.DONDATVE(DonDatVeID) ON DELETE CASCADE,
    CONSTRAINT FK_CHITIETDOAN_SanPham FOREIGN KEY (SanPhamID)
        REFERENCES dbo.SANPHAM(SanPhamID),
    CONSTRAINT UQ_CHITIETDOAN_Don_SanPham UNIQUE (DonDatVeID, SanPhamID),
    CONSTRAINT CK_CHITIETDOAN_SoLuong CHECK (SoLuong > 0),
    CONSTRAINT CK_CHITIETDOAN_DonGia CHECK (DonGia >= 0)
);
GO

-- Bảng 22: THANHTOAN (Lưu lịch sử các lần thử thanh toán cho đơn hàng)
CREATE TABLE dbo.THANHTOAN (
    ThanhToanID INT IDENTITY(1,1) NOT NULL,
    DonDatVeID INT NOT NULL,
    PhuongThuc NVARCHAR(50) NOT NULL,
    SoTien DECIMAL(18,2) NOT NULL,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    NgayThanhToan DATETIME2 NULL,
    MaGiaoDich VARCHAR(100) NULL,
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Đang xử lý',
    GhiChu NVARCHAR(255) NULL,
    CONSTRAINT PK_THANHTOAN PRIMARY KEY CLUSTERED (ThanhToanID),
    CONSTRAINT FK_THANHTOAN_DonDatVe FOREIGN KEY (DonDatVeID)
        REFERENCES dbo.DONDATVE(DonDatVeID),
    CONSTRAINT CK_THANHTOAN_SoTien CHECK (SoTien >= 0),
    CONSTRAINT CK_THANHTOAN_PhuongThuc CHECK (PhuongThuc IN (N'VNPAY', N'MOMO', N'ZALOPAY', N'THE_NOI_DIA', N'THE_QUOC_TE', N'TIEN_MAT')),
    CONSTRAINT CK_THANHTOAN_TrangThai CHECK (TrangThai IN (N'Đang xử lý', N'Thành công', N'Thất bại', N'Đã hoàn tiền'))
);
GO

-- ============================================================================
-- NHÓM 6: ĐÁNH GIÁ PHIM, KHIẾU NẠI & CHĂM SÓC KHÁCH HÀNG
-- ============================================================================

-- Bảng 23: DANHGIAPHIM (Mỗi khách hàng chỉ đánh giá một phim một lần)
CREATE TABLE dbo.DANHGIAPHIM (
    DanhGiaID INT IDENTITY(1,1) NOT NULL,
    PhimID INT NOT NULL,
    NguoiDungID INT NOT NULL,
    SoSao INT NOT NULL,
    NoiDung NVARCHAR(1000) NULL,
    NgayDanhGia DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_DANHGIAPHIM PRIMARY KEY CLUSTERED (DanhGiaID),
    CONSTRAINT FK_DANHGIAPHIM_Phim FOREIGN KEY (PhimID)
        REFERENCES dbo.PHIM(PhimID),
    CONSTRAINT FK_DANHGIAPHIM_NguoiDung FOREIGN KEY (NguoiDungID)
        REFERENCES dbo.NGUOIDUNG(NguoiDungID),
    CONSTRAINT UQ_DANHGIAPHIM_Phim_User UNIQUE (PhimID, NguoiDungID),
    CONSTRAINT CK_DANHGIAPHIM_SoSao CHECK (SoSao BETWEEN 1 AND 5)
);
GO

-- Bảng 24: KHIEUNAI (Gửi khiếu nại của khách hàng)
CREATE TABLE dbo.KHIEUNAI (
    KhieuNaiID INT IDENTITY(1,1) NOT NULL,
    NguoiDungID INT NOT NULL,
    DonDatVeID INT NULL,
    LoaiKhieuNai NVARCHAR(100) NOT NULL,
    TieuDe NVARCHAR(200) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    MucDoUuTien NVARCHAR(50) NOT NULL DEFAULT N'Trung bình',
    NgayTao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Mới',
    CONSTRAINT PK_KHIEUNAI PRIMARY KEY CLUSTERED (KhieuNaiID),
    CONSTRAINT FK_KHIEUNAI_NguoiDung FOREIGN KEY (NguoiDungID)
        REFERENCES dbo.NGUOIDUNG(NguoiDungID),
    CONSTRAINT FK_KHIEUNAI_DonDatVe FOREIGN KEY (DonDatVeID)
        REFERENCES dbo.DONDATVE(DonDatVeID),
    CONSTRAINT CK_KHIEUNAI_MucDoUuTien CHECK (MucDoUuTien IN (N'Thấp', N'Trung bình', N'Cao', N'Khẩn cấp')),
    CONSTRAINT CK_KHIEUNAI_TrangThai CHECK (TrangThai IN (N'Mới', N'Đang xử lý', N'Đã giải quyết', N'Đã đóng', N'Từ chối'))
);
GO

-- Bảng 25: XULY_KHIEUNAI (Lịch sử các lần xử lý của CSKH / Admin)
CREATE TABLE dbo.XULY_KHIEUNAI (
    XuLyID INT IDENTITY(1,1) NOT NULL,
    KhieuNaiID INT NOT NULL,
    NguoiXuLyID INT NOT NULL,
    NoiDungXuLy NVARCHAR(MAX) NOT NULL,
    NgayXuLy DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TrangThaiSauXuLy NVARCHAR(50) NOT NULL,
    CONSTRAINT PK_XULY_KHIEUNAI PRIMARY KEY CLUSTERED (XuLyID),
    CONSTRAINT FK_XULY_KHIEUNAI_KhieuNai FOREIGN KEY (KhieuNaiID)
        REFERENCES dbo.KHIEUNAI(KhieuNaiID) ON DELETE CASCADE,
    CONSTRAINT FK_XULY_KHIEUNAI_NguoiXuLy FOREIGN KEY (NguoiXuLyID)
        REFERENCES dbo.NGUOIDUNG(NguoiDungID),
    CONSTRAINT CK_XULY_KHIEUNAI_TrangThaiSauXuLy CHECK (TrangThaiSauXuLy IN (N'Đang xử lý', N'Đã giải quyết', N'Đã đóng', N'Từ chối'))
);
GO

-- ============================================================================
-- THIẾT KẾ INDEXES CÓ CHỦ ĐÍCH ĐỂ TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN
-- ============================================================================
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Index cho tìm kiếm & tra cứu tài khoản
-- UNIQUE chỉ áp dụng khi có khai báo số điện thoại (UNIQUE thường chỉ cho phép 1 giá trị NULL)
CREATE UNIQUE NONCLUSTERED INDEX UQ_NGUOIDUNG_SoDienThoai ON dbo.NGUOIDUNG(SoDienThoai) WHERE SoDienThoai IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_NGUOIDUNG_VaiTroID ON dbo.NGUOIDUNG(VaiTroID);
CREATE NONCLUSTERED INDEX IX_NGUOIDUNG_TrangThai ON dbo.NGUOIDUNG(TrangThai) INCLUDE (HoTen, Email);

-- Index cho phân công rạp theo thời gian & trạng thái
CREATE NONCLUSTERED INDEX IX_PHANCONG_RAP_NguoiDung ON dbo.PHANCONG_RAP(NguoiDungID, TrangThai, NgayBatDau, NgayKetThuc);
CREATE NONCLUSTERED INDEX IX_PHANCONG_RAP_Rap ON dbo.PHANCONG_RAP(RapID, TrangThai);

-- Index cho cấu trúc rạp, phòng, ghế
CREATE NONCLUSTERED INDEX IX_PHONGCHIEU_RapID ON dbo.PHONGCHIEU(RapID, TrangThai);
CREATE NONCLUSTERED INDEX IX_GHE_PhongID_LoaiGhe ON dbo.GHE(PhongID, LoaiGhe, TrangThai);

-- Index cho phim & lịch chiếu
CREATE NONCLUSTERED INDEX IX_PHIM_TrangThai ON dbo.PHIM(TrangThai, NgayKhoiChieu);
CREATE NONCLUSTERED INDEX IX_SUATCHIEU_Phim_ThoiGian ON dbo.SUATCHIEU(PhimID, ThoiGianBatDau, TrangThai);
CREATE NONCLUSTERED INDEX IX_SUATCHIEU_Phong_ThoiGian ON dbo.SUATCHIEU(PhongID, ThoiGianBatDau, ThoiGianKetThuc);

-- Index cho bảng giá áp dụng
CREATE NONCLUSTERED INDEX IX_BANGGIA_Lookup ON dbo.BANGGIA(RapID, LoaiGhe, LoaiNgay, DinhDang, TrangThai, NgayBatDau, NgayKetThuc);

-- Index cho đơn đặt vé & chi tiết vé
CREATE NONCLUSTERED INDEX IX_DONDATVE_NguoiDung ON dbo.DONDATVE(NguoiDungID, NgayDat DESC);
CREATE NONCLUSTERED INDEX IX_DONDATVE_SuatChieu ON dbo.DONDATVE(SuatChieuID, TrangThai);
-- Job quét đơn hết hạn giữ ghế: chỉ các đơn đang chờ thanh toán
CREATE NONCLUSTERED INDEX IX_DONDATVE_HanGiuCho ON dbo.DONDATVE(HanGiuCho) INCLUDE (SuatChieuID) WHERE TrangThai = N'Chờ thanh toán';
-- Covering: sơ đồ ghế / kiểm tra trùng ghế join DONDATVE -> CHITIETVE chỉ đọc GheID, TrangThai, GiaVe
CREATE NONCLUSTERED INDEX IX_CHITIETVE_DonDatVe ON dbo.CHITIETVE(DonDatVeID) INCLUDE (GheID, TrangThai, GiaVe);
-- Kiểm tra khuyến mãi đã được dùng (sp_Admin_Promotion_Delete); chỉ các đơn có áp mã
CREATE NONCLUSTERED INDEX IX_DONDATVE_KhuyenMai ON dbo.DONDATVE(KhuyenMaiID) WHERE KhuyenMaiID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_CHITIETVE_GheID ON dbo.CHITIETVE(GheID, TrangThai);

-- Index cho thanh toán
-- Covering cho báo cáo doanh thu (chỉ cộng giao dịch 'Thành công')
CREATE NONCLUSTERED INDEX IX_THANHTOAN_DonDatVe ON dbo.THANHTOAN(DonDatVeID, TrangThai) INCLUDE (SoTien, NgayThanhToan, NgayTao);
-- MaGiaoDich duy nhất khi có giá trị
CREATE UNIQUE NONCLUSTERED INDEX UQ_THANHTOAN_MaGiaoDich ON dbo.THANHTOAN(MaGiaoDich) WHERE MaGiaoDich IS NOT NULL;

-- Index cho khiếu nại & xử lý khiếu nại
CREATE NONCLUSTERED INDEX IX_KHIEUNAI_NguoiDung ON dbo.KHIEUNAI(NguoiDungID, TrangThai);
-- Tra đơn tham chiếu của khiếu nại (CSKH-04); DonDatVeID có thể NULL
CREATE NONCLUSTERED INDEX IX_KHIEUNAI_DonDatVe ON dbo.KHIEUNAI(DonDatVeID) WHERE DonDatVeID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_KHIEUNAI_TrangThai ON dbo.KHIEUNAI(TrangThai, MucDoUuTien, NgayTao DESC);
CREATE NONCLUSTERED INDEX IX_XULY_KHIEUNAI_KhieuNai ON dbo.XULY_KHIEUNAI(KhieuNaiID, NgayXuLy DESC);

PRINT N'>>> [01_schema.sql] Hoàn tất tạo 25 bảng, ràng buộc và indexes thành công.';
GO
