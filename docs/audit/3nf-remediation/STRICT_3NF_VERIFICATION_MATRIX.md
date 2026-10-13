# STRICT 3NF VERIFICATION MATRIX & REGRESSION TEST PLAN — CINEMABOOKINGDB
**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Chuyên gia phụ trách:** Principal Database Architect & Software Quality Architect  
**Tài liệu:** Ma trận chứng nhận chuẩn hóa và Kịch bản kiểm thử hồi quy (Verification Matrix)  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái tài liệu:** **GATE B TECHNICAL SUBMISSION — DESIGN ONLY** (Chưa thực thi)  

---

## 1. Giới thiệu và Tiêu chuẩn Nghiệm thu

Tài liệu này xác lập bộ công cụ kiểm chứng chuẩn hóa và kiểm thử hồi quy toàn diện cho CinemaBookingDB theo quyết định Gate B (Option 1 — 27 bảng):
1. **Ma trận chứng nhận chuẩn 3NF cho toàn bộ 27 bảng** (Normalization Certification Matrix).
2. **Kịch bản kiểm thử hồi quy luồng thanh toán** (15 Test Cases chuyên sâu).
3. **Kịch bản kiểm thử hồi quy các nghiệp vụ liên quan** (Khiếu nại, Bảng giá, Phân công, Rạp chiếu).
4. **Bộ kiểm chứng bảo toàn dữ liệu lịch sử và đối soát chéo** (Data Preservation Assertions).
5. **Tiêu chuẩn nghiệm thu cuối cùng** (Final Acceptance Criteria).

---

## 2. 27-Table Normalization Certification Matrix (Ma trận chứng nhận 27 bảng)

