# R6 SOURCE SYNCHRONIZATION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R6 — Database Source of Truth Synchronization & Fresh 3NF Bootstrap Verification  
**Vai trò:** Principal SQL Server Database Architect & Migration Engineer  
**Ngày thực hiện:** 13/10/2026  
**Trạng thái:** **HOÀN TẤT ĐỒNG BỘ 100% CANONICAL SQL SOURCE (VERIFIED PASS)**  

---

## 1. Mục tiêu và phạm vi đồng bộ

Sau khi bộ migration Strict 3NF (`01` đến `04` trong `database/13_migrations/3nf_remediation/`) được kiểm thử thành công tuyệt đối trên `CinemaBookingDB_Test` (Phase R5-B), mục tiêu của Phase R6 là **đồng bộ toàn bộ mã nguồn SQL gốc (Canonical Source of Truth)** trong thư mục `database/` để đảm bảo:

1. **Hỗ trợ triển khai mới (Fresh Install):** Database được dựng mới từ repository (`database/build-objects.sql` hoặc `database/run-all.sql`) sẽ đạt chuẩn Strict 3NF ngay từ đầu mà không cần chạy qua các script vá lỗi (remediation migrations).
2. **Hỗ trợ nâng cấp (Upgrade Path):** Database hiện hữu tiếp tục nâng cấp qua bộ migration đã thẩm định an toàn (`01`–`04`).
3. **Bảo toàn tính nhất quán (Parity):** Schema của database dựng mới và database nâng cấp khớp nhau 100% về mặt quan hệ, kiểu dữ liệu, ràng buộc, chỉ mục và mã thực thi.
4. **Không can thiệp Production:** Database `CinemaBookingDB` giữ nguyên trạng, bảo vệ tuyệt đối 100%.

---

## 2. Bảng kiểm kê chi tiết các file nguồn đã đồng bộ

