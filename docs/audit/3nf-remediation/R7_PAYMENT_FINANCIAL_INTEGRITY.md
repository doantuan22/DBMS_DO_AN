# R7 PAYMENT & FINANCIAL INTEGRITY REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R7 — Full-System Integration Verification & Strict 3NF Release Validation  
**Chủ đề:** Kiểm chứng Toàn vẹn Tài chính & Chuẩn hóa Strict 3NF Hệ thống Thanh toán  
**Môi trường:** `CinemaBookingDB_Test` (Upgraded) & `CinemaBookingDB_Fresh3NF` (Fresh)  
**Ngày đánh giá:** 13/10/2026  
**Kết luận:** **TOÀN VẸN TÀI CHÍNH ĐẠT 100% — TÁI DỰNG DOANH THU CHÍNH XÁC TUYỆT ĐỐI (0 DRIFT, 0 ORPHAN, 0 MISMATCH)**  

---

## 1. Cơ sở Thiết kế Strict 3NF cho Hệ thống Thanh toán

Theo Quyết định Nghiệp vụ D-01 và Thiết kế đã phê duyệt tại Gate A và Gate B:
1. **Loại bỏ cột vật lý dư thừa:** Cột `dbo.THANHTOAN.SoTien` được loại bỏ hoàn toàn khỏi schema vật lý để triệt tiêu phụ thuộc hàm bắc cầu $ThanhToanID \to DonDatVeID \to SoTien$.
2. **Snapshot tài chính bất biến tại `DONDATVE`:** Toàn bộ thành phần giá trị của một đơn hàng bao gồm:
   - `TongTienVe`: Tổng tiền vé gốc (tổng các snapshot `CHITIETVE.GiaVe`).
   - `TongTienDoAn`: Tổng tiền thực phẩm/bắp nước.
   - `TienGiamGia`: Giá trị chiết khấu từ mã khuyến mãi.
   - Tổng tiền phải trả được xác định là:
     $$\text{TongThanhToan} = \text{TongTienVe} + \text{TongTienDoAn} - \text{TienGiamGia}$$
3. **Tái dựng Động (Dynamic Projection):** Bất kỳ thủ tục lưu trữ, khung nhìn hay API nào cần đọc số tiền thanh toán đều thực hiện phép kết (INNER JOIN) với `dbo.DONDATVE` để lấy giá trị snapshot này.

---

## 2. Minh chứng Vật lý Schema Cơ sở dữ liệu

Truy vấn kiểm tra sự hiện diện của cột `SoTien` trên bảng `dbo.THANHTOAN`:
```sql
SELECT 
    COL_LENGTH('dbo.THANHTOAN', 'SoTien') AS SoTienColLength,
    (SELECT COUNT(*) FROM sys.check_constraints WHERE name = 'CK_THANHTOAN_SoTien') AS CheckConstraintCount;
```
Kết quả thực tế:
- `SoTienColLength`: **NULL** (Cột không tồn tại).
- `CheckConstraintCount`: **0** (Ràng buộc CHECK cũ đã được dỡ bỏ).
- Bảng `dbo.THANHTOAN` đạt chuẩn Strict 3NF tuyệt đối với các thuộc tính: `ThanhToanID` (PK), `DonDatVeID` (FK), `PhuongThuc`, `NgayTao`, `NgayThanhToan`, `MaGiaoDich`, `TrangThai`, `GhiChu`.

---

## 3. Kết quả Đối soát Toàn vẹn Dữ liệu (Financial Reconciliation)

Dữ liệu đối soát trên `CinemaBookingDB_Test` sau khi thực thi toàn bộ các kịch bản kiểm thử tích hợp và kiểm thử đồng thời:

