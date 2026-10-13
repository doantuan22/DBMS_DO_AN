# R8 FULL-STACK E2E CERTIFICATION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R8 — Final 3NF Certification & Production Release Readiness  
**Vai trò:** Principal Software Architect & Quality Assurance Lead  
**Ngày thực hiện:** 13/10/2026  
**Mục tiêu:** Phân định minh bạch các tầng kiểm thử, đánh giá mức độ bao phủ thực tế từ Frontend đến Database và ghi nhận trung thực hiện trạng kiểm thử Trình duyệt (Browser E2E).  

---

## 1. Phân định Bắt buộc giữa các Tầng Kiểm thử (Testing Tiers Disaggregation)

Để bảo đảm tính trung thực kỹ thuật và không gây hiểu lầm cho Chủ dự án, hệ thống kiểm định R8 phân tách rõ ràng 4 tầng kiểm thử:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Tầng 4: Browser End-to-End (Playwright / Cypress / Headless Browser)  │
│ [NOT_VERIFIED — CHƯA TÍCH HỢP TRONG REPOSITORY]                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Tầng 3: API Full-Stack Integration (HTTP API -> Backend -> SP -> DB)  │
│ [VERIFIED_BY_EXECUTION — 22/22 SCENARIOS PASS (100%)]                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Tầng 2: SQL Integration & Concurrency (T-SQL Scripts, Multi-session)   │
│ [VERIFIED_BY_EXECUTION — 25/25 REGRESSION BLOCKS & 6 CONCURRENCY PASS] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Tầng 1: Unit & Component Contract Tests (Node.js Test Runner)          │
│ [VERIFIED_BY_EXECUTION — Frontend 234/234 PASS | Backend 205/205 PASS] │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Báo cáo Chi tiết Tầng 4: Kiểm thử Trình duyệt (Browser E2E)

