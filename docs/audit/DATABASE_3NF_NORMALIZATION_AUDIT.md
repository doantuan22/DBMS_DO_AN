# DATABASE 3NF NORMALIZATION AUDIT — CinemaBookingDB

**Ngày audit:** 13/10/2026. **Phạm vi:** source trong working tree hiện tại và runtime `CinemaBookingDB` cấu hình của dự án. **Chế độ:** chỉ đọc SQL Server; chỉ tạo tài liệu và bằng chứng audit trên filesystem.

## Phần 1 — Executive Summary

| Chỉ tiêu | Kết quả |
|---|---:|
| Bảng được kiểm kê và audit | 27 |
| Thuộc tính | 174 |
| 1NF PASS / FAIL / UNKNOWN | 27 / 0 / 0 |
| 2NF PASS / FAIL / UNKNOWN | 25 / 0 / 2 |
| 3NF PASS / FAIL / UNKNOWN | 22 / 1 / 4 |
| Bảng có vi phạm 3NF được chứng minh theo contract nghiệp vụ hiện hành | 1 — THANHTOAN |
| Bảng chưa đủ bằng chứng cho 3NF | 4 — RAPCHIEUPHIM, KHIEUNAI, BANGGIA, PHANCONG_RAP |
| Verdict | **NOT_3NF** |

**Kết luận trọng tâm:** Không thể chứng nhận toàn database đạt 3NF. `THANHTOAN` có FD nội quan hệ `DonDatVeID → SoTien` theo luồng nghiệp vụ hiện hành: mỗi lần thử thu toàn bộ tổng tiền của đơn, và việc sửa tổng vé bị cấm ngay khi có bất kỳ lần thử thanh toán. Một đơn có thể có nhiều lần thử. Vì thế determinant không là superkey, còn `SoTien` không là prime attribute trong mô hình khóa đã chứng minh. Đây là lý do FAIL; không phải chỉ vì thấy tiền bị lặp.

FD này là **CONFIRMED bằng business contract và các writer hiện hành**, không được enforce bằng một UNIQUE/CHECK trong bảng. Nó không được suy ra từ việc runtime hiện không có dòng sai. Nếu nghiệp vụ cho phép đổi số tiền giữa các lần thử, trả góp hoặc thu từng phần thì phải xác định lại FD và verdict của bảng; code hiện tại không cung cấp các thao tác đó.

Các giá mua trong `CHITIETVE`/`CHITIETDOAN`, tổng đơn trong `DONDATVE`, điểm bồi thường và các bộ đếm được đánh giá theo ngữ nghĩa lịch sử. Không đề nghị xóa các snapshot này chỉ vì có thể JOIN để tính lại.

### Phân biệt nguồn và giới hạn kết luận

- **Source SQL:** đọc lại các file CREATE TABLE, PK/UQ/FK/CHECK, unique index và các module nghiệp vụ. Dùng source trong working tree; đây không phải kết luận chỉ từ commit HEAD hoặc ERD.
- **Runtime Database:** kết nối cấu hình của dự án, chỉ chạy SELECT trên `CinemaBookingDB`; metadata thu lúc `2026-10-13T04:04:33.398Z`. Kết quả: 27 bảng, 174 cột, 31 FK, 169 SQL module.
- **Manifest:** chỉ làm nguồn đối chiếu sau khi đếm/parse source lại; không lấy 27/31 làm giả định đầu vào. Không chạy build, reset, seed, migration hoặc test có DML.
- **Tài liệu thiết kế:** `database/README.md`, `database/relational-schema.md`, seed và migration lịch sử được dùng để xác định ý nghĩa. `docs/FINAL_SYSTEM_AUDIT.md` được README tham chiếu nhưng không hiện diện trong checkout này; không dùng nó để xác nhận business rule.
- **Đối chiếu:** source và manifest khớp cột/kiểu/nullability/identity, PK/UQ, FK, CHECK và filtered unique predicate. Runtime khớp manifest về columns, keys, FK, checks, indexes, trạng thái trigger; cả 169 định nghĩa module khớp source sau chuẩn hóa token. Không phát hiện lệch nguồn ở các hạng mục này.
- **Giới hạn:** không chạy toàn bộ test suite vì SQL regression/fixtures có thao tác ghi. SELECT quan sát dữ liệu chỉ hỗ trợ kiểm tra trạng thái hiện tại, không chứng minh FD cho mọi trạng thái tương lai. Không thu dữ liệu cá nhân vào báo cáo.

### Quy tắc đánh giá

CK phải là khóa tối thiểu, định danh mọi tuple trên toàn quan hệ theo mô hình FD đã xác nhận. Superkey là mọi tập chứa ít nhất một CK; prime attribute thuộc ít nhất một CK. Filtered unique index chỉ chứng minh uniqueness trong tập thỏa predicate; cột nullable không tự trở thành CK toàn bảng.

1NF xét đơn vị giá trị được hệ thống lưu và sử dụng. Văn bản mô tả, địa chỉ, tên người hay nhãn hiển thị không bị tách chỉ vì chứa dấu phẩy. JSON/danh sách ở tham số được bung ra thành các bảng chi tiết; chuỗi tổng hợp trong view không phải cột của bảng cơ sở.

2NF kiểm tra mọi CK ghép đã chứng minh, gồm cả UQ ghép bên cạnh PK đơn. 3NF kiểm tra mọi FD không tầm thường `X → A`: `X` là superkey hoặc `A` prime. PASS cần lý do về đơn vị thực thể và phạm vi phụ thuộc của thuộc tính, không chỉ có PK. PASS của audit áp dụng cho mô hình nghiệp vụ hiện hành và các FD đã xác nhận từ code; không phải chứng nhận cho những business rule ngoài repository.

