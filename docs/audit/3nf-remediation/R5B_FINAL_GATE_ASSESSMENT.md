# R5-B FINAL GATE ASSESSMENT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R5-B — Strict 3NF Migration Execution on Isolated Test Database  
**Vai trò:** Principal Database Architect, Database Reliability Engineer & Gate Auditor  
**Cơ sở dữ liệu mục tiêu:** `CinemaBookingDB_Test` (ISOLATED TEST DATABASE)  
**Cơ sở dữ liệu Production:** `CinemaBookingDB` (PRODUCTION / WORKING DATABASE)  
**Thời gian đánh giá:** 13/10/2026 16:30:00 (ICT)  
**Trạng thái Phase R5-B:** **VERIFIED PASS**  
**Trạng thái Production Gate C:** **STRICTLY NOT APPROVED — AWAITING PROJECT OWNER AUTHORIZATION**  

---

## 1. Mục tiêu và Thẩm quyền kiểm toán (Audit Scope & Authority)

Theo quyết định phê duyệt có điều kiện của chủ dự án tại Gate B và Phase R5-A:
- **Phạm vi được phép thực hiện:** Thực thi thử nghiệm di trú Strict 3NF, đối soát dữ liệu, kiểm chứng rollback và kiểm thử hồi quy nghiệp vụ độc quyền trên cơ sở dữ liệu kiểm thử `CinemaBookingDB_Test`.
- **Phạm vi nghiêm cấm tuyệt đối:** Không thực hiện bất kỳ lệnh DDL/DML nào trên cơ sở dữ liệu Production `CinemaBookingDB`. Không tự ý nâng quyền tài khoản `CinemaTestUser` lên `sysadmin`. Không tự ý mở Gate C hoặc triển khai lên Production.
- **Quy tắc an toàn (Zero-Tolerance Policy):** Nếu bất kỳ điều kiện nào trong 10 bước của Safety Gate, đối soát dữ liệu, rollback drill hoặc kiểm thử hồi quy thất bại $\to$ Kết luận ngay lập tức là **NO-GO**.

---

## 2. Bảng tổng hợp đánh giá các tiêu chí nghiệm thu (Acceptance Criteria Evaluation)

| STT | Hạng mục kiểm toán (Gate Criteria) | Mục tiêu / Ngưỡng chấp nhận (Threshold) | Kết quả thực tế (Actual Evidence) | Trạng thái |
|:---:|---|---|---|:---:|
| 1 | **Phase 0 — Safety Gate** | Đạt 10/10 điều kiện an toàn môi trường | 10/10 checks PASS. `CinemaTestUser` bị chặn vào Production (`Msg 18456`). Backup pre-migration đã verified. | **PASS** |
| 2 | **Phase 1 — Baseline Capture** | Lưu snapshot bền vững tại `tempdb` & JSON | RunID: `A0DC51EF-214B-4169-8FDE-D53F0DB17FAD`. Snapshot lưu 4 attempts, file JSON ngoại vi tồn tại. | **PASS** |
| 3 | **Phase 2 — Expand Migration** | Cập nhật 8 readers $\to$ nới lỏng schema $\to$ cập nhật writer | 9/9 modules SQL cập nhật thành công. Cột `SoTien` chuyển `AllowsNull = 1`. Thứ tự Reader $\to$ Writer đúng chuẩn. | **PASS** |
| 4 | **Phase 3 — Contract Migration** | Drop constraint, drop index, drop physical column `SoTien`, rebuild index | Cột `SoTien` biến mất (`COL_LENGTH = NULL`). `PK, FK, UQ` nguyên vẹn. 27 bảng nghiệp vụ được bảo toàn. | **PASS** |
| 5 | **Phase 4 — Reconciliation** | Khớp 100% aggregate & row-by-row | 0 missing, 0 extra, 0 amount mismatch, 0 status mismatch. Doanh thu khớp 446,500.00 VNĐ. 5 modules readers PASS. | **PASS** |
| 6 | **Phase 5 — Rollback Drill** | Hoàn tác toàn phần về nguyên bản an toàn | `99_rollback_all.sql` phục hồi `SoTien` NOT NULL, Check constraint, Index INCLUDE, 9 modules legacy. Dữ liệu khớp 100%. | **PASS** |
| 7 | **Phase 6 — Re-Migration** | Chứng minh tính lặp lại của bộ script | Preflight $\to$ Expand $\to$ Contract $\to$ Reconciliation chạy lại lần 2 thành công 100%. | **PASS** |
| 8 | **Payment Regression Suite** | 15/15 kịch bản thanh toán (PAY-01 $\to$ PAY-15) | 15/15 test cases PASS (Đơn, attempts, retry, immutability, báo cáo, chống trùng, concurrency, DTO). | **PASS** |
| 9 | **Business Regression Suite** | Các kịch bản Khiếu nại, Bảng giá, Phân công, Rạp | 8/8 test cases PASS (COMP-01..04, PRICE-01..03, ASGN-01..03, CINEMA-01). | **PASS** |
| 10 | **Backend API Compatibility** | Bộ test tự động Node.js không phát sinh lỗi | 205/205 tests PASS (0 fail, 0 skip). API contract hoàn toàn tương thích với schema 3NF tái dựng. | **PASS** |
| 11 | **Bảo toàn cơ sở dữ liệu Production** | Không có bất kỳ thay đổi nào trên `CinemaBookingDB` | `CinemaBookingDB` giữ nguyên 27 bảng, cột `SoTien` vẫn còn, 4 attempts, 446,500.00 VNĐ. Zero modification. | **PASS** |

