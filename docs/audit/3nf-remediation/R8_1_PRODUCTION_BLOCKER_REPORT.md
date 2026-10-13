# R8.1 PRODUCTION BLOCKER RESOLUTION REPORT
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** R8.1 — Final Production Readiness Hardening & Gate C Preparation  
**Auditor / Roles:** Principal Software Architect, Senior SQL Server DBA, Database Reliability Engineer, Release & Security Auditor  
**Date:** October 13, 2026  
**Status:** **ALL BLOCKERS RESOLVED — 0 REMAINING BLOCKERS**  
**Production Gate C Status:** **CONDITIONAL GO FOR SCHEDULED MAINTENANCE WINDOW (PENDING OWNER SIGN-OFF)**

---

## 1. MỤC TIÊU VÀ TỔNG QUAN

Báo cáo này đóng vai trò thẩm định và giải quyết dứt điểm các rào cản kỹ thuật (blockers) được ghi nhận tại giai đoạn R8 (`docs/audit/3nf-remediation/R8_FINAL_GATE_C_APPROVAL_DOSSIER.md`), phục vụ bước chuẩn bị cuối cùng cho cổng phê duyệt **Production Gate C**.

Tại Phase R8, trạng thái phê duyệt Gate C là `NOT APPROVED / CONDITIONAL` do còn tồn tại hai rào cản chính:
1. **Rào cản bảo mật (Security Blocker):** Kết nối backend sử dụng tài khoản `sa` (`DB_USER=sa`) trên môi trường Production, vi phạm nguyên tắc đặc quyền tối thiểu (least privilege) và thiếu tài khoản phân quyền riêng biệt `CinemaAppUser`.
2. **Rào cản kiểm thử tự động trên trình duyệt thật (Real Browser E2E Blocker):** Bộ kiểm thử E2E ở R7/R8 sử dụng API/Mock script, chưa kiểm chứng tương tác người dùng trên trình duyệt thực tế (Playwright) với giao diện React và backend thật trên cơ sở dữ liệu Test.

Giai đoạn **R8.1** đã hoàn thành việc thẩm tra, nhận phê duyệt ngoại lệ từ Chủ dự án, và thực thi toàn diện kiểm thử trình duyệt thực tế.

---

## 2. BẢNG THEO DÕI VÀ TRẠNG THÁI GIẢI QUYẾT BLOCKER

| Mã Blocker | Phân loại | Mô tả chi tiết tại R8 | Hành động xử lý trong R8.1 | Trạng thái R8.1 |
|---|---|---|---|---|
| **BLK-01** | An toàn bảo mật | Backend Production cấu hình `DB_USER=sa` | **Phê duyệt ngoại lệ chính thức (Owner-Approved Exception):** Chủ dự án đã ký phê duyệt chấp nhận rủi ro vận hành `sa` cho giai đoạn hiện tại. Bù đắp bằng kiến trúc 100% DBMS-First, whitelist Stored Procedure đóng băng, và kiểm soát mạng nội bộ. | **RESOLVED (APPROVED EXCEPTION)** |
| **BLK-02** | Kiểm thử tích hợp | Thiếu kiểm thử End-to-End trên trình duyệt thực tế | **Thực thi Playwright E2E Suite (11/11 Scenarios):** Chạy trình duyệt Microsoft Edge Headless trên giao diện Vite + React, gọi Express API và thao tác trực tiếp trên `CinemaBookingDB_Test`. 100% kịch bản PASS. | **RESOLVED (VERIFIED PASS)** |
| **BLK-03** | Toàn vẹn tài chính | Cần đối soát sai số tái tạo doanh thu `SoTien` trên 1:N thanh toán | **Đối soát số liệu lịch sử & kịch bản mới:** So sánh baseline pre-migration và post-migration. Sai số tái tạo = 0.0000 VNĐ. Quy trình thanh toán thất bại, thử lại (retry) bảo toàn đúng 1 thanh toán thành công duy nhất. | **RESOLVED (VERIFIED PASS)** |
| **BLK-04** | Nhất quán tài liệu & Schema | Tài liệu R8 nghi vấn `dbo.THANHTOAN` bị đổi thành View hoặc rename thành `THANHTOAN_BASE` (RISK-13) | **Thẩm định thực tế Database Object:** Xác minh `dbo.THANHTOAN` là `USER_TABLE`, cột `SoTien` đã bị DROP vật lý, tính toán động được bao bọc trực tiếp trong 8 Stored Procedures và 1 View. Không có đối tượng nào bị gãy vỡ. | **RESOLVED (VERIFIED PASS)** |

---

## 3. CHI TIẾT GIẢI QUYẾT TỪNG BLOCKER

### 3.1. Giải quyết Blocker Bảo mật (BLK-01 / RISK-05)
- **Quyết định của Chủ dự án (Project Owner):**
  Chủ dự án đã xem xét đánh giá rủi ro và chính thức ban hành phê duyệt ngoại lệ: **Chấp thuận cho backend kết nối bằng tài khoản `sa` (`DB_USER=sa`)**.
- **Yêu cầu tuân thủ:**
  - Không được sửa đổi mật khẩu `sa` hoặc thay đổi cấu hình tài khoản `sa` của SQL Server instance `DoanTuanIT`.
  - Không bắt buộc phải tạo tài khoản `CinemaAppUser` trước khi cutover.
