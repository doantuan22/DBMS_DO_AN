# BÁO CÁO CHUẨN BỊ DI TRÚ STRICT 3NF (PHASE R3)
## CinemaBookingDB — Hệ Thống Đặt Vé Xem Phim Trực Tuyến

**Tài liệu:** `R3_MIGRATION_PREPARATION_REPORT.md`  
**Chuyên gia phụ trách:** Principal Database Architect & Software Migration Specialist  
**Ngày lập:** 13/10/2026  
**Trạng thái phê duyệt:**
- **Gate A (Business Rules):** **APPROVED**
- **Gate B (Technical Design):** **APPROVED — OPTION 1 (KEEP 27 TABLES)**
- **Gate C (Implementation / Production Execution):** **PENDING APPROVAL (CHƯA ĐƯỢC PHÊ DUYỆT)**

---

## 1. Tóm tắt Điều hành & Kiến trúc Đích

Theo quyết định phê duyệt chính thức tại **Gate B (Option 1 — Giữ nguyên 27 bảng)**:
1. **Bảo toàn số lượng bảng:** Giữ nguyên toàn bộ 27 bảng hiện có. Tuyệt đối không thêm bảng `KHIEUNAI_DONDATVE` hay bất kỳ bảng trung gian nào.
2. **Bảo toàn cấu trúc 26 bảng:** 26/27 bảng trong cơ sở dữ liệu giữ nguyên 100% cấu trúc schema hiện tại.
3. **Phạm vi chuẩn hóa 3NF duy nhất:** Chỉ điều chỉnh duy nhất bảng `dbo.THANHTOAN` bằng cách loại bỏ cột vật lý dư thừa `SoTien` nhằm triệt tiêu phụ thuộc hàm bắc cầu:
   $$\text{ThanhToanID} \rightarrow \text{DonDatVeID} \rightarrow (\text{TongTienVe} + \text{TongTienDoAn} - \text{TienGiamGia})$$
4. **Cơ chế tái dựng số tiền thanh toán (Dynamic Reconstruction):** Số tiền thanh toán của mọi attempt được tái dựng trực tiếp tại Database Layer:
   ```sql
   (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien
   ```
5. **Bảo toàn lịch sử giao dịch 100%:** Giữ nguyên mọi Payment Attempt (thành công, thất bại, hoàn tiền). Không sửa đổi số tiền lịch sử.
6. **Bảo toàn hợp đồng API & Backend:** Toàn bộ Stored Procedures trả về kết quả qua alias `AS SoTien`, bảo đảm Backend Node.js (`row.SoTien`) và Frontend không cần sửa bất kỳ dòng mã nào.

---

## 2. Danh mục Gói Migration Scripts Chuẩn Bị (`database/13_migrations/3nf_remediation/`)

Toàn bộ gói migration được xây dựng theo mô hình **Expand / Contract** chuẩn quốc tế, bảo đảm tính lũy thừa (idempotency), bao bọc transaction chặt chẽ và cơ chế dừng khẩn cấp:

| STT | Tên Script | Vai trò & Mục tiêu Kỹ thuật | Trạng thái Thực thi R3 |
|:---:|:---|:---|:---:|
| 1 | `01_preflight_checks.sql` | **Tiền kiểm an toàn:** Kiểm tra baseline schema (27 bảng), orphan payments, đối soát dữ liệu số tiền giữa `THANHTOAN` và `DONDATVE`, kiểm tra 9 SQL modules. Dừng ngay nếu `MismatchCount > 0` hoặc `OrphanCount > 0`. | **SẴN SÀNG (ĐÃ VERIFIED PASS)** |
| 2 | `02_expand_update_views_procedures.sql` | **Giai đoạn Mở rộng (Expand Phase):** Cập nhật 1 View (`vw_DoanhThuTheoRap`) và 8 Stored Procedures sử dụng `CREATE OR ALTER` để đọc/ghi số tiền tái dựng từ `DONDATVE`. Không làm ngắt quãng ứng dụng. | **SẴN SÀNG (CHỜ GATE C)** |
| 3 | `03_contract_alter_schema.sql` | **Giai đoạn Thu hẹp (Contract Phase):** Transactional DDL xóa check constraint `CK_THANHTOAN_SoTien`, xóa index cũ, thực hiện `ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien`, và tạo index mới không chứa `SoTien`. | **SẴN SÀNG (CHỜ GATE C)** |
| 4 | `04_post_migration_reconciliation.sql` | **Hậu kiểm đối soát (Reconciliation):** Khẳng định tính toàn vẹn sau di trú: 27 bảng, cột `SoTien` đã biến mất, 4 attempts được bảo toàn, doanh thu 446,500.00 VNĐ nguyên vẹn, thực thi thành công các View và Stored Procedures. | **SẴN SÀNG (CHỜ GATE C)** |
| 5 | `99_rollback_all.sql` | **Hoàn tác khẩn cấp (In-place Rollback):** Tái tạo cột `SoTien`, backfill dữ liệu từ snapshot `DONDATVE`, tái tạo constraint/index ban đầu và khôi phục nguyên bản source code của 9 SQL module. | **SẴN SÀNG (CHỜ GATE C)** |

