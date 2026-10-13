# R8.1 RELEASE RISK REASSESSMENT & REGISTER MATRIX
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** R8.1 — Final Production Readiness Hardening & Gate C Preparation  
**Auditor:** Database Reliability Engineer & Release Auditor  
**Date:** October 13, 2026  
**Classification:** **FORMAL PRODUCTION RELEASE RISK REGISTER**  
**Overall Risk Level:** **LOW / STRICTLY CONTROLLED**

---

## 1. TỔNG QUAN ĐÁNH GIÁ RỦI RO TRIỂN KHAI

Báo cáo này rà soát và đánh giá lại toàn bộ 14 rủi ro phát hành (từ **RISK-01** đến **RISK-14**) được xác lập trong hồ sơ R8 (`docs/audit/3nf-remediation/R8_RELEASE_RISK_REGISTER.md`), sau khi đã hoàn thành các bước kiểm tra chuyên sâu, kiểm thử trình duyệt thực tế và phê duyệt chính thức của Chủ dự án trong giai đoạn **R8.1**.

### Bảng chuyển dịch trạng thái rủi ro cốt lõi (Key Risk Status Transitions)
- **RISK-05 (Backend Elevated Privileges / `sa`):** Chuyển từ `BLOCKER` sang **`OWNER-APPROVED EXCEPTION (CLOSED AS BLOCKER)`**.
- **RISK-11 (Absence of Real Browser UI Testing):** Chuyển từ `BLOCKER` sang **`MITIGATED / CLOSED`** (11/11 kịch bản Playwright PASS).
- **RISK-13 (Documentation vs Physical Object Confusion):** Chuyển từ `HIGH RISK` sang **`RESOLVED / CLOSED`** (Xác nhận `dbo.THANHTOAN` là `USER_TABLE`).

---

## 2. BẢNG THEO DÕI TOÀN DIỆN 14 RỦI RO PHÁT HÀNH (RISK-01 ĐẾN RISK-14)

| Mã Rủi Ro | Mô tả rủi ro | Mức độ ban đầu (R8) | Hành động giảm thiểu tại R8 / R8.1 | Rủi ro còn lại (Residual) | Trạng thái R8.1 |
|---|---|---|---|---|---|
| **RISK-01** | Thất thoát dữ liệu trong quá trình thay đổi Schema (Data Loss) | High | Kịch bản Expand-Contract 4 giai đoạn, sao lưu bảng tạm, đối soát checksum trước/sau migration. | Rất thấp | **MITIGATED / CLOSED** |
| **RISK-02** | Sai lệch số liệu tài chính khi tính toán động `SoTien` | Critical | Đối soát baseline lịch sử chi tiết 4 bản ghi. Sai số thực tế = 0.0000 VNĐ. Quy trình tính toán dựa trên snapshot đơn hàng. | Không có | **MITIGATED / CLOSED** |
| **RISK-03** | Giảm hiệu năng truy vấn do tính toán động trong Stored Procedures | Medium | Đánh chỉ mục Index tối ưu trên `DONDATVE(DonDatVeID)` và `THANHTOAN(DonDatVeID)`. Thời gian thực thi truy vấn < 10ms. | Rất thấp | **MITIGATED / CLOSED** |
| **RISK-04** | Thất bại khi thực thi Rollback khẩn cấp (`99_rollback_all.sql`) | High | Đã diễn tập Rollback Drill thành công tại R5-B. Có phương án dự phòng khôi phục bản sao lưu toàn phần (Full Database Restore). | Rất thấp | **MITIGATED / CLOSED** |
| **RISK-05** | Backend sử dụng tài khoản `sa` với đặc quyền quản trị cao nhất | Blocker | **Chủ dự án phê duyệt ngoại lệ chính thức.** Bù đắp bằng kiến trúc 100% DBMS-First, whitelist đóng băng 69 file 0 vi phạm raw SQL, cô lập mạng. | Kiểm soát mức Ứng dụng | **APPROVED EXCEPTION** |
| **RISK-06** | Tranh chấp dữ liệu đồng thời (Race Condition) khi đặt và giữ ghế | High | Đã kiểm chứng giao dịch SERIALIZABLE và READ COMMITTED kết hợp khóa dòng trong `sp_Booking_Create`. | Thấp | **MITIGATED / CLOSED** |
| **RISK-07** | Bất đồng bộ trạng thái Frontend khi người dùng thử lại thanh toán | Medium | Kiểm thử trình duyệt thực tế kịch bản E2E-06. Giao diện React hiển thị đúng nút "Thử lại", cập nhật mã giao dịch mới. | Rất thấp | **MITIGATED / CLOSED** |
| **RISK-08** | Báo cáo doanh thu và bảng điều khiển bị phá vỡ hợp đồng dữ liệu | High | Đồng bộ 8 Stored Procedures và 1 View. Hợp đồng trường `SoTien` được giữ nguyên vẹn ở tầng API. | Không có | **MITIGATED / CLOSED** |
| **RISK-09** | Quản lý rạp (Manager) truy cập chéo dữ liệu của cụm rạp khác | High | Stored Procedure kiểm tra ngữ cảnh phân công rạp trong bảng `QUANLYRAP`. Đã kiểm chứng E2E-09 chặn thành công. | Rất thấp | **MITIGATED / CLOSED** |
| **RISK-10** | Lệch pha cấu trúc (Schema Drift) giữa nâng cấp và cài đặt mới | High | Đồng bộ toàn bộ mã nguồn DDL trong `database/`. Kiểm chứng thành công việc bootstrap mới `CinemaBookingDB_Fresh3NF`. | Không có | **MITIGATED / CLOSED** |
| **RISK-11** | Thiếu kiểm chứng trải nghiệm người dùng trên trình duyệt thực tế | Blocker | **Thực thi Playwright E2E Suite với Microsoft Edge Headless.** 11/11 kịch bản đạt 100% PASS, đầy đủ ảnh chụp và log. | Không có | **MITIGATED / CLOSED** |
| **RISK-12** | Thay đổi nhầm dữ liệu trên Production trước khi có lệnh Cutover | Critical | Cơ chế **Dual Target Guard** kiểm tra tên Database và phiên bản. Production `CinemaBookingDB` được bảo vệ nguyên vẹn 100%. | Không có | **MITIGATED / CLOSED** |
| **RISK-13** | Nhầm lẫn tài liệu giữa bảng vật lý và View đối với `THANHTOAN` | High | **Thẩm định thực tế Database Object:** Xác minh `dbo.THANHTOAN` là `USER_TABLE`, không có View bọc, tính toán động trong Stored Procedures. | Không có | **RESOLVED / CLOSED** |
| **RISK-14** | Bản sao lưu cơ sở dữ liệu bị lỗi hoặc không thể phục hồi | High | Kiểm tra backup bằng lệnh bắt buộc `WITH CHECKSUM`. Kiểm tra tính toàn vẹn bằng `RESTORE VERIFYONLY` trước khi chạy migration. | Rất thấp | **MITIGATED / CLOSED** |

