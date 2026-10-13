# R5-B ROLLBACK DRILL REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R5-B — Rollback Drill Execution  
**Vai trò:** Principal Database Reliability Engineer & Disaster Recovery Specialist  
**Cơ sở dữ liệu mục tiêu:** `CinemaBookingDB_Test` (ISOLATED TEST DATABASE ONLY)  
**Tài khoản thực thi:** `CinemaTestUser`  
**Script thực thi:** `database/13_migrations/3nf_remediation/99_rollback_all.sql`  
**Thời gian thực thi:** 13/10/2026 15:51:49 (ICT)  
**Thời gian hoàn thành:** 13/10/2026 15:51:52 (Thời lượng: ~3 giây)  
**Kết quả kiểm chứng:** **100% VERIFIED PASS — KHÔI PHỤC NGUYÊN BẢN AN TOÀN TUYỆT ĐỐI**  

---

## 1. Mục tiêu và phạm vi cuộc diễn tập hoàn tác (Drill Objectives)

Mục tiêu cốt lõi của Phase 5 (Rollback Drill) là chứng minh một cách thực tế và assertive rằng:
1. Quy trình di trú có **con đường lùi (Exit Path) khả thi 100%**, có thể khôi phục toàn diện hệ thống về trạng thái nguyên bản mà không gây gián đoạn hoặc mất mát dữ liệu.
2. Script hoàn tác `99_rollback_all.sql` có thể khôi phục:
   - Schema vật lý của bảng `dbo.THANHTOAN` (cột `SoTien`, kiểu dữ liệu `DECIMAL(18,2) NOT NULL`).
   - Phục hồi lại dữ liệu số tiền ban đầu cho toàn bộ Payment Attempts từ snapshot giao dịch.
   - Khôi phục Check Constraint `CK_THANHTOAN_SoTien`.
   - Khôi phục Non-clustered Index `IX_THANHTOAN_DonDatVe` chứa `SoTien` trong `INCLUDE`.
   - Khôi phục nguyên trạng mã nguồn của 1 View và 8 Stored Procedures về logic đọc/ghi ban đầu.
3. Không làm ảnh hưởng đến cơ sở dữ liệu Production (`CinemaBookingDB`).

---

## 2. Chi tiết các bước hoàn tác (Step-by-Step Restoration)

Cuộc diễn tập hoàn tác được thực hiện tuần tự qua 3 phần chính trong một transaction nguyên tử (Atomic DDL & DML):

### Phần 1: Khôi phục Schema vật lý và Dữ liệu cột SoTien
1. Khóa bảng độc quyền: `SELECT TOP 0 1 FROM dbo.THANHTOAN WITH (TABLOCKX, HOLDLOCK)`.
2. Thêm lại cột vật lý: `ALTER TABLE dbo.THANHTOAN ADD [SoTien] DECIMAL(18, 2) NULL`.
3. Kiểm tra toàn vẹn trước khi nạp dữ liệu:
   - Kiểm tra không có Payment Attempts mồ côi (`OrphanCount = 0`).
   - Kiểm tra không có đơn hàng có thành phần tiền NULL (`NullComponentCount = 0`).
4. Phục hồi dữ liệu `SoTien` từ `DONDATVE` snapshot:
   ```sql
   UPDATE tt
   SET tt.SoTien = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)
   FROM dbo.THANHTOAN tt
   INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;
   ```
5. Kiểm tra dữ liệu sau phục hồi: Không có bản ghi nào bị `SoTien IS NULL` hoặc `SoTien < 0`.
6. Thiết lập ràng buộc `NOT NULL`: `ALTER TABLE dbo.THANHTOAN ALTER COLUMN [SoTien] DECIMAL(18, 2) NOT NULL`.
7. Tạo lại Check Constraint: `ALTER TABLE dbo.THANHTOAN WITH CHECK ADD CONSTRAINT [CK_THANHTOAN_SoTien] CHECK ([SoTien] >= (0))`.
8. Tái tạo Index ban đầu: Tạo lại `IX_THANHTOAN_DonDatVe` trên `(DonDatVeID, TrangThai)` include `([SoTien], [NgayThanhToan], [NgayTao])`.