---

## 3. Bằng chứng Thực nghiệm Tiền kiểm Preflight (Live Runtime Evidence)

Script `01_preflight_checks.sql` đã được chạy thử nghiệm ở chế độ Read-Only trực tiếp trên SQL Server instance:

```text
============================================================================
BẮT ĐẦU TIỀN KIỂM PREFLIGHT: KIỂM TRA ĐIỀU KIỆN DI TRÚ STRICT 3NF
Thời gian kiểm tra: 2026-10-13 13:19:41
Cơ sở dữ liệu: CinemaBookingDB
============================================================================
1. Kiểm tra số lượng bảng cơ sở dữ liệu...
  -> [PASS] Số lượng bảng chính xác: 27 bảng.
2. Kiểm tra bảng THANHTOAN và cột SoTien...
  -> [PASS] Bảng dbo.THANHTOAN và cột SoTien đang tồn tại.
3. Kiểm tra Constraint và Index phụ thuộc vào SoTien...
  -> [PASS] Tìm thấy CK_THANHTOAN_SoTien.
  -> [PASS] Tìm thấy Index IX_THANHTOAN_DonDatVe.
4. Kiểm tra toàn vẹn quan hệ (Orphan records)...
  -> [PASS] Không có orphan payments (OrphanCount = 0).
5. Đối soát số tiền thanh toán giữa THANHTOAN và DONDATVE...
  - Tổng số Payment Attempts: 4
  - Số đơn hàng tham chiếu:   3
  - Số giao dịch thành công:  3
  - Số giao dịch thất bại:    1
  - Tổng doanh thu lịch sử:   446,500.00 VND
  - Số bản ghi lệch số tiền:  0
  -> [PASS] Sai lệch số tiền bằng 0 tuyệt đối (MismatchCount = 0). Dữ liệu 100% tái dựng được!
6. Kiểm tra sự tồn tại của 9 module SQL phụ thuộc...
  -> [PASS] Toàn bộ 9/9 SQL modules phụ thuộc đều tồn tại đầy đủ.
============================================================================
KẾT LUẬN TIỀN KIỂM PREFLIGHT: TOÀN BỘ ĐIỀU KIỆN ĐẠT CHUẨN (VERIFIED PASS)
Hệ thống đủ điều kiện an toàn 100% để chuyển sang bước Expand Phase.
============================================================================
```

### Chi tiết 4 Payment Attempts được bảo toàn:
| ThanhToanID | DonDatVeID | Phương thức | SoTien Vật lý | Số tiền Tái dựng từ DONDATVE | Trạng thái | Đánh giá Khớp |
|:---:|:---:|:---:|---:|---:|:---:|:---:|
| 1 | 3 | VNPAY | 99,000.00 | 99,000.00 | Thất bại | **100% MATCH** |
| 2 | 3 | VNPAY | 99,000.00 | 99,000.00 | Thành công | **100% MATCH** |
| 3 | 4 | MOMO | 247,500.00 | 247,500.00 | Thành công | **100% MATCH** |
| 4 | 5 | VNPAY | 100,000.00 | 100,000.00 | Thành công | **100% MATCH** |

---

## 4. Đặc tả Chi tiết Thay đổi Schema Vật lý

Lệnh thay đổi cấu trúc bảng trong `03_contract_alter_schema.sql` được gói gọn trong 1 Transaction nguyên tử duy nhất:

```sql
BEGIN TRY
    BEGIN TRANSACTION;
    -- 1. Giữ khóa độc quyền bảng
    SELECT TOP 0 1 FROM dbo.THANHTOAN WITH (TABLOCKX, HOLDLOCK);

    -- 2. Xóa Check Constraint phụ thuộc
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_THANHTOAN_SoTien' AND parent_object_id = OBJECT_ID('dbo.THANHTOAN'))
        ALTER TABLE dbo.THANHTOAN DROP CONSTRAINT CK_THANHTOAN_SoTien;

    -- 3. Xóa Non-clustered Index cũ
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_THANHTOAN_DonDatVe' AND object_id = OBJECT_ID('dbo.THANHTOAN'))
        DROP INDEX [IX_THANHTOAN_DonDatVe] ON dbo.[THANHTOAN];

    -- 4. Xóa Cột vật lý dư thừa
    IF EXISTS (SELECT 1 FROM sys.columns WHERE name = 'SoTien' AND object_id = OBJECT_ID('dbo.THANHTOAN'))
        ALTER TABLE dbo.THANHTOAN DROP COLUMN [SoTien];

    -- 5. Tái tạo Index mới tinh gọn (không chứa SoTien trong INCLUDE)
    CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
    ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
    INCLUDE([NgayThanhToan], [NgayTao]);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

---

## 5. Đặc tả Chi tiết Thay đổi trong View và 8 Stored Procedures

Mọi module SQL đều duy trì 100%:
- Quyền bảo mật kiểm tra tài khoản (`NGUOIDUNG`, `VAITRO`, `fn_KiemTraQuyenNguoiDung`).
- Quản lý transaction lồng (`@@TRANCOUNT`, `SAVE TRANSACTION`).
- Bắt lỗi giao dịch (`XACT_STATE()`).
- Tên cột đầu ra (Output column contracts).

| STT | Tên SQL Module | Vị trí Source Code | Loại thay đổi | Biểu thức thay thế |
|:---:|:---|:---|:---:|:---|
| 1 | `dbo.vw_DoanhThuTheoRap` | `06_views/vw_DoanhThuTheoRap.sql` | Aggregate SELECT | Thay `SUM(tt.SoTien)` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)` |
| 2 | `dbo.sp_Payment_CreateAttempt` | `08_procedures/payment/sp_Payment_CreateAttempt.sql` | INSERT & SELECT | Bỏ `SoTien` khỏi `INSERT dbo.THANHTOAN`; SELECT trả `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` |
| 3 | `dbo.sp_Payment_UpdateResult` | `08_procedures/payment/sp_Payment_UpdateResult.sql` | Variable assignment | Thay `@Amount = t.SoTien` bằng `@Amount = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` |
| 4 | `dbo.sp_Admin_Dashboard` | `08_procedures/admin/sp_Admin_Dashboard.sql` | Scalar subquery | Thay `SUM(SoTien)` bằng `SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` via JOIN `DONDATVE` |
| 5 | `dbo.sp_Admin_Report_Revenue` | `08_procedures/admin/sp_Admin_Report_Revenue.sql` | Temp table INSERT | Thay `SUM(tt.SoTien)` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)` |
| 6 | `dbo.sp_Manager_Revenue` | `08_procedures/manager/sp_Manager_Revenue.sql` | CTE SELECT | Thay `SUM(tt.SoTien) AS TienDaThu` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu` |
| 7 | `dbo.sp_Order_GetDetailByCustomer` | `08_procedures/customer/sp_Order_GetDetailByCustomer.sql` | Recordset 4 SELECT | Trả `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` qua INNER JOIN `DONDATVE d` |
| 8 | `dbo.sp_StaffBooking_Detail` | `08_procedures/staff_booking/sp_StaffBooking_Detail.sql` | Recordset 4 SELECT | Trả `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` qua INNER JOIN `DONDATVE d` |
| 9 | `dbo.sp_Support_Complaint_GetOrderReference` | `08_procedures/support/sp_Support_Complaint_GetOrderReference.sql` | Recordset 4 SELECT | Trả `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` qua INNER JOIN `DONDATVE d` |

---

## 6. Các Điều Kiện Chặn Di Trú Khẩn Cấp (Migration Abort Criteria)

Quá trình di trú **BẮT BUỘC DỪNG NGAY LẬP TỨC** và hoàn tác nếu xảy ra bất kỳ điều kiện nào sau đây:
1. `MismatchCount > 0`: Phát hiện dù chỉ 1 bản ghi `THANHTOAN.SoTien` không khớp với `DONDATVE`.
2. `OrphanCount > 0`: Có bản ghi thanh toán không có đơn đặt vé tương ứng.
3. `TotalTables <> 27`: Cơ sở dữ liệu bị lệch khỏi baseline 27 bảng.
4. `NegativeAmountCount > 0`: Phát hiện số tiền thanh toán âm.
5. Thiếu bất kỳ SQL Module nào trong số 9 module phụ thuộc.
6. Sao lưu cơ sở dữ liệu (`RESTORE VERIFYONLY`) thất bại trước khi chạy DDL.
7. Lỗi khóa tài nguyên hoặc deadlock kéo dài quá thời gian chờ (lock timeout).
8. Bất kỳ chỉ số nào trong `04_post_migration_reconciliation.sql` không khớp chính xác.

---

## 7. Đánh giá Mức độ Sẵn sàng Triển khai Môi trường Test Độc lập

- [x] Đã hoàn thành 5 script di trú tại `database/13_migrations/3nf_remediation/`.
- [x] Đã kiểm tra cú pháp và thực thi thử nghiệm thành công 100% `01_preflight_checks.sql`.
- [x] Đã xác định 100% các điểm phụ thuộc từ DDL, Stored Procedures, Views, Indexes, Constraints tới Seed/Tests.
- [x] Đã thiết lập cơ chế khôi phục nhanh (In-place rollback) và khôi phục từ bản sao lưu (Full restore).
- [ ] **Gate C (Implementation Approval):** Đang chờ phê duyệt của Chủ dự án để tiến hành chạy trên database test độc lập `CinemaBookingDB_Test`.

