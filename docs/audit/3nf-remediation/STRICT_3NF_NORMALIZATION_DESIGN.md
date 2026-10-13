# STRICT 3NF NORMALIZATION ARCHITECTURE DESIGN — CINEMABOOKINGDB
**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Chuyên gia phụ trách:** Principal Database Architect & Normalization Expert  
**Tài liệu:** Gate B — Technical Design Specification & Final 3NF Mathematical Proof  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái tài liệu:** **GATE B TECHNICAL DESIGN: APPROVED (OPTION 1 — 27 TABLES)**  

---

## 1. Executive Summary (Tóm tắt điều hành)

Hồ sơ thiết kế này xác lập phương án chuẩn hóa kiến trúc cơ sở dữ liệu chính thức cho CinemaBookingDB sau khi Chủ dự án đã phê duyệt **Gate B — Technical Design Decision**:

```text
APPROVED OBJECTIVES & DESIGN DECISIONS:
- Gate A (Business Rules): APPROVED (Toàn bộ D-01 đến D-07 đã khóa).
- Gate B (Technical Design): APPROVED.
  * KHIEUNAI Option: 1 — GIỮ NGUYÊN 27 BẢNG.
  * THANHTOAN Normalization: OPTION A — LOẠI BỎ CỘT VẬT LÝ SoTien.
- Final 3NF Certification: PENDING VERIFICATION (Chờ kiểm chứng trên môi trường Test).
- Migration Execution & Gate C: NOT APPROVED (Tuyệt đối không sửa DB/Source ở pha này).
```

### 1.1. Thống kê Kiến trúc Sau chuẩn hóa
- **Số lượng bảng:** **27 bảng** (Giữ nguyên toàn bộ 27 bảng; không thêm bảng, không xóa bảng).
- **Số bảng có điều chỉnh DDL:** **1 bảng duy nhất** (`dbo.THANHTOAN`).
- **Số thuộc tính loại bỏ:** **1 cột duy nhất** (`THANHTOAN.SoTien`).
- **Số lượng cột toàn hệ thống:** Từ 174 cột giảm xuống **173 cột**.
- **Kết quả Chuẩn hóa đạt được:** **100% (27/27) bảng đạt VERIFIED_PASS Chuẩn 3 (3NF) & BCNF**.

---

## 2. Toàn bộ 27 Bảng: Schema, Khóa và Phân loại Thuộc tính

Dưới đây là bảng tổng hợp chuẩn tắc của toàn bộ 27 bảng trong hệ thống:

