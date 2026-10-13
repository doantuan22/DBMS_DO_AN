# R8 STRICT 3NF FINAL CERTIFICATION — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R8 — Final 3NF Certification & Production Release Readiness  
**Vai trò:** Principal Database Architect & Mathematical Normalization Lead  
**Ngày thực hiện:** 13/10/2026  
**Phạm vi:** Kiểm toán toán học và chứng nhận chuẩn hóa Strict 3NF cho toàn bộ 27 bảng nghiệp vụ.  

---

## 1. Cơ sở Lý thuyết Chuẩn hóa Dữ liệu (Relational Normalization Theory)

Cho lược đồ quan hệ $R(U)$ với tập thuộc tính $U$ và tập phụ thuộc hàm $F$.
- **1NF (First Normal Form):** Mọi miền giá trị của các thuộc tính trong $U$ đều chứa các giá trị nguyên tố (atomic values). Không tồn tại tập hợp con, mảng hoặc quan hệ lồng nhau.
- **2NF (Second Normal Form):** $R$ đạt 1NF và mọi thuộc tính không khóa (non-prime attribute) đều phụ thuộc hàm đầy đủ (fully functionally dependent) vào bất kỳ khóa ứng viên nào của $R$. Tức là: Không tồn tại $X \subset K$ (với $K$ là khóa ứng viên) sao cho $X \to A$ với $A \notin K$.
- **3NF (Third Normal Form):** $R$ đạt 2NF và không tồn tại phụ thuộc hàm bắc cầu từ khóa ứng viên đến bất kỳ thuộc tính không khóa nào. Định nghĩa hình thức:  
  Với mọi phụ thuộc hàm không tầm thường $X \to Y \in F^+$ ($Y \nsubseteq X$), ít nhất một trong hai điều kiện sau phải thỏa mãn:
  1. $X$ là một siêu khóa (superkey) của $R$ ($X \to U$).
  2. Mỗi thuộc tính $A \in (Y - X)$ là một thuộc tính khóa (prime attribute — thuộc về ít nhất một khóa ứng viên của $R$).

---

## 2. Chứng minh Chuyên sâu 1: Bảng `THANHTOAN`

### 2.1. Phân tích Dị thường và Vi phạm 3NF Trước Di trú
Lược đồ ban đầu:
$$\text{THANHTOAN}(\underline{\text{ThanhToanID}}, \text{DonDatVeID}, \text{PhuongThuc}, \text{SoTien}, \text{NgayTao}, \text{NgayThanhToan}, \text{MaGiaoDich}, \text{TrangThai}, \text{GhiChu})$$

- Khóa ứng viên duy nhất: $\{\text{ThanhToanID}\}$.
- Thuộc tính khóa: $\{\text{ThanhToanID}\}$.
- Thuộc tính không khóa: $\{\text{DonDatVeID}, \text{PhuongThuc}, \text{SoTien}, \text{NgayTao}, \text{NgayThanhToan}, \text{MaGiaoDich}, \text{TrangThai}, \text{GhiChu}\}$.
- Phụ thuộc hàm phát sinh từ nghiệp vụ:
  - $FD_1: \text{ThanhToanID} \to \text{DonDatVeID}, \text{PhuongThuc}, \text{SoTien}, \text{NgayTao}, \text{NgayThanhToan}, \text{MaGiaoDich}, \text{TrangThai}, \text{GhiChu}$.
  - $FD_2: \text{DonDatVeID} \to \text{SoTien}$ (Số tiền thanh toán bắt buộc bằng tổng thanh toán của đơn hàng theo D-01: $\text{TongTienVe} + \text{TongTienDoAn} - \text{TienGiamGia}$).
- **Đánh giá vi phạm:**  
  Trong $FD_2: \text{DonDatVeID} \to \text{SoTien}$:
  - $\text{DonDatVeID}$ không phải là siêu khóa của `THANHTOAN` (một đơn hàng có thể có nhiều nỗ lực thanh toán $\Rightarrow 1:N$).
  - $\text{SoTien}$ không phải là thuộc tính khóa.
  - $\Rightarrow$ Tồn tại phụ thuộc bắc cầu $\text{ThanhToanID} \to \text{DonDatVeID} \to \text{SoTien}$. Vi phạm nghiêm trọng 3NF, dẫn đến dị thường cập nhật khi số tiền ở `THANHTOAN` và `DONDATVE` bị trôi lệch.