Tham chiếu định nghĩa: [Database System Concepts, chương Relational Database Design](https://www.db-book.com/Previous-editions/db5/slide-dir/ch7.pdf). Phân biệt UNIQUE/NULL và filtered index theo [Microsoft — Create a unique index](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/create-unique-indexes?view=sql-server-ver17) và [Microsoft — CREATE INDEX](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-index-transact-sql?view=sql-server-ver17).

## Phần 2 — Database Schema Inventory

Đếm trực tiếp source: **27 bảng dbo; 27 PK; 11 UQ constraint ngoài PK; 3 filtered unique index; 31 FK; 56 CHECK; 0 computed column**. Có 36 cột có DEFAULT theo metadata đã đối chiếu.

| Table | Thuộc tính | PK | CK chứng minh được trên toàn bảng | FK | UNIQUE / filtered unique |
|---|---:|---|---|---|---|
| dbo.BANGGIA | 9 | (GiaID) | (GiaID) | (RapID) → RAPCHIEUPHIM(RapID) | — |
| dbo.BOITHUONG_HUYSUAT | 5 | (BoiThuongID) | (BoiThuongID); (DonDatVeID) | (DonDatVeID) → DONDATVE(DonDatVeID) | (DonDatVeID) |
| dbo.CHITIETDOAN | 5 | (ChiTietDoAnID) | (ChiTietDoAnID); (DonDatVeID, SanPhamID) | (DonDatVeID) → DONDATVE(DonDatVeID); (SanPhamID) → SANPHAM(SanPhamID) | (DonDatVeID, SanPhamID) |
| dbo.CHITIETVE | 6 | (VeID) | (VeID); (MaVe) | (DonDatVeID) → DONDATVE(DonDatVeID); (GheID) → GHE(GheID) | (MaVe) |
| dbo.DANHGIAPHIM | 6 | (DanhGiaID) | (DanhGiaID); (PhimID, NguoiDungID) | (NguoiDungID) → NGUOIDUNG(NguoiDungID); (PhimID) → PHIM(PhimID) | (PhimID, NguoiDungID) |
| dbo.DIENVIEN | 4 | (DienVienID) | (DienVienID) | — | — |
| dbo.DONDATVE | 12 | (DonDatVeID) | (DonDatVeID) | (KhuyenMaiID) → KHUYENMAI(KhuyenMaiID); (NguoiDungID) → NGUOIDUNG(NguoiDungID); (SuatChieuID) → SUATCHIEU(SuatChieuID) | — |
| dbo.GHE | 6 | (GheID) | (GheID); (PhongID, HangGhe, SoGhe) | (PhongID) → PHONGCHIEU(PhongID) | (PhongID, HangGhe, SoGhe) |
| dbo.HINHANH_RAPCHIEUPHIM | 8 | (HinhAnhRapID) | (HinhAnhRapID) | (RapID) → RAPCHIEUPHIM(RapID) | (RapID) WHERE ([LaAnhDaiDien] = (1)) |
| dbo.HOSOKHACHHANG | 4 | (NguoiDungID) | (NguoiDungID) | (NguoiDungID) → NGUOIDUNG(NguoiDungID) | — |
| dbo.KHIEUNAI | 9 | (KhieuNaiID) | (KhieuNaiID) | (DonDatVeID) → DONDATVE(DonDatVeID); (NguoiDungID) → NGUOIDUNG(NguoiDungID) | — |
| dbo.KHUYENMAI | 12 | (KhuyenMaiID) | (KhuyenMaiID); (MaCode) | — | (MaCode) |
| dbo.NGUOIDUNG | 8 | (NguoiDungID) | (NguoiDungID); (Email) | (VaiTroID) → VAITRO(VaiTroID) | (Email); (SoDienThoai) WHERE ([SoDienThoai] IS NOT NULL) |
| dbo.PHANCONG_RAP | 6 | (PhanCongID) | (PhanCongID) | (NguoiDungID) → NGUOIDUNG(NguoiDungID); (RapID) → RAPCHIEUPHIM(RapID) | — |
| dbo.PHIM | 13 | (PhimID) | (PhimID) | — | — |
| dbo.PHIM_DIENVIEN | 3 | (PhimID, DienVienID) | (PhimID, DienVienID) | (DienVienID) → DIENVIEN(DienVienID); (PhimID) → PHIM(PhimID) | — |
| dbo.PHIM_THELOAI | 2 | (PhimID, TheLoaiID) | (PhimID, TheLoaiID) | (PhimID) → PHIM(PhimID); (TheLoaiID) → THELOAI(TheLoaiID) | — |
| dbo.PHONGCHIEU | 5 | (PhongID) | (PhongID); (RapID, TenPhong) | (RapID) → RAPCHIEUPHIM(RapID) | (RapID, TenPhong) |
| dbo.QUYEN | 4 | (QuyenID) | (QuyenID); (MaQuyen) | — | (MaQuyen) |
| dbo.RAPCHIEUPHIM | 8 | (RapID) | (RapID) | — | — |
| dbo.SANPHAM | 7 | (SanPhamID) | (SanPhamID) | — | — |
| dbo.SUATCHIEU | 8 | (SuatChieuID) | (SuatChieuID) | (PhimID) → PHIM(PhimID); (PhongID) → PHONGCHIEU(PhongID) | — |
| dbo.THANHTOAN | 9 | (ThanhToanID) | (ThanhToanID) | (DonDatVeID) → DONDATVE(DonDatVeID) | (MaGiaoDich) WHERE ([MaGiaoDich] IS NOT NULL) |
| dbo.THELOAI | 2 | (TheLoaiID) | (TheLoaiID); (TenTheLoai) | — | (TenTheLoai) |
| dbo.VAITRO | 4 | (VaiTroID) | (VaiTroID); (MaVaiTro) | — | (MaVaiTro) |
| dbo.VAITRO_QUYEN | 3 | (VaiTroID, QuyenID) | (VaiTroID, QuyenID) | (QuyenID) → QUYEN(QuyenID); (VaiTroID) → VAITRO(VaiTroID) | — |
| dbo.XULY_KHIEUNAI | 6 | (XuLyID) | (XuLyID) | (KhieuNaiID) → KHIEUNAI(KhieuNaiID); (NguoiXuLyID) → NGUOIDUNG(NguoiDungID) | — |

### Prime / non-prime attributes và superkey

Danh sách dưới đây dùng tất cả CK toàn bảng đã chứng minh từ source. Với bảng UNKNOWN, có thể còn business key chưa chốt; khi đó tập prime/non-prime cần được cập nhật. Filtered key không được đưa vào tập prime toàn quan hệ.

| Table | Prime attributes | Non-prime attributes | Một superkey ngoài CK |
|---|---|---|---|
| BANGGIA | GiaID | RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai | (GiaID, RapID) |
| BOITHUONG_HUYSUAT | BoiThuongID, DonDatVeID | DiemBoiThuong, NgayBoiThuong, GhiChu | (BoiThuongID, DiemBoiThuong) |
| CHITIETDOAN | ChiTietDoAnID, DonDatVeID, SanPhamID | SoLuong, DonGia | (ChiTietDoAnID, SoLuong) |
| CHITIETVE | VeID, MaVe | DonDatVeID, GheID, GiaVe, TrangThai | (VeID, DonDatVeID) |
| DANHGIAPHIM | DanhGiaID, PhimID, NguoiDungID | SoSao, NoiDung, NgayDanhGia | (DanhGiaID, SoSao) |
| DIENVIEN | DienVienID | HoTen, NgaySinh, QuocTich | (DienVienID, HoTen) |
| DONDATVE | DonDatVeID | NguoiDungID, SuatChieuID, KhuyenMaiID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai, HanGiuCho, LyDoHuy, ThongBaoHuy | (DonDatVeID, NguoiDungID) |
| GHE | GheID, PhongID, HangGhe, SoGhe | LoaiGhe, TrangThai | (GheID, LoaiGhe) |
| HINHANH_RAPCHIEUPHIM | HinhAnhRapID | RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao | (HinhAnhRapID, RapID) |
| HOSOKHACHHANG | NguoiDungID | NgaySinh, GioiTinh, DiemTichLuy | (NguoiDungID, NgaySinh) |
| KHIEUNAI | KhieuNaiID | NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai | (KhieuNaiID, NguoiDungID) |
| KHUYENMAI | KhuyenMaiID, MaCode | MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai | (KhuyenMaiID, MoTa) |
| NGUOIDUNG | NguoiDungID, Email | VaiTroID, HoTen, MatKhau, SoDienThoai, NgayTao, TrangThai | (NguoiDungID, VaiTroID) |
| PHANCONG_RAP | PhanCongID | NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai | (PhanCongID, NguoiDungID) |
| PHIM | PhimID | TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai | (PhimID, TenPhim) |
| PHIM_DIENVIEN | PhimID, DienVienID | VaiDien | (PhimID, DienVienID, VaiDien) |
| PHIM_THELOAI | PhimID, TheLoaiID | ∅ | Không cần thêm: toàn bộ thuộc tính đã tạo superkey |
| PHONGCHIEU | PhongID, RapID, TenPhong | LoaiPhong, TrangThai | (PhongID, LoaiPhong) |
| QUYEN | QuyenID, MaQuyen | TenQuyen, MoTa | (QuyenID, TenQuyen) |
| RAPCHIEUPHIM | RapID | TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai | (RapID, TenRap) |
| SANPHAM | SanPhamID | TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai | (SanPhamID, TenSanPham) |
| SUATCHIEU | SuatChieuID | PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai | (SuatChieuID, PhimID) |
| THANHTOAN | ThanhToanID | DonDatVeID, PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu | (ThanhToanID, DonDatVeID) |
| THELOAI | TheLoaiID, TenTheLoai | ∅ | Không cần thêm: toàn bộ thuộc tính đã tạo superkey |
| VAITRO | VaiTroID, MaVaiTro | TenVaiTro, MoTa | (VaiTroID, TenVaiTro) |
| VAITRO_QUYEN | VaiTroID, QuyenID | NgayGan | (VaiTroID, QuyenID, NgayGan) |
| XULY_KHIEUNAI | XuLyID | KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy | (XuLyID, KhieuNaiID) |

### UNIQUE chưa đủ để gọi là candidate key

- `NGUOIDUNG.SoDienThoai`: nullable và unique khi khác NULL — [database/04_indexes/nguoidung.sql:12](../../database/04_indexes/nguoidung.sql#L12). Có thể có nhiều tài khoản không khai số điện thoại.
- `THANHTOAN.MaGiaoDich`: nullable, chỉ unique khi khác NULL — [database/04_indexes/thanhtoan.sql:7](../../database/04_indexes/thanhtoan.sql#L7). Là khóa tra cứu có điều kiện; không chứng minh CK toàn bảng.
- `HINHANH_RAPCHIEUPHIM.RapID`: unique khi `LaAnhDaiDien=1` — [database/04_indexes/hinhanh_rapchieuphim.sql:8](../../database/04_indexes/hinhanh_rapchieuphim.sql#L8). Một rạp vẫn có nhiều ảnh thông thường.
- `(PhongID,ThoiGianBatDau)` chỉ có thể định danh suất không hủy trong một phạm vi lịch đang hoạt động; suất hủy có thể trùng khung giờ, nên không phải CK toàn SUATCHIEU.
- `(DonDatVeID,GheID)` chỉ có uniqueness của vé đang hiệu lực trong bối cảnh suất/đơn; lịch sử sửa ghế giữ vé hủy và có thể thêm lại ghế đó. Không coi nó là CK CHITIETVE.
- Khóa nghiệp vụ chưa enforce/toàn phần chưa chứng minh của RAPCHIEUPHIM, BANGGIA, PHANCONG_RAP và khiếu nại có đơn được phân tích ở U-001…U-004. Không giả định tên phim, tên diễn viên, URL ảnh hoặc timestamp là khóa.

## Phần 3 — Functional Dependency Analysis

Ký hiệu `R` là toàn bộ tập thuộc tính của chính bảng đang xét. Mỗi FD `K → R` dưới đây áp dụng cho từng CK liệt kê, kể cả CK ghép và CK thay thế. 2NF yêu cầu từng thuộc tính non-prime phụ thuộc đầy đủ vào mỗi CK; tính tối thiểu của CK một mình không chứng minh điều này. Phần giải thích kiểm tra determinant nhỏ hơn, FD bắc cầu và ranh giới giữa các thực thể.

### BANGGIA

- **Table:** dbo.BANGGIA
- **Functional Dependency:** `(GiaID) → R`
- **Determinant:** (GiaID) — các CK đã chứng minh.
- **Dependent Attributes:** GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai.
- **Evidence:** [database/02_tables/banggia.sql:2](../../database/02_tables/banggia.sql#L2); [database/03_constraints/001_primary_unique.sql:3](../../database/03_constraints/001_primary_unique.sql#L3); [database/08_procedures/admin/usp_Admin_Pricing_Create.sql:13](../../database/08_procedures/admin/usp_Admin_Pricing_Create.sql#L13)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Quy tắc giá có thời hạn và trạng thái; khóa nghiệp vụ toàn quan hệ chưa được xác định. Trigger chỉ bảo vệ các quy tắc đang Áp dụng có cùng bộ chiều.
- **Assessment:** 1NF PASS; 2NF UNKNOWN; 3NF UNKNOWN — xem U-003.

### BOITHUONG_HUYSUAT

- **Table:** dbo.BOITHUONG_HUYSUAT
- **Functional Dependency:** `(BoiThuongID) → R`; `(DonDatVeID) → R`
- **Determinant:** (BoiThuongID); (DonDatVeID) — các CK đã chứng minh.
- **Dependent Attributes:** BoiThuongID, DonDatVeID, DiemBoiThuong, NgayBoiThuong, GhiChu.
- **Evidence:** [database/02_tables/boithuong_huysuat.sql:3](../../database/02_tables/boithuong_huysuat.sql#L3); [database/02_tables/boithuong_huysuat.sql:4](../../database/02_tables/boithuong_huysuat.sql#L4); [database/02_tables/boithuong_huysuat.sql:5](../../database/02_tables/boithuong_huysuat.sql#L5); [database/08_procedures/system/sp_Showtime_CancelCascade.sql:252](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql#L252)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Hai CK đơn BoiThuongID và DonDatVeID. Điểm là kết quả sự kiện bồi thường của đơn; không có các tổng tiền bị sao chép trong bảng.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-006.

### CHITIETDOAN

- **Table:** dbo.CHITIETDOAN
- **Functional Dependency:** `(ChiTietDoAnID) → R`; `(DonDatVeID, SanPhamID) → R`
- **Determinant:** (ChiTietDoAnID); (DonDatVeID, SanPhamID) — các CK đã chứng minh.
- **Dependent Attributes:** ChiTietDoAnID, DonDatVeID, SanPhamID, SoLuong, DonGia.
- **Evidence:** [database/02_tables/chitietdoan.sql:2](../../database/02_tables/chitietdoan.sql#L2); [database/03_constraints/001_primary_unique.sql:9](../../database/03_constraints/001_primary_unique.sql#L9); [database/03_constraints/001_primary_unique.sql:159](../../database/03_constraints/001_primary_unique.sql#L159); [database/08_procedures/booking/sp_Booking_Create.sql:401](../../database/08_procedures/booking/sp_Booking_Create.sql#L401)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** SoLuong và DonGia gắn với cặp đơn–sản phẩm. Giá lịch sử có thể khác giữa các đơn; SanPhamID không xác định DonGia giao dịch.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-002.

### CHITIETVE

- **Table:** dbo.CHITIETVE
- **Functional Dependency:** `(VeID) → R`; `(MaVe) → R`
- **Determinant:** (VeID); (MaVe) — các CK đã chứng minh.
- **Dependent Attributes:** VeID, DonDatVeID, GheID, GiaVe, MaVe, TrangThai.
- **Evidence:** [database/02_tables/chitietve.sql:2](../../database/02_tables/chitietve.sql#L2); [database/03_constraints/001_primary_unique.sql:15](../../database/03_constraints/001_primary_unique.sql#L15); [database/03_constraints/001_primary_unique.sql:165](../../database/03_constraints/001_primary_unique.sql#L165); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:242](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L242)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** CK đơn VeID và MaVe. Giá thuộc lần phát hành vé. Hủy rồi thêm lại cùng ghế tạo vé mới, nên (DonDatVeID,GheID) không là CK toàn lịch sử.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-001.

### DANHGIAPHIM

- **Table:** dbo.DANHGIAPHIM
- **Functional Dependency:** `(DanhGiaID) → R`; `(PhimID, NguoiDungID) → R`
- **Determinant:** (DanhGiaID); (PhimID, NguoiDungID) — các CK đã chứng minh.
- **Dependent Attributes:** DanhGiaID, PhimID, NguoiDungID, SoSao, NoiDung, NgayDanhGia.
- **Evidence:** [database/02_tables/danhgiaphim.sql:2](../../database/02_tables/danhgiaphim.sql#L2); [database/03_constraints/001_primary_unique.sql:21](../../database/03_constraints/001_primary_unique.sql#L21); [database/03_constraints/001_primary_unique.sql:171](../../database/03_constraints/001_primary_unique.sql#L171); [database/08_procedures/customer/sp_Review_Create.sql:59](../../database/08_procedures/customer/sp_Review_Create.sql#L59)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Một đánh giá của một người cho một phim; SoSao, NoiDung, NgayDanhGia là thuộc tính của cặp phim–người, không của riêng phim/người.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### DIENVIEN

- **Table:** dbo.DIENVIEN
- **Functional Dependency:** `(DienVienID) → R`
- **Determinant:** (DienVienID) — các CK đã chứng minh.
- **Dependent Attributes:** DienVienID, HoTen, NgaySinh, QuocTich.
- **Evidence:** [database/02_tables/dienvien.sql:2](../../database/02_tables/dienvien.sql#L2); [database/03_constraints/001_primary_unique.sql:27](../../database/03_constraints/001_primary_unique.sql#L27); [database/08_procedures/admin/sp_Admin_Actor_Create.sql:11](../../database/08_procedures/admin/sp_Admin_Actor_Create.sql#L11)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** HoTen, NgaySinh, QuocTich là thuộc tính độc lập của diễn viên; tên không được xem là định danh duy nhất hay determinant của quốc tịch.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### DONDATVE

- **Table:** dbo.DONDATVE
- **Functional Dependency:** `(DonDatVeID) → R`
- **Determinant:** (DonDatVeID) — các CK đã chứng minh.
- **Dependent Attributes:** DonDatVeID, NguoiDungID, SuatChieuID, KhuyenMaiID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai, HanGiuCho, LyDoHuy, ThongBaoHuy.
- **Evidence:** [database/02_tables/dondatve.sql:2](../../database/02_tables/dondatve.sql#L2); [database/03_constraints/001_primary_unique.sql:33](../../database/03_constraints/001_primary_unique.sql#L33); [database/08_procedures/booking/sp_Booking_Create.sql:509](../../database/08_procedures/booking/sp_Booking_Create.sql#L509)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Các tổng tiền gắn với DonDatVeID. Chi tiết và phiên bản giá nằm ở quan hệ khác; không tồn tại FD nội bảng từ giá danh mục hiện tại tới tổng lịch sử.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-003.

### GHE

- **Table:** dbo.GHE
- **Functional Dependency:** `(GheID) → R`; `(PhongID, HangGhe, SoGhe) → R`
- **Determinant:** (GheID); (PhongID, HangGhe, SoGhe) — các CK đã chứng minh.
- **Dependent Attributes:** GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai.
- **Evidence:** [database/02_tables/ghe.sql:2](../../database/02_tables/ghe.sql#L2); [database/03_constraints/001_primary_unique.sql:39](../../database/03_constraints/001_primary_unique.sql#L39); [database/03_constraints/001_primary_unique.sql:177](../../database/03_constraints/001_primary_unique.sql#L177); [database/08_procedures/admin/usp_Admin_Seat_Update.sql:87](../../database/08_procedures/admin/usp_Admin_Seat_Update.sql#L87)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** CK tự nhiên (PhongID,HangGhe,SoGhe); LoaiGhe/TrangThai thuộc từng ghế và được cập nhật theo GheID, không theo riêng hàng/phòng.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### HINHANH_RAPCHIEUPHIM

- **Table:** dbo.HINHANH_RAPCHIEUPHIM
- **Functional Dependency:** `(HinhAnhRapID) → R`
- **Determinant:** (HinhAnhRapID) — các CK đã chứng minh.
- **Dependent Attributes:** HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao.
- **Evidence:** [database/02_tables/hinhanh_rapchieuphim.sql:2](../../database/02_tables/hinhanh_rapchieuphim.sql#L2); [database/03_constraints/001_primary_unique.sql:45](../../database/03_constraints/001_primary_unique.sql#L45); [database/08_procedures/admin/usp_Admin_CinemaImage_Create.sql:16](../../database/08_procedures/admin/usp_Admin_CinemaImage_Create.sql#L16)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Mỗi dòng là một ảnh của rạp; URL, mô tả, thứ tự và trạng thái theo HinhAnhRapID. RapID chỉ duy nhất trong tập ảnh đại diện.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### HOSOKHACHHANG

- **Table:** dbo.HOSOKHACHHANG
- **Functional Dependency:** `(NguoiDungID) → R`
- **Determinant:** (NguoiDungID) — các CK đã chứng minh.
- **Dependent Attributes:** NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy.
- **Evidence:** [database/02_tables/hosokhachhang.sql:2](../../database/02_tables/hosokhachhang.sql#L2); [database/03_constraints/001_primary_unique.sql:51](../../database/03_constraints/001_primary_unique.sql#L51); [database/08_procedures/auth/sp_User_UpdateProfile.sql:91](../../database/08_procedures/auth/sp_User_UpdateProfile.sql#L91)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** PK=FK NguoiDungID; ngày sinh và giới tính được cập nhật độc lập; điểm thay đổi theo các sự kiện của chính khách hàng.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-006.

### KHIEUNAI

- **Table:** dbo.KHIEUNAI
- **Functional Dependency:** `(KhieuNaiID) → R`
- **Determinant:** (KhieuNaiID) — các CK đã chứng minh.
- **Dependent Attributes:** KhieuNaiID, NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai.
- **Evidence:** [database/02_tables/khieunai.sql:2](../../database/02_tables/khieunai.sql#L2); [database/03_constraints/001_primary_unique.sql:57](../../database/03_constraints/001_primary_unique.sql#L57); [database/08_procedures/customer/sp_Complaint_Create.sql:53](../../database/08_procedures/customer/sp_Complaint_Create.sql#L53)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Người gửi luôn được lưu, đơn là tùy chọn. FD DonDatVeID→NguoiDungID xác nhận được trên tập khiếu nại có đơn qua SP; không suy rộng qua NULL.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF UNKNOWN — xem U-002.

### KHUYENMAI

- **Table:** dbo.KHUYENMAI
- **Functional Dependency:** `(KhuyenMaiID) → R`; `(MaCode) → R`
- **Determinant:** (KhuyenMaiID); (MaCode) — các CK đã chứng minh.
- **Dependent Attributes:** KhuyenMaiID, MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai.
- **Evidence:** [database/02_tables/khuyenmai.sql:2](../../database/02_tables/khuyenmai.sql#L2); [database/03_constraints/001_primary_unique.sql:63](../../database/03_constraints/001_primary_unique.sql#L63); [database/03_constraints/001_primary_unique.sql:183](../../database/03_constraints/001_primary_unique.sql#L183); [database/08_procedures/admin/sp_Admin_Promotion_Update.sql:66](../../database/08_procedures/admin/sp_Admin_Promotion_Update.sql#L66)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** CK đơn KhuyenMaiID và MaCode. LoaiGiamGia chỉ giới hạn miền GiaTriGiam, không xác định một giá trị giảm duy nhất. Bộ đếm theo mã.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-004.

### NGUOIDUNG

- **Table:** dbo.NGUOIDUNG
- **Functional Dependency:** `(NguoiDungID) → R`; `(Email) → R`
- **Determinant:** (NguoiDungID); (Email) — các CK đã chứng minh.
- **Dependent Attributes:** NguoiDungID, VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai.
- **Evidence:** [database/02_tables/nguoidung.sql:2](../../database/02_tables/nguoidung.sql#L2); [database/03_constraints/001_primary_unique.sql:69](../../database/03_constraints/001_primary_unique.sql#L69); [database/03_constraints/001_primary_unique.sql:189](../../database/03_constraints/001_primary_unique.sql#L189); [database/08_procedures/auth/sp_User_UpdateProfile.sql:71](../../database/08_procedures/auth/sp_User_UpdateProfile.sql#L71)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** CK đơn NguoiDungID và Email. HoTen, liên hệ, mật khẩu và trạng thái gắn với tài khoản; VaiTroID không xác định thông tin tài khoản.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### PHANCONG_RAP

- **Table:** dbo.PHANCONG_RAP
- **Functional Dependency:** `(PhanCongID) → R`
- **Determinant:** (PhanCongID) — các CK đã chứng minh.
- **Dependent Attributes:** PhanCongID, NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai.
- **Evidence:** [database/02_tables/phancong_rap.sql:2](../../database/02_tables/phancong_rap.sql#L2); [database/03_constraints/001_primary_unique.sql:75](../../database/03_constraints/001_primary_unique.sql#L75); [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:108](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L108)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** SP loại trùng toàn bộ nội dung phân công, xử lý ngày kết thúc NULL riêng. Chưa có CK toàn phần cho kỳ phân công hay quy tắc tối thiểu của business key.
- **Assessment:** 1NF PASS; 2NF UNKNOWN; 3NF UNKNOWN — xem U-004.

### PHIM

- **Table:** dbo.PHIM
- **Functional Dependency:** `(PhimID) → R`
- **Determinant:** (PhimID) — các CK đã chứng minh.
- **Dependent Attributes:** PhimID, TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai.
- **Evidence:** [database/02_tables/phim.sql:2](../../database/02_tables/phim.sql#L2); [database/03_constraints/001_primary_unique.sql:81](../../database/03_constraints/001_primary_unique.sql#L81); [database/08_procedures/admin/sp_Admin_Movie_Update.sql:64](../../database/08_procedures/admin/sp_Admin_Movie_Update.sql#L64)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Thuộc tính phim là các trường scalar; NgonNgu, PhuDe, DaoDien được đọc/ghi như văn bản hiển thị. Thể loại/diễn viên nhiều giá trị ở bảng liên kết.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### PHIM_DIENVIEN

- **Table:** dbo.PHIM_DIENVIEN
- **Functional Dependency:** `(PhimID, DienVienID) → R`
- **Determinant:** (PhimID, DienVienID) — các CK đã chứng minh.
- **Dependent Attributes:** PhimID, DienVienID, VaiDien.
- **Evidence:** [database/02_tables/phim_dienvien.sql:2](../../database/02_tables/phim_dienvien.sql#L2); [database/03_constraints/001_primary_unique.sql:87](../../database/03_constraints/001_primary_unique.sql#L87); [database/08_procedures/admin/sp_Admin_MovieActor_Set.sql:200](../../database/08_procedures/admin/sp_Admin_MovieActor_Set.sql#L200)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** VaiDien thuộc một diễn viên trong một phim; bảng input gồm DienVienID/VaiDien được thay riêng cho PhimID, không lưu VaiDien trong DIENVIEN.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### PHIM_THELOAI

- **Table:** dbo.PHIM_THELOAI
- **Functional Dependency:** `(PhimID, TheLoaiID) → R`
- **Determinant:** (PhimID, TheLoaiID) — các CK đã chứng minh.
- **Dependent Attributes:** PhimID, TheLoaiID.
- **Evidence:** [database/02_tables/phim_theloai.sql:2](../../database/02_tables/phim_theloai.sql#L2); [database/03_constraints/001_primary_unique.sql:93](../../database/03_constraints/001_primary_unique.sql#L93); [database/08_procedures/admin/sp_Admin_Movie_Create.sql:96](../../database/08_procedures/admin/sp_Admin_Movie_Create.sql#L96)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Chỉ có hai thuộc tính thuộc PK ghép; không có non-prime attribute. Mọi FD có RHS prime nên đạt 3NF theo định nghĩa.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### PHONGCHIEU

- **Table:** dbo.PHONGCHIEU
- **Functional Dependency:** `(PhongID) → R`; `(RapID, TenPhong) → R`
- **Determinant:** (PhongID); (RapID, TenPhong) — các CK đã chứng minh.
- **Dependent Attributes:** PhongID, RapID, TenPhong, LoaiPhong, TrangThai.
- **Evidence:** [database/02_tables/phongchieu.sql:2](../../database/02_tables/phongchieu.sql#L2); [database/03_constraints/001_primary_unique.sql:99](../../database/03_constraints/001_primary_unique.sql#L99); [database/03_constraints/001_primary_unique.sql:195](../../database/03_constraints/001_primary_unique.sql#L195); [database/08_procedures/admin/usp_Admin_Room_Update.sql:66](../../database/08_procedures/admin/usp_Admin_Room_Update.sql#L66)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** CK tự nhiên (RapID,TenPhong); tên phòng được dùng lại giữa rạp. LoaiPhong/TrangThai được sửa cho một PhongID cụ thể.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### QUYEN

- **Table:** dbo.QUYEN
- **Functional Dependency:** `(QuyenID) → R`; `(MaQuyen) → R`
- **Determinant:** (QuyenID); (MaQuyen) — các CK đã chứng minh.
- **Dependent Attributes:** QuyenID, MaQuyen, TenQuyen, MoTa.
- **Evidence:** [database/02_tables/quyen.sql:2](../../database/02_tables/quyen.sql#L2); [database/03_constraints/001_primary_unique.sql:105](../../database/03_constraints/001_primary_unique.sql#L105); [database/03_constraints/001_primary_unique.sql:201](../../database/03_constraints/001_primary_unique.sql#L201); [database/10_seed/seed_base/002_reference.sql:9](../../database/10_seed/seed_base/002_reference.sql#L9)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** QuyenID/MaQuyen xác định tên và mô tả của một quyền. Không có cột tên vai trò hay thông tin tài khoản bị lặp trong quan hệ.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### RAPCHIEUPHIM

- **Table:** dbo.RAPCHIEUPHIM
- **Functional Dependency:** `(RapID) → R`
- **Determinant:** (RapID) — các CK đã chứng minh.
- **Dependent Attributes:** RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai.
- **Evidence:** [database/02_tables/rapchieuphim.sql:2](../../database/02_tables/rapchieuphim.sql#L2); [database/03_constraints/001_primary_unique.sql:111](../../database/03_constraints/001_primary_unique.sql#L111); [database/08_procedures/admin/sp_Admin_Cinema_Create.sql:11](../../database/08_procedures/admin/sp_Admin_Cinema_Create.sql#L11)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** DiaChi và ThanhPho là hai tham số độc lập; seed dùng địa chỉ mô phỏng không chứa thành phố. Chưa có đặc tả địa chỉ đủ để quyết định FD nghiệp vụ.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF UNKNOWN — xem U-001.

### SANPHAM

- **Table:** dbo.SANPHAM
- **Functional Dependency:** `(SanPhamID) → R`
- **Determinant:** (SanPhamID) — các CK đã chứng minh.
- **Dependent Attributes:** SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai.
- **Evidence:** [database/02_tables/sanpham.sql:2](../../database/02_tables/sanpham.sql#L2); [database/03_constraints/001_primary_unique.sql:117](../../database/03_constraints/001_primary_unique.sql#L117); [database/08_procedures/admin/sp_Admin_Product_Update.sql:51](../../database/08_procedures/admin/sp_Admin_Product_Update.sql#L51)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Một dòng là một sản phẩm/SKU, kể cả combo. LoaiSanPham không xác định Gia; seed có bắp nhỏ/lớn cùng loại và khác giá.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### SUATCHIEU

- **Table:** dbo.SUATCHIEU
- **Functional Dependency:** `(SuatChieuID) → R`
- **Determinant:** (SuatChieuID) — các CK đã chứng minh.
- **Dependent Attributes:** SuatChieuID, PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai.
- **Evidence:** [database/02_tables/suatchieu.sql:2](../../database/02_tables/suatchieu.sql#L2); [database/03_constraints/001_primary_unique.sql:123](../../database/03_constraints/001_primary_unique.sql#L123); [database/08_procedures/system/sp_Showtime_ValidateTimes.sql:38](../../database/08_procedures/system/sp_Showtime_ValidateTimes.sql#L38)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Giờ kết thúc là đầu vào độc lập trong một khoảng cho phép; DinhDang/GiaVeCoBan là cấu hình suất. (PhimID,ThoiGianBatDau) không xác định giờ kết thúc.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-007.

### THANHTOAN

- **Table:** dbo.THANHTOAN
- **Functional Dependency:** `(ThanhToanID) → R`
- **Determinant:** (ThanhToanID) — các CK đã chứng minh.
- **Dependent Attributes:** ThanhToanID, DonDatVeID, PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu.
- **Evidence:** [database/02_tables/thanhtoan.sql:2](../../database/02_tables/thanhtoan.sql#L2); [database/03_constraints/001_primary_unique.sql:129](../../database/03_constraints/001_primary_unique.sql#L129); [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:96](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Theo contract hiện hành: DonDatVeID→SoTien; có nhiều lần thử cho một đơn, DonDatVeID không là superkey và SoTien không prime.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF FAIL — xem N-001.

### THELOAI

- **Table:** dbo.THELOAI
- **Functional Dependency:** `(TheLoaiID) → R`; `(TenTheLoai) → R`
- **Determinant:** (TheLoaiID); (TenTheLoai) — các CK đã chứng minh.
- **Dependent Attributes:** TheLoaiID, TenTheLoai.
- **Evidence:** [database/02_tables/theloai.sql:2](../../database/02_tables/theloai.sql#L2); [database/03_constraints/001_primary_unique.sql:135](../../database/03_constraints/001_primary_unique.sql#L135); [database/03_constraints/001_primary_unique.sql:207](../../database/03_constraints/001_primary_unique.sql#L207); [database/08_procedures/admin/sp_Admin_Genre_Create.sql:8](../../database/08_procedures/admin/sp_Admin_Genre_Create.sql#L8)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Hai thuộc tính đều prime nhờ CK TheLoaiID và TenTheLoai; mọi FD không tầm thường có RHS prime.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### VAITRO

- **Table:** dbo.VAITRO
- **Functional Dependency:** `(VaiTroID) → R`; `(MaVaiTro) → R`
- **Determinant:** (VaiTroID); (MaVaiTro) — các CK đã chứng minh.
- **Dependent Attributes:** VaiTroID, MaVaiTro, TenVaiTro, MoTa.
- **Evidence:** [database/02_tables/vaitro.sql:2](../../database/02_tables/vaitro.sql#L2); [database/03_constraints/001_primary_unique.sql:141](../../database/03_constraints/001_primary_unique.sql#L141); [database/03_constraints/001_primary_unique.sql:213](../../database/03_constraints/001_primary_unique.sql#L213); [database/10_seed/seed_base/001_reference.sql:9](../../database/10_seed/seed_base/001_reference.sql#L9)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** VaiTroID/MaVaiTro định danh vai trò; tên/mô tả là nhãn của vai trò. Không suy FD từ timestamp seed hoặc giá trị hiện tại của ma trận cố định.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### VAITRO_QUYEN

- **Table:** dbo.VAITRO_QUYEN
- **Functional Dependency:** `(VaiTroID, QuyenID) → R`
- **Determinant:** (VaiTroID, QuyenID) — các CK đã chứng minh.
- **Dependent Attributes:** VaiTroID, QuyenID, NgayGan.
- **Evidence:** [database/02_tables/vaitro_quyen.sql:2](../../database/02_tables/vaitro_quyen.sql#L2); [database/03_constraints/001_primary_unique.sql:147](../../database/03_constraints/001_primary_unique.sql#L147); [database/10_seed/seed_base/003_reference.sql:8](../../database/10_seed/seed_base/003_reference.sql#L8)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** NgayGan mô tả sự kiện gán một quyền cho một vai trò; mỗi vế có nhiều quan hệ, ngày không phải thuộc tính riêng của vai trò hoặc quyền.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS.

### XULY_KHIEUNAI

- **Table:** dbo.XULY_KHIEUNAI
- **Functional Dependency:** `(XuLyID) → R`
- **Determinant:** (XuLyID) — các CK đã chứng minh.
- **Dependent Attributes:** XuLyID, KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy.
- **Evidence:** [database/02_tables/xuly_khieunai.sql:2](../../database/02_tables/xuly_khieunai.sql#L2); [database/03_constraints/001_primary_unique.sql:153](../../database/03_constraints/001_primary_unique.sql#L153); [database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql:60](../../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql#L60)
- **Classification:** CONFIRMED cho các FD từ khóa; các FD khác chỉ xác nhận khi có chứng cứ riêng bên dưới.
- **Impact on Normalization:** Một dòng là một sự kiện xử lý. KhieuNaiID không xác định trạng thái lịch sử, người xử lý hoặc nội dung của mọi sự kiện.
- **Assessment:** 1NF PASS; 2NF PASS; 3NF PASS — xem S-005.

### Kiểm tra phụ thuộc bộ phận của tất cả CK ghép

| Quan hệ | CK ghép | Non-prime cần kiểm tra | Phân tích |
|---|---|---|---|
| VAITRO_QUYEN | (VaiTroID,QuyenID) | NgayGan | Ngày gắn của quan hệ; vai trò có nhiều quyền và quyền có nhiều vai trò. [database/03_constraints/005_function_defaults.sql:39](../../database/03_constraints/005_function_defaults.sql#L39) lấy thời điểm khi gán, không theo riêng role/quyền. [database/10_seed/seed_base/003_reference.sql:43](../../database/10_seed/seed_base/003_reference.sql#L43) chủ động đưa mọi timestamp về ngày seed để ổn định fixture; đây không là business FD role→ngày hay ∅→ngày cho quan hệ tổng quát. |
| PHIM_THELOAI | (PhimID,TheLoaiID) | ∅ | Không có thuộc tính không khóa để tạo partial dependency. |
| PHIM_DIENVIEN | (PhimID,DienVienID) | VaiDien | Diễn viên đóng vai khác nhau trong các phim; tên vai của phim không định danh diễn viên. SP gán vai cho từng cặp, không cho riêng một vế. |
| PHONGCHIEU | (RapID,TenPhong) | LoaiPhong,TrangThai | Phòng được định danh trong rạp; rạp có nhiều loại/trạng thái phòng, tên phòng có thể dùng lại ở rạp khác. Writer sửa một PhongID. |
| GHE | (PhongID,HangGhe,SoGhe) | LoaiGhe,TrangThai | Loại và trạng thái là thuộc tính từng ghế. Writer nhận LoaiGhe cho GheID, không có rule cả hàng cùng loại. Số ghế/hàng dùng lại giữa phòng. |
| CHITIETDOAN | (DonDatVeID,SanPhamID) | SoLuong,DonGia | Một đơn có nhiều sản phẩm, một sản phẩm được bán trong nhiều đơn; số lượng theo dòng, đơn giá theo thời điểm mua. |
| DANHGIAPHIM | (PhimID,NguoiDungID) | SoSao,NoiDung,NgayDanhGia | Điểm và nội dung là đánh giá của một người cho một phim; không là dữ liệu chung của người/phim. |

BANGGIA và PHANCONG_RAP có tổ hợp business key tiềm năng chưa đủ bằng chứng về tính toàn phần/tối thiểu. Không bỏ qua chúng chỉ vì PK hiện tại là số nguyên; do đó 2NF UNKNOWN cho hai bảng này.

## Phần 4 — Normalization Assessment

| Table | 1NF | 2NF | 3NF | Evidence | Findings |
|---|---|---|---|---|---|
| dbo.BANGGIA | PASS | UNKNOWN | UNKNOWN | [database/02_tables/banggia.sql:2](../../database/02_tables/banggia.sql#L2); [database/03_constraints/001_primary_unique.sql:3](../../database/03_constraints/001_primary_unique.sql#L3); [database/08_procedures/admin/usp_Admin_Pricing_Create.sql:13](../../database/08_procedures/admin/usp_Admin_Pricing_Create.sql#L13) | U-003 |
| dbo.BOITHUONG_HUYSUAT | PASS | PASS | PASS | [database/02_tables/boithuong_huysuat.sql:3](../../database/02_tables/boithuong_huysuat.sql#L3); [database/02_tables/boithuong_huysuat.sql:4](../../database/02_tables/boithuong_huysuat.sql#L4); [database/02_tables/boithuong_huysuat.sql:5](../../database/02_tables/boithuong_huysuat.sql#L5); [database/08_procedures/system/sp_Showtime_CancelCascade.sql:252](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql#L252) | S-006 |
| dbo.CHITIETDOAN | PASS | PASS | PASS | [database/02_tables/chitietdoan.sql:2](../../database/02_tables/chitietdoan.sql#L2); [database/03_constraints/001_primary_unique.sql:9](../../database/03_constraints/001_primary_unique.sql#L9); [database/03_constraints/001_primary_unique.sql:159](../../database/03_constraints/001_primary_unique.sql#L159); [database/08_procedures/booking/sp_Booking_Create.sql:401](../../database/08_procedures/booking/sp_Booking_Create.sql#L401) | S-002 |
| dbo.CHITIETVE | PASS | PASS | PASS | [database/02_tables/chitietve.sql:2](../../database/02_tables/chitietve.sql#L2); [database/03_constraints/001_primary_unique.sql:15](../../database/03_constraints/001_primary_unique.sql#L15); [database/03_constraints/001_primary_unique.sql:165](../../database/03_constraints/001_primary_unique.sql#L165); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:242](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L242) | S-001 |
| dbo.DANHGIAPHIM | PASS | PASS | PASS | [database/02_tables/danhgiaphim.sql:2](../../database/02_tables/danhgiaphim.sql#L2); [database/03_constraints/001_primary_unique.sql:21](../../database/03_constraints/001_primary_unique.sql#L21); [database/03_constraints/001_primary_unique.sql:171](../../database/03_constraints/001_primary_unique.sql#L171); [database/08_procedures/customer/sp_Review_Create.sql:59](../../database/08_procedures/customer/sp_Review_Create.sql#L59) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.DIENVIEN | PASS | PASS | PASS | [database/02_tables/dienvien.sql:2](../../database/02_tables/dienvien.sql#L2); [database/03_constraints/001_primary_unique.sql:27](../../database/03_constraints/001_primary_unique.sql#L27); [database/08_procedures/admin/sp_Admin_Actor_Create.sql:11](../../database/08_procedures/admin/sp_Admin_Actor_Create.sql#L11) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.DONDATVE | PASS | PASS | PASS | [database/02_tables/dondatve.sql:2](../../database/02_tables/dondatve.sql#L2); [database/03_constraints/001_primary_unique.sql:33](../../database/03_constraints/001_primary_unique.sql#L33); [database/08_procedures/booking/sp_Booking_Create.sql:509](../../database/08_procedures/booking/sp_Booking_Create.sql#L509) | S-003 |
| dbo.GHE | PASS | PASS | PASS | [database/02_tables/ghe.sql:2](../../database/02_tables/ghe.sql#L2); [database/03_constraints/001_primary_unique.sql:39](../../database/03_constraints/001_primary_unique.sql#L39); [database/03_constraints/001_primary_unique.sql:177](../../database/03_constraints/001_primary_unique.sql#L177); [database/08_procedures/admin/usp_Admin_Seat_Update.sql:87](../../database/08_procedures/admin/usp_Admin_Seat_Update.sql#L87) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.HINHANH_RAPCHIEUPHIM | PASS | PASS | PASS | [database/02_tables/hinhanh_rapchieuphim.sql:2](../../database/02_tables/hinhanh_rapchieuphim.sql#L2); [database/03_constraints/001_primary_unique.sql:45](../../database/03_constraints/001_primary_unique.sql#L45); [database/08_procedures/admin/usp_Admin_CinemaImage_Create.sql:16](../../database/08_procedures/admin/usp_Admin_CinemaImage_Create.sql#L16) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.HOSOKHACHHANG | PASS | PASS | PASS | [database/02_tables/hosokhachhang.sql:2](../../database/02_tables/hosokhachhang.sql#L2); [database/03_constraints/001_primary_unique.sql:51](../../database/03_constraints/001_primary_unique.sql#L51); [database/08_procedures/auth/sp_User_UpdateProfile.sql:91](../../database/08_procedures/auth/sp_User_UpdateProfile.sql#L91) | S-006 |
| dbo.KHIEUNAI | PASS | PASS | UNKNOWN | [database/02_tables/khieunai.sql:2](../../database/02_tables/khieunai.sql#L2); [database/03_constraints/001_primary_unique.sql:57](../../database/03_constraints/001_primary_unique.sql#L57); [database/08_procedures/customer/sp_Complaint_Create.sql:53](../../database/08_procedures/customer/sp_Complaint_Create.sql#L53) | U-002 |
| dbo.KHUYENMAI | PASS | PASS | PASS | [database/02_tables/khuyenmai.sql:2](../../database/02_tables/khuyenmai.sql#L2); [database/03_constraints/001_primary_unique.sql:63](../../database/03_constraints/001_primary_unique.sql#L63); [database/03_constraints/001_primary_unique.sql:183](../../database/03_constraints/001_primary_unique.sql#L183); [database/08_procedures/admin/sp_Admin_Promotion_Update.sql:66](../../database/08_procedures/admin/sp_Admin_Promotion_Update.sql#L66) | S-004 |
| dbo.NGUOIDUNG | PASS | PASS | PASS | [database/02_tables/nguoidung.sql:2](../../database/02_tables/nguoidung.sql#L2); [database/03_constraints/001_primary_unique.sql:69](../../database/03_constraints/001_primary_unique.sql#L69); [database/03_constraints/001_primary_unique.sql:189](../../database/03_constraints/001_primary_unique.sql#L189); [database/08_procedures/auth/sp_User_UpdateProfile.sql:71](../../database/08_procedures/auth/sp_User_UpdateProfile.sql#L71) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.PHANCONG_RAP | PASS | UNKNOWN | UNKNOWN | [database/02_tables/phancong_rap.sql:2](../../database/02_tables/phancong_rap.sql#L2); [database/03_constraints/001_primary_unique.sql:75](../../database/03_constraints/001_primary_unique.sql#L75); [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:108](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L108) | U-004 |
| dbo.PHIM | PASS | PASS | PASS | [database/02_tables/phim.sql:2](../../database/02_tables/phim.sql#L2); [database/03_constraints/001_primary_unique.sql:81](../../database/03_constraints/001_primary_unique.sql#L81); [database/08_procedures/admin/sp_Admin_Movie_Update.sql:64](../../database/08_procedures/admin/sp_Admin_Movie_Update.sql#L64) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.PHIM_DIENVIEN | PASS | PASS | PASS | [database/02_tables/phim_dienvien.sql:2](../../database/02_tables/phim_dienvien.sql#L2); [database/03_constraints/001_primary_unique.sql:87](../../database/03_constraints/001_primary_unique.sql#L87); [database/08_procedures/admin/sp_Admin_MovieActor_Set.sql:200](../../database/08_procedures/admin/sp_Admin_MovieActor_Set.sql#L200) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.PHIM_THELOAI | PASS | PASS | PASS | [database/02_tables/phim_theloai.sql:2](../../database/02_tables/phim_theloai.sql#L2); [database/03_constraints/001_primary_unique.sql:93](../../database/03_constraints/001_primary_unique.sql#L93); [database/08_procedures/admin/sp_Admin_Movie_Create.sql:96](../../database/08_procedures/admin/sp_Admin_Movie_Create.sql#L96) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.PHONGCHIEU | PASS | PASS | PASS | [database/02_tables/phongchieu.sql:2](../../database/02_tables/phongchieu.sql#L2); [database/03_constraints/001_primary_unique.sql:99](../../database/03_constraints/001_primary_unique.sql#L99); [database/03_constraints/001_primary_unique.sql:195](../../database/03_constraints/001_primary_unique.sql#L195); [database/08_procedures/admin/usp_Admin_Room_Update.sql:66](../../database/08_procedures/admin/usp_Admin_Room_Update.sql#L66) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.QUYEN | PASS | PASS | PASS | [database/02_tables/quyen.sql:2](../../database/02_tables/quyen.sql#L2); [database/03_constraints/001_primary_unique.sql:105](../../database/03_constraints/001_primary_unique.sql#L105); [database/03_constraints/001_primary_unique.sql:201](../../database/03_constraints/001_primary_unique.sql#L201); [database/10_seed/seed_base/002_reference.sql:9](../../database/10_seed/seed_base/002_reference.sql#L9) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.RAPCHIEUPHIM | PASS | PASS | UNKNOWN | [database/02_tables/rapchieuphim.sql:2](../../database/02_tables/rapchieuphim.sql#L2); [database/03_constraints/001_primary_unique.sql:111](../../database/03_constraints/001_primary_unique.sql#L111); [database/08_procedures/admin/sp_Admin_Cinema_Create.sql:11](../../database/08_procedures/admin/sp_Admin_Cinema_Create.sql#L11) | U-001 |
| dbo.SANPHAM | PASS | PASS | PASS | [database/02_tables/sanpham.sql:2](../../database/02_tables/sanpham.sql#L2); [database/03_constraints/001_primary_unique.sql:117](../../database/03_constraints/001_primary_unique.sql#L117); [database/08_procedures/admin/sp_Admin_Product_Update.sql:51](../../database/08_procedures/admin/sp_Admin_Product_Update.sql#L51) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.SUATCHIEU | PASS | PASS | PASS | [database/02_tables/suatchieu.sql:2](../../database/02_tables/suatchieu.sql#L2); [database/03_constraints/001_primary_unique.sql:123](../../database/03_constraints/001_primary_unique.sql#L123); [database/08_procedures/system/sp_Showtime_ValidateTimes.sql:38](../../database/08_procedures/system/sp_Showtime_ValidateTimes.sql#L38) | S-007 |
| dbo.THANHTOAN | PASS | PASS | FAIL | [database/02_tables/thanhtoan.sql:2](../../database/02_tables/thanhtoan.sql#L2); [database/03_constraints/001_primary_unique.sql:129](../../database/03_constraints/001_primary_unique.sql#L129); [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:96](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96) | N-001 |
| dbo.THELOAI | PASS | PASS | PASS | [database/02_tables/theloai.sql:2](../../database/02_tables/theloai.sql#L2); [database/03_constraints/001_primary_unique.sql:135](../../database/03_constraints/001_primary_unique.sql#L135); [database/03_constraints/001_primary_unique.sql:207](../../database/03_constraints/001_primary_unique.sql#L207); [database/08_procedures/admin/sp_Admin_Genre_Create.sql:8](../../database/08_procedures/admin/sp_Admin_Genre_Create.sql#L8) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.VAITRO | PASS | PASS | PASS | [database/02_tables/vaitro.sql:2](../../database/02_tables/vaitro.sql#L2); [database/03_constraints/001_primary_unique.sql:141](../../database/03_constraints/001_primary_unique.sql#L141); [database/03_constraints/001_primary_unique.sql:213](../../database/03_constraints/001_primary_unique.sql#L213); [database/10_seed/seed_base/001_reference.sql:9](../../database/10_seed/seed_base/001_reference.sql#L9) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.VAITRO_QUYEN | PASS | PASS | PASS | [database/02_tables/vaitro_quyen.sql:2](../../database/02_tables/vaitro_quyen.sql#L2); [database/03_constraints/001_primary_unique.sql:147](../../database/03_constraints/001_primary_unique.sql#L147); [database/10_seed/seed_base/003_reference.sql:8](../../database/10_seed/seed_base/003_reference.sql#L8) | Không có finding chuẩn hóa theo mô hình FD đã xác nhận; lý do ở Phần 3. |
| dbo.XULY_KHIEUNAI | PASS | PASS | PASS | [database/02_tables/xuly_khieunai.sql:2](../../database/02_tables/xuly_khieunai.sql#L2); [database/03_constraints/001_primary_unique.sql:153](../../database/03_constraints/001_primary_unique.sql#L153); [database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql:60](../../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql#L60) | S-005 |

1NF PASS dựa trên hình thức giá trị và cách dùng thực tế: không có cột lặp kiểu Ghe1/Ghe2, không có danh sách FK lưu trong bảng cơ sở, không có cột JSON mô hình hóa tập chi tiết. Các input CSV/JSON trong SP được parse và ghi thành nhiều dòng. PHIM.DaoDien/NgonNgu/PhuDe và PHIM_DIENVIEN.VaiDien hiện là văn bản hiển thị opaque, không được parse thành thực thể con; nếu nghiệp vụ cần truy vấn từng đạo diễn/ngôn ngữ/vai như thực thể thì phải audit lại 1NF theo miền mới.

## Phần 5 — Confirmed Normalization Violations

### N-001 — THANHTOAN

- **Finding ID:** N-001
- **Table:** `THANHTOAN`
- **Severity:** MEDIUM — thiết kế chuẩn hóa; không phải incident mất tiền được phát hiện
- **Normalization Level:** 3NF — FAIL; 1NF/2NF PASS
- **Functional Dependency:** `DonDatVeID → SoTien`
- **Determinant:** DonDatVeID
- **Dependent Attributes:** SoTien
- **Classification:** CONFIRMED — business FD trong contract thanh toán hiện hành; không là constraint khai báo
- **Evidence File:** `database/08_procedures/payment/sp_Payment_CreateAttempt.sql`; `database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql`; `database/08_procedures/payment/sp_Payment_UpdateResult.sql`; `database/README.md`; `database/04_indexes/thanhtoan.sql`
- **Source Location:** [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:96](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96); [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:138](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L138); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:98](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L98); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:279](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L279); [database/08_procedures/payment/sp_Payment_UpdateResult.sql:159](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L159); [database/README.md:80](../../database/README.md#L80); [database/04_indexes/thanhtoan.sql:3](../../database/04_indexes/thanhtoan.sql#L3)
- **Explanation:** Mỗi attempt dùng tổng tiền của đơn. Từ lần thử đầu tiên, writer duy nhất cho phép đổi TongTienVe đã bị chặn; writer thanh toán chỉ cập nhật trạng thái/ngày/ghi chú, và hủy/hết hạn/hủy suất không đổi tổng tiền/SoTien. API không có thu từng phần, sửa attempt amount hay tự nguyện hoàn tiền. Đơn có thể tạo nhiều attempt; DonDatVeID không xác định ThanhToanID/PhuongThuc/NgayTao/TrangThai. SoTien không thuộc CK toàn bảng đã xác nhận. Vì thế FD không tầm thường này vi phạm điều kiện 3NF bên trong THANHTOAN.
- **Recommendation:** Chốt việc giữ redundancy có chủ đích hoặc duyệt decomposition ở Phần 9. Không tự xóa snapshot thanh toán hay sửa nghiệp vụ.
- **Confidence:** HIGH trong contract hiện hành; không mở rộng tới nghiệp vụ thanh toán chưa tồn tại


### Chứng minh cụ thể N-001

1. **Tạo dữ liệu:** `sp_Payment_CreateAttempt` lấy `@Amount = TongTienVe + TongTienDoAn - TienGiamGia` từ DONDATVE, rồi ghi SoTien của attempt. Không có tham số số tiền độc lập.
2. **Bất biến cần thiết:** `sp_StaffBooking_UpdateSeats` là writer thay tổng vé của đơn cũ, nhưng từ chối khi EXISTS bất kỳ THANHTOAN của đơn (`50514`), kể cả attempt thất bại. Nó cũng không cho đổi khuyến mãi/đồ ăn. Booking khởi tạo đơn mới; các writer vòng đời chỉ đổi trạng thái/hold/lý do.
3. **Nhiều tuple chung determinant:** thủ tục tạo attempt không áp đặt UNIQUE(DonDatVeID); retry được phép khi đơn còn chờ và chưa hết hạn. Runtime có một đơn nhiều attempt, nhưng tính khả dụng của retry trong source mới là chứng cứ rule.
4. **FD nội quan hệ:** mặc dù cách lấy tiền có JOIN/đọc bảng khác, kết quả là mọi tuple THANHTOAN cùng DonDatVeID phải có cùng SoTien theo business contract. Đây khác với việc chỉ thấy một thuộc tính ở bảng khác có thể JOIN.
5. **Superkey:** `DonDatVeID+` trong tập FD của THANHTOAN chứa DonDatVeID và SoTien, không chứa ThanhToanID và toàn bộ attempt. Không là superkey.
6. **Prime:** CK toàn bảng chứng minh được là `(ThanhToanID)`. MaGiaoDich nullable/filtered không là CK toàn bảng; SoTien non-prime. Không có business key chứa SoTien tối thiểu và toàn phần nào được code cam kết.
7. **Transitive:** `ThanhToanID → DonDatVeID → SoTien`; determinant ở bước giữa không là superkey. Không có partial dependency vào PK đơn nên không là lỗi 2NF.

### Anomaly và giới hạn rủi ro

- **Update anomaly:** sửa lượng tiền được thu cho một đơn bằng công cụ quản trị/import mà chỉ cập nhật một attempt sẽ làm các attempt bất nhất; các writer hiện hành chặn thay đổi này nên đây là rủi ro khi vượt contract, chưa phải lỗi runtime được quan sát.
- **Insert anomaly:** khi thêm retry ngoài SP phải lặp lại đúng tiền của đơn; PK/FK/CHECK không chặn amount khác. Một đơn chưa có attempt không thể có “số tiền chung của các attempt” trong THANHTOAN; tổng nghĩa vụ vẫn tồn tại ở DONDATVE, nên không tuyên bố hệ thống hiện không lưu được số tiền của đơn.
- **Delete anomaly:** xóa attempt cuối cùng làm mất biểu diễn số tiền trong lịch sử attempt; tổng đơn vẫn còn. Không suy ra rằng xóa đó sẽ làm mất toàn bộ tổng tiền của hệ thống.
- **Quan sát runtime:** 0 nhóm DonDatVeID có nhiều SoTien và 0 attempt khác tổng đơn tại thời điểm audit. Không dùng các số 0 này thay cho chứng minh FD.

## Phần 6 — Potential Risks / Unverified Dependencies

### U-001 — RAPCHIEUPHIM

- **Finding ID:** U-001
- **Table:** `RAPCHIEUPHIM`
- **Severity:** LOW — cần đặc tả
- **Normalization Level:** 3NF — UNKNOWN
- **Functional Dependency:** Giả thuyết `DiaChi → ThanhPho`
- **Determinant:** DiaChi — giả thuyết
- **Dependent Attributes:** ThanhPho — chưa xác nhận
- **Classification:** UNKNOWN — chưa xác nhận ngữ nghĩa địa chỉ đủ để tạo FD
- **Evidence File:** `database/02_tables/rapchieuphim.sql`; `database/08_procedures/admin/sp_Admin_Cinema_Create.sql`; `database/08_procedures/admin/sp_Admin_Cinema_Update.sql`; `database/10_seed/seed_base/030_cinemas.sql`
- **Source Location:** [database/02_tables/rapchieuphim.sql:5](../../database/02_tables/rapchieuphim.sql#L5); [database/08_procedures/admin/sp_Admin_Cinema_Create.sql:11](../../database/08_procedures/admin/sp_Admin_Cinema_Create.sql#L11); [database/08_procedures/admin/sp_Admin_Cinema_Update.sql:51](../../database/08_procedures/admin/sp_Admin_Cinema_Update.sql#L51); [database/10_seed/seed_base/030_cinemas.sql:9](../../database/10_seed/seed_base/030_cinemas.sql#L9)
- **Explanation:** DiaChi được lưu như văn bản và truyền độc lập với ThanhPho. Seed chứa địa chỉ mô phỏng không có thành phố; không có parser địa chỉ hay lookup chuẩn. Địa chỉ thành phần giống nhau có thể xuất hiện ở nhiều thành phố. Không thể chứng minh DiaChi là địa chỉ đầy đủ hoặc rằng chuỗi đó xác định một thành phố trong tất cả dữ liệu hợp lệ. TenRap/DiaChi cũng không có UNIQUE.
- **Recommendation:** Xác nhận DiaChi là địa chỉ thành phần hay định danh địa điểm đầy đủ, và tên/địa chỉ có phải business key. Nếu có FD thật thì mới phân tích decomposition; không tự tách thành phố chỉ vì hai trường cùng tồn tại.
- **Confidence:** MEDIUM về ngữ nghĩa; HIGH về thiếu ràng buộc/parser

### U-002 — KHIEUNAI

- **Finding ID:** U-002
- **Table:** `KHIEUNAI`
- **Severity:** MEDIUM — redundancy có điều kiện
- **Normalization Level:** 3NF — UNKNOWN toàn bảng; FD có điều kiện được xác nhận
- **Functional Dependency:** `DonDatVeID → NguoiDungID` chỉ trên tập có DonDatVeID khác NULL và được tạo qua contract hiện hành
- **Determinant:** DonDatVeID khác NULL — phạm vi điều kiện
- **Dependent Attributes:** NguoiDungID trên tập có đơn
- **Classification:** CONFIRMED có điều kiện; UNKNOWN đối với FD toàn quan hệ có NULL
- **Evidence File:** `database/08_procedures/customer/sp_Complaint_Create.sql`; `database/02_tables/khieunai.sql`; `database/03_constraints/002_foreign_keys.sql`
- **Source Location:** [database/08_procedures/customer/sp_Complaint_Create.sql:45](../../database/08_procedures/customer/sp_Complaint_Create.sql#L45); [database/08_procedures/customer/sp_Complaint_Create.sql:53](../../database/08_procedures/customer/sp_Complaint_Create.sql#L53); [database/02_tables/khieunai.sql:5](../../database/02_tables/khieunai.sql#L5); [database/03_constraints/002_foreign_keys.sql:118](../../database/03_constraints/002_foreign_keys.sql#L118)
- **Explanation:** Với đơn được tham chiếu, SP bắt buộc người gửi là chủ đơn. NguoiDungID và DonDatVeID đều nằm trong KHIEUNAI nên trên tập đó có redundancy thực sự, không chỉ là quan hệ sau JOIN. Nhưng bảng còn chứa khiếu nại không đơn; NULL không phải một mã đơn chung xác định người gửi. Runtime có 2 khiếu nại không đơn. Không áp dụng FD cổ điển cho toàn bảng bằng cách coi mọi NULL là cùng determinant, cũng không đánh dấu PASS toàn bảng khi chưa chốt mô hình optional relationship.
- **Recommendation:** Chốt phạm vi audit chuẩn hóa cho tập có đơn và chính sách người gửi/chủ đơn. Giữ khả năng xác định người gửi của khiếu nại chung; không đề nghị xóa NguoiDungID. Nếu cần decomposition, phải thiết kế mô hình cho cả hai loại khiếu nại và duyệt riêng. Kiểm soát ownership ở DI-001.
- **Confidence:** HIGH về điều kiện ownership; MEDIUM về mô hình chuẩn hóa toàn bảng

### U-003 — BANGGIA

- **Finding ID:** U-003
- **Table:** `BANGGIA`
- **Severity:** MEDIUM — khóa và quy tắc thời gian
- **Normalization Level:** 2NF / 3NF — UNKNOWN
- **Functional Dependency:** Giả thuyết business key `(RapID,LoaiGhe,LoaiNgay,DinhDang,NgayBatDau)`; không chứng minh được FD/key toàn bảng
- **Determinant:** RapID, LoaiGhe, LoaiNgay, DinhDang, NgayBatDau — khóa phiên bản giả thuyết
- **Dependent Attributes:** GiaID và các thuộc tính rule — chưa xác nhận toàn bảng
- **Classification:** INFERRED cho khóa phiên bản; CONFIRMED cho uniqueness có điều kiện của khoảng giá đang áp dụng
- **Evidence File:** `database/02_tables/banggia.sql`; `database/04_indexes/banggia.sql`; `database/07_triggers/TRG_BangGia_KiemTraChongLan.sql`; `database/05_functions/fn_TinhGiaVe.sql`
- **Source Location:** [database/02_tables/banggia.sql:2](../../database/02_tables/banggia.sql#L2); [database/04_indexes/banggia.sql:3](../../database/04_indexes/banggia.sql#L3); [database/07_triggers/TRG_BangGia_KiemTraChongLan.sql:66](../../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql#L66); [database/05_functions/fn_TinhGiaVe.sql:56](../../database/05_functions/fn_TinhGiaVe.sql#L56)
- **Explanation:** Trigger cấm chồng lấn cùng bộ chiều chỉ khi cả hai dòng Áp dụng. Dòng Tạm dừng/Hết hạn có thể cùng bộ chiều và ngày bắt đầu, nên tổ hợp trên không là CK toàn bảng. Hai mức PhuThu ở hai khoảng ngày khác nhau không chứng minh vi phạm 3NF. Hàm cộng các phụ thu khớp, kể cả Tất cả; sự giao nhau giữa rule tổng quát và rule cụ thể là hành vi hiện hữu, không tự coi là lỗi.
- **Recommendation:** Làm rõ định danh phiên bản rule trên toàn bộ vòng đời: được giữ nhiều bản nháp/cũ cùng ngày hay không, chồng rule có chủ đích hay ưu tiên thay thế. Khi có CK ghép thực sự, kiểm tra từng proper subset với PhuThu/NgayKetThuc/TrangThai. Không thêm UNIQUE toàn bảng trước khi xác minh lịch sử.
- **Confidence:** HIGH về source; MEDIUM về khóa nghiệp vụ

### U-004 — PHANCONG_RAP

- **Finding ID:** U-004
- **Table:** `PHANCONG_RAP`
- **Severity:** LOW — khóa nghiệp vụ chưa chốt
- **Normalization Level:** 2NF / 3NF — UNKNOWN
- **Functional Dependency:** Giả thuyết `(NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai) → PhanCongID` trong luồng SP; chưa là CK toàn phần đã chứng minh
- **Determinant:** NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai — tổ hợp giả thuyết
- **Dependent Attributes:** PhanCongID — chưa chứng minh CK toàn phần/tối thiểu
- **Classification:** INFERRED; CONFIRMED rằng SP chặn bản ghi tương đương
- **Evidence File:** `database/08_procedures/admin/sp_Admin_Assignment_Create.sql`; `database/08_procedures/admin/usp_Admin_Assignment_Update.sql`; `database/02_tables/phancong_rap.sql`; `database/04_indexes/phancong_rap.sql`
- **Source Location:** [database/08_procedures/admin/sp_Admin_Assignment_Create.sql:70](../../database/08_procedures/admin/sp_Admin_Assignment_Create.sql#L70); [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:98](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L98); [database/02_tables/phancong_rap.sql:7](../../database/02_tables/phancong_rap.sql#L7); [database/04_indexes/phancong_rap.sql:3](../../database/04_indexes/phancong_rap.sql#L3)
- **Explanation:** SP so sánh toàn nội dung, bao gồm trạng thái và xử lý NULL ngày kết thúc; không có UNIQUE tương ứng. Không có rule cấm chồng kỳ phân công — comment còn yêu cầu không tự đặt rule đó. Vì vậy (NguoiDungID,RapID) hoặc (NguoiDungID,RapID,NgayBatDau) không được mặc định là khóa. Tính tối thiểu và FD của các tổ hợp business key chưa được đặc tả.
- **Recommendation:** Chốt mô hình: sự kiện phân công hay một dòng cho mỗi kỳ; các trường kỳ/trạng thái có thể tạo phiên bản khác hay không. Không đặt ràng buộc một người chỉ quản lý một rạp hoặc không chồng kỳ nếu nghiệp vụ chưa yêu cầu.
- **Confidence:** HIGH về SQL; MEDIUM về completeness của business key


Không có vi phạm 3NF toàn bảng được chứng minh cho U-001…U-004. Giả thuyết FD không được đưa vào tập CONFIRMED toàn quan hệ và không được dùng để tăng số FAIL.

## Phần 7 — Intentional Snapshot & Denormalization Review

### S-001 / S-002 — Giá vé và đơn giá đồ ăn

[database/08_procedures/booking/sp_Booking_Create.sql:245](../../database/08_procedures/booking/sp_Booking_Create.sql#L245) gọi fn_TinhGiaVe cho từng ghế; [database/08_procedures/booking/sp_Booking_Create.sql:268](../../database/08_procedures/booking/sp_Booking_Create.sql#L268) lấy SANPHAM.Gia vào DonGia rồi ghi CHITIETDOAN. [database/05_functions/fn_TinhGiaVe.sql:56](../../database/05_functions/fn_TinhGiaVe.sql#L56) đọc danh mục/bảng phụ thu hiện tại, trong khi giá trên vé là kết quả tại lần phát hành.

Giá SANPHAM và rule BANGGIA có thể đổi sau khi mua. Vì vậy `SanPhamID → DonGia` không là FD giao dịch trên toàn lịch sử; tương tự `(SuatChieuID,GheID)` sau JOIN không luôn xác định GiaVe lịch sử nếu thay rule giá giữa các lần phát hành. Vé giữ lại giữ nguyên giá; vé thêm mới dùng giá hiện tại theo sp_StaffBooking_UpdateSeats. Giá snapshot là một thuộc tính của giao dịch, không phải lỗi 2NF/3NF mặc định.

Runtime hiện có 0 dòng đồ ăn khác giá danh mục. Đây chỉ là dataset chưa minh họa thay giá; chứng cứ snapshot là writer và khả năng sửa giá trong SP danh mục, không phải dữ liệu mẫu.

### S-003 — Tổng đơn và tiền giảm

[database/08_procedures/booking/sp_Booking_Create.sql:265](../../database/08_procedures/booking/sp_Booking_Create.sql#L265) tính tổng giá vé và tổng SoLuong×DonGia trước khi tạo đơn; tiền giảm được tính dưới khóa khuyến mãi và chốt vào đơn. [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:279](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L279) chỉ cập nhật tổng vé của đơn pending được phép sửa. Khi có attempt/đã thanh toán, tổng được giữ. [database/08_procedures/system/sp_Showtime_CancelCascade.sql:185](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql#L185) bảo toàn snapshot khi hủy suất.

Các tổng tiền không hoàn toàn bất biến ngay từ INSERT: đơn pending hợp lệ có thể đổi ghế. Chúng bất biến đối với các writer hiện hành sau khi bắt đầu thanh toán. TienGiamGia là quyết định tại thời điểm đặt; mã khuyến mãi có thể được sửa về sau, nên `(KhuyenMaiID,TongTienVe,TongTienDoAn) → TienGiamGia` không là FD toàn lịch sử nếu không có phiên bản điều khoản. Không có cột tổng thanh toán lưu thêm trong DONDATVE: view/hàm trả biểu thức tính.

[database/05_functions/fn_TinhTongTienVe.sql:16](../../database/05_functions/fn_TinhTongTienVe.sql#L16) bỏ vé hủy khi tính tổng động; khi hủy suất tất cả vé hủy nhưng TongTienVe lịch sử vẫn giữ. Do đó không dùng equality với SUM(vé còn hiệu lực) để “sửa” mọi đơn đã hủy. Không có trigger duy trì tổng đơn tự động theo mọi DML chi tiết; consistency theo vòng đời thuộc DI-003.

### S-004 — SoLuongDaDung

[database/08_procedures/booking/sp_Booking_Create.sql:488](../../database/08_procedures/booking/sp_Booking_Create.sql#L488) consume lượt trong cùng transaction và dưới UPDLOCK/HOLDLOCK; [database/08_procedures/customer/sp_Order_ExpirePending.sql:64](../../database/08_procedures/customer/sp_Order_ExpirePending.sql#L64) và [database/08_procedures/customer/sp_Order_Cancel.sql:56](../../database/08_procedures/customer/sp_Order_Cancel.sql#L56) hoàn lượt khi kết thúc hold/hủy. CHECK chặn giá trị âm/vượt quota.

Đây là bộ đếm quota được duy trì theo event, gồm cả reservation và hoàn reservation, không phải COUNT mọi đơn mang mã. Source còn giữ đơn đã hủy và đơn hết hạn. Có thể đối soát từ tập đơn nếu xác định đầy đủ trạng thái/lifecycle, nhưng không chứng minh công thức toàn phần từ dữ liệu hiện tại: hold đã hết theo thời gian có thể chưa được job chuyển trạng thái. Không có FD nội KHUYENMAI kiểu SoLuong→SoLuongDaDung; một quota cố định có nhiều mức usage hợp lệ. Đây là consistency risk khi bỏ qua writer, không phải lỗi 3NF.

### S-005 — Trạng thái khiếu nại và lịch sử

[database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql:45](../../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql#L45) chọn dòng xử lý có XuLyID lớn nhất của mỗi khiếu nại; đây là định nghĩa “mới nhất” của source, không phải MAX(NgayXuLy). Trigger khóa bảng cha rồi đọc lịch sử và cập nhật TrangThai. Các SP đổi trạng thái ghi thêm sự kiện xử lý, không chỉ sửa trạng thái cha.

KHIEUNAI giữ current state để đọc nhanh; XULY_KHIEUNAI giữ state của từng event. Không có FD `KhieuNaiID → TrangThaiSauXuLy` trên toàn lịch sử vì một khiếu nại có nhiều trạng thái. Current state suy ra từ một quan hệ khác không tự gây lỗi 3NF nội bảng. Runtime 0 current-state mismatch; trigger chỉ AFTER INSERT, nên UPDATE/DELETE lịch sử đặc quyền vẫn cần kiểm soát (DI-002).

### S-006 — Điểm khách hàng và bồi thường

HOSOKHACHHANG.DiemTichLuy là balance theo khách hàng; BOITHUONG_HUYSUAT lưu một sự kiện bồi thường mỗi đơn (DonDatVeID là CK), không sao chép NguoiDungID/SuatChieuID/tổng tiền. Hàm tính điểm đọc snapshot đơn; FD DonDatVeID→DiemBoiThuong hợp lệ vì determinant là CK của bảng bồi thường. Tên migration `r2fix_compensation_3nf.sql` mô tả thay đổi lịch sử, không tự là bằng chứng các bảng hiện tại đạt 3NF.

### S-007 — Giờ kết thúc suất chiếu

[database/08_procedures/system/sp_Showtime_ValidateTimes.sql:37](../../database/08_procedures/system/sp_Showtime_ValidateTimes.sql#L37) cho phép độ dài từ thời lượng phim đến thời lượng+120 phút, tối đa 8 giờ. Giờ bắt đầu và giờ kết thúc là hai tham số được quản lý thiết lập. Có thể tạo cùng phim/cùng giờ bắt đầu ở hai phòng với giờ kết thúc khác nhau hợp lệ; phòng khác tránh xung đột lịch.

Do đó `(PhimID,ThoiGianBatDau) → ThoiGianKetThuc` không được code áp đặt. DinhDang và GiaVeCoBan cũng là input của từng suất, không là giá trị chỉ theo phim/phòng. Trigger kiểm tra overlap là ràng buộc khoảng, không biến bộ thuộc tính trên thành determinant của giờ kết thúc. Không đề xuất computed column giờ kết thúc.

### Snapshot THANHTOAN — ngoại lệ có FD thực sự

Giữ tiền trên attempt có thể là một lựa chọn lịch sử hợp lý, nhưng nhãn “snapshot” không tự làm mất FD. Contract hiện tại đóng băng tổng trước khi cho phép retry, nên mọi attempt của đơn vẫn phải cùng amount. Có thể chấp nhận denormalization có chủ đích và giữ cột nếu không đặt mục tiêu 3NF tuyệt đối; khi đó vẫn phải ghi nhận N-001 và không dùng VERIFIED_3NF.

## Phần 8 — Data Integrity Findings

Các finding sau **không được cộng vào số FAIL 3NF**. Rủi ro chủ yếu ở DML đặc quyền/import, vì runtime ứng dụng dự kiến dùng db_executor với DENY DML trên dbo. Không chạy mutation/concurrency tests để kiểm chứng exploit trong đợt audit này.

### DI-001 — KHIEUNAI / DONDATVE

- **Finding ID:** DI-001
- **Table:** `KHIEUNAI / DONDATVE`
- **Severity:** MEDIUM
- **Normalization Level:** DATA INTEGRITY — không kết luận lỗi 3NF toàn bảng
- **Functional Dependency:** Ownership là equality giữa hai quan hệ, có điều kiện DonDatVeID khác NULL
- **Classification:** CONFIRMED — SP-only enforcement
- **Evidence File:** `database/08_procedures/customer/sp_Complaint_Create.sql`; `database/03_constraints/002_foreign_keys.sql`
- **Source Location:** [database/08_procedures/customer/sp_Complaint_Create.sql:53](../../database/08_procedures/customer/sp_Complaint_Create.sql#L53); [database/03_constraints/002_foreign_keys.sql:118](../../database/03_constraints/002_foreign_keys.sql#L118); [database/03_constraints/002_foreign_keys.sql:127](../../database/03_constraints/002_foreign_keys.sql#L127)
- **Explanation:** Hai FK đơn lẻ chỉ bảo đảm người/đơn tồn tại, không bảo đảm người gửi là chủ đơn. Không có trigger ownership. DML đặc quyền có thể tạo khiếu nại tham chiếu đơn người khác; SP hiện chặn và runtime không có mismatch.
- **Recommendation:** Giữ writer chính thức, kiểm soát import và có truy vấn đối soát. Chỉ đề xuất constraint/trigger sau khi chốt chính sách người gửi; không xóa NguoiDungID.
- **Confidence:** HIGH

### DI-002 — KHIEUNAI / XULY_KHIEUNAI

- **Finding ID:** DI-002
- **Table:** `KHIEUNAI / XULY_KHIEUNAI`
- **Severity:** MEDIUM
- **Normalization Level:** DATA INTEGRITY — current state/history
- **Functional Dependency:** Current state = trạng thái event XuLyID lớn nhất khi có lịch sử
- **Classification:** CONFIRMED — bảo vệ INSERT; không bảo vệ UPDATE/DELETE history
- **Evidence File:** `database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql`
- **Source Location:** [database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql:9](../../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql#L9)
- **Explanation:** Trigger đồng bộ chỉ AFTER INSERT. UPDATE/DELETE trực tiếp một event hoặc UPDATE TrangThai cha có thể lệch lịch sử; không có writer nghiệp vụ hỗ trợ sửa/xóa history. Việc dùng XuLyID khác với thời gian NgayXuLy cần được hiểu rõ. Runtime không có lệch hiện tại.
- **Recommendation:** Giữ lịch sử append-only qua quyền/writer; khi cần sửa lịch sử, định nghĩa transaction và cách tính lại current state trước.
- **Confidence:** HIGH

### DI-003 — DONDATVE / CHITIETVE / CHITIETDOAN / THANHTOAN / KHUYENMAI

- **Finding ID:** DI-003
- **Table:** `DONDATVE / CHITIETVE / CHITIETDOAN / THANHTOAN / KHUYENMAI`
- **Severity:** MEDIUM
- **Normalization Level:** DATA INTEGRITY — snapshot/counter consistency
- **Functional Dependency:** Không có FD nội bảng mới; các tổng và quota gắn với vòng đời nhiều quan hệ
- **Classification:** CONFIRMED — writer-maintained invariants
- **Evidence File:** `database/08_procedures/booking/sp_Booking_Create.sql`; `database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql`; `database/03_constraints/003_check_constraints.sql`
- **Source Location:** [database/08_procedures/booking/sp_Booking_Create.sql:488](../../database/08_procedures/booking/sp_Booking_Create.sql#L488); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:279](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L279); [database/03_constraints/003_check_constraints.sql:135](../../database/03_constraints/003_check_constraints.sql#L135); [database/03_constraints/003_check_constraints.sql:338](../../database/03_constraints/003_check_constraints.sql#L338)
- **Explanation:** CHECK chỉ kiểm tra các miền/giới hạn nêu trong source; không bảo đảm tổng đơn bằng snapshot chi tiết ở đúng giai đoạn, không bảo đảm discount dưới tổng cho mọi DML, và không đồng bộ quota với lịch sử đơn nếu ghi trực tiếp. Không có trigger tổng tiền/quota trên mọi bảng chi tiết. Writer booking và sửa ghế xử lý các invariants theo transaction.
- **Recommendation:** Đối soát theo trạng thái và thời điểm chốt; không áp một SUM(vé hiệu lực) cho cả đơn hủy. Giữ quyền DML hạn chế, không thay snapshot bằng giá danh mục hiện tại.
- **Confidence:** HIGH

### DI-004 — CHITIETVE / DONDATVE / GHE / SUATCHIEU

- **Finding ID:** DI-004
- **Table:** `CHITIETVE / DONDATVE / GHE / SUATCHIEU`
- **Severity:** MEDIUM
- **Normalization Level:** DATA INTEGRITY — parent changes/concurrency scope
- **Functional Dependency:** Ghế phải thuộc phòng của suất được đơn tham chiếu; vé hiệu lực không được trùng ghế/suất
- **Classification:** CONFIRMED về phạm vi trigger; INFERRED rủi ro khi bypass writer
- **Evidence File:** `database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql`; `database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql`; `database/08_procedures/booking/sp_Booking_Create.sql`; `database/08_procedures/admin/usp_Admin_Showtime_Update.sql`
- **Source Location:** [database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql:9](../../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql#L9); [database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql:10](../../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql#L10); [database/08_procedures/booking/sp_Booking_Create.sql:62](../../database/08_procedures/booking/sp_Booking_Create.sql#L62); [database/08_procedures/admin/usp_Admin_Showtime_Update.sql:124](../../database/08_procedures/admin/usp_Admin_Showtime_Update.sql#L124)
- **Explanation:** Các trigger ghế chạy khi CHITIETVE INSERT/UPDATE; FK không enforce đường đi ghế→phòng và đơn→suất→phòng. Sửa parent trực tiếp không tự kích hoạt trigger child. Chống trùng ghế dùng join/trạng thái và cần protocol khóa writer; không có UNIQUE tĩnh trên (ghế,suất hiệu lực). Không khẳng định có race ở luồng SP đã khóa.
- **Recommendation:** Chỉ dùng writer bảo vệ lịch sử và thứ tự khóa. Nếu cần hỗ trợ DML/import bên ngoài thì thiết kế bổ sung validation parent và kiểm thử concurrency trên target test sau khi được yêu cầu.
- **Confidence:** HIGH

### DI-005 — BANGGIA / SUATCHIEU

- **Finding ID:** DI-005
- **Table:** `BANGGIA / SUATCHIEU`
- **Severity:** LOW — ghi nhận kiểm soát hiện hữu
- **Normalization Level:** DATA INTEGRITY — khoảng thời gian
- **Functional Dependency:** Non-overlap có điều kiện, không phải FD 3NF
- **Classification:** CONFIRMED — BANGGIA có khóa parent; SUATCHIEU có protocol writer
- **Evidence File:** `database/07_triggers/TRG_BangGia_KiemTraChongLan.sql`; `database/08_procedures/system/sp_Showtime_ValidateTimes.sql`; `database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql`
- **Source Location:** [database/07_triggers/TRG_BangGia_KiemTraChongLan.sql:15](../../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql#L15); [database/08_procedures/system/sp_Showtime_ValidateTimes.sql:42](../../database/08_procedures/system/sp_Showtime_ValidateTimes.sql#L42); [database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql:9](../../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql#L9)
- **Explanation:** BANGGIA trigger khóa các rạp liên quan và kiểm tra overlap giữa bảng/inserted. SUATCHIEU writer khóa phòng trước kiểm tra lịch. Hai cơ chế theo phạm vi hoạt động/trạng thái; không tương đương CK thời gian toàn bảng. Chưa chạy stress tests, không phát hiện một race mới trong audit chỉ đọc.
- **Recommendation:** Giữ các protocol hiện tại; không gọi overlap là lỗi 3NF, không tự đặt rule Tất cả loại trừ rule cụ thể.
- **Confidence:** HIGH

### DI-006 — THANHTOAN

- **Finding ID:** DI-006
- **Table:** `THANHTOAN`
- **Severity:** MEDIUM — invariant của lịch sử thu
- **Normalization Level:** DATA INTEGRITY — số tiền và lần thu thành công
- **Functional Dependency:** FD business DonDatVeID→SoTien chưa có constraint; tối đa một lần thu thành công theo vòng đời SP
- **Classification:** CONFIRMED — SP-only; không có unique filtered success per order
- **Evidence File:** `database/08_procedures/payment/sp_Payment_UpdateResult.sql`; `database/04_indexes/thanhtoan.sql`; `database/06_views/vw_DoanhThuTheoRap.sql`
- **Source Location:** [database/08_procedures/payment/sp_Payment_UpdateResult.sql:168](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L168); [database/04_indexes/thanhtoan.sql:3](../../database/04_indexes/thanhtoan.sql#L3); [database/06_views/vw_DoanhThuTheoRap.sql:18](../../database/06_views/vw_DoanhThuTheoRap.sql#L18)
- **Explanation:** SoTien được snapshot bởi writer; không có constraint equality với tổng đơn. Bảng cũng không có UNIQUE(DonDatVeID) WHERE TrangThai=Thành công. Writer serialize order và đổi trạng thái khi thành công để chặn lần thu tiếp; DML đặc quyền có thể tạo nhiều success và view doanh thu sẽ SUM tất cả. Không tìm thấy incident từ dữ liệu đã đọc.
- **Recommendation:** Kiểm soát import và đối soát số lần thu; chỉ cân nhắc constraint bổ sung khi tương thích lịch sử/lifecycle, không sửa trong audit này.
- **Confidence:** HIGH


### Quyền và referential integrity hiện hữu

[database/09_security/001_execute_role.sql:8](../../database/09_security/001_execute_role.sql#L8) hạn chế DML trực tiếp cho db_executor; FK/CHECK runtime đều enabled/trusted, trigger không disabled. Các hạn chế đã nêu không có nghĩa mọi client hiện có thể bypass SP. Cấu hình DEV cho phép sa được mô tả trong [backend/.env.example:13](../../backend/.env.example#L13); audit không xuất thông tin đăng nhập thật.

CASCADE có trên vé/đồ ăn theo đơn, hồ sơ theo user, liên kết thể loại/diễn viên/quyền và lịch sử xử lý theo khiếu nại. THANHTOAN/BOITHUONG_HUYSUAT tham chiếu đơn bằng NO ACTION giúp chặn xóa đơn có các lịch sử đó. Không coi CASCADE luôn sai, nhưng physical delete ngoài writer có thể mất lịch sử các quan hệ được cascade. Writer booking giữ vé hủy; không tự xóa lịch sử.

### Quan sát runtime chỉ đọc

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---:|---|
| Đơn có nhiều attempt | 1 | Dataset minh họa retry; tính hợp lệ của retry được chứng minh từ source. |
| Nhóm DonDatVeID có SoTien khác nhau | 0 | Không phát hiện drift amount hiện tại; không chứng minh FD. |
| Attempt khác tổng tiền đơn | 0 | Không phát hiện mismatch hiện tại. |
| Khiếu nại có đơn nhưng khác chủ | 0 | Không phát hiện ownership mismatch. |
| Khiếu nại không đơn | 2 | Optional relationship thực tế tồn tại. |
| Trạng thái khiếu nại lệch event XuLyID lớn nhất | 0 | Không phát hiện drift history/current state. |
| Dòng đồ ăn khác giá hiện tại | 0 | Không dùng để phủ nhận snapshot lịch sử. |
| Đơn có nhiều bản ghi bồi thường | 0 | UQ DonDatVeID đang hiện hữu. |

## Phần 9 — Proposed Remediation

**Không thực hiện bất kỳ phương án nào trong đợt audit. Mọi thay đổi schema sau đây là `PROPOSED SCHEMA CHANGE — REQUIRES APPROVAL`.**

### P-001 — Quyết định đối với N-001, ưu tiên trước khi chứng nhận 3NF

**Phương án A — giữ thiết kế:** giữ THANHTOAN.SoTien làm audit snapshot có chủ đích, tài liệu hóa FD và ngoại lệ denormalization; duy trì freeze order amount, writer-only access, đối soát retry amount. Không thay API/logic/schema. Phương án này giữ ngữ nghĩa lịch sử nhưng không đưa quan hệ về 3NF theo FD hiện hành, nên verdict vẫn NOT_3NF.

**Phương án B — decomposition lý thuyết, cần phê duyệt:** tách quan hệ R=THANHTOAN thành:

```text
P(DonDatVeID, SoTien)                         -- PK DonDatVeID; FK tới DONDATVE
Q(ThanhToanID, DonDatVeID, PhuongThuc,
  NgayTao, NgayThanhToan, MaGiaoDich,
  TrangThai, GhiChu)                         -- giữ định danh và lịch sử attempt
```

P/Q là ký hiệu đề xuất, **chưa có bảng SQL nào được thêm/sửa**. Q phải tham chiếu P theo DonDatVeID; P chỉ có một amount đã chốt cho mỗi đơn có attempt. Nếu SoTien sau này mang nghĩa amount độc lập của attempt thì không áp dụng decomposition này.

- **Bảo toàn dữ liệu:** lấy P=π(DonDatVeID,SoTien)(R), Q=π(R−{SoTien})(R). Phải preflight toàn bộ amount của một đơn giống nhau, xử lý NULL code và duy trì FK/trạng thái/thời gian/ghi chú/ID. Nếu dữ liệu có nhiều amount cùng đơn, dừng; không chọn tùy tiện một amount hay SUM.
- **Lossless join:** P∩Q={DonDatVeID}; FD DonDatVeID→SoTien làm DonDatVeID là key của P, nên natural join P⋈Q khôi phục đúng R trong tập FD đã xác nhận.
- **Dependency preservation:** ThanhToanID→thuộc tính Q giữ trong Q; DonDatVeID→SoTien giữ trong P; ThanhToanID→SoTien được suy qua hai FD. Khóa tra cứu MaGiaoDich trong tập khác NULL giữ ở Q. Các FK nghiệp vụ cần được tái tạo đúng semantics.
- **Chuẩn hóa:** P có determinant DonDatVeID là CK; Q loại bỏ dependent SoTien của determinant không-key. Đây chỉ giải quyết N-001, không tự giải quyết các bảng UNKNOWN.
- **Tác động:** sp_Payment_CreateAttempt phải tạo/đọc amount chung atomically; sp_Payment_UpdateResult, các view/report và SP đọc đơn/thu tiền phải JOIN để trả cùng contract. Kiểm tra hệ thống tính điểm dùng @Amount, các SP hủy suất/tra cứu support, manifest/verification, seed và tests. Không thêm SoTien dạng cột thường vào DONDATVE để rồi tạo FD mới `(TongTienVe,TongTienDoAn,TienGiamGia)→SoTien` trong cùng bảng.
- **Concurrency:** cần giữ khóa user→show→order; lần tạo P và retry đồng thời phải idempotent. Không dùng bản tách này để thay quy tắc trả góp/thu từng phần.
- **API:** có thể giữ response shape SoTien bằng SELECT/JOIN trong SP; backend typed procedure contract vẫn cần regression. Không đổi response chỉ để phù hợp cấu trúc mới.
- **Rủi ro:** cao hơn giữ nguyên vì liên quan thanh toán/doanh thu; chỉ triển khai sau review, kiểm thử trên database test được giới hạn và kế hoạch rollback được duyệt.

**Phương án C — chỉ khi nghiệp vụ thay đổi được xác nhận:** nếu attempt amount được phép khác nhau thì FD DonDatVeID→SoTien không còn đúng. Khi đó giữ snapshot theo attempt có thể đúng mô hình; phải có contract version/điều khoản, các writer tương ứng và audit lại. Không “đạt 3NF” bằng cách tự đổi nghĩa cột trong báo cáo.

### P-002 — Chốt các phụ thuộc chưa rõ trước khi sửa cấu trúc

| Ưu tiên | Khu vực | Việc cần xác minh | Hướng xử lý sau xác minh |
|---|---|---|---|
| P1 | KHIEUNAI | Người gửi/chủ đơn, khiếu nại chung và mô hình NULL | Phân tích riêng quan hệ có đơn; không xóa người gửi chung. Nếu tách, phải chứng minh lossless cho cả hai loại. |
| P1 | BANGGIA | Khóa phiên bản rule, ý nghĩa trạng thái, cộng phụ thu Tất cả | Chốt CK toàn phần rồi kiểm tra proper subsets. Không thêm UQ phá bản nháp/lịch sử. |
| P2 | RAPCHIEUPHIM | Địa chỉ thành phần/full address, business key của rạp | Chỉ nếu DiaChi→ThanhPho được xác nhận và DiaChi không key mới xét tách A(DiaChi,ThanhPho), B(các cột rạp còn lại); lossless qua DiaChi là key của A, cần đánh giá địa chỉ thay đổi. |
| P2 | PHANCONG_RAP | Định danh kỳ và bản ghi tương đương | Chốt CK tối thiểu/nullability; không đặt rule một người một rạp hoặc cấm chồng kỳ nếu chưa yêu cầu. |

### P-003 — Kiểm soát toàn vẹn tách khỏi chuẩn hóa

Ưu tiên duy trì writer-only và kiểm soát import, append-only complaint history, đối soát amount/quota theo vòng đời. Bổ sung constraint/trigger chỉ khi policy đã xác nhận và compatibility được đánh giá. Không chạy migrations/tests ghi Main từ báo cáo audit này.

## Phần 10 — Final Verdict

```text
NOT_3NF
```

Đã audit 27 bảng: **22 PASS 3NF, 1 FAIL 3NF, 4 UNKNOWN 3NF** theo mô hình FD và evidence hiện hành. **N-001 / THANHTOAN** là vi phạm được chứng minh từ business contract; các giả thuyết khác không được dùng để kết luận FAIL. Bốn bảng UNKNOWN cần chốt nghĩa địa chỉ, mô hình khiếu nại có đơn và khóa nghiệp vụ thời gian của giá/phân công.

Không chọn VERIFIED_3NF vì còn một FD vi phạm đã chứng minh và các phụ thuộc quan trọng chưa chốt. Không chọn INCONCLUSIVE cho toàn database vì N-001 đã đủ bác bỏ kết luận toàn bộ đạt 3NF trong contract hiện tại. Nếu business contract về attempt amount được xác nhận khác code hiện tại, cần audit lại N-001 và verdict; không âm thầm bỏ qua mâu thuẫn đó.

### Điều kiện hoàn tất

- [x] Đếm và kiểm kê toàn bộ bảng, cột/kiểu/NULL, PK/CK/FK/UQ/filtered index/CHECK/computed/default.
- [x] Phân tích prime/non-prime, superkey và CK ghép của mọi bảng; ghi UNKNOWN cho business key chưa chốt.
- [x] Xác định FD từ khóa và FD nghiệp vụ quan trọng, phân loại CONFIRMED/INFERRED/UNKNOWN.
- [x] Đánh giá 1NF/2NF/3NF đủ 27 bảng với bằng chứng file và dòng.
- [x] Kiểm tra đủ tám vùng rủi ro trong yêu cầu và bổ sung payment amount.
- [x] Tách NORMALIZATION FINDINGS khỏi DATA INTEGRITY FINDINGS.
- [x] Ghi đề xuất, lossless join/dependency preservation và tác động; không triển khai.
- [x] Đối chiếu runtime chỉ đọc; tạo báo cáo, không sửa SQL/schema/dữ liệu/backend/frontend.

## Phụ lục A — Toàn bộ thuộc tính, kiểu dữ liệu, NULL và CHECK

Kiểu datetime2 không ghi scale trong source được chuẩn hóa thành datetime2(7), là kiểu runtime tương ứng. DEFAULT và biểu thức CHECK bên dưới lấy từ metadata đã đối chiếu source; không phải đề xuất thêm constraint.

### dbo.BANGGIA

**Source:** [database/02_tables/banggia.sql:2](../../database/02_tables/banggia.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:3](../../database/03_constraints/001_primary_unique.sql#L3)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| GiaID | int | NOT NULL | PK; IDENTITY | — |
| RapID | int | NOT NULL | FK → RAPCHIEUPHIM | — |
| LoaiGhe | nvarchar(50) | NOT NULL | — | — |
| LoaiNgay | nvarchar(50) | NOT NULL | — | — |
| DinhDang | nvarchar(50) | NOT NULL | — | — |
| PhuThu | decimal(18,2) | NOT NULL | — | `((0))` |
| NgayBatDau | date | NOT NULL | — | — |
| NgayKetThuc | date | NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Áp dụng')` |

**CHECK:**
- `CK_BANGGIA_DinhDang`: `([DinhDang]=N'Tất cả' OR [DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D')` — [database/03_constraints/003_check_constraints.sql:5](../../database/03_constraints/003_check_constraints.sql#L5)
- `CK_BANGGIA_LoaiGhe`: `([LoaiGhe]=N'Tất cả' OR [LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường')` — [database/03_constraints/003_check_constraints.sql:20](../../database/03_constraints/003_check_constraints.sql#L20)
- `CK_BANGGIA_LoaiNgay`: `([LoaiNgay]=N'Tất cả' OR [LoaiNgay]=N'Cuối tuần' OR [LoaiNgay]=N'Ngày thường')` — [database/03_constraints/003_check_constraints.sql:34](../../database/03_constraints/003_check_constraints.sql#L34)
- `CK_BANGGIA_PhuThu`: `([PhuThu]>=(0))` — [database/03_constraints/003_check_constraints.sql:46](../../database/03_constraints/003_check_constraints.sql#L46)
- `CK_BANGGIA_ThoiGian`: `([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau])` — [database/03_constraints/003_check_constraints.sql:54](../../database/03_constraints/003_check_constraints.sql#L54)
- `CK_BANGGIA_TrangThai`: `([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Áp dụng')` — [database/03_constraints/003_check_constraints.sql:65](../../database/03_constraints/003_check_constraints.sql#L65)

### dbo.BOITHUONG_HUYSUAT

**Source:** [database/02_tables/boithuong_huysuat.sql:3](../../database/02_tables/boithuong_huysuat.sql#L3); **keys:** [database/02_tables/boithuong_huysuat.sql:4](../../database/02_tables/boithuong_huysuat.sql#L4); [database/02_tables/boithuong_huysuat.sql:5](../../database/02_tables/boithuong_huysuat.sql#L5)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| BoiThuongID | int | NOT NULL | PK; IDENTITY | — |
| DonDatVeID | int | NOT NULL | FK → DONDATVE | — |
| DiemBoiThuong | int | NOT NULL | — | — |
| NgayBoiThuong | datetime2(7) | NOT NULL | — | — |
| GhiChu | nvarchar(255) | NULL | — | — |

**CHECK:**
- `CK_BOITHUONG_HUYSUAT_Diem`: `([DiemBoiThuong]>=(0))` — [database/02_tables/boithuong_huysuat.sql:10](../../database/02_tables/boithuong_huysuat.sql#L10)

### dbo.CHITIETDOAN

**Source:** [database/02_tables/chitietdoan.sql:2](../../database/02_tables/chitietdoan.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:9](../../database/03_constraints/001_primary_unique.sql#L9); [database/03_constraints/001_primary_unique.sql:159](../../database/03_constraints/001_primary_unique.sql#L159)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| ChiTietDoAnID | int | NOT NULL | PK; IDENTITY | — |
| DonDatVeID | int | NOT NULL | FK → DONDATVE | — |
| SanPhamID | int | NOT NULL | FK → SANPHAM | — |
| SoLuong | int | NOT NULL | — | — |
| DonGia | decimal(18,2) | NOT NULL | — | — |

**CHECK:**
- `CK_CHITIETDOAN_DonGia`: `([DonGia]>=(0))` — [database/03_constraints/003_check_constraints.sql:77](../../database/03_constraints/003_check_constraints.sql#L77)
- `CK_CHITIETDOAN_SoLuong`: `([SoLuong]>(0))` — [database/03_constraints/003_check_constraints.sql:85](../../database/03_constraints/003_check_constraints.sql#L85)

### dbo.CHITIETVE

**Source:** [database/02_tables/chitietve.sql:2](../../database/02_tables/chitietve.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:15](../../database/03_constraints/001_primary_unique.sql#L15); [database/03_constraints/001_primary_unique.sql:165](../../database/03_constraints/001_primary_unique.sql#L165)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| VeID | int | NOT NULL | PK; IDENTITY | — |
| DonDatVeID | int | NOT NULL | FK → DONDATVE | — |
| GheID | int | NOT NULL | FK → GHE | — |
| GiaVe | decimal(18,2) | NOT NULL | — | — |
| MaVe | varchar(100) | NOT NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Đã đặt')` |

**CHECK:**
- `CK_CHITIETVE_GiaVe`: `([GiaVe]>=(0))` — [database/03_constraints/003_check_constraints.sql:93](../../database/03_constraints/003_check_constraints.sql#L93)
- `CK_CHITIETVE_TrangThai`: `([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã sử dụng' OR [TrangThai]=N'Đã đặt')` — [database/03_constraints/003_check_constraints.sql:101](../../database/03_constraints/003_check_constraints.sql#L101)

### dbo.DANHGIAPHIM

**Source:** [database/02_tables/danhgiaphim.sql:2](../../database/02_tables/danhgiaphim.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:21](../../database/03_constraints/001_primary_unique.sql#L21); [database/03_constraints/001_primary_unique.sql:171](../../database/03_constraints/001_primary_unique.sql#L171)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| DanhGiaID | int | NOT NULL | PK; IDENTITY | — |
| PhimID | int | NOT NULL | FK → PHIM | — |
| NguoiDungID | int | NOT NULL | FK → NGUOIDUNG | — |
| SoSao | int | NOT NULL | — | — |
| NoiDung | nvarchar(1000) | NULL | — | — |
| NgayDanhGia | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |

**CHECK:**
- `CK_DANHGIAPHIM_SoSao`: `([SoSao]>=(1) AND [SoSao]<=(5))` — [database/03_constraints/003_check_constraints.sql:113](../../database/03_constraints/003_check_constraints.sql#L113)

### dbo.DIENVIEN

**Source:** [database/02_tables/dienvien.sql:2](../../database/02_tables/dienvien.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:27](../../database/03_constraints/001_primary_unique.sql#L27)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| DienVienID | int | NOT NULL | PK; IDENTITY | — |
| HoTen | nvarchar(150) | NOT NULL | — | — |
| NgaySinh | date | NULL | — | — |
| QuocTich | nvarchar(100) | NULL | — | — |

**CHECK:** không có.

### dbo.DONDATVE

**Source:** [database/02_tables/dondatve.sql:2](../../database/02_tables/dondatve.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:33](../../database/03_constraints/001_primary_unique.sql#L33)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| DonDatVeID | int | NOT NULL | PK; IDENTITY | — |
| NguoiDungID | int | NOT NULL | FK → NGUOIDUNG | — |
| SuatChieuID | int | NOT NULL | FK → SUATCHIEU | — |
| KhuyenMaiID | int | NULL | FK → KHUYENMAI | — |
| NgayDat | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |
| TongTienVe | decimal(18,2) | NOT NULL | — | `((0))` |
| TongTienDoAn | decimal(18,2) | NOT NULL | — | `((0))` |
| TienGiamGia | decimal(18,2) | NOT NULL | — | `((0))` |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Chờ thanh toán')` |
| HanGiuCho | datetime2(7) | NULL | — | — |
| LyDoHuy | nvarchar(255) | NULL | — | — |
| ThongBaoHuy | nvarchar(255) | NULL | — | — |

**CHECK:**
- `CK_DONDATVE_HanGiuCho`: `([TrangThai]<>N'Chờ thanh toán' OR [HanGiuCho] IS NOT NULL)` — [database/03_constraints/003_check_constraints.sql:124](../../database/03_constraints/003_check_constraints.sql#L124)
- `CK_DONDATVE_TienGiamGia`: `([TienGiamGia]>=(0))` — [database/03_constraints/003_check_constraints.sql:135](../../database/03_constraints/003_check_constraints.sql#L135)
- `CK_DONDATVE_TongTienDoAn`: `([TongTienDoAn]>=(0))` — [database/03_constraints/003_check_constraints.sql:143](../../database/03_constraints/003_check_constraints.sql#L143)
- `CK_DONDATVE_TongTienVe`: `([TongTienVe]>=(0))` — [database/03_constraints/003_check_constraints.sql:151](../../database/03_constraints/003_check_constraints.sql#L151)
- `CK_DONDATVE_TrangThai`: `([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoàn tiền' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã thanh toán' OR [TrangThai]=N'Chờ thanh toán')` — [database/03_constraints/003_check_constraints.sql:159](../../database/03_constraints/003_check_constraints.sql#L159)

### dbo.GHE

**Source:** [database/02_tables/ghe.sql:2](../../database/02_tables/ghe.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:39](../../database/03_constraints/001_primary_unique.sql#L39); [database/03_constraints/001_primary_unique.sql:177](../../database/03_constraints/001_primary_unique.sql#L177)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| GheID | int | NOT NULL | PK; IDENTITY | — |
| PhongID | int | NOT NULL | FK → PHONGCHIEU | — |
| HangGhe | varchar(10) | NOT NULL | — | — |
| SoGhe | int | NOT NULL | — | — |
| LoaiGhe | nvarchar(50) | NOT NULL | — | `(N'Thường')` |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Hoạt động')` |

**CHECK:**
- `CK_GHE_LoaiGhe`: `([LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường')` — [database/03_constraints/003_check_constraints.sql:174](../../database/03_constraints/003_check_constraints.sql#L174)
- `CK_GHE_SoGhe`: `([SoGhe]>(0))` — [database/03_constraints/003_check_constraints.sql:187](../../database/03_constraints/003_check_constraints.sql#L187)
- `CK_GHE_TrangThai`: `([TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hỏng' OR [TrangThai]=N'Hoạt động')` — [database/03_constraints/003_check_constraints.sql:195](../../database/03_constraints/003_check_constraints.sql#L195)

### dbo.HINHANH_RAPCHIEUPHIM

**Source:** [database/02_tables/hinhanh_rapchieuphim.sql:2](../../database/02_tables/hinhanh_rapchieuphim.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:45](../../database/03_constraints/001_primary_unique.sql#L45)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| HinhAnhRapID | int | NOT NULL | PK; IDENTITY | — |
| RapID | int | NOT NULL | FK → RAPCHIEUPHIM | — |
| URL | nvarchar(500) | NOT NULL | — | — |
| MoTa | nvarchar(255) | NULL | — | — |
| LaAnhDaiDien | bit | NOT NULL | — | `((0))` |
| ThuTuHienThi | int | NOT NULL | — | `((0))` |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Hoạt động')` |
| NgayTao | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |

**CHECK:**
- `CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi`: `([ThuTuHienThi]>=(0))` — [database/03_constraints/003_check_constraints.sql:207](../../database/03_constraints/003_check_constraints.sql#L207)
- `CK_HINHANH_RAPCHIEUPHIM_TrangThai`: `([TrangThai]=N'Tạm ẩn' OR [TrangThai]=N'Hoạt động')` — [database/03_constraints/003_check_constraints.sql:215](../../database/03_constraints/003_check_constraints.sql#L215)
- `CK_HINHANH_RAPCHIEUPHIM_URL`: `(len(ltrim(rtrim([URL])))>(0))` — [database/03_constraints/003_check_constraints.sql:226](../../database/03_constraints/003_check_constraints.sql#L226)

### dbo.HOSOKHACHHANG

**Source:** [database/02_tables/hosokhachhang.sql:2](../../database/02_tables/hosokhachhang.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:51](../../database/03_constraints/001_primary_unique.sql#L51)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| NguoiDungID | int | NOT NULL | PK; FK → NGUOIDUNG | — |
| NgaySinh | date | NULL | — | — |
| GioiTinh | nvarchar(10) | NULL | — | — |
| DiemTichLuy | int | NOT NULL | — | `((0))` |

**CHECK:**
- `CK_HOSOKHACHHANG_DiemTichLuy`: `([DiemTichLuy]>=(0))` — [database/03_constraints/003_check_constraints.sql:234](../../database/03_constraints/003_check_constraints.sql#L234)
- `CK_HOSOKHACHHANG_GioiTinh`: `([GioiTinh] IS NULL OR ([GioiTinh]=N'Khác' OR [GioiTinh]=N'Nữ' OR [GioiTinh]=N'Nam'))` — [database/03_constraints/003_check_constraints.sql:242](../../database/03_constraints/003_check_constraints.sql#L242)

### dbo.KHIEUNAI

**Source:** [database/02_tables/khieunai.sql:2](../../database/02_tables/khieunai.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:57](../../database/03_constraints/001_primary_unique.sql#L57)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| KhieuNaiID | int | NOT NULL | PK; IDENTITY | — |
| NguoiDungID | int | NOT NULL | FK → NGUOIDUNG | — |
| DonDatVeID | int | NULL | FK → DONDATVE | — |
| LoaiKhieuNai | nvarchar(100) | NOT NULL | — | — |
| TieuDe | nvarchar(200) | NOT NULL | — | — |
| NoiDung | nvarchar(max) | NOT NULL | — | — |
| MucDoUuTien | nvarchar(50) | NOT NULL | — | `(N'Trung bình')` |
| NgayTao | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Mới')` |

**CHECK:**
- `CK_KHIEUNAI_MucDoUuTien`: `([MucDoUuTien]=N'Khẩn cấp' OR [MucDoUuTien]=N'Cao' OR [MucDoUuTien]=N'Trung bình' OR [MucDoUuTien]=N'Thấp')` — [database/03_constraints/003_check_constraints.sql:257](../../database/03_constraints/003_check_constraints.sql#L257)
- `CK_KHIEUNAI_TrangThai`: `([TrangThai]=N'Từ chối' OR [TrangThai]=N'Đã đóng' OR [TrangThai]=N'Đã giải quyết' OR [TrangThai]=N'Đang xử lý' OR [TrangThai]=N'Mới')` — [database/03_constraints/003_check_constraints.sql:270](../../database/03_constraints/003_check_constraints.sql#L270)

### dbo.KHUYENMAI

**Source:** [database/02_tables/khuyenmai.sql:2](../../database/02_tables/khuyenmai.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:63](../../database/03_constraints/001_primary_unique.sql#L63); [database/03_constraints/001_primary_unique.sql:183](../../database/03_constraints/001_primary_unique.sql#L183)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| KhuyenMaiID | int | NOT NULL | PK; IDENTITY | — |
| MaCode | varchar(50) | NOT NULL | — | — |
| MoTa | nvarchar(255) | NULL | — | — |
| LoaiGiamGia | nvarchar(20) | NOT NULL | — | — |
| GiaTriGiam | decimal(18,2) | NOT NULL | — | — |
| DonHangToiThieu | decimal(18,2) | NOT NULL | — | `((0))` |
| GiamToiDa | decimal(18,2) | NULL | — | — |
| NgayBatDau | datetime2(7) | NOT NULL | — | — |
| NgayKetThuc | datetime2(7) | NOT NULL | — | — |
| SoLuong | int | NOT NULL | — | — |
| SoLuongDaDung | int | NOT NULL | — | `((0))` |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Hoạt động')` |

**CHECK:**
- `CK_KHUYENMAI_DonHangToiThieu`: `([DonHangToiThieu]>=(0))` — [database/03_constraints/003_check_constraints.sql:284](../../database/03_constraints/003_check_constraints.sql#L284)
- `CK_KHUYENMAI_GiamToiDa`: `([GiamToiDa] IS NULL OR [GiamToiDa]>=(0))` — [database/03_constraints/003_check_constraints.sql:292](../../database/03_constraints/003_check_constraints.sql#L292)
- `CK_KHUYENMAI_GiaTriGiam`: `([GiaTriGiam]>(0))` — [database/03_constraints/003_check_constraints.sql:303](../../database/03_constraints/003_check_constraints.sql#L303)
- `CK_KHUYENMAI_LoaiGiamGia`: `([LoaiGiamGia]=N'FIXED' OR [LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Số tiền' OR [LoaiGiamGia]=N'Phần trăm')` — [database/03_constraints/003_check_constraints.sql:311](../../database/03_constraints/003_check_constraints.sql#L311)
- `CK_KHUYENMAI_PhanTram99`: `(NOT ([LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Phần trăm') OR [GiaTriGiam]<=(99))` — [database/03_constraints/003_check_constraints.sql:324](../../database/03_constraints/003_check_constraints.sql#L324)
- `CK_KHUYENMAI_SoLuong`: `([SoLuong]>=(0) AND [SoLuongDaDung]>=(0) AND [SoLuongDaDung]<=[SoLuong])` — [database/03_constraints/003_check_constraints.sql:338](../../database/03_constraints/003_check_constraints.sql#L338)
- `CK_KHUYENMAI_ThoiGian`: `([NgayKetThuc]>=[NgayBatDau])` — [database/03_constraints/003_check_constraints.sql:350](../../database/03_constraints/003_check_constraints.sql#L350)
- `CK_KHUYENMAI_TrangThai`: `([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoạt động')` — [database/03_constraints/003_check_constraints.sql:358](../../database/03_constraints/003_check_constraints.sql#L358)

### dbo.NGUOIDUNG

**Source:** [database/02_tables/nguoidung.sql:2](../../database/02_tables/nguoidung.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:69](../../database/03_constraints/001_primary_unique.sql#L69); [database/03_constraints/001_primary_unique.sql:189](../../database/03_constraints/001_primary_unique.sql#L189)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| NguoiDungID | int | NOT NULL | PK; IDENTITY | — |
| VaiTroID | int | NOT NULL | FK → VAITRO | — |
| HoTen | nvarchar(100) | NOT NULL | — | — |
| Email | varchar(150) | NOT NULL | — | — |
| MatKhau | varchar(255) | NOT NULL | — | — |
| SoDienThoai | varchar(20) | NULL | — | — |
| NgayTao | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Hoạt động')` |

**CHECK:**
- `CK_NGUOIDUNG_TrangThai`: `([TrangThai]=N'Chưa kích hoạt' OR [TrangThai]=N'Bị khóa' OR [TrangThai]=N'Hoạt động')` — [database/03_constraints/003_check_constraints.sql:370](../../database/03_constraints/003_check_constraints.sql#L370)

### dbo.PHANCONG_RAP

**Source:** [database/02_tables/phancong_rap.sql:2](../../database/02_tables/phancong_rap.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:75](../../database/03_constraints/001_primary_unique.sql#L75)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| PhanCongID | int | NOT NULL | PK; IDENTITY | — |
| NguoiDungID | int | NOT NULL | FK → NGUOIDUNG | — |
| RapID | int | NOT NULL | FK → RAPCHIEUPHIM | — |
| NgayBatDau | date | NOT NULL | — | — |
| NgayKetThuc | date | NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Hiệu lực')` |

**CHECK:**
- `CK_PHANCONG_RAP_ThoiGian`: `([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau])` — [database/03_constraints/003_check_constraints.sql:382](../../database/03_constraints/003_check_constraints.sql#L382)
- `CK_PHANCONG_RAP_TrangThai`: `([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hiệu lực')` — [database/03_constraints/003_check_constraints.sql:393](../../database/03_constraints/003_check_constraints.sql#L393)

### dbo.PHIM

**Source:** [database/02_tables/phim.sql:2](../../database/02_tables/phim.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:81](../../database/03_constraints/001_primary_unique.sql#L81)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| PhimID | int | NOT NULL | PK; IDENTITY | — |
| TenPhim | nvarchar(255) | NOT NULL | — | — |
| ThoiLuong | int | NOT NULL | — | — |
| NgayKhoiChieu | date | NOT NULL | — | — |
| NgayKetThuc | date | NULL | — | — |
| NgonNgu | nvarchar(100) | NULL | — | — |
| PhuDe | nvarchar(100) | NULL | — | — |
| DoTuoi | nvarchar(20) | NULL | — | — |
| DaoDien | nvarchar(150) | NULL | — | — |
| MoTa | nvarchar(max) | NULL | — | — |
| PosterURL | nvarchar(500) | NULL | — | — |
| TrailerURL | nvarchar(500) | NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Sắp chiếu')` |

**CHECK:**
- `CK_PHIM_DoTuoi`: `([DoTuoi] IS NULL OR ([DoTuoi]=N'C' OR [DoTuoi]=N'T18' OR [DoTuoi]=N'T16' OR [DoTuoi]=N'T13' OR [DoTuoi]=N'K' OR [DoTuoi]=N'P'))` — [database/03_constraints/003_check_constraints.sql:405](../../database/03_constraints/003_check_constraints.sql#L405)
- `CK_PHIM_ThoiGian`: `([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayKhoiChieu])` — [database/03_constraints/003_check_constraints.sql:423](../../database/03_constraints/003_check_constraints.sql#L423)
- `CK_PHIM_ThoiLuong`: `([ThoiLuong]>(0))` — [database/03_constraints/003_check_constraints.sql:434](../../database/03_constraints/003_check_constraints.sql#L434)
- `CK_PHIM_TrangThai`: `([TrangThai]=N'Ngừng chiếu' OR [TrangThai]=N'Đang chiếu' OR [TrangThai]=N'Sắp chiếu')` — [database/03_constraints/003_check_constraints.sql:442](../../database/03_constraints/003_check_constraints.sql#L442)

### dbo.PHIM_DIENVIEN

**Source:** [database/02_tables/phim_dienvien.sql:2](../../database/02_tables/phim_dienvien.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:87](../../database/03_constraints/001_primary_unique.sql#L87)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| PhimID | int | NOT NULL | PK; FK → PHIM | — |
| DienVienID | int | NOT NULL | PK; FK → DIENVIEN | — |
| VaiDien | nvarchar(150) | NULL | — | — |

**CHECK:** không có.

### dbo.PHIM_THELOAI

**Source:** [database/02_tables/phim_theloai.sql:2](../../database/02_tables/phim_theloai.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:93](../../database/03_constraints/001_primary_unique.sql#L93)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| PhimID | int | NOT NULL | PK; FK → PHIM | — |
| TheLoaiID | int | NOT NULL | PK; FK → THELOAI | — |

**CHECK:** không có.

### dbo.PHONGCHIEU

**Source:** [database/02_tables/phongchieu.sql:2](../../database/02_tables/phongchieu.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:99](../../database/03_constraints/001_primary_unique.sql#L99); [database/03_constraints/001_primary_unique.sql:195](../../database/03_constraints/001_primary_unique.sql#L195)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| PhongID | int | NOT NULL | PK; IDENTITY | — |
| RapID | int | NOT NULL | FK → RAPCHIEUPHIM | — |
| TenPhong | nvarchar(100) | NOT NULL | — | — |
| LoaiPhong | nvarchar(50) | NOT NULL | — | `(N'2D')` |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Hoạt động')` |

**CHECK:**
- `CK_PHONGCHIEU_LoaiPhong`: `([LoaiPhong]=N'ScreenX' OR [LoaiPhong]=N'4DX' OR [LoaiPhong]=N'IMAX' OR [LoaiPhong]=N'3D' OR [LoaiPhong]=N'2D')` — [database/03_constraints/003_check_constraints.sql:454](../../database/03_constraints/003_check_constraints.sql#L454)
- `CK_PHONGCHIEU_TrangThai`: `([TrangThai]=N'Ngưng hoạt động' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động')` — [database/03_constraints/003_check_constraints.sql:468](../../database/03_constraints/003_check_constraints.sql#L468)

### dbo.QUYEN

**Source:** [database/02_tables/quyen.sql:2](../../database/02_tables/quyen.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:105](../../database/03_constraints/001_primary_unique.sql#L105); [database/03_constraints/001_primary_unique.sql:201](../../database/03_constraints/001_primary_unique.sql#L201)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| QuyenID | int | NOT NULL | PK; IDENTITY | — |
| MaQuyen | varchar(50) | NOT NULL | — | — |
| TenQuyen | nvarchar(100) | NOT NULL | — | — |
| MoTa | nvarchar(255) | NULL | — | — |

**CHECK:** không có.

### dbo.RAPCHIEUPHIM

**Source:** [database/02_tables/rapchieuphim.sql:2](../../database/02_tables/rapchieuphim.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:111](../../database/03_constraints/001_primary_unique.sql#L111)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| RapID | int | NOT NULL | PK; IDENTITY | — |
| TenRap | nvarchar(150) | NOT NULL | — | — |
| DiaChi | nvarchar(255) | NOT NULL | — | — |
| ThanhPho | nvarchar(100) | NOT NULL | — | — |
| SoDienThoai | varchar(20) | NULL | — | — |
| MoTa | nvarchar(500) | NULL | — | — |
| NgayHoatDong | date | NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Hoạt động')` |

**CHECK:**
- `CK_RAPCHIEUPHIM_TrangThai`: `([TrangThai]=N'Tạm đóng' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động')` — [database/03_constraints/003_check_constraints.sql:480](../../database/03_constraints/003_check_constraints.sql#L480)

### dbo.SANPHAM

**Source:** [database/02_tables/sanpham.sql:2](../../database/02_tables/sanpham.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:117](../../database/03_constraints/001_primary_unique.sql#L117)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| SanPhamID | int | NOT NULL | PK; IDENTITY | — |
| TenSanPham | nvarchar(150) | NOT NULL | — | — |
| LoaiSanPham | nvarchar(50) | NOT NULL | — | — |
| Gia | decimal(18,2) | NOT NULL | — | — |
| MoTa | nvarchar(255) | NULL | — | — |
| HinhAnh | nvarchar(500) | NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Đang bán')` |

**CHECK:**
- `CK_SANPHAM_Gia`: `([Gia]>=(0))` — [database/03_constraints/003_check_constraints.sql:492](../../database/03_constraints/003_check_constraints.sql#L492)
- `CK_SANPHAM_LoaiSanPham`: `([LoaiSanPham]=N'Khác' OR [LoaiSanPham]=N'Snack' OR [LoaiSanPham]=N'Combo' OR [LoaiSanPham]=N'Nước ngọt' OR [LoaiSanPham]=N'Bắp rang')` — [database/03_constraints/003_check_constraints.sql:500](../../database/03_constraints/003_check_constraints.sql#L500)
- `CK_SANPHAM_TrangThai`: `([TrangThai]=N'Ngừng bán' OR [TrangThai]=N'Hết hàng' OR [TrangThai]=N'Đang bán')` — [database/03_constraints/003_check_constraints.sql:514](../../database/03_constraints/003_check_constraints.sql#L514)

### dbo.SUATCHIEU

**Source:** [database/02_tables/suatchieu.sql:2](../../database/02_tables/suatchieu.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:123](../../database/03_constraints/001_primary_unique.sql#L123)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| SuatChieuID | int | NOT NULL | PK; IDENTITY | — |
| PhimID | int | NOT NULL | FK → PHIM | — |
| PhongID | int | NOT NULL | FK → PHONGCHIEU | — |
| ThoiGianBatDau | datetime2(7) | NOT NULL | — | — |
| ThoiGianKetThuc | datetime2(7) | NOT NULL | — | — |
| DinhDang | nvarchar(50) | NOT NULL | — | `(N'2D')` |
| GiaVeCoBan | decimal(18,2) | NOT NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Mở bán')` |

**CHECK:**
- `CK_SUATCHIEU_DinhDang`: `([DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D')` — [database/03_constraints/003_check_constraints.sql:526](../../database/03_constraints/003_check_constraints.sql#L526)
- `CK_SUATCHIEU_GiaVeCoBan`: `([GiaVeCoBan]>=(0))` — [database/03_constraints/003_check_constraints.sql:540](../../database/03_constraints/003_check_constraints.sql#L540)
- `CK_SUATCHIEU_ThoiGian`: `([ThoiGianKetThuc]>[ThoiGianBatDau])` — [database/03_constraints/003_check_constraints.sql:548](../../database/03_constraints/003_check_constraints.sql#L548)
- `CK_SUATCHIEU_TrangThai`: `([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đóng bán' OR [TrangThai]=N'Mở bán')` — [database/03_constraints/003_check_constraints.sql:556](../../database/03_constraints/003_check_constraints.sql#L556)

### dbo.THANHTOAN

**Source:** [database/02_tables/thanhtoan.sql:2](../../database/02_tables/thanhtoan.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:129](../../database/03_constraints/001_primary_unique.sql#L129)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| ThanhToanID | int | NOT NULL | PK; IDENTITY | — |
| DonDatVeID | int | NOT NULL | FK → DONDATVE | — |
| PhuongThuc | nvarchar(50) | NOT NULL | — | — |
| SoTien | decimal(18,2) | NOT NULL | — | — |
| NgayTao | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |
| NgayThanhToan | datetime2(7) | NULL | — | — |
| MaGiaoDich | varchar(100) | NULL | — | — |
| TrangThai | nvarchar(50) | NOT NULL | — | `(N'Đang xử lý')` |
| GhiChu | nvarchar(255) | NULL | — | — |

**CHECK:**
- `CK_THANHTOAN_PhuongThuc`: `([PhuongThuc]=N'TIEN_MAT' OR [PhuongThuc]=N'THE_QUOC_TE' OR [PhuongThuc]=N'THE_NOI_DIA' OR [PhuongThuc]=N'ZALOPAY' OR [PhuongThuc]=N'MOMO' OR [PhuongThuc]=N'VNPAY')` — [database/03_constraints/003_check_constraints.sql:569](../../database/03_constraints/003_check_constraints.sql#L569)
- `CK_THANHTOAN_SoTien`: `([SoTien]>=(0))` — [database/03_constraints/003_check_constraints.sql:584](../../database/03_constraints/003_check_constraints.sql#L584)
- `CK_THANHTOAN_TrangThai`: `([TrangThai]=N'Đã hoàn tiền' OR [TrangThai]=N'Thất bại' OR [TrangThai]=N'Thành công' OR [TrangThai]=N'Đang xử lý')` — [database/03_constraints/003_check_constraints.sql:592](../../database/03_constraints/003_check_constraints.sql#L592)

### dbo.THELOAI

**Source:** [database/02_tables/theloai.sql:2](../../database/02_tables/theloai.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:135](../../database/03_constraints/001_primary_unique.sql#L135); [database/03_constraints/001_primary_unique.sql:207](../../database/03_constraints/001_primary_unique.sql#L207)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| TheLoaiID | int | NOT NULL | PK; IDENTITY | — |
| TenTheLoai | nvarchar(100) | NOT NULL | — | — |

**CHECK:** không có.

### dbo.VAITRO

**Source:** [database/02_tables/vaitro.sql:2](../../database/02_tables/vaitro.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:141](../../database/03_constraints/001_primary_unique.sql#L141); [database/03_constraints/001_primary_unique.sql:213](../../database/03_constraints/001_primary_unique.sql#L213)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| VaiTroID | int | NOT NULL | PK; IDENTITY | — |
| MaVaiTro | varchar(50) | NOT NULL | — | — |
| TenVaiTro | nvarchar(100) | NOT NULL | — | — |
| MoTa | nvarchar(255) | NULL | — | — |

**CHECK:** không có.

### dbo.VAITRO_QUYEN

**Source:** [database/02_tables/vaitro_quyen.sql:2](../../database/02_tables/vaitro_quyen.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:147](../../database/03_constraints/001_primary_unique.sql#L147)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| VaiTroID | int | NOT NULL | PK; FK → VAITRO | — |
| QuyenID | int | NOT NULL | PK; FK → QUYEN | — |
| NgayGan | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |

**CHECK:** không có.

### dbo.XULY_KHIEUNAI

**Source:** [database/02_tables/xuly_khieunai.sql:2](../../database/02_tables/xuly_khieunai.sql#L2); **keys:** [database/03_constraints/001_primary_unique.sql:153](../../database/03_constraints/001_primary_unique.sql#L153)

| Thuộc tính | Kiểu | NULL | PK / FK / identity | DEFAULT |
|---|---|---|---|---|
| XuLyID | int | NOT NULL | PK; IDENTITY | — |
| KhieuNaiID | int | NOT NULL | FK → KHIEUNAI | — |
| NguoiXuLyID | int | NOT NULL | FK → NGUOIDUNG | — |
| NoiDungXuLy | nvarchar(max) | NOT NULL | — | — |
| NgayXuLy | datetime2(7) | NOT NULL | — | `([dbo].[fn_BayGio]())` |
| TrangThaiSauXuLy | nvarchar(50) | NOT NULL | — | — |

**CHECK:**
- `CK_XULY_KHIEUNAI_TrangThaiSauXuLy`: `([TrangThaiSauXuLy]=N'Từ chối' OR [TrangThaiSauXuLy]=N'Đã đóng' OR [TrangThaiSauXuLy]=N'Đã giải quyết' OR [TrangThaiSauXuLy]=N'Đang xử lý')` — [database/03_constraints/003_check_constraints.sql:605](../../database/03_constraints/003_check_constraints.sql#L605)

## Phụ lục B — Dependency impact và bằng chứng tái kiểm tra

Các dependency sau là sys.sql_expression_dependencies hiện tại, dùng để khoanh vùng review nếu thay schema; không phải danh sách thay đổi đã thực hiện. Dynamic SQL hoặc SELECT * bên ngoài metadata có thể cần tìm thêm trong repository.

| Bảng trọng tâm | Module trực tiếp tham chiếu |
|---|---|
| THANHTOAN | CK_THANHTOAN_PhuongThuc, CK_THANHTOAN_SoTien, CK_THANHTOAN_TrangThai, sp_Admin_Dashboard, sp_Admin_Report_Revenue, sp_Manager_Dashboard, sp_Manager_Revenue, sp_Order_GetDetailByCustomer, sp_Payment_CreateAttempt, sp_Payment_UpdateResult, sp_Showtime_CancelCascade, sp_StaffBooking_Cancel, sp_StaffBooking_Detail, sp_StaffBooking_UpdateSeats, sp_Support_Complaint_GetOrderReference, THANHTOAN, vw_DoanhThuTheoRap, vw_LichSuDatVe |
| KHIEUNAI | CK_KHIEUNAI_MucDoUuTien, CK_KHIEUNAI_TrangThai, KHIEUNAI, sp_Admin_Dashboard, sp_Complaint_Create, sp_Complaint_GetByCustomer, sp_Complaint_ListByCustomer, sp_Support_Complaint_AddProcessing, sp_Support_Complaint_GetDetail, sp_Support_Complaint_GetOrderReference, sp_Support_Complaint_UpdateStatus, TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai, vw_DanhSachKhieuNai |
| BANGGIA | CK_BANGGIA_DinhDang, CK_BANGGIA_LoaiGhe, CK_BANGGIA_LoaiNgay, CK_BANGGIA_PhuThu, CK_BANGGIA_ThoiGian, CK_BANGGIA_TrangThai, fn_TinhGiaVe, sp_Admin_Cinema_Delete, sp_Manager_Pricing_Create, sp_Manager_Pricing_List, sp_Manager_Pricing_Update, TRG_BangGia_KiemTraChongLan, usp_Admin_Pricing_Create, usp_Admin_Pricing_List, usp_Admin_Pricing_Update |
| PHANCONG_RAP | CK_PHANCONG_RAP_ThoiGian, CK_PHANCONG_RAP_TrangThai, fn_KiemTraQuanLyRapScope, sp_Admin_Assignment_Create, sp_Admin_Assignment_List, sp_Admin_Cinema_Delete, sp_Auth_Login, sp_Manager_ListAssignedCinemas, sp_StaffBooking_Authorize, usp_Admin_Assignment_Update |
| RAPCHIEUPHIM | CK_RAPCHIEUPHIM_TrangThai, sp_Admin_Assignment_Create, sp_Admin_Assignment_List, sp_Admin_Cinema_Create, sp_Admin_Cinema_Delete, sp_Admin_Cinema_Update, sp_Admin_Dashboard, sp_Admin_Report_Revenue, sp_Auth_Login, sp_Booking_Create, sp_Cinema_GetImages, sp_Cinema_List, sp_Manager_Dashboard, sp_Manager_ListAssignedCinemas, sp_Manager_Room_List, sp_Manager_Showtime_List, sp_StaffBooking_LockShow, sp_StaffBooking_Options, TRG_BangGia_KiemTraChongLan, usp_Admin_Assignment_Update, usp_Admin_Cinema_List, usp_Admin_CinemaImage_Create, usp_Admin_CinemaImage_List, usp_Admin_Pricing_Create, usp_Admin_Pricing_List, usp_Admin_Room_Create, usp_Admin_Room_List, usp_Admin_Seat_List, usp_Admin_Showtime_List, vw_ChiTietDonDatVe, vw_DoanhThuTheoRap, vw_LichChieuChiTiet, vw_LichSuDatVe |

**Bằng chứng local (ignored, không chứa mật khẩu hoặc rows cá nhân):**

- `.audit-output/normalization-audit/source-inventory.json`: inventory parse lại từ source, CHECK/predicate và SHA-256 của SQL trước audit.
- `.audit-output/normalization-audit/runtime-metadata.json`: catalog metadata đọc trực tiếp.
- `.audit-output/normalization-audit/runtime-comparison.json`: parity và các count quan sát.
- `.audit-output/normalization-audit/inspect.mjs`: truy vấn SELECT-only; không gọi SP, không chạy script seed/test/migration.
- `.audit-output/normalization-audit/summary.json`: counts/verdict và kết quả kiểm tra báo cáo.

Audit dựa trên trạng thái source/runtime tại thời điểm thu thập; không phải snapshot transaction của hoạt động ứng dụng đồng thời. Cần thu lại metadata nếu có deployment sau thời điểm đó.