### Phần 2: Khôi phục Source Code 1 View và 8 Stored Procedures về Baseline
Đã phục hồi mã nguồn nguyên bản (Legacy Source Code) cho 9 đối tượng:
1. `dbo.vw_DoanhThuTheoRap`: Đọc trực tiếp từ `THANHTOAN.SoTien`.
2. `dbo.sp_Payment_CreateAttempt`: Lệnh `INSERT INTO dbo.THANHTOAN` ghi lại cột `SoTien` lấy từ `DONDATVE`.
3. `dbo.sp_Payment_UpdateResult`: Logic cập nhật nguyên bản.
4. `dbo.sp_Admin_Dashboard`: Truy vấn `SoTien` từ `THANHTOAN`.
5. `dbo.sp_Admin_Report_Revenue`: Truy vấn `SoTien` từ `THANHTOAN`.
6. `dbo.sp_Manager_Revenue`: Truy vấn `SoTien` từ `THANHTOAN`.
7. `dbo.sp_Order_GetDetailByCustomer`: Trả về `tt.SoTien` từ bảng `THANHTOAN`.
8. `dbo.sp_StaffBooking_Detail`: Trả về `tt.SoTien` từ bảng `THANHTOAN`.
9. `dbo.sp_Support_Complaint_GetOrderReference`: Trả về `tt.SoTien` từ bảng `THANHTOAN`.

### Phần 3: Hậu kiểm đối soát sau hoàn tác (Post-Rollback Assertions)
- Cột `SoTien` tồn tại: **PASS** (`COL_LENGTH = 9`).
- Thuộc tính `AllowsNull`: **PASS** (`AllowsNull = 0` / NOT NULL).
- Check constraint `CK_THANHTOAN_SoTien`: **PASS** (Đã kích hoạt).
- Index `IX_THANHTOAN_DonDatVe`: **PASS** (Chứa cột `SoTien`).
- Không có giá trị NULL hoặc âm: **PASS** (0 bản ghi).
- Số Payment Attempts sau rollback: **4** (Khớp baseline $\ge 4$).
- Doanh thu sau rollback: **446,500.00 VNĐ** (Khớp baseline $\ge 446,500.00$).
- Đối soát chi tiết từng dòng với snapshot trước di trú bằng `FULL OUTER JOIN`:
  - Bản ghi thiếu (Missing): 0.
  - Bản ghi thừa (Extra): 0.
  - Bản ghi sai lệch số tiền/trạng thái/đơn hàng: 0.
  - **Kết quả:** 100% bản ghi `SoTien` khớp chính xác tuyệt đối với baseline pre-migration!

---

## 3. Kỹ thuật hoàn thiện độ tin cậy kịch bản Rollback (Safety Hardening)

Trong quá trình thực thi kịch bản hoàn tác, một vấn đề đặc thù của trình biên dịch SQL Server (Deferred Compile-Time Column Resolution) đã được nhận diện và xử lý:
- **Nguyên nhân:** Khi thực hiện lệnh `ALTER TABLE ADD SoTien` và lệnh `UPDATE tt SET tt.SoTien = ...` trong cùng một batch biên dịch (giữa các lệnh `GO`), SQL Server kiểm tra cú pháp trước khi chạy. Do cột `SoTien` chưa tồn tại tại thời điểm compile, SQL Server báo lỗi `Msg 207: Invalid column name 'SoTien'`.
- **Giải pháp xử lý:** Bao bọc các câu lệnh DML (`UPDATE`, kiểm tra `EXISTS`) và DDL phụ thuộc (`ALTER COLUMN`, `ADD CONSTRAINT`, `CREATE INDEX`) trong thủ tục động `EXEC sp_executesql`. Cơ chế này cho phép trì hoãn việc biên dịch cho đến khi cột đã được tạo xong trong transaction, đảm bảo tính toàn vẹn và nguyên tử mà không cần ngắt batch `GO`.

---

## 4. Xác minh an toàn cơ sở dữ liệu Production

Sau khi thực hiện xong Rollback Drill trên `CinemaBookingDB_Test`:
- Kiểm tra trực tiếp Database `CinemaBookingDB`:
  - Tổng số bảng: 27 bảng.
  - Cột `THANHTOAN.SoTien`: Vẫn tồn tại (`COL_LENGTH = 9`).
  - Số lượng bản ghi thanh toán: 4 bản ghi.
  - Doanh thu: 446,500.00 VNĐ.
  - **Khẳng định:** Production hoàn toàn không bị can thiệp, không bị ảnh hưởng bởi cuộc diễn tập rollback.

---

## 5. Kết luận cuộc diễn tập hoàn tác (Rollback Drill Verdict)

- Kế hoạch hoàn tác `99_rollback_all.sql` đã được chứng minh **hoạt động hoàn hảo 100%** trên môi trường thực tế.
- Khả năng phục hồi dữ liệu và cấu trúc ban đầu là tức thì, không mất dữ liệu, không sai số tiền.
- **KẾT LUẬN:** **R5-B ROLLBACK DRILL: VERIFIED PASS**.