- **Biện pháp kiểm soát bù đắp (Compensating Controls):**
  1. *Kiến trúc DBMS-First nghiêm ngặt:* Toàn bộ backend Node.js không chứa bất kỳ câu lệnh SQL tự do (raw/dynamic SQL). Đã kiểm toán 69 tệp backend, 0 vi phạm.
  2. *Danh mục Stored Procedure đóng băng:* `backend/src/db/procedureClient.js` chỉ thực thi các thủ tục nằm trong `PROCEDURES` whitelist, tham số hóa 100%.
  3. *Phân quyền ứng dụng ở tầng API & Procedure:* Middleware xác thực JWT và kiểm tra vai trò người dùng (Customer, Manager, Staff, Support, Admin) trước khi chuyển vào thủ tục lưu trữ.
  4. *Giới hạn phạm vi cụm rạp:* Thủ tục `sp_Manager_*` kiểm tra quyền sở hữu rạp ngay trong T-SQL, ngăn chặn truy cập chéo.

### 3.2. Giải quyết Blocker Kiểm thử Trình duyệt (BLK-02 / RISK-11)
- **Kiến trúc kiểm thử:**
  - Triển khai framework **Playwright** tích hợp trình duyệt **Microsoft Edge** (Chromium engine) chạy chế độ headless.
  - Script điều khiển: `scripts/e2e/r8_1_browser_e2e.mjs`.
  - Môi trường cô lập: Frontend Vite (`http://127.0.0.1:61366`), Backend Express (`http://127.0.0.1:61365`), kết nối tới Database `CinemaBookingDB_Test`.
- **Kết quả 11 kịch bản End-to-End:**
  1. `E2E-01`: Đăng nhập & Lưu phiên làm việc khách hàng — **PASS** (2051ms)
  2. `E2E-02`: Tra cứu phim & Lịch chiếu — **PASS** (904ms)
  3. `E2E-03`: Sơ đồ ghế & Quy tắc khóa ghế đã đặt — **PASS** (1251ms)
  4. `E2E-04`: Tạo đơn đặt vé & Hạn giữ chỗ — **PASS** (1008ms)
  5. `E2E-05`: Thanh toán thành công & Đối soát `SoTien` động — **PASS** (484ms)
  6. `E2E-06`: Thử lại thanh toán thất bại & Bảo toàn lịch sử 1:N — **PASS** (1163ms)
  7. `E2E-07`: Lịch sử đơn hàng & Chi tiết đơn vé — **PASS** (1083ms)
  8. `E2E-08`: Gửi khiếu nại & Cô lập dữ liệu đơn hàng chéo — **PASS** (978ms)
  9. `E2E-09`: Giới hạn phạm vi quản lý cụm rạp (Manager RBAC) — **PASS** (887ms)
  10. `E2E-10`: Xử lý khiếu nại nhân viên CSKH (Support) — **PASS** (740ms)
  11. `E2E-11`: Báo cáo doanh thu & Bảng điều khiển Quản trị viên (Admin) — **PASS** (1533ms)
- **Bằng chứng:** Toàn bộ 11 ảnh chụp màn hình UI và file kết quả `docs/audit/3nf-remediation/evidence/e2e/e2e_results.json` đã được lưu trữ và kiểm tra toàn vẹn.

### 3.3. Giải quyết Blocker Đối soát Tài chính (BLK-03 / RISK-02)
- Đối soát so sánh 4 bản ghi thanh toán baseline pre-migration:
  - `ThanhToanID = 1`: 99,000.00 VNĐ (Thất bại) — Sai lệch: 0.0000 VNĐ.
  - `ThanhToanID = 2`: 99,000.00 VNĐ (Thành công) — Sai lệch: 0.0000 VNĐ.
  - `ThanhToanID = 3`: 247,500.00 VNĐ (Thành công) — Sai lệch: 0.0000 VNĐ.
  - `ThanhToanID = 4`: 100,000.00 VNĐ (Thành công) — Sai lệch: 0.0000 VNĐ.
- Tổng doanh thu lịch sử: 446,500.00 VNĐ — Khớp 100% giữa công thức tính động `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` và số liệu cũ.
- Đối soát các giao dịch mới sinh ra trong kiểm thử R8.1: Mối quan hệ 1 đơn đặt vé có nhiều lần thử thanh toán (1:N payment attempts) ghi nhận chính xác, không trùng lặp doanh thu.

### 3.4. Giải quyết Nghi vấn Tương thích Schema (BLK-04 / RISK-13)
- Kết quả kiểm toán đối tượng thực tế trên SQL Server:
  - Bảng `dbo.THANHTOAN` là `USER_TABLE` (`type_desc = USER_TABLE`).
  - Không có View nào tên là `dbo.THANHTOAN` hoặc `v_PaymentProjection`.
  - Cột vật lý `SoTien` đã được loại bỏ thành công để đạt chuẩn Strict 3NF.
  - Tám (8) Stored Procedures và một (1) View nghiệp vụ tính toán `SoTien` động qua phép JOIN với snapshot tài chính bất biến của `dbo.DONDATVE`.

---

## 4. KẾT LUẬN VÀ TRẠNG THÁI SẴN SÀNG

Toàn bộ các điều kiện tiên quyết và rào cản kỹ thuật đã được giải quyết triệt để:
- **Số lượng blocker còn tồn đọng:** **0**
- **Cơ sở dữ liệu Production `CinemaBookingDB`:** Hoàn toàn **NGUYÊN VẸN 100%**, chưa áp dụng migration.
- **Khuyến nghị kỹ thuật:** Đạt chuẩn **CONDITIONAL GO FOR SCHEDULED MAINTENANCE WINDOW**.
- **Bước tiếp theo:** Trình hồ sơ thẩm định R8.1 cho Chủ dự án ký duyệt chính thức để kích hoạt cửa sổ bảo trì và triển khai Cutover theo Runbook.