| STT | Phân nhóm | Đường dẫn file canonical | Nội dung thay đổi đồng bộ Strict 3NF | Rationale / Nguyên tắc nghiệp vụ |
|:---:|---|---|---|---|
| 1 | Table DDL | `database/02_tables/thanhtoan.sql` | Loại bỏ dòng khai báo cột vật lý `[SoTien] decimal(18, 2) NOT NULL,` | Triệt tiêu cột dư thừa lưu trữ phụ thuộc bắc cầu `DonDatVeID -> SoTien` |
| 2 | Check Constraint | `database/03_constraints/003_check_constraints.sql` | Xóa khối khai báo ràng buộc `CK_THANHTOAN_SoTien CHECK ([SoTien] >= 0)` | Cột `SoTien` không còn tồn tại trên bảng `THANHTOAN` |
| 3 | Index DDL | `database/04_indexes/thanhtoan.sql` | Cập nhật `IX_THANHTOAN_DonDatVe` loại bỏ `[SoTien]` khỏi mệnh đề `INCLUDE`: chỉ giữ `INCLUDE([NgayThanhToan], [NgayTao])` | Index tinh gọn, không tham chiếu cột vật lý đã xóa |
| 4 | View | `database/06_views/vw_DoanhThuTheoRap.sql` | Thay thế `SUM(tt.SoTien)` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)` | Tái dựng số tiền thu thực tế từ snapshot bất biến của đơn hàng `DONDATVE` |
| 5 | Stored Procedure | `database/08_procedures/payment/sp_Payment_CreateAttempt.sql` | - Bỏ `SoTien` khỏi danh sách cột `INSERT dbo.THANHTOAN`<br>- Bỏ `@Amount` khỏi mệnh đề `VALUES`<br>- Tại lệnh SELECT trả kết quả: tái dựng `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` thông qua JOIN `dbo.DONDATVE d` | Bảo toàn 100% hợp đồng API trả về cho Backend DTO, không ghi dữ liệu dư thừa vào bảng |
| 6 | Stored Procedure | `database/08_procedures/payment/sp_Payment_UpdateResult.sql` | Thay gán biến `@Amount = t.SoTien` bằng `@Amount = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` qua JOIN `dbo.DONDATVE d` | Tính điểm thưởng tích lũy chính xác từ snapshot đơn hàng khi thanh toán thành công |
| 7 | Stored Procedure | `database/08_procedures/admin/sp_Admin_Dashboard.sql` | Tái dựng `TongDoanhThuToanThoiGian` bằng biểu thức `SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` thay vì `SUM(SoTien)` | Đọc doanh thu hợp lệ từ các đơn đã thanh toán thành công |
| 8 | Stored Procedure | `database/08_procedures/admin/sp_Admin_Report_Revenue.sql` | Thay `SUM(tt.SoTien)` trong bảng tạm `#DonDaThu` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)` | Báo cáo doanh thu toàn hệ thống nhất quán với snapshot đơn |
| 9 | Stored Procedure | `database/08_procedures/manager/sp_Manager_Revenue.sql` | Thay `SUM(tt.SoTien)` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)` trong CTE `DonDaThu` | Báo cáo doanh thu cấp rạp chính xác tuyệt đối |
| 10 | Stored Procedure | `database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql` | Recordset Payment Attempts: tái dựng `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` qua JOIN `dbo.DONDATVE d` | API chi tiết đơn của khách hàng hiển thị đầy đủ lịch sử attempts và số tiền tương thích DTO |
| 11 | Stored Procedure | `database/08_procedures/staff_booking/sp_StaffBooking_Detail.sql` | Recordset Payment Attempts: tái dựng `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` qua JOIN `dbo.DONDATVE d` | API chi tiết đơn của nhân viên quầy đọc dữ liệu thanh toán chính xác |
| 12 | Stored Procedure | `database/08_procedures/support/sp_Support_Complaint_GetOrderReference.sql` | Recordset Payment Attempts: tái dựng `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` qua JOIN `dbo.DONDATVE d` | API hỗ trợ khiếu nại của CSKH đọc đầy đủ lịch sử thanh toán |
| 13 | Seed Fixture | `database/10_seed/test_fixture/lifecycle-v2.sql` | Xóa `SoTien` khỏi danh sách cột và giá trị `INSERT INTO dbo.THANHTOAN` cho attempt lịch sử v2 | Tránh lỗi `Invalid column name 'SoTien'` khi chạy seed trên DB mới |
| 14 | Seed Verification | `database/10_seed/verify/seed-v2.sql` | Thay thế truy vấn kiểm tra `t.SoTien <> d.TongTien...` bằng khẳng định `COL_LENGTH('dbo.THANHTOAN', 'SoTien') IS NULL` | Kiểm tra tự động rằng cột vật lý `SoTien` không tồn tại trong Strict 3NF |
| 15 | Verification Scripts | `database/12_verify/verify_schema.sql`<br>`database/12_verify/verify_constraints.sql`<br>`database/12_verify/verify_objects.sql` | Tái tạo tự động thông qua công cụ `refresh-manifest.mjs` phản ánh đúng cấu trúc Strict 3NF | Bộ script kiểm thử metadata tự động khớp hoàn toàn với schema mới |
| 16 | Manifest | `database/baseline-manifest.json` | Cập nhật cấu trúc schema mới và fingerprint đối tượng tương ứng | Source of truth cho quy trình kiểm thử tự động CI/CD |
| 17 | Tooling Script | `scripts/db/generate-verification.mjs` | Bổ sung `THANHTOAN` vào danh sách chuẩn hóa thứ tự cột vật lý: `CASE WHEN [tableName] IN (N'BOITHUONG_HUYSUAT', N'THANHTOAN') THEN 0 ELSE [column_id] END` | Bỏ qua sự khác biệt thứ tự vật lý nội bộ giữa DB nâng cấp (`ALTER DROP`) và DB tạo mới (`CREATE TABLE`) |
| 18 | Tooling Script | `scripts/db/refresh-manifest.mjs` | Cho phép mục tiêu disposable `CinemaBookingDB_Fresh3NF`, đồng thời bảo vệ nghiêm ngặt không cho phép target `CinemaBookingDB` | Hỗ trợ quy trình bootstrap và tái tạo manifest chuẩn hóa |
| 19 | Tài liệu Schema | `database/relational-schema.md` | Cập nhật bảng `THANHTOAN` không còn cột `SoTien` | Đồng bộ tài liệu thiết kế quan hệ chính thức |

---

## 3. Đánh giá tính toàn vẹn (Integrity Assessment)

1. **27 Bảng nghiệp vụ:** Giữ nguyên vẹn 27 bảng. Không tạo bảng mới, không xóa bảng.
2. **Quy tắc nghiệp vụ D-01 đến D-07:**
   - D-01 (Bất biến số tiền thanh toán): Bảo toàn qua snapshot `DONDATVE`.
   - D-02 (Snapshot độc lập khi bảng giá đổi): Hoàn toàn nguyên vẹn.
   - D-03 (Hủy suất chiếu & bồi thường điểm): Giữ nguyên qua `BOITHUONG_HUYSUAT`.
   - D-04 (Quan hệ khiếu nại `KHIEUNAI`): Giữ nguyên quan hệ 1-N và kiểm tra quyền sở hữu tại SP.
   - D-05 (Chống chồng lấn bảng giá): Trigger `TRG_BangGia_KiemTraChongLan` nguyên vẹn.
   - D-06 (Phân công quản lý rạp): Quản lý nhiều rạp hoạt động chuẩn xác.
   - D-07 (Tên rạp và địa chỉ độc lập): Chuẩn 3NF hoàn chỉnh.
3. **API Contract Compatibility:** 100% Stored Procedures trả về đầy đủ các cột như thiết kế cũ (bao gồm cột tính toán `SoTien`), đảm bảo Backend DTO mapping hoàn hảo không cần sửa một dòng code ứng dụng.