### 2.2. Lược đồ Chuẩn hóa Strict 3NF Sau Di trú
Lược đồ sau khi loại bỏ cột vật lý `SoTien`:
$$\text{THANHTOAN}(\underline{\text{ThanhToanID}}, \text{DonDatVeID}, \text{PhuongThuc}, \text{NgayTao}, \text{NgayThanhToan}, \text{MaGiaoDich}, \text{TrangThai}, \text{GhiChu})$$

- Khóa chính: $\{\text{ThanhToanID}\}$. Khóa ứng viên thay thế khi có giá trị: $\{\text{MaGiaoDich}\}$ (ràng buộc unique có điều kiện).
- Tập phụ thuộc hàm tối tiểu:
  - $\text{ThanhToanID} \to \text{DonDatVeID}, \text{PhuongThuc}, \text{NgayTao}, \text{NgayThanhToan}, \text{MaGiaoDich}, \text{TrangThai}, \text{GhiChu}$.
- Không còn bất kỳ phụ thuộc hàm nào giữa các thuộc tính không khóa.
- **Chứng nhận:** Bảng `THANHTOAN` đạt chuẩn **Strict 3NF (và BCNF)** tuyệt đối. Mọi nhu cầu truy xuất số tiền thanh toán được tái dựng động thông qua phép kết với snapshot `DONDATVE`.

---

## 3. Chứng minh Chuyên sâu 2: Bảng `KHIEUNAI` (Đánh giá Quyết định Option 1)

### 3.1. Lược đồ Quan hệ
$$\text{KHIEUNAI}(\underline{\text{KhieuNaiID}}, \text{NguoiDungID}, \text{DonDatVeID}, \text{LoaiKhieuNai}, \text{TieuDe}, \text{NoiDung}, \text{MucDoUuTien}, \text{NgayTao}, \text{TrangThai})$$

- Khóa chính: $\{\text{KhieuNaiID}\}$.
- Thuộc tính `DonDatVeID` là khóa ngoại tùy chọn (Optional Foreign Key, kiểu `INT NULL`).

### 3.2. Phân biệt Bản chất Toán học Quan hệ
Để chứng minh tính chuẩn mực của `KHIEUNAI`, cần làm rõ 4 khái niệm thường bị nhầm lẫn:

1. **Phụ thuộc hàm Toàn quan hệ (Relation-wide Functional Dependency):**
   - Một phụ thuộc hàm $X \to Y$ chỉ hợp lệ trên quan hệ $R$ khi và chỉ khi ánh xạ $f: X \to Y$ được xác định đơn trị cho mọi bộ giá trị trong $R$.
   - Trong SQL, giá trị `NULL` đại diện cho giá trị chưa biết hoặc không áp dụng (unknown / inapplicable). Khi một khiếu nại là khiếu nại chung (về thái độ phục vụ, âm thanh, rạp chiếu), `DonDatVeID = NULL`.
   - Vì nhiều dòng khiếu nại có `DonDatVeID = NULL` nhưng được gửi bởi các khách hàng khác nhau ($NguoiDungID_1 \neq NguoiDungID_2$), nên trên toàn bộ quan hệ `KHIEUNAI`, ánh xạ $NULL \to NguoiDungID$ là đa trị.
   - Do đó, **phụ thuộc hàm $\text{DonDatVeID} \to \text{NguoiDungID}$ KHÔNG TỒN TẠI trên toàn quan hệ `KHIEUNAI`**.

