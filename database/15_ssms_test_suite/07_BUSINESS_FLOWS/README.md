# Kiểm thử nghiệp vụ tổng hợp

Các luồng đã chạy trên Main và có expected/actual assertion riêng. Dùng đường dẫn runner nếu cần chạy lại cả fixture và transaction; file `.json` là kết quả cuối của từng luồng.

| Luồng | Runner | Evidence | Kết quả |
|---|---|---|---|
| Booking thành công / tính tiền | `database/14_audit/run_main_transactional_business_smoke.mjs` | `../evidence/main-transactional-business-smoke.json` | PASS; order, vé, đồ ăn, tổng tiền và aliases được đối chiếu; fixture được rollback/cleanup. |
| Booking lỗi giữa chừng / atomicity | `../05_TRANSACTIONS/01_booking_atomicity.sql` | `../evidence/main-booking-atomicity-ssms-demo.json` | PASS; lỗi `50410` mong đợi, không có partial commit. |
| Thanh toán giả lập, callback, điểm và idempotency | `database/14_audit/main_backend_api_payment_drill.mjs` | `../evidence/main-backend-api-payment-drill.json` | 15/15 PASS; chạy `createApp()` trực tiếp, không bật expiry worker; transaction rollback. |
| Khiếu nại, chat, phân công và escalation | `database/14_audit/run_main_complaint_workflow_smoke.mjs` | `../evidence/main-complaint-workflow-smoke.json` | 11/11 procedure path thành công, trạng thái/side effect được đối chiếu. |
| CRUD rạp, phòng, ghế, giá và lịch chiếu | `database/14_audit/run_main_facility_schedule_success_smoke.mjs` | `../evidence/main-facility-schedule-success-smoke.json` | 32/32 success path PASS, transaction fixture được hoàn tác/dọn. |
| Race trùng ghế và quota khuyến mãi | `database/14_audit/main_concurrency_drill.mjs` | `../evidence/main-concurrency-drill.json` | PASS bằng hai SQL connection độc lập; xem từng assertion trong evidence. |
| Race lịch chiếu trực tiếp SSMS | Các file trong `../06_CONCURRENCY/` | `../evidence/main-ssms-schedule-concurrency-demo.json` | 6/6 PASS; hướng dẫn chạy nhiều cửa sổ nằm trong README của nhóm concurrency. |

Runner Node dùng kết nối SQL thật và đã xác minh target, nhưng không phải file SSMS. Suite chỉ cung cấp file SSMS trực tiếp cho các luồng được ghi rõ trong bảng ánh xạ. Không bật worker nền khi chạy payment drill.
