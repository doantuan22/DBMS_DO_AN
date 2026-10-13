# STRICT 3NF IMPLEMENTATION ROADMAP — CINEMABOOKINGDB
**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Chuyên gia phụ trách:** Principal Database Architect & Software Migration Architect  
**Tài liệu:** Lộ trình triển khai và Quản trị cổng phê duyệt (Implementation Roadmap R1–R8)  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái tài liệu:** **GATE A: APPROVED | GATE B: APPROVED (OPTION 1 — 27 TABLES) | GATE C: NOT APPROVED**  

---

## 1. Tổng quan Lộ trình Triển khai (R1 đến R8)

Lộ trình chuyển đổi cơ sở dữ liệu CinemaBookingDB sang chuẩn 3NF tuyệt đối được phân kỳ thành 8 giai đoạn có kiểm soát chặt chẽ thông qua 3 Cổng quyết định (Decision Gates):

```text
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1: KHÓA NGHIỆP VỤ & THIẾT KẾ KIẾN TRÚC                       │
│                                                                        │
│   [R1: Business Rule Lock] ──> GATE A: APPROVED (HOÀN THÀNH)           │
│             │                                                          │
│             ▼                                                          │
│   [R2: Technical Design Decision] ──> GATE B: APPROVED (HOÀN THÀNH)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Đã sẵn sàng chuyển sang Giai đoạn 2)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 2: CHUẨN BỊ KỊCH BẢN & KIỂM THỬ TRÊN DATABASE TEST           │
│                                                                        │
│   [R3: Database Migration Preparation]                                 │
│             │                                                          │
│             ▼                                                          │
│   [R4: Stored Procedure & View Compatibility]                          │
│             │                                                          │
│             ▼                                                          │
│   [R5: Backend Contract Verification]                                  │
│             │                                                          │
│             ▼                                                          │
│   [R6: Data Migration & Reconciliation on Test DB]                     │
│             │                                                          │
│             ▼                                                          │
│   [R7: Integration & Concurrency Verification] ──> GATE C: APPROVAL    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Chỉ khi Gate C được phê duyệt chính thức)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 3: TRIỂN KHAI PRODUCTION & CHỨNG NHẬN 3NF HOÀN TẤT           │
│                                                                        │
│   [R8: Final 3NF Certification & Production Go-Live]                   │
└────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **TRẠNG THÁI HIỆN TẠI:**
> - **Gate A (Business Rules):** **APPROVED** (Toàn bộ D-01 đến D-07 đã được Chủ dự án chính thức phê duyệt).
> - **Gate B (Technical Design):** **APPROVED** (Chủ dự án đã chọn Phương án 1 — Giữ nguyên 27 bảng và Phương án A — Loại bỏ `THANHTOAN.SoTien`).
> - **Gate C (Implementation Approval):** **NOT APPROVED** (Chưa được phép sửa source SQL hoặc migration trên Production).
> - **Cơ sở dữ liệu runtime và source code:** **GIỮ NGUYÊN 100% (ZERO CHANGE).**

---

## 2. Chi tiết từng giai đoạn triển khai (R1 đến R8)

### R1 — Business Rule Lock (Khóa quy tắc nghiệp vụ chính thức)
- **Objective:** Xác nhận và đóng băng 7 quy tắc nghiệp vụ cốt lõi (D-01 đến D-07) làm cơ sở xác định tập phụ thuộc hàm chính thức.
- **Scope:** Hồ sơ `BUSINESS_RULE_APPROVAL_MATRIX.md`.
- **Tasks:** Hoàn tất phê duyệt Gate A.
- **Approval Gate:** **GATE A — BUSINESS RULE APPROVAL** $\implies$ **APPROVED**.
- **Trạng thái:** **COMPLETED / LOCKED**.

---

### R2 — Technical Design Decision (Phê duyệt thiết kế kỹ thuật)
- **Objective:** Chốt phương án kiến trúc cho `KHIEUNAI` và `THANHTOAN`, hoàn thiện chứng minh 3NF cho toàn bộ 27 bảng.
- **Scope:** Hồ sơ `STRICT_3NF_NORMALIZATION_DESIGN.md` và `DATABASE_CHANGE_IMPACT_ANALYSIS.md`.
- **Quyết định đã chọn:**
  - `KHIEUNAI`: Lựa chọn 1 — Giữ nguyên 27 bảng (Classical 3NF).
  - `THANHTOAN`: Lựa chọn A — Loại bỏ cột vật lý `SoTien`.
- **Approval Gate:** **GATE B — TECHNICAL DESIGN APPROVAL** $\implies$ **APPROVED**.
- **Trạng thái:** **COMPLETED / LOCKED**.

---

### R3 — Database Migration Preparation (Chuẩn bị kịch bản di trú)
- **Objective:** Xây dựng toàn bộ các file SQL script thực thi migration, script preflight, script đối soát và script rollback trong thư mục di trú chuyên biệt `database/13_migrations/3nf_remediation/`.
- **Scope:** 5 file migration scripts (chỉ tạo file script, không chạy vào database).
- **Dependencies:** Hoàn thành Gate B (R2).
- **Trạng thái:** `READY TO START (PENDING INSTRUCTION)`.

---

### R4 — Stored Procedure & View Compatibility (Kiểm định tính tương thích module)
- **Objective:** Đảm bảo 8 Stored Procedures và 1 View sau khi cập nhật trả về đúng 100% tên cột `SoTien`, kiểu dữ liệu và giá trị mong muốn.
- **Scope:** 8 Stored Procedures và 1 View (`vw_DoanhThuTheoRap`).
- **Dependencies:** Hoàn thành R3.
- **Trạng thái:** `PLANNED`.

---

### R5 — Backend Contract Verification (Kiểm định hợp đồng Backend API)
- **Objective:** Xác nhận Backend Node.js tiếp tục gọi các Stored Procedure bình thường và map dữ liệu vào DTO không bị lỗi.
- **Scope:** `backend/src/services/orderService.js`, `feedbackService.js`, `adminService.js`.
- **Dependencies:** Hoàn thành R4.
- **Trạng thái:** `PLANNED`.

---

### R6 — Data Migration & Reconciliation on Test Environment (Thực thi thử nghiệm & Đối soát)
- **Objective:** Triển khai thử nghiệm toàn bộ quy trình di trú trên môi trường Database Test được chỉ định và đối soát dữ liệu lịch sử.
- **Scope:** Database Test Instance riêng biệt.
- **Dependencies:** Hoàn thành R5.
- **Trạng thái:** `PLANNED`.

---

### R7 — Integration & Concurrency Verification (Kiểm thử tích hợp & Tải đồng thời)
- **Objective:** Chạy toàn bộ 15 kịch bản Payment Regression và các test nghiệp vụ trên môi trường Test đã chuẩn hóa.
- **Scope:** Bộ test suite trong `STRICT_3NF_VERIFICATION_MATRIX.md`.
- **Dependencies:** Hoàn thành R6.
- **Approval Gate:** **GATE C — IMPLEMENTATION APPROVAL** (Chủ dự án phê duyệt cho phép triển khai lên Production).
- **Trạng thái:** `PLANNED`.

---

### R8 — Final 3NF Certification & Production Go-Live (Triển khai Production & Chứng nhận)
- **Objective:** Triển khai di trú chính thức trên Production Database trong maintenance window được cấp phép và cấp chứng nhận 100% 3NF.
- **Scope:** Production CinemaBookingDB.
- **Dependencies:** Phải đạt Gate C Approval (R7).
- **Trạng thái:** `PLANNED`.

---

## 3. Bảng tổng hợp Quản trị Cổng phê duyệt (Governance Gate Summary)

| Cổng quyết định | Giai đoạn | Tiêu chí nghiệm thu | Trách nhiệm | Trạng thái hiện tại |
|---|:---:|---|:---:|:---:|
| **GATE A**<br>Business Rule Approval | R1 | Phê duyệt 7 quyết định nghiệp vụ (D-01 đến D-07). | Chủ dự án | **APPROVED (ĐÃ DUYỆT)** |
| **GATE B**<br>Technical Design Approval | R2 | Phê duyệt phương án 27 bảng và chứng minh toán học 3NF. | Chủ dự án & Lead Architect | **APPROVED (ĐÃ DUYỆT)** |
| **GATE C**<br>Implementation Approval | R7 $\to$ R8 | 100% kiểm thử kỹ thuật và đối soát dữ liệu trên Test DB đạt PASS. | Chủ dự án | **NOT APPROVED (CHƯA CẤP PHÉP)** |

---
*Lộ trình triển khai kỹ thuật đã cập nhật theo quyết định Gate B. Tuyệt đối không tự ý chạy migration khi chưa có phê duyệt Gate C.*