2. **Phụ thuộc hàm Có điều kiện (Conditional Functional Dependency — CFD):**
   - Trên tập con các bộ dữ liệu thỏa mãn điều kiện $\text{DonDatVeID IS NOT NULL}$, do mỗi đơn hàng thuộc về một khách hàng duy nhất trong `DONDATVE`, xuất hiện ràng buộc:
     $$[\text{DonDatVeID} \to \text{NguoiDungID} \mid \text{DonDatVeID} \neq \text{NULL}]$$
   - Về lý thuyết chuẩn hóa nâng cao, một CFD có thể gợi ý phân tách thành hai bảng nếu việc phân tách mang lại lợi ích nghiệp vụ vượt trội. Tuy nhiên, tại Gate B, Chủ dự án đã cân nhắc Phương án 2 (Tách thành `KHIEUNAI_CHUNG` và `KHIEUNAI_DONDATVE`, tăng lên 28 bảng) và bác bỏ vì làm phức tạp hóa quy trình nghiệp vụ CSKH, chia cắt giao diện hỗ trợ và phân mảnh báo cáo.

3. **Ràng buộc Quyền sở hữu Xuyên thực thể (Cross-entity Ownership Constraint):**
   - Mối liên hệ giữa `DonDatVeID` và `NguoiDungID` khi có đơn hàng thực chất là một quy tắc kiểm soát quyền truy cập: *"Người gửi khiếu nại phải là chủ sở hữu của đơn hàng đó"*.
   - Ràng buộc này là quy tắc logic nghiệp vụ xuyên bảng (Inter-relational Business Invariant), được bảo đảm tại Stored Procedure `sp_Support_Complaint_CreateCustomer`:
     ```sql
     IF @DonDatVeID IS NOT NULL
     BEGIN
         IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @DonDatVeID AND NguoiDungID = @NguoiDungID)
             THROW 50041, N'Đơn đặt vé không hợp lệ hoặc không thuộc về bạn.', 1;
     END
     ```

4. **Kết luận Chứng nhận cho `KHIEUNAI`:**
   - Trên quan hệ đầy đủ, mọi thuộc tính không khóa đều phụ thuộc trực tiếp vào khóa chính `KhieuNaiID`.
   - Không tồn tại phụ thuộc hàm bắc cầu toàn quan hệ.
   - Bảng `KHIEUNAI` đạt **chuẩn 3NF theo mô hình quan hệ mở rộng chấp nhận khóa ngoại Nullable (Option 1 — Giữ nguyên 27 bảng)**.

---

## 4. Bảng Kiểm toán và Chứng nhận 3NF cho Toàn bộ 27 Bảng

