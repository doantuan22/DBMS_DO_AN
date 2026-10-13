# GATE C FINAL RELEASE RISK REGISTER & CONTROL MATRIX
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** Gate C Pre-Approval & Release Freeze  
**Auditor / Roles:** Database Reliability Auditor & Production Release Engineer  
**Date:** October 13, 2026  
**Risk Classification Standard:** 6-Tier Audit Taxonomy  
**Overall Risk Posture:** **CONTROLLED & ACCEPTED — ZERO CRITICAL UNCONTROLLED BLOCKERS**

---

## 1. PHÂN LOẠI TRẠNG THÁI RỦI RO CHUẨN MỰC (6-TIER RISK TAXONOMY)

Nhóm kiểm toán áp dụng hệ thống phân loại 6 trạng thái nghiêm ngặt để phản ánh chính xác bản chất rủi ro, tuyệt đối không sử dụng các tuyên bố mang tính giả định như "Zero Risk" hay "Tuyệt đối an toàn":

```
+---------------------------------------------------------------------------------------------------------+
|                                        6-TIER RISK AUDIT TAXONOMY                                       |
+--------------------------+------------------------------------------------------------------------------+
| Trạng thái               | Định nghĩa chuẩn mực                                                         |
+--------------------------+------------------------------------------------------------------------------+
| **RESOLVED**             | Rủi ro hoặc sai lệch đã được giải quyết dứt điểm về mặt kỹ thuật và bằng chứng |
| **MITIGATED**            | Đã áp dụng các biện pháp giảm thiểu hiệu quả, rủi ro còn lại ở mức chấp nhận được|
| **OWNER-ACCEPTED**       | Rủi ro được Chủ dự án chính thức ký văn bản chấp thuận ngoại lệ có kiểm soát |
| **CONTROLLED PRE-CUTOVER**| Rủi ro được kiểm soát chặt chẽ bằng rào chắn an toàn trước thời điểm Cutover |
| **NOT VERIFIED**         | Điều kiện hoặc kịch bản chưa được thực nghiệm kiểm chứng trên môi trường thực tế|
| **OPEN**                 | Rủi ro đang tồn đọng, chưa có biện pháp giảm thiểu và là rào cản (Blocker)   |
+--------------------------+------------------------------------------------------------------------------+
```

---

## 2. MA TRẬN ĐÁNH GIÁ CHI TIẾT 14 RỦI RO PHÁT HÀNH (RISK-01 ĐẾN RISK-14)

```
+----------------------------------------------------------------------------------------------------------------------------------+
|                                          COMPREHENSIVE RELEASE RISK REGISTER (RISK-01 - RISK-14)                                 |
+---------+----------------------------------------------+---------------+----------------------------------+----------------------+
| Mã Risk | Mô tả rủi ro                                 | Mức ban đầu   | Biện pháp kiểm soát & Bằng chứng | Trạng thái Gate C    |
+---------+----------------------------------------------+---------------+----------------------------------+----------------------+
| RISK-01 | Mất mát dữ liệu trong quá trình đổi Schema   | High          | Kịch bản 4 giai đoạn, sao lưu tạm| CONTROLLED PRE-CUTOVER|
| RISK-02 | Sai lệch số tiền tính động SoTien            | Critical      | Đối soát 4 bản ghi Delta=0.00 đ  | MITIGATED            |
| RISK-03 | Suy giảm hiệu năng truy vấn báo cáo động     | Medium        | Đánh chỉ mục Index, thời gian <10ms| MITIGATED          |
| RISK-04 | Thất bại khi thực thi kịch bản Rollback      | High          | Diễn tập thành công trên Test R5-B| CONTROLLED PRE-CUTOVER|
| RISK-05 | Backend kết nối bằng tài khoản sa            | Blocker       | Chủ dự án phê duyệt ngoại lệ,    | OWNER-ACCEPTED       |
|         |                                              |               | bù đắp bằng DBMS-First 69 file   |                      |
| RISK-06 | Tranh chấp dữ liệu đặt ghế đồng thời         | High          | SERIALIZABLE, khóa dòng sp_Create| MITIGATED            |
| RISK-07 | Bất đồng bộ trạng thái Frontend khi Retry    | Medium        | Kiểm thử E2E-06 Playwright pass  | MITIGATED            |
| RISK-08 | Phá vỡ hợp đồng báo cáo doanh thu            | High          | Đồng bộ 8 SPs + 1 View, hợp đồng giữ| MITIGATED         |
| RISK-09 | Quản lý rạp truy cập chéo dữ liệu rạp khác   | High          | Kiểm tra QUANLYRAP, E2E-09 pass  | MITIGATED            |
| RISK-10 | Lệch pha cấu trúc Migration vs Bootstrap mới | High          | Kiểm tra Fresh 3NF bootstrap pass| RESOLVED             |
| RISK-11 | Thiếu kiểm chứng trên trình duyệt thực tế    | Blocker       | Playwright Edge Headless 11/11   | RESOLVED             |
| RISK-12 | Ghi nhầm dữ liệu vào Production trước hạn    | Critical      | Target Guard cứng, Production 100%| CONTROLLED PRE-CUTOVER|
| RISK-13 | Nhầm lẫn bảng vật lý và View THANHTOAN       | High          | sys.objects: USER_TABLE, 8 cột   | RESOLVED             |
| RISK-14 | Bản sao lưu cơ sở dữ liệu không phục hồi được| High          | RESTORE VERIFYONLY WITH CHECKSUM,| NOT VERIFIED         |
|         |                                              |               | chưa test restore trên clone Prod|                      |
+---------+----------------------------------------------+---------------+----------------------------------+----------------------+
```

