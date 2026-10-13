# BÁO CÁO NGHIỆM THU R5-A VÀ SẴN SÀNG DI TRÚ R5-B (MIGRATION READINESS)
## DỰ ÁN: CinemaBookingDB — STRICT 3NF NORMALIZATION

- **Cơ quan thẩm định:** Senior SQL Server Migration Engineer & Database Reliability Auditor
- **Thời gian nghiệm thu:** 13/10/2026
- **Trạng thái:**
  - R5-A Environment Provisioning: **PASS (COMPLETED & VERIFIED)**
  - R5-B Migration Execution: **GO (READY FOR AUTHORIZATION)**
  - Production Gate C: **STRICTLY NOT APPROVED**

---

## 1. TỔNG HỢP KẾT QUẢ NGHIỆM THU PHASE R5-A

| Tiêu chuẩn Nghiệm thu R5-A | Yêu cầu Chủ dự án | Kết quả Thực tế Quan sát | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Test Database Creation** | Tên chính xác `CinemaBookingDB_Test`, không dùng WITH REPLACE | Tạo thành công từ COPY_ONLY backup với RESTORE MOVE. State: ONLINE. | **PASS** |
| **Backup Integrity** | Kiểm tra RESTORE VERIFYONLY WITH CHECKSUM | `The backup set on file 1 is valid.` | **PASS** |
| **Logical File Names** | Kiểm tra bằng RESTORE FILELISTONLY từ file backup | Khớp chính xác `CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012` (Data & Log). | **PASS** |
| **Data Preservation** | Dữ liệu Test khớp 100% với Production tại thời điểm sao lưu | Khớp chính xác 27 bảng, 4 attempts, 3 orders, tổng tiền 545.500 VNĐ. | **PASS** |
| **Test Login & RBAC** | `CinemaTestUser`, không sysadmin, `db_owner` trên Test | Login tạo thành công, `IsSysAdmin = 0`, `IsDbOwner = 1` trên Test. | **PASS** |
| **Production Isolation** | Chặn kết nối vào `CinemaBookingDB` | `DENY CONNECT` kích hoạt; kết nối bị từ chối với lỗi Login failed. | **PASS** |
| **Application Isolation** | Backend trỏ vào Test, không sửa `.env` Production | Tạo [`backend/.env.test`](file:///d:/DBMS_DO_AN/backend/.env.test), [`backend/.env`](file:///d:/DBMS_DO_AN/backend/.env) nguyên vẹn. | **PASS** |
| **External Integrations** | Mock payment gateway, mock notification sink | Kích hoạt mock trong `.env.test`, không Agent Jobs chạy trên Test. | **PASS** |
| **Baseline Persistence** | Lưu vào tempdb và xuất file JSON có thể đọc lại | Preflight tạo staging trong `tempdb`; xuất JSON và kiểm thử `OPENJSON` thành công 100%. | **PASS** |
| **Git Leak Protection** | Không commit password hoặc dữ liệu thanh toán vào Git | Thêm `.env.test` và `baseline/*.json` vào [`.gitignore`](file:///d:/DBMS_DO_AN/.gitignore). | **PASS** |
| **Production Untouched** | Không thay đổi schema hoặc dữ liệu `CinemaBookingDB` | Kiểm tra trực tiếp: 27 bảng, 4 attempts, `SoTien NOT NULL` nguyên bản. | **PASS** |
| **No Migration Run** | Không chạy script di trú 02, 03, 99 trong R5-A | Chưa thực thi bất kỳ script di trú nào. | **PASS** |

---

## 2. KẾ HOẠCH TRIỂN KHAI CHO GIAI ĐOẠN R5-B (MIGRATION EXECUTION)

Ngay khi nhận được lệnh phê duyệt chính thức cho Phase R5-B, kịch bản di trú sẽ được thực thi trên môi trường `CinemaBookingDB_Test` theo đúng thứ tự:

1. **Bước 1 (Preflight):** Chạy [`01_preflight_checks.sql`](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/01_preflight_checks.sql) dưới quyền `CinemaTestUser` trên `CinemaBookingDB_Test`.
2. **Bước 2 (Expand):** Chạy [`02_expand_update_views_procedures.sql`](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/02_expand_update_views_procedures.sql) (Cập nhật 6 Readers $\rightarrow$ nới lỏng cột `SoTien NULL` $\rightarrow$ cập nhật 2 Writers).
3. **Bước 3 (Contract):** Chạy [`03_contract_alter_schema.sql`](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/03_contract_alter_schema.sql) (Khóa bảng `TABLOCKX`, xóa constraint, xóa index, xóa cột vật lý `SoTien`, tái tạo index).
4. **Bước 4 (Reconciliation):** Chạy [`04_post_migration_reconciliation.sql`](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/04_post_migration_reconciliation.sql) (Đối soát hai chiều `FULL OUTER JOIN` với snapshot pre-migration trong `tempdb`).
5. **Bước 5 (Rollback Drill Simulation):** Chạy [`99_rollback_all.sql`](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/99_rollback_all.sql) để kiểm chứng khả năng phục hồi dữ liệu hoàn tác.
6. **Bước 6 (Re-Migration & API Regression Testing):** Tái di trú lên Strict 3NF và chạy bộ test tự động của Backend (`npm test`) trỏ vào `CinemaBookingDB_Test`.

---

## 3. KẾT LUẬN VÀ PHÊ DUYỆT CỔNG

- **R5-A Status:** **PASS**
- **R5-B Readiness:** **GO (SẴN SÀNG NHẬN LỆNH TRIỂN KHAI)**
- **Production Gate C:** **STRICTLY NOT APPROVED**