| STT | Tên bảng | Khóa chính (PK) | Các Khóa ứng viên khác (CK) | Phụ thuộc hàm cốt lõi đã chứng minh | 1NF | 2NF | Trạng thái 3NF đề xuất | Căn cứ chứng minh theo Quyết định Gate B |
|---:|---|---|---|---|:---:|:---:|:---:|---|
| 1 | `BANGGIA` | (GiaID) | Không có | `GiaID → R` | PASS | PASS | **VERIFIED_PASS** | D-04/D-05 APPROVED. PK đơn, quy tắc cấu hình mutable; giá bán vé lưu tại CHITIETVE. |
| 2 | `BOITHUONG_HUYSUAT` | (BoiThuongID) | (DonDatVeID) | `BoiThuongID → R`, `DonDatVeID → R` | PASS | PASS | **VERIFIED_PASS** | Cả 2 CK đều là khóa đơn, mọi determinant đều là Superkey. |
| 3 | `CHITIETDOAN` | (ChiTietDoAnID) | (DonDatVeID, SanPhamID) | `ChiTietDoAnID → R`, `(DonDatVeID, SanPhamID) → R` | PASS | PASS | **VERIFIED_PASS** | Phụ thuộc đầy đủ vào toàn bộ khóa ghép, DonGia là snapshot giao dịch lịch sử. |
| 4 | `CHITIETVE` | (VeID) | (MaVe) | `VeID → R`, `MaVe → R` | PASS | PASS | **VERIFIED_PASS** | Cả 2 CK đều là khóa đơn, GiaVe là snapshot giao dịch lịch sử. |
| 5 | `DANHGIAPHIM` | (DanhGiaID) | (PhimID, NguoiDungID) | `DanhGiaID → R`, `(PhimID, NguoiDungID) → R` | PASS | PASS | **VERIFIED_PASS** | Phụ thuộc đầy đủ vào toàn bộ khóa ghép. |
| 6 | `DIENVIEN` | (DienVienID) | Không có | `DienVienID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn, không có phụ thuộc bắc cầu. |
| 7 | `DONDATVE` | (DonDatVeID) | Không có | `DonDatVeID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn, các thành phần tiền lưu snapshot độc lập từ chi tiết vé, đồ ăn, KM. |
| 8 | `GHE` | (GheID) | (PhongID, HangGhe, SoGhe) | `GheID → R`, `(PhongID, HangGhe, SoGhe) → R` | PASS | PASS | **VERIFIED_PASS** | Không có phụ thuộc từng phần vào khóa ghép. |
| 9 | `HINHANH_RAPCHIEUPHIM` | (HinhAnhRapID) | Không có | `HinhAnhRapID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn, filtered index đại diện không là CK toàn bảng. |
| 10 | `HOSOKHACHHANG` | (NguoiDungID) | Không có | `NguoiDungID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn (1-1 extension với NGUOIDUNG). |
| 11 | `KHIEUNAI` | (KhieuNaiID) | Không có | `KhieuNaiID → R` | PASS | PASS | **VERIFIED_PASS** | D-03 Option 1 APPROVED. NguoiDungID là Người gửi độc lập; DonDatVeID nullable không tạo FD toàn quan hệ; quan hệ sở hữu kiểm soát tại Stored Procedure. Đạt Classical 3NF toàn quan hệ. |
| 12 | `KHUYENMAI` | (KhuyenMaiID) | (MaCode) | `KhuyenMaiID → R`, `MaCode → R` | PASS | PASS | **VERIFIED_PASS** | Cả 2 CK đều là khóa đơn. |
| 13 | `NGUOIDUNG` | (NguoiDungID) | (Email) | `NguoiDungID → R`, `Email → R` | PASS | PASS | **VERIFIED_PASS** | Cả 2 CK đều là khóa đơn, SĐT nullable không là CK toàn bảng. |
| 14 | `PHANCONG_RAP` | (PhanCongID) | Không có | `PhanCongID → R` | PASS | PASS | **VERIFIED_PASS** | D-06 APPROVED. Quan hệ nhiều–nhiều theo khoảng thời gian; PK đơn. |
| 15 | `PHIM` | (PhimID) | Không có | `PhimID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn, không có phụ thuộc bắc cầu. |
| 16 | `PHIM_DIENVIEN` | (PhimID, DienVienID) | Không có | `(PhimID, DienVienID) → VaiDien` | PASS | PASS | **VERIFIED_PASS** | Thuộc tính phụ thuộc đầy đủ vào cả 2 thành phần khóa. |
| 17 | `PHIM_THELOAI` | (PhimID, TheLoaiID) | Không có | Không có non-key FD | PASS | PASS | **VERIFIED_PASS** | Toàn bộ thuộc tính đều là Prime (All-key relation). |
| 18 | `PHONGCHIEU` | (PhongID) | (RapID, TenPhong) | `PhongID → R`, `(RapID, TenPhong) → R` | PASS | PASS | **VERIFIED_PASS** | Phụ thuộc đầy đủ vào khóa ghép. |
| 19 | `QUYEN` | (QuyenID) | (MaQuyen) | `QuyenID → R`, `MaQuyen → R` | PASS | PASS | **VERIFIED_PASS** | Cả 2 CK đều là khóa đơn. |
| 20 | `RAPCHIEUPHIM` | (RapID) | Không có | `RapID → R` | PASS | PASS | **VERIFIED_PASS** | D-07 APPROVED. DiaChi là văn bản thành phần, không xác định duy nhất ThanhPho. |
| 21 | `SANPHAM` | (SanPhamID) | Không có | `SanPhamID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn, không có phụ thuộc bắc cầu. |
| 22 | `SUATCHIEU` | (SuatChieuID) | Không có | `SuatChieuID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn, suất chiếu đã hủy có thể trùng khung giờ nên thời gian không là CK. |
| 23 | **`THANHTOAN` (ĐÃ CHUẨN HÓA)** | **(ThanhToanID)** | **Không có** | **`ThanhToanID → R`** | **PASS** | **PASS** | **VERIFIED_PASS** | **D-01/D-02 APPROVED. Bỏ cột SoTien; triệt tiêu hoàn toàn FD DonDatVeID → SoTien.** |
| 24 | `THELOAI` | (TheLoaiID) | (TenTheLoai) | `TheLoaiID → R`, `TenTheLoai → R` | PASS | PASS | **VERIFIED_PASS** | Toàn bộ thuộc tính đều là Prime. |
| 25 | `VAITRO` | (VaiTroID) | (MaVaiTro) | `VaiTroID → R`, `MaVaiTro → R` | PASS | PASS | **VERIFIED_PASS** | Cả 2 CK đều là khóa đơn. |
| 26 | `VAITRO_QUYEN` | (VaiTroID, QuyenID) | Không có | `(VaiTroID, QuyenID) → NgayGan` | PASS | PASS | **VERIFIED_PASS** | Phụ thuộc đầy đủ vào khóa ghép. |
| 27 | `XULY_KHIEUNAI` | (XuLyID) | Không có | `XuLyID → R` | PASS | PASS | **VERIFIED_PASS** | PK đơn, tiến trình xử lý append-only. |

---

## 3. Payment Regression Test Suite (15 Test Cases chuyên sâu)

| TC ID | Tên kịch bản kiểm thử | Thao tác thực hiện | Kết quả kỳ vọng (Expected Result) | Kiểm tra dữ liệu & Khẳng định (Assertion) |
|---|---|---|---|---|
| **PAY-01** | Tạo đơn và thanh toán thành công lần đầu | Đặt vé $\to$ gọi `sp_Payment_CreateAttempt` $\to$ gọi `sp_Payment_UpdateResult` với 'Thành công'. | Đơn chuyển 'Đã thanh toán', attempt ghi nhận 'Thành công', cộng điểm loyalty. | `sp_Order_GetDetailByCustomer` trả về `SoTien` bằng đúng tổng tiền đơn; điểm tích lũy tăng tương ứng. |
| **PAY-02** | Thanh toán thất bại | Tạo attempt $\to$ gọi `sp_Payment_UpdateResult` với 'Thất bại'. | Attempt chuyển trạng thái 'Thất bại', đơn hàng vẫn ở trạng thái 'Chờ thanh toán'. | `THANHTOAN` ghi nhận 1 dòng 'Thất bại'; `sp_Order_GetDetailByCustomer` trả về thông tin attempt với đúng số tiền đơn. |
| **PAY-03** | Retry sau thất bại | Sau khi attempt 1 thất bại, gọi tiếp `sp_Payment_CreateAttempt` lần 2. | Tạo thành công attempt 2 với `ThanhToanID` mới, mã giao dịch mới. | Đơn có 2 attempts trong `THANHTOAN`; cả 2 attempts đều hiển thị cùng số tiền đơn hàng qua API. |
| **PAY-04** | Nhiều lần thất bại trước khi thành công | Tạo attempt 1 (Thất bại) $\to$ attempt 2 (Thất bại) $\to$ attempt 3 (Thành công). | Attempt 1 & 2 giữ nguyên 'Thất bại', attempt 3 'Thành công', đơn chuyển 'Đã thanh toán'. | Toàn bộ 3 attempts được lưu đầy đủ trong lịch sử; không bị gộp dòng; số tiền hiển thị đồng nhất. |
| **PAY-05** | Ngăn sửa tổng đơn sau attempt đầu tiên | Sau khi tạo attempt 1 (kể cả thất bại), nhân viên gọi `sp_StaffBooking_UpdateSeats` để sửa ghế/tiền. | Bị từ chối ngay lập tức với mã lỗi `50514`. | Tổng tiền đơn không bị thay đổi; bất biến thanh toán được bảo vệ tuyệt đối. |
| **PAY-06** | Bảo toàn tất cả payment attempts lịch sử | Truy vấn danh sách attempt của các đơn hàng cũ trước khi di trú. | Số lượng attempt, ngày tạo, phương thức, trạng thái được giữ nguyên vẹn 100%. | Đếm số dòng `THANHTOAN` trước và sau di trú hoàn toàn trùng khớp ($N = N_{\text{pre}} = 4$). |
| **PAY-07** | Bảo toàn giá vé cũ khi bảng giá thay đổi | Sửa mức phụ thu trong `BANGGIA` $\to$ xem lại các đơn đã đặt trước đó. | Giá vé trong `CHITIETVE` và tổng đơn trong `DONDATVE` không đổi. | `sp_Order_GetDetailByCustomer` trả về số tiền thanh toán của các đơn cũ hoàn toàn không đổi. |
| **PAY-08** | Hủy đơn khi chưa thanh toán | Hết hạn giữ chỗ hoặc khách bấm hủy đơn qua `sp_Order_Cancel`. | Đơn chuyển 'Đã hủy', ghế được giải phóng. | Snapshot tiền `TongTienVe, TongTienDoAn, TienGiamGia` trong `DONDATVE` không bị xóa hoặc ghi đè về 0. |
| **PAY-09** | Hủy suất chiếu sau khi thanh toán | Admin gọi `sp_Showtime_CancelCascade` cho suất chiếu đã có vé thanh toán. | Đơn chuyển 'Đã hủy', bồi thường điểm ghi vào `BOITHUONG_HUYSUAT`. | Dữ liệu `THANHTOAN` và snapshot tiền của đơn được giữ nguyên vẹn; không xóa lịch sử giao dịch. |
| **PAY-10** | Hoàn tiền bồi thường theo chính sách | Kiểm tra tài khoản khách sau khi hủy suất chiếu. | Điểm tích lũy trong `HOSOKHACHHANG` được cộng tương ứng; bản ghi bồi thường tạo tại `BOITHUONG_HUYSUAT`. | Nghĩa vụ thanh toán gốc của đơn không bị thay đổi. |
| **PAY-11** | Bảo toàn báo cáo doanh thu | Chạy `vw_DoanhThuTheoRap`, `sp_Admin_Report_Revenue`, `sp_Manager_Revenue`. | Doanh thu theo từng rạp và từng ngày khớp chính xác với báo cáo trước di trú. | $\sum \text{DoanhThu}_{\text{sau}} = \sum \text{DoanhThu}_{\text{trước}} = 446,500.00 \text{ VNĐ}$. |
| **PAY-12** | Ngăn trùng successful payment | Sau khi attempt 1 đã 'Thành công', cố tình gọi `sp_Payment_UpdateResult` cho attempt khác của cùng đơn. | Bị từ chối với lỗi `50113` (Đơn không còn ở trạng thái có thể thanh toán). | Một đơn không bao giờ có 2 giao dịch thành công. |
| **PAY-13** | Đối soát số tiền trước và sau migration | So sánh giá trị `SoTien` từ API trước và sau khi bỏ cột vật lý. | Giá trị trả về trong JSON hoàn toàn đồng nhất tới từng chữ số thập phân. | `JSON.amount` trước $\equiv$ `JSON.amount` sau. |
| **PAY-14** | Xác minh Concurrency khi tạo attempts | Bắn đồng thời 10 requests tạo attempt cho cùng 1 đơn hàng. | Cơ chế khóa `UPDLOCK, HOLDLOCK` tuần tự hóa các yêu cầu; không gây deadlock hay race condition. | Tất cả attempts hợp lệ đều được ghi nhận với cùng số tiền đơn hàng. |
| **PAY-15** | Xác minh Backend DTO mapping | Backend Node.js gọi `sp_Payment_CreateAttempt` và `sp_Order_GetDetailByCustomer`. | `orderService.js` map thành công `row.SoTien` vào thuộc tính `amount`. | Không phát sinh lỗi `undefined` hay `NaN` trong response API. |

---

## 4. Other Business Regression Test Suite

### 4.1. Nghiệp vụ Khiếu nại (`KHIEUNAI` & `XULY_KHIEUNAI`)
- **COMP-01 (Khiếu nại không có đơn):** Khách hàng gửi khiếu nại chung (`DonDatVeID = NULL`).  
  *Kỳ vọng:* Hệ thống chấp nhận, lưu đúng `NguoiDungID` của khách hàng, hiển thị bình thường.
- **COMP-02 (Khiếu nại có đơn của chính mình):** Khách hàng gửi khiếu nại kèm `DonDatVeID` thuộc sở hữu của mình.  
  *Kỳ vọng:* Hệ thống kiểm tra hợp lệ, lưu liên kết đơn hàng thành công.
- **COMP-03 (Từ chối khiếu nại đơn của người khác):** Khách hàng cố tình gửi khiếu nại với `DonDatVeID` do tài khoản khác đặt.  
  *Kỳ vọng:* `sp_Complaint_Create` ném lỗi `50030`, giao dịch bị rollback.
- **COMP-04 (CSKH xử lý khiếu nại):** Nhân viên CSKH cập nhật tiến độ qua `sp_Support_Complaint_AddProcessing`.  
  *Kỳ vọng:* Ghi nhận lịch sử vào `XULY_KHIEUNAI`, trigger tự động đồng bộ trạng thái cha trong `KHIEUNAI`.

### 4.2. Nghiệp vụ Bảng giá (`BANGGIA` & `fn_TinhGiaVe`)
- **PRICE-01 (Cộng dồn phụ thu):** Cấu hình 1 rule ghế VIP (+15k) và 1 rule cuối tuần (+10k). Đặt vé suất chiếu cuối tuần ghế VIP.  
  *Kỳ vọng:* `fn_TinhGiaVe` tính chính xác tổng phụ thu = 25k.
- **PRICE-02 (Chống chồng lấn thời gian):** Tạo 2 rule cùng rạp, cùng bộ điều kiện, cùng trạng thái 'Áp dụng' có khoảng ngày giao nhau.  
  *Kỳ vọng:* Trigger `TRG_BangGia_KiemTraChongLan` ném lỗi và chặn thao tác.
- **PRICE-03 (Quy tắc không active):** Cho phép tồn tại 2 rule cùng bộ điều kiện và ngày bắt đầu nếu một trong hai đang 'Tạm dừng' hoặc 'Hết hạn'.  
  *Kỳ vọng:* Thao tác thành công, không bị chặn nhầm.

### 4.3. Nghiệp vụ Phân công Quản lý rạp (`PHANCONG_RAP`)
- **ASGN-01 (Phân công nhiều rạp):** Admin phân công 1 Quản lý phụ trách đồng thời Rạp 1 và Rạp 2.  
  *Kỳ vọng:* `fn_KiemTraQuanLyRapScope` trả về `1` cho cả hai rạp.
- **ASGN-02 (Nhiều Quản lý cùng 1 rạp):** Phân công Quản lý A và Quản lý B cùng phụ trách Rạp 1.  
  *Kỳ vọng:* Cả hai người dùng đều truy cập được báo cáo của Rạp 1.
- **ASGN-03 (Chồng khoảng thời gian):** Phân công gối đầu thời gian cho Quản lý mới tiếp nhận rạp.  
  *Kỳ vọng:* Hệ thống cho phép, phạm vi quyền hạn hoạt động chính xác theo ngày hiện tại.

### 4.4. Nghiệp vụ Danh mục Rạp (`RAPCHIEUPHIM`)
- **CINEMA-01 (Địa chỉ và thành phố độc lập):** Tạo rạp mới tại Hà Nội với địa chỉ "Số 1 Vincom", và rạp mới tại TP.HCM với địa chỉ "Số 1 Vincom".  
  *Kỳ vọng:* Hệ thống chấp nhận cả hai rạp, không báo lỗi trùng lặp địa chỉ.

---

## 5. Data Preservation Assertions (Khẳng định bảo toàn dữ liệu lịch sử)

Bộ kiểm chứng dữ liệu chạy đối soát tự động:

```sql
-- ASSERTION 1: Số lượng bản ghi thanh toán phải giữ nguyên vẹn
ASSERT (SELECT COUNT(*) FROM dbo.THANHTOAN) == 4;