---

## 3. PHÂN TÍCH RỦI RO ĐẶC BIỆT CẦN LƯU Ý

### 3.1. Rủi ro RISK-05: Tài khoản quản trị `sa` (OWNER-ACCEPTED)
- **Bản chất rủi ro:** Tài khoản `sa` có đặc quyền không giới hạn (`sysadmin`), vượt qua cơ chế bảo vệ `RESTRICTED_USER` và mở rộng phạm vi ảnh hưởng nếu có tấn công.
- **Quyết định:** Chủ dự án đã chính thức chấp thuận ngoại lệ, nghiêm cấm sửa đổi mật khẩu hoặc quyền `sa`.
- **Biện pháp bù đắp bắt buộc:**
  1. 100% mã nguồn Backend không có raw SQL (quét 69 tệp đạt chuẩn).
  2. Whitelist Stored Procedure đóng băng (`Object.freeze`).
  3. Cổng 1433 chỉ mở nội bộ máy chủ.
  4. Quy trình write-freeze cutover bắt buộc phải tắt tiến trình Node.js thay vì chỉ dựa vào lệnh database.

### 3.2. Rủi ro RISK-12: An toàn Schema Production trước Cutover (CONTROLLED PRE-CUTOVER)
- **Bản chất rủi ro:** Nguy cơ vô tình chạy migration hoặc script kiểm thử làm thay đổi cấu trúc bảng hoặc dữ liệu của `CinemaBookingDB` trước khi có lệnh phát hành chính thức.
- **Biện pháp kiểm soát:** Toàn bộ kịch bản trong `database/13_migrations/3nf_remediation/` đều có Target Guard cứng chỉ cho phép chạy trên `CinemaBookingDB_Test`.
- **Hiện trạng:** Cơ sở dữ liệu `CinemaBookingDB` được xác nhận **100% NGUYÊN VẸN Ở TRẠNG THÁI PRE-MIGRATION**.

### 3.3. Rủi ro RISK-14: Khả năng khôi phục bản sao lưu (NOT VERIFIED)
- **Bản chất rủi ro:** Nguy cơ tệp backup bị lỗi logic ngầm hoặc không thể khôi phục hoàn chỉnh khi xảy ra thảm họa thực tế.
- **Thực trạng kiểm toán:** Đội ngũ kỹ thuật đã xác nhận quy trình cú pháp `BACKUP WITH CHECKSUM` và `RESTORE VERIFYONLY`. Tuy nhiên, việc **thực hiện khôi phục thực tế (Full Database Restore) trên một bản clone Production độc lập chưa được thực hiện trong phase này**.
- **Kết luận:** Gắn cờ trạng thái **NOT VERIFIED**. Đây là một Residual Risk cần được DBA theo dõi sát sao tại Bước 9 của Cutover Runbook.

---

## 4. TỔNG KẾT VỊ THẾ RỦI RO TRƯỚC PHÊ DUYỆT GATE C

```
+-----------------------------------------------------------------------------------------+
|                              FINAL RISK STATUS DISTRIBUTION                             |
+--------------------------+-----------------------+--------------------------------------+
| Phân loại trạng thái     | Số lượng rủi ro       | Danh sách mã Risk                    |
+--------------------------+-----------------------+--------------------------------------+
| **RESOLVED**             | 3                     | RISK-10, RISK-11, RISK-13            |
| **MITIGATED**            | 6                     | RISK-02, RISK-03, RISK-06, RISK-07,  |
|                          |                       | RISK-08, RISK-09                     |
| **CONTROLLED PRE-CUTOVER**| 3                    | RISK-01, RISK-04, RISK-12            |
| **OWNER-ACCEPTED**       | 1                     | RISK-05 (Backend sa account)         |
| **NOT VERIFIED**         | 1                     | RISK-14 (Clone Restore Test)         |
| **OPEN (Blockers)**      | 0                     | Không có                             |
+--------------------------+-----------------------+--------------------------------------+
| **TỔNG CỘNG**            | 14 RỦI RO ĐÃ ĐÁNH GIÁ | 0 CRITICAL BLOCKERS TỒN ĐỌNG         |
+--------------------------+-----------------------+--------------------------------------+
```

Hệ thống đã đạt mức độ an toàn cao nhất có thể trong khuôn khổ phê duyệt hiện tại. Toàn bộ rủi ro kỹ thuật đã được đóng, giảm thiểu hoặc kiểm soát có kế hoạch.

