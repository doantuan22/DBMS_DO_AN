# GATE C OWNER APPROVAL CHECKLIST & DECISION DOSSIER
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** Gate C Pre-Approval & Release Freeze  
**Auditor / Roles:** Principal SQL Server DBA, Production Release Engineer & Security Auditor  
**Date:** October 13, 2026  
**Dossier Reference:** `GATE-C-OWNER-SIGN-OFF-DOSSIER`  
**Current Gate C Status:** **NOT APPROVED (PENDING OWNER DECISION)**

---

## 1. BẢNG KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT (PRE-APPROVAL CHECKLIST)

Chủ dự án (Project Owner) vui lòng rà soát 10 tiêu chí kỹ thuật cốt lõi trước khi đưa ra quyết định phê duyệt:

```
+---------------------------------------------------------------------------------------------------------+
|                                    GATE C PRE-APPROVAL 10-POINT CHECKLIST                               |
+----+---------------------------------------------------------------+------------------+-----------------+
| STT| Tiêu chí kiểm tra                                             | Trạng thái kiểm toán| Bằng chứng tài liệu|
+----+---------------------------------------------------------------+------------------+-----------------+
| 1  | Tuân thủ tuyệt đối Business Rules D-01 đến D-07               | VERIFIED PASS    | BUSINESS_RULES  |
| 2  | Bảo toàn đúng 27 bảng nghiệp vụ theo chuẩn Strict 3NF         | VERIFIED PASS    | RELATIONAL_SCHEMA|
| 3  | Đối soát tài chính từng dòng 4 bản ghi lịch sử (Delta = 0.00 đ)| VERIFIED PASS    | FIN_CERTIFICATION|
| 4  | Kiểm thử trình duyệt thực tế Playwright (Edge Headless) 11/11  | VERIFIED PASS    | BROWSER_E2E     |
| 5  | Kiến trúc 100% DBMS-First: 69 tệp backend không có Raw SQL    | VERIFIED PASS    | AUDIT_NO_SQL    |
| 6  | Chấp thuận ngoại lệ bảo mật Backend sử dụng tài khoản sa      | OWNER-ACCEPTED   | SECURITY_AUDIT  |
| 7  | Cơ chế Target Guard ngăn chặn thực thi nhầm trên Production    | VERIFIED PASS    | SCRIPT_AUDIT    |
| 8  | Runbook Cutover 45 phút có quy trình tắt app đóng băng write   | VERIFIED PASS    | CUTOVER_RUNBOOK |
| 9  | Khung phục hồi 4 cấp (Immediate, Delayed, PITR, Forward-Fix)  | VERIFIED PASS    | RECOVERY_PLAN   |
| 10 | Mã nguồn đóng băng tại Git commit db993a8d3aa6c70075bd0f702ff5| VERIFIED PASS    | RELEASE_MANIFEST|
+----+---------------------------------------------------------------+------------------+-----------------+
```

---

## 2. CÁC RỦI RO ĐƯỢC CHỦ DỰ ÁN CHẤP THUẬN (OWNER-ACCEPTED RISKS)

Khi ký duyệt Gate C, Chủ dự án xác nhận chấp thuận các rủi ro vận hành sau:
1. **Ngoại lệ tài khoản `sa` (RISK-05):** Chấp thuận cho Backend tiếp tục kết nối bằng tài khoản `sa` trên Production trong đợt phát hành này, chấp nhận rủi ro dư thừa và dựa trên các biện pháp kiểm soát bù đắp ở tầng ứng dụng (DBMS-First, whitelist Stored Procedure đóng băng, cô lập cổng mạng 1433).
2. **Quy tắc giữ chỗ đơn vé 5 phút:** Xác nhận thời gian giữ chỗ đơn hàng khi đặt vé là 5 phút (theo hàm `dbo.fn_ThoiGianGiuChoPhut()`), ghi nhận sai sót 15 phút trong báo cáo R8.1 là lỗi soạn thảo văn bản thuần túy.
3. **Chính sách bồi thường điểm thưởng không hoàn tiền mặt:** Xác nhận đơn hàng `#4` bị hủy được bồi thường bằng điểm thưởng thành viên (`BOITHUONG_HUYSUAT`), không hoàn tiền mặt qua cổng thanh toán. Doanh thu tiền mặt thực thu giữ nguyên 446,500.00 VNĐ.

---

## 3. ĐIỀU KIỆN CÒN THIẾU CẦN LƯU Ý (UNVERIFIED REQUIREMENT)

- **Thử nghiệm khôi phục trên Clone Production (RISK-14):** Chưa thực hiện bài test restore toàn phần từ bản backup mới nhất trên một database clone độc lập của Production.
- **Biện pháp xử lý:** Lead DBA bắt buộc phải thực thi lệnh `RESTORE VERIFYONLY WITH CHECKSUM` ngay sau khi tạo bản backup tại Bước 9 của Cutover Runbook trước khi tiến hành chạy bất kỳ lệnh di trú nào.

---

## 4. KHUNG KÝ DUYỆT CHÍNH THỨC CỔNG PRODUCTION GATE C (FORMAL SIGN-OFF BLOCK)

```
========================================================================================
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                         Độc lập – Tự do – Hạnh phúc
                                   -------
                   BIÊN BẢN PHÊ DUYỆT TRIỂN KHAI PRODUCTION (GATE C)
                   Dự án: Hệ thống Đặt Vé Xem Phim (CinemaBookingDB)
                   Hạng mục: Nâng cấp Schema Strict 3NF (Option 1 - 27 Bảng)

Căn cứ kết quả kiểm định hồ sơ tiền phê duyệt Gate C:
- 10/10 tiêu chí kỹ thuật cốt lõi đã đạt chuẩn nghiệm thu.
- Toàn bộ sai khác về tài chính và thời gian giữ chỗ đã được hiệu chỉnh minh bạch.
- Cơ sở dữ liệu Production CinemaBookingDB hiện tại HOÀN TOÀN NGUYÊN VẸN 100%.

CHỦ DỰ ÁN (PROJECT OWNER) QUYẾT ĐỊNH:

[   ] PHÊ DUYỆT CHÍNH THỨC (GATE C APPROVED - CHO PHÉP CUTOVER TRONG CỬA SỔ BẢO TRÌ)
[   ] TỪ CHỐI / YÊU CẦU THỬ NGHIỆM THÊM TRÊN CLONE TRƯỚC KHI CUTOVER

Khung giờ bảo trì lựa chọn (Thời lượng: 45 phút, khuyến nghị 02:00 – 02:45 AM):
- Ngày triển khai: .....................................................................
- Thời gian:      Từ ........:........ Đến ........:........
- Token phê duyệt: GATE-C-APPROVED-20261013-OPTION1-STRICT3NF

                                          Hà Nội, ngày ...... tháng ...... năm 2026
ĐẠI DIỆN ĐỘI NGŨ KIỂM ĐỊNH & DBA                     CHỦ DỰ ÁN CINEMABOOKINGDB
        (Đã ký xác nhận)                                 (Ký và ghi rõ họ tên)


  Principal Migration Engineer                      ....................................
========================================================================================
```

