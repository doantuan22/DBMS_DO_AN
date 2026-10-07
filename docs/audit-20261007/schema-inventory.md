
#### BANGGIA — 7 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| GiaID | int | NO | IDENTITY(1,1) |
| RapID | int | NO |  |
| LoaiGhe | nvarchar(50) | NO |  |
| LoaiNgay | nvarchar(50) | NO |  |
| DinhDang | nvarchar(50) | NO |  |
| PhuThu | decimal(18,2) | NO | DF_BANGGIA_PhuThu = ((0)) |
| NgayBatDau | date | NO |  |
| NgayKetThuc | date | YES |  |
| TrangThai | nvarchar(50) | NO | DF_BANGGIA_TrangThai = (N'Áp dụng') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_BANGGIA | GiaID |
| FK FK_BANGGIA_Rap | RapID → RAPCHIEUPHIM.RapID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_BANGGIA_DinhDang | ([DinhDang]=N'Tất cả' OR [DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D'); trusted=true, enabled=true |
| CHECK CK_BANGGIA_LoaiGhe | ([LoaiGhe]=N'Tất cả' OR [LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường'); trusted=true, enabled=true |
| CHECK CK_BANGGIA_LoaiNgay | ([LoaiNgay]=N'Tất cả' OR [LoaiNgay]=N'Ngày lễ' OR [LoaiNgay]=N'Cuối tuần' OR [LoaiNgay]=N'Ngày thường'); trusted=true, enabled=true |
| CHECK CK_BANGGIA_PhuThu | ([PhuThu]>=(0)); trusted=true, enabled=true |
| CHECK CK_BANGGIA_ThoiGian | ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau]); trusted=true, enabled=true |
| CHECK CK_BANGGIA_TrangThai | ([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Áp dụng'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_BANGGIA_Lookup | false; NONCLUSTERED | RapID ASC, LoaiGhe ASC, LoaiNgay ASC, DinhDang ASC, TrangThai ASC, NgayBatDau ASC, NgayKetThuc ASC |  |
| PK_BANGGIA | true; CLUSTERED | GiaID ASC |  |

#### BOITHUONG_HUYSUAT — 0 dòng; EXTRA (có tài liệu migration)

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| BoiThuongID | int | NO | IDENTITY(1,1) |
| DonDatVeID | int | NO |  |
| DiemBoiThuong | int | NO |  |
| NgayBoiThuong | datetime2 | NO |  |
| GhiChu | nvarchar(255) | YES |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_BOITHUONG_HUYSUAT | BoiThuongID |
| UQ UQ_BOITHUONG_HUYSUAT_Don | DonDatVeID |
| FK FK_BOITHUONG_HUYSUAT_Don | DonDatVeID → DONDATVE.DonDatVeID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_BOITHUONG_HUYSUAT_Diem | ([DiemBoiThuong]>=(0)); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_BOITHUONG_HUYSUAT | true; CLUSTERED | BoiThuongID ASC |  |
| UQ_BOITHUONG_HUYSUAT_Don | true; NONCLUSTERED | DonDatVeID ASC |  |

#### CHITIETDOAN — 0 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| ChiTietDoAnID | int | NO | IDENTITY(1,1) |
| DonDatVeID | int | NO |  |
| SanPhamID | int | NO |  |
| SoLuong | int | NO |  |
| DonGia | decimal(18,2) | NO |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_CHITIETDOAN | ChiTietDoAnID |
| UQ UQ_CHITIETDOAN_Don_SanPham | DonDatVeID, SanPhamID |
| FK FK_CHITIETDOAN_DonDatVe | DonDatVeID → DONDATVE.DonDatVeID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_CHITIETDOAN_SanPham | SanPhamID → SANPHAM.SanPhamID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_CHITIETDOAN_DonGia | ([DonGia]>=(0)); trusted=true, enabled=true |
| CHECK CK_CHITIETDOAN_SoLuong | ([SoLuong]>(0)); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_CHITIETDOAN | true; CLUSTERED | ChiTietDoAnID ASC |  |
| UQ_CHITIETDOAN_Don_SanPham | true; NONCLUSTERED | DonDatVeID ASC, SanPhamID ASC |  |

#### CHITIETVE — 0 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| VeID | int | NO | IDENTITY(1,1) |
| DonDatVeID | int | NO |  |
| GheID | int | NO |  |
| GiaVe | decimal(18,2) | NO |  |
| MaVe | varchar(100) | NO |  |
| TrangThai | nvarchar(50) | NO | DF_CHITIETVE_TrangThai = (N'Đã đặt') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_CHITIETVE | VeID |
| UQ UQ_CHITIETVE_MaVe | MaVe |
| FK FK_CHITIETVE_DonDatVe | DonDatVeID → DONDATVE.DonDatVeID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_CHITIETVE_Ghe | GheID → GHE.GheID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_CHITIETVE_GiaVe | ([GiaVe]>=(0)); trusted=true, enabled=true |
| CHECK CK_CHITIETVE_TrangThai | ([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã sử dụng' OR [TrangThai]=N'Đã đặt'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_CHITIETVE_DonDatVe | false; NONCLUSTERED | DonDatVeID ASC | GheID, TrangThai, GiaVe |
| IX_CHITIETVE_GheID | false; NONCLUSTERED | GheID ASC, TrangThai ASC |  |
| PK_CHITIETVE | true; CLUSTERED | VeID ASC |  |
| UQ_CHITIETVE_MaVe | true; NONCLUSTERED | MaVe ASC |  |

#### DANHGIAPHIM — 0 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| DanhGiaID | int | NO | IDENTITY(1,1) |
| PhimID | int | NO |  |
| NguoiDungID | int | NO |  |
| SoSao | int | NO |  |
| NoiDung | nvarchar(1000) | YES |  |
| NgayDanhGia | datetime2 | NO | DF_DANHGIAPHIM_NgayDanhGia_ClockVN = ([dbo].[fn_BayGio]()) |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_DANHGIAPHIM | DanhGiaID |
| UQ UQ_DANHGIAPHIM_Phim_User | PhimID, NguoiDungID |
| FK FK_DANHGIAPHIM_NguoiDung | NguoiDungID → NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_DANHGIAPHIM_Phim | PhimID → PHIM.PhimID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_DANHGIAPHIM_SoSao | ([SoSao]>=(1) AND [SoSao]<=(5)); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_DANHGIAPHIM | true; CLUSTERED | DanhGiaID ASC |  |
| UQ_DANHGIAPHIM_Phim_User | true; NONCLUSTERED | PhimID ASC, NguoiDungID ASC |  |

#### DIENVIEN — 6 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| DienVienID | int | NO | IDENTITY(1,1) |
| HoTen | nvarchar(150) | NO |  |
| NgaySinh | date | YES |  |
| QuocTich | nvarchar(100) | YES |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_DIENVIEN | DienVienID |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_DIENVIEN | true; CLUSTERED | DienVienID ASC |  |

#### DONDATVE — 0 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| DonDatVeID | int | NO | IDENTITY(1,1) |
| NguoiDungID | int | NO |  |
| SuatChieuID | int | NO |  |
| KhuyenMaiID | int | YES |  |
| NgayDat | datetime2 | NO | DF_DONDATVE_NgayDat_ClockVN = ([dbo].[fn_BayGio]()) |
| TongTienVe | decimal(18,2) | NO | DF_DONDATVE_TongTienVe = ((0)) |
| TongTienDoAn | decimal(18,2) | NO | DF_DONDATVE_TongTienDoAn = ((0)) |
| TienGiamGia | decimal(18,2) | NO | DF_DONDATVE_TienGiamGia = ((0)) |
| TrangThai | nvarchar(50) | NO | DF_DONDATVE_TrangThai = (N'Chờ thanh toán') |
| HanGiuCho | datetime2 | YES |  |
| LyDoHuy | nvarchar(255) | YES |  |
| ThongBaoHuy | nvarchar(255) | YES |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_DONDATVE | DonDatVeID |
| FK FK_DONDATVE_KhuyenMai | KhuyenMaiID → KHUYENMAI.KhuyenMaiID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_DONDATVE_NguoiDung | NguoiDungID → NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_DONDATVE_SuatChieu | SuatChieuID → SUATCHIEU.SuatChieuID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_DONDATVE_HanGiuCho | ([TrangThai]<>N'Chờ thanh toán' OR [HanGiuCho] IS NOT NULL); trusted=true, enabled=true |
| CHECK CK_DONDATVE_TienGiamGia | ([TienGiamGia]>=(0)); trusted=true, enabled=true |
| CHECK CK_DONDATVE_TongTienDoAn | ([TongTienDoAn]>=(0)); trusted=true, enabled=true |
| CHECK CK_DONDATVE_TongTienVe | ([TongTienVe]>=(0)); trusted=true, enabled=true |
| CHECK CK_DONDATVE_TrangThai | ([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoàn tiền' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã thanh toán' OR [TrangThai]=N'Chờ thanh toán'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_DONDATVE_HanGiuCho | false; NONCLUSTERED | HanGiuCho ASC | SuatChieuID; WHERE ([TrangThai]=N'Chờ thanh toán') |
| IX_DONDATVE_KhuyenMai | false; NONCLUSTERED | KhuyenMaiID ASC | ; WHERE ([KhuyenMaiID] IS NOT NULL) |
| IX_DONDATVE_NguoiDung | false; NONCLUSTERED | NguoiDungID ASC, NgayDat DESC |  |
| IX_DONDATVE_SuatChieu | false; NONCLUSTERED | SuatChieuID ASC, TrangThai ASC |  |
| PK_DONDATVE | true; CLUSTERED | DonDatVeID ASC |  |

#### GHE — 240 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| GheID | int | NO | IDENTITY(1,1) |
| PhongID | int | NO |  |
| HangGhe | varchar(10) | NO |  |
| SoGhe | int | NO |  |
| LoaiGhe | nvarchar(50) | NO | DF_GHE_LoaiGhe = (N'Thường') |
| TrangThai | nvarchar(50) | NO | DF_GHE_TrangThai = (N'Hoạt động') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_GHE | GheID |
| UQ UQ_GHE_ViTri | PhongID, HangGhe, SoGhe |
| FK FK_GHE_Phong | PhongID → PHONGCHIEU.PhongID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_GHE_LoaiGhe | ([LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường'); trusted=true, enabled=true |
| CHECK CK_GHE_SoGhe | ([SoGhe]>(0)); trusted=true, enabled=true |
| CHECK CK_GHE_TrangThai | ([TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hỏng' OR [TrangThai]=N'Hoạt động'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_GHE_PhongID_LoaiGhe | false; NONCLUSTERED | PhongID ASC, LoaiGhe ASC, TrangThai ASC |  |
| PK_GHE | true; CLUSTERED | GheID ASC |  |
| UQ_GHE_ViTri | true; NONCLUSTERED | PhongID ASC, HangGhe ASC, SoGhe ASC |  |

#### HINHANH_RAPCHIEUPHIM — 3 dòng; EXTRA (có tài liệu migration)

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| HinhAnhRapID | int | NO | IDENTITY(1,1) |
| RapID | int | NO |  |
| URL | nvarchar(500) | NO |  |
| MoTa | nvarchar(255) | YES |  |
| LaAnhDaiDien | bit | NO | DF_HINHANH_RAPCHIEUPHIM_LaAnhDaiDien = ((0)) |
| ThuTuHienThi | int | NO | DF_HINHANH_RAPCHIEUPHIM_ThuTuHienThi = ((0)) |
| TrangThai | nvarchar(50) | NO | DF_HINHANH_RAPCHIEUPHIM_TrangThai = (N'Hoạt động') |
| NgayTao | datetime2 | NO | DF_HINHANH_RAPCHIEUPHIM_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_HINHANH_RAPCHIEUPHIM | HinhAnhRapID |
| FK FK_HINHANH_RAPCHIEUPHIM_Rap | RapID → RAPCHIEUPHIM.RapID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi | ([ThuTuHienThi]>=(0)); trusted=true, enabled=true |
| CHECK CK_HINHANH_RAPCHIEUPHIM_TrangThai | ([TrangThai]=N'Tạm ẩn' OR [TrangThai]=N'Hoạt động'); trusted=true, enabled=true |
| CHECK CK_HINHANH_RAPCHIEUPHIM_URL | (len(ltrim(rtrim([URL])))>(0)); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_HINHANH_RAPCHIEUPHIM_Rap_TrangThai_ThuTu | false; NONCLUSTERED | RapID ASC, TrangThai ASC, ThuTuHienThi ASC, HinhAnhRapID ASC |  |
| PK_HINHANH_RAPCHIEUPHIM | true; CLUSTERED | HinhAnhRapID ASC |  |
| UX_HINHANH_RAPCHIEUPHIM_Rap_Cover | true; NONCLUSTERED | RapID ASC | ; WHERE ([LaAnhDaiDien]=(1)) |

#### HOSOKHACHHANG — 4 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| NguoiDungID | int | NO |  |
| NgaySinh | date | YES |  |
| GioiTinh | nvarchar(10) | YES |  |
| DiemTichLuy | int | NO | DF_HOSOKHACHHANG_DiemTichLuy = ((0)) |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_HOSOKHACHHANG | NguoiDungID |
| FK FK_HOSOKHACHHANG_NguoiDung | NguoiDungID → NGUOIDUNG.NguoiDungID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_HOSOKHACHHANG_DiemTichLuy | ([DiemTichLuy]>=(0)); trusted=true, enabled=true |
| CHECK CK_HOSOKHACHHANG_GioiTinh | ([GioiTinh] IS NULL OR ([GioiTinh]=N'Khác' OR [GioiTinh]=N'Nữ' OR [GioiTinh]=N'Nam')); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_HOSOKHACHHANG | true; CLUSTERED | NguoiDungID ASC |  |

#### KHIEUNAI — 0 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| KhieuNaiID | int | NO | IDENTITY(1,1) |
| NguoiDungID | int | NO |  |
| DonDatVeID | int | YES |  |
| LoaiKhieuNai | nvarchar(100) | NO |  |
| TieuDe | nvarchar(200) | NO |  |
| NoiDung | nvarchar(MAX) | NO |  |
| MucDoUuTien | nvarchar(50) | NO | DF_KHIEUNAI_MucDoUuTien = (N'Trung bình') |
| NgayTao | datetime2 | NO | DF_KHIEUNAI_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) |
| TrangThai | nvarchar(50) | NO | DF_KHIEUNAI_TrangThai = (N'Mới') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_KHIEUNAI | KhieuNaiID |
| FK FK_KHIEUNAI_DonDatVe | DonDatVeID → DONDATVE.DonDatVeID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_KHIEUNAI_NguoiDung | NguoiDungID → NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_KHIEUNAI_MucDoUuTien | ([MucDoUuTien]=N'Khẩn cấp' OR [MucDoUuTien]=N'Cao' OR [MucDoUuTien]=N'Trung bình' OR [MucDoUuTien]=N'Thấp'); trusted=true, enabled=true |
| CHECK CK_KHIEUNAI_TrangThai | ([TrangThai]=N'Từ chối' OR [TrangThai]=N'Đã đóng' OR [TrangThai]=N'Đã giải quyết' OR [TrangThai]=N'Đang xử lý' OR [TrangThai]=N'Mới'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_KHIEUNAI_DonDatVe | false; NONCLUSTERED | DonDatVeID ASC | ; WHERE ([DonDatVeID] IS NOT NULL) |
| IX_KHIEUNAI_NguoiDung | false; NONCLUSTERED | NguoiDungID ASC, TrangThai ASC |  |
| IX_KHIEUNAI_TrangThai | false; NONCLUSTERED | TrangThai ASC, MucDoUuTien ASC, NgayTao DESC |  |
| PK_KHIEUNAI | true; CLUSTERED | KhieuNaiID ASC |  |

#### KHUYENMAI — 3 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| KhuyenMaiID | int | NO | IDENTITY(1,1) |
| MaCode | varchar(50) | NO |  |
| MoTa | nvarchar(255) | YES |  |
| LoaiGiamGia | nvarchar(20) | NO |  |
| GiaTriGiam | decimal(18,2) | NO |  |
| DonHangToiThieu | decimal(18,2) | NO | DF_KHUYENMAI_DonHangToiThieu = ((0)) |
| GiamToiDa | decimal(18,2) | YES |  |
| NgayBatDau | datetime2 | NO |  |
| NgayKetThuc | datetime2 | NO |  |
| SoLuong | int | NO |  |
| SoLuongDaDung | int | NO | DF_KHUYENMAI_SoLuongDaDung = ((0)) |
| TrangThai | nvarchar(50) | NO | DF_KHUYENMAI_TrangThai = (N'Hoạt động') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_KHUYENMAI | KhuyenMaiID |
| UQ UQ_KHUYENMAI_MaCode | MaCode |
| CHECK CK_KHUYENMAI_DonHangToiThieu | ([DonHangToiThieu]>=(0)); trusted=true, enabled=true |
| CHECK CK_KHUYENMAI_GiamToiDa | ([GiamToiDa] IS NULL OR [GiamToiDa]>=(0)); trusted=true, enabled=true |
| CHECK CK_KHUYENMAI_GiaTriGiam | ([GiaTriGiam]>(0)); trusted=true, enabled=true |
| CHECK CK_KHUYENMAI_LoaiGiamGia | ([LoaiGiamGia]=N'FIXED' OR [LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Số tiền' OR [LoaiGiamGia]=N'Phần trăm'); trusted=true, enabled=true |
| CHECK CK_KHUYENMAI_PhanTram99 | (NOT ([LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Phần trăm') OR [GiaTriGiam]<=(99)); trusted=true, enabled=true |
| CHECK CK_KHUYENMAI_SoLuong | ([SoLuong]>=(0) AND [SoLuongDaDung]>=(0) AND [SoLuongDaDung]<=[SoLuong]); trusted=true, enabled=true |
| CHECK CK_KHUYENMAI_ThoiGian | ([NgayKetThuc]>=[NgayBatDau]); trusted=true, enabled=true |
| CHECK CK_KHUYENMAI_TrangThai | ([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoạt động'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_KHUYENMAI | true; CLUSTERED | KhuyenMaiID ASC |  |
| UQ_KHUYENMAI_MaCode | true; NONCLUSTERED | MaCode ASC |  |

#### NGUOIDUNG — 8 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| NguoiDungID | int | NO | IDENTITY(1,1) |
| VaiTroID | int | NO |  |
| HoTen | nvarchar(100) | NO |  |
| Email | varchar(150) | NO |  |
| MatKhau | varchar(255) | NO |  |
| SoDienThoai | varchar(20) | YES |  |
| NgayTao | datetime2 | NO | DF_NGUOIDUNG_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) |
| TrangThai | nvarchar(50) | NO | DF_NGUOIDUNG_TrangThai = (N'Hoạt động') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_NGUOIDUNG | NguoiDungID |
| UQ UQ_NGUOIDUNG_Email | Email |
| FK FK_NGUOIDUNG_VaiTro | VaiTroID → VAITRO.VaiTroID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_NGUOIDUNG_TrangThai | ([TrangThai]=N'Chưa kích hoạt' OR [TrangThai]=N'Bị khóa' OR [TrangThai]=N'Hoạt động'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_NGUOIDUNG_TrangThai | false; NONCLUSTERED | TrangThai ASC | HoTen, Email |
| IX_NGUOIDUNG_VaiTroID | false; NONCLUSTERED | VaiTroID ASC |  |
| PK_NGUOIDUNG | true; CLUSTERED | NguoiDungID ASC |  |
| UQ_NGUOIDUNG_Email | true; NONCLUSTERED | Email ASC |  |
| UQ_NGUOIDUNG_SoDienThoai | true; NONCLUSTERED | SoDienThoai ASC | ; WHERE ([SoDienThoai] IS NOT NULL) |

#### PHANCONG_RAP — 2 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| PhanCongID | int | NO | IDENTITY(1,1) |
| NguoiDungID | int | NO |  |
| RapID | int | NO |  |
| NgayBatDau | date | NO |  |
| NgayKetThuc | date | YES |  |
| TrangThai | nvarchar(50) | NO | DF_PHANCONG_RAP_TrangThai = (N'Hiệu lực') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_PHANCONG_RAP | PhanCongID |
| FK FK_PHANCONG_RAP_NguoiDung | NguoiDungID → NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_PHANCONG_RAP_Rap | RapID → RAPCHIEUPHIM.RapID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_PHANCONG_RAP_ThoiGian | ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau]); trusted=true, enabled=true |
| CHECK CK_PHANCONG_RAP_TrangThai | ([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hiệu lực'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_PHANCONG_RAP_NguoiDung | false; NONCLUSTERED | NguoiDungID ASC, TrangThai ASC, NgayBatDau ASC, NgayKetThuc ASC |  |
| IX_PHANCONG_RAP_Rap | false; NONCLUSTERED | RapID ASC, TrangThai ASC |  |
| PK_PHANCONG_RAP | true; CLUSTERED | PhanCongID ASC |  |

#### PHIM — 4 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| PhimID | int | NO | IDENTITY(1,1) |
| TenPhim | nvarchar(255) | NO |  |
| ThoiLuong | int | NO |  |
| NgayKhoiChieu | date | NO |  |
| NgayKetThuc | date | YES |  |
| NgonNgu | nvarchar(100) | YES |  |
| PhuDe | nvarchar(100) | YES |  |
| DoTuoi | nvarchar(20) | YES |  |
| DaoDien | nvarchar(150) | YES |  |
| MoTa | nvarchar(MAX) | YES |  |
| PosterURL | nvarchar(500) | YES |  |
| TrailerURL | nvarchar(500) | YES |  |
| TrangThai | nvarchar(50) | NO | DF_PHIM_TrangThai = (N'Sắp chiếu') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_PHIM | PhimID |
| CHECK CK_PHIM_DoTuoi | ([DoTuoi] IS NULL OR ([DoTuoi]=N'C' OR [DoTuoi]=N'T18' OR [DoTuoi]=N'T16' OR [DoTuoi]=N'T13' OR [DoTuoi]=N'K' OR [DoTuoi]=N'P')); trusted=true, enabled=true |
| CHECK CK_PHIM_ThoiGian | ([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayKhoiChieu]); trusted=true, enabled=true |
| CHECK CK_PHIM_ThoiLuong | ([ThoiLuong]>(0)); trusted=true, enabled=true |
| CHECK CK_PHIM_TrangThai | ([TrangThai]=N'Ngừng chiếu' OR [TrangThai]=N'Đang chiếu' OR [TrangThai]=N'Sắp chiếu'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_PHIM_TrangThai | false; NONCLUSTERED | TrangThai ASC, NgayKhoiChieu ASC |  |
| PK_PHIM | true; CLUSTERED | PhimID ASC |  |

#### PHIM_DIENVIEN — 4 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| PhimID | int | NO |  |
| DienVienID | int | NO |  |
| VaiDien | nvarchar(150) | YES |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_PHIM_DIENVIEN | PhimID, DienVienID |
| FK FK_PHIM_DIENVIEN_DienVien | DienVienID → DIENVIEN.DienVienID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_PHIM_DIENVIEN_Phim | PhimID → PHIM.PhimID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_PHIM_DIENVIEN | true; CLUSTERED | PhimID ASC, DienVienID ASC |  |

#### PHIM_THELOAI — 7 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| PhimID | int | NO |  |
| TheLoaiID | int | NO |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_PHIM_THELOAI | PhimID, TheLoaiID |
| FK FK_PHIM_THELOAI_Phim | PhimID → PHIM.PhimID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_PHIM_THELOAI_TheLoai | TheLoaiID → THELOAI.TheLoaiID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_PHIM_THELOAI | true; CLUSTERED | PhimID ASC, TheLoaiID ASC |  |

#### PHONGCHIEU — 6 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| PhongID | int | NO | IDENTITY(1,1) |
| RapID | int | NO |  |
| TenPhong | nvarchar(100) | NO |  |
| LoaiPhong | nvarchar(50) | NO | DF_PHONGCHIEU_LoaiPhong = (N'2D') |
| TrangThai | nvarchar(50) | NO | DF_PHONGCHIEU_TrangThai = (N'Hoạt động') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_PHONGCHIEU | PhongID |
| UQ UQ_PHONGCHIEU_TenPhong | RapID, TenPhong |
| FK FK_PHONGCHIEU_Rap | RapID → RAPCHIEUPHIM.RapID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_PHONGCHIEU_LoaiPhong | ([LoaiPhong]=N'ScreenX' OR [LoaiPhong]=N'4DX' OR [LoaiPhong]=N'IMAX' OR [LoaiPhong]=N'3D' OR [LoaiPhong]=N'2D'); trusted=true, enabled=true |
| CHECK CK_PHONGCHIEU_TrangThai | ([TrangThai]=N'Ngưng hoạt động' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_PHONGCHIEU_RapID | false; NONCLUSTERED | RapID ASC, TrangThai ASC |  |
| PK_PHONGCHIEU | true; CLUSTERED | PhongID ASC |  |
| UQ_PHONGCHIEU_TenPhong | true; NONCLUSTERED | RapID ASC, TenPhong ASC |  |

#### QUYEN — 23 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| QuyenID | int | NO | IDENTITY(1,1) |
| MaQuyen | varchar(50) | NO |  |
| TenQuyen | nvarchar(100) | NO |  |
| MoTa | nvarchar(255) | YES |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_QUYEN | QuyenID |
| UQ UQ_QUYEN_MaQuyen | MaQuyen |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_QUYEN | true; CLUSTERED | QuyenID ASC |  |
| UQ_QUYEN_MaQuyen | true; NONCLUSTERED | MaQuyen ASC |  |

#### RAPCHIEUPHIM — 3 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| RapID | int | NO | IDENTITY(1,1) |
| TenRap | nvarchar(150) | NO |  |
| DiaChi | nvarchar(255) | NO |  |
| ThanhPho | nvarchar(100) | NO |  |
| SoDienThoai | varchar(20) | YES |  |
| MoTa | nvarchar(500) | YES |  |
| NgayHoatDong | date | YES |  |
| TrangThai | nvarchar(50) | NO | DF_RAPCHIEUPHIM_TrangThai = (N'Hoạt động') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_RAPCHIEUPHIM | RapID |
| CHECK CK_RAPCHIEUPHIM_TrangThai | ([TrangThai]=N'Tạm đóng' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_RAPCHIEUPHIM | true; CLUSTERED | RapID ASC |  |

#### SANPHAM — 5 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| SanPhamID | int | NO | IDENTITY(1,1) |
| TenSanPham | nvarchar(150) | NO |  |
| LoaiSanPham | nvarchar(50) | NO |  |
| Gia | decimal(18,2) | NO |  |
| MoTa | nvarchar(255) | YES |  |
| HinhAnh | nvarchar(500) | YES |  |
| TrangThai | nvarchar(50) | NO | DF_SANPHAM_TrangThai = (N'Đang bán') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_SANPHAM | SanPhamID |
| CHECK CK_SANPHAM_Gia | ([Gia]>=(0)); trusted=true, enabled=true |
| CHECK CK_SANPHAM_LoaiSanPham | ([LoaiSanPham]=N'Khác' OR [LoaiSanPham]=N'Snack' OR [LoaiSanPham]=N'Combo' OR [LoaiSanPham]=N'Nước ngọt' OR [LoaiSanPham]=N'Bắp rang'); trusted=true, enabled=true |
| CHECK CK_SANPHAM_TrangThai | ([TrangThai]=N'Ngừng bán' OR [TrangThai]=N'Hết hàng' OR [TrangThai]=N'Đang bán'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_SANPHAM | true; CLUSTERED | SanPhamID ASC |  |

#### SUATCHIEU — 5 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| SuatChieuID | int | NO | IDENTITY(1,1) |
| PhimID | int | NO |  |
| PhongID | int | NO |  |
| ThoiGianBatDau | datetime2 | NO |  |
| ThoiGianKetThuc | datetime2 | NO |  |
| DinhDang | nvarchar(50) | NO | DF_SUATCHIEU_DinhDang = (N'2D') |
| GiaVeCoBan | decimal(18,2) | NO |  |
| TrangThai | nvarchar(50) | NO | DF_SUATCHIEU_TrangThai = (N'Mở bán') |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_SUATCHIEU | SuatChieuID |
| FK FK_SUATCHIEU_Phim | PhimID → PHIM.PhimID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_SUATCHIEU_Phong | PhongID → PHONGCHIEU.PhongID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_SUATCHIEU_DinhDang | ([DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D'); trusted=true, enabled=true |
| CHECK CK_SUATCHIEU_GiaVeCoBan | ([GiaVeCoBan]>=(0)); trusted=true, enabled=true |
| CHECK CK_SUATCHIEU_ThoiGian | ([ThoiGianKetThuc]>[ThoiGianBatDau]); trusted=true, enabled=true |
| CHECK CK_SUATCHIEU_TrangThai | ([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đóng bán' OR [TrangThai]=N'Mở bán'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_SUATCHIEU_Phim_ThoiGian | false; NONCLUSTERED | PhimID ASC, ThoiGianBatDau ASC, TrangThai ASC |  |
| IX_SUATCHIEU_Phong_ThoiGian | false; NONCLUSTERED | PhongID ASC, ThoiGianBatDau ASC, ThoiGianKetThuc ASC |  |
| PK_SUATCHIEU | true; CLUSTERED | SuatChieuID ASC |  |

#### THANHTOAN — 0 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| ThanhToanID | int | NO | IDENTITY(1,1) |
| DonDatVeID | int | NO |  |
| PhuongThuc | nvarchar(50) | NO |  |
| SoTien | decimal(18,2) | NO |  |
| NgayTao | datetime2 | NO | DF_THANHTOAN_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) |
| NgayThanhToan | datetime2 | YES |  |
| MaGiaoDich | varchar(100) | YES |  |
| TrangThai | nvarchar(50) | NO | DF_THANHTOAN_TrangThai = (N'Đang xử lý') |
| GhiChu | nvarchar(255) | YES |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_THANHTOAN | ThanhToanID |
| FK FK_THANHTOAN_DonDatVe | DonDatVeID → DONDATVE.DonDatVeID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_THANHTOAN_PhuongThuc | ([PhuongThuc]=N'TIEN_MAT' OR [PhuongThuc]=N'THE_QUOC_TE' OR [PhuongThuc]=N'THE_NOI_DIA' OR [PhuongThuc]=N'ZALOPAY' OR [PhuongThuc]=N'MOMO' OR [PhuongThuc]=N'VNPAY'); trusted=true, enabled=true |
| CHECK CK_THANHTOAN_SoTien | ([SoTien]>=(0)); trusted=true, enabled=true |
| CHECK CK_THANHTOAN_TrangThai | ([TrangThai]=N'Đã hoàn tiền' OR [TrangThai]=N'Thất bại' OR [TrangThai]=N'Thành công' OR [TrangThai]=N'Đang xử lý'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_THANHTOAN_DonDatVe | false; NONCLUSTERED | DonDatVeID ASC, TrangThai ASC | SoTien, NgayThanhToan, NgayTao |
| PK_THANHTOAN | true; CLUSTERED | ThanhToanID ASC |  |
| UQ_THANHTOAN_MaGiaoDich | true; NONCLUSTERED | MaGiaoDich ASC | ; WHERE ([MaGiaoDich] IS NOT NULL) |

#### THELOAI — 7 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| TheLoaiID | int | NO | IDENTITY(1,1) |
| TenTheLoai | nvarchar(100) | NO |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_THELOAI | TheLoaiID |
| UQ UQ_THELOAI_TenTheLoai | TenTheLoai |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_THELOAI | true; CLUSTERED | TheLoaiID ASC |  |
| UQ_THELOAI_TenTheLoai | true; NONCLUSTERED | TenTheLoai ASC |  |

#### VAITRO — 4 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| VaiTroID | int | NO | IDENTITY(1,1) |
| MaVaiTro | varchar(50) | NO |  |
| TenVaiTro | nvarchar(100) | NO |  |
| MoTa | nvarchar(255) | YES |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_VAITRO | VaiTroID |
| UQ UQ_VAITRO_MaVaiTro | MaVaiTro |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_VAITRO | true; CLUSTERED | VaiTroID ASC |  |
| UQ_VAITRO_MaVaiTro | true; NONCLUSTERED | MaVaiTro ASC |  |

#### VAITRO_QUYEN — 40 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| VaiTroID | int | NO |  |
| QuyenID | int | NO |  |
| NgayGan | datetime2 | NO | DF_VAITRO_QUYEN_NgayGan_ClockVN = ([dbo].[fn_BayGio]()) |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_VAITRO_QUYEN | VaiTroID, QuyenID |
| FK FK_VAITRO_QUYEN_Quyen | QuyenID → QUYEN.QuyenID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_VAITRO_QUYEN_VaiTro | VaiTroID → VAITRO.VaiTroID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| PK_VAITRO_QUYEN | true; CLUSTERED | VaiTroID ASC, QuyenID ASC |  |

#### XULY_KHIEUNAI — 0 dòng; PASS về hiện diện schema

| Cột | Kiểu | NULL | Identity/computed/default |
| --- | --- | --- | --- |
| XuLyID | int | NO | IDENTITY(1,1) |
| KhieuNaiID | int | NO |  |
| NguoiXuLyID | int | NO |  |
| NoiDungXuLy | nvarchar(MAX) | NO |  |
| NgayXuLy | datetime2 | NO | DF_XULY_KHIEUNAI_NgayXuLy_ClockVN = ([dbo].[fn_BayGio]()) |
| TrangThaiSauXuLy | nvarchar(50) | NO |  |

| Ràng buộc | Định nghĩa / quan hệ |
| --- | --- |
| PK PK_XULY_KHIEUNAI | XuLyID |
| FK FK_XULY_KHIEUNAI_KhieuNai | KhieuNaiID → KHIEUNAI.KhieuNaiID; DELETE CASCADE; UPDATE NO_ACTION; trusted=true, enabled=true |
| FK FK_XULY_KHIEUNAI_NguoiXuLy | NguoiXuLyID → NGUOIDUNG.NguoiDungID; DELETE NO_ACTION; UPDATE NO_ACTION; trusted=true, enabled=true |
| CHECK CK_XULY_KHIEUNAI_TrangThaiSauXuLy | ([TrangThaiSauXuLy]=N'Từ chối' OR [TrangThaiSauXuLy]=N'Đã đóng' OR [TrangThaiSauXuLy]=N'Đã giải quyết' OR [TrangThaiSauXuLy]=N'Đang xử lý'); trusted=true, enabled=true |

| Index | Unique / loại | Keys | INCLUDE / filter |
| --- | --- | --- | --- |
| IX_XULY_KHIEUNAI_KhieuNai | false; NONCLUSTERED | KhieuNaiID ASC, NgayXuLy DESC |  |
| PK_XULY_KHIEUNAI | true; CLUSTERED | XuLyID ASC |  |