---

## 3. Phân định rõ ràng phạm vi đã chứng nhận (Scope of Certification)

Để đảm bảo tính chính xác và minh bạch trong báo cáo kỹ thuật, phân định rõ 3 cấp độ trạng thái của hệ thống:

1. **Target Schema Design Verified: YES**  
   - Thiết kế lược đồ đích Strict 3NF (Option 1 — 27 bảng, loại bỏ cột vật lý `THANHTOAN.SoTien`, tái dựng từ `DONDATVE`) đã được chứng minh toán học và nghiệp vụ là tối ưu và đạt chuẩn 3NF thực chất.
2. **Test Runtime Migration Verified: YES**  
   - Quá trình di trú thực tế trên môi trường độc lập `CinemaBookingDB_Test` đã hoàn thành xuất sắc, vượt qua toàn bộ các đợt đối soát hai chiều, kiểm thử hoàn tác và kiểm thử hồi quy chuyên sâu.
3. **Production Runtime Migration Verified: NO**  
   - Cơ sở dữ liệu Production `CinemaBookingDB` **chưa thực hiện di trú**.
   - Cột vật lý `THANHTOAN.SoTien` trên Production **vẫn đang tồn tại**.
   - **Tuyệt đối không được tuyên bố Production đã đạt 3NF khi chưa thực thi di trú Production.**

---

## 4. Danh mục hồ sơ kỹ thuật và Kế hoạch đồng bộ khi mở Gate C (Sync Checklist for Future Gate C)

Khi chủ dự án chính thức phê duyệt mở **Gate C (Production Migration Execution)**, các đầu việc kỹ thuật cần thực hiện đồng bộ gồm:

### 4.1. Bộ scripts di trú đã sẵn sàng và được thẩm định (Production-Ready Migration Pack):
- `database/13_migrations/3nf_remediation/01_preflight_checks.sql` (Đã bổ sung `COLLATE DATABASE_DEFAULT`).
- `database/13_migrations/3nf_remediation/02_expand_update_views_procedures.sql` (Đã kiểm chứng tính tương thích).
- `database/13_migrations/3nf_remediation/03_contract_alter_schema.sql` (Đã bổ sung `SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;`).
- `database/13_migrations/3nf_remediation/04_post_migration_reconciliation.sql` (Đã bổ sung `COLLATE DATABASE_DEFAULT`).
- `database/13_migrations/3nf_remediation/99_rollback_all.sql` (Đã bổ sung `sp_executesql` bảo vệ compile-time resolution và `COLLATE DATABASE_DEFAULT`).

### 4.2. Cập nhật DDL Baseline Khởi tạo (Bootstrap Synchronization):
Sau khi hoàn thành di trú Production, cần cập nhật các file DDL tạo mới database ban đầu để các instance triển khai mới trong tương lai có schema 3NF ngay từ đầu:
- `database/01_tables/09_thanhtoan.sql`: Bỏ định nghĩa cột `SoTien`.
- `database/04_constraints/ck_thanhtoan.sql`: Bỏ constraint `CK_THANHTOAN_SoTien`.
- `database/05_indexes/ix_thanhtoan.sql`: Bỏ cột `SoTien` khỏi mệnh đề `INCLUDE`.
- `database/02_views/vw_doanhthu_rap.sql`: Cập nhật logic tính doanh thu tái dựng từ `DONDATVE`.
- `database/03_procedures/`: Cập nhật 8 Stored Procedures theo đúng mã nguồn trong Expand Phase.

---

## 5. Kết luận cuối cùng của Phase R5-B (Final Verdict)

```text
============================================================================
PHASE R5-B — STRICT 3NF TEST EXECUTION: VERIFIED PASS
============================================================================
TARGET DATABASE:               CinemaBookingDB_Test
EXECUTION ACCOUNT:             CinemaTestUser (Non-sysadmin)

SAFETY GATE:                   PASS (10/10 Checks)
BASELINE CAPTURE:              PASS (MigrationRunID: A0DC51EF-214B-4169-8FDE-D53F0DB17FAD)
EXPAND:                        PASS (9/9 Modules Updated)
CONTRACT:                      PASS (Physical SoTien Dropped)
RECONCILIATION:                PASS (100% Match, 0 Mismatch)
ROLLBACK DRILL:                PASS (100% Clean Restoration)
RE-MIGRATION:                  PASS (Deterministic Re-Execution)
PAYMENT REGRESSION:            PASS (15/15 Scenarios)
BUSINESS REGRESSION:           PASS (8/8 Scenarios)
API COMPATIBILITY:             PASS (205/205 Tests Pass)
TEST SCHEMA 3NF:               PASS (27 Tables, Strict 3NF Certified)

TABLES:                        27
PAYMENT ATTEMPTS PRESERVED:    4 (100%)
AMOUNT MISMATCH:               0
ORPHAN PAYMENTS:               0
CRITICAL FAILURES:             0

PRODUCTION SCHEMA/DATA MODIFIED: NO
PRODUCTION MIGRATION EXECUTED:   NO

R5-B RESULT:                   PASS
PRODUCTION GATE C:             NOT APPROVED
============================================================================
```

**HÀNH ĐỘNG TIẾP THEO:**  
Toàn bộ nhiệm vụ của Phase R5-B đã hoàn tất 100%.  
Theo đúng quy tắc ủy quyền an toàn, kỹ sư di trú **DỪNG LẠI TẠI ĐÂY**, bảo lưu trạng thái hệ thống và chờ chỉ thị tiếp theo từ Chủ dự án. Tuyệt đối không tự động triển khai Production.