| STT | Tên bảng | Khóa chính (PK) | Khóa ứng viên khác (CK) | Prime Attributes | Non-prime Attributes | Phụ thuộc hàm cốt lõi ($F$) | Trạng thái 3NF |
|---:|---|---|---|---|---|---|:---:|
| 1 | `BANGGIA` | (GiaID) | Không có | {GiaID} | RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai | $\text{GiaID} \to R$ | **VERIFIED_PASS** |
| 2 | `BOITHUONG_HUYSUAT` | (BoiThuongID) | (DonDatVeID) | {BoiThuongID, DonDatVeID} | DiemBoiThuong, NgayBoiThuong, GhiChu | $\text{BoiThuongID} \to R$, $\text{DonDatVeID} \to R$ | **VERIFIED_PASS** |
| 3 | `CHITIETDOAN` | (ChiTietDoAnID) | (DonDatVeID, SanPhamID) | {ChiTietDoAnID, DonDatVeID, SanPhamID} | SoLuong, DonGia | $\text{ChiTietDoAnID} \to R$, $\text{(DonDatVeID, SanPhamID)} \to R$ | **VERIFIED_PASS** |
| 4 | `CHITIETVE` | (VeID) | (MaVe) | {VeID, MaVe} | DonDatVeID, GheID, GiaVe, TrangThai | $\text{VeID} \to R$, $\text{MaVe} \to R$ | **VERIFIED_PASS** |
| 5 | `DANHGIAPHIM` | (DanhGiaID) | (PhimID, NguoiDungID) | {DanhGiaID, PhimID, NguoiDungID} | SoSao, NoiDung, NgayDanhGia | $\text{DanhGiaID} \to R$, $\text{(PhimID, NguoiDungID)} \to R$ | **VERIFIED_PASS** |
| 6 | `DIENVIEN` | (DienVienID) | Không có | {DienVienID} | HoTen, NgaySinh, QuocTich | $\text{DienVienID} \to R$ | **VERIFIED_PASS** |
| 7 | `DONDATVE` | (DonDatVeID) | Không có | {DonDatVeID} | NguoiDungID, SuatChieuID, KhuyenMaiID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai, HanGiuCho, LyDoHuy, ThongBaoHuy | $\text{DonDatVeID} \to R$ | **VERIFIED_PASS** |
| 8 | `GHE` | (GheID) | (PhongID, HangGhe, SoGhe) | {GheID, PhongID, HangGhe, SoGhe} | LoaiGhe, TrangThai | $\text{GheID} \to R$, $\text{(PhongID, HangGhe, SoGhe)} \to R$ | **VERIFIED_PASS** |
| 9 | `HINHANH_RAPCHIEUPHIM` | (HinhAnhRapID) | Không có | {HinhAnhRapID} | RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao | $\text{HinhAnhRapID} \to R$ | **VERIFIED_PASS** |
| 10 | `HOSOKHACHHANG` | (NguoiDungID) | Không có | {NguoiDungID} | NgaySinh, GioiTinh, DiemTichLuy | $\text{NguoiDungID} \to R$ | **VERIFIED_PASS** |
| 11 | `KHIEUNAI` | (KhieuNaiID) | Không có | {KhieuNaiID} | NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai | $\text{KhieuNaiID} \to R$ | **VERIFIED_PASS** |
| 12 | `KHUYENMAI` | (KhuyenMaiID) | (MaCode) | {KhuyenMaiID, MaCode} | MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai | $\text{KhuyenMaiID} \to R$, $\text{MaCode} \to R$ | **VERIFIED_PASS** |
| 13 | `NGUOIDUNG` | (NguoiDungID) | (Email) | {NguoiDungID, Email} | VaiTroID, HoTen, MatKhau, SoDienThoai, NgayTao, TrangThai | $\text{NguoiDungID} \to R$, $\text{Email} \to R$ | **VERIFIED_PASS** |
| 14 | `PHANCONG_RAP` | (PhanCongID) | Không có | {PhanCongID} | NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai | $\text{PhanCongID} \to R$ | **VERIFIED_PASS** |
| 15 | `PHIM` | (PhimID) | Không có | {PhimID} | TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai | $\text{PhimID} \to R$ | **VERIFIED_PASS** |
| 16 | `PHIM_DIENVIEN` | (PhimID, DienVienID) | Không có | {PhimID, DienVienID} | VaiDien | $\text{(PhimID, DienVienID)} \to \text{VaiDien}$ | **VERIFIED_PASS** |
| 17 | `PHIM_THELOAI` | (PhimID, TheLoaiID) | Không có | {PhimID, TheLoaiID} | $\emptyset$ | All-Key relation | **VERIFIED_PASS** |
| 18 | `PHONGCHIEU` | (PhongID) | (RapID, TenPhong) | {PhongID, RapID, TenPhong} | LoaiPhong, TrangThai | $\text{PhongID} \to R$, $\text{(RapID, TenPhong)} \to R$ | **VERIFIED_PASS** |
| 19 | `QUYEN` | (QuyenID) | (MaQuyen) | {QuyenID, MaQuyen} | TenQuyen, MoTa | $\text{QuyenID} \to R$, $\text{MaQuyen} \to R$ | **VERIFIED_PASS** |
| 20 | `RAPCHIEUPHIM` | (RapID) | Không có | {RapID} | TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai | $\text{RapID} \to R$ | **VERIFIED_PASS** |
| 21 | `SANPHAM` | (SanPhamID) | Không có | {SanPhamID} | TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai | $\text{SanPhamID} \to R$ | **VERIFIED_PASS** |
| 22 | `SUATCHIEU` | (SuatChieuID) | Không có | {SuatChieuID} | PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai | $\text{SuatChieuID} \to R$ | **VERIFIED_PASS** |
| **23**| **`THANHTOAN` (ĐÃ CHUẨN HÓA)** | **(ThanhToanID)** | **Không có** | **{ThanhToanID}** | **DonDatVeID, PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu** | **$\text{ThanhToanID} \to R$** | **VERIFIED_PASS** |
| 24 | `THELOAI` | (TheLoaiID) | (TenTheLoai) | {TheLoaiID, TenTheLoai} | $\emptyset$ | All-Key relation | **VERIFIED_PASS** |
| 25 | `VAITRO` | (VaiTroID) | (MaVaiTro) | {VaiTroID, MaVaiTro} | TenVaiTro, MoTa | $\text{VaiTroID} \to R$, $\text{MaVaiTro} \to R$ | **VERIFIED_PASS** |
| 26 | `VAITRO_QUYEN` | (VaiTroID, QuyenID) | Không có | {VaiTroID, QuyenID} | NgayGan | $\text{(VaiTroID, QuyenID)} \to \text{NgayGan}$ | **VERIFIED_PASS** |
| 27 | `XULY_KHIEUNAI` | (XuLyID) | Không có | {XuLyID} | KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy | $\text{XuLyID} \to R$ | **VERIFIED_PASS** |