-- ASSERTION 2: Số lượng bản ghi đơn hàng phải giữ nguyên vẹn
ASSERT (SELECT COUNT(*) FROM dbo.DONDATVE) == 5;

-- ASSERTION 3: Tổng doanh thu toàn thời gian không lệch một xu
ASSERT (
    SELECT ISNULL(SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia), 0)
    FROM dbo.THANHTOAN tt
    INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
    WHERE tt.TrangThai = N'Thành công'
) == 446500.00;

-- ASSERTION 4: Toàn vẹn khóa ngoại (Foreign Key Integrity)
ASSERT NOT EXISTS (
    SELECT 1 FROM dbo.THANHTOAN tt 
    LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID 
    WHERE d.DonDatVeID IS NULL
);
```

---

## 6. Final Acceptance Criteria (Tiêu chuẩn nghiệm thu cuối cùng)

1. **Chuẩn hóa 3NF:** 100% (27/27) bảng đạt chuẩn `VERIFIED_PASS 3NF` dựa trên chứng minh toán học chính thức.
2. **Không còn vi phạm:** 0 vi phạm 3NF, 0 giả định phụ thuộc hàm chưa được giải quyết.
3. **Bảo toàn dữ liệu:** 100% dữ liệu lịch sử (giao dịch, doanh thu, vé, khách hàng) khớp chính xác với baseline.
4. **Hồi quy nghiệp vụ:** 100% (15/15) test cases thanh toán và toàn bộ test cases nghiệp vụ khác PASS.
5. **Tương thích ứng dụng:** 0 lỗi phát sinh tại Backend API, 0 thay đổi mã nguồn tại Frontend.
6. **An toàn bảo mật:** Cơ chế phân quyền DBMS-first và transaction isolation hoạt động hoàn hảo.