### 2.1. Hiện trạng Khảo sát Repository
Rà soát cấu hình tại `frontend/package.json` và thư mục gốc:
- `dependencies`: `@js-temporal/polyfill: 0.5.1`, `react: ^19.2.8`, `react-dom: ^19.2.8`, `react-router-dom: ^7.18.4`.
- `devDependencies`: `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `oxlint`, `vite`.
- `scripts`: `"test": "node --test --test-concurrency=1 tests/*.test.js"`.
- **Kết quả khảo sát:** Repository **chưa cài đặt** Playwright, Cypress, Puppeteer hay bất kỳ trình điều khiển trình duyệt headless nào (browser driver / webdriver).

### 2.2. Đánh giá Trạng thái & Release Blocker
- **Trạng thái chính thức:** **NOT_VERIFIED**.
- **Nguyên nhân (Blocker):** Thiếu công cụ kiểm thử tự động hóa giao diện trình duyệt (E2E browser test runner).
- **Quy tắc nghiệm thu:** **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG ĐÁNH DẤU PASS** cho Browser E2E chỉ vì 234 frontend tests đã đạt PASS. 234 bài kiểm thử frontend hiện tại là kiểm thử component và router trong môi trường mô phỏng (Node.js DOM mock), chưa chạy trên trình duyệt Chromium/Firefox/WebKit thật.
- **Rủi ro kiểm định:** Có khả năng phát sinh lỗi hiển thị CSS cross-browser hoặc sự kiện DOM click trên các thiết bị di động thực tế. Rủi ro này được chuyển vào Risk Register để đội ngũ QA thực hiện kiểm thử thủ công (Manual UAT) trước giờ phát hành.

---

## 3. Báo cáo Chi tiết Tầng 3: Tích hợp API Toàn diện (API Full-Stack Integration)

Khác với Tầng 4, Tầng 3 đã được thực thi thực tế 100% qua kịch bản `scripts/db/r7-verification-suite.mjs` chạy xuyên suốt qua kiến trúc:
$$\text{HTTP REST Client} \longrightarrow \text{Express Backend (Port 4001)} \longrightarrow \text{procedureClient.js RPC} \longrightarrow \text{SQL Server 2025 (Test DB)}$$

### 3.1. Hành trình Khách hàng Đầu-Cuối (Customer E2E Scenarios)
1. **E2E-CUST-01 (Catalog & Ghế):** Gọi `GET /api/movies`, `GET /api/movies/:id/showtimes`, `GET /api/showtimes/:id/seats`. Dữ liệu ghế và giá vé được tính toán động bởi hàm bảng `dbo.fn_DanhSachGheSuatChieu`.
2. **E2E-CUST-02 (Tạo Đơn & Giữ Ghế):** Gọi `POST /api/bookings` với ghế trống. Database tạo đơn `DONDATVE` ở trạng thái `Chờ thanh toán`, hạn giữ 5 phút. Ghế chuyển sang `Đang giữ`.
3. **E2E-CUST-03 (Tạo Giao dịch Thanh toán):** Gọi `POST /api/orders/:id/payments`. Thủ tục `dbo.sp_Payment_CreateAttempt` ghi bản ghi `THANHTOAN` mới (không có `SoTien`) và trả về `amount` tái dựng chính xác từ `DONDATVE`.
4. **E2E-CUST-04 (Xác nhận Callback):** Gọi `POST /api/orders/:id/payments/:paymentId/result` với `status = 'Thành công'`. Đơn hàng chuyển sang `Đã thanh toán`, `HanGiuCho = NULL`, điểm tích lũy được cộng theo tỷ lệ 1.000 VNĐ = 1 điểm.
5. **E2E-CUST-05 (Lịch sử Đơn hàng):** Gọi `GET /api/orders`. Khách hàng xem lại chính xác các vé và thông tin đơn hàng vừa tạo.
6. **E2E-CUST-06 (Thanh toán Thất bại & Thử lại):** Gọi thanh toán Momo thất bại, tiếp tục gọi thanh toán VNPay thành công. Lưu 2 bản ghi attempt riêng biệt trong `THANHTOAN`, không mất dấu kiểm toán.
7. **E2E-CUST-07 (Khiếu nại Option 1):** Gửi khiếu nại chung (`orderId = null`) và khiếu nại gắn đơn (`orderId = <ID>`) đều thành công (HTTP 201).
8. **E2E-CUST-08 (Xử lý TTL Hết hạn):** Kích hoạt dọn dẹp đơn quá hạn qua `dbo.sp_Order_ExpirePending`, ghế được trả về trạng thái `Trống` tự động.

### 3.2. Luồng Quản lý và Hỗ trợ (Manager, CSKH, Admin Flows)
1. **Manager Flow:** Quản lý truy cập rạp được phân công thành công; truy cập rạp ngoài phạm vi nhận lỗi HTTP 403 (`MANAGER_CINEMA_FORBIDDEN` / `BR08`).
2. **CSKH Flow:** Truy cập hàng đợi khiếu nại, xem chi tiết và đối chiếu đơn hàng thành công.
3. **Admin Flow:** Xem dashboard hệ thống và báo cáo doanh thu theo rạp tổng hợp từ `DONDATVE` thành công.

---

## 4. Báo cáo Chi tiết Tầng 1 & 2: Unit, Contract & SQL Regression Tests

| Phân hệ kiểm thử | Bộ công cụ thực thi | Số lượng kiểm thử | Kết quả | Ghi chú kỹ thuật |
|---|---|:---:|:---:|---|
| **Frontend Component Tests** | `node --test tests/*.test.js` | 234 tests | **PASS (100%)** | Thời gian 26.35s; bao phủ React routing, forms, validation |
| **Backend Integration Tests** | `node --test tests/*.test.js` | 205 tests | **PASS (100%)** | Thời gian 2.68s; bao phủ Express services, JWT, error taxonomy |
| **SQL Regression Suite** | `sqlcmd -i test-all.sql` | 25 test blocks | **PASS (100%)** | Bao phủ trigger multi-row, compensation math, permissions |
| **Linter Kiểm tra Cú pháp** | `oxlint` (Frontend) | 206 tệp tin | **0 Errors** | Tuân thủ 104 rules chuẩn React 19 và ES6+ |

---

## 5. Kết luận Đánh giá Full-Stack E2E

1. **Đã đạt tiêu chuẩn phát hành (Production-Ready):**
   - Tầng 1 (Unit & Component): **VERIFIED PASS (100%)**.
   - Tầng 2 (SQL Regression & Concurrency): **VERIFIED PASS (100%)**.
   - Tầng 3 (API Full-Stack Integration): **VERIFIED PASS (100%)**.
2. **Điểm khuyết thiếu bắt buộc ghi nhận (Release Finding):**
   - Tầng 4 (Real Browser E2E): **NOT_VERIFIED** do chưa tích hợp framework Playwright/Cypress.
   - *Kiến nghị:* Bổ sung bài kiểm tra thủ công trên trình duyệt (Manual Smoke Test Checklist) trong giai đoạn bảo trì trước khi chính thức mở traffic người dùng thật.