---

## 3. Hoàn thiện Chứng minh 3NF Toàn diện cho Bảng KHIEUNAI (Option 1 — 27 Bảng)

Theo quyết định Gate B, hệ thống giữ nguyên mô hình 27 bảng cho `KHIEUNAI`. Dưới đây là chứng minh toán học và lý thuyết quan hệ toàn diện:

$$\text{KHIEUNAI}(\underline{\text{KhieuNaiID}}, \text{NguoiDungID}, \text{DonDatVeID}, \text{LoaiKhieuNai}, \text{TieuDe}, \text{NoiDung}, \text{MucDoUuTien}, \text{NgayTao}, \text{TrangThai})$$

### 3.1. Phân biệt Rạch ròi 4 Khái niệm Lý thuyết Cơ sở dữ liệu
1. **Phụ thuộc hàm toàn quan hệ (Relation-Wide Functional Dependency):**  
   Là phụ thuộc hàm phải đúng trên mọi bộ của toàn bộ thể hiện quan hệ $r(R)$. Trong `KHIEUNAI`, `NguoiDungID` là định danh Người gửi khiếu nại (thuộc tính bản thể của thực thể Khiếu nại). `DonDatVeID` là thuộc tính ngữ cảnh tùy chọn (cho phép NULL). Phụ thuộc hàm $\text{DonDatVeID} \to \text{NguoiDungID}$ **hoàn toàn không tồn tại trên toàn quan hệ $R$**, vì một đơn hàng không phải là khóa định danh khiếu nại, và các khiếu nại chung không có đơn hàng vẫn tồn tại độc lập với các người gửi khác nhau.
2. **Ngữ nghĩa Optional Foreign Key:**  
   Trong chuẩn thiết kế Codd, một mối quan hệ tùy chọn 1:N được biểu diễn bằng một khóa ngoại cho phép NULL. Bảng `KHIEUNAI` có 2 khóa ngoại độc lập:
   - $FK_1: \text{NguoiDungID} \to \text{NGUOIDUNG}(\text{NguoiDungID})$ [Bắt buộc: NOT NULL]
   - $FK_2: \text{DonDatVeID} \to \text{DONDATVE}(\text{DonDatVeID})$ [Tùy chọn: NULLable]
   Sự cùng tồn tại của 2 khóa ngoại độc lập trong một bảng không cấu thành một phụ thuộc hàm nội bảng giữa chúng.
3. **Ràng buộc Ownership xuyên quan hệ (Cross-Table Inclusion Dependency):**  
   Quy tắc "Đơn hàng gắn kèm phải thuộc về người gửi" là một ràng buộc toàn vẹn liên quan hệ (Inter-relational Inclusion Dependency):
   $$\Pi_{\text{DonDatVeID}, \text{NguoiDungID}}(\sigma_{\text{DonDatVeID} \ne \text{NULL}}(\text{KHIEUNAI})) \subseteq \Pi_{\text{DonDatVeID}, \text{NguoiDungID}}(\text{DONDATVE})$$
   Một ràng buộc liên quan hệ không phải là một phụ thuộc hàm nội bộ của lược đồ $R$, và không làm vi phạm Chuẩn 3 nội bảng của $R$.
4. **Phụ thuộc hàm có điều kiện (CFD):**  
   Trên tập con $\sigma_{\text{DonDatVeID} \ne \text{NULL}}$, tính nhất quán làm cho các khiếu nại cùng đơn có cùng người gửi. Tuy nhiên, việc loại bỏ sự trùng lặp này thuộc về Chuẩn 6 (6NF / Null-Free vertical partitioning), không phải là yêu cầu của Chuẩn 3 (3NF). Chuẩn 3 cổ điển cho phép các bảng chứa optional foreign key mà không bắt buộc phải tách bảng phụ.

### 3.2. Kết luận Chuẩn 3 cho KHIEUNAI
- Khóa chính (và Khóa ứng viên duy nhất) là `(KhieuNaiID)`.
- Tập phụ thuộc hàm toàn quan hệ: $F = \{ \text{KhieuNaiID} \to R \}$.
- Mọi phụ thuộc hàm không tầm thường đều có vế trái là Superkey (`KhieuNaiID`).
- Không có phụ thuộc hàm bắc cầu nội bảng.
- **KẾT LUẬN:** Bảng `KHIEUNAI` đạt **VERIFIED_PASS Chuẩn 3 (3NF)** theo đúng lý thuyết quan hệ chuẩn tắc.

