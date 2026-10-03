# Database inventory

Metadata từ CinemaBookingDB thật. Định nghĩa source/live nằm trong evidence; không deploy.

## BANGGIA

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| GiaID | int | false | IDENTITY | — |
| RapID | int | false | — | — |
| LoaiGhe | nvarchar(50) | false | — | — |
| LoaiNgay | nvarchar(50) | false | — | — |
| DinhDang | nvarchar(50) | false | — | — |
| PhuThu | decimal(18,2) | false | — | ((0)) |
| NgayBatDau | date | false | — | — |
| NgayKetThuc | date | true | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Áp dụng') |

**FK:** FK_BANGGIA_Rap: RapID→RAPCHIEUPHIM.RapID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_BANGGIA_DinhDang: ([DinhDang]=N'Tất cả' OR [DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D'); CK_BANGGIA_LoaiGhe: ([LoaiGhe]=N'Tất cả' OR [LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường'); CK_BANGGIA_LoaiNgay: ([LoaiNgay]=N'Tất cả' OR [LoaiNgay]=N'Ngày lễ' OR [LoaiNgay]=N'Cuối tuần' OR [LoaiNgay]=N'Ngày thường'); CK_BANGGIA_PhuThu: ([PhuThu]>=(0)); CK_BANGGIA_ThoiGian: ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau]); CK_BANGGIA_TrangThai: ([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Áp dụng')

**Indexes:** IX_BANGGIA_Lookup (RapID,LoaiGhe,LoaiNgay,DinhDang,TrangThai,NgayBatDau,NgayKetThuc); INCLUDE —; PK_BANGGIA (GiaID) UNIQUE; INCLUDE —

## CHITIETDOAN

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| ChiTietDoAnID | int | false | IDENTITY | — |
| DonDatVeID | int | false | — | — |
| SanPhamID | int | false | — | — |
| SoLuong | int | false | — | — |
| DonGia | decimal(18,2) | false | — | — |

**FK:** FK_CHITIETDOAN_DonDatVe: DonDatVeID→DONDATVE.DonDatVeID; DELETE CASCADE; trusted=true; FK_CHITIETDOAN_SanPham: SanPhamID→SANPHAM.SanPhamID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_CHITIETDOAN_DonGia: ([DonGia]>=(0)); CK_CHITIETDOAN_SoLuong: ([SoLuong]>(0))

**Indexes:** PK_CHITIETDOAN (ChiTietDoAnID) UNIQUE; INCLUDE —; UQ_CHITIETDOAN_Don_SanPham (DonDatVeID,SanPhamID) UNIQUE; INCLUDE —

## CHITIETVE

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| VeID | int | false | IDENTITY | — |
| DonDatVeID | int | false | — | — |
| GheID | int | false | — | — |
| GiaVe | decimal(18,2) | false | — | — |
| MaVe | varchar(100) | false | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Đã đặt') |

**FK:** FK_CHITIETVE_DonDatVe: DonDatVeID→DONDATVE.DonDatVeID; DELETE CASCADE; trusted=true; FK_CHITIETVE_Ghe: GheID→GHE.GheID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_CHITIETVE_GiaVe: ([GiaVe]>=(0)); CK_CHITIETVE_TrangThai: ([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã sử dụng' OR [TrangThai]=N'Đã đặt')

**Indexes:** IX_CHITIETVE_DonDatVe (DonDatVeID); INCLUDE GheID,TrangThai,GiaVe; IX_CHITIETVE_GheID (GheID,TrangThai); INCLUDE —; PK_CHITIETVE (VeID) UNIQUE; INCLUDE —; UQ_CHITIETVE_MaVe (MaVe) UNIQUE; INCLUDE —

## DANHGIAPHIM

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| DanhGiaID | int | false | IDENTITY | — |
| PhimID | int | false | — | — |
| NguoiDungID | int | false | — | — |
| SoSao | int | false | — | — |
| NoiDung | nvarchar(1000) | true | — | — |
| NgayDanhGia | datetime2 | false | — | ([dbo].[fn_BayGio]()) |

**FK:** FK_DANHGIAPHIM_NguoiDung: NguoiDungID→NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; trusted=true; FK_DANHGIAPHIM_Phim: PhimID→PHIM.PhimID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_DANHGIAPHIM_SoSao: ([SoSao]>=(1) AND [SoSao]<=(5))

**Indexes:** PK_DANHGIAPHIM (DanhGiaID) UNIQUE; INCLUDE —; UQ_DANHGIAPHIM_Phim_User (PhimID,NguoiDungID) UNIQUE; INCLUDE —

## DIENVIEN

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| DienVienID | int | false | IDENTITY | — |
| HoTen | nvarchar(150) | false | — | — |
| NgaySinh | date | true | — | — |
| QuocTich | nvarchar(100) | true | — | — |

**FK:** —

**CHECK:** —

**Indexes:** PK_DIENVIEN (DienVienID) UNIQUE; INCLUDE —

## DONDATVE

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| DonDatVeID | int | false | IDENTITY | — |
| NguoiDungID | int | false | — | — |
| SuatChieuID | int | false | — | — |
| KhuyenMaiID | int | true | — | — |
| NgayDat | datetime2 | false | — | ([dbo].[fn_BayGio]()) |
| TongTienVe | decimal(18,2) | false | — | ((0)) |
| TongTienDoAn | decimal(18,2) | false | — | ((0)) |
| TienGiamGia | decimal(18,2) | false | — | ((0)) |
| TrangThai | nvarchar(50) | false | — | (N'Chờ thanh toán') |
| HanGiuCho | datetime2 | true | — | — |
| LyDoHuy | nvarchar(255) | true | — | — |
| ThongBaoHuy | nvarchar(255) | true | — | — |

**FK:** FK_DONDATVE_KhuyenMai: KhuyenMaiID→KHUYENMAI.KhuyenMaiID; DELETE NO_ACTION; trusted=true; FK_DONDATVE_NguoiDung: NguoiDungID→NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; trusted=true; FK_DONDATVE_SuatChieu: SuatChieuID→SUATCHIEU.SuatChieuID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_DONDATVE_HanGiuCho: ([TrangThai]<>N'Chờ thanh toán' OR [HanGiuCho] IS NOT NULL); CK_DONDATVE_TienGiamGia: ([TienGiamGia]>=(0)); CK_DONDATVE_TongTienDoAn: ([TongTienDoAn]>=(0)); CK_DONDATVE_TongTienVe: ([TongTienVe]>=(0)); CK_DONDATVE_TrangThai: ([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoàn tiền' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã thanh toán' OR [TrangThai]=N'Chờ thanh toán')

**Indexes:** IX_DONDATVE_HanGiuCho (HanGiuCho) WHERE ([TrangThai]=N'Chờ thanh toán'); INCLUDE SuatChieuID; IX_DONDATVE_KhuyenMai (KhuyenMaiID) WHERE ([KhuyenMaiID] IS NOT NULL); INCLUDE —; IX_DONDATVE_NguoiDung (NguoiDungID,NgayDat); INCLUDE —; IX_DONDATVE_SuatChieu (SuatChieuID,TrangThai); INCLUDE —; PK_DONDATVE (DonDatVeID) UNIQUE; INCLUDE —

## GHE

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| GheID | int | false | IDENTITY | — |
| PhongID | int | false | — | — |
| HangGhe | varchar(10) | false | — | — |
| SoGhe | int | false | — | — |
| LoaiGhe | nvarchar(50) | false | — | (N'Thường') |
| TrangThai | nvarchar(50) | false | — | (N'Hoạt động') |

**FK:** FK_GHE_Phong: PhongID→PHONGCHIEU.PhongID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_GHE_LoaiGhe: ([LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường'); CK_GHE_SoGhe: ([SoGhe]>(0)); CK_GHE_TrangThai: ([TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hỏng' OR [TrangThai]=N'Hoạt động')

**Indexes:** IX_GHE_PhongID_LoaiGhe (PhongID,LoaiGhe,TrangThai); INCLUDE —; PK_GHE (GheID) UNIQUE; INCLUDE —; UQ_GHE_ViTri (PhongID,HangGhe,SoGhe) UNIQUE; INCLUDE —

## HINHANH_RAPCHIEUPHIM

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| HinhAnhRapID | int | false | IDENTITY | — |
| RapID | int | false | — | — |
| URL | nvarchar(500) | false | — | — |
| MoTa | nvarchar(255) | true | — | — |
| LaAnhDaiDien | bit | false | — | ((0)) |
| ThuTuHienThi | int | false | — | ((0)) |
| TrangThai | nvarchar(50) | false | — | (N'Hoạt động') |
| NgayTao | datetime2 | false | — | ([dbo].[fn_BayGio]()) |

**FK:** FK_HINHANH_RAPCHIEUPHIM_Rap: RapID→RAPCHIEUPHIM.RapID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi: ([ThuTuHienThi]>=(0)); CK_HINHANH_RAPCHIEUPHIM_TrangThai: ([TrangThai]=N'Tạm ẩn' OR [TrangThai]=N'Hoạt động'); CK_HINHANH_RAPCHIEUPHIM_URL: (len(ltrim(rtrim([URL])))>(0))

**Indexes:** IX_HINHANH_RAPCHIEUPHIM_Rap_TrangThai_ThuTu (RapID,TrangThai,ThuTuHienThi,HinhAnhRapID); INCLUDE —; PK_HINHANH_RAPCHIEUPHIM (HinhAnhRapID) UNIQUE; INCLUDE —; UX_HINHANH_RAPCHIEUPHIM_Rap_Cover (RapID) UNIQUE WHERE ([LaAnhDaiDien]=(1)); INCLUDE —

## HOSOKHACHHANG

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| NguoiDungID | int | false | — | — |
| NgaySinh | date | true | — | — |
| GioiTinh | nvarchar(10) | true | — | — |
| DiemTichLuy | int | false | — | ((0)) |

**FK:** FK_HOSOKHACHHANG_NguoiDung: NguoiDungID→NGUOIDUNG.NguoiDungID; DELETE CASCADE; trusted=true

**CHECK:** CK_HOSOKHACHHANG_DiemTichLuy: ([DiemTichLuy]>=(0)); CK_HOSOKHACHHANG_GioiTinh: ([GioiTinh] IS NULL OR ([GioiTinh]=N'Khác' OR [GioiTinh]=N'Nữ' OR [GioiTinh]=N'Nam'))

**Indexes:** PK_HOSOKHACHHANG (NguoiDungID) UNIQUE; INCLUDE —

## KHIEUNAI

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| KhieuNaiID | int | false | IDENTITY | — |
| NguoiDungID | int | false | — | — |
| DonDatVeID | int | true | — | — |
| LoaiKhieuNai | nvarchar(100) | false | — | — |
| TieuDe | nvarchar(200) | false | — | — |
| NoiDung | nvarchar(MAX) | false | — | — |
| MucDoUuTien | nvarchar(50) | false | — | (N'Trung bình') |
| NgayTao | datetime2 | false | — | ([dbo].[fn_BayGio]()) |
| TrangThai | nvarchar(50) | false | — | (N'Mới') |

**FK:** FK_KHIEUNAI_DonDatVe: DonDatVeID→DONDATVE.DonDatVeID; DELETE NO_ACTION; trusted=true; FK_KHIEUNAI_NguoiDung: NguoiDungID→NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_KHIEUNAI_MucDoUuTien: ([MucDoUuTien]=N'Khẩn cấp' OR [MucDoUuTien]=N'Cao' OR [MucDoUuTien]=N'Trung bình' OR [MucDoUuTien]=N'Thấp'); CK_KHIEUNAI_TrangThai: ([TrangThai]=N'Từ chối' OR [TrangThai]=N'Đã đóng' OR [TrangThai]=N'Đã giải quyết' OR [TrangThai]=N'Đang xử lý' OR [TrangThai]=N'Mới')

**Indexes:** IX_KHIEUNAI_DonDatVe (DonDatVeID) WHERE ([DonDatVeID] IS NOT NULL); INCLUDE —; IX_KHIEUNAI_NguoiDung (NguoiDungID,TrangThai); INCLUDE —; IX_KHIEUNAI_TrangThai (TrangThai,MucDoUuTien,NgayTao); INCLUDE —; PK_KHIEUNAI (KhieuNaiID) UNIQUE; INCLUDE —

## KHUYENMAI

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| KhuyenMaiID | int | false | IDENTITY | — |
| MaCode | varchar(50) | false | — | — |
| MoTa | nvarchar(255) | true | — | — |
| LoaiGiamGia | nvarchar(20) | false | — | — |
| GiaTriGiam | decimal(18,2) | false | — | — |
| DonHangToiThieu | decimal(18,2) | false | — | ((0)) |
| GiamToiDa | decimal(18,2) | true | — | — |
| NgayBatDau | datetime2 | false | — | — |
| NgayKetThuc | datetime2 | false | — | — |
| SoLuong | int | false | — | — |
| SoLuongDaDung | int | false | — | ((0)) |
| TrangThai | nvarchar(50) | false | — | (N'Hoạt động') |

**FK:** —

**CHECK:** CK_KHUYENMAI_DonHangToiThieu: ([DonHangToiThieu]>=(0)); CK_KHUYENMAI_GiamToiDa: ([GiamToiDa] IS NULL OR [GiamToiDa]>=(0)); CK_KHUYENMAI_GiaTriGiam: ([GiaTriGiam]>(0)); CK_KHUYENMAI_LoaiGiamGia: ([LoaiGiamGia]=N'FIXED' OR [LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Số tiền' OR [LoaiGiamGia]=N'Phần trăm'); CK_KHUYENMAI_PhanTram99: (NOT ([LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Phần trăm') OR [GiaTriGiam]<=(99)); CK_KHUYENMAI_SoLuong: ([SoLuong]>=(0) AND [SoLuongDaDung]>=(0) AND [SoLuongDaDung]<=[SoLuong]); CK_KHUYENMAI_ThoiGian: ([NgayKetThuc]>=[NgayBatDau]); CK_KHUYENMAI_TrangThai: ([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoạt động')

**Indexes:** PK_KHUYENMAI (KhuyenMaiID) UNIQUE; INCLUDE —; UQ_KHUYENMAI_MaCode (MaCode) UNIQUE; INCLUDE —

## NGUOIDUNG

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| NguoiDungID | int | false | IDENTITY | — |
| VaiTroID | int | false | — | — |
| HoTen | nvarchar(100) | false | — | — |
| Email | varchar(150) | false | — | — |
| MatKhau | varchar(255) | false | — | — |
| SoDienThoai | varchar(20) | true | — | — |
| NgayTao | datetime2 | false | — | ([dbo].[fn_BayGio]()) |
| TrangThai | nvarchar(50) | false | — | (N'Hoạt động') |

**FK:** FK_NGUOIDUNG_VaiTro: VaiTroID→VAITRO.VaiTroID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_NGUOIDUNG_TrangThai: ([TrangThai]=N'Chưa kích hoạt' OR [TrangThai]=N'Bị khóa' OR [TrangThai]=N'Hoạt động')

**Indexes:** IX_NGUOIDUNG_TrangThai (TrangThai); INCLUDE HoTen,Email; IX_NGUOIDUNG_VaiTroID (VaiTroID); INCLUDE —; PK_NGUOIDUNG (NguoiDungID) UNIQUE; INCLUDE —; UQ_NGUOIDUNG_Email (Email) UNIQUE; INCLUDE —; UQ_NGUOIDUNG_SoDienThoai (SoDienThoai) UNIQUE WHERE ([SoDienThoai] IS NOT NULL); INCLUDE —

## PHANCONG_RAP

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| PhanCongID | int | false | IDENTITY | — |
| NguoiDungID | int | false | — | — |
| RapID | int | false | — | — |
| NgayBatDau | date | false | — | — |
| NgayKetThuc | date | true | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Hiệu lực') |

**FK:** FK_PHANCONG_RAP_NguoiDung: NguoiDungID→NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; trusted=true; FK_PHANCONG_RAP_Rap: RapID→RAPCHIEUPHIM.RapID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_PHANCONG_RAP_ThoiGian: ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau]); CK_PHANCONG_RAP_TrangThai: ([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hiệu lực')

**Indexes:** IX_PHANCONG_RAP_NguoiDung (NguoiDungID,TrangThai,NgayBatDau,NgayKetThuc); INCLUDE —; IX_PHANCONG_RAP_Rap (RapID,TrangThai); INCLUDE —; PK_PHANCONG_RAP (PhanCongID) UNIQUE; INCLUDE —

## PHIM

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| PhimID | int | false | IDENTITY | — |
| TenPhim | nvarchar(255) | false | — | — |
| ThoiLuong | int | false | — | — |
| NgayKhoiChieu | date | false | — | — |
| NgayKetThuc | date | true | — | — |
| NgonNgu | nvarchar(100) | true | — | — |
| PhuDe | nvarchar(100) | true | — | — |
| DoTuoi | nvarchar(20) | true | — | — |
| DaoDien | nvarchar(150) | true | — | — |
| MoTa | nvarchar(MAX) | true | — | — |
| PosterURL | nvarchar(500) | true | — | — |
| TrailerURL | nvarchar(500) | true | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Sắp chiếu') |

**FK:** —

**CHECK:** CK_PHIM_DoTuoi: ([DoTuoi] IS NULL OR ([DoTuoi]=N'C' OR [DoTuoi]=N'T18' OR [DoTuoi]=N'T16' OR [DoTuoi]=N'T13' OR [DoTuoi]=N'K' OR [DoTuoi]=N'P')); CK_PHIM_ThoiGian: ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayKhoiChieu]); CK_PHIM_ThoiLuong: ([ThoiLuong]>(0)); CK_PHIM_TrangThai: ([TrangThai]=N'Ngừng chiếu' OR [TrangThai]=N'Đang chiếu' OR [TrangThai]=N'Sắp chiếu')

**Indexes:** IX_PHIM_TrangThai (TrangThai,NgayKhoiChieu); INCLUDE —; PK_PHIM (PhimID) UNIQUE; INCLUDE —

## PHIM_DIENVIEN

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| PhimID | int | false | — | — |
| DienVienID | int | false | — | — |
| VaiDien | nvarchar(150) | true | — | — |

**FK:** FK_PHIM_DIENVIEN_DienVien: DienVienID→DIENVIEN.DienVienID; DELETE CASCADE; trusted=true; FK_PHIM_DIENVIEN_Phim: PhimID→PHIM.PhimID; DELETE CASCADE; trusted=true

**CHECK:** —

**Indexes:** PK_PHIM_DIENVIEN (PhimID,DienVienID) UNIQUE; INCLUDE —

## PHIM_THELOAI

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| PhimID | int | false | — | — |
| TheLoaiID | int | false | — | — |

**FK:** FK_PHIM_THELOAI_Phim: PhimID→PHIM.PhimID; DELETE CASCADE; trusted=true; FK_PHIM_THELOAI_TheLoai: TheLoaiID→THELOAI.TheLoaiID; DELETE CASCADE; trusted=true

**CHECK:** —

**Indexes:** PK_PHIM_THELOAI (PhimID,TheLoaiID) UNIQUE; INCLUDE —

## PHONGCHIEU

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| PhongID | int | false | IDENTITY | — |
| RapID | int | false | — | — |
| TenPhong | nvarchar(100) | false | — | — |
| LoaiPhong | nvarchar(50) | false | — | (N'2D') |
| TrangThai | nvarchar(50) | false | — | (N'Hoạt động') |

**FK:** FK_PHONGCHIEU_Rap: RapID→RAPCHIEUPHIM.RapID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_PHONGCHIEU_LoaiPhong: ([LoaiPhong]=N'ScreenX' OR [LoaiPhong]=N'4DX' OR [LoaiPhong]=N'IMAX' OR [LoaiPhong]=N'3D' OR [LoaiPhong]=N'2D'); CK_PHONGCHIEU_TrangThai: ([TrangThai]=N'Ngưng hoạt động' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động')

**Indexes:** IX_PHONGCHIEU_RapID (RapID,TrangThai); INCLUDE —; PK_PHONGCHIEU (PhongID) UNIQUE; INCLUDE —; UQ_PHONGCHIEU_TenPhong (RapID,TenPhong) UNIQUE; INCLUDE —

## QUYEN

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| QuyenID | int | false | IDENTITY | — |
| MaQuyen | varchar(50) | false | — | — |
| TenQuyen | nvarchar(100) | false | — | — |
| MoTa | nvarchar(255) | true | — | — |

**FK:** —

**CHECK:** —

**Indexes:** PK_QUYEN (QuyenID) UNIQUE; INCLUDE —; UQ_QUYEN_MaQuyen (MaQuyen) UNIQUE; INCLUDE —

## RAPCHIEUPHIM

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| RapID | int | false | IDENTITY | — |
| TenRap | nvarchar(150) | false | — | — |
| DiaChi | nvarchar(255) | false | — | — |
| ThanhPho | nvarchar(100) | false | — | — |
| SoDienThoai | varchar(20) | true | — | — |
| MoTa | nvarchar(500) | true | — | — |
| NgayHoatDong | date | true | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Hoạt động') |

**FK:** —

**CHECK:** CK_RAPCHIEUPHIM_TrangThai: ([TrangThai]=N'Tạm đóng' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động')

**Indexes:** PK_RAPCHIEUPHIM (RapID) UNIQUE; INCLUDE —

## SANPHAM

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| SanPhamID | int | false | IDENTITY | — |
| TenSanPham | nvarchar(150) | false | — | — |
| LoaiSanPham | nvarchar(50) | false | — | — |
| Gia | decimal(18,2) | false | — | — |
| MoTa | nvarchar(255) | true | — | — |
| HinhAnh | nvarchar(500) | true | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Đang bán') |

**FK:** —

**CHECK:** CK_SANPHAM_Gia: ([Gia]>=(0)); CK_SANPHAM_LoaiSanPham: ([LoaiSanPham]=N'Khác' OR [LoaiSanPham]=N'Snack' OR [LoaiSanPham]=N'Combo' OR [LoaiSanPham]=N'Nước ngọt' OR [LoaiSanPham]=N'Bắp rang'); CK_SANPHAM_TrangThai: ([TrangThai]=N'Ngừng bán' OR [TrangThai]=N'Hết hàng' OR [TrangThai]=N'Đang bán')

**Indexes:** PK_SANPHAM (SanPhamID) UNIQUE; INCLUDE —

## SUATCHIEU

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| SuatChieuID | int | false | IDENTITY | — |
| PhimID | int | false | — | — |
| PhongID | int | false | — | — |
| ThoiGianBatDau | datetime2 | false | — | — |
| ThoiGianKetThuc | datetime2 | false | — | — |
| DinhDang | nvarchar(50) | false | — | (N'2D') |
| GiaVeCoBan | decimal(18,2) | false | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Mở bán') |

**FK:** FK_SUATCHIEU_Phim: PhimID→PHIM.PhimID; DELETE NO_ACTION; trusted=true; FK_SUATCHIEU_Phong: PhongID→PHONGCHIEU.PhongID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_SUATCHIEU_DinhDang: ([DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D'); CK_SUATCHIEU_GiaVeCoBan: ([GiaVeCoBan]>=(0)); CK_SUATCHIEU_ThoiGian: ([ThoiGianKetThuc]>[ThoiGianBatDau]); CK_SUATCHIEU_TrangThai: ([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đóng bán' OR [TrangThai]=N'Mở bán')

**Indexes:** IX_SUATCHIEU_Phim_ThoiGian (PhimID,ThoiGianBatDau,TrangThai); INCLUDE —; IX_SUATCHIEU_Phong_ThoiGian (PhongID,ThoiGianBatDau,ThoiGianKetThuc); INCLUDE —; PK_SUATCHIEU (SuatChieuID) UNIQUE; INCLUDE —

## THANHTOAN

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| ThanhToanID | int | false | IDENTITY | — |
| DonDatVeID | int | false | — | — |
| PhuongThuc | nvarchar(50) | false | — | — |
| SoTien | decimal(18,2) | false | — | — |
| NgayTao | datetime2 | false | — | ([dbo].[fn_BayGio]()) |
| NgayThanhToan | datetime2 | true | — | — |
| MaGiaoDich | varchar(100) | true | — | — |
| TrangThai | nvarchar(50) | false | — | (N'Đang xử lý') |
| GhiChu | nvarchar(255) | true | — | — |

**FK:** FK_THANHTOAN_DonDatVe: DonDatVeID→DONDATVE.DonDatVeID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_THANHTOAN_PhuongThuc: ([PhuongThuc]=N'TIEN_MAT' OR [PhuongThuc]=N'THE_QUOC_TE' OR [PhuongThuc]=N'THE_NOI_DIA' OR [PhuongThuc]=N'ZALOPAY' OR [PhuongThuc]=N'MOMO' OR [PhuongThuc]=N'VNPAY'); CK_THANHTOAN_SoTien: ([SoTien]>=(0)); CK_THANHTOAN_TrangThai: ([TrangThai]=N'Đã hoàn tiền' OR [TrangThai]=N'Thất bại' OR [TrangThai]=N'Thành công' OR [TrangThai]=N'Đang xử lý')

**Indexes:** IX_THANHTOAN_DonDatVe (DonDatVeID,TrangThai); INCLUDE SoTien,NgayThanhToan,NgayTao; PK_THANHTOAN (ThanhToanID) UNIQUE; INCLUDE —; UQ_THANHTOAN_MaGiaoDich (MaGiaoDich) UNIQUE WHERE ([MaGiaoDich] IS NOT NULL); INCLUDE —

## THELOAI

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| TheLoaiID | int | false | IDENTITY | — |
| TenTheLoai | nvarchar(100) | false | — | — |

**FK:** —

**CHECK:** —

**Indexes:** PK_THELOAI (TheLoaiID) UNIQUE; INCLUDE —; UQ_THELOAI_TenTheLoai (TenTheLoai) UNIQUE; INCLUDE —

## VAITRO

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| VaiTroID | int | false | IDENTITY | — |
| MaVaiTro | varchar(50) | false | — | — |
| TenVaiTro | nvarchar(100) | false | — | — |
| MoTa | nvarchar(255) | true | — | — |

**FK:** —

**CHECK:** —

**Indexes:** PK_VAITRO (VaiTroID) UNIQUE; INCLUDE —; UQ_VAITRO_MaVaiTro (MaVaiTro) UNIQUE; INCLUDE —

## VAITRO_QUYEN

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| VaiTroID | int | false | — | — |
| QuyenID | int | false | — | — |
| NgayGan | datetime2 | false | — | ([dbo].[fn_BayGio]()) |

**FK:** FK_VAITRO_QUYEN_Quyen: QuyenID→QUYEN.QuyenID; DELETE CASCADE; trusted=true; FK_VAITRO_QUYEN_VaiTro: VaiTroID→VAITRO.VaiTroID; DELETE CASCADE; trusted=true

**CHECK:** —

**Indexes:** PK_VAITRO_QUYEN (VaiTroID,QuyenID) UNIQUE; INCLUDE —

## XULY_KHIEUNAI

| Column | Type | Nullable | Identity/computed | Default |
| --- | --- | --- | --- | --- |
| XuLyID | int | false | IDENTITY | — |
| KhieuNaiID | int | false | — | — |
| NguoiXuLyID | int | false | — | — |
| NoiDungXuLy | nvarchar(MAX) | false | — | — |
| NgayXuLy | datetime2 | false | — | ([dbo].[fn_BayGio]()) |
| TrangThaiSauXuLy | nvarchar(50) | false | — | — |

**FK:** FK_XULY_KHIEUNAI_KhieuNai: KhieuNaiID→KHIEUNAI.KhieuNaiID; DELETE CASCADE; trusted=true; FK_XULY_KHIEUNAI_NguoiXuLy: NguoiXuLyID→NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; trusted=true

**CHECK:** CK_XULY_KHIEUNAI_TrangThaiSauXuLy: ([TrangThaiSauXuLy]=N'Từ chối' OR [TrangThaiSauXuLy]=N'Đã đóng' OR [TrangThaiSauXuLy]=N'Đã giải quyết' OR [TrangThaiSauXuLy]=N'Đang xử lý')

**Indexes:** IX_XULY_KHIEUNAI_KhieuNai (KhieuNaiID,NgayXuLy); INCLUDE —; PK_XULY_KHIEUNAI (XuLyID) UNIQUE; INCLUDE —

## Principals / roles / grants

[live-security.json](./evidence/live-security.json), [live-role-memberships.json](./evidence/live-role-memberships.json), [live-server-role-memberships.json](./evidence/live-server-role-memberships.json), [live-schemas.json](./evidence/live-schemas.json)
