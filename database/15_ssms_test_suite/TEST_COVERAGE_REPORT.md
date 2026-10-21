# SSMS Test Suite — Coverage và kết quả Main

**Target:** `DoanTuanIT / CinemaBookingDB`  
**Evidence baseline:** `database/14_audit/MAIN_DATABASE_AUDIT_REPORT.md`, generated 2026-10-21 13:29 UTC.

**Kết luận database theo audit Main:** `DATABASE READY FOR SSMS DEMO`. Suite có lời gọi SSMS trực tiếp cho 28/147 Stored Procedure; 119 object còn lại chưa có câu lệnh SSMS độc lập. Trong 78 luồng ghi thành công, 15 có positive SSMS CRUD path; 63 success paths được thực thi qua Node `mssql`. Riêng `sp_Booking_Create` có file SSMS kiểm tra rollback khi lỗi, còn success path nằm trong runner. Đây là giới hạn của gói replay, không phải test runtime Main chưa chạy.

## Tổng hợp

| Loại object | Inventory Main | Runtime calls/assertions đã có | Verdict theo evidence Main | SSMS replay trong suite |
|---|---:|---:|---|---|
| Stored Procedure | 147 | 147 runtime calls; 78/78 persistent writers chạy thành công | PASS | 28 lời gọi trực tiếp; 15/78 positive writer path trong SSMS |
| Function | 21 | Nằm trong 45 assertion cho function/view | PASS | `02_FUNCTIONS_VIEWS_INDEXES/01_functions_views_indexes.sql` |
| View | 6 | Nằm trong 45 assertion cho function/view | PASS | `02_FUNCTIONS_VIEWS_INDEXES/01_functions_views_indexes.sql` |
| Trigger | 9 | 21 assertion DML: hợp lệ, từ chối, nhiều dòng | PASS | `03_TRIGGERS/01_trigger_dml.sql` |
| PK/UQ/FK/CHECK | 142 | 79 key/FK + 65 CHECK assertion | PASS | Hai file trong `04_CONSTRAINTS/` |
| DEFAULT constraint | 42 | Inventory và định nghĩa metadata; không có DML assertion độc lập cho từng default | PASS metadata / NOT TESTED DML riêng lẻ | `04_CONSTRAINTS/03_default_constraint_catalog.sql` |
| Index | 71 | Metadata, key/include/filter, usage, duplicate/missing candidates, IO/TIME và actual plans | PASS | `02_FUNCTIONS_VIEWS_INDEXES/01_functions_views_indexes.sql` |
| Booking atomicity | 1 luồng đại diện | Lỗi 50410; promo/order/ticket/food rollback oracle | PASS | `05_TRANSACTIONS/01_booking_atomicity.sql` |
| Showtime concurrency | 1 race hai session | Session A/B/C/cleanup, 6 assertion | PASS | 5 file trong `06_CONCURRENCY/` |
| Database integrity | Main | DBCC CHECKDB + CHECKCONSTRAINTS, row/identity snapshot | PASS | `10_FINAL_VERIFICATION.sql` |

`OBJECT_TEST_MAP.csv` ánh xạ từng object. Đọc đồng thời `SSMSReplayFile`, `RuntimeRunner`, `EvidenceFile`, `RuntimeVerdict`, `ExecutionMode` và `CoverageNote`: audit đã chạy thật trên Main, nhưng không phải mọi object đều có file SSMS độc lập.

## Kết quả và giới hạn

- Audit Main đã hoàn thành trước khi đóng gói suite; các test PASS không chạy lại chỉ để tạo thêm log.
- Trong lượt đóng gói, `00_PRECHECK.sql`, `03_default_constraint_catalog.sql` và `10_FINAL_VERIFICATION.sql` đã thực thi trên Main: inventory PASS, 42 default metadata PASS, DBCC CHECKCONSTRAINTS 0 violation, DBCC CHECKDB không trả error row, không còn fixture concurrency/open transaction. Output: `evidence/precheck-runtime.json`, `evidence/defaults-runtime.json`, `evidence/final-runtime.json`.
- Hai demo read-only trong suite cũng đã được chạy trực tiếp trên Main: stored procedure 14/14 PASS; function/view/index 45/45 PASS và trả ba actual plan. Output: `evidence/ssms-procedure-core-runtime.json`, `evidence/ssms-functions-views-indexes-runtime.json`.
- Lần đầu thu thập metadata index, câu truy vấn kiểm kê lỗi SQL Server 8711 do hai `STRING_AGG` sắp xếp khác thứ tự trong cùng scope. Chuyển phép gom cột vào hai `OUTER APPLY` riêng và chạy lại thành công 71/71; không có DML hay thay đổi database. Chi tiết nằm trong `evidence/index-metadata-runtime.json`.
- Bảy trong mười hai SQL demo được copy byte-for-byte từ `database/14_audit/`; năm file được bổ sung `USE [CinemaBookingDB]`/`GO` và/hoặc target guard rõ server. Hash: `evidence/sql-copy-hashes.json`.
- 147/147 Stored Procedure có runtime outcome. 78 luồng ghi có success assertion. 28 SP có lời gọi SSMS; 15 success writer path được replay trực tiếp. Trong 63 success path còn lại chạy bằng Node `mssql`, một là success path của `sp_Booking_Create`; file SSMS cho SP này chỉ kiểm tra lỗi/rollback.
- Đặt trùng ghế và quota khuyến mãi đã có evidence hai SQL session riêng trong `evidence/main-concurrency-drill.json`. Bộ SQL SSMS đóng gói ở đây cung cấp session script đầy đủ cho race trùng lịch suất chiếu; không tuyên bố có bộ SSMS riêng cho ghế/khuyến mãi.
- HTTP booking/payment mô phỏng: 15/15 assertion PASS. Worker định kỳ và payment provider thật không chạy; `FULL SYSTEM E2E VERIFIED` không được tuyên bố.
- 42 DEFAULT constraint được kiểm kê đủ trên Main, nhưng chưa có positive DML assertion độc lập từng object. Không đánh dấu DML của 42 default là PASS.

## Trạng thái database sau audit

Evidence Main ghi nhận database online, không có transaction mở, CHECKDB/CHECKCONSTRAINTS sạch, fixture lịch chiếu đã cleanup và row fingerprints không đổi (ngoại trừ IDENTITY gaps do rollback). `10_FINAL_VERIFICATION.sql` là kiểm tra SSMS read-only để xác nhận trạng thái khi demo lại.