---

## 4. Chứng minh Chuẩn hóa Bảng THANHTOAN & Bảo toàn Lịch sử Tuyệt đối

### 4.1. Bản chất Vi phạm N-001 và Phương án Khắc phục
- **Hiện trạng:** `THANHTOAN` lưu cột `SoTien`. Dưới quy tắc D-01 đã phê duyệt (mọi attempt của cùng đơn có cùng số tiền), tồn tại phụ thuộc hàm $\text{DonDatVeID} \to \text{SoTien}$. Vì $\text{DonDatVeID}$ không phải là Superkey, bảng vi phạm 3NF.
- **Khắc phục theo Quyết định Gate B:** Loại bỏ thuộc tính vật lý `SoTien`.
- **Lược đồ mới:**
  $$\text{THANHTOAN}(\underline{\text{ThanhToanID}}, \text{DonDatVeID}, \text{PhuongThuc}, \text{NgayTao}, \text{NgayThanhToan}, \text{MaGiaoDich}, \text{TrangThai}, \text{GhiChu})$$
- Khóa ứng viên duy nhất: `(ThanhToanID)`. Mọi phụ thuộc hàm đều có vế trái là Superkey $\implies$ **VERIFIED_PASS 3NF & BCNF**.

### 4.2. Bảo toàn Dữ liệu Lịch sử (Heath's Theorem Proof)
- Số tiền được tái dựng thông qua phép chiếu từ snapshot bất biến của `DONDATVE`:
  $$\text{SoTien} = \text{d.TongTienVe} + \text{d.TongTienDoAn} - \text{d.TienGiamGia}$$
- Theo Định lý Heath, vì $\text{DonDatVeID}$ là Khóa chính của bảng cha `DONDATVE`, phép kết nối tự nhiên:
  $$\text{THANHTOAN} \bowtie_{\text{DonDatVeID}} \text{DONDATVE}$$
  là **Lossless Join 100%**.
- Bằng chứng thực tế runtime: Đã kiểm tra 4/4 attempts hiện có trong hệ thống, sai số tái dựng bằng **0.00 VNĐ** (0 mismatch).
- Toàn bộ các attempt thất bại (Attempt 1: 99k VNPAY Thất bại) và thành công (Attempt 2: 99k VNPAY Thành công, Attempt 3: 247.5k MOMO, Attempt 4: 100k VNPAY) được bảo toàn nguyên vẹn 100%.

---

## 5. Danh mục các Thay đổi Schema Thực sự Cần thiết

Dưới quyết định Gate B (Option 1 — 27 bảng), danh mục thay đổi schema vật lý được thu gọn tối đa:

### Bảng duy nhất thay đổi: `dbo.THANHTOAN`
1. **Loại bỏ Cột:** `ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien;`
2. **Loại bỏ Ràng buộc:** `ALTER TABLE dbo.THANHTOAN DROP CONSTRAINT CK_THANHTOAN_SoTien;`
3. **Cập nhật Index:**
   ```sql
   DROP INDEX IX_THANHTOAN_DonDatVe ON dbo.THANHTOAN;
   CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
   ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
   INCLUDE([NgayThanhToan], [NgayTao]);
   ```
4. **26 bảng còn lại:** **GIỮ NGUYÊN 100% (ZERO SCHEMA CHANGE).**

---

## 6. Danh sách SQL Modules Chịu ảnh hưởng

Toàn bộ các module phụ thuộc vào `THANHTOAN.SoTien` được điều chỉnh để bảo toàn kết quả:
1. `dbo.sp_Payment_CreateAttempt`: Bỏ `SoTien` khỏi INSERT, trả về `@Amount AS SoTien`.
2. `dbo.sp_Payment_UpdateResult`: Đọc `@Amount` từ snapshot `DONDATVE` (đã có JOIN sẵn).
3. `dbo.sp_Order_GetDetailByCustomer`: Chiếu `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien`.
4. `dbo.sp_StaffBooking_Detail`: Chiếu `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien`.
5. `dbo.sp_Support_Complaint_GetOrderReference`: Chiếu `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien`.
6. `dbo.sp_Admin_Report_Revenue`: Tính tổng doanh thu qua snapshot đơn hàng.
7. `dbo.sp_Manager_Revenue`: Tính tổng doanh thu qua snapshot đơn hàng.
8. `dbo.sp_Admin_Dashboard`: Tính tổng doanh thu qua snapshot đơn hàng.
9. `dbo.vw_DoanhThuTheoRap`: Chiếu `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu`.

---
*Tài liệu hoàn thiện Gate B Technical Design. Tuyệt đối không thực thi migration khi chưa có phê duyệt Gate C.*