| STT | Tên bảng | Khóa chính (Candidate Key) | Thuộc tính khóa ngoại (FK) | Đạt 1NF | Đạt 2NF | Đạt 3NF | Tình trạng chuẩn hóa |
|:---:|---|---|---|:---:|:---:|:---:|---|
| 1 | `BANGGIA` | `GiaID` | `RapID` | PASS | PASS | PASS | Không có transitive FD |
| 2 | `BOITHUONG_HUYSUAT` | `BoiThuongID` | `DonDatVeID` | PASS | PASS | PASS | Quan hệ 1-1 logic, phụ thuộc PK |
| 3 | `CHITIETDOAN` | `ChiTietDoAnID` | `DonDatVeID, SanPhamID` | PASS | PASS | PASS | Đơn giá snapshot theo dòng |
| 4 | `CHITIETVE` | `VeID` | `DonDatVeID, GheID` | PASS | PASS | PASS | Giá vé snapshot theo ghế |
| 5 | `DANHGIAPHIM` | `DanhGiaID` | `PhimID, NguoiDungID` | PASS | PASS | PASS | Độc lập phim và người đánh giá |
| 6 | `DIENVIEN` | `DienVienID` | Không | PASS | PASS | PASS | Danh mục diễn viên độc lập |
| 7 | `DONDATVE` | `DonDatVeID` | `NguoiDungID, SuatChieuID, KhuyenMaiID` | PASS | PASS | PASS | Snapshot tiền vé, đồ ăn, giảm giá |
| 8 | `GHE` | `GheID` | `PhongID` | PASS | PASS | PASS | Danh mục ghế theo phòng |
| 9 | `HINHANH_RAPCHIEUPHIM` | `HinhAnhRapID` | `RapID` | PASS | PASS | PASS | Danh mục ảnh theo rạp |
| 10 | `HOSOKHACHHANG` | `NguoiDungID` | `NguoiDungID` | PASS | PASS | PASS | Mở rộng 1-1 tài khoản khách hàng |
| 11 | `KHIEUNAI` | `KhieuNaiID` | `NguoiDungID, DonDatVeID (opt)` | PASS | PASS | PASS | **Đạt 3NF (Chứng minh mục 3)** |
| 12 | `KHUYENMAI` | `KhuyenMaiID` | Không | PASS | PASS | PASS | Danh mục voucher/khuyến mại |
| 13 | `NGUOIDUNG` | `NguoiDungID` | `VaiTroID` | PASS | PASS | PASS | Tài khoản người dùng |
| 14 | `PHANCONG_RAP` | `PhanCongID` | `NguoiDungID, RapID` | PASS | PASS | PASS | Bảng nối N-N quản lý và rạp |
| 15 | `PHIM` | `PhimID` | Không | PASS | PASS | PASS | Danh mục phim |
| 16 | `PHIM_DIENVIEN` | `PhimID, DienVienID` | `PhimID, DienVienID` | PASS | PASS | PASS | Bảng nối N-N phim và diễn viên |
| 17 | `PHIM_THELOAI` | `PhimID, TheLoaiID` | `PhimID, TheLoaiID` | PASS | PASS | PASS | Bảng nối N-N phim và thể loại |
| 18 | `PHONGCHIEU` | `PhongID` | `RapID` | PASS | PASS | PASS | Danh mục phòng chiếu theo rạp |
| 19 | `QUYEN` | `QuyenID` | Không | PASS | PASS | PASS | Danh mục quyền RBAC cố định |
| 20 | `RAPCHIEUPHIM` | `RapID` | Không | PASS | PASS | PASS | Danh mục rạp chiếu (D-07 độc lập) |
| 21 | `SANPHAM` | `SanPhamID` | Không | PASS | PASS | PASS | Danh mục đồ ăn bắp nước |
| 22 | `SUATCHIEU` | `SuatChieuID` | `PhimID, PhongID` | PASS | PASS | PASS | Lịch chiếu phim theo phòng |
| 23 | `THANHTOAN` | `ThanhToanID` | `DonDatVeID` | PASS | PASS | PASS | **Strict 3NF (Đã loại bỏ SoTien)** |
| 24 | `THELOAI` | `TheLoaiID` | Không | PASS | PASS | PASS | Danh mục thể loại phim |
| 25 | `VAITRO` | `VaiTroID` | Không | PASS | PASS | PASS | Danh mục vai trò cố định |
| 26 | `VAITRO_QUYEN` | `VaiTroID, QuyenID` | `VaiTroID, QuyenID` | PASS | PASS | PASS | Bảng nối N-N vai trò và quyền |
| 27 | `XULY_KHIEUNAI` | `XuLyID` | `KhieuNaiID, NguoiXuLyID` | PASS | PASS | PASS | Lịch sử các bước xử lý khiếu nại |

---

## 5. Tuyên bố Trạng thái Chứng nhận Chuẩn hóa 3NF trên 4 Môi trường

```text
CANONICAL SOURCE 3NF:     [CERTIFIED PASS] (100% 27 bảng đạt Strict 3NF)
UPGRADED TEST 3NF:        [CERTIFIED PASS] (CinemaBookingDB_Test đạt Strict 3NF)
FRESH TEST 3NF:           [CERTIFIED PASS] (CinemaBookingDB_Fresh3NF đạt Strict 3NF)
CURRENT PRODUCTION 3NF:   [NOT YET CERTIFIED] (Đang ở trạng thái Pre-migration, chờ Gate C)
```

**Khẳng định:** Cơ sở dữ liệu Production hiện tại vẫn còn cột `THANHTOAN.SoTien` và chưa đạt Strict 3NF. Trạng thái chứng nhận sẽ chỉ được cấp cho Production sau khi Chủ dự án phê duyệt mở Gate C và hoàn tất quy trình di trú.