---

## 3. PHÂN TÍCH RỦI RO TRONG QUÁ TRÌNH CUTOVER (CUTOVER RISK ANALYSIS)

Khi tiến hành Cutover trong cửa sổ bảo trì (Maintenance Window), các rủi ro vận hành được kiểm soát theo ma trận sau:

```
+------------------------------------------------------------------------------------------+
|                              CUTOVER OPERATIONAL CONTROL                                 |
+--------------------------+---------------------+-----------------------------------------+
| Rủi ro vận hành          | Mức độ nghiêm trọng | Biện pháp kiểm soát thời gian thực      |
+--------------------------+---------------------+-----------------------------------------+
| Chạy nhầm Target DB      | Rất nghiêm trọng    | Target Guard dừng ngay lập tức nếu sai  |
| Thời gian chạy quá hạn   | Trung bình          | Giới hạn 45 phút, migration thực tế <15s|
| Mất kết nối mạng/máy chủ | Cao                 | Truy cập phiên làm việc console cục bộ  |
| Lỗi cú pháp SQL đột xuất | Cao                 | Dừng lại ở phase lỗi, chạy rollback ngay|
+--------------------------+---------------------+-----------------------------------------+
```

---

## 4. KẾT LUẬN VÀ KHUYẾN NGHỊ PHÁT HÀNH

- **Không còn bất kỳ rủi ro nào ở mức BLOCKER hoặc UNMITIGATED CRITICAL.**
- Rủi ro liên quan đến tài khoản quản trị `sa` (RISK-05) đã được Chủ dự án chính thức chấp thuận ngoại lệ, đồng thời được bảo vệ bằng kiến trúc phòng thủ 5 lớp DBMS-First.
- Toàn bộ 13 rủi ro kỹ thuật còn lại đều đã được khắc phục, kiểm chứng bằng thực nghiệm và đóng hoàn toàn.
- **Mức độ rủi ro phát hành tổng thể: THẤP / ĐỦ ĐIỀU KIỆN AN TOÀN ĐỂ TIẾN HÀNH CUTOVER.**

