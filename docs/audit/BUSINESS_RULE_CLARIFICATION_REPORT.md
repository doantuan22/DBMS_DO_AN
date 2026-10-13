# BUSINESS RULE CLARIFICATION REPORT — CinemaBookingDB

**Ngày:** 13/10/2026. **Database:** CinemaBookingDB. **Chế độ:** READ-ONLY BUSINESS ANALYSIS.

**Bằng chứng runtime mới:** SELECT-only lúc `2026-10-13T04:32:12.324Z`; 27 bảng, 174 cột, 31 FK, 169 module. Không có lệch metadata so với audit gốc; định nghĩa module khớp source.

**Bảo toàn:** 635 file SQL/code/tài liệu liên quan được chụp hash trước phân tích; 303 SQL file không thay đổi từ audit trước. Audit gốc giữ nguyên, SHA-256 `ac21d6d95ca747eaf70e1abbfb28e4bd50162168a6b57fa232a3e0dd24ddfa7f`.

Không chạy build/run-all, seed, migration, SP ghi hoặc regression/concurrency test có DML, kể cả rollback. Các test được đọc như đặc tả implementation, không được xem là approval của owner.

## 1. Executive Summary

Phân tích năm bảng THANHTOAN, KHIEUNAI, BANGGIA, PHANCONG_RAP, RAPCHIEUPHIM và toàn bộ writer/caller quan trọng của chúng. Mục tiêu là chốt ý nghĩa dữ liệu trước khi nghĩ đến sửa chuẩn hóa; không chọn nghiệp vụ mới để làm mất FD.

| Phân loại rule ledger | Số lượng |
|---|---:|
| SOURCE_CONFIRMED | 25 |
| BUSINESS_APPROVED | 2 |
| INFERRED | 2 |
| CONFLICT | 1 |
| UNDEFINED | 5 |
| Quyết định PENDING_DECISION | 7 |

**Kết quả:** các điều kiện hoạt động trong source đã được truy vết; ý định chính thức về amount/payment snapshot và bốn khu vực UNKNOWN chưa có owner decision truy xuất được. N-001 vẫn có chứng minh FAIL theo contract writer hiện hành. Với tiêu chuẩn mới yêu cầu FD nghiệp vụ được phê duyệt, kết luận của THANHTOAN là UNKNOWN/PENDING_DECISION. **Verdict về mô hình nghiệp vụ đã được phê duyệt: INCONCLUSIVE. Verdict source-only của audit gốc: NOT_3NF, không bị xóa/ghi đè.**

Một mâu thuẫn comment/chữ ký SP được phát hiện; không phát hiện source/runtime schema drift hoặc mâu thuẫn amount hiện tại. Không có quyết định nào của AI được ghi là approval.

### Phạm vi, phiên bản và căn cứ approval

Source SQL dùng các file canonical từ build-objects.sql và module đã đối chiếu runtime. Backend typed procedure client/whitelist, controllers/services/validators và frontend form/payment/complaint flow được đọc để xác nhận contract. Seed, fixture, migration và SQL deploy được khảo sát tách biệt; chúng có DML đặc quyền nhưng không là tính năng ghi của ứng dụng.