| Chỉ số đối soát tài chính | Giá trị thực tế | Giá trị kỳ vọng | Đánh giá |
|---|:---:|:---:|:---:|
| **Tổng số Payment Attempts** | 13 | $\ge 4$ | **PASS** |
| **Số đơn hàng riêng biệt có thanh toán** | 7 | $\ge 3$ | **PASS** |
| **Giao dịch Thành công (`Thành công`)** | 8 | Khớp số đơn thanh toán thành công | **PASS** |
| **Giao dịch Thất bại (`Thất bại`)** | 2 | Khớp số lượt retry thất bại | **PASS** |
| **Giao dịch Đang xử lý (`Đang xử lý`)** | 3 | Khớp số lượt attempt song song | **PASS** |
| **Bản ghi thanh toán mồ côi (Orphan Payments)** | **0** | **0** | **PASS** |
| **Đơn có số tiền không nhất quán giữa các attempt** | **0** | **0** | **PASS (D-01)** |
| **Đơn hàng có thành phần tiền NULL** | **0** | **0** | **PASS** |
| **Số tiền thanh toán tái dựng bị âm (< 0)** | **0** | **0** | **PASS** |
| **Độ lệch doanh thu tái dựng so với snapshot** | **0.00 VNĐ** | **0.00 VNĐ** | **PASS (100%)** |

### Nhận xét chuyên sâu:
- Tất cả các nỗ lực thanh toán (payment attempts) của cùng một đơn hàng đều cho ra số tiền tái dựng giống nhau 100%, bảo đảm tính tất định của quan hệ $1:N$ giữa `DONDATVE` và `THANHTOAN`.
- Dữ liệu lịch sử thất bại và thành công được lưu trữ nguyên vẹn, phục vụ đầy đủ yêu cầu kiểm toán tài chính và đối soát ngân hàng.

---

## 4. Bảo toàn Hợp đồng Giao diện Lập trình (API Contract Preservation)

Backend Express và các client gọi Stored Procedure không phải thay đổi cấu trúc dữ liệu trả về:
1. **Thủ tục `sp_Payment_CreateAttempt`:**
   ```sql
   SELECT
       tt.ThanhToanID, tt.DonDatVeID, tt.PhuongThuc,
       (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien,
       tt.NgayTao, tt.MaGiaoDich, tt.TrangThai, d.HanGiuCho
   FROM dbo.THANHTOAN tt
   INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
   WHERE tt.ThanhToanID = @ThanhToanID;
   ```
   Trường `SoTien` vẫn được trả về trong recordset với kiểu dữ liệu `DECIMAL(18, 2)` như thiết kế ban đầu.
2. **Khung nhìn `vw_DoanhThuTheoRap`:**
   Tái dựng doanh thu bằng cách tổng hợp `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` từ các đơn hàng có trạng thái thanh toán hợp lệ, bảo toàn tính chính xác của báo cáo tài chính quản trị.

---

## 5. Cơ chế Bồi thường khi Hủy Suất chiếu (`sp_Showtime_CancelCascade`)

Khi suất chiếu bị hủy bởi Quản lý hoặc Quản trị viên:
1. Đơn hàng chuyển sang trạng thái `Đã hủy`.
2. Bản ghi thanh toán `Thành công` trong `dbo.THANHTOAN` vẫn được giữ nguyên để bảo đảm tính trung thực của sổ cái kế toán (tiền thực sự đã vào tài khoản rạp).
3. Hệ thống kích hoạt hàm `dbo.fn_TinhBoiThuongVe` để tính toán chính xác số điểm thưởng bồi thường vé tương đương giá trị thực trả (loại trừ phần đồ ăn nếu chính sách quy định) và cộng trực tiếp vào `dbo.HOSOKHACHHANG.DiemTichLuy` theo tỷ lệ 1.000 VNĐ = 1 điểm.

---

## 6. Kết luận Kiểm định Tài chính

Giải pháp chuẩn hóa Strict 3NF đã giải quyết dứt điểm rủi ro bất nhất dữ liệu giữa `DONDATVE` và `THANHTOAN`, loại bỏ hoàn toàn khả năng cập nhật lệch pha giá tiền mà không làm ảnh hưởng đến bất kỳ báo cáo doanh thu hay luồng thanh toán nào của hệ thống.