Các thư mục thực tế: [database/README.md:34](../../database/README.md#L34) ghi `05_functions`, `06_views`, `07_triggers`, `08_procedures`. Báo cáo gốc: [docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md:5](../../docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md#L5). BRC không dùng đường dẫn gợi ý sai hoặc thống kê roadmap cũ.

Nguồn đang có trong docs/ khi bắt đầu BRC chỉ gồm audit gốc. README dẫn docs/FINAL_SYSTEM_AUDIT.md và các tài liệu approval/deployment/seed không có trong checkout. README tự ghi “Approved edit rules”; phải giữ những giới hạn đang mô tả, nhưng không tự bổ sung ý định nghiệp vụ hoặc giả định đã truy xuất được quyết định owner cho FD/khóa của cả năm bảng.

SOURCE_CONFIRMED = constraint/hành vi chứng minh từ source; BUSINESS_APPROVED = yêu cầu/decision rõ của chủ dự án; INFERRED = ý định suy từ implementation; CONFLICT = hai nguồn nói khác nhau; UNDEFINED = thiếu đặc tả. SOURCE_CONFIRMED không tự nâng thành BUSINESS_APPROVED. Hai APP rule được BUSINESS_APPROVED từ chính yêu cầu BRC hiện tại, không từ suy đoán lịch sử repo.

## 2. Current Business Rules

### APP-01 — Toàn hệ thống

- **Rule ID:** APP-01
- **Table:** Toàn hệ thống
- **Rule Description:** Dữ liệu nghiệp vụ do SQL Server quản lý; backend gọi typed stored procedures, không đưa SQL nghiệp vụ hoặc ORM vào ứng dụng.
- **Source Evidence / Code Location:** [backend/src/db/procedureClient.js:1](../../backend/src/db/procedureClient.js#L1); [database/README.md:3](../../database/README.md#L3)
- **Business Intent:** Ràng buộc trực tiếp trong yêu cầu BRC hiện tại của chủ dự án, mục 2; áp dụng cho phạm vi công việc này. Không dùng ràng buộc kiến trúc để xác nhận một FD cụ thể.
- **Status:** BUSINESS_APPROVED

### APP-02 — Năm bảng

- **Rule ID:** APP-02
- **Table:** Năm bảng
- **Rule Description:** Bảo toàn lịch sử giá vé/đặt vé/thanh toán; không đổi baseline Use Case/RBAC, schema hay application trong đợt BRC.
- **Source Evidence / Code Location:** [database/README.md:80](../../database/README.md#L80)
- **Business Intent:** Chủ dự án nêu trực tiếp trong yêu cầu BRC mục 2/11. Đây là phê duyệt về giới hạn tác vụ và bảo toàn dữ liệu, không là quyết định bỏ/giữ một cột cụ thể.
- **Status:** BUSINESS_APPROVED

### TT-01 — THANHTOAN

- **Rule ID:** TT-01
- **Table:** THANHTOAN
- **Rule Description:** Một đơn có nhiều attempt; mỗi attempt có ThanhToanID riêng, MaGiaoDich unique chỉ khi khác NULL.
- **Source Evidence / Code Location:** [database/02_tables/thanhtoan.sql:2](../../database/02_tables/thanhtoan.sql#L2); [database/04_indexes/thanhtoan.sql:7](../../database/04_indexes/thanhtoan.sql#L7); [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:138](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L138)
- **Business Intent:** Source chứng minh mô hình retry; chưa tìm thấy quyết định riêng của chủ dự án về định nghĩa transaction attempt.
- **Status:** SOURCE_CONFIRMED

### TT-02 — THANHTOAN / DONDATVE

- **Rule ID:** TT-02
- **Table:** THANHTOAN / DONDATVE
- **Rule Description:** Mỗi attempt lấy toàn bộ TongTienVe + TongTienDoAn − TienGiamGia; API không nhận amount từ client.
- **Source Evidence / Code Location:** [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:96](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96); [backend/src/validators/orderValidator.js:43](../../backend/src/validators/orderValidator.js#L43); [backend/tests/orderService.test.js:63](../../backend/tests/orderService.test.js#L63)
- **Business Intent:** Full payment là hành vi hiện tại; không biến việc không có input amount thành phê duyệt trả toàn bộ vĩnh viễn.
- **Status:** SOURCE_CONFIRMED

### TT-03 — DONDATVE / THANHTOAN

- **Rule ID:** TT-03
- **Table:** DONDATVE / THANHTOAN
- **Rule Description:** Writer sửa ghế chỉ sửa đơn pending/unexpired không promotion/đồ ăn/vé dùng; có bất kỳ attempt, kể cả thất bại, đều cấm sửa. Đây là writer duy nhất sửa tổng đơn cũ.
- **Source Evidence / Code Location:** [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:98](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L98); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:279](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L279); [database/11_tests/staff_booking/regression.sql:513](../../database/11_tests/staff_booking/regression.sql#L513); [database/README.md:80](../../database/README.md#L80)
- **Business Intent:** README gọi các edit rules là Approved và test khẳng định policy, nên giữ nguyên. Hồ sơ owner approval được README dẫn chiếu không còn trong checkout; không tự suy ra quyết định chính thức về toàn bộ FD của payment.
- **Status:** SOURCE_CONFIRMED

### TT-04 — THANHTOAN

- **Rule ID:** TT-04
- **Table:** THANHTOAN
- **Rule Description:** Sau thất bại không sửa attempt cuối cùng; có thể tạo attempt mới khi đơn còn pending và hạn giữ còn hiệu lực. Không có đường ghi ứng dụng được tìm thấy cho hai amount khác nhau cùng đơn.
- **Source Evidence / Code Location:** [database/08_procedures/payment/sp_Payment_UpdateResult.sql:131](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L131); [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:122](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L122); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:98](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L98)
- **Business Intent:** Retry giữ nghĩa vụ thanh toán hiện tại; muốn sửa lại sau thất bại là thay nghiệp vụ, chưa được phê duyệt.
- **Status:** SOURCE_CONFIRMED

### TT-05 — THANHTOAN

- **Rule ID:** TT-05
- **Table:** THANHTOAN
- **Rule Description:** Thành công yêu cầu order pending; đổi trạng thái đơn sang Đã thanh toán, bỏ hold, cộng điểm. FE hiện tạo attempt rồi submit kết quả thành công mô phỏng.
- **Source Evidence / Code Location:** [database/08_procedures/payment/sp_Payment_UpdateResult.sql:154](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L154); [database/08_procedures/payment/sp_Payment_UpdateResult.sql:174](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L174); [frontend/src/pages/PaymentPage.jsx:126](../../frontend/src/pages/PaymentPage.jsx#L126)
- **Business Intent:** Không phải tích hợp cổng thanh toán thật; không suy thêm phí gateway, số tiền thực nhận/net settlement.
- **Status:** SOURCE_CONFIRMED

### TT-06 — THANHTOAN / DONDATVE

- **Rule ID:** TT-06
- **Table:** THANHTOAN / DONDATVE
- **Rule Description:** Không có writer hoàn tiền tiền mặt hiện hành. Hủy suất giữ tổng đơn/SoTien, hủy vé/đơn và ghi điểm bồi thường; enum refund không chứng minh tính năng refund.
- **Source Evidence / Code Location:** [database/08_procedures/system/sp_Showtime_CancelCascade.sql:185](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql#L185); [database/08_procedures/system/sp_Showtime_CancelCascade.sql:313](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql#L313); [database/08_procedures/admin/sp_Admin_Report_Revenue.sql:43](../../database/08_procedures/admin/sp_Admin_Report_Revenue.sql#L43)
- **Business Intent:** Giữ luồng điểm hiện tại; nếu muốn refund tiền thật phải có yêu cầu và phạm vi riêng.
- **Status:** SOURCE_CONFIRMED

### TT-07 — THANHTOAN

- **Rule ID:** TT-07
- **Table:** THANHTOAN
- **Rule Description:** SoTien được lưu trên từng attempt như dấu vết lúc tạo, có thể nhằm phục vụ audit lịch sử độc lập với việc tra đơn.
- **Source Evidence / Code Location:** [database/02_tables/thanhtoan.sql:2](../../database/02_tables/thanhtoan.sql#L2); [backend/src/services/orderService.js:67](../../backend/src/services/orderService.js#L67)
- **Business Intent:** Writer chứng minh giá trị được chụp; nhu cầu giữ bản sao độc lập và retention policy chưa có quyết định owner.
- **Status:** INFERRED

### TT-08 — THANHTOAN

- **Rule ID:** TT-08
- **Table:** THANHTOAN
- **Rule Description:** DonDatVeID → SoTien có bắt buộc đúng trong mọi trạng thái hợp lệ của nghiệp vụ chính thức, và có chấp nhận ngoại lệ 3NF không?
- **Source Evidence / Code Location:** [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:96](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96); [docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md:471](../../docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md#L471)
- **Business Intent:** PENDING_DECISION D-01/D-02. Source-only FD là xác nhận được; approval nghiệp vụ tổng thể chưa truy xuất được.
- **Status:** UNDEFINED

### KN-01 — KHIEUNAI

- **Rule ID:** KN-01
- **Table:** KHIEUNAI
- **Rule Description:** Cho phép khiếu nại chung không gắn đơn; DonDatVeID nullable, API orderId tùy chọn, UI có Không liên kết đơn.
- **Source Evidence / Code Location:** [database/02_tables/khieunai.sql:2](../../database/02_tables/khieunai.sql#L2); [backend/src/validators/feedbackValidator.js:42](../../backend/src/validators/feedbackValidator.js#L42); [frontend/src/pages/Complaints.jsx:104](../../frontend/src/pages/Complaints.jsx#L104)
- **Business Intent:** Phải giữ cách xác định người gửi khi không có đơn; việc bỏ NguoiDungID sẽ mất dữ liệu.
- **Status:** SOURCE_CONFIRMED

### KN-02 — KHIEUNAI / DONDATVE

- **Rule ID:** KN-02
- **Table:** KHIEUNAI / DONDATVE
- **Rule Description:** Nếu gắn đơn, sp_Complaint_Create bắt buộc đơn thuộc NguoiDungID đang gửi; trả cùng lỗi cho đơn không tồn tại/đơn người khác.
- **Source Evidence / Code Location:** [database/08_procedures/customer/sp_Complaint_Create.sql:53](../../database/08_procedures/customer/sp_Complaint_Create.sql#L53)
- **Business Intent:** Owner-only là behavior hiện tại và bảo vệ truy cập. Tính bắt buộc vĩnh viễn của equality reporter=owner cần chốt D-03.
- **Status:** SOURCE_CONFIRMED

### KN-03 — KHIEUNAI

- **Rule ID:** KN-03
- **Table:** KHIEUNAI
- **Rule Description:** NguoiDungID được lấy từ người dùng đã xác thực. Client không được gửi userId khác; endpoint/SP chỉ cho Customer.
- **Source Evidence / Code Location:** [backend/src/controllers/feedbackController.js:42](../../backend/src/controllers/feedbackController.js#L42); [backend/src/routes/complaintRoutes.js:8](../../backend/src/routes/complaintRoutes.js#L8); [database/08_procedures/customer/sp_Complaint_Create.sql:39](../../database/08_procedures/customer/sp_Complaint_Create.sql#L39)
- **Business Intent:** Trong API hiện tại đây là người gửi, không phải ID nhân viên xử lý. Với khiếu nại gắn đơn người đó đồng thời là owner.
- **Status:** SOURCE_CONFIRMED

### KN-04 — KHIEUNAI / XULY_KHIEUNAI

- **Rule ID:** KN-04
- **Table:** KHIEUNAI / XULY_KHIEUNAI
- **Rule Description:** Không có đường tạo khiếu nại thay khách của CSKH/Admin trong baseline; staff chỉ tra cứu/thêm processing. Các SP processing không sửa NguoiDungID/DonDatVeID.
- **Source Evidence / Code Location:** [database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql:60](../../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql#L60); [database/08_procedures/support/sp_Support_Complaint_UpdateStatus.sql:55](../../database/08_procedures/support/sp_Support_Complaint_UpdateStatus.sql#L55); [backend/src/routes/supportRoutes.js:1](../../backend/src/routes/supportRoutes.js#L1)
- **Business Intent:** Không đề xuất proxy creation vì sẽ cần mở rộng Use Case/RBAC ngoài ràng buộc tác vụ.
- **Status:** SOURCE_CONFIRMED

### KN-05 — KHIEUNAI / XULY_KHIEUNAI

- **Rule ID:** KN-05
- **Table:** KHIEUNAI / XULY_KHIEUNAI
- **Rule Description:** Current state theo event có XuLyID lớn nhất; trigger AFTER INSERT cập nhật trạng thái cha. Giữ reporter/order reference hiện hữu.
- **Source Evidence / Code Location:** [database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql:45](../../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql#L45)
- **Business Intent:** Đây là invariant xuyên bảng/current-state cache; không phải KhieuNaiID→mọi TrangThaiSauXuLy của lịch sử.
- **Status:** SOURCE_CONFIRMED

### KN-06 — KHIEUNAI

- **Rule ID:** KN-06
- **Table:** KHIEUNAI
- **Rule Description:** Định nghĩa chính thức reporter và quan hệ với owner của đơn, cùng mô hình chuẩn hóa optional reference, chưa được owner xác nhận riêng.
- **Source Evidence / Code Location:** [database/02_tables/khieunai.sql:2](../../database/02_tables/khieunai.sql#L2); [database/08_procedures/customer/sp_Complaint_Create.sql:45](../../database/08_procedures/customer/sp_Complaint_Create.sql#L45)
- **Business Intent:** D-03; không dùng NULL như một mã đơn chung và không tự đổi nghiệp vụ để giải quyết redundancy.
- **Status:** UNDEFINED

### BG-01 — BANGGIA

- **Rule ID:** BG-01
- **Table:** BANGGIA
- **Rule Description:** Rule phụ thu theo rạp, loại ghế, loại ngày, định dạng và khoảng ngày; NgayKetThuc tùy chọn, PhuThu không âm.
- **Source Evidence / Code Location:** [database/02_tables/banggia.sql:2](../../database/02_tables/banggia.sql#L2); [database/03_constraints/003_check_constraints.sql:54](../../database/03_constraints/003_check_constraints.sql#L54)
- **Business Intent:** Các giá trị và khoảng được kiểm soát; chưa chứng minh đây là version identifier nghiệp vụ.
- **Status:** SOURCE_CONFIRMED

### BG-02 — BANGGIA

- **Rule ID:** BG-02
- **Table:** BANGGIA
- **Rule Description:** Một rạp có nhiều rule; Admin/Manager tạo rule với TrangThai=Áp dụng. Manager phải qua scope rạp.
- **Source Evidence / Code Location:** [database/08_procedures/admin/usp_Admin_Pricing_Create.sql:60](../../database/08_procedures/admin/usp_Admin_Pricing_Create.sql#L60); [database/08_procedures/manager/sp_Manager_Pricing_Create.sql:47](../../database/08_procedures/manager/sp_Manager_Pricing_Create.sql#L47)
- **Business Intent:** GiaID là định danh thực thi, không mặc định tổ hợp điều kiện là khóa toàn bảng.
- **Status:** SOURCE_CONFIRMED

### BG-03 — BANGGIA

- **Rule ID:** BG-03
- **Table:** BANGGIA
- **Rule Description:** Cấm overlap có biên ngày bao gồm khi cả hai dòng Áp dụng và cùng chính xác bộ chiều. Tạm dừng/Hết hạn không tham gia cấm overlap; trigger khóa rạp và xét multirow.
- **Source Evidence / Code Location:** [database/07_triggers/TRG_BangGia_KiemTraChongLan.sql:15](../../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql#L15); [database/07_triggers/TRG_BangGia_KiemTraChongLan.sql:66](../../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql#L66)
- **Business Intent:** Temporal exclusion có điều kiện, không là uniqueness của toàn lịch sử.
- **Status:** SOURCE_CONFIRMED

### BG-04 — BANGGIA / SUATCHIEU

- **Rule ID:** BG-04
- **Table:** BANGGIA / SUATCHIEU
- **Rule Description:** Tất cả và rule cụ thể có thể cùng khớp; fn_TinhGiaVe SUM toàn bộ phụ thu khớp, không chọn rule ưu tiên.
- **Source Evidence / Code Location:** [database/05_functions/fn_TinhGiaVe.sql:56](../../database/05_functions/fn_TinhGiaVe.sql#L56); [database/11_tests/pricing/contract.sql:185](../../database/11_tests/pricing/contract.sql#L185)
- **Business Intent:** D-05 xác nhận đây là mô hình cộng phụ thu mong muốn, không tự đổi sang priority pricing.
- **Status:** SOURCE_CONFIRMED

### BG-05 — BANGGIA

- **Rule ID:** BG-05
- **Table:** BANGGIA
- **Rule Description:** Cập nhật trên cùng GiaID có thể sửa PhuThu, trạng thái và toàn bộ nhóm điều kiện/ngày; RapID giữ nguyên. Không tự sinh phiên bản mới hay ghi history của rule.
- **Source Evidence / Code Location:** [database/08_procedures/admin/usp_Admin_Pricing_Update.sql:85](../../database/08_procedures/admin/usp_Admin_Pricing_Update.sql#L85); [database/08_procedures/manager/sp_Manager_Pricing_Update.sql:87](../../database/08_procedures/manager/sp_Manager_Pricing_Update.sql#L87); [backend/src/validators/adminValidator.js:261](../../backend/src/validators/adminValidator.js#L261)
- **Business Intent:** Giá giao dịch cũ giữ ở vé, không phụ thuộc còn lại rule cũ. Snapshot giá không tái dựng toàn bộ cấu hình pricing lịch sử.
- **Status:** SOURCE_CONFIRMED

### BG-06 — BANGGIA

- **Rule ID:** BG-06
- **Table:** BANGGIA
- **Rule Description:** Tổ hợp (RapID,LoaiGhe,LoaiNgay,DinhDang,NgayBatDau) không được source bảo đảm unique toàn bảng; thêm TrangThai vào cũng không có UQ toàn phần.
- **Source Evidence / Code Location:** [database/04_indexes/banggia.sql:3](../../database/04_indexes/banggia.sql#L3); [database/07_triggers/TRG_BangGia_KiemTraChongLan.sql:67](../../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql#L67); [database/08_procedures/admin/usp_Admin_Pricing_Update.sql:88](../../database/08_procedures/admin/usp_Admin_Pricing_Update.sql#L88)
- **Business Intent:** Có thể có các dòng không active chung điều kiện/ngày. Không gọi rule key này là CK hay cho nó FD tới PhuThu trên toàn bảng.
- **Status:** SOURCE_CONFIRMED

### BG-07 — BANGGIA

- **Rule ID:** BG-07
- **Table:** BANGGIA
- **Rule Description:** Một dòng là rule cấu hình có thể sửa hay phiên bản giá lịch sử bất biến? Có cần khóa phiên bản duy nhất khi inactive?
- **Source Evidence / Code Location:** [database/08_procedures/admin/usp_Admin_Pricing_Update.sql:85](../../database/08_procedures/admin/usp_Admin_Pricing_Update.sql#L85); [docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md:539](../../docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md#L539)
- **Business Intent:** D-04. Việc chưa có business key thay thế không tự là lỗi 2NF/3NF; cần biết các FD nghiệp vụ còn thiếu.
- **Status:** UNDEFINED

### PC-01 — PHANCONG_RAP

- **Rule ID:** PC-01
- **Table:** PHANCONG_RAP
- **Rule Description:** Source cho phép nhiều manager trên một rạp và một manager trên nhiều rạp; không có UQ trên NguoiDungID hoặc RapID.
- **Source Evidence / Code Location:** [database/02_tables/phancong_rap.sql:2](../../database/02_tables/phancong_rap.sql#L2); [database/08_procedures/admin/sp_Admin_Assignment_Create.sql:100](../../database/08_procedures/admin/sp_Admin_Assignment_Create.sql#L100)
- **Business Intent:** Cardinality implementation là nhiều–nhiều theo các khoảng, không đặt rule một manager một rạp.
- **Status:** SOURCE_CONFIRMED

### PC-02 — PHANCONG_RAP

- **Rule ID:** PC-02
- **Table:** PHANCONG_RAP
- **Rule Description:** Create/update khóa tập phân công và cấm hai dòng tương đương toàn bộ nội dung: người, rạp, ngày bắt đầu, ngày kết thúc (NULL so riêng), trạng thái.
- **Source Evidence / Code Location:** [database/08_procedures/admin/sp_Admin_Assignment_Create.sql:77](../../database/08_procedures/admin/sp_Admin_Assignment_Create.sql#L77); [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:108](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L108)
- **Business Intent:** Đây là duplicate avoidance của writer; chưa là UNIQUE declarative hay proof CK tối thiểu toàn quan hệ có nullable end.
- **Status:** SOURCE_CONFIRMED

### PC-03 — PHANCONG_RAP

- **Rule ID:** PC-03
- **Table:** PHANCONG_RAP
- **Rule Description:** Không có overlap exclusion. Các dòng cùng người/rạp/ngày bắt đầu nhưng khác end hoặc trạng thái có thể qua các kiểm tra hiện hành.
- **Source Evidence / Code Location:** [database/08_procedures/admin/sp_Admin_Assignment_Create.sql:70](../../database/08_procedures/admin/sp_Admin_Assignment_Create.sql#L70); [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:100](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L100)
- **Business Intent:** Behavior rõ; ý định nghiệp vụ có chấp nhận overlap được chốt ở D-06, không suy thành cấm overlap.
- **Status:** SOURCE_CONFIRMED

### PC-04 — PHANCONG_RAP / NGUOIDUNG

- **Rule ID:** PC-04
- **Table:** PHANCONG_RAP / NGUOIDUNG
- **Rule Description:** Scope cần role QUAN_LY_RAP, user Hoạt động, assignment Hiệu lực và hôm nay trong khoảng bao gồm hai đầu. Ngày theo fn_HomNay.
- **Source Evidence / Code Location:** [database/05_functions/fn_KiemTraQuanLyRapScope.sql:21](../../database/05_functions/fn_KiemTraQuanLyRapScope.sql#L21)
- **Business Intent:** NguoiDungID/RapID riêng không quyết định mọi ngày/trạng thái. Scope function không kiểm tra TrangThai của rạp; eligibility booking có kiểm tra riêng, không đồng nhất scope với bookability.
- **Status:** SOURCE_CONFIRMED

### PC-05 — PHANCONG_RAP

- **Rule ID:** PC-05
- **Table:** PHANCONG_RAP
- **Rule Description:** Trạng thái được nhập/sửa độc lập; hết hạn ngày không tự UPDATE TrangThai. Có thể sửa end/status để kích hoạt lại, nhưng scope chỉ đúng nếu ngày phù hợp.
- **Source Evidence / Code Location:** [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:106](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L106); [backend/src/validators/adminValidator.js:184](../../backend/src/validators/adminValidator.js#L184); [database/05_functions/fn_KiemTraQuanLyRapScope.sql:22](../../database/05_functions/fn_KiemTraQuanLyRapScope.sql#L22)
- **Business Intent:** Cặp ngày không xác định TrangThai; authorization là conjunction flag+dates, không phải chỉ enum.
- **Status:** SOURCE_CONFIRMED

### PC-06 — PHANCONG_RAP

- **Rule ID:** PC-06
- **Table:** PHANCONG_RAP
- **Rule Description:** Định danh nghiệp vụ của một kỳ phân công, chính sách overlap và reactivation cần được xác nhận chính thức.
- **Source Evidence / Code Location:** [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:110](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L110); [docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md:555](../../docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md#L555)
- **Business Intent:** D-06. Recommend một dòng là khoảng phân công có PhanCongID ổn định, không là event log bất biến.
- **Status:** UNDEFINED

### RP-01 — RAPCHIEUPHIM

- **Rule ID:** RP-01
- **Table:** RAPCHIEUPHIM
- **Rule Description:** DiaChi và ThanhPho được nhập/lưu độc lập trong FE, validator và SP; không có parser hay lookup địa chỉ chuẩn hóa.
- **Source Evidence / Code Location:** [frontend/src/utils/adminForms.js:35](../../frontend/src/utils/adminForms.js#L35); [frontend/src/utils/adminForms.js:36](../../frontend/src/utils/adminForms.js#L36); [backend/src/validators/adminValidator.js:212](../../backend/src/validators/adminValidator.js#L212); [database/08_procedures/admin/sp_Admin_Cinema_Create.sql:11](../../database/08_procedures/admin/sp_Admin_Cinema_Create.sql#L11)
- **Business Intent:** UI không định nghĩa địa chỉ đầy đủ hay thành phần; không suy FD từ văn bản hiển thị.
- **Status:** SOURCE_CONFIRMED

### RP-02 — RAPCHIEUPHIM

- **Rule ID:** RP-02
- **Table:** RAPCHIEUPHIM
- **Rule Description:** TenRap không UNIQUE toàn hệ thống; có thể nhập cùng chuỗi DiaChi/ten cho các rạp khác. Source chỉ bảo đảm CK RapID.
- **Source Evidence / Code Location:** [database/02_tables/rapchieuphim.sql:2](../../database/02_tables/rapchieuphim.sql#L2); [database/08_procedures/admin/sp_Admin_Cinema_Create.sql:46](../../database/08_procedures/admin/sp_Admin_Cinema_Create.sql#L46)
- **Business Intent:** Khả năng qua implementation không đồng nghĩa owner chấp nhận danh mục trùng tên/địa chỉ về nghiệp vụ.
- **Status:** SOURCE_CONFIRMED

### RP-03 — RAPCHIEUPHIM

- **Rule ID:** RP-03
- **Table:** RAPCHIEUPHIM
- **Rule Description:** Rạp có thể sửa địa chỉ/thành phố trên cùng RapID. Delete chỉ khi không có dữ liệu phụ thuộc; nếu có thì dùng trạng thái.
- **Source Evidence / Code Location:** [database/08_procedures/admin/sp_Admin_Cinema_Update.sql:50](../../database/08_procedures/admin/sp_Admin_Cinema_Update.sql#L50); [database/08_procedures/admin/sp_Admin_Cinema_Delete.sql:79](../../database/08_procedures/admin/sp_Admin_Cinema_Delete.sql#L79)
- **Business Intent:** RapID định danh cơ sở quản lý hiện tại. Source không tạo lịch sử địa chỉ; các view tra cứu địa chỉ hiện tại, không snapshot nơi giao dịch cũ.
- **Status:** SOURCE_CONFIRMED

### RP-04 — RAPCHIEUPHIM

- **Rule ID:** RP-04
- **Table:** RAPCHIEUPHIM
- **Rule Description:** Seed địa chỉ mô phỏng không chứa thành phố gợi ý DiaChi chỉ là nhãn/thành phần địa chỉ, không là location key.
- **Source Evidence / Code Location:** [database/10_seed/seed_base/030_cinemas.sql:9](../../database/10_seed/seed_base/030_cinemas.sql#L9)
- **Business Intent:** Không dùng sample giả lập để chứng minh ngữ nghĩa địa chỉ thật hay bác bỏ mọi FD nghiệp vụ.
- **Status:** INFERRED

### RP-05 — RAPCHIEUPHIM

- **Rule ID:** RP-05
- **Table:** RAPCHIEUPHIM
- **Rule Description:** Định nghĩa DiaChi đầy đủ hay thành phần, DiaChi→ThanhPho có bắt buộc không, và có business key ngoài RapID?
- **Source Evidence / Code Location:** [database/08_procedures/admin/sp_Admin_Cinema_Update.sql:51](../../database/08_procedures/admin/sp_Admin_Cinema_Update.sql#L51); [docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md:507](../../docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md#L507)
- **Business Intent:** D-07; cần owner xác nhận ngữ nghĩa trường, không hỏi cách code đã nhập rõ.
- **Status:** UNDEFINED

### C-01 — Backend ↔ SP thanh toán

- **Rule ID:** C-01
- **Table:** Backend ↔ SP thanh toán
- **Rule Description:** Comment trong orderService nói payment SP không có user parameter, nhưng chữ ký SP và lời gọi thực tế đều có NguoiDungID.
- **Source Evidence / Code Location:** [backend/src/services/orderService.js:189](../../backend/src/services/orderService.js#L189); [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:9](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L9); [backend/src/services/orderService.js:167](../../backend/src/services/orderService.js#L167)
- **Business Intent:** Mâu thuẫn comment/implementation, không là bug binding hay lỗ hổng đã chứng minh. Không sửa comment trong task chỉ đọc.
- **Status:** CONFLICT

### Truy vết payment lifecycle: trả lời đủ tám câu hỏi nghiệp vụ

| Câu hỏi | Hành vi đã xác minh | Approval nghiệp vụ |
|---|---|---|
| SoTien là nghĩa vụ đơn hay amount attempt? | Cột đặt trên attempt; writer lấy net nghĩa vụ của đơn lúc tạo. Code không tách amount yêu cầu/amount thực nhận/phí. | D-01/D-02 chốt ngữ nghĩa chính thức. |
| Hai attempt khác amount có hợp lệ? | Không tìm được writer runtime tạo trạng thái đó qua flow hiện tại; đặc quyền seed/import/direct DML vẫn có thể ghi khác. | Chưa có approval cho amount độc lập. |
| Sau thất bại sửa đơn rồi retry? | Sửa ghế bị 50514 vì có attempt, dù failed; có thể tạo đơn khác, không sửa amount của đơn đó. | README mô tả Approved edit rules; không tự thay giới hạn. |
| Partial payment/trả góp/adjust amount? | Không có amount input, status/DTO/route không có nghiệp vụ này. | Không mở rộng scope. |
| Refund đổi SoTien? | Không có cash-refund writer; hủy suất bồi thường điểm, giữ payment và money snapshots. | Không coi enum refund là Use Case refund. |
| Snapshot độc lập có bắt buộc giữ? | History/DTOS đọc SoTien trực tiếp; nhu cầu audit độc lập là inferred. | D-02 cần quyết định. |
| Writer hợp lệ làm hai amount khác nhau? | Không trong canonical runtime writer map; chỉ công cụ DML đặc quyền ngoài API. | Không coi test/seed là business API. |
| FD bắt buộc mọi trạng thái nghiệp vụ chính thức? | Có trong closed set writer hiện hành và freeze rule. | Chưa chốt; không đánh đồng SOURCE_CONFIRMED với owner approval. |

### Payment A/B/C — so sánh bắt buộc

| Phương án | 3NF | Lịch sử | SQL/SP/view & doanh thu | Transaction/concurrency | Chi phí / phù hợp đồ án |
|---|---|---|---|---|---|
| A — giữ snapshot | Nếu FD được approve thì N-001 vẫn FAIL; intentional denormalization có thể chấp nhận. | Giữ amount từng attempt nguyên vẹn. | Không thay reader/report dùng tt.SoTien. | Giữ lock order và freeze từ attempt đầu. | Thấp; khuyến nghị cho baseline hiện tại. |
| B — lấy amount từ DONDATVE | Bỏ dependent SoTien khỏi THANHTOAN sau approval/implementation; không lưu net amount thành cột thường ở DONDATVE để tạo FD mới. | Chỉ an toàn nếu net snapshot bất biến/đúng với mọi attempt và order tồn tại suốt retention. | Sửa SP reader/payment/result, view/report doanh thu SUM(net theo attempt thành công), seed/manifest/DTO. | Reader không được race với edit amount; freeze/retention phải thành invariant được bảo vệ. | Vừa; tận dụng bảng hiện có trước khi cân nhắc thêm bảng. |
| C — amount độc lập theo attempt | FD có thể không còn đúng khi nghiệp vụ và writer thực sự cho phép; không tự PASS trước khi triển khai/audit. | Phải giữ snapshot; cần nghĩa amount, điều khoản phiên bản và xử lý lịch sử. | Partial/retry adjustment làm đổi payment/points/doanh thu/API/UI, không chỉ schema. | Cần consistency giữa obligation và mỗi attempt, chặn double charge và đồng bộ version. | Cao; không khuyến nghị mở rộng đồ án để đạt 3NF. |

Nếu B không chứng minh bảo toàn toàn lịch sử thì không loại SoTien. Đề xuất tách amount sang bảng mới trong audit gốc chưa được phê duyệt; BRC ưu tiên đánh giá cách tận dụng DONDATVE trước. Không chọn A/B/C thay owner.

### Writer coverage — toàn bộ đường ghi canonical đã tìm thấy

Scan dùng tên bảng và alias UPDATE/DELETE, sau đó đọc các writer/caller trọng tâm để xác nhận. Danh sách là các vị trí DML thực tế, không chỉ tên SP; một module có thể có nhiều branch.

| Bảng | DML | Module / vị trí | Tác động được đối chiếu |
|---|---|---|---|
| KHIEUNAI | UPDATE | [database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql:51](../../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql#L51) | Create ghi reporter/optional order; trigger chỉ đổi TrangThai theo history. |
| PHANCONG_RAP | INSERT | [database/08_procedures/admin/sp_Admin_Assignment_Create.sql:99](../../database/08_procedures/admin/sp_Admin_Assignment_Create.sql#L99) | Admin tạo/cập nhật mutable period dưới khóa toàn tập; không có writer DELETE/auto-expire. |
| RAPCHIEUPHIM | INSERT | [database/08_procedures/admin/sp_Admin_Cinema_Create.sql:45](../../database/08_procedures/admin/sp_Admin_Cinema_Create.sql#L45) | Admin tạo/sửa các trường độc lập và xóa có guard phụ thuộc. |
| RAPCHIEUPHIM | DELETE | [database/08_procedures/admin/sp_Admin_Cinema_Delete.sql:81](../../database/08_procedures/admin/sp_Admin_Cinema_Delete.sql#L81) | Admin tạo/sửa các trường độc lập và xóa có guard phụ thuộc. |
| RAPCHIEUPHIM | UPDATE | [database/08_procedures/admin/sp_Admin_Cinema_Update.sql:47](../../database/08_procedures/admin/sp_Admin_Cinema_Update.sql#L47) | Admin tạo/sửa các trường độc lập và xóa có guard phụ thuộc. |
| PHANCONG_RAP | UPDATE | [database/08_procedures/admin/usp_Admin_Assignment_Update.sql:110](../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql#L110) | Admin tạo/cập nhật mutable period dưới khóa toàn tập; không có writer DELETE/auto-expire. |
| BANGGIA | INSERT | [database/08_procedures/admin/usp_Admin_Pricing_Create.sql:59](../../database/08_procedures/admin/usp_Admin_Pricing_Create.sql#L59) | Admin/Manager tạo hoặc sửa rule cùng GiaID; trigger overlap tác động kiểm tra, không ghi lịch sử rule. |
| BANGGIA | UPDATE | [database/08_procedures/admin/usp_Admin_Pricing_Update.sql:85](../../database/08_procedures/admin/usp_Admin_Pricing_Update.sql#L85) | Admin/Manager tạo hoặc sửa rule cùng GiaID; trigger overlap tác động kiểm tra, không ghi lịch sử rule. |
| DONDATVE | INSERT | [database/08_procedures/booking/sp_Booking_Create.sql:508](../../database/08_procedures/booking/sp_Booking_Create.sql#L508) | Booking INSERT snapshots; UpdateSeats đổi TongTienVe trước attempt; các writer khác chỉ vòng đời/hold/lý do, không đổi owner/show/tổng. |
| KHIEUNAI | INSERT | [database/08_procedures/customer/sp_Complaint_Create.sql:60](../../database/08_procedures/customer/sp_Complaint_Create.sql#L60) | Create ghi reporter/optional order; trigger chỉ đổi TrangThai theo history. |
| DONDATVE | UPDATE | [database/08_procedures/customer/sp_Order_Cancel.sql:39](../../database/08_procedures/customer/sp_Order_Cancel.sql#L39) | Booking INSERT snapshots; UpdateSeats đổi TongTienVe trước attempt; các writer khác chỉ vòng đời/hold/lý do, không đổi owner/show/tổng. |
| DONDATVE | UPDATE | [database/08_procedures/customer/sp_Order_ExpirePending.sql:32](../../database/08_procedures/customer/sp_Order_ExpirePending.sql#L32) | Booking INSERT snapshots; UpdateSeats đổi TongTienVe trước attempt; các writer khác chỉ vòng đời/hold/lý do, không đổi owner/show/tổng. |
| BANGGIA | INSERT | [database/08_procedures/manager/sp_Manager_Pricing_Create.sql:52](../../database/08_procedures/manager/sp_Manager_Pricing_Create.sql#L52) | Admin/Manager tạo hoặc sửa rule cùng GiaID; trigger overlap tác động kiểm tra, không ghi lịch sử rule. |
| BANGGIA | UPDATE | [database/08_procedures/manager/sp_Manager_Pricing_Update.sql:87](../../database/08_procedures/manager/sp_Manager_Pricing_Update.sql#L87) | Admin/Manager tạo hoặc sửa rule cùng GiaID; trigger overlap tác động kiểm tra, không ghi lịch sử rule. |
| THANHTOAN | INSERT | [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:137](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L137) | INSERT full amount; UPDATE chỉ status/date/code/note, không đổi SoTien/DonDatVeID. |
| THANHTOAN | UPDATE | [database/08_procedures/payment/sp_Payment_UpdateResult.sql:159](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L159) | INSERT full amount; UPDATE chỉ status/date/code/note, không đổi SoTien/DonDatVeID. |
| DONDATVE | UPDATE | [database/08_procedures/payment/sp_Payment_UpdateResult.sql:168](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L168) | Booking INSERT snapshots; UpdateSeats đổi TongTienVe trước attempt; các writer khác chỉ vòng đời/hold/lý do, không đổi owner/show/tổng. |
| THANHTOAN | UPDATE | [database/08_procedures/payment/sp_Payment_UpdateResult.sql:186](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql#L186) | INSERT full amount; UPDATE chỉ status/date/code/note, không đổi SoTien/DonDatVeID. |
| DONDATVE | UPDATE | [database/08_procedures/staff_booking/sp_StaffBooking_Cancel.sql:105](../../database/08_procedures/staff_booking/sp_StaffBooking_Cancel.sql#L105) | Booking INSERT snapshots; UpdateSeats đổi TongTienVe trước attempt; các writer khác chỉ vòng đời/hold/lý do, không đổi owner/show/tổng. |
| DONDATVE | UPDATE | [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:277](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L277) | Booking INSERT snapshots; UpdateSeats đổi TongTienVe trước attempt; các writer khác chỉ vòng đời/hold/lý do, không đổi owner/show/tổng. |
| XULY_KHIEUNAI | INSERT | [database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql:59](../../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql#L59) | Append processing event; trigger đọc lịch sử và cập nhật current state. |
| XULY_KHIEUNAI | INSERT | [database/08_procedures/support/sp_Support_Complaint_UpdateStatus.sql:54](../../database/08_procedures/support/sp_Support_Complaint_UpdateStatus.sql#L54) | Append processing event; trigger đọc lịch sử và cập nhật current state. |
| DONDATVE | UPDATE | [database/08_procedures/system/sp_Showtime_CancelCascade.sql:319](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql#L319) | Booking INSERT snapshots; UpdateSeats đổi TongTienVe trước attempt; các writer khác chỉ vòng đời/hold/lý do, không đổi owner/show/tổng. |

### Caller, compatibility wrapper và thao tác đặc quyền

- Booking: [database/08_procedures/booking/sp_DatVe.sql:20](../../database/08_procedures/booking/sp_DatVe.sql#L20); [database/08_procedures/staff_booking/sp_StaffBooking_Create.sql:61](../../database/08_procedures/staff_booking/sp_StaffBooking_Create.sql#L61). Các wrapper cuối cùng dùng writer Booking_Create; không có đường tính tiền khác.
- Payment: [database/08_procedures/payment/sp_XuLyThanhToan.sql:18](../../database/08_procedures/payment/sp_XuLyThanhToan.sql#L18); [backend/src/services/orderService.js:187](../../backend/src/services/orderService.js#L187) và validators; payment UI mô phỏng tạo+submit, không nhận giá client.
- Hủy suất: Admin/Manager cancel gọi [database/08_procedures/system/sp_Showtime_CancelCascade.sql:8](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql#L8); hủy khách và hủy staff là hai writer khác. Staff cấm cancel nếu có payment đang xử lý/success/refunded; Customer cancel chỉ kiểm tra pending/owner. Đây là khác biệt endpoint hiện hữu, không làm đổi amount và không chứng minh FD mới.
- Complaints: [database/08_procedures/support/sp_XuLyKhieuNai.sql:17](../../database/08_procedures/support/sp_XuLyKhieuNai.sql#L17); [backend/src/controllers/feedbackController.js:42](../../backend/src/controllers/feedbackController.js#L42) → feedbackService → Complaint_Create; Support/Admin xử lý chỉ append history.
- Assignment compatibility: [database/08_procedures/system/sp_PhanCongQuanLyRap.sql:18](../../database/08_procedures/system/sp_PhanCongQuanLyRap.sql#L18); scope do [database/05_functions/fn_KiemTraQuanLyRapScope.sql:8](../../database/05_functions/fn_KiemTraQuanLyRapScope.sql#L8) quyết định.
- Pricing/cinema API: backend validators/services chuyển input typed; không có business SQL/ORM writer khác trong src. Frontend form là caller của các contract đó, không tự tính lại giá lịch sử.
- Công cụ đặc quyền: seed_base/demo_dynamic/test_fixture, migrations, SQL regression/concurrency fixtures và seed-v2 deployment có DML khác. Chúng có thể tạo/update dữ liệu ngoài invariants của API; được tách trong writer-map.json theo scope. Không chạy chúng, không dùng chúng như proof của một Use Case mới.
- Version context: [database/README.md:36](../../database/README.md#L36) và các migration r9/r10/r7/overlap/historical-metadata là lịch sử đã kiểm tra; baseline đang là build/module hiện tại, không chạy lại migration để suy nghiệp vụ. [database/run-all.sql:1](../../database/run-all.sql#L1) là installer, không là runtime writer của các Use Case.

## 3. Functional Dependency Clarification

| FD / giả thuyết | Kết quả đối với source hiện tại | Trạng thái nghiệp vụ chính thức | Chuẩn hóa / phạm vi |
|---|---|---|---|
| PK của mỗi bảng → R | SOURCE_CONFIRMED bởi PK; là CK toàn phần duy nhất chứng minh được cho năm bảng. | Constraint hiện hành phải giữ. | Không một mình chứng minh 3NF. |
| THANHTOAN: DonDatVeID→SoTien | SOURCE_CONFIRMED trong closed set writer: full amount + freeze kể cả failed retry. | UNDEFINED/PENDING D-01; README có tuyên bố approved edit policy nhưng chưa đủ để bổ sung chính sách amount toàn hệ thống. | FAIL trong implementation FD model; chưa chứng minh FAIL của approved business model. |
| KHIEUNAI: DonDatVeID→NguoiDungID | SOURCE_CONFIRMED chỉ trên linked subset có DonDatVeID khác NULL qua SP. | PENDING D-03. | Conditional FD; không coi mọi NULL là một order key. |
| BANGGIA: (rạp,ghế,ngày,format,start)→PhuThu/GiaID | Không được current constraints/writers bảo đảm; có thể trùng ở tập inactive. | UNDEFINED version key D-04. | Bác bỏ giả thuyết CK toàn bảng trong source; chưa bác bỏ mọi business rule ngoài source. |
| BANGGIA: dimensions→PhuThu | Không đúng nói chung khi rule khác period hoặc khác cấu hình/version. | D-04 xác định unit of rule. | Không gọi đổi giá theo thời gian là 3NF violation. |
| PHANCONG_RAP: (người,rạp,start)→end/status/ID | Source cho phép khác end/status; không là CK toàn bảng. | PENDING D-06. | Không áp partial FD nếu chưa có CK thật. |
| PHANCONG_RAP: (start,end)→TrangThai | Không được source áp đặt: flag nhập độc lập, scope dùng cả flag và ngày. | PENDING D-06 cho intent. | Date validity là temporal predicate; không là FD status. |
| RAPCHIEUPHIM: DiaChi→ThanhPho | Không được source áp đặt, UI và validator nhận độc lập; sample không chứng minh semantic FD. | UNDEFINED D-07. | UNKNOWN toàn nghiệp vụ; nếu DiaChi là key thật thì FD không gây lỗi 3NF. |

### Kiểm tra chéo các quan hệ

| Liên hệ | Loại ràng buộc | Điều đã chứng minh / giới hạn |
|---|---|---|
| DONDATVE↔THANHTOAN | FK + snapshot + transaction invariant | Order amount được chụp vào attempt và giữ; success khóa order, đổi state và cộng points. FD nội THANHTOAN được xét riêng, không chỉ vì JOIN ra được tổng đơn. |
| KHIEUNAI↔DONDATVE | FK + conditional ownership invariant | FK đơn đảm bảo tồn tại, SP đảm bảo cùng chủ. Không có declarative composite owner FK; DML đặc quyền có thể bypass. |
| BANGGIA↔SUATCHIEU | Pricing function + temporal condition | Không có FK trực tiếp rule→show. Rule chọn theo rạp từ phòng, ngày kinh doanh, loại ghế/format; SUM phụ thu. Đổi rule không cập nhật ticket snapshot. |
| PHANCONG_RAP↔NGUOIDUNG↔RAPCHIEUPHIM | FK + role/scope/date predicate | Create/update xác minh Manager; role/account active/date/status kiểm tra qua scope. Không suy NguoiDungID→RapID hoặc RapID→NguoiDungID. |
| KHIEUNAI↔XULY_KHIEUNAI | FK + append history/current-state sync | Trạng thái event mới nhất qua XuLyID; cache cha không là FD trong mọi tuple lịch sử. |

## 4. Business Rule Conflicts

**C-01 — stale backend comment (CONFIRMED CONFLICT):** [backend/src/services/orderService.js:189](../../backend/src/services/orderService.js#L189) nói không có user parameter, còn [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:9](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L9) và lời gọi thật có NguoiDungID. Test/backend binding đúng. Không có bằng chứng mismatch runtime; không sửa code trong BRC.

**Approval provenance gap:** README ghi “Approved edit rules” và chỉ tới docs/FINAL_SYSTEM_AUDIT.md, nhưng tài liệu đích không có trong checkout. Đây là UNDEFINED provenance, không được gán CONFLICT nếu chưa có quyết định owner khác nói ngược. Không hủy chính sách hiện hành.

**Khác biệt tiêu chuẩn kết luận audit:** audit gốc dùng “CONFIRMED business FD” theo closed set writer và chốt NOT_3NF. BRC phân tách approval của owner khỏi source, nên N-001 có hai lớp kết luận. Đây là làm rõ phạm vi bằng chứng, không phát hiện FD source cũ sai và không có approval mới để thay schema.

**Không xem là conflict:** enum refund vs không có refund writer; conditional overlap pricing vs rule Tất cả cộng dồn; flag Hiệu lực vs end-date đã qua; giá snapshot vs giá hiện tại. Các cặp này có ngữ nghĩa khác nhau, không tự mâu thuẫn.

## 5. Business Decision Matrix

Mọi recommendation dưới đây là **PROPOSED — NOT APPROVED**. Mọi thay đổi bảng/cột/key/constraint là **PROPOSED SCHEMA CHANGE — REQUIRES APPROVAL**. Không có lựa chọn nào được tự chuyển thành CONFIRMED.

| Decision ID | Table | Vấn đề | Phương án A | Phương án B | Khuyến nghị | Trạng thái |
|---|---|---|---|---|---|---|
| D-01 | THANHTOAN | Bất biến full amount sau attempt đầu tiên có là nghiệp vụ chính thức? | Mọi attempt thu cùng nghĩa vụ đã chốt; kể cả thất bại không sửa tổng đơn. | Cho amount thay đổi giữa retry/attempt khi có nghiệp vụ cụ thể; không tự thêm trả góp/partial payment. | A — giữ contract hiện hữu, ít rủi ro lịch sử. B vượt phạm vi hiện hành nếu đòi luồng mới. | PENDING_DECISION |
| D-02 | THANHTOAN | Nếu D-01 chọn A, giữ snapshot hay loại bản sao amount? | Giữ SoTien của attempt, ghi nhận ngoại lệ denormalization. | Bỏ SoTien vật lý, SP đọc expression từ tổng đơn bất biến; tận dụng DONDATVE, không thêm bảng. | A cho đồ án hiện tại; B chỉ nếu 3NF nghiêm ngặt là tiêu chí bắt buộc và lịch sử đã được chứng minh khôi phục đúng. | PENDING_DECISION |
| D-03 | KHIEUNAI | Chốt reporter Customer, general complaint và owner-only reference; giữ một bảng hay chuẩn hóa optional reference? | Xác nhận policy hiện tại và giữ reporter/optional order trong KHIEUNAI; ghi rõ conditional redundancy. | Giữ nguyên actor/owner-only/general policy, cân nhắc tách optional order reference sau review/approval schema, giữ reporter trong bảng gốc. | A cho baseline hiện tại; B chỉ nếu cần mô hình chuẩn hóa nghiêm ngặt. Không mở proxy creation hoặc đổi RBAC/Use Case. | PENDING_DECISION |
| D-04 | BANGGIA | Một GiaID là rule mutable hay version bất biến có key nghiệp vụ? | Rule cấu hình mutable theo GiaID; bản không active có thể trùng điều kiện/ngày; giá lịch sử nằm ở CHITIETVE. | Phiên bản giá bất biến, khóa điều kiện+ngày định danh version trên toàn vòng đời. | A phù hợp code hiện hành và snapshot giá; không đặt business key giả thuyết chỉ để đạt 3NF. | PENDING_DECISION |
| D-05 | BANGGIA / SUATCHIEU | Rule Tất cả và rule cụ thể cùng khớp: cộng hay chọn ưu tiên? | Cộng tất cả phụ thu khớp như SUM hiện tại, trừ rule inactive. | Chỉ chọn rule ưu tiên với thứ tự/tie-breaker được đặc tả. | A — đơn giản, phù hợp regression và giá hiện tại; B chỉ nếu tổng phụ thu hiện không đúng ý định nghiệp vụ. | PENDING_DECISION |
| D-06 | PHANCONG_RAP | Định danh kỳ, cardinality, overlap và trạng thái có ngày? | Khoảng phân công mutable theo PhanCongID; nhiều–nhiều, có thể overlap; tránh trùng toàn nội dung; flag và dates cùng quyết định scope. | Kỳ có key tối thiểu được định nghĩa và rule không overlap cho cùng manager–rạp, vẫn giữ nhiều–nhiều. | A; không thêm rule một manager một rạp. B cần policy rõ, không dùng temporal exclusion như CK. | PENDING_DECISION |
| D-07 | RAPCHIEUPHIM | DiaChi là thành phần hay địa chỉ chuẩn định danh thành phố? | DiaChi là văn bản/thành phần; ThanhPho độc lập. Cùng chuỗi địa chỉ ở các thành phố khác nhau là hợp lệ; RapID là identity. | DiaChi là location key chuẩn toàn phần với rule DiaChi→ThanhPho. | A theo UI hiện tại; không mặc định TenRap/địa chỉ unique. B cần chuẩn địa chỉ và quy tắc định danh cơ sở. | PENDING_DECISION |

### D-01 — phân tích quyết định

- **Hành vi hiện tại:** xem rule ledger của THANHTOAN; hai phương án chưa được duyệt.
- **3NF:** A xác nhận business FD DonDatVeID→SoTien, N-001 FAIL ở schema hiện tại. B chỉ bác bỏ FD sau khi quy tắc mới được xác định và writer thực sự hỗ trợ; source hôm nay vẫn giữ FD.
- **Lịch sử:** A bảo toàn toàn bộ attempts; B cần phiên bản điều khoản/số tiền và preflight các đơn cũ.
- **Phức tạp:** A: tài liệu/approval, không cần code. B: cao, chạm payment/editing/locks/points/API/tests.
- **Khuyến nghị / lý do:** A — giữ contract hiện hữu, ít rủi ro lịch sử. B vượt phạm vi hiện hành nếu đòi luồng mới.
- **Status:** PENDING_DECISION; không triển khai.

### D-02 — phân tích quyết định

- **Hành vi hiện tại:** xem rule ledger của THANHTOAN; hai phương án chưa được duyệt.
- **3NF:** A vẫn FAIL 3NF theo FD đã chốt. B loại FD gây lỗi khỏi THANHTOAN; chỉ PASS theo FD còn lại sau implementation/reaudit, không nâng verdict bằng approval trên giấy.
- **Lịch sử:** B chỉ lossless nếu mọi attempt amount bằng net snapshot của đơn và snapshots bất biến/không bị physical delete sau đó; nếu không, giữ amount.
- **Phức tạp:** A: thấp. B: vừa, schema/SP/view/report/seed/manifest/test và DTO compatibility.
- **Khuyến nghị / lý do:** A cho đồ án hiện tại; B chỉ nếu 3NF nghiêm ngặt là tiêu chí bắt buộc và lịch sử đã được chứng minh khôi phục đúng.
- **Status:** PENDING_DECISION; không triển khai.

### D-03 — phân tích quyết định

- **Hành vi hiện tại:** xem rule ledger của KHIEUNAI; hai phương án chưa được duyệt.
- **3NF:** A xác nhận FD có điều kiện trên linked subset, không biến NULL thành key và không tự chứng nhận 3NF toàn quan hệ. B chuyển ownership thành invariant xuyên quan hệ; phải kiểm tra lossless reconstruction và FD còn lại trước PASS.
- **Lịch sử:** Giữ reporter của mọi complaint; header/lịch sử xử lý giữ ID. B chuyển link đơn, không xóa reporter hoặc complaint chung.
- **Phức tạp:** A: tài liệu. B: vừa/cao, phải được duyệt thêm quan hệ/schema, SP/view/DTO/fixtures; không đổi Use Case/RBAC.
- **Khuyến nghị / lý do:** A cho baseline hiện tại; B chỉ nếu cần mô hình chuẩn hóa nghiêm ngặt. Không mở proxy creation hoặc đổi RBAC/Use Case.
- **Status:** PENDING_DECISION; không triển khai.

### D-04 — phân tích quyết định

- **Hành vi hiện tại:** xem rule ledger của BANGGIA; hai phương án chưa được duyệt.
- **3NF:** A bác bỏ CK phiên bản giả thuyết và chỉ để GiaID→R trong FD model được chốt; có thể kết luận 2NF/3NF theo mô hình đó. B cần CK tối thiểu và xét partial FD trước, UNIQUE mới không tự chứng minh 3NF.
- **Lịch sử:** A không tái dựng cấu hình giá cũ nhưng giữ giá mua; B phải lưu/di trú các phiên bản và xử lý duplicate inactive hiện hữu.
- **Phức tạp:** A: thấp, tài liệu. B: vừa/cao, điều chỉnh writer, index/key, UI và dữ liệu lịch sử.
- **Khuyến nghị / lý do:** A phù hợp code hiện hành và snapshot giá; không đặt business key giả thuyết chỉ để đạt 3NF.
- **Status:** PENDING_DECISION; không triển khai.

### D-05 — phân tích quyết định

- **Hành vi hiện tại:** xem rule ledger của BANGGIA / SUATCHIEU; hai phương án chưa được duyệt.
- **3NF:** Không tự thay 3NF/CK; đây là thuật toán pricing xuyên bảng. Nếu B thêm cột priority/loại rule thì cần audit FD của cột mới.
- **Lịch sử:** Giá vé cũ giữ nguyên với cả A/B; giá booking mới sẽ khác nếu đổi thuật toán.
- **Phức tạp:** A: xác nhận policy. B: vừa, fn_TinhGiaVe, staff seat edits, validators/UI và regression pricing/concurrency.
- **Khuyến nghị / lý do:** A — đơn giản, phù hợp regression và giá hiện tại; B chỉ nếu tổng phụ thu hiện không đúng ý định nghiệp vụ.
- **Status:** PENDING_DECISION; không triển khai.

### D-06 — phân tích quyết định

- **Hành vi hiện tại:** xem rule ledger của PHANCONG_RAP; hai phương án chưa được duyệt.
- **3NF:** A chốt attributes thuộc assignment identity và không áp FD dates→status; đủ nền để hoàn tất kiểm tra 2NF/3NF theo FD model. B phải xác định CK/nullable end rồi kiểm tra partial dependencies.
- **Lịch sử:** A giữ các rows hiện tại; B cần xử lý overlaps/duplicates, không tự gộp/xóa.
- **Phức tạp:** A: thấp. B: vừa/cao, locking/constraints/writers/scope/UI/tests; không đổi role matrix.
- **Khuyến nghị / lý do:** A; không thêm rule một manager một rạp. B cần policy rõ, không dùng temporal exclusion như CK.
- **Status:** PENDING_DECISION; không triển khai.

### D-07 — phân tích quyết định

- **Hành vi hiện tại:** xem rule ledger của RAPCHIEUPHIM; hai phương án chưa được duyệt.
- **3NF:** A bác bỏ FD giả thuyết khi có approval; B nếu DiaChi không superkey và ThanhPho non-prime thì 3NF FAIL, cần đề xuất decomposition. Nếu DiaChi là CK thật, FD không vi phạm.
- **Lịch sử:** Địa chỉ hiện có cần đối soát nếu B; không mất RapID, không sửa snapshot giao dịch.
- **Phức tạp:** A: xác nhận miền dữ liệu. B: cao hơn, chuẩn hóa dữ liệu/constraint và có thể schema; phải đánh giá trước.
- **Khuyến nghị / lý do:** A theo UI hiện tại; không mặc định TenRap/địa chỉ unique. B cần chuẩn địa chỉ và quy tắc định danh cơ sở.
- **Status:** PENDING_DECISION; không triển khai.

D-01 phương án độc lập amount tương ứng C trong phân tích payment A/B/C. Mở partial payment hoặc staff proxy complaint không khả thi trong baseline tác vụ hiện tại và là NOT_APPLICABLE cho triển khai ở đây; không đưa vào lựa chọn D-03 B. D-03 B giữ nguyên nghiệp vụ/actor, chỉ là phương án mô hình dữ liệu cần schema approval.

## 6. Recommended Business Model

**PROPOSED — NOT APPROVED.** Mô hình nhỏ nhất phù hợp implementation hiện có:

- Payment: attempt có số tiền chụp từ net nghĩa vụ đã chốt; không sửa order sau attempt đầu tiên, không partial payment/refund tiền thật. Giữ snapshot và công khai ngoại lệ 3NF nếu owner chấp nhận. Nếu mục tiêu 3NF tuyệt đối, đánh giá derive amount từ immutable DONDATVE trước khi nghĩ đến thêm bảng.
- Complaint: NguoiDungID là reporter Customer; optional order chỉ của chính reporter; complaint chung vẫn hợp lệ. Staff xử lý, không tạo thay Customer. Giữ reporter, giải thích conditional FD và optional reference riêng.
- Pricing: GiaID định danh rule cấu hình mutable; cộng mọi rule khớp, chỉ cấm overlap cùng bộ chiều active. Giá giao dịch lưu ở vé; không hứa cấu hình rule cũ là history version bất biến.
- Assignment: PhanCongID định danh khoảng phân công mutable, nhiều–nhiều, có thể overlap; tránh bản sao toàn nội dung; scope dùng role/account/flag/date. Không thêm rule một người một rạp.
- Cinema: RapID định danh rạp; DiaChi là văn bản/thành phần, ThanhPho là trường độc lập. Tên/địa chỉ không tự làm unique business key.

Mô hình đề xuất giữ baseline và ít thay đổi. Nó không phải lý do nâng PASS trước khi owner quyết định; payment FD vẫn gây ngoại lệ 3NF nếu chấp nhận freeze và giữ SoTien.

## 7. Dependency Impact

| Quyết định | Schema | SP / Function / Trigger / View | API / frontend | Regression / lịch sử |
|---|---|---|---|---|
| D-01 amount semantics | Có thể không đổi schema nếu giữ freeze; amount version độc lập cần đánh giá trường/version mới. | Booking_Create, StaffBooking_UpdateSeats/Cancel, Payment_CreateAttempt/UpdateResult, points, expire/cancel/cascade; các view doanh thu đọc amount. | orderValidator/orderService/orderRoutes, PaymentPage/PaymentHistory/BookingEditor; giữ DBMS-first, không nhận client money tùy tiện. | staff_booking/regression, payment compensation, backend orderService, source/runtime parity; giữ toàn bộ attempt cũ. |
| D-02 derive amount | Nếu B: bỏ SoTien vật lý cần approval; không thêm cột net tổng thường vào order. | Payment_CreateAttempt/UpdateResult, order/support/staff reader, vw_DoanhThuTheoRap, sp_Admin_Report_Revenue/manager revenue; SELECT aliases giữ SoTien response. | Typed contracts/DTO amount và FE history shape giữ được nếu SP vẫn trả cùng tên/type. | Preflight amount equality toàn lịch sử, persistence/retention, seed/manifest/verify, revenue/loyalty/concurrency. |
| D-03 complaint identity | A giữ schema. B tách optional reference phải phục vụ cả linked/general; không xóa reporter, chỉ sau approval. | Complaint_Create/Get/List, support AddProcessing/UpdateStatus/GetOrderReference, complaint views và trigger sync; invariant ownership giữ nguyên. | feedbackController/validator/service, requireCustomer/ownership, Complaints/SupportWorkspace; DTO giữ shape, không mở proxy. | feedbackService/processing_rollback/ownership tests; bảo toàn general complaints và history. |
| D-04 version key pricing | A giữ GiaID; B cần chốt key/nullability rồi mới UQ hoặc version schema. | Admin/Manager Pricing_Create/Update, overlap trigger, fn_TinhGiaVe; không sửa giá vé đã phát hành. | admin/manager validators/services, resource forms và lịch sử version nếu B. | pricing contract, pricing-overlap stress, seed/reference/media fixtures; đối soát inactive duplicates. |
| D-05 pricing priority | Nếu thêm priority/class sẽ cần schema approval; không làm ngoài scope. | fn_TinhGiaVe và các writer dùng giá, trigger overlap phải phù hợp rule mới. | Chỉ hiển thị rule/priority; tiền tiếp tục do DB tính. | expected prices cho rule Tất cả/weekday/weekend, staff add/retain ticket, booking tests. |
| D-06 assignment policy | Có thể thêm UQ/exclusion trigger chỉ sau khi xác định key/NULL/overlap policy. | Admin Assignment_Create/Update, fn_KiemTraQuanLyRapScope, Manager_ListAssignedCinemas, booking/auth scope. | admin assignment editor, managerCinemaStore/selection; không đổi role matrix. | Duplicate/null/overlap/reactivation/source ownership tests; không gộp hoặc xóa periods lịch sử tùy tiện. |
| D-07 address semantic | A chỉ đặc tả miền. B có thể cần key/lookup hoặc decomposition; phải review data migration. | Cinema_Create/Update/Delete, views và readers tra rạp/booking. | address/city form và validators; không đưa parser nghiệp vụ vào backend. | Cinema CRUD tests/data compatibility; lưu ý view hiện trả địa chỉ hiện tại, không địa chỉ snapshot. |

### Các reader/module bị ảnh hưởng trực tiếp theo runtime dependencies

Danh sách hỗ trợ khoanh vùng, không là cam kết đã sửa hay toàn bộ transitive dependency; cần truy vết caller nếu triển khai.

| Table | Module trực tiếp tham chiếu |
|---|---|
| THANHTOAN | CK_THANHTOAN_PhuongThuc, CK_THANHTOAN_SoTien, CK_THANHTOAN_TrangThai, sp_Admin_Dashboard, sp_Admin_Report_Revenue, sp_Manager_Dashboard, sp_Manager_Revenue, sp_Order_GetDetailByCustomer, sp_Payment_CreateAttempt, sp_Payment_UpdateResult, sp_Showtime_CancelCascade, sp_StaffBooking_Cancel, sp_StaffBooking_Detail, sp_StaffBooking_UpdateSeats, sp_Support_Complaint_GetOrderReference, THANHTOAN, vw_DoanhThuTheoRap, vw_LichSuDatVe |
| KHIEUNAI | CK_KHIEUNAI_MucDoUuTien, CK_KHIEUNAI_TrangThai, KHIEUNAI, sp_Admin_Dashboard, sp_Complaint_Create, sp_Complaint_GetByCustomer, sp_Complaint_ListByCustomer, sp_Support_Complaint_AddProcessing, sp_Support_Complaint_GetDetail, sp_Support_Complaint_GetOrderReference, sp_Support_Complaint_UpdateStatus, TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai, vw_DanhSachKhieuNai |
| BANGGIA | CK_BANGGIA_DinhDang, CK_BANGGIA_LoaiGhe, CK_BANGGIA_LoaiNgay, CK_BANGGIA_PhuThu, CK_BANGGIA_ThoiGian, CK_BANGGIA_TrangThai, fn_TinhGiaVe, sp_Admin_Cinema_Delete, sp_Manager_Pricing_Create, sp_Manager_Pricing_List, sp_Manager_Pricing_Update, TRG_BangGia_KiemTraChongLan, usp_Admin_Pricing_Create, usp_Admin_Pricing_List, usp_Admin_Pricing_Update |
| PHANCONG_RAP | CK_PHANCONG_RAP_ThoiGian, CK_PHANCONG_RAP_TrangThai, fn_KiemTraQuanLyRapScope, sp_Admin_Assignment_Create, sp_Admin_Assignment_List, sp_Admin_Cinema_Delete, sp_Auth_Login, sp_Manager_ListAssignedCinemas, sp_StaffBooking_Authorize, usp_Admin_Assignment_Update |
| RAPCHIEUPHIM | CK_RAPCHIEUPHIM_TrangThai, sp_Admin_Assignment_Create, sp_Admin_Assignment_List, sp_Admin_Cinema_Create, sp_Admin_Cinema_Delete, sp_Admin_Cinema_Update, sp_Admin_Dashboard, sp_Admin_Report_Revenue, sp_Auth_Login, sp_Booking_Create, sp_Cinema_GetImages, sp_Cinema_List, sp_Manager_Dashboard, sp_Manager_ListAssignedCinemas, sp_Manager_Room_List, sp_Manager_Showtime_List, sp_StaffBooking_LockShow, sp_StaffBooking_Options, TRG_BangGia_KiemTraChongLan, usp_Admin_Assignment_Update, usp_Admin_Cinema_List, usp_Admin_CinemaImage_Create, usp_Admin_CinemaImage_List, usp_Admin_Pricing_Create, usp_Admin_Pricing_List, usp_Admin_Room_Create, usp_Admin_Room_List, usp_Admin_Seat_List, usp_Admin_Showtime_List, vw_ChiTietDonDatVe, vw_DoanhThuTheoRap, vw_LichChieuChiTiet, vw_LichSuDatVe |

## 8. Final Business Clarification Status

Đã phân tích **5 bảng**, lập **35 rule records**: 25 SOURCE_CONFIRMED, 2 BUSINESS_APPROVED (giới hạn task từ owner), 2 INFERRED, 5 UNDEFINED, 1 CONFLICT. Có **7 quyết định PENDING_DECISION**. Không có approval tự tạo và không có migration/application/database change.

Tính đầy đủ implementation đã tăng nhờ writer graph, API/UI và regression source. Tính chính thức của các semantic FD vẫn cần quyết định owner. Không yêu cầu owner xác nhận lại cách code khóa/sum/nhận input đã rõ; chỉ yêu cầu chốt nghĩa amount, policy giữ bản sao, reporter/order, unit của pricing/assignment và địa chỉ.

### Câu hỏi theo ưu tiên

1. **D-01:** mọi retry của cùng đơn phải giữ cùng amount sau attempt đầu tiên, hay có nghiệp vụ hợp lệ cho amount thay đổi? Khuyến nghị giữ bất biến hiện tại; nếu chọn khác cần chỉ rõ trường hợp/điều khoản và phạm vi thay đổi.
2. **D-02:** nếu giữ bất biến đó, ưu tiên giữ snapshot và chấp nhận ngoại lệ 3NF, hay 3NF nghiêm ngặt và derive amount từ immutable order sau review? Khuyến nghị giữ snapshot cho baseline hiện tại.
3. **D-03:** xác nhận reporter Customer, general complaint hợp lệ, linked complaint chỉ đơn của mình; ưu tiên một bảng với conditional redundancy hay tách optional reference cần schema approval? Khuyến nghị một bảng hiện tại, giữ reporter và không mở proxy/RBAC.
4. **D-04/D-05:** rule GiaID được sửa như hiện tại và cộng mọi phụ thu khớp, hay cần version bất biến và/hoặc chọn rule ưu tiên? Khuyến nghị rule mutable + SUM; hai quyết định độc lập, không gộp approval của một cái vào cái kia.
5. **D-06:** chấp nhận phân công nhiều–nhiều, overlap, flag+dates như hiện tại, hay cần key kỳ và cấm overlap cho cùng cặp? Khuyến nghị giữ policy hiện tại; không đặt một manager một rạp.
6. **D-07:** DiaChi là thành phần/văn bản và city độc lập, hay là địa chỉ chuẩn luôn xác định city? Khuyến nghị miền thành phần theo form hiện tại; nếu B phải chỉ rõ normalization và khóa địa điểm.

**Bằng chứng local:** `.audit-output/business-rule-clarification/` chứa preservation.json, writer-map.json, runtime-metadata.json, runtime-comparison.json và summary.json. Không xuất mật khẩu hoặc row dữ liệu cá nhân. Các số đếm runtime là quan sát, không là proof FD.
